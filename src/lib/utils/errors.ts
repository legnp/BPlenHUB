/**
 * Utilitário central para tratamento de erros de tipo `unknown`.
 * O valor de um `catch` pode ser qualquer coisa lançada em JavaScript
 * (Error, string, objeto de SDK externo) — nunca presuma o formato sem checar.
 */
export function getErrorMessage(error: unknown, fallback = "Erro desconhecido"): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return fallback;
}

/**
 * Extrai um codigo de erro (ex: status HTTP de erros de SDKs do Google/Firebase)
 * de um valor `unknown`, sem presumir o formato.
 */
export function getErrorCode(error: unknown): number | string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "number" || typeof code === "string") return code;
  }
  return undefined;
}
