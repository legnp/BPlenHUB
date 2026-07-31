"use client";

import { useState } from "react";
import {
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  type AuthProvider,
  type OAuthCredential,
  type User,
} from "firebase/auth";

import { auth } from "@/lib/firebase";
import { useAuthContext } from "@/context/AuthContext";
import { finalizeClientSession } from "@/lib/auth/finalize-session";

/**
 * BPlen HUB — useAuth (Central de Comandos de Autenticacao)
 *
 * Login federado generico por provedor (`signInWith`) + fluxo de vinculo de
 * conta quando o mesmo e-mail ja existe com outro provedor
 * (`account-exists-with-different-credential`). Ver
 * docs/system-audit/AUTH-PROVIDERS-EXPANSION.md (secoes 3 e 4).
 *
 * Invariante de identidade preservada (BUG-032/106): apos autenticar, a sessao e
 * cunhada a partir do ID Token VERIFICADO pelo Admin SDK
 * (`createSignedSessionCookie`); as permissoes sao sincronizadas com o e-mail que
 * o servidor le do proprio cookie, nunca de parametro do cliente.
 */

export type LoginProviderId = "google.com" | "microsoft.com";

/** Estado de um vinculo pendente: conta ja existe com outro provedor. */
export interface PendingLink {
  email: string;
  /** Provedores com que o e-mail ja pode entrar (dica; pode vir vazio). */
  methods: string[];
  /** Provedor que o usuario tentou usar agora (o que sera vinculado). */
  attemptedProvider: LoginProviderId;
  /** Credencial pendente do provedor tentado, a ser vinculada apos re-login. */
  credential: OAuthCredential | null;
}

function buildProvider(providerId: LoginProviderId, forceSelect: boolean): AuthProvider {
  if (providerId === "microsoft.com") {
    const provider = new OAuthProvider("microsoft.com");
    if (forceSelect) provider.setCustomParameters({ prompt: "select_account" });
    return provider;
  }
  const provider = new GoogleAuthProvider();
  if (forceSelect) provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

function credentialFromError(providerId: LoginProviderId, error: unknown): OAuthCredential | null {
  return providerId === "microsoft.com"
    ? OAuthProvider.credentialFromError(error as never)
    : GoogleAuthProvider.credentialFromError(error as never);
}

function readErrorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  return "";
}

function readErrorEmail(error: unknown): string {
  if (error && typeof error === "object" && "customData" in error) {
    const custom = (error as { customData?: { email?: unknown } }).customData;
    if (custom && typeof custom.email === "string") return custom.email;
  }
  return "";
}

/** Deduz um provedor de login a partir da lista de metodos do Firebase. */
function methodsToProviderId(methods: string[]): LoginProviderId {
  if (methods.includes("microsoft.com")) return "microsoft.com";
  return "google.com";
}

export function useAuth() {
  const { user, loading, isAdmin, logout } = useAuthContext();
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [pendingLink, setPendingLink] = useState<PendingLink | null>(null);

  /**
   * Login federado generico. Retorna o usuario autenticado, ou `null` quando o
   * fluxo precisa de vinculo (conta ja existe com outro provedor) — nesse caso
   * `pendingLink` e populado para a UI oferecer o passo de vinculo.
   */
  const signInWith = async (
    providerId: LoginProviderId,
    opts: { forceSelect?: boolean; origin?: string } = {}
  ): Promise<User | null> => {
    setIsLoggingIn(true);
    setError(null);

    try {
      const provider = buildProvider(providerId, opts.forceSelect ?? false);
      const result = await signInWithPopup(auth, provider);
      await finalizeClientSession(result.user, opts.origin);
      setPendingLink(null);
      return result.user;
    } catch (err: unknown) {
      const code = readErrorCode(err);

      // Conta ja existe com o mesmo e-mail via outro provedor: nao e falha —
      // guardamos a credencial pendente e sinalizamos o passo de vinculo.
      if (code === "auth/account-exists-with-different-credential") {
        const email = readErrorEmail(err);
        let methods: string[] = [];
        try {
          if (email) methods = await fetchSignInMethodsForEmail(auth, email);
        } catch {
          // Protecao de enumeracao pode bloquear a consulta; seguimos sem a dica.
          methods = [];
        }
        setPendingLink({
          email,
          methods,
          attemptedProvider: providerId,
          credential: credentialFromError(providerId, err),
        });
        setError(
          "Este e-mail ja tem uma conta BPlen com outro meio de acesso. Entre pelo metodo original para vincular os dois."
        );
        return null;
      }

      // Popup fechado/cancelado pelo usuario nao e erro a exibir.
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        return null;
      }

      const message = err instanceof Error ? err.message : "Erro inesperado no login.";
      console.error("[useAuth] Falha no login federado:", message);
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  /**
   * Conclui o vinculo pendente: reautentica com o provedor PRIMARIO (o que a
   * conta ja usa) e vincula a credencial do provedor tentado. Resultado: um uid,
   * uma matricula, dois jeitos de entrar (secao 3 do plano).
   */
  const completePendingLink = async (origin?: string): Promise<User | null> => {
    if (!pendingLink) return null;
    setIsLoggingIn(true);
    setError(null);
    try {
      const primaryId = methodsToProviderId(pendingLink.methods);
      const result = await signInWithPopup(auth, buildProvider(primaryId, true));
      if (pendingLink.credential) {
        await linkWithCredential(result.user, pendingLink.credential);
      }
      await finalizeClientSession(result.user, origin);
      setPendingLink(null);
      return result.user;
    } catch (err: unknown) {
      const code = readErrorCode(err);
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        return null;
      }
      const message = err instanceof Error ? err.message : "Falha ao vincular a conta.";
      console.error("[useAuth] Falha ao vincular conta:", message);
      setError(message);
      return null;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const cancelPendingLink = () => {
    setPendingLink(null);
    setError(null);
  };

  /** Compatibilidade: mantem a assinatura antiga usada por telas existentes. */
  const signInWithGoogle = (forceSelect = false) => signInWith("google.com", { forceSelect });

  return {
    user,
    loading,
    error,
    isLoggingIn,
    isAdmin,
    pendingLink,
    signInWith,
    signInWithGoogle,
    completePendingLink,
    cancelPendingLink,
    signOut: logout,
  };
}
