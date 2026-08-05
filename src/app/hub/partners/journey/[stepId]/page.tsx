"use client";

import React, { useState } from "react";
import { useParams, useRouter, redirect } from "next/navigation";
import { StepContainer } from "@/components/journey/StepContainer";
import { SubStepRail } from "@/components/journey/SubStepRail";
import { StepRenderer } from "@/components/journey/StepRenderer";
import { useAuthContext } from "@/context/AuthContext";
import { useJourney } from "@/hooks/useJourney";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import AtmosphericLoading from "@/components/shared/AtmosphericLoading";

/**
 * BPlen HUB — Etapa da Jornada de Parceria
 *
 * Estrutura equivalente a da etapa da jornada de membro, ligada a trilha de parceiro:
 * `useJourney(uid, "partner")` (etapas filtradas por audiencia + doc de progresso
 * proprio) e `StepRenderer` no contexto `partner_journey` (dicionario de textos de
 * parceria). Sem tour e sem upsell — a parada de Boas-vindas entra por ultimo, e a
 * trilha de parceria nao vende servico.
 */
export default function PartnerJourneyStepPage() {
  const params = useParams();
  const router = useRouter();
  const stepId = (params.stepId as string) || "";
  const { user } = useAuthContext();

  const { stages, progress, loading, updateSubStep, getStepStatus, getStageTelemetry } = useJourney(
    user?.uid || "guest",
    "partner"
  );

  // A parada em foco e' DERIVADA, nao sincronizada por efeito: a escolha do usuario
  // vale enquanto pertencer a etapa atual; fora isso, cai no padrao (primeira parada
  // pendente, ou a ultima se tudo estiver concluido). Trocar de etapa reseta sozinho,
  // sem cascata de renders — o que tambem satisfaz a regra set-state-in-effect.
  const [selectedSubStepId, setSelectedSubStepId] = useState<string>("");

  const stepConfig = stages.find((s) => s.id === stepId);
  const completedSubStepIds = progress?.steps[stepId]?.completedSubSteps || [];

  const defaultSubStepId = (() => {
    const substeps = stepConfig?.substeps || [];
    if (substeps.length === 0) return "";
    const firstIncomplete = substeps.find((ss) => !completedSubStepIds.includes(ss.id));
    return firstIncomplete?.id || substeps[substeps.length - 1].id;
  })();

  const belongsToStep = stepConfig?.substeps?.some((ss) => ss.id === selectedSubStepId);
  const currentSubStepId = belongsToStep ? selectedSubStepId : defaultSubStepId;

  if (loading || (!stepConfig && stages.length === 0)) {
    return <AtmosphericLoading label="Carregando Jornada de Parceria..." />;
  }

  if (!stepConfig && stages.length > 0) {
    return redirect("/hub/partners");
  }

  if (!stepConfig) return null;

  const currentSubStep =
    stepConfig.substeps && stepConfig.substeps.length > 0
      ? stepConfig.substeps.find((ss) => ss.id === currentSubStepId) || stepConfig.substeps[0]
      : null;

  const stepStatus = getStepStatus(stepId);
  const telemetry = progress ? getStageTelemetry(stepId) : null;
  const hasAccess = telemetry?.hasAccess || false;
  const isLockedBySequence = hasAccess && telemetry?.isSequenceLocked;

  // Sem acesso a etapa: volta para a area de parceiros. O gate de autorizacao de
  // verdade (selo) roda no servidor, no layout da subarvore.
  if (telemetry && !hasAccess) {
    return redirect("/hub/partners");
  }

  if (isLockedBySequence) {
    const prevStageIdx = stages.findIndex((s) => s.id === stepId) - 1;
    const prevStage = stages[prevStageIdx];

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="w-24 h-24 rounded-[2.5rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
          <ArrowLeft size={32} />
        </div>
        <div className="space-y-3 max-w-md">
          <h2 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">Etapa em espera</h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            A etapa <strong>{stepConfig.title}</strong> será liberada assim que você concluir a etapa
            anterior <strong>({prevStage?.title})</strong>.
          </p>
        </div>
        <Link
          href={prevStage ? `/hub/partners/journey/${prevStage.id}` : "/hub/partners"}
          className="px-8 py-4 rounded-2xl bg-[var(--accent-start)] text-white font-black text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
        >
          Voltar para {prevStage?.title || "Área de Parceiros"}
        </Link>
      </div>
    );
  }

  if (!currentSubStep) return <AtmosphericLoading label="Carregando Jornada de Parceria..." />;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pt-5 pb-8 px-4">
      <StepContainer
        title={stepConfig.title}
        description={stepConfig.description}
        badge={stepStatus === "completed" ? "Finalizado" : "Em Progresso"}
      >
        <SubStepRail
          substeps={stepConfig.substeps}
          currentSubStepId={currentSubStepId}
          completedSubStepIds={progress?.steps[stepId]?.completedSubSteps || []}
          onSelectSubStep={setSelectedSubStepId}
        />

        <div className="flex-1 flex flex-col pt-[5px] pb-4 px-4 sm:pb-8 sm:px-8">
          <StepRenderer
            context="partner_journey"
            stageId={stepId}
            serviceCode={stepConfig.serviceCode}
            substep={currentSubStep}
            status={stepStatus}
            kicker={stepConfig.kicker}
            icon={stepConfig.icon}
            onComplete={async () => {
              await updateSubStep(stepId, currentSubStepId, true);
              router.refresh();

              const currentIndex = stepConfig.substeps.findIndex((ss) => ss.id === currentSubStepId);
              if (currentIndex < stepConfig.substeps.length - 1) {
                setSelectedSubStepId(stepConfig.substeps[currentIndex + 1].id);
              } else {
                const currentStageIdx = stages.findIndex((s) => s.id === stepId);
                if (currentStageIdx < stages.length - 1) {
                  router.push(`/hub/partners/journey/${stages[currentStageIdx + 1].id}`);
                }
              }
            }}
          />
        </div>
      </StepContainer>
    </div>
  );
}
