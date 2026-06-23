"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { useSearchParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SurveyEngine } from "@/components/forms/SurveyEngine";
import { welcomeSurveyConfig } from "@/config/surveys/welcome";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { useTourStore } from "@/store/tour-store";
import { hubOnboardingSteps } from "@/config/tour/hub-onboarding";
import { HubHomeView } from "@/components/hub/HubHomeView";
import { WelcomeRedirectModal } from "@/components/checkout/WelcomeRedirectModal";

export default function HubPage() {
  const { user, loading } = useAuthContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const startTour = useTourStore((state) => state.startTour);
  
  // Guard de Proteção Rígida (Soberania de Acesso)
  if (!user && !loading) return null;
  const [hasCompletedSurvey, setHasCompletedSurvey] = useState<boolean | null>(null);
  const [checkingSurvey, setCheckingSurvey] = useState(false);

  // O Hub foca apenas na WelcomeSurvey se o usuário não a concluiu.
  // A matrícula já deve existir (vinda do Checkout ou de acessos anteriores).

  useEffect(() => {
    async function checkSurvey() {
      if (!user) {
        setHasCompletedSurvey(null);
        return;
      }
      
      setCheckingSurvey(true);
      try {
        const mapSnap = await getDoc(doc(db, "_AuthMap", user.uid));
        if (mapSnap.exists()) {
          const { matricula } = mapSnap.data();
          const userSnap = await getDoc(doc(db, "User", matricula));
          
          if (userSnap.exists() && userSnap.data().hasCompletedWelcome) {
            setHasCompletedSurvey(true);
          } else {
            setHasCompletedSurvey(false);
          }
        } else {
          setHasCompletedSurvey(false);
        }
      } catch (err) {
        console.error("Erro ao verificar status da survey:", err);
        setHasCompletedSurvey(false); 
      } finally {
        setCheckingSurvey(false);
      }
    }

    checkSurvey();
  }, [user]);

  // Efeito Sandbox: Detectar Trigger de Tour via URL
  useEffect(() => {
    const testTour = searchParams.get("testTour");
    if (testTour === "onboarding_tour") {
      // Pequeno atraso para garantir que os elementos do HubHomeView estejam montados
      setTimeout(() => {
        startTour("onboarding_tour", hubOnboardingSteps);
        // Limpar a URL sem disparar navegação pesada
        window.history.replaceState({}, '', '/hub');
      }, 1000);
    }
  }, [searchParams, startTour]);

  if (loading || checkingSurvey) {
    return (
      <main className="flex-1 flex items-center justify-center p-6 relative">
        <div className="w-8 h-8 rounded-full border-2 border-accent-start border-t-transparent animate-spin" />
      </main>
    );
  }

  if (user && hasCompletedSurvey === false) {
    // Preparar Configuração Dinâmica para a WelcomeSurvey (Institucional)
    const displayName = user.displayName || "Membro";
    const firstName = displayName.split(" ")[0];
    
    const dynamicWelcomeConfig = {
      ...welcomeSurveyConfig,
      templateData: { firstName, displayName }
    };

    return (
      <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20 blur-3xl gradient-accent" aria-hidden="true" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-15 blur-3xl gradient-accent" aria-hidden="true" />
        </div>
        
        <div className="relative z-10 w-full mt-10 mb-10">
          <SurveyEngine 
            config={dynamicWelcomeConfig}
            userUid={user.uid}
            onComplete={(mat, responses) => {
              const wantsTour = responses?.wants_tour;
              if (Array.isArray(wantsTour) && wantsTour.includes("Sim")) {
                useTourStore.getState().startTour("onboarding_tour", hubOnboardingSteps);
              } else if (typeof wantsTour === "string" && wantsTour.includes("Sim")) {
                useTourStore.getState().startTour("onboarding_tour", hubOnboardingSteps);
              }
              setHasCompletedSurvey(true);
            }}
          />
        </div>
      </main>
    );
  }

  // HUB HOME — Experiência Pós-Survey
  return <HubHomeView />;
}
