import { describe, it, expect } from "vitest";
import { getMeetingFilterKeyword } from "@/lib/journey/meeting-keyword";

/**
 * Paradas type=meeting como estao configuradas em `products.deliverySteps`
 * (levantadas por inventario read-only na base real, 2026-07-16).
 */
const step = (referenceId: string, title: string) => ({ referenceId, title });

describe("getMeetingFilterKeyword — casamento parada x evento da agenda", () => {
  it("MentoCoach resolve para a palavra-chave que casa com o evento 'MentoCoach' (BUG-073)", () => {
    // Regressao: sem regra propria, caia no fallback do refId ("sessao mentocoach"),
    // que o nome do evento na agenda nunca contem -> 0 sessoes visiveis.
    expect(getMeetingFilterKeyword(step("sessao-mentocoach", "1ª Sessão de MentoCoach"))).toBe("mentocoach");
    expect(getMeetingFilterKeyword(step("sessao-mentocoach", "10ª Sessão de MentoCoach"))).toBe("mentocoach");
  });

  it("o referenceId tem precedencia sobre o titulo (BUG-074)", () => {
    // Regressao: o titulo citava outro servico e sequestrava o filtro, fazendo a
    // parada listar sessoes de Devolutiva / Plano de Carreira.
    expect(getMeetingFilterKeyword(step("orientacao-em-grupo", "Gestão Comportamental e Emocional")))
      .toBe("orientacao em grupo");
    expect(getMeetingFilterKeyword(step("orientacao-em-grupo", "Finanças para Carreira Profissional")))
      .toBe("orientacao em grupo");
  });

  it("mantem o casamento das paradas que ja funcionavam", () => {
    expect(getMeetingFilterKeyword(step("devolutiva-analise-comportamental", "Devolutiva de Análise")))
      .toBe("analise comportamental");
    expect(getMeetingFilterKeyword(step("devolutiva-plano-carreira", "Devolutiva do Plano")))
      .toBe("plano de carreira");
    expect(getMeetingFilterKeyword(step("feedback-posicionamento-profissional", "Consultoria de Feedback")))
      .toBe("feedback posicionamento");
    expect(getMeetingFilterKeyword(step("onboarding", "Sessão de Onboarding"))).toBe("onboarding");
    expect(getMeetingFilterKeyword(step("offboarding", "Sessão de Offboarding"))).toBe("offboarding");
    expect(getMeetingFilterKeyword(step("orientacao-em-grupo", "Autoconhecimento e Aprendizagem")))
      .toBe("orientacao em grupo");
  });

  it("offboarding nao e confundido com onboarding", () => {
    expect(getMeetingFilterKeyword(step("offboarding", "Sessão de Offboarding"))).not.toBe("onboarding");
  });

  it("cai para o titulo quando o referenceId nao identifica o tipo de sessao", () => {
    expect(getMeetingFilterKeyword(step("etapa-01", "Sessão de Onboarding"))).toBe("onboarding");
  });

  it("cai para o referenceId normalizado quando nada identifica o tipo", () => {
    expect(getMeetingFilterKeyword(step("sessao_avulsa-x", "Encontro"))).toBe("sessao avulsa x");
  });

  it("usa o titulo quando nao ha referenceId", () => {
    expect(getMeetingFilterKeyword(step("", "Encontro Livre"))).toBe("encontro livre");
  });
});
