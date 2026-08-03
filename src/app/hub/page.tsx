"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTourStore } from "@/store/tour-store";
import { hubOnboardingSteps } from "@/config/tour/hub-onboarding";
import { HubHomeView } from "@/components/hub/HubHomeView";

/**
 * BPlen HUB — Home da area logada.
 *
 * A protecao de acesso e a recepcao (welcome survey) vivem no HubShell: o layout
 * so renderiza esta pagina quando ha sessao valida E a recepcao ja foi concluida.
 * Aqui sobra apenas a home em si.
 */
export default function HubPage() {
  const searchParams = useSearchParams();
  const startTour = useTourStore((state) => state.startTour);

  // Sandbox: disparar o tour guiado via URL (?testTour=onboarding_tour).
  useEffect(() => {
    const testTour = searchParams.get("testTour");
    if (testTour === "onboarding_tour") {
      // Pequeno atraso para garantir que os elementos do HubHomeView estejam montados
      const timer = setTimeout(() => {
        startTour("onboarding_tour", hubOnboardingSteps);
        // Limpar a URL sem disparar navegacao pesada
        window.history.replaceState({}, "", "/hub");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, startTour]);

  return <HubHomeView />;
}
