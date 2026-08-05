"use client";

import React, { useEffect } from "react";
import { JourneyNav } from "@/components/journey/JourneyNav";
import { useAuthContext } from "@/context/AuthContext";
import { useJourney } from "@/hooks/useJourney";
import { usePathname } from "next/navigation";
import AtmosphericLoading from "@/components/shared/AtmosphericLoading";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * BPlen HUB — Jornada de Parceria (moldura)
 *
 * Mesma moldura da jornada de membro, com tres diferencas de audiencia: as etapas e o
 * progresso vem da trilha de parceiro (`useJourney(uid, "partner")`), o navegador roda
 * em `variant="partner"` (sem upsell nem gates de Onboarding/Offboarding, que sao
 * conceitos de membro) e o retorno leva para a area de parceiros.
 *
 * A autorizacao NAO esta aqui: o gate real e' o layout do servidor em
 * src/app/hub/partners/layout.tsx, que roda a cada request.
 */
export default function PartnerJourneyLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuthContext();
  const pathname = usePathname();
  const currentStepId = pathname.split("/").pop() || "";

  const { stages, progress, loading: journeyLoading, getStageTelemetry } = useJourney(
    user?.uid || "guest",
    "partner"
  );

  // Layout client nao exporta metadata — o titulo da aba e' ajustado aqui, no mesmo
  // padrao da jornada de membro.
  const currentStageTitle = stages.find((s) => s.id === currentStepId)?.title;
  useEffect(() => {
    document.title = `BPlen | ${currentStageTitle || "Jornada de Parceria"}`;
  }, [currentStageTitle]);

  if (authLoading || journeyLoading) {
    return <AtmosphericLoading label="Carregando Jornada de Parceria..." />;
  }

  return (
    <section className="min-h-screen pt-[10px] pb-24 px-4 sm:px-8 bg-[var(--bg-primary)] animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <Link
          href="/hub/partners"
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group mb-5"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Voltar
        </Link>

        <JourneyNav
          variant="partner"
          stages={stages}
          currentStepId={currentStepId}
          stepStatusMap={
            progress?.steps
              ? Object.fromEntries(Object.entries(progress.steps).map(([k, v]) => [k, v.status]))
              : {}
          }
          getStageTelemetry={getStageTelemetry}
        />
      </div>

      <div className="flex-1 w-full max-w-7xl mx-auto">{children}</div>
    </section>
  );
}
