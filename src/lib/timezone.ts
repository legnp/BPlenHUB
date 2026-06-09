import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";
import { parseISO } from "date-fns";

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

/**
 * BPlen HUB — Timezone Governance 🛡️🌍
 * Centraliza a formatação de datas para garantir consistência entre Servidor e Cliente.
 */

/**
 * Formata uma data para string de hora (HH:mm) no fuso de Brasília.
 */
export function formatTimeInBR(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatInTimeZone(d, DEFAULT_TIMEZONE, "HH:mm");
}

/**
 * Formata uma data para string de data por extenso no fuso de Brasília.
 * Ex: "11 de junho"
 */
export function formatDateInBR(date: Date | string, pattern: string = "dd 'de' MMMM"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatInTimeZone(d, DEFAULT_TIMEZONE, pattern, { locale: ptBR });
}

/**
 * Retorna o sufixo de timezone para clareza em comunicações.
 */
export function getTimezoneSuffix(): string {
  return "(Horário de Brasília)";
}
