import { describe, it, expect } from "vitest";
import { DEFAULT_EVENT_TYPES, CONSULTOR_A_DEFINIR } from "@/types/calendar-event-types";

/**
 * O casamento titulo-do-Google -> tipo e a fundacao da Etapa 3. Se ele errar, o
 * evento entra sem tipo (visivel no admin) ou, pior, com o tipo errado.
 *
 * Titulos reais levantados da agenda de producao em 2026-07-18.
 */
function normalizeEventTitle(value: string | undefined | null): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

const resolver = (titulo: string) => {
  const mapa = new Map(DEFAULT_EVENT_TYPES.map(t => [normalizeEventTitle(t.googleTitle), t]));
  return mapa.get(normalizeEventTitle(titulo))?.id ?? null;
};

describe("resolucao do tipo pelo titulo do Google", () => {
  it("casa os 3 titulos genericos que a Gestora criou", () => {
    expect(resolver("1 to 1")).toBe("1-to-1");
    expect(resolver("Consultoria Individual")).toBe("consultoria-individual");
    expect(resolver("Consultoria em Grupo")).toBe("consultoria-em-grupo");
  });

  it("tolera variacao de caixa e espaco em volta", () => {
    expect(resolver("  consultoria individual  ")).toBe("consultoria-individual");
    expect(resolver("CONSULTORIA EM GRUPO")).toBe("consultoria-em-grupo");
  });

  it("NAO casa os titulos do modelo antigo — eles seguem no mecanismo atual", () => {
    // Regressao: os 477 eventos do modelo antigo continuam servindo membros pelo
    // casamento por palavra-chave. Se algum deles casasse com um tipo aqui, a
    // Fase 3.1 estaria mexendo em quem nao devia.
    for (const antigo of [
      "Devolutiva Analise Comportamental",
      "Consultoria Plano de Carreira",
      "MentoCoach",
      "Feedback Posicionamento de Carreira",
      "Orientação em Grupo",
      "Onboarding",
    ]) {
      expect(resolver(antigo)).toBeNull();
    }
  });

  it("nao confunde 'Orientação em Grupo' (antigo) com 'Consultoria em Grupo' (novo)", () => {
    // Os dois coexistem hoje na agenda; casar errado misturaria as sessoes.
    expect(resolver("Orientação em Grupo")).toBeNull();
    expect(resolver("Consultoria em Grupo")).toBe("consultoria-em-grupo");
  });

  it("bloqueio nao vira tipo", () => {
    expect(resolver("Bloqueado")).toBeNull();
  });

  it("consultor padrao nasce 'a definir', nao um nome inventado", () => {
    for (const t of DEFAULT_EVENT_TYPES) {
      expect(t.consultorPadrao).toBe(CONSULTOR_A_DEFINIR);
    }
  });

  it("vagas padrao aprovadas pela Gestora: 1 / 1 / 10", () => {
    expect(DEFAULT_EVENT_TYPES.find(t => t.id === "1-to-1")?.vagasPadrao).toBe(1);
    expect(DEFAULT_EVENT_TYPES.find(t => t.id === "consultoria-individual")?.vagasPadrao).toBe(1);
    expect(DEFAULT_EVENT_TYPES.find(t => t.id === "consultoria-em-grupo")?.vagasPadrao).toBe(10);
  });
});
