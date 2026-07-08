"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, redirect } from "next/navigation";
import { StepContainer } from "@/components/journey/StepContainer";
import { SubStepRail } from "@/components/journey/SubStepRail";
import { StepRenderer } from "@/components/journey/StepRenderer";
import { useAuthContext } from "@/context/AuthContext";
import { useJourney } from "@/hooks/useJourney";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import AtmosphericLoading from "@/components/shared/AtmosphericLoading";
import { GuidedTourOverlay } from "@/components/shared/GuidedTourOverlay";
import { memberOnboardingSteps } from "@/config/tour/member-onboarding";

/**
 * BPlen HUB — Step Journey Engine 🧬🛡️
 * Dynamic page that resolves the current stage and renders its substeps linear-flexibly.
 */
export default function StepJourneyPage() {
  const params = useParams();
  const router = useRouter();
  const stepId = (params.stepId as string) || "onboarding";
  const { user } = useAuthContext();

  // Progress Logic
  const { stages, progress, loading, updateSubStep, getStepStatus, getStageTelemetry } = useJourney(user?.uid || "guest");

  // Local state for current substep view
  const [currentSubStepId, setCurrentSubStepId] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);

  const stepConfig = stages.find(s => s.id === stepId);

  // Reset initialization state when stepId changes
  useEffect(() => {
    setIsInitialized(false);
    setCurrentSubStepId("");
  }, [stepId]);

  useEffect(() => {
    if (!loading && stepConfig && !isInitialized) {
      const completedSubStepIds = progress?.steps[stepId]?.completedSubSteps || [];
      const firstIncomplete = stepConfig.substeps?.find(ss => !completedSubStepIds.includes(ss.id));
      
      let initialId = "";
      if (firstIncomplete) {
        initialId = firstIncomplete.id;
      } else if (stepConfig.substeps && stepConfig.substeps.length > 0) {
        // Fallback to last completed substep if everything is done
        initialId = stepConfig.substeps[stepConfig.substeps.length - 1].id;
      }

      if (initialId) {
        setCurrentSubStepId(initialId);
        setIsInitialized(true);
      }
    }
  }, [loading, stepConfig, isInitialized, progress, stepId]);

  // Guided Tour State (Parte 2 do Flow de Onboarding)
  const [isTourOpen, setIsTourOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search;
      const isTourTriggered = search.includes("startTour=part2") || sessionStorage.getItem("bplen_tour_onboarding") === "true";
      
      if (isTourTriggered) {
        // Garantir limpeza dupla do rastreador pra não prender a tela
        sessionStorage.removeItem("bplen_tour_onboarding");
        
        const timer = setTimeout(() => {
          setIsTourOpen(true);
          if (window.location.search.includes("startTour")) {
            window.history.replaceState({}, "", window.location.pathname);
          }
        }, 1500);
        
        return () => clearTimeout(timer);
      }
    }
  }, []);

  if (loading || (!stepConfig && stages.length === 0)) {
    return <AtmosphericLoading />;
  }

  if (!stepConfig && stages.length > 0) {
    return redirect("/hub/membro");
  }

  if (!stepConfig) return null;

  const currentSubStep = (stepConfig.substeps && stepConfig.substeps.length > 0)
    ? (stepConfig.substeps.find(ss => ss.id === currentSubStepId) || stepConfig.substeps[0])
    : null;

  const stepStatus = getStepStatus(stepId);
  
  // 🔒 Governança de Sequência Rígida (Soberania Metodológica 🛡️)
  const telemetry = progress ? getStageTelemetry(stepId) : null;
  const hasAccess = telemetry?.hasAccess || false;
  const isLockedBySequence = hasAccess && telemetry?.isSequenceLocked;

  // 1. Bloqueio por falta de contratação/permissão (Upsell / Sem acesso)
  if (telemetry && !hasAccess) {
    return redirect("/hub/membro");
  }

  if (isLockedBySequence) {
    const prevStageIdx = stages.findIndex(s => s.id === stepId) - 1;
    const prevStage = stages[prevStageIdx];

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="w-24 h-24 rounded-[2.5rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 relative">
           <Loader2 size={40} className="animate-spin opacity-20 absolute" />
           <ArrowLeft size={32} className="relative z-10" />
        </div>
        <div className="space-y-3 max-w-md">
          <h2 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">Fase em Espera Metodológica</h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Para garantir a eficácia do seu desenvolvimento, a etapa <strong>{stepConfig.title}</strong> só será liberada após a conclusão 100% da fase anterior <strong>({prevStage?.title})</strong>.
          </p>
        </div>
        <Link 
          href={prevStage ? `/hub/journey/${prevStage.id}` : "/hub/membro"}
          className="px-8 py-4 rounded-2xl bg-[var(--accent-start)] text-white font-black text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-pink-500/20"
        >
          Voltar para {prevStage?.title || "Início"}
        </Link>
      </div>
    );
  }

  if (!currentSubStep) return <AtmosphericLoading />;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pt-5 pb-8 px-4">
      <StepContainer
        title={stepConfig.title}
        description={stepConfig.description}
        badge={stepStatus === "completed" ? "Finalizado" : "Em Progresso"}
      >
        {/* Sidebar: SubStep Navigation Rail */}
        <SubStepRail
          id="hub-etapa-checkin"
          substeps={stepConfig.substeps}
          currentSubStepId={currentSubStepId}
          completedSubStepIds={progress?.steps[stepId]?.completedSubSteps || []}
          onSelectSubStep={setCurrentSubStepId}
        />

        {/* Main Task Area: Step Renderer */}
        <div id="hub-conteudo" className="flex-1 flex flex-col pt-[5px] pb-4 px-4 sm:pb-8 sm:px-8">
          <StepRenderer
            context="member_journey"
            stageId={stepId}
            substep={currentSubStep}
            status={stepStatus}
            kicker={stepConfig.kicker}
            icon={stepConfig.icon}
            onComplete={async () => {
              // Mark current as complete
              await updateSubStep(stepId, currentSubStepId, true);

              // Force a layout refresh to update percentage in Navigator
              router.refresh();

              // Advance linearly choice
              const currentIndex = stepConfig.substeps.findIndex(ss => ss.id === currentSubStepId);
              if (currentIndex < stepConfig!.substeps.length - 1) {
                setCurrentSubStepId(stepConfig!.substeps[currentIndex + 1].id);
              } else {
                // If last sub-step of the stage, go to next stage or show completion
                alert("Estágio Concluído! Redirecionando para próxima etapa...");
                const currentStageIdx = stages.findIndex(s => s.id === stepId);
                if (currentStageIdx < stages.length - 1) {
                  router.push(`/hub/journey/${stages[currentStageIdx + 1].id}`);
                }
              }
            }}
          />
        </div>
      </StepContainer>

      <GuidedTourOverlay
        steps={memberOnboardingSteps.slice(5)}
        isOpen={isTourOpen}
        onComplete={async () => {
          setIsTourOpen(false);
          // Marca o "Tour Guiado" como concluído magicamente se for a primeira vez
          if (stepId === "onboarding" && currentSubStepId === "introducao") {
             await updateSubStep(stepId, currentSubStepId, true);
             router.refresh();
             
             // Avança para a parada 2 (Check-in) automaticamente
             const currentIndex = stepConfig.substeps.findIndex(ss => ss.id === currentSubStepId);
             if (currentIndex !== -1 && currentIndex < stepConfig.substeps.length - 1) {
                setCurrentSubStepId(stepConfig.substeps[currentIndex + 1].id);
             }
          }
        }}
        userName={user?.displayName ? user.displayName.split(" ")[0] : "Membro"}
      />
    </div>
  );
}
