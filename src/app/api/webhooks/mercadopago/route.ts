import { NextRequest, NextResponse } from "next/server";
import { Payment } from "mercadopago";
import { mpClient } from "@/lib/mercadopago";
import { getAdminDb } from "@/lib/firebase-admin";
import { USER_ORDERS_COLLECTION } from "@/config/collections";
import { grantServiceEntitlement } from "@/lib/checkout";
import admin from "@/lib/firebase-admin";
import { sendPaymentApprovedEmail, sendServiceGrantedEmail } from "@/lib/checkout-emails";
import { syncOrderToUserDrive } from "@/lib/drive-sync";

/**
 * BPlen HUB — Mercado Pago Webhook Handler (🛰️)
 * Recebe notificações assíncronas de pagamento e ativa os serviços.
 * Foco em Soberania de Dados e Integridade Transacional.
 */

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Ler o body de forma segura (uma única vez)
    let bodyData: any = {};
    try {
      bodyData = await req.json();
    } catch (e) {
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

    // 1. Consultar Detalhes do Pagamento no Mercado Pago
    const paymentClient = new Payment(mpClient);
    const payment = await paymentClient.get({ id: dataId });

    if (!payment || !payment.id) {
      console.error(`❌ [Webhook:MP] Pagamento ${dataId} não encontrado no MP.`);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const { status, status_detail, external_reference, metadata } = payment;
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
      const { userId, userEmail, productId, productSlug, productTitle, finalPrice, matricula, createdAt, basePrice, appliedDiscount } = order!;

      // Ativação da Permissão
      await grantServiceEntitlement({
        uid: userId,
        productId,
        productSlug,
        productTitle,
        orderId
      });

      console.log(`✅ [Webhook:MP] Ordem ${orderId} APROVADA e Serviço Ativado.`);

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
        sendServiceGrantedEmail(userObj, productTitle),
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
