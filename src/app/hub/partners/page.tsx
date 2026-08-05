import { Metadata } from "next";
import { redirect } from "next/navigation";
import { fetchUserPermissionsStatus } from "@/actions/auth-permissions";
import { verifySignedSession } from "@/actions/auth-session";
import { entrarRedirectTarget } from "@/lib/auth/entrar-redirect-server";
import { getAdminDb } from "@/lib/firebase-admin";
import { PartnerHomeView } from "@/components/hub/partners/PartnerHomeView";

export const metadata: Metadata = {
  title: "Área de Parceiros",
  description: "Acompanhe a sua parceria BPlen: jornada, agenda, indicações e repasses.",
};

export const dynamic = "force-dynamic";

/**
 * BPlen HUB — Home da Área de Parceiros (Fase 5).
 *
 * Substitui a página de entrada mínima da Fase 0. O gate de autorização continua sendo o
 * layout de servidor da subárvore; esta é a 2a camada, sem bypass de admin.
 */
export default async function PartnerAreaPage() {
  const session = await verifySignedSession();

  if (!session) {
    redirect(await entrarRedirectTarget("/hub"));
  }

  const { services, matricula } = await fetchUserPermissionsStatus(session.uid);

  if (services?.partner_area_access !== true) {
    console.warn(`[PartnerArea Gate] Acesso bloqueado via Servidor para o UID: ${session.uid}.`);
    redirect("/hub");
  }

  // Apelido para o cumprimento — mesma resolução usada no resto do hub.
  let nickname: string | null = null;
  if (matricula) {
    try {
      const userSnap = await getAdminDb().doc(`User/${matricula}`).get();
      const user = userSnap.data();
      nickname = (user?.User_Nickname as string) || (user?.Authentication_Name as string) || null;
    } catch (error) {
      console.error("[PartnerArea] Falha ao resolver o apelido do parceiro:", error);
    }
  }

  return (
    <div className="max-w-[1440px] mx-auto pt-[10px] px-6 md:px-12 pb-16 w-full">
      <PartnerHomeView nickname={nickname} />
    </div>
  );
}
