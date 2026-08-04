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
