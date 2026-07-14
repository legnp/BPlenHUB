"use client";

import React, { useEffect } from "react";
import { JourneyNav } from "@/components/journey/JourneyNav";
import { useAuthContext } from "@/context/AuthContext";
import { useJourney } from "@/hooks/useJourney";
import { usePathname } from "next/navigation";
import AtmosphericLoading from "@/components/shared/AtmosphericLoading";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StepStatus } from "@/types/journey";

/**
 * BPlen HUB — Journey Layout 🧬🛡️
 * The premium frame for the 6-stage member journey.
 */
export default function JourneyLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuthContext();
  const pathname = usePathname();
  const currentStepId = pathname.split('/').pop() || "onboarding";
  
// Progress tracker
  const { stages, progress, loading: journeyLoading, getStepStatus, getStageTelemetry } = useJourney(user?.uid || "guest");

  // Título da aba com o nome da etapa em exibição. A jornada tem um layout client
  // (não pode exportar metadata), então o título é ajustado no cliente — "BPlen | <etapa>".
  const currentStageTitle = stages.find((s) => s.id === currentStepId)?.title;
  useEffect(() => {
    document.title = `BPlen | ${currentStageTitle || "Jornada"}`;
  }, [currentStageTitle]);

  if (authLoading || journeyLoading) {
    return <AtmosphericLoading label="Carregando Jornada..." />;
  }

  // Pre-calculate status map for Navigator
  const statusMap = stages.reduce((acc, stage) => {
    acc[stage.id] = getStepStatus(stage.id);
    return acc;
  }, {} as Record<string, StepStatus>);

  return (
    <section className="min-h-screen pt-[10px] pb-24 px-4 sm:px-8 bg-[var(--bg-primary)] animate-in fade-in duration-700">
        <div id="hub-journey-top-nav" className="max-w-7xl mx-auto px-6 mb-8">
           <Link 
              href="/hub/membro"
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group mb-5"
           >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Voltar
           </Link>

          <JourneyNav 
             stages={stages}
             currentStepId={currentStepId} 
             stepStatusMap={progress?.steps ? Object.fromEntries(
                Object.entries(progress.steps).map(([k, v]) => [k, v.status])
             ) : {}}
             getStageTelemetry={getStageTelemetry}
          />
        </div>

      <div className="flex-1 w-full max-w-7xl mx-auto">
        {children}
      </div>
    </section>
  );
}
