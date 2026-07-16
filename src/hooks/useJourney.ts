import { useState, useEffect, useMemo } from "react";
import { JourneyProgress, StepStatus, UserStepProgress, JourneyStep, SubStepConfig } from "@/types/journey";
import { getJourneyStagesAction, getJourneyProgressAction, updateJourneySubStepAction } from "@/actions/journey";
import { getMemberQuotasAction } from "@/actions/quotas";
import { fetchUserPermissionsStatus } from "@/actions/auth-permissions";
import { MemberQuotaWallet } from "@/types/entitlements";
import { normalizeString } from "@/lib/utils";
import { resolveStageAccess, conclusoesFromProgress } from "@/lib/access/journey-adapter";
import { isStageEntitled } from "@/lib/access/stage-entitlement";


export interface StageTelemetry {
  status: string;
  percentage: number;
  hasAccess: boolean;
  isNext: boolean;
  isSequenceLocked: boolean;
  substepsLabel: string;
}

/**
 * BPlen HUB — useJourney 🧬🛡️
 * Logic hook for member journey progress and access control.
 * Fully persistent: fetches/saves stages and progress from Firestore.
 */
export function useJourney(uid: string) {
  const [stages, setStages] = useState<JourneyStep[]>([]);
  const [progress, setProgress] = useState<JourneyProgress | null>(null);
  const [quotas, setQuotas] = useState<MemberQuotaWallet | null>(null);
  const [services, setServices] = useState<Record<string, boolean>>({});
  const [dispensaPreRequisito, setDispensaPreRequisito] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const mergedStages = useMemo(() => {
    if (!progress) return stages;
    return stages.map(stage => {
      const sProgress = progress.steps[stage.id];
      const dynamicSubsteps = sProgress?.dynamicSubSteps || [];
      if (dynamicSubsteps.length === 0) return stage;
      
      const mergedSubsteps: SubStepConfig[] = [];
      stage.substeps.forEach(sub => {
        mergedSubsteps.push(sub);
        const children = dynamicSubsteps.filter((ds) => ds.parentId === sub.id);
        mergedSubsteps.push(...children);
      });
      return {
        ...stage,
        substeps: mergedSubsteps
      };
    });
  }, [stages, progress]);

  const init = async () => {
    setLoading(true);
    try {
      console.log("🧬 [useJourney] Sincronizando telemetria dinâmica via Server Actions...");
      
      // 1. Fetch Stages from Firestore (via Action)
      const dynamicStages = await getJourneyStagesAction();
      setStages(dynamicStages);

      // 2. Fetch Real Quotas for granular access
      const userQuotas = await getMemberQuotasAction(uid);
      setQuotas(userQuotas);

      // 2.5 Fetch Real Services (User_Permissions/access)
      const userPermissions = await fetchUserPermissionsStatus(uid);
      if (userPermissions?.services) {
        setServices(userPermissions.services as Record<string, boolean>);
      }
      setDispensaPreRequisito(userPermissions?.dispensaPreRequisito ?? []);

      // 3. Fetch Real Progress from Firestore
      const dbProgress = await getJourneyProgressAction(uid);
      
      if (dbProgress) {
        const normalizedSteps: Record<string, UserStepProgress> = {};
        for (const [key, val] of Object.entries(dbProgress.steps)) {
          const matchedStage = dynamicStages.find(stage => 
            normalizeString(stage.id) === normalizeString(key)
          );
          const finalKey = matchedStage ? matchedStage.id : key;
          normalizedSteps[finalKey] = {
            ...val,
            stepId: finalKey
          };
        }
        setProgress({
          ...dbProgress,
          steps: normalizedSteps
        });
      } else {
        // Fallback: Initialize local layout for first-time use
        const initialSteps: Record<string, UserStepProgress> = {};
        dynamicStages.forEach((stage, idx) => {
          initialSteps[stage.id] = {
            stepId: stage.id,
            status: idx === 0 ? "current" : "locked",
            completedSubSteps: [],
            currentSubStepId: stage.substeps[0]?.id
          };
        });

        setProgress({
          matricula: "PENDING", 
          lastActiveStepId: dynamicStages[0]?.id || "onboarding",
          steps: initialSteps,
          overallProgress: 0
        });
      }
    } catch (error) {
      console.error("❌ [useJourney] Falha crítica na sincronização:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (uid && uid !== "guest") init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  /**
   * Atualiza o progresso real no Firebase e atualiza o estado local 🛰️
   */
  const updateSubStep = async (stepId: string, subStepId: string, completed: boolean) => {
    if (!progress || uid === "guest") return;

    try {
      const result = await updateJourneySubStepAction(uid, stepId, subStepId, completed);
      if (result.success && result.progress) {
        const normalizedSteps: Record<string, UserStepProgress> = {};
        for (const [key, val] of Object.entries(result.progress.steps)) {
          const matchedStage = mergedStages.find(stage => 
            normalizeString(stage.id) === normalizeString(key)
          );
          const finalKey = matchedStage ? matchedStage.id : key;
          normalizedSteps[finalKey] = {
            ...val,
            stepId: finalKey
          };
        }
        setProgress({
          ...result.progress,
          steps: normalizedSteps
        });
      }
    } catch (error) {
      console.error("❌ [useJourney] Erro ao salvar progresso:", error);
    }
  };

  /**
   * Etapas da jornada + se o membro possui cada uma. Alimenta o modo
   * `apos_contratadas` do motor (Fase C), que depende do conjunto CONTRATADO
   * pelo membro — nao de uma lista fixa. Memoizado: seria O(n^2) recalcular
   * dentro de `getStageTelemetry`, que roda por etapa.
   */
  const etapasDoMembro = useMemo(
    () => mergedStages.map(stage => ({
      serviceCode: stage.serviceCode,
      preRequisitos: stage.preRequisitos,
      entitled: isStageEntitled(stage, quotas, services),
    })),
    [mergedStages, quotas, services]
  );

  /**
   * Retorna os dados analíticos de uma etapa (Telemetria Real)
   */
  const getStageTelemetry = (stepId: string): StageTelemetry => {
    const stage = mergedStages.find(s => s.id === stepId);
    const stepProgress = progress?.steps[stepId];
    
    // Cálculo de % Real (Rigoroso: apenas conta o que existe na definição atual da etapa) 🛡️
    const totalSubsteps = stage?.substeps.length || 0;
    const currentSubstepIds = stage?.substeps.map(ss => ss.id) || [];
    const validCompletedSubsteps = stepProgress?.completedSubSteps.filter(id => currentSubstepIds.includes(id)) || [];
    const completedCount = validCompletedSubsteps.length;
    const percentage = totalSubsteps > 0 ? Math.round((completedCount / totalSubsteps) * 100) : 0;

    // Entitlement da etapa ("possui?") — calculo legado extraido para
    // `isStageEntitled`, porque a Fase C precisa dele para TODAS as etapas
    // (conjunto de espera), nao so para a corrente. Comportamento preservado.
    const finalHasAccessLogic = stage ? isStageEntitled(stage, quotas, services) : false;

    // Identificar se e' o "Proximo Passo" logico (Baseado em ID sequencial ou LastActive)
    const currentStepIndex = mergedStages.findIndex(s => s.id === progress?.lastActiveStepId);
    const thisStepIndex = mergedStages.findIndex(s => s.id === stepId);
    const isNext = thisStepIndex === currentStepIndex + 1;

    const isOffboarding = stepId.toLowerCase() === 'offboarding';

    // 🧬 MOTOR DE ACESSO (Fase B2 — ACCESS-MODEL-DESIGN.md secao 4)
    // Quando a etapa tem atributos sincronizados (serviceCode + preRequisitos, via
    // aba Atributos do portfolio), a decisao de acesso/trava e' do motor
    // resolverAcesso — pre-requisitos por DADO (todos/qualquer/nenhum + dispensa
    // do admin), substituindo a trava linear hardcoded e suas excecoes.
    let motorHasAccess = finalHasAccessLogic;
    let isSequenceLocked = false;

    const motorDecision = stage ? resolveStageAccess(stage, {
      selo: services?.member_area_access === true,
      legacyEntitled: finalHasAccessLogic,
      conclusoes: conclusoesFromProgress(mergedStages, progress),
      dispensaPreRequisito,
      etapasDoMembro,
    }) : null;

    if (motorDecision) {
      motorHasAccess = motorDecision.hasAccess;
      isSequenceLocked = motorDecision.isSequenceLocked;
    } else if (thisStepIndex > 0) {
       // 🔒 FALLBACK LEGADO (etapa sem atributos sincronizados): trava linear —
       // uma etapa so pode ser acessada se a anterior estiver 'completed', com
       // as excecoes estrategicas de onboarding/mentocoach/offboarding.
       const isOnboarding = stepId.toLowerCase() === 'onboarding';
       const isMentocoach = stepId.toLowerCase().includes('mentocoach');
       const isException = isOnboarding || isMentocoach;

       if (isOffboarding) {
          const devProgress = progress?.steps['desenvolvimento-de-carreira']?.status === "completed";
          const mentocoachProgress = progress?.steps['coaching-e-mentoria']?.status === "completed" || progress?.steps['mentocoach']?.status === "completed";
          isSequenceLocked = !(devProgress || mentocoachProgress);
       } else if (!isException) {
          const prevStageId = mergedStages[thisStepIndex - 1].id;
          const prevStepProgress = progress?.steps[prevStageId];
          isSequenceLocked = prevStepProgress?.status !== "completed";
       }
    }

    let resolvedStatus = stepProgress?.status || "locked";

    // 🚀 Governança Dinâmica Central: Se o DB diz "locked" mas a telemetria libera, destravamos visualmente aqui
    if (resolvedStatus === "locked" && motorHasAccess && !isSequenceLocked) {
       resolvedStatus = "current";
    }

    return {
      status: resolvedStatus,
      percentage,
      hasAccess: motorHasAccess,
      isNext,
      isSequenceLocked, // 🧬 Flag de governança metodológica (motor ou fallback legado)
      substepsLabel: `${completedCount}/${totalSubsteps}`
    };
  };

  const getStepStatus = (stepId: string): StepStatus => {
    // Agora delega completamente para a inteligência central do getStageTelemetry
    return getStageTelemetry(stepId).status as StepStatus;
  };

  return {
    stages: mergedStages,
    progress,
    loading,
    quotas,
    updateSubStep,
    getStepStatus,
    getStageTelemetry,
    refreshJourney: init // Permite forçar recarregamento se necessário
  };
}

