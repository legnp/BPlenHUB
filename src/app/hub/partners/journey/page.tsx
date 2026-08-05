"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { useJourney } from "@/hooks/useJourney";
import AtmosphericLoading from "@/components/shared/AtmosphericLoading";

/**
 * Indice da Jornada de Parceria.
 *
 * Encaminha para a etapa em que o parceiro parou — ou, no primeiro acesso, para a
 * primeira etapa da trilha. O destino vem do catalogo (as etapas ja chegam ordenadas),
 * nunca de um id fixo: quem monta a trilha e' o cadastro dos produtos.
 */
export default function PartnerJourneyIndex() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { stages, progress, loading } = useJourney(user?.uid || "guest", "partner");

  useEffect(() => {
    if (loading) return;

    const target =
      stages.find((s) => s.id === progress?.lastActiveStepId)?.id || stages[0]?.id;

    router.replace(target ? `/hub/partners/journey/${target}` : "/hub/partners");
  }, [loading, stages, progress, router]);

  return <AtmosphericLoading label="Carregando Jornada de Parceria..." />;
}
