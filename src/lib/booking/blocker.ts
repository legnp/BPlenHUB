/**
 * Eventos bloqueadores — fonte unica de "este evento e um bloqueio de agenda".
 *
 * Um bloqueio e um evento que a Gestora cria no Google Calendar para reservar um
 * horario (compromisso pessoal, deslocamento, etc.). Ele nao e entregavel: nao
 * aparece para o membro nem para o admin, e ninguem se inscreve nele. O que ele
 * FAZ e ocupar o horario, para que a agenda publica nao ofereca aquele periodo.
 *
 * Por que existe este arquivo:
 * 1. A regra estava copiada em 3 lugares (`sync.ts`, `queries.ts` x2,
 *    `post-event.ts`), cada um com seu proprio `summary.includes("bloqueado")`.
 *    Regra duplicada diverge por construcao — mesma licao do `policy.ts`.
 * 2. O casamento cru por substring quebra com acento e com erro de digitacao.
 *    Havia 5 eventos "Bloquado" (sem o "e") na base que escapavam do filtro.
 *
 * A deteccao casa o RADICAL "bloqu" sobre o texto normalizado (sem acento, em
 * minusculo), o que cobre "Bloqueado", "Bloquado", "Bloqueio" e "Bloqueada".
 * Isso e seguro contra falso-positivo: nenhum titulo legitimo de sessao contem
 * "bloq" — verificado contra os 795 eventos da agenda real (janela de 90 dias) e
 * os 538 documentos de `Calendar_Events` em 2026-07-16.
 */

/** Remove acento e caixa, para o casamento nao depender de como foi digitado. */
function normalize(text: string | undefined | null): string {
  return (text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * O titulo do evento indica um bloqueio de agenda?
 *
 * Use para CLASSIFICAR um evento vindo do Google (no sync) e para tratar
 * documentos legados que ainda nao tem o campo `isBlocker` gravado.
 * Para um evento ja sincronizado, prefira `isBlockerEvent`, que le o campo.
 */
export function isBlockerSummary(summary: string | undefined | null): boolean {
  return /bloqu/.test(normalize(summary));
}

/**
 * O evento sincronizado e um bloqueio?
 *
 * Le o campo `isBlocker` gravado pelo sync (identificador tem precedencia sobre
 * rotulo) e cai no titulo apenas para documentos legados, gravados antes de o
 * campo existir — o sync so reescreve eventos da janela futura, entao os
 * passados nunca ganham o campo.
 */
export function isBlockerEvent(event: {
  isBlocker?: boolean;
  summary?: string | null;
}): boolean {
  if (typeof event.isBlocker === "boolean") return event.isBlocker;
  return isBlockerSummary(event.summary);
}
