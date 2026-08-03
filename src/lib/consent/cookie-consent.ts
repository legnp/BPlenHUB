/**
 * BPlen HUB — Preferencia de cookies (fonte unica de chave e formato).
 *
 * A escolha vivia so no `localStorage`, com a chave literal escrita dentro do
 * componente do banner. Isso bastava para nao reexibir o banner, mas nao deixava
 * NENHUM registro do lado do servidor: sem prova do que foi escolhido e quando,
 * e a preferencia sumia ao limpar o navegador ou trocar de aparelho.
 *
 * Logica pura aqui (sem I/O) para o componente, a server action e a suite usarem
 * o MESMO contrato (Licao 18). O `localStorage` continua sendo a resposta rapida
 * da UI; o servidor passa a ser o registro.
 */

/** Chave da escolha no navegador (nome legado preservado — ha usuarios com ela gravada). */
export const COOKIE_CONSENT_KEY = "bplen_cookie_consent";

/**
 * Marca de que a escolha local ja foi espelhada no servidor. Existe porque o
 * banner costuma ser respondido ANTES do login: sem esta marca, a escolha de quem
 * decidiu deslogado nunca seria persistida (o banner nao volta a aparecer).
 */
export const COOKIE_CONSENT_SYNCED_KEY = "bplen_cookie_consent_synced";

/** Evento que acorda o carregador de analytics quando a escolha muda. */
export const COOKIE_CONSENT_EVENT = "bplen_consent_updated";

export type CookieChoice = "all" | "essential";

export function isCookieChoice(value: unknown): value is CookieChoice {
  return value === "all" || value === "essential";
}

/** Rotulo legivel da escolha (planilha e telas administrativas). */
export function cookieChoiceLabel(choice: CookieChoice): string {
  return choice === "all" ? "Todos os cookies" : "Apenas essenciais";
}

/** Le a escolha ja gravada no navegador. `null` fora do browser ou sem escolha. */
export function readStoredCookieChoice(): CookieChoice | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(COOKIE_CONSENT_KEY);
  return isCookieChoice(stored) ? stored : null;
}

/** True se ha escolha local ainda nao espelhada no servidor. */
export function hasPendingCookieSync(): boolean {
  if (typeof window === "undefined") return false;
  if (!readStoredCookieChoice()) return false;
  return window.localStorage.getItem(COOKIE_CONSENT_SYNCED_KEY) !== "true";
}

export function markCookieChoiceSynced(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COOKIE_CONSENT_SYNCED_KEY, "true");
}

export function storeCookieChoice(choice: CookieChoice): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COOKIE_CONSENT_KEY, choice);
  // Escolha nova comeca nao-sincronizada: se o usuario estiver deslogado agora,
  // o espelhamento acontece no proximo login.
  window.localStorage.removeItem(COOKIE_CONSENT_SYNCED_KEY);
}
