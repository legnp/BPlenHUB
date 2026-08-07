import type { SubStepConfig } from "@/types/journey";

/**
 * Resolve qual sub-passo deve ficar aberto numa etapa da jornada.
 *
 * Regra (identica a que vivia dentro de um `useEffect` na pagina da etapa):
 * o primeiro sub-passo ainda nao concluido; se todos estiverem concluidos, o
 * ultimo da lista.
 *
 * A lista recebida ja vem com os instrumentos atribuidos individualmente pelo
 * admin — a fusao acontece em `mergedStages`, no `useJourney`, que insere cada
 * sub-passo dinamico logo apos o seu `parentId`. Por isso a atribuicao sob
 * medida entra neste calculo sem tratamento especial.
 *
 * Retorna string vazia apenas quando a etapa nao tem nenhum sub-passo.
 */
export function resolverSubPassoAtual(
  substeps: SubStepConfig[] | undefined | null,
  concluidos: string[] | undefined | null
): string {
  if (!substeps || substeps.length === 0) return "";

  const jaConcluidos = concluidos || [];
  const primeiroIncompleto = substeps.find((ss) => !jaConcluidos.includes(ss.id));

  return primeiroIncompleto?.id ?? substeps[substeps.length - 1].id;
}
