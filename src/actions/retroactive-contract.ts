"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth-guards";
import { PRODUCTS_COLLECTION, USER_ORDERS_COLLECTION } from "@/config/collections";
import { Product } from "@/types/products";
import { generateContractPdf } from "@/actions/legal";

export async function processRetroactiveContractAction(
  productSlug: string,
  idToken: string
) {
  try {
    // 🛡️ 1. Validar Autenticação
    const session = await requireAuth(idToken);

    // 🛡️ 1.1 Rate Limit: previne spam
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

    // 🕵️ 3. Resolve Matricula
    const uidMapSnap = await db.collection("_AuthMap").doc(session.uid).get();
    const matricula = uidMapSnap.exists ? uidMapSnap.data()?.matricula : null;

    if (!matricula) {
       throw new Error("Usuário não possui uma Matrícula Válida. Impossível gerar contrato.");
    }

    // 🧾 4. Criar o registro financeiro (Order) retroativo
    const orderId = `BPLEN-RETRO-${matricula}-${productSlug.toUpperCase().substring(0, 10)}-${Date.now()}`;
    const orderRef = db.collection(USER_ORDERS_COLLECTION).doc(orderId);
    
    const { FieldValue } = await import("firebase-admin/firestore");
    
    await orderRef.set({
      orderId: orderId,
      userId: session.uid,
      matricula: matricula,
      userEmail: session.email || "",
      productId: productId,
      productSlug: product.slug,
      productTitle: product.title,
      productKicker: product.kicker || "",
      basePrice: product.price || 0,
      couponCode: null,
      appliedDiscount: 0,
      finalPrice: product.price || 0, // Mantém o preço original para constar no contrato
      currency: "BRL",
      status: "approved",
      statusDetail: "retroactive",
      gateway: "retroactive_bypass",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 📄 5. Gerar PDF do Contrato e Auditoria Imediatamente
    const pdfResult = await generateContractPdf(session.uid, productId, orderId, "retroativo");
    
    if (!pdfResult.success) {
      // Se falhar o PDF, não abortamos completamente, mas podemos logar ou avisar
      console.error(`❌ [Retroactive Contract] Falha ao gerar PDF para ${session.uid}:`, pdfResult.error);
      return { success: false, error: `Ordem criada, mas falha ao gerar PDF: ${pdfResult.error}` };
    }

    // Opcional: Registrar data de aceite no próprio user document
    const userAccessRef = db.doc(`User/${matricula}/User_Permissions/access`);
    const accessSnap = await userAccessRef.get();
    if (accessSnap.exists) {
       await userAccessRef.update({
         legalConsentGiven: true,
         legalConsentTimestamp: FieldValue.serverTimestamp(),
       });
    }

    console.log(`✅ [Retroactive Contract] Contrato ativado para ${session.email} no produto ${product.title}`);

    return { success: true, productTitle: product.title, orderId: orderId, documentUrl: pdfResult.url };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro interno ao processar contrato.";
    console.error("❌ [Retroactive Contract Error]:", error);
    return { success: false, error: errorMessage };
  }
}
