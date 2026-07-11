/**
 * Formatação de valores para a interface (pt-BR).
 */

/**
 * Formata um número no padrão monetário brasileiro: separador de milhar "." e
 * decimal ",", sempre com 2 casas — ex.: 23765.1 -> "23.765,10". Não inclui o
 * prefixo "R$" (mantido no JSX para flexibilidade de layout).
 */
export function formatBRL(value: number): string {
  return (Number.isFinite(value) ? value : 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
