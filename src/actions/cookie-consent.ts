"use server";

import * as admin from "firebase-admin";
import { after } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { verifySignedSession } from "@/actions/auth-session";
import { findMatriculaByIdentity } from "@/lib/identity/find-matricula";
import { captureRequestProof } from "@/lib/request-proof";
import { CONSENT_VERSION } from "@/lib/consent/consent";
import { isCookieChoice } from "@/lib/consent/cookie-consent";

/**
 * BPlen HUB — Registro da preferencia de cookies (LGPD).
 *
 * O banner gravava a escolha apenas no `localStorage`: nao havia prova nenhuma do
 * lado do servidor de que a pessoa escolheu, o que escolheu e quando, e a
 * preferencia se perdia ao limpar o navegador.
 *
 * Escopo decidido pela Gestora: usuario identificado tem a escolha registrada no
 * Firestore e espelhada na pasta dele; visitante anonimo segue apenas em
 * `localStorage`, para nao criar registro de quem nunca abriu conta.
 *
 * Invariante de identidade: aqui NAO se cunha matricula. `recordConsentAction`
 * usa `resolveUserIdentity` (que mina) porque o aceite de termos e o ato que
 * inaugura a conta; um clique em banner de cookie nao e — cunhar por causa dele
 * encheria a base de identidades fantasma. Por isso a busca e read-only.
 */
export async function recordCookiePreferenceAction(
  choice: string
): Promise<{ success: boolean; persisted: boolean }> {
  try {
    // Valor fechado: o cliente escolhe entre duas opcoes, nao escreve texto livre.
    if (!isCookieChoice(choice)) {
      return { success: false, persisted: false };
    }

    // Sem sessao = visitante anonimo. Nao e erro: e o caminho previsto.
    const caller = await verifySignedSession();
    if (!caller) return { success: true, persisted: false };

    const matricula = await findMatriculaByIdentity(caller.uid, caller.email || undefined);
    if (!matricula) return { success: true, persisted: false };

    const proof = await captureRequestProof();

    const record = {
      choice,
      version: CONSENT_VERSION,
      recordedAt: admin.firestore.FieldValue.serverTimestamp(),
      ip: proof.ip,
      userAgent: proof.userAgent,
      deviceType: proof.deviceType,
      geo: proof.geo,
    };

    const db = getAdminDb();
    // Escolha vigente (o que vale hoje) + trilha append-only (o que ja valeu).
    await db.doc(`User/${matricula}/User_Consent/cookies`).set(record, { merge: true });
    await db.collection(`User/${matricula}/User_Consent_Cookies_History`).add(record);

    // Espelho no acervo do usuario fora do caminho critico: o banner fecha na hora.
    after(async () => {
      try {
        const { syncCookiePreferenceToDrive } = await import("@/lib/drive-sync");
        await syncCookiePreferenceToDrive(matricula, {
          choice,
          version: CONSENT_VERSION,
          proof: {
            ip: proof.ip,
            userAgent: proof.userAgent,
            deviceType: proof.deviceType,
            location: proof.location,
            acceptedAt: proof.capturedAt,
          },
        });
      } catch (driveError: unknown) {
        const message = driveError instanceof Error ? driveError.message : String(driveError);
        console.error("[cookie-consent] Falha ao espelhar preferencia no acervo:", message);
      }
    });

    return { success: true, persisted: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[cookie-consent] Falha ao registrar preferencia de cookies:", message);
    return { success: false, persisted: false };
  }
}
