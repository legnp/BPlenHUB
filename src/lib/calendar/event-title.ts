import type { CalendarEventType } from "@/types/calendar-event-types";

/**
 * Casamento entre o titulo do evento no Google e o tipo configurado no HUB.
 *
 * Fonte unica. A regra estava duplicada em `sync.ts` (`normalizeEventTitle`, que
 * resolve o `tipoId`) e em `actions/calendar-event-types.ts` (`normalizeTitle`, que
 * valida titulo duplicado ao salvar). Regra duplicada diverge por construcao — se uma
 * das duas ganhasse uma tolerancia a mais, a tela aceitaria salvar dois tipos que o
 * sync trataria como o mesmo, e o `tipoId` sairia ambiguo em silencio. Mesma licao do
 * `lib/booking/blocker.ts`.
 */

/** Faixa de acentos combinantes, montada por codigo — literal no fonte ja corrompeu antes. */
const COMBINING_MARKS = new RegExp(
  "[" + String.fromCharCode(0x0300) + "-" + String.fromCharCode(0x036f) + "]",
  "g"
);

/** Normaliza o titulo para comparar sem depender de acento, caixa ou espaco nas pontas. */
export function normalizeEventTitle(value: string | undefined | null): string {
  return (value || "")
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .trim()
    .toLowerCase();
}

/**
 * Qual tipo configurado corresponde a este titulo do Google?
 *
 * Devolve `null` quando nenhum casa — e o estado esperado para os titulos do modelo
 * antigo que ainda nao foram migrados. O evento entra sem `tipoId` e aparece no admin
 * como fila de trabalho, em vez de ser classificado errado.
 */
export function resolveEventTypeByTitle(
  summary: string | undefined | null,
  types: readonly CalendarEventType[]
): CalendarEventType | null {
  const alvo = normalizeEventTitle(summary);
  if (!alvo) return null;
  return types.find((t) => normalizeEventTitle(t.googleTitle) === alvo) ?? null;
}
