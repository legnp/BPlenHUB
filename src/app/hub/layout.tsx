import React from "react";
import { redirect } from "next/navigation";
import { HubShell } from "@/components/hub/HubShell";
import { Metadata } from "next";
import { verifySignedSession, clearSessionCookie } from "@/actions/auth-session";

export const metadata: Metadata = {
  title: {
    default: "Início",
    template: "BPlen | %s",
  },
};

/**
 * HUB LAYOUT — O Gate de Autenticação Server-Side 🛡️
 * O servidor toma a decisão de autorização ANTES do JS carregar no cliente.
 * Agora com verificação CRIPTOGRÁFICA do cookie assinado.
 */
export default async function HubLayout({ children }: { children: React.ReactNode }) {
  
  // 🛡️ Verificação criptográfica do cookie de sessão
  const session = await verifySignedSession();

  if (!session) {
    // Cookie ausente, inválido ou forjado → redirecionar
    console.log("🚦 [Route Gate] Sessão inválida ou ausente. Redirecionamento Server-Side...");
    redirect("/");
  }

  // Sessão verificada criptograficamente → permitir renderização 
  return (
    <HubShell>
       {children}
    </HubShell>
  );
}
