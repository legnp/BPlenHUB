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
import { WelcomeSurveyGate, hasCompletedWelcomeSurvey } from "@/components/hub/WelcomeSurveyGate";

import { GuidedTourOverlay } from "@/components/shared/GuidedTourOverlay";

/**
 * HUB SHELL — O Frame Institucional Client-Side
 * Gerencia o tema e o cabeçalho privado.
 * Inclui os botões flutuantes de Suporte e WhatsApp.
 *
 * Gate de Boas-vindas (Fase 2): antes de liberar QUALQUER rota do hub, exige o
 * aceite de consentimento vigente (Termos + Privacidade + 18). Sem o aceite, o
 * usuario nao avanca do primeiro acesso; reprompt automatico quando a versao muda.
 *
 * Gate de Recepcao (welcome survey): logo apos o consentimento, na home do hub, a
 * recepcao e a UNICA tela visivel — cabecalho, menu e acoes flutuantes so montam
 * depois dela. Escopo deliberadamente restrito a "/hub" (nao ao hub inteiro) para
 * nao interceptar quem entra direto no checkout vindo de uma pagina publica.
 */
export function HubShell({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const { user, loading } = useAuthContext();
  const pathname = usePathname();
  const isHubHome = pathname === "/hub";
  // `checkedForUid` amarra o resultado ao uid checado — evita usar estado stale de
  // um usuario anterior e permite so setar state em callback async (nao no corpo do
  // effect, que dispara render em cascata / regra set-state-in-effect).
  const [consent, setConsent] = useState<{ checkedForUid: string | null; needsGate: boolean; birthDate?: string }>({
    checkedForUid: null,
    needsGate: false,
  });
  // Mesma amarracao por uid do consentimento, para o gate de recepcao.
  const [welcome, setWelcome] = useState<{ checkedForUid: string | null; needsGate: boolean }>({
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

  useEffect(() => {
    // Fora da home do hub nem se consulta: a recepcao nunca foi gate dessas rotas
    // (quem vem do checkout de uma pagina publica cai direto no /hub/checkout).
    if (!user || !isHubHome) return;
    let active = true;
    hasCompletedWelcomeSurvey(user.uid)
      .then((done) => {
        if (active) setWelcome({ checkedForUid: user.uid, needsGate: !done });
      })
      .catch((err) => {
        // Fail-closed (comportamento preservado do hub/page.tsx): em erro de
        // leitura, mostrar a recepcao — ela e idempotente do lado do usuario.
        console.error("Erro ao verificar status da recepcao:", err);
        if (active) setWelcome({ checkedForUid: user.uid, needsGate: true });
      });
    return () => {
      active = false;
    };
  }, [user, isHubHome]);

  const consentResolved = !!user && consent.checkedForUid === user.uid;
  const welcomeResolved = !isHubHome || (!!user && welcome.checkedForUid === user.uid);

  // Se o guard do servidor falhar ou a sessao expirar, redirecionamos via client
  // para a superficie canonica de login preservando o destino atual.
  if (!user && !loading) {
    redirect(buildEntrarPath(pathname));
    return null;
  }

  // Usuario presente mas ainda resolvendo o consentimento: aguardar (evita piscar
  // o conteudo do hub antes do gate).
  if (user && !consentResolved) {
    return <ShellSpinner />;
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

  // Consentimento em dia: so entao decidir a recepcao (evita piscar o cabecalho
  // antes dela).
  if (user && !welcomeResolved) {
    return <ShellSpinner />;
  }

  // Gate de recepcao: a welcome survey e a unica tela — sem cabecalho, menu ou
  // acoes flutuantes por cima dela. O tema segue aplicado pelo wrapper.
  // `isHubHome` repetido de proposito: se o usuario sair da home por URL direta com
  // a recepcao pendente, o estado nao pode vazar o gate para outra rota.
  if (user && isHubHome && welcome.needsGate) {
    return (
      <div className={`min-h-screen flex flex-col transition-colors duration-500 ${theme !== 'light' ? `theme-${theme}` : ''}`}>
        <WelcomeSurveyGate
          uid={user.uid}
          displayName={user.displayName}
          onDone={() => setWelcome((w) => ({ ...w, needsGate: false }))}
        />
      </div>
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

function ShellSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-accent-start border-t-transparent animate-spin" />
    </div>
  );
}
