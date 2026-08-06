/**
 * Tipos de evento da agenda — a configuracao que da SIGNIFICADO a um slot.
 *
 * Modelo da Etapa 3 (ver `AGENDA-SYNC-DESIGN.md` secao 8): o Google Calendar e
 * dono do TEMPO (existencia, data/hora, recorrencia) e o HUB e dono do
 * SIGNIFICADO (consultor, vagas, quais servicos aquele slot atende).
 *
 * No Google existem apenas titulos GENERICOS; o que o membro ve e resolvido aqui.
 * Isso acaba com o parsing de `Vagas:`/`Orientador:`/`Tema:` da descricao e com o
 * casamento por texto livre (Licoes 19/30).
 *
 * Lista fechada — revisada de 3 para 5 pela Gestora em 2026-08-03 (secao 8.10 do
 * design): "1 to 1", "Consultoria Individual", "Consultoria em Grupo",
 * "Onboarding" e "Offboarding". Onboarding e Offboarding SAO sessoes em grupo,
 * mas ganham tipo proprio em vez de serem servidos pelo tipo de grupo — decisao
 * dela: cada um se chama pelo proprio nome.
 */
export interface CalendarEventType {
  /** Identificador estavel (slug). Nunca derivar de rotulo editavel. */
  id: string;
  /** Nome do tipo para o admin. */
  label: string;
  /** Titulo EXATO do evento no Google Calendar com que este tipo casa. */
  googleTitle: string;
  /**
   * Consultor padrao das ocorrencias deste tipo — ver `CONSULTOR_PADRAO`. A
   * atribuicao por ocorrencia (Fase 3.2) sobrescreve este valor; e "atribuicao",
   * nunca "substituicao".
   */
  consultorPadrao: string;
  /** Vagas padrao das ocorrencias deste tipo. */
  vagasPadrao: number;
  /**
   * `serviceCode`s que este slot pode atender. E o que substitui o casamento por
   * palavra-chave: identificador, nao rotulo (Licao 19).
   */
  atende: string[];
  /**
   * Quem pode agendar este tipo de sessao. Ausente/vazio = `["member"]` (todo tipo
   * existente hoje). Um tipo PODE servir as duas audiencias — e' o caso do `1-to-1`,
   * cuja grade e' deliberadamente disputada entre membro, parceiro e o funil publico
   * (decisao da Gestora, 2026-08-05): o horario e' um so, quem chegar primeiro leva.
   */
  audiences?: Array<"member" | "partner">;
  /**
   * Este tipo so entra na oferta depois que a OCORRENCIA for atribuida a uma parada
   * (Fase 3.2). E o caso do `consultoria-em-grupo`: as 10 paradas do GDC sao temas
   * distintos, entao um slot sem tema definido nao pode ser oferecido — apareceria para
   * as dez indistintamente e o membro agendaria algo que ainda nao foi decidido.
   * Decisao da Gestora (2026-08-05): sem atribuicao, sem oferta.
   *
   * Ausente/false = slot polivalente, ofertado a qualquer parada dos servicos que ele
   * atende (o caso do `consultoria-individual`).
   */
  exigeParada?: boolean;
  /**
   * Motivos oferecidos ao MEMBRO ao agendar este tipo (viram o tema do agendamento).
   * Vazio/ausente = nao pergunta motivo, com uma excecao de transicao: o tipo `1-to-1`
   * cai na lista global legada, configurada na mesma tela.
   */
  demandOptions?: string[];
  /**
   * Motivos oferecidos ao PARCEIRO no mesmo tipo. Lista separada de proposito: a
   * grade e' compartilhada, a conversa nao — cada fluxo pergunta o que faz sentido
   * para ele (o funil publico ja tem a triagem propria dele).
   */
  partnerDemandOptions?: string[];
}

/**
 * Consultor padrao das ocorrencias de um tipo.
 *
 * ATENCAO — isto REVERTE, a pedido da Gestora (2026-08-05), a decisao registrada na
 * secao 8.2 do AGENDA-SYNC-DESIGN, que fazia o campo nascer como "a definir" para
 * criar fila de trabalho visivel em vez de um padrao inventado. O padrao deixou de ser
 * inventado: hoje a BPlen tem uma consultora, e a atribuicao por ocorrencia continua
 * disponivel no admin para quando houver mais. A estrutura ja esta pronta para virar
 * lista suspensa quando o papel de consultor existir como usuario (secao 8.6).
 */
export const CONSULTOR_PADRAO = "Lisandra Lencina";

/**
 * Os 5 tipos da lista fechada aprovada pela Gestora. Servem de seed quando a
 * configuracao ainda nao existe no Firestore — sem inventar `atende`, que e
 * decisao dela na tela.
 *
 * ATENCAO ao `1 to 1`: aqui, no seed, `atende: []` significa "ainda nao decidido —
 * preencha na tela". Na configuracao VIVA o vazio dele e DECISAO da Gestora
 * (2026-08-03): o 1 to 1 e avulso, nao pertence a trilha nenhuma. NUNCA preencher.
 * Os dois estados sao indistinguiveis no dado, e nenhum teste unitario alcanca a
 * configuracao viva — por isso a decisao esta registrada na secao 8.10 do
 * AGENDA-SYNC-DESIGN e preservada explicitamente pelo
 * `scripts/migrate-calendar-event-types.js`.
 */
export const DEFAULT_EVENT_TYPES: CalendarEventType[] = [
  {
    id: "1-to-1",
    label: "1 to 1",
    googleTitle: "1 to 1",
    consultorPadrao: CONSULTOR_PADRAO,
    vagasPadrao: 1,
    atende: [],
  },
  {
    id: "consultoria-individual",
    label: "Consultoria Individual",
    googleTitle: "Consultoria Individual",
    consultorPadrao: CONSULTOR_PADRAO,
    vagasPadrao: 1,
    atende: [],
  },
  {
    id: "consultoria-em-grupo",
    label: "Consultoria em Grupo",
    googleTitle: "Consultoria em Grupo",
    consultorPadrao: CONSULTOR_PADRAO,
    vagasPadrao: 10,
    atende: [],
    exigeParada: true,
  },
  {
    id: "onboarding",
    label: "Onboarding",
    googleTitle: "Onboarding",
    consultorPadrao: CONSULTOR_PADRAO,
    vagasPadrao: 10,
    atende: [],
  },
  {
    id: "offboarding",
    label: "Offboarding",
    googleTitle: "Offboarding",
    consultorPadrao: CONSULTOR_PADRAO,
    vagasPadrao: 10,
    atende: [],
  },
];
