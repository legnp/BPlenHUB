import { describe, it, expect } from "vitest";
import {
  productServesJourneyAudience,
  JOURNEY_PROGRESS_DOC,
} from "@/lib/journey/audience";

/**
 * Filtro de audiencia da jornada (Fase 1 da Area de Parceiros).
 *
 * O ponto critico do teste nao e o parceiro ver a trilha dele — e o MEMBRO nao ver a
 * trilha do parceiro, e nada do que o membro ja via desaparecer por causa do filtro
 * (Licao 28: rodar a regra contra a populacao inteira, nao so contra o caso novo).
 */
describe("productServesJourneyAudience", () => {
  it("mantem na jornada de membro tudo o que ja aparecia", () => {
    expect(productServesJourneyAudience({ targetAudiences: ["people"] }, "member")).toBe(true);
    expect(productServesJourneyAudience({ targetAudiences: ["companies"] }, "member")).toBe(true);
    expect(productServesJourneyAudience({ targetAudiences: ["internal"] }, "member")).toBe(true);
    expect(productServesJourneyAudience({ targetAudiences: ["people", "companies"] }, "member")).toBe(true);
  });

  it("mantem produto legado sem audiencia na jornada de membro", () => {
    expect(productServesJourneyAudience({ targetAudiences: [] }, "member")).toBe(true);
    // Dado legado pode nem ter o campo — o motor nao pode quebrar nem esconder a etapa.
    expect(
      productServesJourneyAudience({ targetAudiences: undefined as unknown as [] }, "member")
    ).toBe(true);
  });

  it("tira da jornada de membro o produto exclusivo de parceiro", () => {
    expect(productServesJourneyAudience({ targetAudiences: ["partners"] }, "member")).toBe(false);
  });

  it("monta a jornada de parceiro so com produto que declara a audiencia", () => {
    expect(productServesJourneyAudience({ targetAudiences: ["partners"] }, "partner")).toBe(true);
    expect(productServesJourneyAudience({ targetAudiences: ["people"] }, "partner")).toBe(false);
    expect(productServesJourneyAudience({ targetAudiences: [] }, "partner")).toBe(false);
  });

  it("deixa produto de audiencia dupla nas duas trilhas", () => {
    const dual = { targetAudiences: ["people", "partners"] as Array<"people" | "partners"> };
    expect(productServesJourneyAudience(dual, "member")).toBe(true);
    expect(productServesJourneyAudience(dual, "partner")).toBe(true);
  });

  it("usa docs de progresso irmaos, nunca o mesmo", () => {
    expect(JOURNEY_PROGRESS_DOC.member).toBe("progress");
    expect(JOURNEY_PROGRESS_DOC.partner).toBe("partner_progress");
    expect(JOURNEY_PROGRESS_DOC.member).not.toBe(JOURNEY_PROGRESS_DOC.partner);
  });
});
