"use client";

import { useState } from "react";
import { 
  signInWithPopup, 
  GoogleAuthProvider 
} from "firebase/auth";

import { auth } from "@/lib/firebase";
import { useAuthContext } from "@/context/AuthContext";
// Server Action call (somos use client, então o Next cuidará com RPC fetch)
// Porém, como não temos a importação correta da Action porque não foi feita como export function de action,
// Vamos deixar o lado do Context cuidar das permissões, mas aqui também chamaremos a action
import { syncUserPermissionsOnLogin } from "@/actions/auth-permissions";
import { createSignedSessionCookie } from "@/actions/auth-session";

/**
 * BPlen HUB — useAuth (Central de Comandos de Autenticação)
 * Hook unificado para realizar Login com Google e Logout.
 */

export function useAuth() {
  const { user, loading, isAdmin, logout } = useAuthContext();
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  /**
   * Login com Google
   * Utiliza Popup para autenticação federada.
   */
  const signInWithGoogle = async (forceSelect = false) => {
    const provider = new GoogleAuthProvider();
    
    // Força a exibição do seletor de contas apenas se solicitado explicitamente (evita loops) 🛡️
    if (forceSelect) {
      provider.setCustomParameters({ prompt: "select_account" });
    }

    setIsLoggingIn(true);
    setError(null);

    try {
      // 1. Login no Firebase Client 🔐
      const result = await signInWithPopup(auth, provider);
      
      // 2. Criar Cookie de Sessão Assinado no Servidor (Aguardar confirmação) 🛡️
      const idToken = await result.user.getIdToken();
      const sessionResult = await createSignedSessionCookie(idToken);

      if (!sessionResult.success) {
        throw new Error(sessionResult.error || "Falha ao sincronizar sessão segura.");
      }
      
      // 3. Validação Silenciosa de Permissões de Negócio
      await syncUserPermissionsOnLogin(result.user.uid, result.user.email);
      
      return result.user;
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Erro no Login Google (Sincronizado):", error);
      setError(error.message || "Erro inesperado no login.");
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  };

  return {
    user,
    loading,
    error,
    isLoggingIn,
    isAdmin,
    signInWithGoogle,
    signOut: logout, // Mapeado para o logout global que limpa cookies 🛡️
  };
}
