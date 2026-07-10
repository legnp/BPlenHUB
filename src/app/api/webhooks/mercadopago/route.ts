import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { Payment } from "mercadopago";
import { mpClient } from "@/lib/mercadopago";
import { serverEnv } from "@/env";
import { getAdminDb } from "@/lib/firebase-admin";
import { USER_ORDERS_COLLECTION } from "@/config/collections";
import { maybeReleaseService } from "@/lib/checkout";
import admin from "@/lib/firebase-admin";
import { sendPaymentApprovedEmail } from "@/lib/checkout-emails";
import { syncOrderToUserDrive } from "@/lib/drive-sync";

/**
 * BPlen HUB — Mercado Pago Webhook Handler (🛰️)
 * Recebe notificações assíncronas de pagamento e ativa os serviços.
 * Foco em Soberania de Dados e Integridade Transacional.
 */

/**
 * Valida a assinatura HMAC-SHA256 enviada pelo Mercado Pago no header `x-signature`.
 * Reconstrói o manifest documentado pelo MP (`id:<data.id>;request-id:<x-request-id>;ts:<ts>;`),
 * recalcula o HMAC com o segredo do painel e compara com o `v1` de forma timing-safe.
 * Segmentos cujo valor não está presente na notificação são omitidos do manifest
 * (comportamento exigido pelo MP). `data.id` alfanumérico entra em minúsculas.
 */
function isValidMpSignature(params: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string;
  secret: string;
}): boolean {
  const { xSignature, xRequestId, dataId, secret } = params;
  if (!xSignature) return false;

  // `x-signature` tem a forma "ts=<unix>,v1=<hash-hex>"
  let ts: string | undefined;
  let v1: string | undefined;
  for (const part of xSignature.split(",")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key === "ts") ts = value;
    else if (key === "v1") v1 = value;
  }
  if (!ts || !v1) return false;

  const normalizedId = /[a-zA-Z]/.test(dataId) ? dataId.toLowerCase() : dataId;
  let manifest = `id:${normalizedId};`;
  if (xRequestId) manifest += `request-id:${xRequestId};`;
  manifest += `ts:${ts};`;

  const computed = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  // Comparação timing-safe; buffers de tamanho diferente indicam hash inválido.
  const computedBuf = Buffer.from(computed, "hex");
  const receivedBuf = Buffer.from(v1, "hex");
  if (computedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(computedBuf, receivedBuf);
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Ler o body de forma segura (uma única vez)
    let bodyData: { type?: string; data?: { id?: string } } = {};
    try {
      bodyData = await req.json();
    } catch {
      // Body vazio ou não-JSON
    }

    const type = searchParams.get("type") || bodyData.type;
    const dataId = searchParams.get("data.id") || bodyData.data?.id;

    console.log(`📡 [Webhook:MP] Recebido: ${type} | ID: ${dataId}`);

    // Só processamos notificações de pagamento
    if (type !== "payment") {
      return NextResponse.json({ received: true });
    }

    if (!dataId) {
      return NextResponse.json({ error: "No data ID found" }, { status: 400 });
    }

    // 0. Validação de assinatura HMAC (habilitação suave)
    // Só exige a assinatura se o segredo estiver configurado no ambiente. Quando
    // ausente, o handler mantém o comportamento anterior (re-fetch no MP), evitando
    // quebrar a entrega de serviço antes de o segredo ser cadastrado no painel/Vercel.
    const webhookSecret = serverEnv.MERCADOPAGO_WEBHOOK_SECRET;
    if (webhookSecret) {
      const validSignature = isValidMpSignature({
        xSignature: req.headers.get("x-signature"),
        xRequestId: req.headers.get("x-request-id"),
        dataId,
        secret: webhookSecret,
      });
      if (!validSignature) {
        console.error(`[Webhook:MP] Assinatura invalida para data.id ${dataId}. Requisicao rejeitada.`);
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else {
      console.warn("[Webhook:MP] MERCADOPAGO_WEBHOOK_SECRET nao configurado; validacao de assinatura desativada (modo suave).");
    }

    // 1. Consultar Detalhes do Pagamento no Mercado Pago
    const paymentClient = new Payment(mpClient);
    const payment = await paymentClient.get({ id: dataId });

    if (!payment || !payment.id) {
      console.error(`❌ [Webhook:MP] Pagamento ${dataId} não encontrado no MP.`);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const { status, status_detail, external_reference } = payment;
    const orderId = external_reference;

    if (!orderId) {
       console.error(`⚠️ [Webhook:MP] Pagamento ${dataId} sem external_reference (orderId).`);
       return NextResponse.json({ received: true }); // Ignoramos pagamentos externos ao HUB
    }

    const db = getAdminDb();
    const orderRef = db.collection(USER_ORDERS_COLLECTION).doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      console.error(`❌ [Webhook:MP] Ordem ${orderId} não encontrada no banco.`);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 2. Atualizar Status da Ordem (Auditoria)
    await orderRef.update({
      status: status,
      statusDetail: status_detail,
      mpPaymentId: dataId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 3. Ativação de Serviço (Apenas se aprovado 🏆)
    if (status === "approved") {
      const order = orderSnap.data();
      const { userId, userEmail, productTitle, finalPrice, matricula, createdAt, basePrice, appliedDiscount } = order!;

      // Gate de liberação (CT-3b.2): o serviço só é liberado quando o pagamento está
      // aprovado E o contrato do serviço está assinado. Aqui o pagamento acabou de ser
      // aprovado; libera se o contrato já estiver assinado, senão fica aguardando a
      // assinatura (que também chama maybeReleaseService). O e-mail de "serviço liberado"
      // agora sai de dentro de maybeReleaseService, só quando de fato libera.
      const release = await maybeReleaseService(orderId);
      console.log(
        `✅ [Webhook:MP] Ordem ${orderId} APROVADA. Liberacao: ${release.released ? "liberada" : "aguardando (" + release.reason + ")"}.`
      );

      // 📧 Disparos Assíncronos de E-mail (Personalizados 🧬)
      const { resolveUserNickname } = await import("@/lib/user-identity");
      const nickname = await resolveUserNickname(userId);
      const userObj = { email: userEmail, name: nickname };
      const orderObj = { orderId, productTitle, finalPrice };

      // Preparar dados para o Extrato Financeiro
      const orderDate = createdAt?.toDate ? createdAt.toDate().toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
      const rowData = [
        orderDate,
        orderId,
        productTitle,
        basePrice || finalPrice,
        appliedDiscount || 0,
        finalPrice,
        "Aprovado"
      ];

      // Passamos a promessa adiante mas não seguramos o Webhook. Mercado Pago exige resposta rápida!
      Promise.allSettled([
        sendPaymentApprovedEmail(userObj, orderObj, dataId),
        ...(matricula && matricula !== "NAO_MAPEADA" ? [syncOrderToUserDrive(matricula, rowData)] : [])
      ]).catch(err => console.error("🚨 Erro assíncrono no webhook (Email/Sync):", err));

    } else {
      console.log(`🟡 [Webhook:MP] Ordem ${orderId} status: ${status} (${status_detail})`);
    }

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("🚨 [Webhook:MP Fatal Error]:", error);
    // Retornamos 500 para que o Mercado Pago tente novamente (Retry Policy)
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
