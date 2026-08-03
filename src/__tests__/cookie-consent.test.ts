import { describe, it, expect, beforeEach } from "vitest";
import {
  COOKIE_CONSENT_KEY,
  COOKIE_CONSENT_SYNCED_KEY,
  cookieChoiceLabel,
  hasPendingCookieSync,
  isCookieChoice,
  markCookieChoiceSynced,
  readStoredCookieChoice,
  storeCookieChoice,
} from "@/lib/consent/cookie-consent";
import { formatGeoLocation } from "@/lib/request-proof";

/**
 * Preferencia de cookies — contrato compartilhado entre banner, server action e
 * o resgate feito no login. Testa as funcoes de producao (Licao 18).
 *
 * A invariante que mais importa aqui e a do espelhamento pendente: o banner e
 * respondido na area publica, quase sempre deslogado, e nunca reaparece. Se
 * "pendente" ficasse errado, a escolha da maioria dos usuarios jamais sairia do
 * navegador — que e exatamente a lacuna que este trabalho fecha.
 */

describe("isCookieChoice — valor fechado", () => {
  it("aceita apenas as duas opcoes do banner", () => {
    expect(isCookieChoice("all")).toBe(true);
    expect(isCookieChoice("essential")).toBe(true);
  });

  it("recusa qualquer outra coisa vinda do cliente", () => {
    expect(isCookieChoice("todos")).toBe(false);
    expect(isCookieChoice("")).toBe(false);
    expect(isCookieChoice(null)).toBe(false);
    expect(isCookieChoice(undefined)).toBe(false);
    expect(isCookieChoice({ choice: "all" })).toBe(false);
  });
});

describe("cookieChoiceLabel", () => {
  it("traduz a escolha para a planilha", () => {
    expect(cookieChoiceLabel("all")).toBe("Todos os cookies");
    expect(cookieChoiceLabel("essential")).toBe("Apenas essenciais");
  });
});

describe("estado local da escolha", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("le a escolha gravada", () => {
    expect(readStoredCookieChoice()).toBeNull();
    storeCookieChoice("all");
    expect(readStoredCookieChoice()).toBe("all");
  });

  it("ignora valor corrompido no navegador", () => {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, "sim_pode_tudo");
    expect(readStoredCookieChoice()).toBeNull();
  });

  it("escolha nova nasce pendente de espelhamento", () => {
    storeCookieChoice("essential");
    expect(hasPendingCookieSync()).toBe(true);
  });

  it("deixa de ser pendente depois que o servidor confirma", () => {
    storeCookieChoice("essential");
    markCookieChoiceSynced();
    expect(hasPendingCookieSync()).toBe(false);
    expect(window.localStorage.getItem(COOKIE_CONSENT_SYNCED_KEY)).toBe("true");
  });

  it("trocar de escolha volta a marcar como pendente", () => {
    // Sem isto, quem aceitasse tudo e depois recuasse para essenciais teria a
    // decisao ANTIGA como ultimo registro do servidor.
    storeCookieChoice("all");
    markCookieChoiceSynced();
    expect(hasPendingCookieSync()).toBe(false);

    storeCookieChoice("essential");
    expect(hasPendingCookieSync()).toBe(true);
    expect(readStoredCookieChoice()).toBe("essential");
  });

  it("sem escolha nenhuma nao ha o que espelhar", () => {
    expect(hasPendingCookieSync()).toBe(false);
  });
});

describe("formatGeoLocation — geo achatada para celula", () => {
  it("monta cidade/regiao e pais", () => {
    expect(
      formatGeoLocation({ city: "Sao Paulo", region: "SP", country: "BR", latitude: "", longitude: "" })
    ).toBe("Sao Paulo/SP, BR");
  });

  it("omite partes ausentes sem deixar separador solto", () => {
    expect(
      formatGeoLocation({ city: "", region: "", country: "BR", latitude: "", longitude: "" })
    ).toBe("BR");
    expect(
      formatGeoLocation({ city: "", region: "", country: "", latitude: "", longitude: "" })
    ).toBe("");
  });
});
