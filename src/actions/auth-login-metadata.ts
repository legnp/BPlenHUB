"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { verifySignedSession } from "@/actions/auth-session";
import { normalizeProvider } from "@/lib/auth/identity-guards";

/**
 * BPlen HUB — Captura de origin/provider do login (metadado analitico).
 *
 * Registra em `_AuthMap/{uid}` o provedor usado (do claim VERIFICADO da sessao) e
 * a superficie de origem (contexto de UI), alem do carimbo do ultimo login. NAO e
 * identidade e NAO decide autorizacao — e telemetria de funil (casa com o
 * follow-up de captura de origin/provider ja registrado; a cunhagem completa da
 * matricula com provider fica no fluxo de Boas-vindas, fase posterior).
 *
 * Seguranca: age SOMENTE sobre o proprio uid do chamador (BUG-032). O provedor
 * nunca vem do cliente — apenas o `origin` (rotulo de UI) e recebido, e mesmo ele
 * so entra como metadado, jamais como decisao.
 *
 * Nao-criacao (invariante de identidade): so ANOTA um `_AuthMap` que JA existe;
 * nunca o cria. Criar um mapeamento so com metadado (sem `matricula`) sombrearia o
 * auto-heal-por-e-mail de `syncUserPermissionsOnLogin`/`findMatriculaByIdentity`
 * num login futuro (o branch de cura so roda quando o doc NAO existe). O mapeamento
 * real e cunhado pelo login/Boas-vindas; aqui so acrescentamos telemetria por cima.
 */

const ALLOWED_ORIGINS = new Set([
  "entrar_page",
  "entrar_magic_link",
  "home_floating",
  "invite",
  "checkout",
  "unknown",
]);

function normalizeOrigin(origin: string | null | undefined): string {
  if (typeof origin === "string" && ALLOWED_ORIGINS.has(origin)) return origin;
  return "unknown";
}

export async function recordLoginOrigin(
  origin: string | null
): Promise<{ success: boolean }> {
  try {
    // So o dono da sessao pode registrar o proprio metadado.
    const caller = await verifySignedSession();
    if (!caller) return { success: false };

    // So anota um mapeamento existente — nunca cria (ver contrato acima).
    const ref = getAdminDb().collection("_AuthMap").doc(caller.uid);
    const snap = await ref.get();
    if (!snap.exists) return { success: false };

    await ref.update({
      lastProvider: normalizeProvider(caller.provider),
      lastOrigin: normalizeOrigin(origin),
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[auth-login-metadata] Falha ao registrar origin/provider:", message);
    return { success: false };
  }
}
