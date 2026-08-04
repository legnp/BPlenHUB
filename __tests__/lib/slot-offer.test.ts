import { describe, it, expect } from "vitest";
import { resolveSlotType, slotServesStage, resolveSlotCapacity } from "@/lib/calendar/slot-offer";
import type { CalendarEventType } from "@/types/calendar-event-types";

/**
 * Oferta de slot por IDENTIFICADOR (Fase 3.3). Substitui o casamento por palavra-chave,
 * que morreu quando os titulos do Google viraram genericos: a parada "1a Sessao de
 * MentoCoach" procurava "mentocoach" no titulo, e o evento agora se chama
 * "Consultoria Individual".
 */

const TIPOS: CalendarEventType[] = [
  { id: "1-to-1", label: "1 to 1", googleTitle: "1 to 1", consultorPadrao: "a definir", vagasPadrao: 1, atende: [] },
  { id: "consultoria-individual", label: "Consultoria Individual", googleTitle: "Consultoria Individual", consultorPadrao: "a definir", vagasPadrao: 1, atende: ["BPL-002", "BPL-003", "BPL-001", "BPL-005"] },
  { id: "consultoria-em-grupo", label: "Consultoria em Grupo", googleTitle: "Consultoria em Grupo", consultorPadrao: "a definir", vagasPadrao: 10, atende: ["BPL-004"] },
  { id: "onboarding", label: "Onboarding", googleTitle: "Onboarding", consultorPadrao: "a definir", vagasPadrao: 10, atende: ["BPL-000"] },
  { id: "offboarding", label: "Offboarding", googleTitle: "Offboarding", consultorPadrao: "a definir", vagasPadrao: 10, atende: ["BPL-006"] },
];

describe("slotServesStage — quais horarios aparecem na parada", () => {
  it("Consultoria Individual serve as quatro trilhas individuais (polivalencia intencional)", () => {
    const slot = { tipoId: "consultoria-individual" };
    for (const servico of ["BPL-001", "BPL-002", "BPL-003", "BPL-005"]) {
      expect(slotServesStage(slot, TIPOS, servico)).toBe(true);
    }
  });

  it("Consultoria Individual NAO serve o GDC nem o Onboarding", () => {
    const slot = { tipoId: "consultoria-individual" };
    expect(slotServesStage(slot, TIPOS, "BPL-004")).toBe(false);
    expect(slotServesStage(slot, TIPOS, "BPL-000")).toBe(false);
  });

  it("Consultoria em Grupo serve so o GDC", () => {
    const slot = { tipoId: "consultoria-em-grupo" };
    expect(slotServesStage(slot, TIPOS, "BPL-004")).toBe(true);
    expect(slotServesStage(slot, TIPOS, "BPL-005")).toBe(false);
  });

  it("Onboarding e Offboarding servem so o proprio servico", () => {
    expect(slotServesStage({ tipoId: "onboarding" }, TIPOS, "BPL-000")).toBe(true);
    expect(slotServesStage({ tipoId: "onboarding" }, TIPOS, "BPL-006")).toBe(false);
    expect(slotServesStage({ tipoId: "offboarding" }, TIPOS, "BPL-006")).toBe(true);
  });

  it("o 1 to 1 avulso nao serve trilha nenhuma — `atende` vazio e decisao da Gestora", () => {
    for (const servico of ["BPL-000", "BPL-001", "BPL-002", "BPL-003", "BPL-004", "BPL-005", "BPL-006"]) {
      expect(slotServesStage({ tipoId: "1-to-1" }, TIPOS, servico)).toBe(false);
    }
  });

  it("evento sem tipo (modelo antigo) nao decide por aqui — cai no fallback textual", () => {
    expect(slotServesStage({ tipoId: null }, TIPOS, "BPL-005")).toBe(false);
    expect(slotServesStage({}, TIPOS, "BPL-005")).toBe(false);
  });

  it("etapa sem serviceCode sincronizado tambem cai no fallback", () => {
    expect(slotServesStage({ tipoId: "consultoria-individual" }, TIPOS, undefined)).toBe(false);
  });

  it("resolveSlotType devolve o tipo configurado, ou null", () => {
    expect(resolveSlotType({ tipoId: "onboarding" }, TIPOS)?.label).toBe("Onboarding");
    expect(resolveSlotType({ tipoId: "inexistente" }, TIPOS)).toBeNull();
  });
});

describe("resolveSlotCapacity — vaga vem do tipo, nao mais do corpo do evento", () => {
  const tipo = (id: string) => TIPOS.find((t) => t.id === id) ?? null;

  it("usa o vagasPadrao do tipo", () => {
    expect(resolveSlotCapacity(tipo("consultoria-individual"), 0)).toBe(1);
    expect(resolveSlotCapacity(tipo("consultoria-em-grupo"), 0)).toBe(10);
  });

  it("o tipo tem precedencia sobre a descricao legada", () => {
    expect(resolveSlotCapacity(tipo("consultoria-individual"), 99)).toBe(1);
  });

  it("evento sem tipo cai na descricao — comportamento legado preservado", () => {
    expect(resolveSlotCapacity(null, 7)).toBe(7);
  });

  it("sem tipo e sem descricao devolve 0 (bloqueio de agenda)", () => {
    // 0 significa ILIMITADO no guard do agendamento — por isso o bloqueio depende do
    // `isBlockerEvent`, e por isso um slot real jamais pode cair aqui por acidente.
    expect(resolveSlotCapacity(null, 0)).toBe(0);
    expect(resolveSlotCapacity(null, Number.NaN)).toBe(0);
  });
});
