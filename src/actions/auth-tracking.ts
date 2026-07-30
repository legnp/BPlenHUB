"use server";

import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-guards";
import { buildAuthFunnel } from "@/lib/auth-funnel";
import { AUTH_MAP_COLLECTION, USER_COLLECTION } from "@/config/collections";
import { getErrorMessage } from "@/lib/utils/errors";
import type {
  AuthFunnelResult,
  RawAuthMap,
  RawAuthUser,
  RawUserDoc,
} from "@/types/auth-funnel";

/**
 * BPlen HUB — Aba Autenticacoes (funil de recepcao), leitura read-only.
 *
 * Junta em tempo de leitura tres fontes ja existentes (contas de login +
 * `_AuthMap` + `User`), classifica cada pessoa nos 3 estagios do funil e aplica
 * a mascara de identidade interna. Nenhuma escrita, nenhum indice novo, nenhuma
 * mudanca de schema — funciona retroativamente sobre a base atual.
 *
 * Ver `docs/system-audit/AUTH-TRACKING-DESIGN.md`.
 */

/** Converte a data de metadata do login (string) em ISO seguro, ou `null`. */
function toIsoOrNull(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export async function getAuthFunnelAction(
  adminToken?: string
): Promise<{ success: boolean; data?: AuthFunnelResult; error?: string }> {
  try {
    // Paridade com getAdminUsersList: trava administrativa no servidor.
    await requireAdmin(adminToken);

    // 1. Contas de login — loop de pageToken para nao truncar no teto de 1000.
    const authUsers: RawAuthUser[] = [];
    let pageToken: string | undefined = undefined;
    do {
      const page = await getAdminAuth().listUsers(1000, pageToken);
      for (const u of page.users) {
        authUsers.push({
          uid: u.uid,
          email: u.email ?? null,
          displayName: u.displayName ?? null,
          provider: u.providerData?.[0]?.providerId ?? null,
          creationTime: toIsoOrNull(u.metadata?.creationTime),
          lastSignInTime: toIsoOrNull(u.metadata?.lastSignInTime),
          disabled: u.disabled === true,
        });
      }
      pageToken = page.pageToken;
    } while (pageToken);

    // 2. `_AuthMap` e `User` por varredura completa (mesma ordem de grandeza
    //    que getAdminUsersList ja paga hoje).
    const db = getAdminDb();
    const [authMapSnap, usersSnap] = await Promise.all([
      db.collection(AUTH_MAP_COLLECTION).get(),
      db.collection(USER_COLLECTION).get(),
    ]);

    const authMaps: RawAuthMap[] = authMapSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        matricula: typeof data.matricula === "string" ? data.matricula : null,
        recovered: Boolean(data.recoveredAt),
      };
    });

    const users: RawUserDoc[] = usersSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        matricula: doc.id,
        uid: typeof data.uid === "string" && data.uid ? data.uid : null,
        email: data.email || data.User_Email || null,
        name: data.Authentication_Name || data.User_Name || null,
        hasCompletedWelcome: data.hasCompletedWelcome === true,
      };
    });

    // 3. Join + classificacao + mascara + agregados (funcao pura testavel).
    const result = buildAuthFunnel({ authUsers, authMaps, users });

    return { success: true, data: result };
  } catch (error: unknown) {
    console.error("[Auth Funnel] Falha ao montar o funil de autenticacoes:", getErrorMessage(error));
    return { success: false, error: getErrorMessage(error, "Falha ao carregar o funil de autenticacoes.") };
  }
}
