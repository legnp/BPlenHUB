/**
 * BPlen HUB — Guards puros de identidade e retorno seguro.
 *
 * Este arquivo NAO e `"use server"` e NAO toca rede/Firestore: sao funcoes puras,
 * a fonte unica das decisoes de seguranca de identidade da expansao de auth. Sao
 * puras de proposito, para que a suite de testes exerca a MESMA funcao que a
 * producao usa (Licao 18 — testar a funcao real, nao uma copia).
 *
 * Invariantes da auditoria que este modulo protege (T-02 / BUG-032 / BUG-106):
 *  - O e-mail usado para curar/casar identidade SEMPRE vem da sessao verificada e
 *    SOMENTE quando a sessao e a dona do proprio `uid`. Nunca de parametro do
 *    cliente (`verifiedEmailForHealing`).
 *  - Uma acao sensivel so age sobre o proprio uid do chamador (`callerOwnsUid`).
 *  - `returnTo` e sempre um caminho interno same-origin (`sanitizeReturnTo`),
 *    fechando o vetor de open-redirect/phishing (secao 6 do plano).
 */

/** Destino padrao de pos-login quando nao ha `returnTo` valido. */
export const DEFAULT_RETURN_TO = "/hub";

/** Sessao minima verificada (o que `verifySignedSession` entrega). */
export interface VerifiedCaller {
  uid: string;
  email?: string | null;
}

/** Normaliza e-mail para comparacao/gravacao consistente (fonte unica). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * O chamador so pode agir sobre a propria identidade. Metade da pergunta de
 * seguranca (Licao 44): "quem esta chamando?". A outra metade — "de onde vem o
 * e-mail em que a funcao acredita?" — e respondida por `verifiedEmailForHealing`.
 */
export function callerOwnsUid(caller: VerifiedCaller | null, uid: string): boolean {
  return !!caller && caller.uid === uid;
}

/**
 * Retorna o e-mail VERIFICADO a ser usado para auto-cura por e-mail, e apenas
 * quando a sessao e a DONA do uid alvo. Em qualquer outro caso retorna
 * `undefined` — sem e-mail, o resolvedor de matricula nao cura por e-mail, que e
 * sempre o comportamento seguro (ver contrato de `findMatriculaByIdentity`).
 *
 * BUG-106 (sequestro de conta): se este e-mail viesse do cliente, qualquer um
 * assumiria a conta de qualquer um. Por isso a fonte e exclusivamente a sessao.
 */
export function verifiedEmailForHealing(
  caller: VerifiedCaller | null,
  targetUid: string
): string | undefined {
  if (!caller || caller.uid !== targetUid) return undefined;
  if (!caller.email) return undefined;
  return normalizeEmail(caller.email);
}

const SCHEME = "://";

/**
 * Valida que `returnTo` e um caminho interno same-origin e devolve-o; caso
 * contrario devolve o fallback (`/hub`). Fecha o open-redirect (secao 6/8 do
 * plano): sem esta trava, `?returnTo=https://phish.exemplo` viraria um vetor de
 * phishing pos-login. Fail-closed — na duvida, volta para o destino interno.
 *
 * Regras: precisa comecar com uma unica `/` seguida de caractere comum (ou ser
 * exatamente "/"); rejeita `//host` (protocolo-relativo), `/\`, esquema absoluto
 * embutido (`http://`), caracteres de controle e tamanho excessivo. Valida tanto
 * a forma recebida quanto a forma decodificada (ofuscacao por percent-encoding).
 */
export function sanitizeReturnTo(
  raw: string | null | undefined,
  fallback: string = DEFAULT_RETURN_TO
): string {
  if (typeof raw !== "string") return fallback;

  const value = raw.trim();
  if (!value || value.length > 512) return fallback;

  if (!isSafeInternalPath(value)) return fallback;

  // Uma segunda checagem na forma decodificada apanha tentativas ofuscadas
  // (ex.: "/%2F%2Fhost" -> "//host") caso o valor ainda nao tenha sido decodado.
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    // Percent-encoding invalido: mantemos apenas a validacao da forma crua.
    return value;
  }
  if (decoded !== value && !isSafeInternalPath(decoded)) return fallback;

  return value;
}

/** True se `value` nao contem caractere de controle (C0 ou DEL). */
function hasNoControlChars(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code < 0x20 || code === 0x7f) return false;
  }
  return true;
}

function isSafeInternalPath(value: string): boolean {
  if (value === "/") return true;
  if (!hasNoControlChars(value)) return false;
  if (value.includes(SCHEME)) return false;
  // Uma unica barra inicial seguida de caractere que nao seja barra nem barra
  // invertida — mata "//host" e "/\host" (host externo em ambos os casos).
  return /^\/[^/\\]/.test(value);
}

/** Superficie canonica de autenticacao. */
export const LOGIN_PATH = "/entrar";

/**
 * Monta o caminho de redirecionamento para a tela de login preservando a origem
 * de forma segura: `/entrar?returnTo=<caminho interno sanitizado>`. Fonte unica
 * usada pelo proxy e pelos layouts protegidos para nao divergir. Um `returnTo`
 * externo/invalido cai para o destino interno padrao (fail-closed).
 */
export function buildEntrarPath(returnTo: string | null | undefined): string {
  const safe = sanitizeReturnTo(returnTo);
  return `${LOGIN_PATH}?returnTo=${encodeURIComponent(safe)}`;
}

/**
 * Normaliza o identificador de provedor do Firebase para um rotulo estavel de
 * metadado (analitico, nao e identidade). Usado na captura de `origin/provider`
 * na cunhagem da identidade (Fase 1). Valor desconhecido nunca quebra o fluxo.
 */
export function normalizeProvider(providerId: string | null | undefined): string {
  switch (providerId) {
    case "google.com":
      return "google.com";
    case "microsoft.com":
      return "microsoft.com";
    case "password":
    case "emailLink":
      return "emailLink";
    default:
      return "unknown";
  }
}
