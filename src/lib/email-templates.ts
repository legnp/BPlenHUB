/**
 * BPlen HUB — Email Templates (📧)
 * Centraliza os templates HTML para notificações de agenda e sessões.
 * Refatorado para utilizar o motor Soberana v3.1 de E-mails.
 */

import { buildSoberanaEmail, EMAIL_STYLES } from "./emails/soberana-layout";

interface BookingEmailData {
  displayName: string;
  summary: string;
  dateStr: string;
  timeStr: string;
  mentor?: string;
  theme?: string;
  oneToOneInfo?: string;
  htmlLink: string;
  cancelLink: string;
}

/**
 * Template de Confirmação de Agendamento (1 to 1 ou Geral)
 */
export function getBookingConfirmationEmail(data: BookingEmailData) {
  const { displayName, summary, dateStr, timeStr, mentor, theme, oneToOneInfo, htmlLink, cancelLink } = data;
  
  return buildSoberanaEmail(`
    <h2 style="\${EMAIL_STYLES.h2}">Agendamento confirmado.</h2>
    <p style="\${EMAIL_STYLES.p}">Olá, <b>\${displayName}</b>.</p>
    
    <p style="\${EMAIL_STYLES.p}">
      Confirmamos o seu agendamento para a sessão descrita abaixo.
    </p>

    <div style="background: #F8FAFC; padding: 20px; border-radius: 12px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8; font-weight: bold; text-transform: uppercase;">Detalhes do Agendamento</p>
      <p style="margin: 4px 0; font-size: 14px;">Evento: <strong>\${summary}</strong></p>
      <p style="margin: 4px 0; font-size: 14px;">Data e Hora: <strong>\${dateStr} às \${timeStr}h</strong></p>
      <p style="margin: 4px 0; font-size: 14px;">Orientador: <strong>\${mentor || "BPlen"}</strong></p>
      \${theme ? \`<p style="margin: 4px 0; font-size: 14px;">Tema: <strong>\${theme}</strong></p>\` : ""}
      \${oneToOneInfo ? \`<div style="margin-top: 12px; border-top: 1px solid #E2E8F0; padding-top: 12px;">\${oneToOneInfo}</div>\` : ""}
    </div>

    <a href="\${htmlLink}" style="\${EMAIL_STYLES.button}">
      Acessar Reunião
    </a>

    <p style="font-size: 12px; color: #94A3B8; margin-top: 20px;">
      Recomendamos adicionar este compromisso à sua agenda pessoal. Um arquivo de calendário (.ics) foi anexado para sua conveniência.
    </p>

    <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 30px 0;" />
    
    <p style="font-size: 12px; color: #64748B; text-align: left; line-height: 1.5;">
      Deseja reagendar ou cancelar? <br/>
      <a href="\${cancelLink}" style="color: #1D1D1F; font-weight: bold;">Gerenciar minha agenda no HUB</a>
    </p>
  `, "BPlen HUB - Suporte de Agenda");
}

/**
 * Template de Inclusão Manual por Admin
 */
export function getAdminInclusionEmail(data: Omit<BookingEmailData, 'cancelLink' | 'oneToOneInfo'>) {
  const { displayName, summary, dateStr, timeStr, mentor, htmlLink } = data;

  return buildSoberanaEmail(`
    <h2 style="\${EMAIL_STYLES.h2}">Inclusão confirmada.</h2>
    <p style="\${EMAIL_STYLES.p}">Olá, <b>\${displayName}</b>.</p>
    <p style="\${EMAIL_STYLES.p}">Você foi adicionado manualmente a um evento por nossa equipe administrativa.</p>
    
    <div style="background: #F8FAFC; padding: 20px; border-radius: 12px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8; font-weight: bold; text-transform: uppercase;">Detalhes do Agendamento</p>
      <p style="margin: 4px 0; font-size: 14px;">Evento: <strong>\${summary}</strong></p>
      <p style="margin: 4px 0; font-size: 14px;">Data e Hora: <strong>\${dateStr} às \${timeStr}h</strong></p>
      <p style="margin: 4px 0; font-size: 14px;">Orientador: <strong>\${mentor || "BPlen"}</strong></p>
    </div>

    <a href="\${htmlLink}" style="\${EMAIL_STYLES.button}">
      Acessar Reunião
    </a>
  `, "BPlen HUB - Suporte de Agenda");
}

/**
 * Template de Cancelamento de Agendamento
 */
export function getCancellationEmail(data: { nickname: string; eventSummary: string; platformLink: string }) {
  const { nickname, eventSummary, platformLink } = data;

  return buildSoberanaEmail(`
    <h2 style="\${EMAIL_STYLES.h2} color: #ef4444;">Agendamento cancelado.</h2>
    <p style="\${EMAIL_STYLES.p}">Olá, <b>\${nickname}</b>.</p>
    
    <p style="\${EMAIL_STYLES.p}">
      Sua solicitação de cancelamento para o evento abaixo foi processada com sucesso e a vaga já foi devolvida ao ecossistema da BPlen.
    </p>

    <div style="background: #FEF2F2; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #ef4444;">
      <p style="margin: 0 0 8px 0; font-size: 11px; color: #ef4444; font-weight: bold; text-transform: uppercase;">Evento Cancelado</p>
      <p style="margin: 4px 0; font-size: 14px; color: #1D1D1F;"><strong>\${eventSummary}</strong></p>
    </div>

    <a href="\${platformLink}" style="\${EMAIL_STYLES.buttonDanger}">
      Marcar Novo Horário
    </a>

    <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 30px 0;" />
    
    <p style="font-size: 12px; color: #94A3B8; text-align: left; line-height: 1.5;">
      Se você não solicitou este cancelamento, entre em contato imediatamente com o seu Pós-Venda ou Mentor.
    </p>
  `, "BPlen HUB - Suporte de Agenda");
}
