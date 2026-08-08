"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { useJourney } from "@/hooks/useJourney";
import { JourneyNav } from "@/components/journey/JourneyNav";

/**
 * Trilha da Jornada de Parceria na home da area.
 *
 * E' o MESMO `JourneyNav` da pagina da jornada, com a mesma `variant="partner"` e a mesma
 * telemetria. Existiu aqui, por um dia, um componente compacto proprio; ele divergiu em
 * tamanho, cor, densidade e — o que importava — no significado: pintava cadeado no lugar
 * do icone, entao a mesma etapa parecia mais travada na home do que na jornada. Duas
 * leituras do mesmo estado e' pior do que uma trilha grande demais.
 *
 * A unica coisa que este arquivo acrescenta e' o DESTINO do clique. Sem `onSelectStep`, o
 * `JourneyNav` navega para `/hub/journey/{id}` — a rota da jornada de MEMBRO. Aqui o
 * clique tem que cair na subarvore do parceiro.
 */
export function PartnerJourneyNav() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { stages, progress, getStageTelemetry } = useJourney(user?.uid || "guest", "partner");

  // Renderizacao progressiva: enquanto a jornada nao chega, a secao nao ocupa espaco
  // (mesmo criterio do `MemberJourneyHero`).
  if (stages.length === 0) return null;

  const etapaAtivaId = progress?.lastActiveStepId || stages[0]?.id || "";

  return (
    <section id="partner-home-jornada" aria-label="Jornada de Parceria">
      <JourneyNav
        variant="partner"
        stages={stages}
        currentStepId={etapaAtivaId}
        stepStatusMap={
          progress?.steps
            ? Object.fromEntries(Object.entries(progress.steps).map(([k, v]) => [k, v.status]))
            : {}
        }
        getStageTelemetry={getStageTelemetry}
        onSelectStep={(stepId) => router.push(`/hub/partners/journey/${stepId}`)}
      />
    </section>
  );
}
