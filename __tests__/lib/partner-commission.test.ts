import { describe, it, expect } from "vitest";
import {
  parsePartnerCommissionPercent,
  computeCommissionValue,
  cycleIdOf,
  cutoffDateOf,
  PARTNER_COMMISSION_MAX_PERCENT,
  PARTNER_COMMISSION_MIN_PERCENT,
} from "@/lib/partners/commission";

/**
 * Area de Parceiros — validacao da taxa fixa de comissao (Fase 0).
 * O painel administrativo entrega string; a action grava numero. Este e' o portao
 * que impede percentual invalido de chegar ao User_Permissions/access.
 */
describe("parsePartnerCommissionPercent", () => {
  it("aceita numero dentro da faixa", () => {
    expect(parsePartnerCommissionPercent(10)).toBe(10);
    expect(parsePartnerCommissionPercent(PARTNER_COMMISSION_MIN_PERCENT)).toBe(0);
    expect(parsePartnerCommissionPercent(PARTNER_COMMISSION_MAX_PERCENT)).toBe(100);
  });

  it("aceita a string do input do admin, com ponto ou virgula decimal", () => {
    expect(parsePartnerCommissionPercent("12.5")).toBe(12.5);
    expect(parsePartnerCommissionPercent("12,5")).toBe(12.5);
    expect(parsePartnerCommissionPercent(" 7 ")).toBe(7);
  });

  it("arredonda para 2 casas decimais", () => {
    expect(parsePartnerCommissionPercent(12.3456)).toBe(12.35);
    expect(parsePartnerCommissionPercent("0.005")).toBe(0.01);
  });

  it("rejeita percentual fora da faixa", () => {
    expect(() => parsePartnerCommissionPercent(-1)).toThrow(/percentual entre/);
    expect(() => parsePartnerCommissionPercent(100.01)).toThrow(/percentual entre/);
  });

  it("rejeita entrada nao numerica", () => {
    expect(() => parsePartnerCommissionPercent("dez por cento")).toThrow(/numerico/);
    expect(() => parsePartnerCommissionPercent(null)).toThrow(/numerico/);
    expect(() => parsePartnerCommissionPercent(undefined)).toThrow(/numerico/);
    expect(() => parsePartnerCommissionPercent(NaN)).toThrow(/numerico/);
    expect(() => parsePartnerCommissionPercent(Infinity)).toThrow(/numerico/);
    expect(() => parsePartnerCommissionPercent({ percent: 10 })).toThrow(/numerico/);
  });

  it("rejeita string vazia (Number('') e 0 — nao pode passar por engano)", () => {
    expect(() => parsePartnerCommissionPercent("")).toThrow(/numerico/);
    expect(() => parsePartnerCommissionPercent("   ")).toThrow(/numerico/);
  });
});

/**
 * Valor do repasse: percentual sobre o valor EFETIVAMENTE PAGO na compra (decisao da
 * Gestora, 2026-08-05). Erro aqui vira dinheiro errado — por isso a regra e' pura.
 */
describe("computeCommissionValue", () => {
  it("aplica o percentual sobre o valor pago", () => {
    expect(computeCommissionValue(1000, 10)).toBe(100);
    expect(computeCommissionValue(1500, 12.5)).toBe(187.5);
  });

  it("arredonda em centavos", () => {
    expect(computeCommissionValue(333.33, 7.5)).toBe(25);
    expect(computeCommissionValue(99.99, 33.33)).toBe(33.33);
  });

  it("devolve zero em compra sem valor, taxa zerada ou entrada invalida", () => {
    expect(computeCommissionValue(0, 10)).toBe(0);
    expect(computeCommissionValue(1000, 0)).toBe(0);
    expect(computeCommissionValue(-50, 10)).toBe(0);
    expect(computeCommissionValue(Number.NaN, 10)).toBe(0);
    expect(computeCommissionValue(1000, Number.POSITIVE_INFINITY)).toBe(0);
  });
});

/**
 * Ciclo e data de corte: a compra entra no ciclo do MES CIVIL em que foi feita, e o
 * corte e' o ultimo dia desse mes (decisao da Gestora, 2026-08-05).
 *
 * A suite roda em UTC (vitest.config), igual a producao — e' o que expoe o erro de
 * fuso: 31/01 as 22:00 BRT ja e 01/02 em UTC (mesma classe do BUG-093).
 */
describe("cycleIdOf e cutoffDateOf", () => {
  it("usa o mes civil da compra", () => {
    expect(cycleIdOf("2026-08-05T14:00:00.000Z")).toBe("2026-08");
    expect(cutoffDateOf("2026-08-05T14:00:00.000Z")).toBe("2026-08-31");
  });

  it("resolve o mes no fuso de Brasilia, nao no do servidor", () => {
    // 31/01/2026 as 22:00 BRT = 01/02/2026 01:00 UTC. O ciclo e' o de JANEIRO.
    expect(cycleIdOf("2026-02-01T01:00:00.000Z")).toBe("2026-01");
    expect(cutoffDateOf("2026-02-01T01:00:00.000Z")).toBe("2026-01-31");
  });

  it("acerta o ultimo dia de meses curtos e de fevereiro bissexto", () => {
    expect(cutoffDateOf("2026-04-10T12:00:00.000Z")).toBe("2026-04-30");
    expect(cutoffDateOf("2026-02-10T12:00:00.000Z")).toBe("2026-02-28");
    expect(cutoffDateOf("2028-02-10T12:00:00.000Z")).toBe("2028-02-29");
  });

  it("recusa data invalida em vez de inventar um ciclo", () => {
    expect(() => cycleIdOf("nao-e-data")).toThrow(/invalida/);
  });
});
