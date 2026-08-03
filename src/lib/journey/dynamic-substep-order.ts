/**
 * BPlen HUB — Ordem dos subcheckpoints dinamicos (instrumentos modulares).
 *
 * O `SubStepRail` agrupa os checkpoints por ORDEM MAJORITARIA: `String(order).split(".")[0]`,
 * ordenando os grupos por `parseFloat`. Ou seja, `5`, `5.1` e `5.2` caem todos sob a
 * "Parada 5", e o rotulo exibido e o proprio numero da parada.
 *
 * Um instrumento atribuido a um cliente precisa entrar como FILHO do checkpoint pai,
 * e nao como parada solta. Para isso a ordem dele tem que ser `{major do pai}.{n}`.
 * Ordem em formato livre (ex.: o id do pai concatenado) quebra as tres coisas ao mesmo
 * tempo: nao agrupa, imprime "Parada ss-srv-..." e cai em `NaN` no comparador (BUG-117).
 */

/**
 * Bucket dos checkpoints sem ordem definida. E o mesmo valor que o `SubStepRail` usa
 * como padrao, entao um instrumento pendurado num pai sem ordem continua ao lado dele.
 */
export const FALLBACK_MAJOR_ORDER = "99";

/** Parte inteira da ordem — a "parada" a que o item pertence. */
export function majorOrderOf(order: string | undefined | null): string {
  if (!order) return FALLBACK_MAJOR_ORDER;
  const major = String(order).split(".")[0].trim();
  return major !== "" && Number.isFinite(Number(major)) ? major : FALLBACK_MAJOR_ORDER;
}

/** Sufixo decimal da ordem (`5.2` -> 2). Devolve null quando nao ha sufixo. */
function minorOrderOf(order: string | undefined | null): number | null {
  if (!order) return null;
  const parts = String(order).split(".");
  if (parts.length < 2) return null;
  const minor = Number.parseInt(parts[1].trim(), 10);
  return Number.isFinite(minor) ? minor : null;
}

/**
 * Proxima ordem livre para um instrumento pendurado em `parentOrder`.
 *
 * `siblingOrders` deve conter as ordens de TODOS os checkpoints da etapa (fixos do
 * produto + dinamicos ja atribuidos ao cliente) — o proximo decimal e calculado sobre a
 * parada do pai, entao dois instrumentos no mesmo pai nunca colidem.
 */
export function nextDynamicSubstepOrder(
  parentOrder: string | undefined | null,
  siblingOrders: Array<string | undefined | null>
): string {
  const major = majorOrderOf(parentOrder);

  const usedMinors = siblingOrders
    .filter((order) => majorOrderOf(order) === major)
    .map(minorOrderOf)
    .filter((minor): minor is number => minor !== null);

  const nextMinor = usedMinors.length > 0 ? Math.max(...usedMinors) + 1 : 1;
  return `${major}.${nextMinor}`;
}
