import { useState, useEffect } from "react";
import { JourneyProgress, StepStatus, UserStepProgress, JourneyStep } from "@/types/journey";
import { getJourneyStagesAction, getJourneyProgressAction, updateJourneySubStepAction } from "@/actions/journey";
import { getMemberQuotasAction } from "@/actions/quotas";
import { MemberQuotaWallet } from "@/types/entitlements";

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
  const [loading, setLoading] = useState(true);

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

      // 3. Fetch Real Progress from Firestore
      const dbProgress = await getJourneyProgressAction(uid);
      
      if (dbProgress) {
        setProgress(dbProgress);
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
  }, [uid]);

  /**
   * Atualiza o progresso real no Firebase e atualiza o estado local 🛰️
   */
  const updateSubStep = async (stepId: string, subStepId: string, completed: boolean) => {
    if (!progress || uid === "guest") return;

    try {
      const result = await updateJourneySubStepAction(uid, stepId, subStepId, completed);
      if (result.success && result.progress) {
        setProgress(result.progress);
      }
    } catch (error) {
      console.error("❌ [useJourney] Erro ao salvar progresso:", error);
    }
  };

  /**
   * Retorna os dados analíticos de uma etapa (Telemetria Real)
   */
  const getStageTelemetry = (stepId: string): StageTelemetry => {
    const stage = stages.find(s => s.id === stepId);
    const stepProgress = progress?.steps[stepId];
    
    // Cálculo de % Real
    const totalSubsteps = stage?.substeps.length || 0;
    const completedCount = stepProgress?.completedSubSteps.length || 0;
    const percentage = totalSubsteps > 0 ? Math.round((completedCount / totalSubsteps) * 100) : 0;

    // Checagem de Acesso Granular
    const hasQuota = quotas?.quotas[stepId] ? (quotas.quotas[stepId].total > 0) : false;
    
    // Checagem Global: O usuário adquiriu QUALQUER serviço? 💳
    const hasAnyQuota = quotas ? Object.values(quotas.quotas).some(q => q.total > 0) : false;

    // Identificar se é o "Próximo Passo" lógico (Baseado em ID sequencial ou LastActive)
    const currentStepIndex = stages.findIndex(s => s.id === progress?.lastActiveStepId);
    const thisStepIndex = stages.findIndex(s => s.id === stepId);
    const isNext = thisStepIndex === currentStepIndex + 1;

    // 🔒 Trava de Sequência BPlen (Metodologia Linear)
    // Uma etapa só pode ser ACESSADA se a anterior estiver 'completed'.
    let isSequenceLocked = false;
    if (thisStepIndex > 0) {
       // EXCEÇÃO ESTRATÉGICA: Onboarding pode ser acessado mesmo sem concluir Primeiros Passos 🧬
       const isOnboarding = stepId === 'onboarding' || stepId === 'ONBOARDING';
       
       if (!isOnboarding) {
          const prevStageId = stages[thisStepIndex - 1].id;
          const prevStepProgress = progress?.steps[prevStageId];
          isSequenceLocked = prevStepProgress?.status !== "completed";
       }
    }

    return {
      status: stepProgress?.status || "locked",
      percentage,
      hasAccess: hasQuota || stage?.order === 0 || (stepId === 'onboarding' && hasAnyQuota), // Step 0 sempre livre, Onboarding livre se tiver algum serviço
      isNext,
      isSequenceLocked, // 🧬 Nova flag de governança metodológica
      substepsLabel: `${completedCount}/${totalSubsteps}`
    };
  };

  const getStepStatus = (stepId: string): StepStatus => {
    return progress?.steps[stepId]?.status || "locked";
  };

  return {
    stages,
    progress,
    loading,
    quotas,
    updateSubStep,
    getStepStatus,
    getStageTelemetry,
    refreshJourney: init // Permite forçar recarregamento se necessário
  };
}

