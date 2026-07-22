import { describe, it, expect } from "vitest";
import { consumeQuota, refundQuota, ONE_TO_ONE_QUOTA_KEY } from "@/lib/quota-keys";
import { isOneToOneEvent } from "@/lib/booking/policy";

/**
 * BUG-013 — trava real da cota 1:1 no agendamento.
 *
 * A logica de consumo/estorno e PURA (sem Firestore): a transacao de booking
 * aplica o mapa retornado no mesmo commit da reserva. Testar aqui a aritmetica
 * (a regra de negocio) e a deteccao de qual evento consome, sem tocar no banco.
 *
 * `nowISO` e injetado para deixar o `lastUpdated` deterministico.
 */

const NOW = "2026-07-22T12:00:00.000Z";

describe("consumeQuota (BUG-013)", () => {
  it("consome 1 credito quando ha saldo (used < total)", () => {
    const r = consumeQuota({ "1-to-1": { total: 3, used: 1, lastUpdated: "x" } }, ONE_TO_ONE_QUOTA_KEY, NOW);
    expect(r.ok).toBe(true);
    expect(r.quotas["1-to-1"]).toEqual({ total: 3, used: 2, lastUpdated: NOW });
  });

  it("BLOQUEIA quando a cota esta esgotada (used >= total)", () => {
    const r = consumeQuota({ "1-to-1": { total: 2, used: 2, lastUpdated: "x" } }, ONE_TO_ONE_QUOTA_KEY, NOW);
    expect(r.ok).toBe(false);
    expect(r.quotas["1-to-1"].used).toBe(2); // inalterado
  });

  it("BLOQUEIA quando o membro nao tem a chave 1-to-1 (nunca comprou)", () => {
    const r = consumeQuota({ "consultoria-individual": { total: 5, used: 0, lastUpdated: "x" } }, ONE_TO_ONE_QUOTA_KEY, NOW);
    expect(r.ok).toBe(false);
  });

  it("BLOQUEIA com carteira vazia/nula", () => {
    expect(consumeQuota(null, ONE_TO_ONE_QUOTA_KEY, NOW).ok).toBe(false);
    expect(consumeQuota({}, ONE_TO_ONE_QUOTA_KEY, NOW).ok).toBe(false);
  });

  it("normaliza o drift de case/alias antes de consumir (BUG-008)", () => {
    const r = consumeQuota({ "1-TO-1": { total: 4, used: 0, lastUpdated: "x" } }, "1-to-1", NOW);
    expect(r.ok).toBe(true);
    expect(r.quotas["1-to-1"].used).toBe(1);
    expect(r.quotas["1-TO-1"]).toBeUndefined();
  });
});

describe("refundQuota (BUG-013)", () => {
  it("estorna 1 credito", () => {
    const q = refundQuota({ "1-to-1": { total: 3, used: 2, lastUpdated: "x" } }, ONE_TO_ONE_QUOTA_KEY, NOW);
    expect(q["1-to-1"]).toEqual({ total: 3, used: 1, lastUpdated: NOW });
  });

  it("nunca devolve abaixo de 0 (piso)", () => {
    const q = refundQuota({ "1-to-1": { total: 3, used: 0, lastUpdated: "x" } }, ONE_TO_ONE_QUOTA_KEY, NOW);
    expect(q["1-to-1"].used).toBe(0);
  });

  it("no-op quando a chave nao existe", () => {
    const q = refundQuota({}, ONE_TO_ONE_QUOTA_KEY, NOW);
    expect(q["1-to-1"]).toBeUndefined();
  });
});

describe("isOneToOneEvent (BUG-013) — so o tipo 1-to-1 consome", () => {
  it("tipoId 1-to-1 -> true", () => {
    expect(isOneToOneEvent({ tipoId: "1-to-1", summary: "1 to 1" })).toBe(true);
  });

  it("Consultoria Individual e Consultoria em Grupo -> false", () => {
    expect(isOneToOneEvent({ tipoId: "consultoria-individual", summary: "Consultoria Individual" })).toBe(false);
    expect(isOneToOneEvent({ tipoId: "consultoria-em-grupo", summary: "Consultoria em Grupo" })).toBe(false);
  });

  it("identificador tem precedencia sobre o titulo (Licao 19): tipoId nao-1:1 vence texto '1 to 1'", () => {
    expect(isOneToOneEvent({ tipoId: "consultoria-em-grupo", summary: "Consultoria em Grupo (antigo 1 to 1)" })).toBe(false);
  });

  it("sem tipoId, cai no titulo generico '1 to 1' (evento nao re-sincronizado)", () => {
    expect(isOneToOneEvent({ tipoId: null, summary: "BPlen | 1 to 1" })).toBe(true);
    expect(isOneToOneEvent({ summary: "Consultoria em Grupo" })).toBe(false);
  });
});
