import { describe, it, expect } from "vitest";
import { classifyTransfer, type TransferInput } from "@/lib/identity/account-transfer";

/**
 * Transferencia de conta (Fase 3). Exerce a decisao real (Licao 18). Invariante de
 * seguranca: nunca transferir automaticamente para cima de uma conta COM dados
 * (evita perda/trunc de dado — merge disso e manual).
 */

const base: TransferInput = {
  sourceExists: true,
  sourceArchived: false,
  sourceMatricula: "BP-005-PF-260523",
  targetCurrentMatricula: null,
  orphanHasData: false,
};

describe("classifyTransfer", () => {
  it("libera quando destino nao tem conta (novo login limpo)", () => {
    expect(classifyTransfer(base)).toEqual({ ok: true });
  });

  it("libera quando destino aponta para conta orfa SEM dados (arquivavel)", () => {
    expect(
      classifyTransfer({ ...base, targetCurrentMatricula: "BP-009-PF-260601", orphanHasData: false })
    ).toEqual({ ok: true });
  });

  it("RECUSA quando destino aponta para conta COM dados (merge manual)", () => {
    expect(
      classifyTransfer({ ...base, targetCurrentMatricula: "BP-009-PF-260601", orphanHasData: true })
    ).toEqual({ ok: false, reason: "target_has_data" });
  });

  it("recusa origem inexistente", () => {
    expect(classifyTransfer({ ...base, sourceExists: false })).toEqual({
      ok: false,
      reason: "source_missing",
    });
  });

  it("recusa origem arquivada", () => {
    expect(classifyTransfer({ ...base, sourceArchived: true })).toEqual({
      ok: false,
      reason: "source_archived",
    });
  });

  it("recusa no-op: destino ja e a propria origem", () => {
    expect(
      classifyTransfer({ ...base, targetCurrentMatricula: "BP-005-PF-260523" })
    ).toEqual({ ok: false, reason: "same_account" });
  });
});
