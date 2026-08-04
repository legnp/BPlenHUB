import type { CalendarEventType } from "@/types/calendar-event-types";

/**
 * BPlen HUB — Qual slot da agenda serve qual parada da jornada.
 *
 * Modelo da Etapa 3 (AGENDA-SYNC-DESIGN secoes 8.1/8.10): o Google so tem titulos
 * genericos, e o significado vive no HUB. O casamento deixa de ser por TEXTO (a parada
 * "1a Sessao de MentoCoach" procurando a palavra "mentocoach" no titulo) e passa a ser
 * por IDENTIFICADOR: o tipo do evento declara quais `serviceCode`s ele atende.
 *
 * Foi a limpeza do calendario (2026-08-04) que tornou isso obrigatorio: com os titulos
 * antigos aposentados, nenhuma palavra-chave casa mais — os 147 slots de Consultoria
 * Individual e em Grupo existem e ficaram invisiveis para a jornada.
 *
 * Polivalencia e intencional: um slot de `Consultoria Individual` atende Devolutiva de
 * Analise, Devolutiva do Plano, Feedback de Posicionamento e as sessoes de MentoCoach.
 * Quem impede o slot de ser usado duas vezes e a CAPACIDADE (ver `resolveSlotCapacity`),
 * nao esta funcao: reservado por uma trilha, ele sai da oferta de todas — e volta
 * inteiro se houver cancelamento ou remarcacao.
 */

type SlotLike = { tipoId?: string | null };

/** O tipo configurado para este slot, ou null se o evento nao foi classificado. */
export function resolveSlotType(
  slot: SlotLike,
  types: readonly CalendarEventType[]
): CalendarEventType | null {
  if (!slot.tipoId) return null;
  return types.find((t) => t.id === slot.tipoId) ?? null;
}

/**
 * Este slot pode atender uma parada da etapa `serviceCode`?
 *
 * Devolve `false` quando o slot nao tem tipo (evento do modelo antigo, ainda nao
 * migrado) ou quando a etapa nao tem `serviceCode` sincronizado — nesses casos quem
 * decide e o casamento por texto, que segue vivo como fallback durante a transicao.
 */
export function slotServesStage(
  slot: SlotLike,
  types: readonly CalendarEventType[],
  serviceCode: string | undefined | null
): boolean {
  if (!serviceCode) return false;
  const tipo = resolveSlotType(slot, types);
  if (!tipo) return false;
  return tipo.atende.includes(serviceCode);
}

/**
 * Capacidade efetiva do slot.
 *
 * A fonte passou a ser o `vagasPadrao` do TIPO. Antes vinha de "Vagas: N" no corpo do
 * evento — e quando esses campos sairam do Google, a capacidade passou a ser gravada
 * como 0. Isso e perigoso porque o guard do agendamento trata **0 como ILIMITADO**:
 * um slot de 1 vaga aceitaria inscricoes sem fim.
 *
 * `descriptionCapacity` fica como fallback para evento legado ainda sem tipo. Bloqueio
 * de agenda continua em 0 de proposito — ele nao e agendavel, e quem o barra e o
 * `isBlockerEvent`.
 */
export function resolveSlotCapacity(
  tipo: CalendarEventType | null,
  descriptionCapacity: number
): number {
  if (tipo && Number.isFinite(tipo.vagasPadrao) && tipo.vagasPadrao > 0) {
    return tipo.vagasPadrao;
  }
  return Number.isFinite(descriptionCapacity) && descriptionCapacity > 0 ? descriptionCapacity : 0;
}
