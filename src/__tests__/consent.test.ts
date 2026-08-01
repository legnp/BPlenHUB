import { describe, it, expect } from "vitest";
import {
  needsConsentGate,
  computeAgeYears,
  isAdult,
  deviceTypeFromUserAgent,
  CONSENT_VERSION,
  MIN_AGE_YEARS,
} from "@/lib/consent/consent";

/**
 * Gate de Boas-vindas (consentimento — Fase 2). Exerce as funcoes reais (Licao 18):
 * quando reexibir o gate, a trava de 18+ e a deteccao de dispositivo.
 */

describe("needsConsentGate — reprompt por versao", () => {
  it("sem consentimento previo = mostra o gate", () => {
    expect(needsConsentGate(null)).toBe(true);
    expect(needsConsentGate(undefined)).toBe(true);
    expect(needsConsentGate("")).toBe(true);
  });

  it("versao diferente da vigente = mostra (reprompt por mudanca de termos)", () => {
    expect(needsConsentGate("2020-01-01")).toBe(true);
  });

  it("versao vigente aceita = libera", () => {
    expect(needsConsentGate(CONSENT_VERSION)).toBe(false);
  });
});

describe("computeAgeYears / isAdult — trava de 18+", () => {
  const today = new Date(Date.UTC(2026, 7, 1)); // 2026-08-01

  it("calcula idade em anos completos", () => {
    expect(computeAgeYears("2000-01-01", today)).toBe(26);
    expect(computeAgeYears("2008-08-01", today)).toBe(18); // aniversario no dia
    expect(computeAgeYears("2008-08-02", today)).toBe(17); // um dia antes de virar 18
  });

  it("adulto: >= 18 na data de referencia", () => {
    expect(isAdult("2008-08-01", today)).toBe(true); // faz 18 hoje
    expect(isAdult("2008-08-02", today)).toBe(false); // faz 18 amanha
    expect(isAdult("2010-01-01", today)).toBe(false); // 16
    expect(isAdult("1990-05-20", today)).toBe(true);
  });

  it("data invalida = -1 e nao-adulto (nunca libera por engano)", () => {
    expect(computeAgeYears("2020-02-31", today)).toBe(-1); // dia inexistente
    expect(computeAgeYears("nao-e-data", today)).toBe(-1);
    expect(computeAgeYears("", today)).toBe(-1);
    expect(computeAgeYears(null, today)).toBe(-1);
    expect(isAdult("2020-02-31", today)).toBe(false);
    expect(isAdult(null, today)).toBe(false);
  });

  it("MIN_AGE_YEARS e 18", () => {
    expect(MIN_AGE_YEARS).toBe(18);
  });
});

describe("deviceTypeFromUserAgent", () => {
  it("detecta mobile", () => {
    expect(deviceTypeFromUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS) Mobile/15E148")).toBe("mobile");
    expect(deviceTypeFromUserAgent("Mozilla/5.0 (Linux; Android 13; Pixel) Mobile")).toBe("mobile");
  });

  it("detecta tablet", () => {
    expect(deviceTypeFromUserAgent("Mozilla/5.0 (iPad; CPU OS 17_0)")).toBe("tablet");
  });

  it("desktop por padrao e unknown sem UA", () => {
    expect(deviceTypeFromUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("desktop");
    expect(deviceTypeFromUserAgent(null)).toBe("unknown");
    expect(deviceTypeFromUserAgent("")).toBe("unknown");
  });
});
