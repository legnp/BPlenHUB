import { Metadata } from "next";
import { redirect } from "next/navigation";
import { fetchUserPermissionsStatus } from "@/actions/auth-permissions";
import { verifySignedSession } from "@/actions/auth-session";
import MemberDashboardView from "@/components/hub/MemberDashboardView";

export const metadata: Metadata = {
  title: "Jornada de Membro",
  description: "Acompanhe sua evolução, resultados e próximos passos na sua jornada de desenvolvimento BPlen.",
};

export const dynamic = "force-dynamic";

/**
 * BPlen HUB — Área de Membro (Soberania do Servidor 🛡️)
 * O acesso é validado no servidor antes de enviar qualquer JS para o navegador.
 */
export default async function MemberAreaPage() {
  // 🛡️ Verificação de sessão assinada
  const session = await verifySignedSession();

  // 1. Gate de Autenticação Primário
  if (!session) {
    redirect("/");
  }

  // 2. Gate de Autorização Granular (Soberania de Permissões) 🛡️
  // 2a camada — a 1a e' o layout.tsx da subarvore (Fase D). Sem bypass de admin:
  // o selo de membro nao e' herdado (ACCESS-MODEL-DESIGN.md secao 1); admin que
  // precise testar a area se auto-libera pelo proprio painel.
  const { services: userServices } = await fetchUserPermissionsStatus(session.uid);
  const hasAccess = userServices?.member_area_access === true;

  if (!hasAccess) {
    console.warn(`🚦 [MemberArea Gate] Acesso bloqueado via Servidor para o UID: ${session.uid}.`);
    redirect("/hub");
  }

  // 3. Renderização Autorizada — Dashboard unificado no lugar da antiga lista de serviços.
  return <MemberDashboardView />;
}
