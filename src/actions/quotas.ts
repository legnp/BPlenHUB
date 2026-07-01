"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { MemberQuotaWallet, MemberQuota } from "@/types/entitlements";
import { getErrorMessage } from "@/lib/utils/errors";
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
    return doc.data() as MemberQuotaWallet;
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
      let currentQuotas: Record<string, MemberQuota> = {};

      if (doc.exists) {
        currentQuotas = (doc.data() as MemberQuotaWallet).quotas;
      }

      // Merge de Cotas
      for (const [type, amount] of Object.entries(newQuotas)) {
        // Normalização de chave 1-to-1 e uppercase para consistência
        const normalizedType = type === "mentoria_1to1" ? "1-TO-1" : type.toUpperCase();
        
        const current = currentQuotas[normalizedType] || { total: 0, used: 0, lastUpdated: now };
        currentQuotas[normalizedType] = {
          total: current.total + amount,
          used: current.used,
          lastUpdated: now
        };
      }

      transaction.set(walletRef, {
        uid,
        quotas: currentQuotas,
        updatedAt: now
      }, { merge: true });
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
      const quotas = wallet.quotas || {};
      
      // Normalização: mentoria_1to1 -> 1-to-1
      let targetKey = eventTypeId;
      if (targetKey === "mentoria_1to1") targetKey = "1-to-1";
      
      if (quotas["mentoria_1to1"] && !quotas["1-to-1"]) {
         quotas["1-to-1"] = quotas["mentoria_1to1"];
         delete quotas["mentoria_1to1"];
      }

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
