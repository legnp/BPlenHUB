"use client";

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SurveyEngine } from "@/components/forms/SurveyEngine";
import { welcomeSurveyConfig } from "@/config/surveys/welcome";
import { useTourStore } from "@/store/tour-store";
import { hubOnboardingSteps } from "@/config/tour/hub-onboarding";
import type { SurveyValue } from "@/types/survey";

/**
 * BPlen HUB — Gate de Recepção (welcome survey).
 *
 * Primeira tela do primeiro acesso, logo apos o gate de consentimento. E um GATE:
 * enquanto a recepção nao e concluida, nenhum outro elemento do hub aparece
 * (cabecalho, menu, acoes flutuantes) — a tela e a unica superficie visivel.
 * Mesmo padrao ja usado pelo WelcomeConsentGate.
 */

/**
 * Le o status da recepção pela via canonica de identidade: _AuthMap/{uid} resolve
 * a matricula e User/{matricula}.hasCompletedWelcome diz se a recepção fechou.
 * Sem matricula cunhada, a recepção ainda nao aconteceu.
 */
export async function hasCompletedWelcomeSurvey(uid: string): Promise<boolean> {
  const mapSnap = await getDoc(doc(db, "_AuthMap", uid));
  if (!mapSnap.exists()) return false;

  const { matricula } = mapSnap.data();
  if (!matricula) return false;

  const userSnap = await getDoc(doc(db, "User", matricula));
  return userSnap.exists() && !!userSnap.data().hasCompletedWelcome;
}

export function WelcomeSurveyGate({
  uid,
  displayName,
  onDone,
}: {
  uid: string;
  displayName: string | null | undefined;
  onDone: () => void;
}) {
  const name = displayName || "Membro";
  const firstName = name.split(" ")[0];

  const dynamicWelcomeConfig = {
    ...welcomeSurveyConfig,
    templateData: { firstName, displayName: name },
  };

  function handleComplete(_matricula: string, responses?: Record<string, SurveyValue>) {
    const wantsTour = responses?.wants_tour;
    const acceptedTour =
      (Array.isArray(wantsTour) && (wantsTour as string[]).includes("Sim")) ||
      (typeof wantsTour === "string" && wantsTour.includes("Sim"));

    if (acceptedTour) {
      useTourStore.getState().startTour("onboarding_tour", hubOnboardingSteps);
    }
    onDone();
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decoracoes de fundo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20 blur-3xl gradient-accent" aria-hidden="true" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-15 blur-3xl gradient-accent" aria-hidden="true" />
      </div>

      <div className="relative z-10 w-full mt-10 mb-10">
        <SurveyEngine
          config={dynamicWelcomeConfig}
          userUid={uid}
          onComplete={handleComplete}
        />
      </div>
    </main>
  );
}
