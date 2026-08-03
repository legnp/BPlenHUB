import type { User } from "firebase/auth";
import { createSignedSessionCookie } from "@/actions/auth-session";
import { syncUserPermissionsOnLogin } from "@/actions/auth-permissions";
import { recordLoginOrigin } from "@/actions/auth-login-metadata";
import { recordCookiePreferenceAction } from "@/actions/cookie-consent";
import {
  hasPendingCookieSync,
  markCookieChoiceSynced,
  readStoredCookieChoice,
} from "@/lib/consent/cookie-consent";

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
    throw new Error(sessionResult.error || "Falha ao sincronizar a sessão segura.");
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

  // Espelha a escolha de cookies feita ANTES do login. O banner aparece na area
  // publica, quando quase ninguem esta identificado ainda, e nao volta depois —
  // sem este resgate a preferencia da maioria nunca sairia do navegador.
  try {
    if (hasPendingCookieSync()) {
      const choice = readStoredCookieChoice();
      if (choice) {
        const result = await recordCookiePreferenceAction(choice);
        if (result.persisted) markCookieChoiceSynced();
      }
    }
  } catch {
    // Idem: preferencia ja vale localmente, e a tentativa se repete no proximo login.
  }
}
