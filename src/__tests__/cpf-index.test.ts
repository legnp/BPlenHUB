import { describe, it, expect } from "vitest";
import { classifyCpfOwnership } from "@/lib/identity/cpf-index";
import { validateCPF } from "@/utils/validations";

/**
 * Trava de CPF (unicidade por pessoa — Fase 1b). Exerce a funcao de decisao real
 * (Licao 18), a mesma usada por `assertAndClaimCpf`/`checkCpfStatus`. Cobre o
 * invariante: o MESMO CPF nao pode pertencer a duas matriculas.
 */

describe("classifyCpfOwnership — posse do CPF no indice", () => {
  it("CPF sem dono no indice = free (pode reivindicar)", () => {
    expect(classifyCpfOwnership(null, "BP-001-PF-260101")).toBe("free");
    expect(classifyCpfOwnership(undefined, "BP-001-PF-260101")).toBe("free");
    expect(classifyCpfOwnership("", "BP-001-PF-260101")).toBe("free");
  });

  it("CPF ja e da propria matricula = owned (reedicao liberada)", () => {
    expect(classifyCpfOwnership("BP-001-PF-260101", "BP-001-PF-260101")).toBe("owned");
  });

  it("CPF pertence a OUTRA matricula = taken (bloqueio)", () => {
    // O caso central: mesma pessoa/CPF tentando virar uma segunda conta.
    expect(classifyCpfOwnership("BP-001-PF-260101", "BP-999-PF-260101")).toBe("taken");
  });
});

describe("validateCPF — formato + digito verificador (pre-checagem da trava)", () => {
  it("aceita CPF valido (com e sem mascara)", () => {
    // CPF valido de teste (digitos verificadores corretos).
    expect(validateCPF("529.982.247-25")).toBe(true);
    expect(validateCPF("52998224725")).toBe(true);
  });

  it("rejeita digito verificador invalido", () => {
    expect(validateCPF("529.982.247-24")).toBe(false);
  });

  it("rejeita tamanho errado e sequencias repetidas", () => {
    expect(validateCPF("123")).toBe(false);
    expect(validateCPF("111.111.111-11")).toBe(false);
    expect(validateCPF("00000000000")).toBe(false);
  });
});
