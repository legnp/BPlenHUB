"use server";

import * as admin from "firebase-admin";
import { after } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { verifySignedSession } from "@/actions/auth-session";
import { findMatriculaByIdentity } from "@/lib/identity/find-matricula";
import { captureRequestProof } from "@/lib/request-proof";
import { CONSENT_VERSION } from "@/lib/consent/consent";
import { isCookieChoice } from "@/lib/consent/cookie-consent";
import { ANON_MATRICULA } from "@/lib/survey/identity";

/**
 * BPlen HUB — Registro da preferencia de cookies (LGPD).
 *
 * O banner gravava a escolha apenas no `localStorage`: nao havia prova nenhuma do
 * lado do servidor de que a pessoa escolheu, o que escolheu e quando, e a
 * preferencia se perdia ao limpar o navegador.
 *
 * Escopo (decisao da Gestora, revista em 2026-08-05): usuario identificado tem a
 * escolha registrada e espelhada na pasta dele, com prova completa. Visitante
 * anonimo passou a ser registrado tambem, na pasta unica `BP-ANON` — porem com
 * registro REDUZIDO, sem IP e sem user-agent, e em planilha particionada por mes.
 * A decisao anterior era nao registrar anonimo; mudou porque a pasta de anonimos
 * ja existia e ja recebia survey e formulario sem login.
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

    // Sem sessao (ou sem identidade ainda) = visitante anonimo: a escolha vai
    // para a pasta unica de anonimos, `BP-ANON`, que ja recebe survey e
    // formulario respondidos sem login. Continua valendo a invariante: NAO se
    // cunha matricula aqui.
    const caller = await verifySignedSession();
    const matricula = caller
      ? await findMatriculaByIdentity(caller.uid, caller.email || undefined)
      : null;
    const isAnonymous = !matricula;
    const targetMatricula = matricula ?? ANON_MATRICULA;

    const proof = await captureRequestProof();

    // Anonimo grava um registro REDUZIDO: sem IP e sem user-agent. Ver a nota em
    // `syncCookiePreferenceToDrive` — cobrar preco de privacidade de quem pediu
    // menos rastreamento seria contraditorio, e o pais ja basta como contexto.
    const record = {
      choice,
      version: CONSENT_VERSION,
      recordedAt: admin.firestore.FieldValue.serverTimestamp(),
      deviceType: proof.deviceType,
      ...(isAnonymous
        ? { anonymous: true, country: proof.geo.country }
        : { ip: proof.ip, userAgent: proof.userAgent, geo: proof.geo }),
    };

    const db = getAdminDb();
    // Trilha append-only (o que ja valeu) — sempre.
    await db.collection(`User/${targetMatricula}/User_Consent_Cookies_History`).add(record);
    // Escolha vigente (o que vale hoje) — SO para usuario identificado. Em
    // `BP-ANON` o documento e compartilhado: cada visitante sobrescreveria o
    // anterior, e "a escolha vigente do anonimo" nao significa nada.
    if (!isAnonymous) {
      await db.doc(`User/${targetMatricula}/User_Consent/cookies`).set(record, { merge: true });
    }

    // Espelho no acervo fora do caminho critico: o banner fecha na hora.
    after(async () => {
      try {
        const { syncCookiePreferenceToDrive } = await import("@/lib/drive-sync");
        await syncCookiePreferenceToDrive(targetMatricula, {
          choice,
          version: CONSENT_VERSION,
          anonymous: isAnonymous,
          proof: {
            ip: isAnonymous ? "" : proof.ip,
            userAgent: isAnonymous ? "" : proof.userAgent,
            deviceType: proof.deviceType,
            // Anonimo fica so no pais; identificado leva cidade/regiao/pais.
            location: isAnonymous ? proof.geo.country : proof.location,
            acceptedAt: proof.capturedAt,
          },
        });
      } catch (driveError: unknown) {
        const message = driveError instanceof Error ? driveError.message : String(driveError);
        console.error("[cookie-consent] Falha ao espelhar preferencia no acervo:", message);
      }
    });

    // `persisted` continua significando "gravado na conta DELE". O anonimo foi
    // registrado, mas a escolha segue pendente de espelhamento para o dia em que
    // essa pessoa tiver conta — e o resgate no login depende disso.
    return { success: true, persisted: !isAnonymous };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[cookie-consent] Falha ao registrar preferencia de cookies:", message);
    return { success: false, persisted: false };
  }
}
