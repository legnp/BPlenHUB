import { describe, it, expect } from "vitest";
import {
  sanitizeReturnTo,
  verifiedEmailForHealing,
  callerOwnsUid,
  normalizeEmail,
  normalizeProvider,
  buildEntrarPath,
  DEFAULT_RETURN_TO,
} from "@/lib/auth/identity-guards";

/**
 * Suite de nao-regressao de IDENTIDADE da expansao de autenticacao.
 * Exerce as funcoes de producao (Licao 18), nao copias. Cobre os invariantes
 * exigidos pela auditoria antes do merge (T-02 / BUG-032 / BUG-106) e o novo
 * controle anti open-redirect do `returnTo` (secao 6/8 do plano).
 */

describe("sanitizeReturnTo — anti open-redirect (same-origin)", () => {
  it("aceita caminho interno simples", () => {
    expect(sanitizeReturnTo("/hub")).toBe("/hub");
    expect(sanitizeReturnTo("/hub/checkout/junior")).toBe("/hub/checkout/junior");
    expect(sanitizeReturnTo("/")).toBe("/");
  });

  it("preserva query e hash internos", () => {
    expect(sanitizeReturnTo("/hub/journey?step=2")).toBe("/hub/journey?step=2");
    expect(sanitizeReturnTo("/hub#secao")).toBe("/hub#secao");
  });

  it("rejeita URL absoluta (http/https) -> fallback", () => {
    expect(sanitizeReturnTo("https://phish.exemplo/callback")).toBe(DEFAULT_RETURN_TO);
    expect(sanitizeReturnTo("http://phish.exemplo")).toBe(DEFAULT_RETURN_TO);
  });

  it("rejeita protocolo-relativo //host -> fallback", () => {
    expect(sanitizeReturnTo("//phish.exemplo")).toBe(DEFAULT_RETURN_TO);
    expect(sanitizeReturnTo("//phish.exemplo/hub")).toBe(DEFAULT_RETURN_TO);
  });

  it("rejeita truque com barra invertida /\\host -> fallback", () => {
    expect(sanitizeReturnTo("/\\phish.exemplo")).toBe(DEFAULT_RETURN_TO);
  });

  it("rejeita open-redirect ofuscado por percent-encoding", () => {
    // "/%2F%2Fphish.exemplo" decodifica para "//phish.exemplo"
    expect(sanitizeReturnTo("/%2F%2Fphish.exemplo")).toBe(DEFAULT_RETURN_TO);
    // esquema embutido codificado
    expect(sanitizeReturnTo("/%3A%2F%2Fphish")).toBe(DEFAULT_RETURN_TO);
  });

  it("rejeita esquemas nao-http embutidos", () => {
    expect(sanitizeReturnTo("javascript://alert(1)")).toBe(DEFAULT_RETURN_TO);
    expect(sanitizeReturnTo("/x://y")).toBe(DEFAULT_RETURN_TO);
  });

  it("rejeita caminho que nao comeca com barra", () => {
    expect(sanitizeReturnTo("hub")).toBe(DEFAULT_RETURN_TO);
    expect(sanitizeReturnTo("phish.exemplo/hub")).toBe(DEFAULT_RETURN_TO);
  });

  it("rejeita caractere de controle embutido -> fallback", () => {
    expect(sanitizeReturnTo("/hub\nSet-Cookie: x")).toBe(DEFAULT_RETURN_TO);
    expect(sanitizeReturnTo("/hub\t/x")).toBe(DEFAULT_RETURN_TO);
  });

  it("rejeita entradas nao-string, vazias ou gigantes -> fallback", () => {
    expect(sanitizeReturnTo(null)).toBe(DEFAULT_RETURN_TO);
    expect(sanitizeReturnTo(undefined)).toBe(DEFAULT_RETURN_TO);
    expect(sanitizeReturnTo("")).toBe(DEFAULT_RETURN_TO);
    expect(sanitizeReturnTo("   ")).toBe(DEFAULT_RETURN_TO);
    expect(sanitizeReturnTo("/" + "a".repeat(600))).toBe(DEFAULT_RETURN_TO);
  });

  it("respeita fallback customizado", () => {
    expect(sanitizeReturnTo("https://mau", "/entrar")).toBe("/entrar");
  });
});

describe("verifiedEmailForHealing — e-mail so da sessao dona do uid (BUG-106)", () => {
  it("devolve o e-mail da sessao quando ela e a dona do uid alvo", () => {
    const caller = { uid: "uid-1", email: "Maria@Exemplo.com" };
    expect(verifiedEmailForHealing(caller, "uid-1")).toBe("maria@exemplo.com");
  });

  it("NAO cura quando a sessao age sobre outro uid (admin sobre terceiro)", () => {
    const caller = { uid: "admin-uid", email: "admin@bplen.com" };
    // Se o e-mail do admin curasse aqui, resolveria para a matricula ERRADA.
    expect(verifiedEmailForHealing(caller, "vitima-uid")).toBeUndefined();
  });

  it("NAO cura sem sessao", () => {
    expect(verifiedEmailForHealing(null, "uid-1")).toBeUndefined();
  });

  it("NAO cura quando a sessao nao tem e-mail", () => {
    expect(verifiedEmailForHealing({ uid: "uid-1", email: null }, "uid-1")).toBeUndefined();
    expect(verifiedEmailForHealing({ uid: "uid-1" }, "uid-1")).toBeUndefined();
  });
});

describe("callerOwnsUid — acao sensivel so age sobre o proprio uid (BUG-032)", () => {
  it("true quando o uid do chamador casa o alvo", () => {
    expect(callerOwnsUid({ uid: "uid-1" }, "uid-1")).toBe(true);
  });

  it("false quando difere ou sessao ausente", () => {
    expect(callerOwnsUid({ uid: "uid-1" }, "uid-2")).toBe(false);
    expect(callerOwnsUid(null, "uid-1")).toBe(false);
  });
});

describe("buildEntrarPath — redirecionamento unificado para /entrar", () => {
  it("preserva o caminho interno sanitizado em returnTo", () => {
    expect(buildEntrarPath("/hub/checkout/junior")).toBe(
      "/entrar?returnTo=%2Fhub%2Fcheckout%2Fjunior"
    );
  });

  it("um returnTo externo cai para o destino interno padrao (fail-closed)", () => {
    expect(buildEntrarPath("https://phish.exemplo")).toBe(
      `/entrar?returnTo=${encodeURIComponent(DEFAULT_RETURN_TO)}`
    );
  });
});

describe("normalizeEmail / normalizeProvider", () => {
  it("normaliza e-mail (trim + lowercase)", () => {
    expect(normalizeEmail("  Fulano@Bplen.COM ")).toBe("fulano@bplen.com");
  });

  it("mapeia provedores conhecidos e degrada desconhecido para 'unknown'", () => {
    expect(normalizeProvider("google.com")).toBe("google.com");
    expect(normalizeProvider("microsoft.com")).toBe("microsoft.com");
    expect(normalizeProvider("emailLink")).toBe("emailLink");
    expect(normalizeProvider("password")).toBe("emailLink");
    expect(normalizeProvider("apple.com")).toBe("unknown");
    expect(normalizeProvider(null)).toBe("unknown");
  });
});
