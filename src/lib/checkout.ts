import admin, { getAdminDb } from "@/lib/firebase-admin";
import { USER_PERMISSIONS_COLLECTION } from "@/config/collections";
import { sendServiceGrantedEmail } from "@/lib/checkout-emails";

/**
 * BPlen HUB — Entitlement Engine (Soberania 🛡️)
 * Centraliza a lógica de ativação de serviços para ser usada por:
 * 1. Checkout Manual (Legacy/Admin)
 * 2. Webhooks de Pagamento (Mercado Pago)
 */

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
  
  console.log(`🧬 [Entitlement] Iniciando ativação: ${productTitle} para UID: ${uid}`);

  // Resolvemos a Matrícula via _AuthMap (Governança Soberana)
  const uidMapSnap = await db.collection("_AuthMap").doc(uid).get();
  const matricula = uidMapSnap.exists ? uidMapSnap.data()?.matricula : null;

  if (!matricula) {
    console.error(`🚨 [Entitlement Critical Error] UID ${uid} não possui matrícula mapeada no _AuthMap!`);
    throw new Error("Usuário não possui uma Matrícula Válida. Impossível liberar serviço.");
  }

  // Generate a trackable FREE order ID if none was provided
  const finalOrderId = orderId && orderId !== "legacy" 
    ? orderId 
    : `BPLEN-FREE-${matricula}-${productSlug.toUpperCase().substring(0, 10)}-${Date.now()}`;

  // Caminho Soberano Oficial (Validado)
  const userRef = db.doc(`User/${matricula}/User_Permissions/access`);

  const transactionResult = await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    
    const currentServices = userDoc.exists 
      ? (userDoc.data()?.services || {}) 
      : {};

    // Ativando o serviço (Entitlement via ID ou Slug)
    const updatedServices = {
      ...currentServices,
      [productId]: true,
      [productSlug]: true,
      member_area_access: true // Toda compra garante acesso à área de membros
    };

    const updateData: Record<string, any> = {
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

    // Promoção automática para Membro
    if (!userDoc.exists || userDoc.data()?.role === "visitor") {
      updateData.role = "member";
    }

    if (userDoc.exists) {
      transaction.update(userRef, updateData);
    } else {
      // Se não existir registro de permissão, criamos um básico
      transaction.set(userRef, {
        role: "member",
        onboardStatus: "pending",
        ...updateData
      });
    }

    return { success: true, matricula, orderId: finalOrderId };
  });

  // 🎁 Distribuição Automática de Cotas do Produto
  try {
    const productSnap = await db.collection("products").doc(productId).get();
    let productData = productSnap.exists ? productSnap.data() : null;
    
    if (!productData) {
      const slugSnap = await db.collection("products").where("slug", "==", productSlug).limit(1).get();
      if (!slugSnap.empty) productData = slugSnap.docs[0].data();
    }

    if (productData?.grantedQuotas && Object.keys(productData.grantedQuotas).length > 0) {
      console.log(`🎁 [Entitlement] Depositando cotas automáticas para UID: ${uid} | Serviço: ${productTitle}`);
      const { updateMemberQuotasAction } = await import("@/actions/quotas");
      await updateMemberQuotasAction(uid, productData.grantedQuotas);
    }
  } catch (error) {
    console.error("🚨 [Entitlement] Erro ao depositar cotas:", error);
  }

  return transactionResult;
}
