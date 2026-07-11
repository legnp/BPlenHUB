"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { MemberQuotaWallet, MemberQuota } from "@/types/entitlements";
import { getErrorMessage } from "@/lib/utils/errors";
import { safeSerialize } from "@/lib/utils/firestore";
import { normalizeQuotaKey, foldQuotaMap } from "@/lib/quota-keys";
import { getProductBySlug } from "./products"; // Se precisarmos buscar cotas do produto

const QUOTAS_COLLECTION = "Member_Quotas";

/**
 * BPlen HUB — Quota Engine ✨
 * Gestão de saldo e consumo de créditos de serviços.
 * Migrado para Hierarquia V3: User/{matricula}/User_Permissions/quotas
 */

/**
 * Helper: Resolve a matrícula de um UID via _AuthMap
 */
async function getMatriculaByUid(uid: string): Promise<string | null> {
  const db = getAdminDb();
  const mapSnap = await db.collection("_AuthMap").doc(uid).get();
  return mapSnap.exists ? mapSnap.data()?.matricula : null;
}

/**
 * Busca a carteira de cotas de um membro
 */
export async function getMemberQuotasAction(uid: string): Promise<MemberQuotaWallet | null> {
  try {
    const matricula = await getMatriculaByUid(uid);
    if (!matricula) throw new Error("Matrícula não vinculada ao UID.");

    const db = getAdminDb();
    const docPath = `User/${matricula}/User_Permissions/quotas`;
    const doc = await db.doc(docPath).get();

    if (!doc.exists) return null;
    const wallet = safeSerialize<MemberQuotaWallet>(doc.data());

    // Normalização canônica de chaves (BUG-008): dobra 1-TO-1/mentoria_1to1 ->
    // 1-to-1 e mescla duplicatas de case, para todo leitor ver a mesma chave.
    wallet.quotas = foldQuotaMap(wallet.quotas);

    return wallet;
  } catch (error) {
    console.error(`Erro ao buscar cotas do membro ${uid}:`, error);
    return null;
  }
}

/**
 * Adiciona cotas manualmente a um membro (Uso Administrativo ou Pós-Compra)
 */
export async function updateMemberQuotasAction(uid: string, newQuotas: Record<string, number>) {
  try {
    const matricula = await getMatriculaByUid(uid);
    if (!matricula) throw new Error("Matrícula não vinculada ao UID.");

    const db = getAdminDb();
    const docPath = `User/${matricula}/User_Permissions/quotas`;
    const walletRef = db.doc(docPath);
    
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(walletRef);
      const now = new Date().toISOString();

      // Normaliza + mescla as chaves ja existentes antes de somar (auto-cura o
      // drift de case a cada escrita — BUG-008). Chave canonica = minuscula do
      // catalogo; nao forcar mais UPPERCASE.
      const currentQuotas: Record<string, MemberQuota> = doc.exists
        ? foldQuotaMap((doc.data() as MemberQuotaWallet).quotas)
        : {};

      // Merge de Cotas
      for (const [type, amount] of Object.entries(newQuotas)) {
        const normalizedType = normalizeQuotaKey(type);
        const current = currentQuotas[normalizedType] || { total: 0, used: 0, lastUpdated: now };
        currentQuotas[normalizedType] = {
          total: current.total + amount,
          used: current.used,
          lastUpdated: now
        };
      }

      // Substitui o campo `quotas` inteiro (remove chaves-lixo de case antigas —
      // set(merge:true) NUNCA apaga chave de map, ver L16). update() falha se o
      // doc nao existir, entao usa set completo no primeiro deposito.
      if (doc.exists) {
        transaction.update(walletRef, { uid, quotas: currentQuotas, updatedAt: now });
      } else {
        transaction.set(walletRef, { uid, quotas: currentQuotas, updatedAt: now });
      }
    });

    return { success: true };
  } catch (error) {
    console.error(`Erro ao atualizar cotas do membro ${uid}:`, error);
    throw new Error("Falha ao atualizar carteira de cotas.");
  }
}

/**
 * Consome um crédito de serviço (ex: ao confirmar agendamento)
 */
export async function consumeQuotaAction(uid: string, eventTypeId: string) {
  try {
    const matricula = await getMatriculaByUid(uid);
    if (!matricula) throw new Error("Matrícula não vinculada ao UID.");

    const db = getAdminDb();
    const docPath = `User/${matricula}/User_Permissions/quotas`;
    const walletRef = db.doc(docPath);

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(walletRef);
      if (!doc.exists) throw new Error("Membro não possui carteira de cotas.");

      const wallet = doc.data() as MemberQuotaWallet;
      // Normaliza + mescla as chaves (BUG-008) antes de localizar a cota-alvo.
      const quotas = foldQuotaMap(wallet.quotas);

      const targetKey = normalizeQuotaKey(eventTypeId);
      const quota = quotas[targetKey];

      if (!quota || quota.used >= quota.total) {
        throw new Error(`Saldo insuficiente para o serviço: ${targetKey}`);
      }

      const updatedQuotas = {
        ...quotas,
        [targetKey]: {
          ...quota,
          used: (quota.used || 0) + 1,
          lastUpdated: new Date().toISOString()
        }
      };

      transaction.update(walletRef, { quotas: updatedQuotas });
    });

    return { success: true };
  } catch (error: unknown) {
    console.error(`Erro ao consumir cota do membro ${uid}:`, error);
    return { success: false, error: getErrorMessage(error) };
  }
}
