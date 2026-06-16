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
    <h2 style="${EMAIL_STYLES.h2}">Agendamento confirmado.</h2>
    <p style="${EMAIL_STYLES.p}">Olá, <b>${displayName}</b>.</p>
    
    <p style="${EMAIL_STYLES.p}">
      Confirmamos o seu agendamento para a sessão descrita abaixo.
    </p>

    <div style="background: #F8FAFC; padding: 20px; border-radius: 12px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8; font-weight: bold; text-transform: uppercase;">Detalhes do Agendamento</p>
      <p style="margin: 4px 0; font-size: 14px;">Evento: <strong>${summary}</strong></p>
      <p style="margin: 4px 0; font-size: 14px;">Data e Hora: <strong>${dateStr} às ${timeStr}h (Horário de Brasília)</strong></p>
      <p style="margin: 4px 0; font-size: 14px;">Orientador: <strong>${mentor || "BPlen"}</strong></p>
      ${theme ? `<p style="margin: 4px 0; font-size: 14px;">Tema: <strong>${theme}</strong></p>` : ""}
      ${oneToOneInfo ? `<div style="margin-top: 12px; border-top: 1px solid #E2E8F0; padding-top: 12px;">${oneToOneInfo}</div>` : ""}
    </div>

    <a href="${htmlLink}" style="${EMAIL_STYLES.button}">
      Acessar Reunião
    </a>

    <p style="font-size: 12px; color: #94A3B8; margin-top: 20px;">
      Recomendamos adicionar este compromisso à sua agenda pessoal. Um arquivo de calendário (.ics) foi anexado para sua conveniência.
    </p>

    <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 30px 0;" />
    
    <p style="font-size: 12px; color: #64748B; text-align: left; line-height: 1.5;">
      Deseja reagendar ou cancelar? <br/>
      <a href="${cancelLink}" style="color: #1D1D1F; font-weight: bold;">Gerenciar minha agenda no HUB</a>
    </p>
  `, "BPlen HUB - Suporte de Agenda");
}

/**
 * Template de Inclusão Manual por Admin
 */
export function getAdminInclusionEmail(data: Omit<BookingEmailData, 'cancelLink' | 'oneToOneInfo'>) {
  const { displayName, summary, dateStr, timeStr, mentor, htmlLink } = data;

  return buildSoberanaEmail(`
    <h2 style="${EMAIL_STYLES.h2}">Inclusão confirmada.</h2>
    <p style="${EMAIL_STYLES.p}">Olá, <b>${displayName}</b>.</p>
    <p style="${EMAIL_STYLES.p}">Você foi adicionado manualmente a um evento por nossa equipe administrativa.</p>
    
    <div style="background: #F8FAFC; padding: 20px; border-radius: 12px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8; font-weight: bold; text-transform: uppercase;">Detalhes do Agendamento</p>
      <p style="margin: 4px 0; font-size: 14px;">Evento: <strong>${summary}</strong></p>
      <p style="margin: 4px 0; font-size: 14px;">Data e Hora: <strong>${dateStr} às ${timeStr}h (Horário de Brasília)</strong></p>
      <p style="margin: 4px 0; font-size: 14px;">Orientador: <strong>${mentor || "BPlen"}</strong></p>
    </div>

    <a href="${htmlLink}" style="${EMAIL_STYLES.button}">
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
    <h2 style="${EMAIL_STYLES.h2}; color: #ef4444;">Agendamento cancelado.</h2>
    <p style="${EMAIL_STYLES.p}">Olá, <b>${nickname}</b>.</p>
    
    <p style="${EMAIL_STYLES.p}">
      Sua solicitação de cancelamento para o evento abaixo foi processada com sucesso e a vaga já foi devolvida ao ecossistema da BPlen.
    </p>

    <div style="background: #FEF2F2; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #ef4444;">
      <p style="margin: 0 0 8px 0; font-size: 11px; color: #ef4444; font-weight: bold; text-transform: uppercase;">Evento Cancelado</p>
      <p style="margin: 4px 0; font-size: 14px; color: #1D1D1F;"><strong>${eventSummary}</strong></p>
    </div>

    <a href="${platformLink}" style="${EMAIL_STYLES.buttonDanger}">
      Marcar Novo Horário
    </a>

    <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 30px 0;" />
    
    <p style="font-size: 12px; color: #94A3B8; text-align: left; line-height: 1.5;">
      Se você não solicitou este cancelamento, entre em contato imediatamente com o seu Pós-Venda ou Mentor.
    </p>
  `, "BPlen HUB - Suporte de Agenda");
}

/**
 * Template de Reagendamento de Evento
 */
export function getRescheduleEmail(data: {
  participantName: string;
  eventName: string;
  oldDateStr: string;
  oldTimeStr: string;
  oldMentor: string;
  newDateStr: string;
  newTimeStr: string;
  newMentor: string;
  platformLink: string;
}) {
  const { participantName, eventName, oldDateStr, oldTimeStr, oldMentor, newDateStr, newTimeStr, newMentor, platformLink } = data;

  return buildSoberanaEmail(`
    <h2 style="${EMAIL_STYLES.h2}">Alteração de agendamento confirmada.</h2>
    <p style="${EMAIL_STYLES.p}">Olá, <b>${participantName}</b>.</p>
    
    <p style="${EMAIL_STYLES.p}">
      Informamos que o seu agendamento para o evento <strong>${eventName}</strong> foi alterado. Confira abaixo os detalhes do agendamento anterior e da sua nova sessão.
    </p>

    <!-- Box Antigo (Cinza) -->
    <div style="background: #F8FAFC; padding: 20px; border-radius: 12px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8; font-weight: bold; text-transform: uppercase;">Agendamento Anterior</p>
      <p style="margin: 4px 0; font-size: 14px; color: #64748B;">Data e Hora: <strong>${oldDateStr} às ${oldTimeStr}h (Brasília)</strong></p>
      <p style="margin: 4px 0; font-size: 14px; color: #64748B;">Orientador: <strong>${oldMentor}</strong></p>
    </div>

    <!-- Box Novo (Verde suave) -->
    <div style="background: #F0FDF4; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #BBF7D0;">
      <p style="margin: 0 0 8px 0; font-size: 11px; color: #16A34A; font-weight: bold; text-transform: uppercase;">Novo Agendamento</p>
      <p style="margin: 4px 0; font-size: 14px; color: #15803D;">Data e Hora: <strong>${newDateStr} às ${newTimeStr}h (Horário de Brasília)</strong></p>
      <p style="margin: 4px 0; font-size: 14px; color: #15803D;">Orientador: <strong>${newMentor}</strong></p>
    </div>

    <a href="${platformLink}" style="${EMAIL_STYLES.button}">
      Acessar Nova Reunião
    </a>

    <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 30px 0;" />
    
    <p style="font-size: 12px; color: #94A3B8; text-align: left; line-height: 1.5;">
      Recomendamos atualizar este compromisso na sua agenda pessoal. Caso tenha dúvidas ou precise gerenciar seus horários, acesse o painel do HUB.
    </p>
  `, "BPlen HUB - Suporte de Agenda");
}

// 1. Notificacao de Novo Agendamento
export interface TeamBookingNotificationData {
  displayName: string;
  userEmail: string;
  summary: string;
  dateStr: string;
  timeStr: string;
  mentor?: string;
  theme?: string;
  oneToOneInfo?: string;
  isLead?: boolean;
}

export function getTeamBookingNotificationEmail(data: TeamBookingNotificationData) {
  const { displayName, userEmail, summary, dateStr, timeStr, mentor, theme, oneToOneInfo, isLead } = data;
  return buildSoberanaEmail(`
    <h2 style="${EMAIL_STYLES.h2}; color: #16a34a;">Novo agendamento realizado</h2>
    <p style="${EMAIL_STYLES.p}">Olá equipe BPlen,</p>
    <p style="${EMAIL_STYLES.p}">
      Um novo agendamento foi registrado com sucesso no portal BPlen HUB. Confira os detalhes abaixo:
    </p>

    <div style="background: #F8FAFC; padding: 20px; border-radius: 12px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8; font-weight: bold; text-transform: uppercase;">Dados do Membro</p>
      <p style="margin: 4px 0; font-size: 14px;">Nome: <strong>${displayName}</strong></p>
      <p style="margin: 4px 0; font-size: 14px;">E-mail: <strong>${userEmail}</strong></p>
      <p style="margin: 4px 0; font-size: 14px;">Tipo: <strong>${isLead ? "Lead (Externo)" : "Membro Ativo"}</strong></p>
    </div>

    <div style="background: #F8FAFC; padding: 20px; border-radius: 12px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8; font-weight: bold; text-transform: uppercase;">Detalhes do Compromisso</p>
      <p style="margin: 4px 0; font-size: 14px;">Sessão: <strong>${summary}</strong></p>
      <p style="margin: 4px 0; font-size: 14px;">Data e Hora: <strong>${dateStr} às ${timeStr}h (Brasília)</strong></p>
      <p style="margin: 4px 0; font-size: 14px;">Orientador: <strong>${mentor || "BPlen"}</strong></p>
      ${theme ? `<p style="margin: 4px 0; font-size: 14px;">Tema: <strong>${theme}</strong></p>` : ""}
      ${oneToOneInfo ? `<div style="margin-top: 12px; border-top: 1px solid #E2E8F0; padding-top: 12px;">${oneToOneInfo}</div>` : ""}
    </div>

    <a href="https://hub.bplen.com/admin/fs/agenda" style="${EMAIL_STYLES.button}">
      Acessar Painel de Agenda
    </a>
  `, "BPlen HUB - Notificacoes Internas");
}

// 2. Notificacao de Cancelamento
export interface TeamCancellationNotificationData {
  nickname: string;
  email: string;
  eventSummary: string;
}

export function getTeamCancellationNotificationEmail(data: TeamCancellationNotificationData) {
  const { nickname, email, eventSummary } = data;
  return buildSoberanaEmail(`
    <h2 style="${EMAIL_STYLES.h2}; color: #ef4444;">Agendamento cancelado</h2>
    <p style="${EMAIL_STYLES.p}">Olá equipe BPlen,</p>
    <p style="${EMAIL_STYLES.p}">
      O agendamento do membro abaixo foi cancelado e a vaga correspondente foi devolvida para disponibilidade no sistema.
    </p>

    <div style="background: #FEF2F2; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #ef4444;">
      <p style="margin: 0 0 8px 0; font-size: 11px; color: #ef4444; font-weight: bold; text-transform: uppercase;">Dados do Cancelamento</p>
      <p style="margin: 4px 0; font-size: 14px; color: #1D1D1F;">Membro: <strong>${nickname}</strong></p>
      <p style="margin: 4px 0; font-size: 14px; color: #1D1D1F;">E-mail: <strong>${email}</strong></p>
      <p style="margin: 4px 0; font-size: 14px; color: #1D1D1F;">Evento: <strong>${eventSummary}</strong></p>
    </div>

    <a href="https://hub.bplen.com/admin/fs/agenda" style="${EMAIL_STYLES.button}">
      Acessar Painel de Agenda
    </a>
  `, "BPlen HUB - Notificacoes Internas");
}

// 3. Notificacao de Inclusao Administrativa
export interface TeamInclusionNotificationData {
  displayName: string;
  userEmail: string;
  summary: string;
  dateStr: string;
  timeStr: string;
  mentor?: string;
}

export function getTeamInclusionNotificationEmail(data: TeamInclusionNotificationData) {
  const { displayName, userEmail, summary, dateStr, timeStr, mentor } = data;
  return buildSoberanaEmail(`
    <h2 style="${EMAIL_STYLES.h2}; color: #1e40af;">Inclusao administrativa realizada</h2>
    <p style="${EMAIL_STYLES.p}">Olá equipe BPlen,</p>
    <p style="${EMAIL_STYLES.p}">
      Um administrador incluiu manualmente o membro abaixo no evento especificado.
    </p>

    <div style="background: #F8FAFC; padding: 20px; border-radius: 12px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8; font-weight: bold; text-transform: uppercase;">Dados do Membro</p>
      <p style="margin: 4px 0; font-size: 14px;">Nome: <strong>${displayName}</strong></p>
      <p style="margin: 4px 0; font-size: 14px;">E-mail: <strong>${userEmail}</strong></p>
    </div>

    <div style="background: #F8FAFC; padding: 20px; border-radius: 12px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8; font-weight: bold; text-transform: uppercase;">Detalhes do Compromisso</p>
      <p style="margin: 4px 0; font-size: 14px;">Sessao: <strong>${summary}</strong></p>
      <p style="margin: 4px 0; font-size: 14px;">Data e Hora: <strong>${dateStr} as ${timeStr}h (Brasilia)</strong></p>
      <p style="margin: 4px 0; font-size: 14px;">Orientador: <strong>${mentor || "BPlen"}</strong></p>
    </div>

    <a href="https://hub.bplen.com/admin/fs/agenda" style="${EMAIL_STYLES.button}">
      Acessar Painel de Agenda
    </a>
  `, "BPlen HUB - Notificacoes Internas");
}

// 4. Notificacao de Reagendamento Administrativo
export interface TeamRescheduleNotificationData {
  participantName: string;
  email: string;
  eventName: string;
  oldDateStr: string;
  oldTimeStr: string;
  oldMentor: string;
  newDateStr: string;
  newTimeStr: string;
  newMentor: string;
}

export function getTeamRescheduleNotificationEmail(data: TeamRescheduleNotificationData) {
  const { participantName, email, eventName, oldDateStr, oldTimeStr, oldMentor, newDateStr, newTimeStr, newMentor } = data;
  return buildSoberanaEmail(`
    <h2 style="${EMAIL_STYLES.h2}; color: #d97706;">Reagendamento de evento realizado</h2>
    <p style="${EMAIL_STYLES.p}">Olá equipe BPlen,</p>
    <p style="${EMAIL_STYLES.p}">
      O agendamento do membro abaixo foi alterado com sucesso. Veja as mudancas abaixo:
    </p>

    <div style="background: #F8FAFC; padding: 20px; border-radius: 12px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8; font-weight: bold; text-transform: uppercase;">Dados do Membro</p>
      <p style="margin: 4px 0; font-size: 14px;">Nome: <strong>${participantName}</strong></p>
      <p style="margin: 4px 0; font-size: 14px;">E-mail: <strong>${email}</strong></p>
      <p style="margin: 4px 0; font-size: 14px;">Sessao: <strong>${eventName}</strong></p>
    </div>

    <div style="background: #F8FAFC; padding: 20px; border-radius: 12px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8; font-weight: bold; text-transform: uppercase;">Agendamento Anterior</p>
      <p style="margin: 4px 0; font-size: 14px; color: #64748B;">Data e Hora: <strong>${oldDateStr} as ${oldTimeStr}h (Brasilia)</strong></p>
      <p style="margin: 4px 0; font-size: 14px; color: #64748B;">Orientador: <strong>${oldMentor}</strong></p>
    </div>

    <div style="background: #F0FDF4; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #BBF7D0;">
      <p style="margin: 0 0 8px 0; font-size: 11px; color: #16A34A; font-weight: bold; text-transform: uppercase;">Novo Agendamento</p>
      <p style="margin: 4px 0; font-size: 14px; color: #15803D;">Data e Hora: <strong>${newDateStr} as ${newTimeStr}h (Horario de Brasilia)</strong></p>
      <p style="margin: 4px 0; font-size: 14px; color: #15803D;">Orientador: <strong>${newMentor}</strong></p>
    </div>

    <a href="https://hub.bplen.com/admin/fs/agenda" style="${EMAIL_STYLES.button}">
      Acessar Nova Reuniao
    </a>
  `, "BPlen HUB - Notificacoes Internas");
}

// 5. Notificacao de Nova Proposta Externa de Agenda
export interface TeamProposalNotificationData {
  name: string;
  email: string;
  phone: string;
  optionsHtml: string;
  screeningHtml: string;
}

export function getTeamProposalNotificationEmail(data: TeamProposalNotificationData) {
  const { name, email, phone, optionsHtml, screeningHtml } = data;
  return buildSoberanaEmail(`
    <h2 style="${EMAIL_STYLES.h2}; color: #c026d3;">Nova proposta de agenda externa recebida</h2>
    <p style="${EMAIL_STYLES.p}">Olá equipe BPlen,</p>
    <p style="${EMAIL_STYLES.p}">
      Uma proposta de agendamento de lead externo foi recebida atraves do portal institucional de agendamento.
    </p>

    <div style="background: #F8FAFC; padding: 20px; border-radius: 12px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8; font-weight: bold; text-transform: uppercase;">Dados do Lead</p>
      <p style="margin: 4px 0; font-size: 14px;">Nome: <strong>${name}</strong></p>
      <p style="margin: 4px 0; font-size: 14px;">E-mail: <strong>${email}</strong></p>
      <p style="margin: 4px 0; font-size: 14px;">Telefone: <strong>${phone}</strong></p>
    </div>

    <div style="background: #F5F3FF; padding: 20px; border-radius: 12px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 11px; color: #7C3AED; font-weight: bold; text-transform: uppercase;">Opcoes Propostas</p>
      <ul style="padding: 0; list-style: none; margin: 0; font-size: 14px; color: #1D1D1F;">
        ${optionsHtml}
      </ul>
    </div>

    <div style="background: #F8FAFC; padding: 20px; border-radius: 12px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8; font-weight: bold; text-transform: uppercase;">Respostas da Triagem (Screening)</p>
      ${screeningHtml}
    </div>

    <a href="https://hub.bplen.com/admin/fs/agenda" style="${EMAIL_STYLES.button}">
      Acessar Painel de Agenda
    </a>
  `, "BPlen HUB - Notificacoes Internas");
}

