"use client";

import React, { useState, useEffect } from "react";
import { HubHeader } from "@/components/hub/HubHeader";
import { FloatingHubActions } from "@/components/hub/FloatingHubActions";
import { useTheme } from "@/context/ThemeContext";
import { useAuthContext } from "@/context/AuthContext";
import { redirect, usePathname } from "next/navigation";
import { buildEntrarPath } from "@/lib/auth/identity-guards";
import { getConsentStatusAction } from "@/actions/consent";
import { WelcomeConsentGate } from "@/components/hub/WelcomeConsentGate";

import { GuidedTourOverlay } from "@/components/shared/GuidedTourOverlay";

/**
 * HUB SHELL — O Frame Institucional Client-Side
 * Gerencia o tema e o cabeçalho privado.
 * Inclui os botões flutuantes de Suporte e WhatsApp.
 *
 * Gate de Boas-vindas (Fase 2): antes de liberar QUALQUER rota do hub, exige o
 * aceite de consentimento vigente (Termos + Privacidade + 18). Sem o aceite, o
 * usuario nao avanca do primeiro acesso; reprompt automatico quando a versao muda.
 */
export function HubShell({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const { user, loading } = useAuthContext();
  const pathname = usePathname();
  // `checkedForUid` amarra o resultado ao uid checado — evita usar estado stale de
  // um usuario anterior e permite so setar state em callback async (nao no corpo do
  // effect, que dispara render em cascata / regra set-state-in-effect).
  const [consent, setConsent] = useState<{ checkedForUid: string | null; needsGate: boolean; birthDate?: string }>({
    checkedForUid: null,
    needsGate: false,
  });

  useEffect(() => {
    if (!user) return;
    let active = true;
    getConsentStatusAction()
      .then((res) => {
        if (active) setConsent({ checkedForUid: user.uid, needsGate: res.needsGate, birthDate: res.birthDate });
      })
      .catch(() => {
        // Fail-open: nao trancar o hub por erro transitorio na checagem.
        if (active) setConsent({ checkedForUid: user.uid, needsGate: false });
      });
    return () => {
      active = false;
    };
  }, [user]);

  const consentResolved = !!user && consent.checkedForUid === user.uid;

  // Se o guard do servidor falhar ou a sessao expirar, redirecionamos via client
  // para a superficie canonica de login preservando o destino atual.
  if (!user && !loading) {
    redirect(buildEntrarPath(pathname));
    return null;
  }

  // Usuario presente mas ainda resolvendo o consentimento: aguardar (evita piscar
  // o conteudo do hub antes do gate).
  if (user && !consentResolved) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent-start border-t-transparent animate-spin" />
      </div>
    );
  }

  // Gate de consentimento: bloqueia todo o hub ate o aceite vigente.
  if (user && consent.needsGate) {
    return (
      <WelcomeConsentGate
        initialBirthDate={consent.birthDate}
        onDone={() => setConsent((c) => ({ ...c, needsGate: false }))}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${theme !== 'light' ? `theme-${theme}` : ''}`}>
      <GuidedTourOverlay
        userName={user?.displayName?.split(" ")[0] || "Membro"}
      />
      <HubHeader />
      <main className="flex-1 w-full bg-background transition-colors duration-500 relative pt-20">
        {children}
      </main>
      <FloatingHubActions />
    </div>
  );
}
