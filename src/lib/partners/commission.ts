/**
 * Area de Parceiros — comissao fixa por parceiro.
 *
 * Regra de negocio (PARTNER-AREA-EXPANSION-PLAN.md secao 1.1 e decisao 9.3): a taxa
 * e' FIXA por parceiro, definida pelo Admin ao conceder o acesso de parceiro — nao e'
 * negociada por indicacao. Cada indicacao guarda uma COPIA do valor vigente no momento
 * em que foi criada, entao mudar a taxa aqui nunca reescreve o historico.
 *
 * Este modulo e' puro de proposito (sem SDK, sem sessao): a validacao do payload do
 * Admin precisa ser testavel isoladamente e reutilizavel pelas fases seguintes
 * (calculo do valor do ciclo de repasse).
 */

/** Piso da taxa aceita pelo Admin (percentual). */
export const PARTNER_COMMISSION_MIN_PERCENT = 0;

/** Teto defensivo da taxa aceita pelo Admin (percentual). */
export const PARTNER_COMMISSION_MAX_PERCENT = 100;

/** Casas decimais preservadas na taxa (ex.: 12,5%). */
const PARTNER_COMMISSION_DECIMALS = 2;

function parseNumericString(value: string): number {
  const normalized = value.trim().replace(",", ".");
  return normalized === "" ? Number.NaN : Number(normalized);
}

/**
 * Normaliza a taxa de comissao vinda do painel administrativo.
 *
 * Aceita numero ou string numerica (o input do Admin entrega string), tolera virgula
 * decimal no formato pt-BR e arredonda para 2 casas. Lanca em qualquer entrada que nao
 * seja um percentual finito dentro da faixa — a action nao grava valor duvidoso.
 */
export function parsePartnerCommissionPercent(input: unknown): number {
  // Atencao: `Number("")` e `Number(" ")` valem 0 — sem este tratamento, um campo
  // vazio do painel gravaria "0%" silenciosamente em vez de recusar a entrada.
  const raw = typeof input === "string" ? parseNumericString(input) : input;

  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    throw new Error("Comissao de parceiro invalida: esperado um percentual numerico.");
  }

  if (raw < PARTNER_COMMISSION_MIN_PERCENT || raw > PARTNER_COMMISSION_MAX_PERCENT) {
    throw new Error(
      `Comissao de parceiro invalida: use um percentual entre ${PARTNER_COMMISSION_MIN_PERCENT} e ${PARTNER_COMMISSION_MAX_PERCENT}.`
    );
  }

  const factor = 10 ** PARTNER_COMMISSION_DECIMALS;
  return Math.round(raw * factor) / factor;
}

/**
 * Valor do repasse de uma compra: percentual do parceiro sobre o valor EFETIVAMENTE
 * PAGO pelo cliente (decisao da Gestora, 2026-08-05 — o valor vem da compra, ja com
 * desconto aplicado). Arredonda em centavos.
 */
export function computeCommissionValue(paidValue: number, commissionPercent: number): number {
  if (!Number.isFinite(paidValue) || !Number.isFinite(commissionPercent)) return 0;
  if (paidValue <= 0 || commissionPercent <= 0) return 0;
  return Math.round(paidValue * commissionPercent) / 100;
}

/**
 * Ciclo mensal a que uma compra pertence — "AAAA-MM" da data da compra.
 *
 * A data de corte e' o ULTIMO DIA DO MES (decisao da Gestora, 2026-08-05): tudo o que
 * foi comprado dentro do mes civil entra no ciclo daquele mes.
 *
 * Avaliado no fuso de Brasilia, e nao no do servidor: a Vercel roda em UTC, onde uma
 * compra de 31/01 as 22:00 BRT ja e 01/02 — ela cairia no ciclo do mes SEGUINTE
 * (mesma classe do BUG-093).
 */
export function cycleIdOf(dateISO: string): string {
  const { year, month } = brasiliaParts(dateISO);
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** Data de corte do ciclo de uma compra: ultimo dia do mes, em ISO (AAAA-MM-DD). */
export function cutoffDateOf(dateISO: string): string {
  const { year, month } = brasiliaParts(dateISO);
  // Dia 0 do mes seguinte = ultimo dia deste mes.
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

/** Ano/mes (1-12) de uma data ISO, lidos no fuso de Brasilia. */
function brasiliaParts(dateISO: string): { year: number; month: number } {
  const date = new Date(dateISO);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Data de compra invalida para o calculo do ciclo.");
  }
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  });
  const [year, month] = formatter.format(date).split("-").map(Number);
  return { year, month };
}
