import { addDays, addHours, isBefore, parseISO, startOfDay, getISOWeek, getYear } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { CALENDAR_CONFIG } from "@/config/calendarConfig";

/**
 * A politica e comunicada e vivida no fuso de Brasilia; o servidor roda em UTC.
 * Mesmo fuso canonico de `src/lib/timezone.ts`.
 */
const TIMEZONE = "America/Sao_Paulo";

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

/**
 * Semana ISO + ano de uma data de evento — a chave do limite semanal.
 *
 * Avaliada no fuso de Brasilia, e nao no do servidor: a Vercel roda em UTC, onde
 * um evento de domingo as 22:00 BRT ja e segunda 01:00 — ele cairia na semana
 * SEGUINTE e o membro poderia furar o limite semanal (BUG-093).
 */
export function resolveEventWeek(startISO: string): { week: number; year: number } {
  const dateInBR = toZonedTime(parseISO(startISO), TIMEZONE);
  return { week: getISOWeek(dateInBR), year: getYear(dateInBR) };
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
 *
 * "Dia" e o dia de Brasilia, nao o do servidor. A Vercel roda em UTC, onde
 * `startOfDay` cai as 21:00 BRT do dia ANTERIOR — as duas fronteiras escorregavam
 * 3 horas em producao (BUG-093): o 20o dia era cortado as 21:00, e o 2o dia
 * passava a aceitar agendamento depois das 21:00, com menos de 3 dias de
 * antecedencia. Os limites saem daqui como instantes reais (UTC), entao a
 * comparacao com a data do evento continua sendo entre instantes.
 */
function getWindowBounds(now: Date) {
  const startOfTodayInBR = startOfDay(toZonedTime(now, TIMEZONE));

  return {
    opensAt: fromZonedTime(addDays(startOfTodayInBR, CALENDAR_CONFIG.MIN_LEAD_TIME_DAYS), TIMEZONE),
    closesAt: fromZonedTime(addDays(startOfTodayInBR, CALENDAR_CONFIG.MAX_LEAD_TIME_DAYS + 1), TIMEZONE)
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
