import React from "react";
import { redirect } from "next/navigation";
import { verifySignedSession } from "@/actions/auth-session";
import { resolveUserPermissions } from "@/lib/user-permissions";

/**
 * MEMBRO LAYOUT — O cadeado do clube (Fase D — ACCESS-MODEL-DESIGN.md secao 1) 🛡️
 *
 * Toda a subarvore /hub/membro/* exige o selo de membro (`member_area_access`),
 * verificado no SERVIDOR a cada request (o cookie so carrega identidade; os
 * servicos sao resolvidos ao vivo do Firestore). Sem selo -> /hub.
 *
 * Admin NAO herda o clube (o modelo diz que os selos coexistem, nao se implicam)
 * — um admin que precise testar a area se auto-libera pelo proprio painel.
 *
 * Este e' o enforcement que faltava no BUG-035: revogar o selo agora expulsa o
 * cliente do clube na proxima navegacao. Os stubs de redirect da Fase C
 * (checkout/journey antigos) vivem sob esta subarvore — um nao-membro com link
 * antigo cai em /hub, que e' navegavel ate o destino novo.
 */
export default async function MemberAreaLayout({ children }: { children: React.ReactNode }) {
  // O hub/layout.tsx (pai) ja autenticou; revalidamos aqui porque layouts do
  // App Router nao repassam dados entre si e o custo e' a leitura do cookie.
  const session = await verifySignedSession();
  if (!session) {
    redirect("/");
  }

  const { services } = await resolveUserPermissions(session.uid);

  if (services?.member_area_access !== true) {
    console.warn(`[MemberArea Gate] Sem selo de membro — UID ${session.uid} redirecionado para /hub.`);
    redirect("/hub");
  }

  return <>{children}</>;
}
