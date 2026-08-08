import { describe, it, expect } from "vitest";
import { withPartnerOriginOptions } from "@/lib/survey/welcome-origin";
import { welcomeSurveyConfig } from "@/config/surveys/welcome";
import type { SurveyConfig } from "@/types/survey";

/**
 * A pergunta "Como voce nos conheceu?" mistura duas fontes: os CANAIS, fixos no codigo,
 * e os NOMES de parceiros, vindos de `Settings/PartnerDirectory` em tempo de render.
 *
 * Os testes rodam contra a configuracao REAL da recepcao, nao contra um fixture, porque
 * o que precisa ficar travado nao e' so a mecanica da funcao — e' a decisao da Gestora
 * (2026-08-08, BUG-124) de que nome de pessoa nunca mais aparece fixo no codigo. Um
 * fixture passaria feliz enquanto alguem reintroduzisse um nome na lista de verdade.
 */

function origensDe(config: SurveyConfig): string[] {
  const step = config.steps.find((s) => s.id === "step_origin");
  const field = step?.fields.find((f) => f.id === "origin");
  return (field?.options ?? []).filter((o): o is string => typeof o === "string");
}

describe("origens fixas da recepcao", () => {
  it("contem apenas canais — nenhum nome de pessoa fixo no codigo (BUG-124)", () => {
    expect(origensDe(welcomeSurveyConfig)).toEqual([
      "Instagram",
      "LinkedIn",
      "TikTok",
      "Pesquisa do Google",
      "Indicação",
      "Outro",
    ]);
  });

  it("termina em 'Outro' — a injecao de parceiros depende disso para posicionar", () => {
    const fixas = origensDe(welcomeSurveyConfig);
    expect(fixas[fixas.length - 1]).toBe("Outro");
  });
});

describe("withPartnerOriginOptions", () => {
  it("insere o parceiro antes de 'Outro', preservando os canais", () => {
    const resultado = origensDe(withPartnerOriginOptions(welcomeSurveyConfig, ["Lisandra Lencina"]));

    expect(resultado).toEqual([
      "Instagram",
      "LinkedIn",
      "TikTok",
      "Pesquisa do Google",
      "Indicação",
      "Lisandra Lencina",
      "Outro",
    ]);
  });

  it("mantem a ordem de varios parceiros, todos antes de 'Outro'", () => {
    const resultado = origensDe(
      withPartnerOriginOptions(welcomeSurveyConfig, ["Parceiro A", "Parceiro B"])
    );

    expect(resultado.slice(-3)).toEqual(["Parceiro A", "Parceiro B", "Outro"]);
  });

  it("nao duplica quando o nome do parceiro colide com um canal fixo", () => {
    const resultado = origensDe(withPartnerOriginOptions(welcomeSurveyConfig, ["instagram"]));

    expect(resultado).toEqual(origensDe(welcomeSurveyConfig));
    expect(resultado.filter((o) => o.toLowerCase() === "instagram")).toHaveLength(1);
  });

  it("devolve a configuracao intacta quando nao ha parceiro ativo", () => {
    expect(origensDe(withPartnerOriginOptions(welcomeSurveyConfig, []))).toEqual(
      origensDe(welcomeSurveyConfig)
    );
  });

  it("ignora nomes vazios ou so com espaco", () => {
    expect(origensDe(withPartnerOriginOptions(welcomeSurveyConfig, ["", "   "]))).toEqual(
      origensDe(welcomeSurveyConfig)
    );
  });

  it("nao altera os demais passos da recepcao", () => {
    const resultado = withPartnerOriginOptions(welcomeSurveyConfig, ["Lisandra Lencina"]);

    expect(resultado.steps.map((s) => s.id)).toEqual(welcomeSurveyConfig.steps.map((s) => s.id));
    expect(resultado.id).toBe(welcomeSurveyConfig.id);
  });
});
