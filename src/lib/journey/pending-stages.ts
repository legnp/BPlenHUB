import type { JourneyStep } from "@/types/journey";

/**
 * Nomes das etapas que faltam concluir para destravar uma etapa.
 *
 * A UI deduzia isto pela POSICAO — `stages[indice - 1]`, "a etapa anterior" —
 * e a deducao tem dois defeitos (BUG-081):
 *
 * 1. **Errava o conteudo** nos servicos paralelos (Fase C). O Posicionamento e o
 *    MentoCoach nao esperam a etapa ANTERIOR: esperam as etapas contratadas da
 *    trilha, que o motor devolve em `pendentes`.
 * 2. **Nao existia para a 1a etapa.** Com `indice - 1` invalido, o clique caia num
 *    `return` mudo — nada abria. O Posicionamento e' a etapa 1 e, desde a Fase C,
 *    pode estar travado.
 *
 * O motor SEMPRE calculou `pendentes`; a UI e' que descartava. Esta funcao usa a
 * resposta do motor e so recorre a posicao no fallback legado (etapa sem
 * atributos sincronizados, em que `pendentes` vem vazio).
 */
export function resolvePendingStageTitles(
  pendentes: readonly string[],
  stages: readonly JourneyStep[],
  stageId: string
): string[] {
  if (pendentes.length > 0) {
    const porCodigo = new Map<string, string>();
    for (const s of stages) {
      if (s.serviceCode) porCodigo.set(s.serviceCode.trim().toUpperCase(), s.title);
    }
    // Devolve so o que casa de fato — inclusive vazio. Cair na deducao posicional
    // aqui INVENTARIA uma etapa errada: o motor ja respondeu, e a resposta dele
    // nao e' "a anterior". O modal trata a lista vazia com texto generico.
    return pendentes
      .map(codigo => porCodigo.get(codigo.trim().toUpperCase()))
      .filter((t): t is string => !!t);
  }

  // Fallback legado: sem `pendentes` (etapa sem atributos), a trava e' a linear
  // do `useJourney` — ali "anterior" e', de fato, a etapa de indice - 1.
  const indice = stages.findIndex(s => s.id === stageId);
  if (indice > 0) return [stages[indice - 1].title];

  return [];
}

/** "A" / "A e B" / "A, B e C" — sem virgula de Oxford, como em PT-BR. */
export function formatarListaPtBr(itens: readonly string[]): string {
  if (itens.length === 0) return "";
  if (itens.length === 1) return itens[0];
  return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}
