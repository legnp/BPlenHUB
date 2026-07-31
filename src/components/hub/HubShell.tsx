"use client";

import React from "react";
import { HubHeader } from "@/components/hub/HubHeader";
import { FloatingHubActions } from "@/components/hub/FloatingHubActions";
import { useTheme } from "@/context/ThemeContext";
import { useAuthContext } from "@/context/AuthContext";
import { redirect, usePathname } from "next/navigation";
import { buildEntrarPath } from "@/lib/auth/identity-guards";

import { GuidedTourOverlay } from "@/components/shared/GuidedTourOverlay";

/**
 * HUB SHELL — O Frame Institucional Client-Side
 * Gerencia o tema e o cabeçalho privado.
 * Inclui os botões flutuantes de Suporte e WhatsApp.
 */
export function HubShell({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const { user, loading } = useAuthContext();
  const pathname = usePathname();

  // Se o guard do servidor falhar ou a sessao expirar, redirecionamos via client
  // para a superficie canonica de login preservando o destino atual.
  if (!user && !loading) {
    redirect(buildEntrarPath(pathname));
    return null;
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

