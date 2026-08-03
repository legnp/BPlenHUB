"use server";

import * as admin from "firebase-admin";
import { after } from "next/server";
import { requireAuth } from "@/lib/auth-guards";
import { getAdminDb } from "@/lib/firebase-admin";
import { findMatriculaByIdentity } from "@/lib/identity/find-matricula";
import { captureRequestProof } from "@/lib/request-proof";
import {
  CONSENT_VERSION,
  isAdult,
  needsConsentGate,
} from "@/lib/consent/consent";

/**
 * BPlen HUB — Consentimento de conta (gate de Boas-vindas — Fase 2).
 *
 * Registro versionado do aceite de Termos + Privacidade + 18+ (LGPD). Identidade
 * SEMPRE da sessao verificada (requireAuth), nunca de parametro do cliente
 * (BUG-032/106). Idade re-validada no servidor (defesa em profundidade). Captura
 * geolocalizacao aproximada por IP (headers de edge, nao-invasiva — mesmo padrao
 * do carimbo de contrato em legal.ts) e tipo de dispositivo, para prova do aceite.
 */

/** Status do gate para o usuario logado. `needsGate` = precisa aceitar/reaceitar. */
export async function getConsentStatusAction(): Promise<{ needsGate: boolean; birthDate?: string }> {
  try {
    const session = await requireAuth();
    // Sem mint aqui: so leitura. Sem matricula ainda = gate aparece (o aceite mina).
    const matricula = await findMatriculaByIdentity(session.uid, session.email || undefined);
    if (!matricula) return { needsGate: true };

    const db = getAdminDb();
    const snap = await db.doc(`User/${matricula}/User_Consent/current`).get();
    const acceptedVersion = snap.exists ? (snap.data()?.version as string | undefined) : null;

    // Pre-preenche a data de nascimento (do aceite anterior ou do perfil).
    let birthDate = snap.exists ? (snap.data()?.birthDate as string | undefined) : undefined;
    if (!birthDate) {
      const userSnap = await db.doc(`User/${matricula}`).get();
      birthDate = (userSnap.data()?.profile?.birthDate as string | undefined) || undefined;
    }

    return { needsGate: needsConsentGate(acceptedVersion), birthDate };
  } catch (error: unknown) {
    // Fail-open: um erro transitorio nao deve trancar o hub inteiro; o gate
    // reaparece na proxima checagem. O aceite continua exigido em cargas normais.
    const message = error instanceof Error ? error.message : String(error);
    console.error("[consent] Falha ao ler status de consentimento:", message);
    return { needsGate: false };
  }
}

/** Registra o aceite (versionado, com prova). Retorna erro claro se menor de 18. */
export async function recordConsentAction(input: {
  birthDate: string;
  newsletterOptIn: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireAuth();

    // Trava de 18+ no servidor (nunca confiar no cliente).
    if (!isAdult(input.birthDate, new Date())) {
      return { success: false, error: "É necessário ter 18 anos ou mais para usar a BPlen HUB." };
    }

    // Resolve-ou-mina a matricula pela via canonica (mesma da welcome survey; PF
    // por default, como ja e hoje). Identidade da sessao verificada.
    const { resolveUserIdentity } = await import("@/lib/survey/identity");
    const matricula = await resolveUserIdentity("welcome_survey", {}, session.uid);

    // Prova do aceite: IP + user-agent + geo aproximada por IP (edge headers).
    // Captura extraida para `lib/request-proof.ts` — mesma leitura de antes, agora
    // compartilhada com o registro de cookies e de acessos.
    const proof = await captureRequestProof();

    const record = {
      version: CONSENT_VERSION,
      termsAccepted: true,
      privacyAccepted: true,
      over18: true,
      birthDate: input.birthDate,
      newsletterOptIn: !!input.newsletterOptIn,
      acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
      ip: proof.ip,
      userAgent: proof.userAgent,
      deviceType: proof.deviceType,
      geo: proof.geo,
    };

    const db = getAdminDb();
    // Ultimo aceite (fonte da checagem do gate).
    await db.doc(`User/${matricula}/User_Consent/current`).set(record, { merge: true });
    // Trilha append-only (auditoria LGPD — cada aceite versionado).
    await db.collection(`User/${matricula}/User_Consent_History`).add(record);
    // Pre-preenche a data de nascimento no perfil (evita re-perguntar no cadastro).
    await db.doc(`User/${matricula}`).set({ profile: { birthDate: input.birthDate } }, { merge: true });

    // Comprovante na pasta do usuario. Fora do caminho critico (`after`): o gate e
    // bloqueante na tela, e a ida ao Drive custa varias chamadas de API — o aceite
    // ja esta gravado com prova no Firestore quando isto roda.
    after(async () => {
      try {
        const { syncConsentAcceptanceToDrive } = await import("@/lib/drive-sync");
        await syncConsentAcceptanceToDrive(matricula, {
          version: CONSENT_VERSION,
          birthDate: input.birthDate,
          newsletterOptIn: !!input.newsletterOptIn,
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
        console.error("[consent] Falha ao gravar comprovante no acervo do usuario:", message);
      }
    });

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[consent] Falha ao registrar consentimento:", message);
    return { success: false, error: "Não foi possível registrar o aceite agora. Tente novamente." };
  }
}
