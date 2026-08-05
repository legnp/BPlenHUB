"use server";

import * as admin from "firebase-admin";
import { requireAuth } from "@/lib/auth-guards";
import { getAdminDb } from "@/lib/firebase-admin";
import { resolveUserPermissions } from "@/lib/user-permissions";

/**
 * Pop-up de boas-vindas ao parceiro — aparece UMA vez, quando o acesso e' liberado.
 *
 * O "ja vi" mora no banco, e nao so no navegador: localStorage sozinho faria o pop-up
 * reaparecer em outro dispositivo, em aba anonima ou depois de limpar o navegador — e a
 * Gestora pediu uma vez, nao uma vez por navegador. O client ainda guarda uma copia
 * local, mas apenas para nao piscar entre a montagem da tela e a resposta do servidor.
 */

/** O parceiro deve ver o pop-up agora? */
export async function shouldShowPartnerWelcomeAction(): Promise<{ show: boolean }> {
  try {
    const session = await requireAuth();
    const { matricula, services } = await resolveUserPermissions(session.uid);

    // Sem selo nao ha pop-up — inclusive para quem perdeu o acesso antes de ve-lo.
    if (!matricula || services?.partner_area_access !== true) return { show: false };

    const snap = await getAdminDb().doc(`User/${matricula}/User_Flags/partner_welcome`).get();
    return { show: snap.data()?.seenAt === undefined };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[partner-welcome] Falha ao checar o pop-up de boas-vindas:", message);
    // Fail-closed no incomodo: em erro transitorio, nao mostramos o pop-up. Perder uma
    // exibicao e' melhor do que repeti-la a cada carregamento.
    return { show: false };
  }
}

/** Registra que o parceiro ja viu o pop-up. Idempotente. */
export async function markPartnerWelcomeSeenAction(): Promise<{ success: boolean }> {
  try {
    const session = await requireAuth();
    const { matricula } = await resolveUserPermissions(session.uid);
    if (!matricula) return { success: false };

    await getAdminDb()
      .doc(`User/${matricula}/User_Flags/partner_welcome`)
      .set({ seenAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[partner-welcome] Falha ao registrar o pop-up como visto:", message);
    return { success: false };
  }
}
