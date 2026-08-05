import { describe, it, expect } from "vitest";
import {
  eventServesAudience,
  eventTypeAudiences,
  eventTypeIdsForAudience,
  resolveSessionDemands,
} from "@/lib/booking/session-demands";
import { CalendarEventType } from "@/types/calendar-event-types";

const tipo = (over: Partial<CalendarEventType> & { id: string }): CalendarEventType => ({
  label: over.id,
  googleTitle: over.id,
  consultorPadrao: "a definir",
  vagasPadrao: 1,
  atende: [],
  ...over,
});

/**
 * O `1-to-1` e' o caso central: grade UNICA, disputada por membro, parceiro e funil
 * publico, com lista de motivos propria por fluxo (decisao da Gestora, 2026-08-05).
 */
const TYPES: CalendarEventType[] = [
  tipo({
    id: "1-to-1",
    audiences: ["member", "partner"],
    partnerDemandOptions: ["Acompanhamento Geral", "Proposta de Colaboração"],
  }),
  tipo({ id: "onboarding" }),
  tipo({ id: "onboarding-parceiro", audiences: ["partner"] }),
];

const LEGACY_ONE_TO_ONE = ["Alinhamento Estratégico", "Revisão de Currículo"];

describe("audiencias do tipo de evento", () => {
  it("trata tipo sem audiencia declarada como de membro", () => {
    expect(eventTypeAudiences(tipo({ id: "onboarding" }))).toEqual(["member"]);
    expect(eventTypeAudiences(tipo({ id: "x", audiences: [] }))).toEqual(["member"]);
  });

  it("aceita tipo que serve as duas audiencias", () => {
    expect(eventTypeAudiences(tipo({ id: "1-to-1", audiences: ["member", "partner"] }))).toEqual([
      "member",
      "partner",
    ]);
  });

  it("lista os ids de cada audiencia, com o tipo compartilhado nas duas", () => {
    expect(eventTypeIdsForAudience(TYPES, "member")).toEqual(["1-to-1", "onboarding"]);
    expect(eventTypeIdsForAudience(TYPES, "partner")).toEqual(["1-to-1", "onboarding-parceiro"]);
  });
});

describe("eventServesAudience", () => {
  it("mantem na agenda de membro o evento legado, sem tipo", () => {
    expect(eventServesAudience({ summary: "1 to 1" }, TYPES, "member")).toBe(true);
    expect(eventServesAudience({ tipoId: null, summary: "Consultoria" }, TYPES, "member")).toBe(true);
  });

  it("nao oferece evento sem tipo na agenda de parceiro", () => {
    expect(eventServesAudience({ summary: "1 to 1" }, TYPES, "partner")).toBe(false);
  });

  it("oferece a MESMA grade de 1 to 1 para membro e parceiro", () => {
    expect(eventServesAudience({ tipoId: "1-to-1" }, TYPES, "member")).toBe(true);
    expect(eventServesAudience({ tipoId: "1-to-1" }, TYPES, "partner")).toBe(true);
  });

  it("mantem exclusivo o tipo que declara uma audiencia so", () => {
    expect(eventServesAudience({ tipoId: "onboarding-parceiro" }, TYPES, "partner")).toBe(true);
    expect(eventServesAudience({ tipoId: "onboarding-parceiro" }, TYPES, "member")).toBe(false);
    expect(eventServesAudience({ tipoId: "onboarding" }, TYPES, "member")).toBe(true);
    expect(eventServesAudience({ tipoId: "onboarding" }, TYPES, "partner")).toBe(false);
  });

  it("trata tipo desconhecido como de membro (nunca some da agenda de quem ja via)", () => {
    expect(eventServesAudience({ tipoId: "tipo-que-nao-existe" }, TYPES, "member")).toBe(true);
  });
});

describe("resolveSessionDemands", () => {
  it("da ao parceiro a lista dele no tipo compartilhado", () => {
    expect(resolveSessionDemands({ tipoId: "1-to-1" }, TYPES, LEGACY_ONE_TO_ONE, "partner")).toEqual([
      "Acompanhamento Geral",
      "Proposta de Colaboração",
    ]);
  });

  it("mantem a lista global legada para o membro no mesmo tipo", () => {
    expect(resolveSessionDemands({ tipoId: "1-to-1" }, TYPES, LEGACY_ONE_TO_ONE, "member")).toEqual(
      LEGACY_ONE_TO_ONE
    );
  });

  it("nao vaza a lista do membro para o parceiro quando ele nao tem lista propria", () => {
    const semListaDeParceiro = [tipo({ id: "1-to-1", audiences: ["member", "partner"] })];
    expect(
      resolveSessionDemands({ tipoId: "1-to-1" }, semListaDeParceiro, LEGACY_ONE_TO_ONE, "partner")
    ).toEqual([]);
  });

  it("reconhece o 1 to 1 legado pelo titulo no fluxo de membro", () => {
    expect(
      resolveSessionDemands({ summary: "1 to 1 com a Lis" }, TYPES, LEGACY_ONE_TO_ONE, "member")
    ).toEqual(LEGACY_ONE_TO_ONE);
  });

  it("assume membro quando a audiencia nao e informada (chamadas existentes)", () => {
    expect(resolveSessionDemands({ tipoId: "1-to-1" }, TYPES, LEGACY_ONE_TO_ONE)).toEqual(
      LEGACY_ONE_TO_ONE
    );
  });

  it("nao pergunta motivo em tipo que nao declara lista", () => {
    expect(resolveSessionDemands({ tipoId: "onboarding" }, TYPES, LEGACY_ONE_TO_ONE, "member")).toEqual([]);
    expect(resolveSessionDemands({ tipoId: "onboarding-parceiro" }, TYPES, LEGACY_ONE_TO_ONE, "partner")).toEqual([]);
    expect(resolveSessionDemands(null, TYPES, LEGACY_ONE_TO_ONE, "partner")).toEqual([]);
  });
});
