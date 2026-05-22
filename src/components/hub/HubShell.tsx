"use client";

import React from "react";
import { HubHeader } from "@/components/hub/HubHeader";
import { FloatingHubActions } from "@/components/hub/FloatingHubActions";
import { useTheme } from "@/context/ThemeContext";
import { useAuthContext } from "@/context/AuthContext";
import { redirect } from "next/navigation";

import { GlobalTourOverlay } from "@/components/shared/GlobalTourOverlay";

/**
 * HUB SHELL — O Frame Institucional Client-Side 🧬
 * Gerencia o tema e o cabeçalho privado.
 * Inclui os botões flutuantes de Suporte e WhatsApp.
 */
export function HubShell({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const { user, loading } = useAuthContext();

  // Se o guard do servidor falhar ou o usuário deslogar, redirecionamos via client
  if (!user && !loading) {
    redirect("/");
    return null;
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${theme !== 'light' ? `theme-${theme}` : ''}`}>
      <GlobalTourOverlay />
      <HubHeader />
      <main className="flex-1 w-full bg-background transition-colors duration-500 relative pt-20">
        {children}
      </main>
      <FloatingHubActions />
    </div>
  );
}

