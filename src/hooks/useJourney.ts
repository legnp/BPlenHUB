import { useState, useEffect, useMemo } from "react";
import { JourneyProgress, StepStatus, UserStepProgress, JourneyStep, SubStepConfig } from "@/types/journey";
import { getJourneyStagesAction, getJourneyProgressAction, updateJourneySubStepAction } from "@/actions/journey";
import { getMemberQuotasAction } from "@/actions/quotas";
import { fetchUserPermissionsStatus } from "@/actions/auth-permissions";
import { MemberQuotaWallet } from "@/types/entitlements";
import { normalizeString } from "@/lib/utils";


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

    // Checagem de Acesso Granular Inteligente (Suporte a Pacotes de Eventos)
    const stepIdUpper = stepId.toUpperCase();
    const stepIdLower = stepId.toLowerCase();
    let hasQuota = false;

    if (quotas && quotas.quotas) {
       const stepIdNormalized = normalizeString(stepId);
       for (const [quotaKey, quotaData] of Object.entries(quotas.quotas)) {
          if (quotaData.total <= 0) continue;
          
          const quotaKeyNormalized = normalizeString(quotaKey);
          
          // Match direto ou se o EventType contem a fase ou vice-versa, com suporte a normalizacao
          if (quotaKeyNormalized === stepIdNormalized || quotaKeyNormalized.includes(stepIdNormalized) || stepIdNormalized.includes(quotaKeyNormalized)) {
             hasQuota = true;
             break;
          }

          // Fallback rigoroso direto (ignora apenas hífens e case) 🛡️
          if (quotaKey.toLowerCase().replace(/[-_]/g, "") === stepIdLower.replace(/[-_]/g, "")) {
             hasQuota = true;
             break;
          }
          
          const keyUpper = quotaKey.toUpperCase();
          // Fallbacks metodologicos (ex: Coaching-e-mentoria desbloqueado por sessao de coaching)
          if (stepIdUpper === 'COACHING-E-MENTORIA' && (keyUpper.includes('COACHING') || keyUpper.includes('MENTORIA'))) {
             hasQuota = true;
             break;
          }
       }
    }

    if (!hasQuota) {
       // Fallback original de segurança
       const quotaLower = quotas?.quotas[stepIdLower];
       const quotaUpper = quotas?.quotas[stepIdUpper];
       hasQuota = (quotaLower && quotaLower.total > 0) || (quotaUpper && quotaUpper.total > 0) || false;
    }
    
    // 🛡️ Checagem Mestra de Serviços (User_Permissions/access)
    // Se o serviço estiver explicitamente listado nos `services` (do toggle do admin), 
    // ele SOBRESCREVE a leitura de quotas.
    const serviceKey = stepIdLower;
    let finalHasAccess = hasQuota;
    
    // 🚀 Verificação Especial do Novo Limite MentoCoach
    if (stepIdLower.includes('mentocoach') && quotas && (quotas.mentoCoachSessionsLimit || 0) > 0) {
       finalHasAccess = true;
    }
    
    if (services !== undefined && services !== null) {
      if (services[serviceKey] === false) {
         finalHasAccess = false; // Administrador revogou ou usuário não comprou (explicitamente false)
      } else if (services[serviceKey] === true) {
         finalHasAccess = true; // Liberado via acesso contínuo (ex: pacote)
      }
    }
    
    // Checagem Global: O usuário adquiriu QUALQUER serviço? 💳
    const hasAnyQuota = quotas ? Object.values(quotas.quotas).some(q => q.total > 0) : false;

    // Identificar se é o "Próximo Passo" lógico (Baseado em ID sequencial ou LastActive)
    const currentStepIndex = mergedStages.findIndex(s => s.id === progress?.lastActiveStepId);
    const thisStepIndex = mergedStages.findIndex(s => s.id === stepId);
    const isNext = thisStepIndex === currentStepIndex + 1;

    // 🔒 Trava de Sequência BPlen (Metodologia Linear)
    // Uma etapa só pode ser ACESSADA se a anterior estiver 'completed'.
    let isSequenceLocked = false;
    const isOffboarding = stepId.toLowerCase() === 'offboarding';
    
    if (thisStepIndex > 0) {
       // EXCEÇÃO ESTRATÉGICA: Onboarding e Mentocoach podem ser acessados sem concluir a etapa anterior 🧬
       const isOnboarding = stepId.toLowerCase() === 'onboarding';
       const isMentocoach = stepId.toLowerCase().includes('mentocoach');
       const isException = isOnboarding || isMentocoach;
       
       if (isOffboarding) {
          // Offboarding: liberado na conclusão total de Gestão de Carreira ou Mentocoach
          const devProgress = progress?.steps['desenvolvimento-de-carreira']?.status === "completed";
          const mentocoachProgress = progress?.steps['coaching-e-mentoria']?.status === "completed" || progress?.steps['mentocoach']?.status === "completed";
          isSequenceLocked = !(devProgress || mentocoachProgress);
       } else if (!isException) {
          const prevStageId = mergedStages[thisStepIndex - 1].id;
          const prevStepProgress = progress?.steps[prevStageId];
          isSequenceLocked = prevStepProgress?.status !== "completed";
       }
    }

    const finalHasAccessLogic = finalHasAccess || stage?.order === 0 || ((stepId === 'onboarding' || isOffboarding) && hasAnyQuota);

    let resolvedStatus = stepProgress?.status || "locked";
    
    // 🚀 Governança Dinâmica Central: Se o DB diz "locked" mas a telemetria libera, destravamos visualmente aqui
    if (resolvedStatus === "locked" && finalHasAccessLogic && !isSequenceLocked) {
       resolvedStatus = "current";
    }

    return {
      status: resolvedStatus,
      percentage,
      hasAccess: finalHasAccessLogic, // Step 0 sempre livre, Onboarding/Offboarding livres se tiver algum serviço
      isNext,
      isSequenceLocked, // 🧬 Nova flag de governança metodológica
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

