import React from "react";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { verifySignedSession } from "@/actions/auth-session";
import { entrarRedirectTarget } from "@/lib/auth/entrar-redirect-server";
import { resolveUserPermissions } from "@/lib/user-permissions";

export const metadata: Metadata = {
  title: "Área de Parceiros",
};

/**
 * PARTNERS LAYOUT — o gate da Área de Parceiros
 * (PARTNER-AREA-EXPANSION-PLAN.md secao 3, Fase 0).
 *
 * Mesmo cadeado da área de membro: toda a subárvore /hub/partners/* exige o selo
 * `partner_area_access`, verificado no SERVIDOR a cada request (o cookie carrega só
 * identidade; os serviços são resolvidos ao vivo do banco). Sem selo -> /hub.
 *
 * Os selos coexistem e não se implicam (ACCESS-MODEL-DESIGN.md secao 1): admin não
 * herda a área de parceiro, e ser parceiro não concede a área de membro. O toggle de
 * contexto no cabeçalho é só preferência de navegação — a autorização é esta aqui.
 */
export default async function PartnerAreaLayout({ children }: { children: React.ReactNode }) {
  // O hub/layout.tsx (pai) já autenticou; revalidamos aqui porque layouts do
  // App Router não repassam dados entre si e o custo é a leitura do cookie.
  const session = await verifySignedSession();
  if (!session) {
    redirect(await entrarRedirectTarget("/hub"));
  }

  const { services } = await resolveUserPermissions(session.uid);

  if (services?.partner_area_access !== true) {
    console.warn(`[PartnerArea Gate] Sem selo de parceiro — UID ${session.uid} redirecionado para /hub.`);
    redirect("/hub");
  }

  return <>{children}</>;
}
