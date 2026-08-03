import { describe, it, expect } from "vitest";
import {
  buildGenericSurveyRow,
  collectAnswerableFields,
  serializeSurveyValue,
} from "@/lib/survey/survey-serializer";
import { columnLetter } from "@/lib/drive-utils";
import type { SurveyConfig } from "@/types/survey";

/**
 * Cobertura padrao do Drive — serializacao generica de resposta de survey.
 *
 * Testa as funcoes de producao, nao copias (Licao 18). O ponto de cada bloco e a
 * invariante que sustenta a copia de seguranca: nada some, a ordem das colunas
 * nao muda entre envios, e o range da planilha continua valido acima de 26
 * colunas — foi exatamente o teto que impediu o registro generico antes.
 */

function config(over: Partial<SurveyConfig> = {}): SurveyConfig {
  return {
    id: "survey_teste",
    kind: "survey",
    title: "Survey de Teste",
    steps: [],
    analytics: { surveyId: "survey_teste" },
    policy: { editable: false },
    ...over,
  };
}

describe("columnLetter — notacao A1 alem de 26 colunas", () => {
  it("cobre a primeira faixa de letras", () => {
    expect(columnLetter(1)).toBe("A");
    expect(columnLetter(26)).toBe("Z");
  });

  it("passa para duas letras a partir da 27a coluna", () => {
    // O calculo antigo (`String.fromCharCode(64 + n)`) devolvia "[" aqui e o
    // Sheets recusava o range inteiro.
    expect(columnLetter(27)).toBe("AA");
    expect(columnLetter(28)).toBe("AB");
    expect(columnLetter(52)).toBe("AZ");
    expect(columnLetter(53)).toBe("BA");
  });

  it("atende a largura real dos maiores surveys", () => {
    // preparacao_entrevistas passa de 40 campos.
    expect(columnLetter(48)).toBe("AV");
  });

  it("recusa indice invalido em vez de gerar range silenciosamente errado", () => {
    expect(() => columnLetter(0)).toThrow();
  });
});

describe("serializeSurveyValue — formatos que o motor produz", () => {
  it("mantem texto e converte escalares", () => {
    expect(serializeSurveyValue("resposta")).toBe("resposta");
    expect(serializeSurveyValue(7)).toBe("7");
    expect(serializeSurveyValue(true)).toBe("true");
  });

  it("trata ausencia como celula vazia, nao como a string 'null'", () => {
    expect(serializeSurveyValue(null)).toBe("");
    expect(serializeSurveyValue(undefined)).toBe("");
  });

  it("junta multipla escolha em uma celula legivel", () => {
    expect(serializeSurveyValue(["Um", "Dois"])).toBe("Um, Dois");
  });

  it("extrai o link do upload em vez de despejar o objeto", () => {
    expect(serializeSurveyValue({ url: "https://x/y", fileName: "cv.pdf" })).toBe("cv.pdf (https://x/y)");
    expect(serializeSurveyValue({ url: "https://x/y" })).toBe("https://x/y");
  });

  it("achata a cascata nos dois niveis", () => {
    expect(serializeSurveyValue({ primary: "Tecnologia", secondary: "Dados" })).toBe("Tecnologia > Dados");
    expect(serializeSurveyValue({ primary: "Tecnologia" })).toBe("Tecnologia");
  });

  it("preserva objeto desconhecido como JSON — feio, porem integro", () => {
    expect(serializeSurveyValue({ nota: 3, tema: "x" })).toBe('{"nota":3,"tema":"x"}');
  });
});

describe("collectAnswerableFields — o que vira coluna", () => {
  it("descarta campos puramente ilustrativos", () => {
    const fields = collectAnswerableFields(
      config({
        steps: [
          {
            id: "s1",
            question: "q",
            fields: [
              { id: "aviso", type: "info" },
              { id: "banner", type: "image" },
              { id: "nome", type: "text" },
            ],
          },
        ],
      })
    );

    expect(fields.map((f) => f.id)).toEqual(["nome"]);
  });
});

describe("buildGenericSurveyRow — a garantia de que nada se perde", () => {
  const withFields = config({
    steps: [
      {
        id: "s1",
        question: "q",
        fields: [
          { id: "objetivo", type: "text", label: "Objetivo de carreira" },
          { id: "desafios", type: "multi_select", label: "Desafios" },
        ],
      },
    ],
  });

  it("abre com as colunas fixas de rastreio", () => {
    const { headers, rowData } = buildGenericSurveyRow("survey_teste", {}, "BP-001-PF-260101", withFields);

    expect(headers.slice(0, 3)).toEqual(["Timestamp", "Matricula", "Survey"]);
    expect(rowData[1]).toBe("BP-001-PF-260101");
    expect(rowData[2]).toBe("Survey de Teste");
  });

  it("usa o rotulo do campo como cabecalho", () => {
    const { headers } = buildGenericSurveyRow("survey_teste", {}, "BP-001-PF-260101", withFields);
    expect(headers).toContain("Objetivo de carreira");
    expect(headers).toContain("Desafios");
  });

  it("mantem a mesma ordem de colunas quando o envio responde menos campos", () => {
    // Invariante critica: `appendDataToSheet` escreve o cabecalho so no primeiro
    // envio. Se a ordem variasse, a linha 3 nao significaria o mesmo que a 2.
    const completo = buildGenericSurveyRow(
      "survey_teste",
      { objetivo: "Migrar de area", desafios: ["A", "B"] },
      "BP-001-PF-260101",
      withFields
    );
    const parcial = buildGenericSurveyRow(
      "survey_teste",
      { desafios: ["A"] },
      "BP-001-PF-260101",
      withFields
    );

    expect(parcial.headers).toEqual(completo.headers);
    expect(parcial.rowData[3]).toBe("");
    expect(parcial.rowData[4]).toBe("A");
  });

  it("nao descarta resposta ausente da definicao", () => {
    // O caso que motivou tudo: campo renomeado no survey sem atualizar o handler.
    // Antes virava "N/A" em silencio (BUG-109); agora entra como coluna extra.
    const { headers, rowData } = buildGenericSurveyRow(
      "survey_teste",
      { objetivo: "x", campo_orfao: "valor que nao pode sumir" },
      "BP-001-PF-260101",
      withFields
    );

    const idx = headers.indexOf("campo_orfao");
    expect(idx).toBeGreaterThan(-1);
    expect(rowData[idx]).toBe("valor que nao pode sumir");
  });

  it("ordena as chaves extras para a ordem nao depender do objeto recebido", () => {
    const a = buildGenericSurveyRow("s", { zeta: "1", alfa: "2" }, "BP-001-PF-260101");
    const b = buildGenericSurveyRow("s", { alfa: "2", zeta: "1" }, "BP-001-PF-260101");

    expect(a.headers).toEqual(b.headers);
    expect(a.headers.slice(3)).toEqual(["alfa", "zeta"]);
  });

  it("funciona sem config — survey dinamico ainda e gravado", () => {
    const { headers, rowData } = buildGenericSurveyRow(
      "content_evaluation_42",
      { rating: 5, comment: "otimo" },
      "BP-ANON"
    );

    expect(rowData[2]).toBe("content_evaluation_42");
    expect(headers).toContain("rating");
    expect(headers).toContain("comment");
  });

  it("desambigua rotulos repetidos para nao gerar duas colunas iguais", () => {
    const duplicado = config({
      steps: [
        {
          id: "s1",
          question: "q",
          fields: [
            { id: "nota_a", type: "scale", label: "Nota" },
            { id: "nota_b", type: "scale", label: "Nota" },
          ],
        },
      ],
    });

    const { headers } = buildGenericSurveyRow("survey_teste", {}, "BP-001-PF-260101", duplicado);
    expect(headers).toContain("Nota");
    expect(headers).toContain("Nota (nota_b)");
  });
});
