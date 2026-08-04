import { describe, it, expect } from "vitest";
import {
  parsePartnerCommissionPercent,
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
