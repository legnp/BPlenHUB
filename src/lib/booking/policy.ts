import { addDays, addHours, isBefore, parseISO, startOfDay, getISOWeek, getYear } from "date-fns";
import { CALENDAR_CONFIG } from "@/config/calendarConfig";

/**
 * Politica de agendamento do membro — fonte unica compartilhada entre a tela
 * (`Calendar`) e o servidor (`bookEventAction`/`cancelBookingAction`).
 *
 * Existe porque as regras viviam apenas no cliente: a tela escondia/desabilitava
 * o evento e o servidor aceitava qualquer requisicao. Cliente e servidor agora
 * chamam as MESMAS funcoes daqui, entao nao ha como divergirem.
 *
 * IMPORTANTE: nao vale para o funil de lead publico, que tem regra propria em
 * `CALENDAR_CONFIG.PUBLIC_BOOKING_SETTINGS` (janela de 33 dias). O servidor so
 * aplica esta politica quando o agendamento tem matricula (fluxo de membro).
 */

/** Tipo da sessao para o limite semanal. Eventos com o mesmo nome sao o mesmo tipo. */
export function resolveEventType(summary: string | undefined | null): string {
  return (summary || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

/** Semana ISO + ano de uma data de evento — a chave do limite semanal. */
export function resolveEventWeek(startISO: string): { week: number; year: number } {
  const date = parseISO(startISO);
  return { week: getISOWeek(date), year: getYear(date) };
}

/**
 * Limites da janela agendavel, em DIAS de calendario: o membro pode agendar
 * qualquer sessao que caia entre o dia (hoje + MIN) e o dia (hoje + MAX),
 * ambos inclusive — que e como a politica e comunicada ("de 20 a 3 dias antes").
 *
 * Por isso `closesAt` usa MAX + 1: ele e o inicio do dia seguinte ao ultimo dia
 * valido, entao o dia (hoje + MAX) cabe inteiro. A regra legada do Onboarding
 * fechava no inicio do dia (hoje + MAX), o que na pratica excluia o 20o dia e
 * contradiria o texto publicado; a fronteira agora e simetrica a do minimo.
 */
function getWindowBounds(now: Date) {
  return {
    opensAt: addDays(startOfDay(now), CALENDAR_CONFIG.MIN_LEAD_TIME_DAYS),
    closesAt: addDays(startOfDay(now), CALENDAR_CONFIG.MAX_LEAD_TIME_DAYS + 1)
  };
}

/**
 * A sessao esta dentro da janela agendavel (entre MIN e MAX dias de antecedencia)?
 * `now` e injetavel para o teste nao depender do relogio.
 */
export function isWithinBookingWindow(startISO: string, now: Date = new Date()): boolean {
  const evDate = parseISO(startISO);
  const { opensAt, closesAt } = getWindowBounds(now);

  if (isBefore(evDate, opensAt)) return false;
  if (!isBefore(evDate, closesAt)) return false;
  return true;
}

/** Motivo da recusa, para o servidor devolver uma mensagem util ao membro. */
export function getBookingWindowError(startISO: string, now: Date = new Date()): string | null {
  const evDate = parseISO(startISO);
  const { opensAt, closesAt } = getWindowBounds(now);

  if (isBefore(evDate, opensAt)) {
    return `Esta sessão precisa ser agendada com no mínimo ${CALENDAR_CONFIG.MIN_LEAD_TIME_DAYS} dias de antecedência.`;
  }
  if (!isBefore(evDate, closesAt)) {
    return `Esta sessão ainda não abriu para agendamento. O agendamento abre ${CALENDAR_CONFIG.MAX_LEAD_TIME_DAYS} dias antes da data.`;
  }
  return null;
}

/**
 * O membro ja atingiu o limite semanal PARA ESTE TIPO de sessao?
 * Tipos diferentes na mesma semana sao permitidos — por isso a comparacao inclui
 * o tipo, e nao apenas semana/ano (comportamento anterior, que trancava a semana
 * inteira apos qualquer agendamento).
 */
export function hasReachedWeeklyLimit(
  existing: Array<{ week?: number; year?: number; eventType?: string }>,
  target: { week: number; year: number; eventType: string }
): boolean {
  const sameWeekSameType = existing.filter(
    b => b.week === target.week && b.year === target.year && b.eventType === target.eventType
  );
  return sameWeekSameType.length >= CALENDAR_CONFIG.MAX_BOOKINGS_PER_WEEK;
}

/**
 * O cancelamento esta dentro do prazo que preserva o credito?
 * Cancelar depois disso continua PERMITIDO (o membro nao vai comparecer de todo
 * jeito, e a vaga volta para o grupo) — o que se perde e o credito da sessao.
 */
export function preservesCredit(startISO: string, now: Date = new Date()): boolean {
  const deadline = addHours(now, CALENDAR_CONFIG.CANCELLATION_GRACE_HOURS);
  return !isBefore(parseISO(startISO), deadline);
}
