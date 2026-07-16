/**
 * Categoria da Triade do Tempo (importante / urgente / circunstancial).
 *
 * Existe porque o grafico casava rotulo com `label.toLowerCase().includes("importan")`
 * — e o rotulo da tela do membro tem ACENTO: "Importância" nao contem "importan"
 * (o `â` quebra a substring), nem "Urgência" contem "urgen". So "Circunstância"
 * casava, porque o acento dela vem depois do trecho buscado. Resultado: o grafico
 * exibia 0% / 0% / 29% para quem tinha 41% / 29% / 29% (BUG-082).
 *
 * A tela do ADMIN passava rotulos sem acento e por isso funcionava — o que
 * escondeu o defeito. A correcao e' aqui, no casamento: tirar o acento do rotulo
 * do membro seria regressao de copy (os rotulos aparecem na legenda).
 */

export type TriadCategory = "importante" | "urgente" | "circunstancial";

/** Remove acentos e caixa para comparar rotulo com chave. */
function normalizar(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Categoria de um rotulo, em qualquer forma que ele apareca:
 * "Importância" / "Importancia" / "Importante" -> "importante".
 * Devolve null quando o rotulo nao pertence a triade — o chamador decide o que
 * fazer, em vez de receber um silencioso "circunstancial" por queda no `else`.
 */
export function resolveTriadCategory(label: string): TriadCategory | null {
  const norm = normalizar(label);
  if (norm.includes("importan")) return "importante";
  if (norm.includes("urgen")) return "urgente";
  if (norm.includes("circun")) return "circunstancial";
  return null;
}

/** Percentual de uma categoria dentro do conjunto de dados, tolerante a acento. */
export function findTriadPercentage(
  data: ReadonlyArray<{ label: string; percentage: number }>,
  categoria: TriadCategory
): number {
  const item = data.find(d => resolveTriadCategory(d.label) === categoria);
  return item ? item.percentage : 0;
}
