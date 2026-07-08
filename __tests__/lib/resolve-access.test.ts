import { describe, it, expect } from "vitest";
import {
  resolverAcesso,
  type ServicoAcesso,
  type UsuarioAcesso,
} from "@/lib/access/resolve-access";

/**
 * Motor de acesso (Fase B / B1) — funcao pura.
 * As tabelas abaixo espelham a jornada canonica aprovada em
 * `docs/system-audit/ACCESS-MODEL-DESIGN.md` secoes 3 e 3.1.
 */

/** Catalogo real, como a aba `Atributos` do portfolio_bplen.xlsx o descreve. */
const CATALOGO: Record<string, ServicoAcesso> = {
  posicionamento: { serviceCode: "BPL-001", escopo: "public" },
  onboarding: { serviceCode: "BPL-000", escopo: "member" },
  analise: { serviceCode: "BPL-002", escopo: "member" },
  plano: {
    serviceCode: "BPL-003",
    escopo: "member",
    preRequisitos: { modo: "todos", etapas: ["BPL-002"] },
  },
  gdc: {
    serviceCode: "BPL-004",
    escopo: "member",
    preRequisitos: { modo: "todos", etapas: ["BPL-003"] },
  },
  mentocoach: { serviceCode: "BPL-005", escopo: "member" },
  offboarding: {
    serviceCode: "BPL-006",
    escopo: "member",
    preRequisitos: { modo: "qualquer", etapas: ["BPL-004", "BPL-005"] },
  },
};

function usuario(patch: Partial<UsuarioAcesso> = {}): UsuarioAcesso {
  return {
    selo: true,
    entitlements: [],
    conclusoes: [],
    dispensaPreRequisito: [],
    ...patch,
  };
}

describe("resolverAcesso — regra 1: escopo", () => {
  it("servico `member` sem selo cai em PREVIA", () => {
    const u = usuario({ selo: false, entitlements: ["BPL-002"] });
    expect(resolverAcesso(u, CATALOGO.analise).resultado).toBe("PREVIA");
  });

  it("PREVIA vence entitlement: selo revogado expulsa do clube mesmo de servico possuido (BUG-035)", () => {
    const u = usuario({ selo: false, entitlements: ["BPL-002"], conclusoes: ["BPL-002"] });
    expect(resolverAcesso(u, CATALOGO.analise).resultado).toBe("PREVIA");
  });

  it("sem selo E sem entitlement num servico `member`: PREVIA, nunca UPSELL", () => {
    // Caso discriminante da ORDEM das regras: se o entitlement fosse avaliado antes
    // do escopo, este usuario receberia UPSELL — ofertando a um nao-membro um servico
    // que ele nem pode acessar. O nao-membro tem de ver a trilha como previa.
    const u = usuario({ selo: false, entitlements: [] });
    expect(resolverAcesso(u, CATALOGO.analise).resultado).toBe("PREVIA");
  });

  it("servico `public` nao exige selo", () => {
    const u = usuario({ selo: false, entitlements: ["BPL-001"] });
    expect(resolverAcesso(u, CATALOGO.posicionamento).resultado).toBe("LIBERADO");
  });

  it("escopo ausente nao bloqueia (estado pre-sincronizacao da aba Atributos)", () => {
    const u = usuario({ selo: false, entitlements: ["BPL-XXX"] });
    expect(resolverAcesso(u, { serviceCode: "BPL-XXX" }).resultado).toBe("LIBERADO");
  });
});

describe("resolverAcesso — regra 2: entitlement", () => {
  it("membro com selo que nao possui o servico recebe UPSELL", () => {
    const u = usuario({ entitlements: [] });
    expect(resolverAcesso(u, CATALOGO.mentocoach).resultado).toBe("UPSELL");
  });

  it("nao-membro que nao possui um servico publico recebe UPSELL (nao PREVIA)", () => {
    const u = usuario({ selo: false, entitlements: [] });
    expect(resolverAcesso(u, CATALOGO.posicionamento).resultado).toBe("UPSELL");
  });

  it("possuir o servico nao basta se o pre-requisito nao foi cumprido", () => {
    const u = usuario({ entitlements: ["BPL-003"] });
    expect(resolverAcesso(u, CATALOGO.plano).resultado).toBe("SEQUENCE_LOCK");
  });
});

describe("resolverAcesso — regra 3: pre-requisito", () => {
  it("modo `nenhum` libera direto", () => {
    const u = usuario({ entitlements: ["BPL-002"] });
    expect(resolverAcesso(u, CATALOGO.analise).resultado).toBe("LIBERADO");
  });

  it("preRequisitos ausente equivale a modo `nenhum`", () => {
    const u = usuario({ entitlements: ["BPL-005"] });
    expect(resolverAcesso(u, CATALOGO.mentocoach).resultado).toBe("LIBERADO");
  });

  it("modo `todos`: libera quando todas as etapas foram concluidas", () => {
    const u = usuario({ entitlements: ["BPL-003"], conclusoes: ["BPL-002"] });
    expect(resolverAcesso(u, CATALOGO.plano).resultado).toBe("LIBERADO");
  });

  it("modo `todos`: SEQUENCE_LOCK reporta exatamente o que falta", () => {
    const servico: ServicoAcesso = {
      serviceCode: "BPL-999",
      escopo: "member",
      preRequisitos: { modo: "todos", etapas: ["BPL-002", "BPL-003"] },
    };
    const u = usuario({ entitlements: ["BPL-999"], conclusoes: ["BPL-002"] });
    const decisao = resolverAcesso(u, servico);
    expect(decisao.resultado).toBe("SEQUENCE_LOCK");
    expect(decisao.pendentes).toEqual(["BPL-003"]);
  });

  it("modo `qualquer`: uma etapa concluida basta (offboarding via GDC)", () => {
    const u = usuario({ entitlements: ["BPL-006"], conclusoes: ["BPL-004"] });
    expect(resolverAcesso(u, CATALOGO.offboarding).resultado).toBe("LIBERADO");
  });

  it("modo `qualquer`: a outra alternativa tambem basta (offboarding via MentoCoach)", () => {
    const u = usuario({ entitlements: ["BPL-006"], conclusoes: ["BPL-005"] });
    expect(resolverAcesso(u, CATALOGO.offboarding).resultado).toBe("LIBERADO");
  });

  it("modo `qualquer`: nenhuma concluida trava e lista as alternativas", () => {
    const u = usuario({ entitlements: ["BPL-006"], conclusoes: ["BPL-002"] });
    const decisao = resolverAcesso(u, CATALOGO.offboarding);
    expect(decisao.resultado).toBe("SEQUENCE_LOCK");
    expect(decisao.pendentes).toEqual(["BPL-004", "BPL-005"]);
  });

  it("`etapas` vazio nao exige nada, qualquer que seja o modo", () => {
    const u = usuario({ entitlements: ["BPL-777"] });
    for (const modo of ["todos", "qualquer"] as const) {
      const servico: ServicoAcesso = { serviceCode: "BPL-777", preRequisitos: { modo, etapas: [] } };
      expect(resolverAcesso(u, servico).resultado).toBe("LIBERADO");
    }
  });
});

describe("resolverAcesso — dispensa de pre-requisito (Fase A / A3)", () => {
  it("dispensa pula o pre-requisito nao cumprido", () => {
    const u = usuario({ entitlements: ["BPL-003"], dispensaPreRequisito: ["BPL-003"] });
    expect(resolverAcesso(u, CATALOGO.plano).resultado).toBe("LIBERADO");
  });

  it("dispensa e' por servico: dispensar BPL-004 nao libera BPL-003", () => {
    const u = usuario({ entitlements: ["BPL-003"], dispensaPreRequisito: ["BPL-004"] });
    expect(resolverAcesso(u, CATALOGO.plano).resultado).toBe("SEQUENCE_LOCK");
  });

  it("dispensa NAO substitui o entitlement — sem possuir o servico, ainda e' UPSELL", () => {
    const u = usuario({ entitlements: [], dispensaPreRequisito: ["BPL-003"] });
    expect(resolverAcesso(u, CATALOGO.plano).resultado).toBe("UPSELL");
  });

  it("dispensa NAO substitui o selo — sem selo, ainda e' PREVIA", () => {
    const u = usuario({ selo: false, entitlements: ["BPL-003"], dispensaPreRequisito: ["BPL-003"] });
    expect(resolverAcesso(u, CATALOGO.plano).resultado).toBe("PREVIA");
  });
});

describe("resolverAcesso — normalizacao de serviceCode", () => {
  it("comparacao e' case-insensitive e ignora espacos em volta", () => {
    const u = usuario({
      entitlements: [" bpl-003 "],
      conclusoes: ["bpl-002"],
      dispensaPreRequisito: [],
    });
    expect(resolverAcesso(u, CATALOGO.plano).resultado).toBe("LIBERADO");
  });

  it("pendentes saem normalizados em caixa alta", () => {
    const servico: ServicoAcesso = {
      serviceCode: "bpl-003",
      preRequisitos: { modo: "todos", etapas: ["bpl-002"] },
    };
    const u = usuario({ entitlements: ["BPL-003"] });
    expect(resolverAcesso(u, servico).pendentes).toEqual(["BPL-002"]);
  });

  it("entrada com string vazia ou duplicada nao quebra a decisao", () => {
    const servico: ServicoAcesso = {
      serviceCode: "BPL-003",
      preRequisitos: { modo: "todos", etapas: ["BPL-002", "BPL-002", "", "  "] },
    };
    const u = usuario({ entitlements: ["BPL-003", "BPL-003", ""], conclusoes: ["BPL-002"] });
    expect(resolverAcesso(u, servico).resultado).toBe("LIBERADO");
  });
});

describe("resolverAcesso — jornada canonica ponta-a-ponta", () => {
  it("lead sem selo: posicionamento acionavel, restante em previa (secao 5 do design)", () => {
    const lead = usuario({ selo: false, entitlements: ["BPL-001"] });

    expect(resolverAcesso(lead, CATALOGO.posicionamento).resultado).toBe("LIBERADO");
    for (const etapa of [CATALOGO.onboarding, CATALOGO.analise, CATALOGO.plano, CATALOGO.gdc, CATALOGO.mentocoach, CATALOGO.offboarding]) {
      expect(resolverAcesso(lead, etapa).resultado).toBe("PREVIA");
    }
  });

  it("membro do pacote Senior progride analise -> plano -> GDC na ordem correta", () => {
    // Pacote Senior (BPL-PAC-SR) libera BPL-001, BPL-002, BPL-003 e concede o selo.
    const entitlements = ["BPL-001", "BPL-002", "BPL-003"];

    const recemComprado = usuario({ entitlements });
    expect(resolverAcesso(recemComprado, CATALOGO.analise).resultado).toBe("LIBERADO");
    expect(resolverAcesso(recemComprado, CATALOGO.plano).resultado).toBe("SEQUENCE_LOCK");
    expect(resolverAcesso(recemComprado, CATALOGO.gdc).resultado).toBe("UPSELL");

    const analiseFeita = usuario({ entitlements, conclusoes: ["BPL-002"] });
    expect(resolverAcesso(analiseFeita, CATALOGO.plano).resultado).toBe("LIBERADO");

    const planoFeito = usuario({ entitlements, conclusoes: ["BPL-002", "BPL-003"] });
    // GDC segue em UPSELL: o pacote Senior nao o libera, apesar do pre-requisito cumprido.
    expect(resolverAcesso(planoFeito, CATALOGO.gdc).resultado).toBe("UPSELL");

    const comGdc = usuario({ entitlements: [...entitlements, "BPL-004"], conclusoes: ["BPL-002", "BPL-003"] });
    expect(resolverAcesso(comGdc, CATALOGO.gdc).resultado).toBe("LIBERADO");
  });

  it("compra avulsa de MentoCoach da acesso direto, sem cadeia de pre-requisito", () => {
    const u = usuario({ entitlements: ["BPL-005"] });
    expect(resolverAcesso(u, CATALOGO.mentocoach).resultado).toBe("LIBERADO");
  });

  it("onboarding nao tem pre-requisito, mas exige o selo", () => {
    expect(resolverAcesso(usuario({ entitlements: ["BPL-000"] }), CATALOGO.onboarding).resultado).toBe("LIBERADO");
    expect(resolverAcesso(usuario({ selo: false, entitlements: ["BPL-000"] }), CATALOGO.onboarding).resultado).toBe("PREVIA");
  });
});
