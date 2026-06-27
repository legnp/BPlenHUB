"use server";

import admin, { getAdminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth-guards";
import { Product } from "@/types/products";
import { PRODUCTS_COLLECTION, USER_ORDERS_COLLECTION } from "@/config/collections";
import { mpClient } from "@/lib/mercadopago";
import { Preference, Payment as MPPayment } from "mercadopago";
import { validateCouponAction } from "./coupons";
import { clientEnv } from "@/env";

export type MercadoPagoFormData = {
  amount?: number | string;
  transaction_amount?: number | string;
  installments?: number | string;
  issuer_id?: number | string;
  token?: string;
  payment_method_id?: string;
  payment_type_id?: string;
  payer?: {
    email?: string;
    identification?: {
      type?: string;
      number?: string;
    };
  };
  [key: string]: unknown;
};

function asFiniteNumber(value: unknown) {
  const numberValue = typeof value === "string" ? Number(value) : value;
  return typeof numberValue === "number" && Number.isFinite(numberValue) ? numberValue : undefined;
}

function extractMpErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;

  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      message?: unknown;
      cause?: Array<{ description?: unknown; code?: unknown }>;
      response?: { message?: unknown; cause?: Array<{ description?: unknown; code?: unknown }> };
    };

    const directCause = maybeError.cause?.[0]?.description;
    if (typeof directCause === "string") return directCause;

    const responseCause = maybeError.response?.cause?.[0]?.description;
    if (typeof responseCause === "string") return responseCause;

    if (typeof maybeError.response?.message === "string") return maybeError.response.message;
    if (typeof maybeError.message === "string") return maybeError.message;
  }

  return "Erro desconhecido no processamento. Tente outro cartão.";
}

function summarizeMpError(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return { message: String(error) };
  }

  const maybeError = error as {
    message?: unknown;
    status?: unknown;
    cause?: unknown;
    response?: unknown;
  };

  return {
    message: extractMpErrorMessage(error),
    status: maybeError.status,
    cause: maybeError.cause,
    response: maybeError.response,
  };
}

function isPaymentProcessableStatus(status?: string) {
  return ["approved", "pending", "in_process", "in_mediation", "authorized"].includes(status || "");
}

function isPaymentRejectedStatus(status?: string) {
  return ["rejected", "cancelled", "refunded", "charged_back"].includes(status || "");
}

/**
 * BPlen HUB — Mercado Pago Checkout Engine (🧠💳)
 * Cria a preferência de pagamento e gera o registro de auditoria da ordem.
 */

export async function createPreferenceAction(
  productSlug: string,
  idToken: string,
  couponCode?: string
) {
  try {
    // 🛡️ 1. Validar Autenticação
    const session = await requireAuth(idToken);

    // 🛡️ 1.1 Rate Limit: previne spam de criação de preferências
    const { checkRateLimit, RATE_LIMITS } = await import("@/lib/rate-limit");
    const rateCheck = await checkRateLimit({ 
      action: "mp_preference", 
      uid: session.uid, 
      windowSeconds: RATE_LIMITS.CHECKOUT.windowSeconds 
    });
    
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
      throw new Error("Serviço não encontrado.");
    }

    const product = productSnap.docs[0].data() as Product;
    const productId = product.id || productSnap.docs[0].id;

    // 🎟️ 3. Validar Cupom (se fornecido)
    let appliedDiscount = 0;
    let couponDocRef: any = null;

    if (couponCode) {
       const { resolveMatricula } = await import("./get-user-results");
       const { hashCpf } = await import("@/utils/crypto");
       
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
             
             // Verificar se o cupom está resgatado pelo usuário e ainda não utilizado
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
          }
       }
    }

    const finalPrice = Math.max(0, product.price - appliedDiscount);

    // 🏆 4. Criar Registro de Ordem Pendente (Auditoria 🕵️)
    const orderRef = db.collection(USER_ORDERS_COLLECTION).doc();
    const orderId = orderRef.id;

    // Buscar a Matrícula do BPlen via _AuthMap para rastreabilidade fiscal
    const uidMapSnap = await db.collection("_AuthMap").doc(session.uid).get();
    const matricula = uidMapSnap.exists ? uidMapSnap.data()?.matricula : "NAO_MAPEADA";

    const orderData = {
      orderId,
      userId: session.uid,
      userEmail: session.email,
      matricula,
      productId,
      productSlug,
      productTitle: product.title,
      productKicker: product.kicker || "",
      basePrice: product.price,
      couponCode: couponCode || null,
      appliedDiscount,
      finalPrice,
      currency: "BRL",
      status: "pending",
      gateway: "mercadopago",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await orderRef.set(orderData);

    // 💳 5. Criar Preferência no Mercado Pago
    const preferenceClient = new Preference(mpClient);
    
    // Configurações de Redirecionamento Dinâmico (Soberania de Domínio)
    const baseUrl = clientEnv.NEXT_PUBLIC_APP_URL.endsWith("/") 
      ? clientEnv.NEXT_PUBLIC_APP_URL.slice(0, -1) 
      : clientEnv.NEXT_PUBLIC_APP_URL;

    const preferenceResult = await preferenceClient.create({
      body: {
        items: [
          {
            id: productId,
            title: product.title,
            quantity: 1,
            unit_price: finalPrice,
            currency_id: "BRL",
            category_id: "services",
            description: `BPlen HUB - Contratação de ${product.title}`
          }
        ],
        payer: {
          email: session.email || ""
        },
        back_urls: {
          success: `${baseUrl}/hub/membro/checkout/success?orderId=${orderId}`,
          failure: `${baseUrl}/hub/membro/checkout/failure?orderId=${orderId}`,
          pending: `${baseUrl}/hub/membro/checkout/status?orderId=${orderId}`
        },
        auto_return: "all",
        external_reference: orderId,
        metadata: {
          buyer_uid: session.uid,
          product_id: productId,
          order_id: orderId,
          checkout_origin: "bplen_hub_v3"
        },
        // Configuração Flexível de Parcelamento (Fallback para 12x se não especificado)
        payment_methods: {
          installments: product.maxInstallments || 12,
          excluded_payment_types: [] // Pode-se excluir 'ticket' se não desejar boleto futuramente
        },
        notification_url: `${baseUrl}/api/webhooks/mercadopago`
      }
    });

    if (!preferenceResult.id) {
      throw new Error("Falha ao gerar ID de preferência no gateway.");
    }

    // 🔗 6. Vincular ID da Preferência à Ordem
    await orderRef.update({
      mpPreferenceId: preferenceResult.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`📡 [MP-Checkout] Preferência Gerada: ${preferenceResult.id} para ${session.email}`);

    return { 
      success: true, 
      preferenceId: preferenceResult.id,
      orderId 
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro interno ao processar pagamento.";
    console.error("❌ [MP-Checkout Error]:", error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Recupera dados básicos do produto para a UI de Checkout
 */
export async function getCheckoutProductAction(slug: string, idToken?: string) {
  try {
    // 🛡️ Exige apenas autenticação. A matrícula será resolvida/gerada no RegistrationStep.
    await requireAuth(idToken);
    
    const db = getAdminDb();
    
    const snap = await db.collection(PRODUCTS_COLLECTION)
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (snap.empty) {
      return { success: false, error: "Serviço não encontrado." };
    }

    const product = snap.docs[0].data() as Product;
    
    return { 
      success: true, 
      data: {
        id: product.id,
        title: product.title,
        price: product.price,
        slug: product.slug,
        description: product.sheet.description,
        maxInstallments: product.maxInstallments
      } 
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return { success: false, error: message };
  }
}

/**
 * Processamento Efetivo do Pagamento Checkout Transparente
 * Recebe o token do frontend Brick e realiza a cobrança
 */
export async function processPaymentAction(formData: MercadoPagoFormData, orderId: string, idToken?: string) {
  try {
    const session = await requireAuth(idToken);
    
    // 💉 Log de Auditoria: Dados que estão indo para o MP
    console.log(`📡 [MP-Checkout] Iniciando processamento para Ordem: ${orderId} | Usuário: ${session.email}`);

    const db = getAdminDb();
    const orderSnap = await db.collection(USER_ORDERS_COLLECTION).doc(orderId).get();
    const order = orderSnap.exists ? orderSnap.data() : undefined;
    const productTitle = order?.productTitle || "BPlen HUB";
    const orderAmount = asFiniteNumber(order?.finalPrice);
    const transactionAmount = asFiniteNumber(formData.transaction_amount ?? formData.amount ?? orderAmount);
    const installments = asFiniteNumber(formData.installments);
    const issuerId = asFiniteNumber(formData.issuer_id);
    const payerEmail = formData.payer?.email || session.email || order?.userEmail || "";
    const identificationNumber = formData.payer?.identification?.number?.replace(/\D/g, "");

    if (!transactionAmount) {
      throw new Error("Valor do pagamento ausente ou inválido para o Mercado Pago.");
    }

    if (!payerEmail) {
      throw new Error("E-mail do pagador ausente para o Mercado Pago.");
    }

    // Importante: No caso do Preference ID, nós ainda dependemos da cobrança manual
    // Injectamos metadata para rastreabilidade do Webhook
    const payload = {
      transaction_amount: transactionAmount,
      ...(installments ? { installments } : {}),
      ...(issuerId ? { issuer_id: issuerId } : {}),
      ...(formData.token ? { token: formData.token } : {}),
      ...(formData.payment_method_id ? { payment_method_id: formData.payment_method_id } : {}),
      description: `Contratação: ${productTitle}`,
      external_reference: orderId, // CRITICAL: Para o Webhook saber qual é o pedido
      payer: {
        ...(formData.payer || {}),
        email: payerEmail,
        ...(identificationNumber
          ? {
              identification: {
                ...(formData.payer?.identification || {}),
                number: identificationNumber,
              },
            }
          : {}),
      },
      metadata: {
        buyer_uid: session.uid,
        checkout_origin: "bplen_hub_v3_transparent"
      }
    };

    const paymentClient = new MPPayment(mpClient);
    const payment = await paymentClient.create({ 
      body: payload,
      requestOptions: { idempotencyKey: crypto.randomUUID() }
    });

    await db.collection(USER_ORDERS_COLLECTION).doc(orderId).update({
      status: payment.status || "unknown",
      statusDetail: payment.status_detail || "",
      mpPaymentId: payment.id ? String(payment.id) : "",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 📧 Disparo do E-mail 1: "Compra Solicitada" (Personalizado & Inteligente 🧠🧬)
    const pendingStatuses = ["pending", "in_process", "in_mediation", "authorized"];
    
    if (pendingStatuses.includes(payment.status || "")) {
      const { resolveUserNickname } = await import("@/lib/user-identity");
      const { sendOrderRequestedEmail } = await import("@/lib/checkout-emails");
      const nickname = await resolveUserNickname(session.uid);

      const productTitle = payload.description || "Serviços BPlen HUB";
      const finalPrice = payload.transaction_amount || 0;

      sendOrderRequestedEmail(
        { email: session.email || "", name: nickname },
        { orderId, productTitle, finalPrice }
      );
    }

    console.log(`✅ [MP-Checkout] Pagamento criado com sucesso: ${payment.id} (Status: ${payment.status})`);

    if (isPaymentRejectedStatus(payment.status)) {
      return {
        success: false,
        status: payment.status,
        paymentId: payment.id,
        error: `Pagamento ${payment.status_detail || payment.status || "não aprovado"} pelo Mercado Pago.`,
      };
    }

    if (!isPaymentProcessableStatus(payment.status)) {
      return {
        success: false,
        status: payment.status,
        paymentId: payment.id,
        error: `Status inesperado do Mercado Pago: ${payment.status || "desconhecido"}.`,
      };
    }

    return { 
      success: true, 
      status: payment.status,
      paymentId: payment.id 
    };

  } catch (error: unknown) {
    // 🕵️ Captura Profunda de Erros do Mercado Pago
    const mpError = summarizeMpError(error);
    console.error("❌ [MP Process Payment Error]:", JSON.stringify(mpError, null, 2));

    try {
      const db = getAdminDb();
      await db.collection(USER_ORDERS_COLLECTION).doc(orderId).update({
        status: "payment_failed",
        gatewayError: mpError,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (auditError) {
      console.error("❌ [MP Process Payment Audit Error]:", auditError);
    }

    const message = extractMpErrorMessage(error);
    return { success: false, error: message };
  }
}
