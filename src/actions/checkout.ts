"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth-guards";
import { Product } from "@/types/products";
import { PRODUCTS_COLLECTION, USER_ORDERS_COLLECTION } from "@/config/collections";
import { revalidatePath } from "next/cache";
import { grantServiceEntitlement } from "@/lib/checkout";

/**
 * BPlen HUB — Lógica de Checkout e Provisionamento 💳🧬
 * Processa a "compra" e ativa instantaneamente o serviço para o usuário.
 */

import { validateCouponAction } from "./coupons";

export async function processServicePurchaseAction(
  productSlug: string, 
  idToken: string,
  couponCode?: string,
  legalConsent?: boolean
) {
  try {
    // 🛡️ 1. Validar Autenticação
    const session = await requireAuth(idToken);

    // 🛡️ 1.1 Rate Limit: previne spam de checkout
    const { checkRateLimit, RATE_LIMITS } = await import("@/lib/rate-limit");
    const rateCheck = await checkRateLimit({ action: "checkout", uid: session.uid, windowSeconds: RATE_LIMITS.CHECKOUT.windowSeconds });
    if (!rateCheck.allowed) {
      return { success: false, error: `Aguarde ${rateCheck.retryAfterSeconds}s antes de tentar novamente.` };
    }

    const db = getAdminDb();

    // 🕵️ 2. Buscar detalhes do produto
    const productSnap = await db.collection(PRODUCTS_COLLECTION)
      .where("slug", "==", productSlug)
      .limit(1)
      .get();

    if (productSnap.empty) {
      throw new Error("Produto não encontrado para processamento.");
    }

    const product = productSnap.docs[0].data() as Product;
    const productId = product.id || productSnap.docs[0].id;
    
    // 🎟️ 2.1 Validar Cupom (se fornecido)
    let appliedDiscount = 0;
    if (couponCode) {
       const couponResult = await validateCouponAction(couponCode, product.price, productId, idToken);
       if (couponResult.valid) {
          appliedDiscount = couponResult.discountAmount;
       } else {
          console.warn(`⚠️ [Checkout] Cupom inválido tentado: ${couponCode}`);
       }
    }

    // 🏛️ 3. Ativação Soberana (via Matrícula 🛡️)
    const grantResult = await grantServiceEntitlement({
      uid: session.uid,
      productId: product.id || productSnap.docs[0].id,
      productSlug: product.slug,
      productTitle: product.title,
      legalConsent
    });

    // 🧾 4. Registrar a transação no Histórico Financeiro (User_Orders) para aparecer em "Meus Contratos"
    if (grantResult.orderId?.startsWith("BPLEN-FREE-")) {
      const orderRef = db.collection(USER_ORDERS_COLLECTION).doc(grantResult.orderId);
      const { FieldValue } = await import("firebase-admin/firestore");
      await orderRef.set({
        orderId: grantResult.orderId,
        userId: session.uid,
        matricula: grantResult.matricula,
        userEmail: session.email || "",
        productId: productId,
        productSlug: product.slug,
        productTitle: product.title,
        basePrice: product.price || 0,
        appliedDiscount: product.price || 0,
        finalPrice: 0,
        currency: "BRL",
        status: "approved",
        statusDetail: "accredited",
        gateway: "bplen_free_bypass",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    console.log(`✅ [Checkout] Serviço ${product.title} ativado para ${session.email}`);

    revalidatePath("/hub");
    revalidatePath("/admin/users");
    
    return { success: true, productTitle: product.title, orderId: grantResult.orderId };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro interno ao processar contratação.";
    console.error("❌ [Checkout Action Error]:", error);
    return { success: false, error: errorMessage };
  }
}
