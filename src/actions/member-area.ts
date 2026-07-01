"use server";

import { requireMemberAccess } from "@/lib/auth-guards";
import { getErrorMessage } from "@/lib/utils/errors";

/**
 * BPlen HUB — Member Area Actions (Acesso Restrito 🔒)
 * Camada de proteção server-side para operações na área de membros.
 */

export async function validateMemberAreaAccess(idToken?: string) {
  try {
    // 🛡️ Segurança Real no Servidor
    // Esta função joga um erro se o usuário não tiver o entitlement 'member_area_access'
    await requireMemberAccess(idToken);
    
    return { authorized: true };
  } catch (error: unknown) {
    console.error("❌ [Member Action] Falha na validação server-side:", getErrorMessage(error));
    return { authorized: false, error: getErrorMessage(error) };
  }
}
