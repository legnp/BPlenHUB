/**
 * BPlen HUB — Date Governance Utils 🛡️
 * Centraliza a normalização de datas para evitar erros de tipagem entre Firebase Client/Admin e JS plano.
 */

/**
 * Converte qualquer variação de data do ecossistema (Timestamp, Date, ISO String) 
 * em um objeto Date nativo do JavaScript de forma segura.
 */
export function toSafeDate(val: unknown): Date | null {
  if (!val) return null;

  // 1. Se já for instância de Date
  if (val instanceof Date) return val;

  // 2. Se for um Timestamp do Firebase (Client ou Admin) possessing .toDate()
  if (typeof val === 'object' && typeof (val as { toDate?: unknown }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate();
  }

  // 3. Se for um objeto estruturado de Timestamp { seconds, nanoseconds }
  if (typeof val === 'object' && val !== null && 'seconds' in val && typeof (val as { seconds: unknown }).seconds === 'number') {
    return new Date((val as { seconds: number }).seconds * 1000);
  }

  // 4. Se for uma string (ISO ou similar)
  if (typeof val === 'string') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  // 5. Fallback para milissegundos (number)
  if (typeof val === 'number') {
    return new Date(val);
  }

  return null;
}

/**
 * Retorna a representação ISO de uma data, ou null se inválida.
 */
export function toISOSafe(val: unknown): string | null {
  const d = toSafeDate(val);
  return d ? d.toISOString() : null;
}
