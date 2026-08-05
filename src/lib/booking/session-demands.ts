import { CalendarEventType } from "@/types/calendar-event-types";
import { isOneToOneEvent } from "./policy";

/**
 * Motivo da sessao e audiencia do slot — regras puras.
 *
 * Antes desta Fase, a tela decidia se pedia o motivo casando o TEXTO do titulo
 * (`summary.includes("1 to 1")`). Com os titulos genericos do Google isso e' fragil e
 * ja custou defeito (Licoes 19 e 30: identificador tem precedencia sobre rotulo
 * editavel). Aqui a decisao passa a ser pelo `tipoId` do evento, com o texto sobrando
 * apenas como rede para evento legado ainda nao re-sincronizado.
 */

/** Evento tal como a tela o conhece — so o que estas regras precisam. */
export interface SessionEventLike {
  tipoId?: string | null;
  summary?: string | null;
}

/** Audiencia de um tipo de evento. Tipo sem audiencia declarada e' de membro. */
export function eventTypeAudience(type: Pick<CalendarEventType, "audience">): "member" | "partner" {
  return type.audience === "partner" ? "partner" : "member";
}

/** Ids dos tipos que pertencem a uma audiencia. */
export function eventTypeIdsForAudience(
  types: CalendarEventType[],
  audience: "member" | "partner"
): string[] {
  return types.filter((t) => eventTypeAudience(t) === audience).map((t) => t.id);
}

/**
 * Um evento pertence a audiencia informada?
 *
 * Conservador do mesmo jeito que o filtro da jornada: evento sem `tipoId` (legado, ou
 * de um titulo que nenhum tipo casa) continua sendo do membro — nunca some da agenda
 * de quem ja o via. Para a audiencia de parceiro, so entra o que declara um tipo de
 * parceiro.
 */
export function eventServesAudience(
  event: SessionEventLike,
  types: CalendarEventType[],
  audience: "member" | "partner"
): boolean {
  const type = event.tipoId ? types.find((t) => t.id === event.tipoId) : undefined;
  if (!type) return audience === "member";
  return eventTypeAudience(type) === audience;
}

/**
 * Motivos oferecidos ao agendar este evento. Lista vazia = a tela nao pergunta motivo.
 *
 * Precedencia: lista propria do tipo -> lista global legada (so para o `1-to-1`, que e'
 * como as razoes sao configuradas hoje) -> nenhuma.
 */
export function resolveSessionDemands(
  event: SessionEventLike | null | undefined,
  types: CalendarEventType[],
  legacyOneToOneDemands: string[]
): string[] {
  if (!event) return [];

  const type = event.tipoId ? types.find((t) => t.id === event.tipoId) : undefined;
  if (type?.demandOptions && type.demandOptions.length > 0) {
    return type.demandOptions;
  }

  if (isOneToOneEvent(event)) {
    return legacyOneToOneDemands;
  }

  return [];
}
