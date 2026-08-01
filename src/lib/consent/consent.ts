/**
 * BPlen HUB — Consentimento de conta (gate de Boas-vindas — Fase 2).
 *
 * Logica pura da decisao de consentimento: se o gate deve reaparecer, calculo de
 * idade (trava 18+) e tipo de dispositivo. Puras de proposito para a suite exercer
 * a MESMA funcao que a producao usa (Licao 18). O registro versionado, a captura
 * de IP/geo e a persistencia ficam na server action (identidade da sessao).
 *
 * LGPD: consentimento livre, informado, inequivoco e ESPECIFICO; sem caixas
 * pre-marcadas; registro versionado. A versao permite reprompt quando os textos
 * legais mudarem (a Gestora bumpara `CONSENT_VERSION` ao revisar Termos/Privacidade).
 */

/**
 * Versao vigente do consentimento. Ancorada na vigencia atual dos documentos
 * legais (config/legal-pages.ts = "21 de junho de 2026"). Retroativa por ora; a
 * Gestora atualizara textos + esta versao depois (reexibe o gate no proximo acesso).
 */
export const CONSENT_VERSION = "2026-06-21";

/** Idade minima para usar a plataforma. */
export const MIN_AGE_YEARS = 18;

/**
 * O gate deve reaparecer se o usuario nunca aceitou, ou aceitou uma versao
 * diferente da vigente (reprompt por mudanca de termos).
 */
export function needsConsentGate(acceptedVersion: string | null | undefined): boolean {
  return acceptedVersion !== CONSENT_VERSION;
}

const ISO_DATE = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/;

/**
 * Idade em anos completos a partir de uma data ISO (YYYY-MM-DD) e uma data de
 * referencia. Retorna -1 se a data for invalida (formato ou dia inexistente).
 * Recebe `today` por parametro (funcao pura, testavel de forma deterministica).
 */
export function computeAgeYears(birthISO: string | null | undefined, today: Date): number {
  const m = ISO_DATE.exec(birthISO || "");
  if (!m) return -1;
  const by = Number(m[1]);
  const bm = Number(m[2]);
  const bd = Number(m[3]);
  // Rejeita datas impossiveis (ex.: 2020-02-31 "rola" para marco).
  const birth = new Date(Date.UTC(by, bm - 1, bd));
  if (birth.getUTCFullYear() !== by || birth.getUTCMonth() !== bm - 1 || birth.getUTCDate() !== bd) {
    return -1;
  }
  let age = today.getUTCFullYear() - by;
  const monthDiff = today.getUTCMonth() - (bm - 1);
  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < bd)) age -= 1;
  return age;
}

/** True se a pessoa tem MIN_AGE_YEARS ou mais na data de referencia. */
export function isAdult(birthISO: string | null | undefined, today: Date): boolean {
  const age = computeAgeYears(birthISO, today);
  return age >= MIN_AGE_YEARS;
}

export type DeviceType = "mobile" | "tablet" | "desktop" | "unknown";

/** Tipo de dispositivo (coarso) a partir do user-agent, para o registro do aceite. */
export function deviceTypeFromUserAgent(ua: string | null | undefined): DeviceType {
  if (!ua) return "unknown";
  const s = ua.toLowerCase();
  if (s.includes("ipad") || (s.includes("tablet") && !s.includes("mobile"))) return "tablet";
  if (s.includes("mobi") || s.includes("iphone") || s.includes("android")) return "mobile";
  return "desktop";
}
