import { describe, it, expect } from "vitest";
import { DEFAULT_EVENT_TYPES, CONSULTOR_PADRAO } from "@/types/calendar-event-types";
import { normalizeEventTitle, resolveEventTypeByTitle } from "@/lib/calendar/event-title";

/**
 * O casamento titulo-do-Google -> tipo e a fundacao da Etapa 3. Se ele errar, o
 * evento entra sem tipo (visivel no admin) ou, pior, com o tipo errado.
 *
 * Titulos reais levantados da agenda de producao (2026-07-18, reconferidos em
 * 2026-08-03). O teste exercita a funcao REAL (`resolveEventTypeByTitle`), a mesma que
 * o sync usa — antes havia uma copia da normalizacao aqui dentro, e copia diverge por
 * construcao.
 */

const resolver = (titulo: string | null) =>
  resolveEventTypeByTitle(titulo, DEFAULT_EVENT_TYPES)?.id ?? null;

describe("lista fechada de tipos de evento", () => {
  it("tem exatamente os 5 tipos aprovados (revisao da Gestora em 2026-08-03: 3 -> 5)", () => {
    expect(DEFAULT_EVENT_TYPES.map((t) => t.id)).toEqual([
      "1-to-1",
      "consultoria-individual",
      "consultoria-em-grupo",
      "onboarding",
      "offboarding",
    ]);
  });

  it("Onboarding e Offboarding tem titulo PROPRIO, nao sao servidos pelo tipo de grupo", () => {
    // Correcao da Gestora: sao sessoes em grupo, mas cada uma se chama pelo proprio
    // nome — nao entram no `atende` do `Consultoria em Grupo`.
    const titulo = (id: string) => DEFAULT_EVENT_TYPES.find((t) => t.id === id)?.googleTitle;
    expect(titulo("onboarding")).toBe("Onboarding");
    expect(titulo("offboarding")).toBe("Offboarding");
    expect(titulo("consultoria-em-grupo")).toBe("Consultoria em Grupo");
  });

  it("nenhum googleTitle se repete — titulo duplicado tornaria o tipoId ambiguo", () => {
    const chaves = DEFAULT_EVENT_TYPES.map((t) => normalizeEventTitle(t.googleTitle));
    expect(new Set(chaves).size).toBe(chaves.length);
  });

  it("consultor padrao nasce preenchido (reverte a decisao de 8.2, a pedido da Gestora)", () => {
    // Era "a definir" para criar fila de trabalho visivel. Hoje o padrao nao e
    // inventado — a atribuicao por ocorrencia segue disponivel no admin.
    expect(CONSULTOR_PADRAO).toBe("Lisandra Lencina");
    for (const t of DEFAULT_EVENT_TYPES) {
      expect(t.consultorPadrao).toBe(CONSULTOR_PADRAO);
    }
  });

  it("vagas padrao aprovadas pela Gestora: 1 / 1 / 10 / 10 / 10", () => {
    const vagas = (id: string) => DEFAULT_EVENT_TYPES.find((t) => t.id === id)?.vagasPadrao;
    expect(vagas("1-to-1")).toBe(1);
    expect(vagas("consultoria-individual")).toBe(1);
    expect(vagas("consultoria-em-grupo")).toBe(10);
    expect(vagas("onboarding")).toBe(10);
    expect(vagas("offboarding")).toBe(10);
  });
});

describe("resolucao do tipo pelo titulo do Google", () => {
  it("casa os 5 titulos genericos da lista fechada", () => {
    expect(resolver("1 to 1")).toBe("1-to-1");
    expect(resolver("Consultoria Individual")).toBe("consultoria-individual");
    expect(resolver("Consultoria em Grupo")).toBe("consultoria-em-grupo");
    expect(resolver("Onboarding")).toBe("onboarding");
    expect(resolver("Offboarding")).toBe("offboarding");
  });

  it("tolera variacao de caixa, acento e espaco em volta", () => {
    expect(resolver("  consultoria individual  ")).toBe("consultoria-individual");
    expect(resolver("CONSULTORIA EM GRUPO")).toBe("consultoria-em-grupo");
    expect(resolver("ONBOARDING")).toBe("onboarding");
  });

  it("NAO casa os titulos APOSENTADOS — eles seguem no mecanismo atual", () => {
    // Enquanto nao migrados, continuam servindo membros pelo casamento por
    // palavra-chave. Casar aqui seria mexer em quem ainda nao devia ser mexido.
    for (const antigo of [
      "Devolutiva Analise Comportamental",
      "Consultoria Plano de Carreira",
      "MentoCoach",
      "Feedback Posicionamento de Carreira",
      "Orientação em Grupo",
      "Onboarding de Parceiros",
    ]) {
      expect(resolver(antigo)).toBeNull();
    }
  });

  it("'Onboarding' passou a casar de proposito — a agenda ja usa esse titulo", () => {
    // Mudanca de 2026-08-03: antes estava na lista de aposentados. Com o tipo proprio
    // criado, os eventos de Onboarding que ja existem no Google passam a ser
    // classificados. "Onboarding de Parceiros" continua fora (nao e jornada de membro).
    expect(resolver("Onboarding")).toBe("onboarding");
    expect(resolver("Onboarding de Parceiros")).toBeNull();
  });

  it("nao confunde 'Orientação em Grupo' (antigo) com 'Consultoria em Grupo' (novo)", () => {
    // Os dois coexistem hoje na agenda; casar errado misturaria as sessoes.
    expect(resolver("Orientação em Grupo")).toBeNull();
    expect(resolver("Consultoria em Grupo")).toBe("consultoria-em-grupo");
  });

  it("bloqueio e titulo vazio nao viram tipo", () => {
    expect(resolver("Bloqueado")).toBeNull();
    expect(resolver("")).toBeNull();
    expect(resolver(null)).toBeNull();
  });
});
