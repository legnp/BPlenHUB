/**
 * Tipos de evento da agenda — a configuracao que da SIGNIFICADO a um slot.
 *
 * Modelo da Etapa 3 (ver `AGENDA-SYNC-DESIGN.md` secao 8): o Google Calendar e
 * dono do TEMPO (existencia, data/hora, recorrencia) e o HUB e dono do
 * SIGNIFICADO (consultor, vagas, quais servicos aquele slot atende).
 *
 * No Google existem apenas titulos GENERICOS (lista fechada aprovada pela
 * Gestora: "1 to 1", "Consultoria Individual", "Consultoria em Grupo"); o que o
 * membro ve e resolvido aqui. Isso acaba com o parsing de `Vagas:`/`Orientador:`/
 * `Tema:` da descricao e com o casamento por texto livre (Licoes 19/30).
 */
export interface CalendarEventType {
  /** Identificador estavel (slug). Nunca derivar de rotulo editavel. */
  id: string;
  /** Nome do tipo para o admin. */
  label: string;
  /** Titulo EXATO do evento no Google Calendar com que este tipo casa. */
  googleTitle: string;
  /**
   * Consultor padrao das ocorrencias deste tipo. Nasce como "a definir" (decisao
   * da Gestora) para criar fila de trabalho visivel em vez de um padrao
   * inventado. A atribuicao por ocorrencia (Fase 3.2) sobrescreve este valor —
   * e "atribuicao", nunca "substituicao".
   */
  consultorPadrao: string;
  /** Vagas padrao das ocorrencias deste tipo. */
  vagasPadrao: number;
  /**
   * `serviceCode`s que este slot pode atender. E o que substitui o casamento por
   * palavra-chave: identificador, nao rotulo (Licao 19).
   */
  atende: string[];
}

/** Valor inicial do consultor, ate a Gestora atribuir (ver 8.2 do design). */
export const CONSULTOR_A_DEFINIR = "a definir";

/**
 * Os 3 tipos da lista fechada aprovada pela Gestora. Servem de seed quando a
 * configuracao ainda nao existe no Firestore — sem inventar `atende`, que e
 * decisao dela na tela.
 */
export const DEFAULT_EVENT_TYPES: CalendarEventType[] = [
  {
    id: "1-to-1",
    label: "1 to 1",
    googleTitle: "1 to 1",
    consultorPadrao: CONSULTOR_A_DEFINIR,
    vagasPadrao: 1,
    atende: [],
  },
  {
    id: "consultoria-individual",
    label: "Consultoria Individual",
    googleTitle: "Consultoria Individual",
    consultorPadrao: CONSULTOR_A_DEFINIR,
    vagasPadrao: 1,
    atende: [],
  },
  {
    id: "consultoria-em-grupo",
    label: "Consultoria em Grupo",
    googleTitle: "Consultoria em Grupo",
    consultorPadrao: CONSULTOR_A_DEFINIR,
    vagasPadrao: 10,
    atende: [],
  },
];
