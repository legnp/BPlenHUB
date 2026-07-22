import type { MemberQuota } from "@/types/entitlements";

/**
 * BPlen HUB — Normalizacao de chaves de cota (BUG-008)
 *
 * Historico: `updateMemberQuotasAction` gravava as chaves em UPPERCASE
 * (`type.toUpperCase()`), enquanto varios leitores (OneToOneBookingModal,
 * consumeQuotaAction) esperavam a forma minuscula do catalogo de produtos
 * (`1-to-1`, ...). Uma migracao antiga chegou a normalizar para minusculo, e
 * o gravador voltou a escrever em maiusculo — duas convencoes coexistindo.
 *
 * Chave canonica = minusculo, batendo com o catalogo (fonte de verdade), a
 * migracao anterior e o modal de agendamento. O alias legado `mentoria_1to1`
 * dobra para `1-to-1`.
 */

/** Chave canonica de cota: minusculo + alias legado `mentoria_1to1` -> `1-to-1`. */
export function normalizeQuotaKey(key: string): string {
  const k = key.trim().toLowerCase();
  if (k === "mentoria_1to1") return "1-to-1";
  return k;
}

/** Chave da carteira consumida por sessoes 1:1 (BUG-013). */
export const ONE_TO_ONE_QUOTA_KEY = "1-to-1";

/**
 * Normaliza as chaves de um mapa de cotas e mescla duplicatas resultantes do
 * drift de capitalizacao. Politica de merge (aprovada pela Gestora, BUG-008):
 * total = maior; used = soma; lastUpdated = mais recente. Trata a duplicata
 * como o MESMO credito (o artefato de case nao infla o saldo) e nunca devolve
 * credito ja consumido.
 */
export function foldQuotaMap(
  raw: Record<string, MemberQuota> | null | undefined
): Record<string, MemberQuota> {
  const out: Record<string, MemberQuota> = {};
  if (!raw) return out;

  for (const [rawKey, val] of Object.entries(raw)) {
    if (!val) continue;
    const key = normalizeQuotaKey(rawKey);
    const total = Number(val.total) || 0;
    const used = Number(val.used) || 0;
    const lastUpdated = val.lastUpdated || "";

    const existing = out[key];
    if (!existing) {
      out[key] = { total, used, lastUpdated };
    } else {
      out[key] = {
        total: Math.max(existing.total, total),
        used: existing.used + used,
        lastUpdated: lastUpdated > existing.lastUpdated ? lastUpdated : existing.lastUpdated,
      };
    }
  }

  return out;
}

/**
 * Consumo puro de 1 credito da cota `eventTypeId` (BUG-013). Retorna o mapa ja
 * normalizado (`foldQuotaMap`) e `ok` — `false` quando nao ha saldo (chave
 * ausente ou `used >= total`). NAO toca Firestore: a transacao de agendamento
 * grava o `quotas` retornado no mesmo commit da reserva (atomicidade). `nowISO`
 * e injetavel para teste deterministico.
 */
export function consumeQuota(
  raw: Record<string, MemberQuota> | null | undefined,
  eventTypeId: string,
  nowISO: string = new Date().toISOString()
): { ok: boolean; quotas: Record<string, MemberQuota> } {
  const quotas = foldQuotaMap(raw);
  const key = normalizeQuotaKey(eventTypeId);
  const q = quotas[key];
  if (!q || q.used >= q.total) return { ok: false, quotas };
  return {
    ok: true,
    quotas: { ...quotas, [key]: { ...q, used: q.used + 1, lastUpdated: nowISO } },
  };
}

/**
 * Estorno puro de 1 credito da cota `eventTypeId` (BUG-013), com piso em 0 —
 * nunca devolve mais do que foi consumido. Chave ausente = no-op. So deve ser
 * chamado para uma reserva que de fato consumiu (flag `quotaConsumed`), para nao
 * creditar cancelamento de agendamento anterior a trava. `nowISO` injetavel.
 */
export function refundQuota(
  raw: Record<string, MemberQuota> | null | undefined,
  eventTypeId: string,
  nowISO: string = new Date().toISOString()
): Record<string, MemberQuota> {
  const quotas = foldQuotaMap(raw);
  const key = normalizeQuotaKey(eventTypeId);
  const q = quotas[key];
  if (!q) return quotas;
  return { ...quotas, [key]: { ...q, used: Math.max(0, q.used - 1), lastUpdated: nowISO } };
}
