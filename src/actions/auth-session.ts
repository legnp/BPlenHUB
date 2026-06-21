"use server";

import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase-admin";

/**
 * BPlen HUB — Auth Session Actions (Segurança Criptográfica 🛡️)
 * Gerencia cookies de sessão ASSINADOS pelo Firebase Admin SDK.
 * O cookie contém um token criptograficamente verificável — não pode ser forjado.
 */

const SESSION_COOKIE_NAME = "bplen_session";
const SESSION_EXPIRATION = 60 * 60 * 24 * 7 * 1000; // 7 dias em milissegundos

/**
 * Cria um cookie de sessão assinado a partir do ID Token do cliente.
 * O Firebase Admin SDK gera um cookie criptograficamente verificável.
 *
 * @param idToken Token de identidade JWT obtido do Firebase Auth client.
 */
export async function createSignedSessionCookie(idToken: string) {
  try {
    const auth = getAdminAuth();

    // 1. Verificar que o token é válido e recente (emitido nos últimos 5 minutos)
    const decodedToken = await auth.verifyIdToken(idToken, true);
    const authTime = decodedToken.auth_time * 1000;
    const now = Date.now();

    if (now - authTime > 5 * 60 * 1000) {
      console.warn("⚠️ [Session] Token antigo rejeitado. Usuário deve re-autenticar.");
      return { success: false, error: "Token expirado. Faça login novamente." };
    }

    // 2. Criar Session Cookie assinado pelo Firebase Admin
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRATION,
    });

    // 3. Gravar o cookie assinado (httpOnly, secure, sameSite)
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 dias em segundos
    });

    console.log(`✅ [Session] Cookie assinado criado para UID: ${decodedToken.uid}`);
    return { success: true, action: "created" };

  } catch (error: unknown) {
    const err = error as Error;
    console.error("❌ [Session] Falha ao criar cookie assinado:", err.message);
    return { success: false, error: err.message || "Erro ao criar sessão." };
  }
}

/**
 * Verifica o cookie de sessão assinado e retorna os dados do usuário.
 * Retorna null se o cookie for inválido, expirado ou ausente.
 */
export async function verifySignedSession(): Promise<{ uid: string; email?: string } | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) return null;

    // Verificação criptográfica via Firebase Admin
    const auth = getAdminAuth();
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email,
    };
  } catch (error) {
    // Cookie inválido, expirado ou revogado — limpar silenciosamente
    console.warn("⚠️ [Session] Cookie inválido ou expirado, limpando...");
    await clearSessionCookie();
    return null;
  }
}

/**
 * Remove o cookie de sessão (Logout).
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  // Limpar o novo cookie assinado
  cookieStore.delete(SESSION_COOKIE_NAME);
  // Limpar o cookie legado (UID plaintext) caso ainda exista
  cookieStore.delete("bplen_session_uid");

  return { success: true, action: "cleared" };
}

/**
 * Verifica rapidamente se existe um cookie de sessão (sem validação criptográfica).
 * Usado pelo proxy para decisões de rota rápidas.
 */
export async function hasServerSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.has(SESSION_COOKIE_NAME) || cookieStore.has("bplen_session_uid");
}
