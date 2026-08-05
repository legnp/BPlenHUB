import { describe, it, expect } from "vitest";
import { withPartnerOriginOptions } from "@/lib/survey/welcome-origin";
import { welcomeSurveyConfig } from "@/config/surveys/welcome";
import { SurveyConfig } from "@/types/survey";

/**
 * Injecao dos parceiros na pergunta "Como voce nos conheceu?" — e' por aqui que TODA
 * indicacao e' capturada (nao existe link nem codigo de indicacao). Se esta regra
 * errar, a indicacao nao acontece e ninguem percebe.
 */
const originOptions = (config: SurveyConfig): string[] => {
  const step = config.steps.find((s) => s.id === "step_origin");
  const field = step?.fields.find((f) => f.id === "origin");
  return (field?.options || []) as string[];
};

describe("withPartnerOriginOptions", () => {
  it("devolve a configuracao intacta quando nao ha parceiro ativo", () => {
    const resultado = withPartnerOriginOptions(welcomeSurveyConfig, []);
    expect(resultado).toBe(welcomeSurveyConfig);
  });

  it("insere os parceiros ANTES da opcao Outro", () => {
    const options = originOptions(withPartnerOriginOptions(welcomeSurveyConfig, ["Fulana Consultoria"]));
    expect(options).toContain("Fulana Consultoria");
    expect(options[options.length - 1]).toBe("Outro");
    expect(options.indexOf("Fulana Consultoria")).toBe(options.length - 2);
  });

  it("preserva todas as origens fixas que ja existiam", () => {
    const antes = originOptions(welcomeSurveyConfig);
    const depois = originOptions(withPartnerOriginOptions(welcomeSurveyConfig, ["Parceiro X"]));
    antes.forEach((opt) => expect(depois).toContain(opt));
    expect(depois).toHaveLength(antes.length + 1);
  });

  it("nao duplica quando o nome do parceiro colide com uma origem fixa", () => {
    const depois = originOptions(withPartnerOriginOptions(welcomeSurveyConfig, ["instagram"]));
    const quantas = depois.filter((o) => o.toLowerCase() === "instagram").length;
    expect(quantas).toBe(1);
  });

  it("nao altera nenhuma outra etapa da recepcao", () => {
    const depois = withPartnerOriginOptions(welcomeSurveyConfig, ["Parceiro X"]);
    expect(depois.steps.map((s) => s.id)).toEqual(welcomeSurveyConfig.steps.map((s) => s.id));
    const nickAntes = welcomeSurveyConfig.steps.find((s) => s.id === "step_nickname");
    const nickDepois = depois.steps.find((s) => s.id === "step_nickname");
    expect(nickDepois).toEqual(nickAntes);
  });

  it("ignora nome vazio ou so com espacos", () => {
    const resultado = withPartnerOriginOptions(welcomeSurveyConfig, ["   ", ""]);
    expect(resultado).toBe(welcomeSurveyConfig);
  });
});

describe("ramo de parceria na recepcao", () => {
  it("roteia a opcao de parceria para os enunciados proprios, com os mesmos campos", () => {
    const stepType = welcomeSurveyConfig.steps.find((s) => s.id === "step_type");
    const userType = stepType?.fields.find((f) => f.id === "userType");
    expect(userType?.logic?.["Para uma Parceria de Negócios"]).toBe("step_topics_partner");

    const topicsPartner = welcomeSurveyConfig.steps.find((s) => s.id === "step_topics_partner");
    const demandPartner = welcomeSurveyConfig.steps.find((s) => s.id === "step_demand_partner");

    // Campos preservados: a resposta do parceiro continua comparavel com a dos demais.
    expect(topicsPartner?.fields[0].id).toBe("topics");
    expect(demandPartner?.fields[0].id).toBe("demand");

    // E o ramo converge de volta na captura da indicacao.
    expect(topicsPartner?.nextStepId).toBe("step_demand_partner");
    expect(demandPartner?.nextStepId).toBe("step_origin");
  });

  it("mantem o fluxo comum saltando o ramo de parceria", () => {
    const stepDemand = welcomeSurveyConfig.steps.find((s) => s.id === "step_demand");
    expect(stepDemand?.nextStepId).toBe("step_origin");
  });
});
