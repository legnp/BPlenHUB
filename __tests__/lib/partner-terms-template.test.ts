import { describe, it, expect } from "vitest";
import {
  fillTermsTokens,
  PARTNER_TERMS_TEMPLATE,
  PartnerTermsContext,
  resolveTermsForPartner,
  sectionApplies,
} from "@/lib/partners/terms-template";

/**
 * Montagem do termo de parceria.
 *
 * O que estes testes protegem e' o TEXTO QUE A PESSOA ASSINA: bloco condicional que
 * vaza para quem nao deveria ve-lo, e marcador que chega ao parceiro sem preencher, sao
 * defeitos juridicos — nao cosmeticos.
 */

const contextoBase: PartnerTermsContext = {
  partnerName: "Fulana de Tal",
  partnerDocument: "123.456.789-00",
  partnerAddress: "Rua Exemplo, 100 — São Paulo/SP",
  partnerMatricula: "BP-001-PF-260101",
  commissionPercent: 12.5,
  isCommercial: true,
  hasPublicShowcase: false,
};

describe("fillTermsTokens", () => {
  it("preenche os marcadores com o cadastro do parceiro", () => {
    const texto = fillTermsTokens(
      "PARCEIRO: {{partnerName}}, inscrito no {{partnerDocument}}, código {{partnerMatricula}}.",
      contextoBase
    );
    expect(texto).toBe("PARCEIRO: Fulana de Tal, inscrito no 123.456.789-00, código BP-001-PF-260101.");
  });

  it("usa a taxa real do parceiro, e nao um percentual fixo no texto", () => {
    expect(fillTermsTokens("percentual fixo de {{commissionPercent}}%", contextoBase)).toBe(
      "percentual fixo de 12.5%"
    );
  });

  it("marca o que falta em vez de sumir em silencio", () => {
    const semCadastro = { ...contextoBase, partnerAddress: "   " };
    expect(fillTermsTokens("sediado em {{partnerAddress}}", semCadastro)).toBe("sediado em [a preencher]");
  });

  it("ignora marcador desconhecido em vez de apagar o trecho", () => {
    expect(fillTermsTokens("valor {{naoExiste}} fim", contextoBase)).toBe("valor {{naoExiste}} fim");
  });
});

describe("sectionApplies", () => {
  it("bloco comercial so aparece em parceria remunerada", () => {
    const bloco = { body: "", condition: "commercial" as const };
    expect(sectionApplies(bloco, contextoBase)).toBe(true);
    expect(sectionApplies(bloco, { ...contextoBase, isCommercial: false })).toBe(false);
  });

  it("bloco da vitrine so aparece para quem tem o direito", () => {
    const bloco = { body: "", condition: "public_showcase" as const };
    expect(sectionApplies(bloco, contextoBase)).toBe(false);
    expect(sectionApplies(bloco, { ...contextoBase, hasPublicShowcase: true })).toBe(true);
  });

  it("bloco sem condicao aparece sempre", () => {
    expect(sectionApplies({ body: "", condition: "always" }, contextoBase)).toBe(true);
    expect(
      sectionApplies({ body: "", condition: "always" }, {
        ...contextoBase,
        isCommercial: false,
        hasPublicShowcase: false,
      })
    ).toBe(true);
  });
});

describe("resolveTermsForPartner — modelo oficial", () => {
  it("parceiro remunerado sem vitrine ve o comissionamento e nao ve a vitrine", () => {
    const doc = resolveTermsForPartner(PARTNER_TERMS_TEMPLATE, contextoBase);
    const titulos = doc.sections.map((s) => s.title);
    expect(titulos).toContain("DA JORNADA, COMISSIONAMENTO E REGRAS FINANCEIRAS");
    expect(titulos).not.toContain("DA VITRINE PÚBLICA DE PARCEIROS OFICIAIS");
  });

  it("parceiro nao remunerado nao ve nenhuma clausula de comissao", () => {
    const doc = resolveTermsForPartner(PARTNER_TERMS_TEMPLATE, {
      ...contextoBase,
      isCommercial: false,
    });
    const textoInteiro = doc.sections.map((s) => `${s.title} ${s.body}`).join(" ");
    expect(textoInteiro).not.toContain("Comissionamento");
    expect(textoInteiro).not.toContain("Chargeback");
  });

  it("parceiro com vitrine ve o bloco da vitrine", () => {
    const doc = resolveTermsForPartner(PARTNER_TERMS_TEMPLATE, {
      ...contextoBase,
      hasPublicShowcase: true,
    });
    expect(doc.sections.map((s) => s.title)).toContain("DA VITRINE PÚBLICA DE PARCEIROS OFICIAIS");
  });

  it("nao sobra nenhum marcador no texto exibido", () => {
    const doc = resolveTermsForPartner(PARTNER_TERMS_TEMPLATE, {
      ...contextoBase,
      hasPublicShowcase: true,
    });
    const textoInteiro = [doc.title, doc.intro || "", ...doc.sections.map((s) => `${s.title} ${s.body}`)].join(" ");
    expect(textoInteiro).not.toMatch(/\{\{\s*(partnerName|partnerDocument|partnerAddress|partnerMatricula|commissionPercent)\s*\}\}/);
  });

  it("o modelo nasce despublicado — publicar e ato do admin", () => {
    expect(PARTNER_TERMS_TEMPLATE.published).toBe(false);
  });

  it("todos os aceites do modelo sao obrigatorios e tem id unico", () => {
    const ids = PARTNER_TERMS_TEMPLATE.acceptances.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    PARTNER_TERMS_TEMPLATE.acceptances.forEach((a) => expect(a.required).toBe(true));
  });
});
