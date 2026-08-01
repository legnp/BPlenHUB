"use server";

import * as admin from "firebase-admin";
import { headers } from "next/headers";
import { requireAuth } from "@/lib/auth-guards";
import { getAdminDb } from "@/lib/firebase-admin";
import { findMatriculaByIdentity } from "@/lib/identity/find-matricula";
import {
  CONSENT_VERSION,
  isAdult,
  needsConsentGate,
  deviceTypeFromUserAgent,
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
      return { success: false, error: "E necessario ter 18 anos ou mais para usar a BPlen HUB." };
    }

    // Resolve-ou-mina a matricula pela via canonica (mesma da welcome survey; PF
    // por default, como ja e hoje). Identidade da sessao verificada.
    const { resolveUserIdentity } = await import("@/lib/survey/identity");
    const matricula = await resolveUserIdentity("welcome_survey", {}, session.uid);

    // Prova do aceite: IP + user-agent + geo aproximada por IP (edge headers).
    const hdrs = await headers();
    const ip =
      hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      hdrs.get("x-real-ip") ||
      "desconhecido";
    const userAgent = hdrs.get("user-agent") || "desconhecido";
    const decode = (v: string | null): string => {
      if (!v) return "";
      try {
        return decodeURIComponent(v);
      } catch {
        return v;
      }
    };
    const geo = {
      country: hdrs.get("x-vercel-ip-country") || "",
      region: decode(hdrs.get("x-vercel-ip-country-region")),
      city: decode(hdrs.get("x-vercel-ip-city")),
      latitude: hdrs.get("x-vercel-ip-latitude") || "",
      longitude: hdrs.get("x-vercel-ip-longitude") || "",
    };

    const record = {
      version: CONSENT_VERSION,
      termsAccepted: true,
      privacyAccepted: true,
      over18: true,
      birthDate: input.birthDate,
      newsletterOptIn: !!input.newsletterOptIn,
      acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
      ip,
      userAgent,
      deviceType: deviceTypeFromUserAgent(userAgent),
      geo,
    };

    const db = getAdminDb();
    // Ultimo aceite (fonte da checagem do gate).
    await db.doc(`User/${matricula}/User_Consent/current`).set(record, { merge: true });
    // Trilha append-only (auditoria LGPD — cada aceite versionado).
    await db.collection(`User/${matricula}/User_Consent_History`).add(record);
    // Pre-preenche a data de nascimento no perfil (evita re-perguntar no cadastro).
    await db.doc(`User/${matricula}`).set({ profile: { birthDate: input.birthDate } }, { merge: true });

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[consent] Falha ao registrar consentimento:", message);
    return { success: false, error: "Nao foi possivel registrar o aceite agora. Tente novamente." };
  }
}
