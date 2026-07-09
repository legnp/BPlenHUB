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
import { resolveMatricula } from "./get-user-results";
import { hashCpf } from "@/utils/crypto";

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
    let couponDocRef: FirebaseFirestore.DocumentReference | null = null;

    if (couponCode) {
       const matricula = await resolveMatricula(session.uid, session.email || "");
       if (matricula) {
          const userSnap = await db.doc(`User/${matricula}`).get();
          const profile = userSnap.data()?.profile || {};
          const cpfClean = (profile.cpf || "").replace(/\D/g, "");
          const cpfHash = hashCpf(cpfClean);

          const { COUPONS_V2_COLLECTION, COUPON_BATCHES_COLLECTION } = await import("@/config/collections");

          const couponSnap = await db.collection(COUPONS_V2_COLLECTION)
             .where("code", "==", couponCode.toUpperCase().trim())
             .limit(1)
             .get();

          if (!couponSnap.empty) {
             const couponDoc = couponSnap.docs[0];
             const couponData = couponDoc.data();
             
             // Verificar se o cupom está resgatado pelo usuário
             if (couponData.isRedeemed && couponData.cpfHash === cpfHash && !couponData.isUsedInOrder) {
                const batchDoc = await db.collection(COUPON_BATCHES_COLLECTION).doc(couponData.batchId).get();
                if (batchDoc.exists) {
                   const batchData = batchDoc.data();
                   if (batchData) {
                      appliedDiscount = product.price * batchData.discount;
                      couponDocRef = couponDoc.ref;
                   }
                }
             }
          }
       }

       // Fallback original para cupons v1
       if (!couponDocRef) {
          const couponResult = await validateCouponAction(couponCode, product.price, productId, idToken);
          if (couponResult.valid) {
             appliedDiscount = couponResult.discountAmount;
          } else {
             console.warn(`[Checkout] Cupom invalido tentado: ${couponCode}`);
          }
       }
    }

    // 🛡️ 2.2 Trava de preço (BUG-002): esta action concede o serviço de graça (sem
    // gateway). So pode ser usada quando o preço efetivo e ZERO — produto gratuito
    // ou cupom que zera o total. Sem esta trava server-side, um chamador direto (ou a
    // antiga pagina orfa /checkout/[slug]) poderia ativar um produto PAGO sem pagar.
    // O CheckoutFlow ja gateia por finalPrice===0 no client; aqui reforçamos no server.
    const finalPriceGuard = Math.max(0, (product.price || 0) - appliedDiscount);
    if (finalPriceGuard > 0) {
      console.warn(`[Checkout] Bloqueado: ativacao gratuita de produto pago ${productSlug} (finalPrice=${finalPriceGuard}, uid=${session.uid}).`);
      return { success: false, error: "Este serviço não é gratuito. Conclua o pagamento pelo checkout." };
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
        productKicker: product.kicker || "",
        basePrice: product.price || 0,
        couponCode: couponCode || null,
        appliedDiscount: appliedDiscount,
        finalPrice: Math.max(0, (product.price || 0) - appliedDiscount),
        currency: "BRL",
        status: "approved",
        statusDetail: "accredited",
        gateway: "bplen_free_bypass",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 📧 5. Disparar E-mail de Confirmação para Serviços Gratuitos
      const { resolveUserNickname } = await import("@/lib/user-identity");
      const nickname = await resolveUserNickname(session.uid);
      const { sendFreeOrderApprovedEmail } = await import("@/lib/checkout-emails");
      
      sendFreeOrderApprovedEmail(
        { name: nickname, email: session.email || "" },
        { orderId: grantResult.orderId, productTitle: product.title, finalPrice: Math.max(0, (product.price || 0) - appliedDiscount) }
      );
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
