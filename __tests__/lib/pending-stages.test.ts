import { describe, it, expect } from "vitest";
import { resolvePendingStageTitles, formatarListaPtBr } from "@/lib/journey/pending-stages";
import type { JourneyStep } from "@/types/journey";

const stage = (id: string, serviceCode: string, title: string): JourneyStep =>
  ({ id, order: 1, title, icon: "Target", description: "", substeps: [], serviceCode }) as JourneyStep;

/** Jornada real, na ordem em que a nav a renderiza. */
const STAGES = [
  stage("posicionamento-profissional", "BPL-001", "Posicionamento de Carreira"),
  stage("onboarding", "BPL-000", "Onboarding"),
  stage("analise-comportamental", "BPL-002", "Análise Comportamental"),
  stage("plano-de-carreira", "BPL-003", "Plano de Carreira"),
  stage("gestao-e-desenvolvimento", "BPL-004", "Gestão e Desenvolvimento de Carreira"),
  stage("mentocoach", "BPL-005", "MentoCoach"),
];

describe("resolvePendingStageTitles — o que falta vem do MOTOR, nao da posicao", () => {
  it("a 1a etapa travada resolve suas pendencias (BUG-081)", () => {
    // Regressao: o Posicionamento e' a etapa de indice 0. A UI deduzia
    // `stages[indice - 1]`, que nao existe, e o clique caia num return mudo.
    const titulos = resolvePendingStageTitles(["BPL-003", "BPL-004"], STAGES, "posicionamento-profissional");
    expect(titulos).toEqual(["Plano de Carreira", "Gestão e Desenvolvimento de Carreira"]);
  });

  it("nao deduz 'a etapa anterior' pela posicao quando o motor respondeu (BUG-081)", () => {
    // O MentoCoach e' o indice 5; a etapa anterior POSICIONAL e' o GDC. Mas ele
    // espera BPL-003 E BPL-004 — a deducao posicional escondia o Plano.
    const titulos = resolvePendingStageTitles(["BPL-003", "BPL-004"], STAGES, "mentocoach");
    expect(titulos).toContain("Plano de Carreira");
    expect(titulos).toHaveLength(2);
  });

  it("uma pendencia so devolve uma", () => {
    expect(resolvePendingStageTitles(["BPL-004"], STAGES, "mentocoach"))
      .toEqual(["Gestão e Desenvolvimento de Carreira"]);
  });

  it("compara serviceCode sem depender de caixa/espaco", () => {
    expect(resolvePendingStageTitles([" bpl-003 "], STAGES, "mentocoach")).toEqual(["Plano de Carreira"]);
  });

  it("fallback legado: sem `pendentes`, usa a etapa anterior pela posicao", () => {
    // Etapa sem atributos sincronizados — a trava e' a linear do useJourney, e
    // ali "anterior" e', de fato, o indice - 1.
    expect(resolvePendingStageTitles([], STAGES, "plano-de-carreira")).toEqual(["Análise Comportamental"]);
  });

  it("fallback legado na 1a etapa devolve vazio (nao ha anterior)", () => {
    expect(resolvePendingStageTitles([], STAGES, "posicionamento-profissional")).toEqual([]);
  });

  it("codigo pendente sem etapa correspondente NAO inventa a etapa anterior", () => {
    // Discriminante: o motor respondeu, entao a deducao posicional esta proibida.
    // Preferimos vazio (o modal usa texto generico) a nomear a etapa errada.
    expect(resolvePendingStageTitles(["BPL-999"], STAGES, "mentocoach")).toEqual([]);
  });

  it("resolve o que casa e descarta o que nao casa", () => {
    expect(resolvePendingStageTitles(["BPL-999", "BPL-003"], STAGES, "mentocoach"))
      .toEqual(["Plano de Carreira"]);
  });
});

describe("formatarListaPtBr", () => {
  it("formata 1, 2 e 3 itens", () => {
    expect(formatarListaPtBr(["A"])).toBe("A");
    expect(formatarListaPtBr(["A", "B"])).toBe("A e B");
    expect(formatarListaPtBr(["A", "B", "C"])).toBe("A, B e C");
  });

  it("lista vazia devolve vazio", () => {
    expect(formatarListaPtBr([])).toBe("");
  });
});
