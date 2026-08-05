import { describe, it, expect } from "vitest";
import {
  eventServesAudience,
  eventTypeAudience,
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

const TYPES: CalendarEventType[] = [
  tipo({ id: "1-to-1" }),
  tipo({ id: "onboarding" }),
  tipo({
    id: "parceiro",
    audience: "partner",
    demandOptions: ["Acompanhamento Geral", "Dúvidas sobre Formalização"],
  }),
  tipo({ id: "onboarding-parceiro", audience: "partner" }),
];

const LEGACY_ONE_TO_ONE = ["Alinhamento Estratégico", "Revisão de Currículo"];

describe("audiencia do tipo de evento", () => {
  it("trata tipo sem audiencia declarada como de membro", () => {
    expect(eventTypeAudience(tipo({ id: "onboarding" }))).toBe("member");
    expect(eventTypeAudience(tipo({ id: "x", audience: "member" }))).toBe("member");
    expect(eventTypeAudience(tipo({ id: "y", audience: "partner" }))).toBe("partner");
  });

  it("lista os ids de cada audiencia", () => {
    expect(eventTypeIdsForAudience(TYPES, "partner")).toEqual(["parceiro", "onboarding-parceiro"]);
    expect(eventTypeIdsForAudience(TYPES, "member")).toEqual(["1-to-1", "onboarding"]);
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

  it("separa as duas agendas por tipo", () => {
    expect(eventServesAudience({ tipoId: "parceiro" }, TYPES, "partner")).toBe(true);
    expect(eventServesAudience({ tipoId: "parceiro" }, TYPES, "member")).toBe(false);
    expect(eventServesAudience({ tipoId: "1-to-1" }, TYPES, "member")).toBe(true);
    expect(eventServesAudience({ tipoId: "1-to-1" }, TYPES, "partner")).toBe(false);
  });

  it("trata tipo desconhecido como de membro (nunca some da agenda de quem ja via)", () => {
    expect(eventServesAudience({ tipoId: "tipo-que-nao-existe" }, TYPES, "member")).toBe(true);
  });
});

describe("resolveSessionDemands", () => {
  it("usa a lista propria do tipo quando existe", () => {
    expect(resolveSessionDemands({ tipoId: "parceiro" }, TYPES, LEGACY_ONE_TO_ONE)).toEqual([
      "Acompanhamento Geral",
      "Dúvidas sobre Formalização",
    ]);
  });

  it("mantem a lista global legada para o 1 to 1 (comportamento de hoje)", () => {
    expect(resolveSessionDemands({ tipoId: "1-to-1" }, TYPES, LEGACY_ONE_TO_ONE)).toEqual(LEGACY_ONE_TO_ONE);
  });

  it("reconhece o 1 to 1 legado pelo titulo, sem tipoId", () => {
    expect(resolveSessionDemands({ summary: "1 to 1 com a Lis" }, TYPES, LEGACY_ONE_TO_ONE)).toEqual(
      LEGACY_ONE_TO_ONE
    );
  });

  it("nao pergunta motivo em tipo que nao declara lista", () => {
    expect(resolveSessionDemands({ tipoId: "onboarding" }, TYPES, LEGACY_ONE_TO_ONE)).toEqual([]);
    expect(resolveSessionDemands({ tipoId: "onboarding-parceiro" }, TYPES, LEGACY_ONE_TO_ONE)).toEqual([]);
    expect(resolveSessionDemands(null, TYPES, LEGACY_ONE_TO_ONE)).toEqual([]);
  });
});
