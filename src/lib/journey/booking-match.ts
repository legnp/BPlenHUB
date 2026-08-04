import { SubStepConfig } from "@/types/journey";
import { GoogleCalendarEvent } from "@/types/calendar";
import { getMeetingFilterKeyword } from "./meeting-keyword";

/**
 * Fonte unica do casamento parada (type=meeting) <-> evento da agenda.
 *
 * Ate o BUG-099 esta regra existia em TRES copias com criterios diferentes: o
 * calendario de oferta e o cabecalho da parada (`StepRenderer`) casavam por
 * "tema OU palavra-chave", enquanto a lista de agendamentos confirmados
 * (`UserBookings`) casava por "palavra-chave E tema", exigindo um tema que
 * nenhum evento da base tem preenchido. O cabecalho anunciava a sessao como
 * confirmada e a lista logo abaixo vinha vazia — em 8 de 8 pares reais.
 *
 * A regra canonica e a do lado que oferece o slot: o TEMA tem precedencia
 * (quando existe, e a atribuicao explicita da Gestora no Google Calendar) e a
 * palavra-chave e o fallback. Ver Licoes 21/37 do RETROSPECTIVE.
 *
 * Esta funcao e o ponto unico que a Fase 3.3 do AGENDA-SYNC-DESIGN vai
 * substituir pelo casamento por `serviceCode` gravado no agendamento — trocar
 * aqui passa a valer para as tres telas de uma vez.
 */

/** Remove acentos e caixa para comparacao resiliente (Licao 30). */
export function normalizeForMatch(value: string | undefined | null): string {
  return (value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/**
 * O evento da agenda pertence a esta parada da jornada?
 *
 * Nao decide nada sobre o estado do agendamento (cancelado, realizado); isso e
 * responsabilidade de quem chama.
 */
export function eventMatchesSubstep(
  event: Pick<GoogleCalendarEvent, "summary" | "theme"> | null | undefined,
  substep: Pick<SubStepConfig, "referenceId" | "title">
): boolean {
  if (!event) return false;

  if (event.theme) {
    return normalizeForMatch(event.theme) === normalizeForMatch(substep.title);
  }

  const keyword = normalizeForMatch(getMeetingFilterKeyword(substep));
  if (!keyword) return false;
  return normalizeForMatch(event.summary).includes(keyword);
}

/**
 * Este AGENDAMENTO pertence a esta parada?
 *
 * Identificador tem precedencia sobre texto (Licao 19): quando o agendamento carrega a
 * parada de origem (`subStepId`, gravado a partir da Fase 3.3), a resposta e exata. So
 * agendamento anterior a essa fase — que nao tem o campo — cai no casamento por texto.
 *
 * Por que o identificador e obrigatorio aqui: as 10 sessoes de MentoCoach sao eventos
 * `Consultoria Individual` indistinguiveis pelo titulo. Sem `subStepId`, agendar a 1a
 * marcaria as dez como confirmadas — a mesma familia de bug do BUG-077/BUG-118.
 */
export function bookingMatchesSubstep(
  booking: {
    subStepId?: string;
    eventDetail?: Pick<GoogleCalendarEvent, "summary" | "theme"> | null;
  } | null | undefined,
  substep: Pick<SubStepConfig, "id" | "referenceId" | "title">
): boolean {
  if (!booking) return false;
  if (booking.subStepId) return booking.subStepId === substep.id;
  return eventMatchesSubstep(booking.eventDetail, substep);
}
