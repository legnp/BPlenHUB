import { Resend } from "resend";
import { serverEnv, clientEnv } from "@/env";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { buildSoberanaEmail, EMAIL_STYLES } from "./emails/soberana-layout";

/**
 * BPlen HUB — Premium Email Engine (📧💎)
 * Design System: Soberana v3.1 (Apple Pro Style)
 * Governança: Uso mandatório de aliases e alinhamento à esquerda.
 */

const resend = new Resend(serverEnv.RESEND_API_KEY);

interface OrderDetails {
  orderId: string;
  productTitle: string;
  finalPrice: number;
}

interface UserDetails {
  name: string;
  email: string;
}

/**
 * 📧 E-mail 1: Compra Solicitada
 * Remetente: financeiro@bplen.com
 */
export async function sendOrderRequestedEmail(user: UserDetails, order: OrderDetails) {
  try {
    const baseUrl = clientEnv.NEXT_PUBLIC_APP_URL || "https://bplen.com";
    
    await resend.emails.send({
      from: "BPlen Financeiro <financeiro@bplen.com>",
      to: user.email,
      subject: `[BPlen HUB] Solicitação de compra recebida: ${order.productTitle}`,
      html: buildSoberanaEmail(`
        <h2 style="${EMAIL_STYLES.h2}">Olá, ${user.name || "Membro"}.</h2>
        <p style="${EMAIL_STYLES.p}">
          Recebemos a sua solicitação para a contratação da <strong>${order.productTitle}</strong>. 
          Neste momento, nosso sistema está processando os detalhes da transação junto ao gateway de pagamento.
        </p>
        <div style="background: #F8FAFC; padding: 20px; border-radius: 12px; margin: 24px 0;">
          <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8; font-weight: bold; text-transform: uppercase;">Resumo do Pedido</p>
          <p style="margin: 4px 0; font-size: 14px;">Serviço: <strong>${order.productTitle}</strong></p>
          <p style="margin: 4px 0; font-size: 14px;">Valor: <strong>R$ ${order.finalPrice.toFixed(2)}</strong></p>
        </div>
        <p style="${EMAIL_STYLES.p}">
          Você receberá uma nova confirmação assim que o pagamento for aprovado.
        </p>
      `)
    });
    console.log(`✉️ [E-mail] "Compra Solicitada" enviado para ${user.email}`);
  } catch (error) {
    console.error("❌ ERRO ao enviar e-mail de solicitação:", error);
  }
}

/**
 * 📧 E-mail 2: Pagamento Aprovado (Recibo)
 * Remetente: financeiro@bplen.com
 */
export async function sendPaymentApprovedEmail(user: UserDetails, order: OrderDetails, paymentId: string) {
  try {
    const date = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
    
    await resend.emails.send({
      from: "BPlen Financeiro <financeiro@bplen.com>",
      to: user.email,
      subject: `[BPlen HUB] Confirmação de Pagamento: ${order.productTitle}`,
      html: buildSoberanaEmail(`
        <h2 style="${EMAIL_STYLES.h2}">Seu pagamento foi aprovado.</h2>
        <p style="${EMAIL_STYLES.p}">
          Confirmamos o recebimento do pagamento para a <strong>${order.productTitle}</strong>. 
          Abaixo você encontra os detalhes do seu recibo digital.
        </p>
        <div style="border-top: 1px solid #F0F0F0; border-bottom: 1px solid #F0F0F0; padding: 20px 0; margin: 24px 0;">
          <table width="100%">
            <tr>
              <td style="font-size: 13px; color: #64748B;">Data</td>
              <td style="font-size: 13px; text-align: right; font-weight: 600;">${date}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748B;">Transação</td>
              <td style="font-size: 13px; text-align: right; font-weight: 600;">#${paymentId}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748B; padding-top: 12px;">Total</td>
              <td style="font-size: 16px; text-align: right; font-weight: 700; color: #ff2c8d;">R$ ${order.finalPrice.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        <p style="${EMAIL_STYLES.p}">
          Seus acessos já foram processados. Nossa equipe financeira enviará a nota fiscal em breve.
        </p>
      `, "BPlen HUB - Departamento Financeiro")
    });
    console.log(`✉️ [E-mail] "Pagamento Aprovado" enviado para ${user.email}`);
  } catch (error) {
    console.error("❌ ERRO ao enviar e-mail de aprovação:", error);
  }
}

/**
 * 📧 E-mail 3: Acesso Liberado
 * Remetente: hub@bplen.com
 * Destino: /hub/membro
 */
export async function sendServiceGrantedEmail(user: UserDetails, productTitle: string) {
  try {
    const baseUrl = clientEnv.NEXT_PUBLIC_APP_URL || "https://bplen.com";
    
    await resend.emails.send({
      from: "BPlen HUB <hub@bplen.com>",
      to: user.email,
      subject: `[BPlen HUB] Acesso Liberado: ${productTitle}`,
      html: buildSoberanaEmail(`
        <h2 style="${EMAIL_STYLES.h2}">Sua jornada começou.</h2>
        <p style="${EMAIL_STYLES.p}">
          Olá, <strong>${user.name || "Membro"}</strong>. 
          O seu acesso ao serviço <strong>${productTitle}</strong> foi oficialmente liberado no BPlen HUB.
        </p>
        <p style="${EMAIL_STYLES.p}">
          Você já pode acessar sua área exclusiva para iniciar as atividades e acompanhar seu progresso.
        </p>
        <a href="${baseUrl}/hub/membro" style="${EMAIL_STYLES.button}">
          Acessar minha conta
        </a>
        <p style="font-size: 12px; color: #94A3B8; margin-top: 20px;">
          Recomendamos que você inicie pela aba de Serviços para visualizar sua trilha personalizada.
        </p>
      `, "Equipe BPlen HUB")
    });
    console.log(`✉️ [E-mail] "Serviço Liberado" enviado para ${user.email}`);
  } catch (error) {
    console.error("❌ ERRO ao enviar e-mail de liberação:", error);
  }
}
