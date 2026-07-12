"use server";

import admin, { getAdminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth-guards";
import { Product } from "@/types/products";
import { PRODUCTS_COLLECTION } from "@/config/collections";
import { getErrorMessage } from "@/lib/utils/errors";
import { foldQuotaMap, normalizeQuotaKey } from "@/lib/quota-keys";

/**
 * BPlen HUB — Delivery Engine (Server Actions) 🏁📡
 * Lógica para gerenciar o progresso e entrega de serviços aos membros.
 */

interface DeliveryStatus {
  productId: string;
  completedMilestones: string[];
  lastAccessed: string;
}

/**
 * Busca os dados necessários para renderizar o Portal de Entrega.
 * Valida permissão, busca o produto e calcula o progresso automático.
 */
export async function getServiceDeliveryDataAction(slug: string, idToken?: string) {
  try {
    const session = await requireAuth(idToken);
    const db = getAdminDb();

    // 🕵️ 1. Buscar o Produto
    const productSnap = await db.collection(PRODUCTS_COLLECTION)
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (productSnap.empty) {
      throw new Error("Serviço não encontrado.");
    }

    const product = { id: productSnap.docs[0].id, ...productSnap.docs[0].data() } as Product;

    // 🧬 2. Resolver Matrícula para busca de Governança V3
    const authMapSnap = await db.doc(`_AuthMap/${session.uid}`).get();
    const matricula = authMapSnap.exists ? authMapSnap.data()?.matricula : null;

    if (!matricula) {
       throw new Error("Identidade não vinculada. Entre em contato com o suporte.");
    }

    // 🛡️ 3. Validar se o usuário possui este serviço contratado (Hierarquia V3)
    const permissionsPath = `User/${matricula}/User_Permissions/access`;
    const userPermSnap = await db.doc(permissionsPath).get();
    const userPerms = userPermSnap.data() || {};
    const isAdmin = userPerms.role === "admin";
    const serviceEntitlement = userPerms.services?.[product.serviceCode];

    if (!isAdmin && !serviceEntitlement) {
       throw new Error("Você não possui acesso a este serviço. Que tal contratá-lo agora?");
    }

    // 🤖 4. Calcular Progresso Automático (Milestones)
    const completedMilestones: string[] = [];

    if (product.capabilities.surveys.length > 0) {
       const resultsSnap = await db.collection("Survey_Results")
         .where("userId", "==", session.uid)
         .get();
       
       const finishedSurveyIds = resultsSnap.docs.map(d => d.data().surveyId);
       
       product.capabilities.surveys.forEach(surveyId => {
          if (finishedSurveyIds.includes(surveyId)) {
             completedMilestones.push(surveyId);
          }
       });
    }

    // 📊 5. Consumo de Cotas — lê o `used` REAL da carteira do membro (BUG-016).
    // Antes era hardcoded em 0. As chaves são normalizadas (BUG-008) antes de somar.
    const granted = product.grantedQuotas || {};
    const walletSnap = await db.doc(`User/${matricula}/User_Permissions/quotas`).get();
    const walletQuotas = foldQuotaMap(walletSnap.exists ? walletSnap.data()?.quotas : {});
    const quotas = {
       total: Object.values(granted).reduce((acc, val) => acc + val, 0),
       used: Object.keys(granted).reduce(
         (acc, key) => acc + (walletQuotas[normalizeQuotaKey(key)]?.used || 0),
         0
       )
    };

    return {
      success: true,
      data: {
        product,
        completedMilestones,
        quotas,
        userName: session.email || "Membro BPlen"
      }
    };

  } catch (err: unknown) {
    console.error("[Delivery Action Error]:", err);
    return { success: false, error: getErrorMessage(err) };
  }
}

/**
 * Lista o catálogo de serviços do Hub com o status de acesso do usuário.
 * Estrutura Híbrida: Mostra o que já possui e o que pode contratar.
 */
export async function getMyActiveServicesAction(idToken: string) {
  try {
    const session = await requireAuth(idToken);
    const db = getAdminDb();

    // 1. Resolver Matrícula
    const authMapSnap = await db.doc(`_AuthMap/${session.uid}`).get();
    const matricula = authMapSnap.exists ? authMapSnap.data()?.matricula : null;

    let userServices: Record<string, boolean> = {};
    let isAdmin = false;

    if (matricula) {
      // 2. Buscar Permissões no Caminho Hierárquico V3
      const permissionsPath = `User/${matricula}/User_Permissions/access`;
      const userPermSnap = await db.doc(permissionsPath).get();
      const perms = userPermSnap.data() || {};
      userServices = perms.services || {};
      isAdmin = perms.role === "admin";
    }

    // 3. Buscar TODOS os produtos visíveis do catálogo
    const productsSnap = await db.collection(PRODUCTS_COLLECTION)
      .where("isVisible", "==", true)
      .get();

    const allProducts = productsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];

    // 4. Mapear status de Desbloqueio (isUnlocked)
    const enrichedProducts = allProducts.map(product => {
       const isUnlocked = isAdmin || userServices[product.serviceCode] === true;
       return {
         ...product,
         isUnlocked
       };
    });

    // Ordenação: Desbloqueados primeiro
    enrichedProducts.sort((a, b) => (a.isUnlocked === b.isUnlocked) ? 0 : a.isUnlocked ? -1 : 1);

    return { success: true, data: enrichedProducts };

  } catch (err: unknown) {
    console.error("❌ [getMyActiveServicesAction Error]:", err);
    return { success: false, error: getErrorMessage(err) };
  }
}
