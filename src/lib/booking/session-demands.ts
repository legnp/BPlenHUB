import { CalendarEventType } from "@/types/calendar-event-types";
import { isOneToOneEvent } from "./policy";

/**
 * Audiencia do slot e motivo da sessao — regras puras.
 *
 * Antes desta Fase, a tela decidia se pedia o motivo casando o TEXTO do titulo
 * (`summary.includes("1 to 1")`). Com os titulos genericos do Google isso e' fragil e
 * ja custou defeito (Licoes 19 e 30: identificador tem precedencia sobre rotulo
 * editavel). Aqui a decisao passa a ser pelo `tipoId` do evento, com o texto sobrando
 * apenas como rede para evento legado ainda nao re-sincronizado.
 *
 * Modelo de audiencia (decisao da Gestora, 2026-08-05): um tipo pode servir MAIS DE
 * UMA audiencia. O `1-to-1` e' o caso concreto — a mesma grade e' disputada por
 * membro, parceiro e funil publico; o horario e' um so, quem chegar primeiro leva.
 * O que NAO se mistura e' a lista de motivos: cada fluxo pergunta a sua.
 */

export type SessionAudience = "member" | "partner";

/** Evento tal como a tela o conhece — so o que estas regras precisam. */
export interface SessionEventLike {
  tipoId?: string | null;
  summary?: string | null;
}

/** Audiencias de um tipo. Tipo sem audiencia declarada e' de membro. */
export function eventTypeAudiences(
  type: Pick<CalendarEventType, "audiences">
): SessionAudience[] {
  const declared = Array.isArray(type.audiences) ? type.audiences : [];
  return declared.length > 0 ? declared : ["member"];
}

/** O tipo serve esta audiencia? */
export function eventTypeServesAudience(
  type: Pick<CalendarEventType, "audiences">,
  audience: SessionAudience
): boolean {
  return eventTypeAudiences(type).includes(audience);
}

/** Ids dos tipos que servem uma audiencia (um tipo pode aparecer nas duas listas). */
export function eventTypeIdsForAudience(
  types: CalendarEventType[],
  audience: SessionAudience
): string[] {
  return types.filter((t) => eventTypeServesAudience(t, audience)).map((t) => t.id);
}

/**
 * Um evento pertence a audiencia informada?
 *
 * Conservador do mesmo jeito que o filtro da jornada: evento sem `tipoId` (legado, ou
 * de um titulo que nenhum tipo casa) continua sendo do membro — nunca some da agenda
 * de quem ja o via. Para a audiencia de parceiro, so entra o que declara um tipo que
 * serve parceiro.
 */
export function eventServesAudience(
  event: SessionEventLike,
  types: CalendarEventType[],
  audience: SessionAudience
): boolean {
  const type = event.tipoId ? types.find((t) => t.id === event.tipoId) : undefined;
  if (!type) return audience === "member";
  return eventTypeServesAudience(type, audience);
}

/**
 * Motivos oferecidos ao agendar este evento, NA AUDIENCIA informada. Lista vazia = a
 * tela nao pergunta motivo.
 *
 * Precedencia: lista da audiencia no tipo -> lista global legada (so para o `1-to-1` no
 * fluxo de MEMBRO, que e' como as razoes sao configuradas hoje) -> nenhuma. O parceiro
 * nunca cai na lista legada: a dele e' a do proprio tipo, ou nenhuma.
 */
export function resolveSessionDemands(
  event: SessionEventLike | null | undefined,
  types: CalendarEventType[],
  legacyOneToOneDemands: string[],
  audience: SessionAudience = "member"
): string[] {
  if (!event) return [];

  const type = event.tipoId ? types.find((t) => t.id === event.tipoId) : undefined;

  if (audience === "partner") {
    return type?.partnerDemandOptions && type.partnerDemandOptions.length > 0
      ? type.partnerDemandOptions
      : [];
  }

  if (type?.demandOptions && type.demandOptions.length > 0) {
    return type.demandOptions;
  }

  if (isOneToOneEvent(event)) {
    return legacyOneToOneDemands;
  }

  return [];
}
