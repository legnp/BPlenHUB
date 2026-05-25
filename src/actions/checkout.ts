"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth-guards";
import { Product } from "@/types/products";
import { PRODUCTS_COLLECTION } from "@/config/collections";
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
