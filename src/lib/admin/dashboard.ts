import { startOfISOWeek, endOfISOWeek, differenceInMinutes } from "date-fns";
import { fromZonedTime, toZonedTime, formatInTimeZone } from "date-fns-tz";

/**
 * Logica pura do dashboard do admin — sem I/O, para ser testavel.
 *
 * Existe porque as duas informacoes da tela eram FICCAO (F1-06, lote A):
 * - o card "AGENDA / sincronizacao ok" era string fixa: dizia "ok" sempre,
 *   inclusive durante o apagao de cota e com o sync truncando (`BUG-091`);
 * - a metrica dizia "cliques diretos nesta semana" mas contava a colecao
 *   inteira, sem filtro de data nenhum (`BUG-092`).
 */

const TIMEZONE = "America/Sao_Paulo";

/**
 * Formato de chave usado por `Calendar_Events.start`/`.end`, gravado a partir do
 * Google: "2026-07-21T17:30:00-03:00". A comparacao no Firestore e LEXICOGRAFICA,
 * entao a fronteira precisa sair no MESMO formato e no MESMO fuso — senao
 * "2026-07-20T00:00:00Z" e "2026-07-20T00:00:00-03:00" comparam diferente e a
 * semana escorrega 3 horas.
 */
const EVENT_KEY_FORMAT = "yyyy-MM-dd'T'HH:mm:ssXXX";

/**
 * Limites da semana ISO (segunda 00:00 a domingo 23:59) no fuso de Brasilia,
 * ja no formato de chave da colecao.
 *
 * O servidor roda em UTC (Vercel). Calcular a semana com a data do servidor faria
 * a semana comecar no domingo as 21:00 BRT e incluir eventos da semana anterior —
 * exatamente o tipo de erro silencioso que o `BUG-092` ja tinha.
 */
export function getWeekBounds(now: Date): { startKey: string; endKey: string } {
  const nowInBR = toZonedTime(now, TIMEZONE);
  const startInstant = fromZonedTime(startOfISOWeek(nowInBR), TIMEZONE);
  const endInstant = fromZonedTime(endOfISOWeek(nowInBR), TIMEZONE);

  return {
    startKey: formatInTimeZone(startInstant, TIMEZONE, EVENT_KEY_FORMAT),
    endKey: formatInTimeZone(endInstant, TIMEZONE, EVENT_KEY_FORMAT),
  };
}

export type SyncTone = "ok" | "warn" | "stale";

export interface SyncFreshness {
  label: string;
  detail: string;
  tone: SyncTone;
}

/**
 * Ha quanto tempo a agenda foi sincronizada — e se isso e aceitavel.
 *
 * O sync e MANUAL (nao ha cron; a `/api/trigger-sync` foi removida no BUG-024),
 * entao a idade do dado e uma informacao operacional real: e o que diz a Gestora
 * que esta na hora de clicar em Sincronizar.
 *
 * Um indicador que nao pode dizer "nao" nao e um indicador: `null` (nunca
 * sincronizado) devolve `stale`, nunca um "ok" otimista.
 */
export function resolveSyncFreshness(lastSyncISO: string | null | undefined, now: Date): SyncFreshness {
  if (!lastSyncISO) {
    return { label: "Sem dados", detail: "nunca sincronizada", tone: "stale" };
  }

  const lastSync = new Date(lastSyncISO);
  if (Number.isNaN(lastSync.getTime())) {
    return { label: "Sem dados", detail: "data de sincronizacao invalida", tone: "stale" };
  }

  const minutes = differenceInMinutes(now, lastSync);

  // Relogio adiantado/atrasado nao pode virar "sincronizada ha -3 horas".
  if (minutes < 0) {
    return { label: "Sincronizada", detail: "agora", tone: "ok" };
  }

  if (minutes < 60) {
    return {
      label: "Sincronizada",
      detail: minutes <= 1 ? "agora" : `há ${minutes} min`,
      tone: "ok",
    };
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return { label: "Sincronizada", detail: `há ${hours}h`, tone: "ok" };
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return {
      label: "Desatualizada",
      detail: days === 1 ? "há 1 dia" : `há ${days} dias`,
      tone: "warn",
    };
  }

  return { label: "Desatualizada", detail: `há ${days} dias`, tone: "stale" };
}
