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

/**
 * 📧 E-mail 4: Compra Gratuita Aprovada (Recibo R$ 0,00)
 * Remetente: financeiro@bplen.com
 */
export async function sendFreeOrderApprovedEmail(user: UserDetails, order: OrderDetails) {
  try {
    const date = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
    const baseUrl = clientEnv.NEXT_PUBLIC_APP_URL || "https://bplen.com";
    
    await resend.emails.send({
      from: "BPlen Financeiro <financeiro@bplen.com>",
      to: user.email,
      subject: `${user.name || "Membro"}, sua contratação foi confirmada.`,
      html: buildSoberanaEmail(`
        <h2 style="${EMAIL_STYLES.h2}">Acesso Liberado!</h2>
        <p style="${EMAIL_STYLES.p}">
          Confirmamos a contratação gratuita para a <strong>${order.productTitle}</strong>. 
          Abaixo você encontra o resumo da sua solicitação.
        </p>
        <div style="background: #F8FAFC; padding: 20px; border-radius: 12px; margin: 24px 0;">
          <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8; font-weight: bold; text-transform: uppercase;">Resumo da Contratação</p>
          <p style="margin: 4px 0; font-size: 14px;">Serviço: <strong>${order.productTitle}</strong></p>
          <p style="margin: 4px 0; font-size: 14px;">Data: <strong>${date}</strong></p>
          <p style="margin: 4px 0; font-size: 14px;">Transação: <strong>#${order.orderId}</strong></p>
          <p style="margin: 4px 0; font-size: 14px;">Total: <strong>R$ 0,00</strong></p>
        </div>
        <a href="${baseUrl}/hub/membro" style="${EMAIL_STYLES.button}">
          Acessar minha conta
        </a>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #F0F0F0; font-size: 12px; color: #94A3B8;">
          Ao realizar esta contratação, você concordou com os nossos <a href="https://bplen.com/termos-e-condicoes" style="color: #1D1D1F; text-decoration: underline;">Termos e Condições</a> e com a nossa <a href="https://bplen.com/politica-de-privacidade" style="color: #1D1D1F; text-decoration: underline;">Política de Privacidade</a>.
        </div>
      `, "BPlen HUB - Departamento Financeiro")
    });
    console.log(`✉️ [E-mail] "Compra Gratuita Aprovada" enviado para ${user.email}`);
  } catch (error) {
    console.error("❌ ERRO ao enviar e-mail de compra gratuita:", error);
  }
}

/**
 * 📧 E-mail 5: Cupom Resgatado
 * Remetente: hub@bplen.com
 * Destinatários: Usuário e promo@bplen.com (via bcc ou campo to secundário)
 * Design: Soberana v3.1 (sem emojis, alinhado à esquerda)
 */
export async function sendCouponRedeemedEmail(
  user: { name: string; email: string },
  coupon: { code: string; discount: number; serviceName: string; expiresAt: string },
  termsPdfUrl?: string
) {
  try {
    await resend.emails.send({
      from: "BPlen HUB <hub@bplen.com>",
      to: user.email,
      cc: "promo@bplen.com",
      subject: `Confirmado: Seu cupom BPlen foi resgatado`,
      html: buildSoberanaEmail(`
        <h2 style="${EMAIL_STYLES.h2}">Cupom resgatado.</h2>
        <p style="${EMAIL_STYLES.p}">Olá, <b>${user.name || "Membro BPlen"}</b>.</p>
        
        <p style="${EMAIL_STYLES.p}">
          Confirmamos que o seu cupom <strong>${coupon.code}</strong> foi resgatado com sucesso e o desconto de <strong>${coupon.discount}%</strong> foi aplicado para o serviço <strong>${coupon.serviceName}</strong>.
        </p>

        <div style="background: #F8FAFC; padding: 20px; border-radius: 12px; margin: 24px 0;">
          <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8; font-weight: bold; text-transform: uppercase;">Resumo do Resgate</p>
          <p style="margin: 4px 0; font-size: 14px;">Cupom: <strong>${coupon.code}</strong></p>
          <p style="margin: 4px 0; font-size: 14px;">Desconto: <strong>${coupon.discount}%</strong></p>
          <p style="margin: 4px 0; font-size: 14px;">Validade: <strong>Até ${coupon.expiresAt}</strong></p>
        </div>

        <p style="${EMAIL_STYLES.p}">
          O termo de aceitação digital contendo as regras de uso foi registrado no sistema e uma cópia em texto foi armazenada na pasta <strong>5.Documentos</strong> do seu Google Drive pessoal.
        </p>
        
        ${termsPdfUrl ? `<p style="${EMAIL_STYLES.p}">Você também pode acessar as regras do termo através do link: <a href="${termsPdfUrl}" style="color: #1D1D1F; font-weight: bold; text-decoration: underline;">Visualizar Documento no Drive</a></p>` : ""}

        <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 30px 0;" />
        
        <p style="font-size: 12px; color: #64748B; text-align: left; line-height: 1.5;">
          Equipe BPlen HUB
        </p>
      `, "Equipe BPlen HUB")
    });
    console.log(`[E-mail] Cupom resgatado enviado para ${user.email}`);
  } catch (error) {
    console.error("[Erro] Falha ao enviar e-mail de cupom resgatado:", error);
  }
}

/**
 * 📧 E-mail 6: Cupom Expirado
 * Remetente: hub@bplen.com
 * Destinatários: Usuário e promo@bplen.com
 * Design: Soberana v3.1 (sem emojis, alinhado à esquerda)
 */
export async function sendCouponExpiredEmail(
  user: { name: string; email: string },
  coupon: { code: string; serviceName: string }
) {
  try {
    await resend.emails.send({
      from: "BPlen HUB <hub@bplen.com>",
      to: user.email,
      cc: "promo@bplen.com",
      subject: `Aviso: Seu cupom BPlen expirou`,
      html: buildSoberanaEmail(`
        <h2 style="${EMAIL_STYLES.h2}">Cupom expirado.</h2>
        <p style="${EMAIL_STYLES.p}">Olá, <b>${user.name || "Membro BPlen"}</b>.</p>
        
        <p style="${EMAIL_STYLES.p}">
          O prazo de validade do seu cupom <strong>${coupon.code}</strong> para o serviço <strong>${coupon.serviceName}</strong> expirou.
        </p>

        <div style="background: #F8FAFC; padding: 20px; border-radius: 12px; margin: 24px 0;">
          <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8; font-weight: bold; text-transform: uppercase;">Detalhes do Cupom</p>
          <p style="margin: 4px 0; font-size: 14px;">Cupom: <strong>${coupon.code}</strong></p>
          <p style="margin: 4px 0; font-size: 14px;">Serviço: <strong>${coupon.serviceName}</strong></p>
          <p style="margin: 4px 0; font-size: 14px;">Status: <strong>Expirado</strong></p>
        </div>

        <p style="${EMAIL_STYLES.p}">
          Caso queira obter uma nova oportunidade ou tirar dúvidas, fale conosco na sua próxima sessão.
        </p>

        <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 30px 0;" />
        
        <p style="font-size: 12px; color: #64748B; text-align: left; line-height: 1.5;">
          Equipe BPlen HUB
        </p>
      `, "Equipe BPlen HUB")
    });
    console.log(`[E-mail] Cupom expirado enviado para ${user.email}`);
  } catch (error) {
    console.error("[Erro] Falha ao enviar e-mail de cupom expirado:", error);
  }
}

