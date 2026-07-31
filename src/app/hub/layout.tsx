import React from "react";
import { redirect } from "next/navigation";
import { HubShell } from "@/components/hub/HubShell";
import { Metadata } from "next";
import { verifySignedSession } from "@/actions/auth-session";
import { entrarRedirectTarget } from "@/lib/auth/entrar-redirect-server";

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
    // Cookie ausente, inválido ou forjado → redirecionar para a superficie
    // canonica de login preservando o destino (retorno a origem unificado).
    console.log("[Route Gate] Sessao invalida ou ausente. Redirecionamento Server-Side...");
    redirect(await entrarRedirectTarget("/hub"));
  }

  // Sessão verificada criptograficamente → permitir renderização 
  return (
    <HubShell>
       {children}
    </HubShell>
  );
}
