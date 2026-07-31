import type { User } from "firebase/auth";
import { createSignedSessionCookie } from "@/actions/auth-session";
import { syncUserPermissionsOnLogin } from "@/actions/auth-permissions";
import { recordLoginOrigin } from "@/actions/auth-login-metadata";

/**
 * BPlen HUB — Finalizacao de sessao no cliente (fonte unica).
 *
 * Centraliza o plumbing pos-autenticacao compartilhado por TODOS os provedores
 * (Google, Microsoft, magic link) para nao divergir entre pontos de entrada
 * (Licao 44/21 — consolidar identidade numa fonte unica antes de endurecer).
 *
 * Invariante preservada (BUG-032/106): a sessao e cunhada a partir do ID Token
 * VERIFICADO pelo Admin SDK; a sincronizacao de permissoes le o e-mail do proprio
 * cookie no servidor, nunca de parametro do cliente.
 */
export async function finalizeClientSession(
  loggedUser: User,
  origin?: string
): Promise<void> {
  const idToken = await loggedUser.getIdToken();
  const sessionResult = await createSignedSessionCookie(idToken);
  if (!sessionResult.success) {
    throw new Error(sessionResult.error || "Falha ao sincronizar sessao segura.");
  }
  await syncUserPermissionsOnLogin(loggedUser.uid, loggedUser.email);

  // Metadado analitico (origin/provider) — best-effort, nunca bloqueia o login.
  // provider vem do claim VERIFICADO da sessao (nao do cliente); origin e a
  // superficie de entrada (contexto de UI).
  try {
    await recordLoginOrigin(origin ?? null);
  } catch {
    // Captura de metadado e nao-critica: falha aqui nao afeta a autenticacao.
  }
}
