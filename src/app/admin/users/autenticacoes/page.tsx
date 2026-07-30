import React from "react";
import { Metadata } from "next";
import { UsersTabs } from "@/components/admin/UsersTabs";
import { AuthFunnelView } from "@/components/admin/AuthFunnelView";

export const metadata: Metadata = {
  title: "Autenticacoes",
  description: "Funil de onboarding: quem autenticou e onde parou.",
};

/**
 * Aba Autenticacoes (funil de onboarding). Orquestradora: monta as sub-abas de
 * Pessoas e delega a leitura/render para AuthFunnelView (client + Admin SDK).
 */
export default function AuthFunnelPage() {
  return (
    <div className="space-y-10 animate-fade-in-up">
      <UsersTabs />
      <AuthFunnelView />
    </div>
  );
}
