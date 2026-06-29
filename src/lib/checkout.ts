import admin, { getAdminDb } from "@/lib/firebase-admin";
import { USER_PERMISSIONS_COLLECTION } from "@/config/collections";
import { sendServiceGrantedEmail } from "@/lib/checkout-emails";
import { normalizeString } from "@/lib/utils";

/**
 * BPlen HUB — Entitlement Engine (Soberania)
 * Centraliza a logica de ativacao de servicos para ser usada por:
 * 1. Checkout Manual (Legacy/Admin)
 * 2. Webhooks de Pagamento (Mercado Pago)
 */

/** IDs oficiais das etapas da jornada do membro */
const JOURNEY_STAGE_IDS = [
  "onboarding",
  "preparacao-de-carreira",
  "analise-comportamental",
  "plano-de-carreira",
  "desenvolvimento-de-carreira",
  "coaching-e-mentoria",
  "offboarding",
];

/**
 * Resolve uma chave de quota (ex: "analisecomportamental", "mentocoach")
 * para o stage ID oficial da jornada (ex: "analise-comportamental", "coaching-e-mentoria").
 * Retorna null se nao houver correspondencia direta com nenhum stage.
 */
function resolveQuotaKeyToStageId(quotaKey: string): string | null {
  const normalizedQuota = normalizeString(quotaKey);

  for (const stageId of JOURNEY_STAGE_IDS) {
    const normalizedStage = normalizeString(stageId);
    if (normalizedQuota === normalizedStage || normalizedQuota.includes(normalizedStage) || normalizedStage.includes(normalizedQuota)) {
      return stageId;
    }
  }

  // Fallbacks metodologicos para chaves especificas
  const quotaUpper = quotaKey.toUpperCase();
  if (quotaUpper.includes("COACHING") || quotaUpper.includes("MENTORIA") || quotaUpper.includes("MENTOCOACH")) {
    return "coaching-e-mentoria";
  }
  if (quotaUpper.includes("GESTAO") || quotaUpper.includes("DESENVOLVIMENTO") || quotaUpper.includes("GESTAOEDESENVOLVIMENTO")) {
    return "desenvolvimento-de-carreira";
  }

  return null;
}

interface GrantEntitlementParams {
  uid: string;
  productId: string;
  productSlug: string;
  productTitle: string;
  orderId?: string;
  legalConsent?: boolean;
}

export async function grantServiceEntitlement(params: GrantEntitlementParams) {
  const { uid, productId, productSlug, productTitle, orderId, legalConsent } = params;
  const db = getAdminDb();
  
  console.log(`[Entitlement] Iniciando ativacao: ${productTitle} para UID: ${uid}`);

  // Resolvemos a Matricula via _AuthMap (Governanca Soberana)
  const uidMapSnap = await db.collection("_AuthMap").doc(uid).get();
  const matricula = uidMapSnap.exists ? uidMapSnap.data()?.matricula : null;

  if (!matricula) {
    console.error(`[Entitlement Critical Error] UID ${uid} nao possui matricula mapeada no _AuthMap!`);
    throw new Error("Usuario nao possui uma Matricula Valida. Impossivel liberar servico.");
  }

  // Generate a trackable FREE order ID if none was provided
  const finalOrderId = orderId && orderId !== "legacy" 
    ? orderId 
    : `BPLEN-FREE-${matricula}-${productSlug.toUpperCase().substring(0, 10)}-${Date.now()}`;

  // Pre-fetch do produto para resolver grantedQuotas ANTES da transacao
  let productData: FirebaseFirestore.DocumentData | null = null;
  try {
    const productSnap = await db.collection("products").doc(productId).get();
    productData = productSnap.exists ? productSnap.data() ?? null : null;
    
    if (!productData) {
      const slugSnap = await db.collection("products").where("slug", "==", productSlug).limit(1).get();
      if (!slugSnap.empty) productData = slugSnap.docs[0].data() ?? null;
    }
  } catch (fetchErr) {
    console.error("[Entitlement] Erro ao buscar dados do produto para resolucao de services:", fetchErr);
  }

  // Resolver quais stage IDs devem ser ativados com base nas grantedQuotas
  const quotaBasedStageActivations: Record<string, boolean> = {};
  if (productData?.grantedQuotas && typeof productData.grantedQuotas === "object") {
    for (const quotaKey of Object.keys(productData.grantedQuotas)) {
      if ((productData.grantedQuotas[quotaKey] as number) <= 0) continue;
      const stageId = resolveQuotaKeyToStageId(quotaKey);
      if (stageId) {
        quotaBasedStageActivations[stageId] = true;
      }
    }
    if (Object.keys(quotaBasedStageActivations).length > 0) {
      console.log(`[Entitlement] Ativando services derivados de grantedQuotas: ${Object.keys(quotaBasedStageActivations).join(", ")}`);
    }
  }

  // Caminho Soberano Oficial (Validado)
  const userRef = db.doc(`User/${matricula}/User_Permissions/access`);

  const transactionResult = await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    
    const currentServices = userDoc.exists 
      ? (userDoc.data()?.services || {}) 
      : {};

    // Ativando o servico (Entitlement via ID, Slug e Stage IDs derivados das quotas)
    const updatedServices = {
      ...currentServices,
      ...quotaBasedStageActivations,
      [productId]: true,
      [productSlug]: true,
      member_area_access: true // Toda compra garante acesso a area de membros
    };

    const updateData: Record<string, unknown> = {
      services: updatedServices,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastPurchase: {
        productTitle,
        productSlug,
        orderId: finalOrderId,
        purchasedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...(legalConsent ? { legalConsent: true, consentTimestamp: admin.firestore.FieldValue.serverTimestamp() } : {})
      }
    };

    if (legalConsent) {
      updateData.legalConsentGiven = true;
      updateData.legalConsentTimestamp = admin.firestore.FieldValue.serverTimestamp();
    }

    // Promocao automatica para Membro
    if (!userDoc.exists || userDoc.data()?.role === "visitor") {
      updateData.role = "member";
    }

    if (userDoc.exists) {
      transaction.update(userRef, updateData);
    } else {
      // Se nao existir registro de permissao, criamos um basico
      transaction.set(userRef, {
        role: "member",
        onboardStatus: "pending",
        ...updateData
      });
    }

    return { success: true, matricula, orderId: finalOrderId };
  });

  // Distribuicao Automatica de Cotas do Produto
  try {
    if (productData?.grantedQuotas && Object.keys(productData.grantedQuotas).length > 0) {
      console.log(`[Entitlement] Depositando cotas automaticas para UID: ${uid} | Servico: ${productTitle}`);
      const { updateMemberQuotasAction } = await import("@/actions/quotas");
      await updateMemberQuotasAction(uid, productData.grantedQuotas);
    }
  } catch (error) {
    console.error("[Entitlement] Erro ao depositar cotas:", error);
  }

  // Marca o cupom V2 como utilizado se houver couponCode na ordem correspondente
  if (finalOrderId) {
    try {
      const orderSnap = await db.collection("User_Orders").doc(finalOrderId).get();
      if (orderSnap.exists) {
        const orderData = orderSnap.data();
        if (orderData?.couponCode) {
          const { COUPONS_V2_COLLECTION } = await import("@/config/collections");
          const couponSnap = await db.collection(COUPONS_V2_COLLECTION)
            .where("code", "==", orderData.couponCode.toUpperCase().trim())
            .limit(1)
            .get();
          if (!couponSnap.empty) {
            await couponSnap.docs[0].ref.update({
              isUsedInOrder: true,
              orderId: finalOrderId
            });
            console.log(`[Entitlement] Cupom V2 ${orderData.couponCode} marcado como utilizado na ordem ${finalOrderId}`);
          }
        }
      }
    } catch (couponErr) {
      console.error("[Entitlement] Erro ao processar utilizacao de cupom V2:", couponErr);
    }
  }

  return transactionResult;
}

