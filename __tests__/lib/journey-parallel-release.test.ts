import { describe, it, expect } from "vitest";
import { resolveStageAccess, type JourneyAccessContext } from "@/lib/access/journey-adapter";
import type { JourneyStep } from "@/types/journey";

/**
 * Fase C — liberação relativa ao pacote (ACCESS-MODEL-DESIGN.md §10).
 *
 * Cenário-base = o Pacote Embaixador real do `BP-005-PF-260523`: trilha
 * principal (Onboarding, Análise, Plano, GDC) + os dois paralelos
 * (Posicionamento, MentoCoach) + Offboarding.
 */
const stage = (patch: Partial<JourneyStep>): JourneyStep =>
  ({ id: "x", order: 1, title: "X", icon: "Target", description: "", substeps: [], ...patch }) as JourneyStep;

const ONBOARDING = stage({ id: "onboarding", serviceCode: "BPL-000", escopo: "member", preRequisitos: { modo: "nenhum", etapas: [] } });
const ANALISE = stage({ id: "analise-comportamental", serviceCode: "BPL-002", escopo: "member", preRequisitos: { modo: "todos", etapas: ["BPL-000"] } });
const PLANO = stage({ id: "plano-de-carreira", serviceCode: "BPL-003", escopo: "member", preRequisitos: { modo: "todos", etapas: ["BPL-000", "BPL-002"] } });
const GDC = stage({ id: "gestao-e-desenvolvimento", serviceCode: "BPL-004", escopo: "member", preRequisitos: { modo: "todos", etapas: ["BPL-000", "BPL-003"] } });
// Os dois paralelos, ja com o modo novo:
const POSICIONAMENTO = stage({ id: "posicionamento-profissional", serviceCode: "BPL-001", escopo: "public", preRequisitos: { modo: "apos_contratadas", etapas: [] } });
const MENTOCOACH = stage({ id: "mentocoach", serviceCode: "BPL-005", escopo: "member", preRequisitos: { modo: "apos_contratadas", etapas: [] } });
// Offboarding depende de um paralelo (BPL-005) — nao pode entrar no conjunto de espera.
const OFFBOARDING = stage({ id: "offboarding", serviceCode: "BPL-006", escopo: "member", preRequisitos: { modo: "qualquer", etapas: ["BPL-004", "BPL-005"] } });

const TODAS = [ONBOARDING, ANALISE, PLANO, GDC, POSICIONAMENTO, MENTOCOACH, OFFBOARDING];

/** Monta o ctx a partir do que o membro POSSUI e do que ele JA CONCLUIU. */
function ctx(possui: string[], conclusoes: string[], dispensa: string[] = []): JourneyAccessContext {
  return {
    selo: true,
    legacyEntitled: true,
    conclusoes,
    dispensaPreRequisito: dispensa,
    etapasDoMembro: TODAS.map(s => ({
      serviceCode: s.serviceCode,
      preRequisitos: s.preRequisitos,
      entitled: possui.includes(s.serviceCode as string),
    })),
  };
}

const PACOTE_EMBAIXADOR = ["BPL-000", "BPL-001", "BPL-002", "BPL-003", "BPL-004", "BPL-005"];

describe("Fase C — contratado em PACOTE espera a trilha principal", () => {
  it("estado real do BP-005: trilha incompleta trava os dois paralelos", () => {
    // Onboarding e Analise concluidos; Plano em andamento; GDC nao iniciada.
    const c = ctx(PACOTE_EMBAIXADOR, ["BPL-000", "BPL-002"]);

    const mento = resolveStageAccess(MENTOCOACH, c)!;
    expect(mento.isSequenceLocked).toBe(true);
    expect(mento.decisao.pendentes.sort()).toEqual(["BPL-003", "BPL-004"]);

    const posic = resolveStageAccess(POSICIONAMENTO, c)!;
    expect(posic.isSequenceLocked).toBe(true);
    expect(posic.decisao.pendentes.sort()).toEqual(["BPL-003", "BPL-004"]);
  });

  it("concluida a ULTIMA etapa da trilha, os dois abrem juntos", () => {
    const c = ctx(PACOTE_EMBAIXADOR, ["BPL-000", "BPL-002", "BPL-003", "BPL-004"]);
    expect(resolveStageAccess(MENTOCOACH, c)!.isSequenceLocked).toBe(false);
    expect(resolveStageAccess(POSICIONAMENTO, c)!.isSequenceLocked).toBe(false);
  });

  it("faltando so a ultima da trilha, ainda travam", () => {
    const c = ctx(PACOTE_EMBAIXADOR, ["BPL-000", "BPL-002", "BPL-003"]);
    expect(resolveStageAccess(MENTOCOACH, c)!.decisao.pendentes).toEqual(["BPL-004"]);
  });

  it("pacote MENOR: espera so o que ELE contratou, nao a trilha inteira", () => {
    // Pacote que vai ate a Analise Comportamental. Nao ha Plano nem GDC contratados,
    // entao nao ha o que esperar alem da Analise — e' o ponto que a lista fixa da
    // planilha nao conseguiria expressar.
    const c = ctx(["BPL-000", "BPL-002", "BPL-005"], ["BPL-000", "BPL-002"]);
    expect(resolveStageAccess(MENTOCOACH, c)!.isSequenceLocked).toBe(false);
  });

  it("pacote MENOR com a trilha dele incompleta trava", () => {
    const c = ctx(["BPL-000", "BPL-002", "BPL-005"], ["BPL-000"]);
    expect(resolveStageAccess(MENTOCOACH, c)!.decisao.pendentes).toEqual(["BPL-002"]);
  });
});

describe("Fase C — deadlock", () => {
  it("os dois paralelos NAO esperam um pelo outro", () => {
    // Sem a exclusao mutua, BPL-001 esperaria BPL-005 e vice-versa: nenhum abriria
    // jamais, nem apos a trilha inteira.
    const c = ctx(PACOTE_EMBAIXADOR, ["BPL-000", "BPL-002", "BPL-003", "BPL-004"]);
    expect(resolveStageAccess(MENTOCOACH, c)!.decisao.pendentes).not.toContain("BPL-001");
    expect(resolveStageAccess(POSICIONAMENTO, c)!.decisao.pendentes).not.toContain("BPL-005");
  });

  it("o Offboarding NAO entra no conjunto de espera (ele depende de um paralelo)", () => {
    // Offboarding exige BPL-005; se ele contasse, o MentoCoach esperaria o
    // Offboarding, que espera o MentoCoach. Excluido por DERIVACAO (cita um
    // paralelo no proprio pre-requisito), sem citar BPL-006 no codigo.
    const c = ctx([...PACOTE_EMBAIXADOR, "BPL-006"], ["BPL-000", "BPL-002", "BPL-003", "BPL-004"]);
    expect(resolveStageAccess(MENTOCOACH, c)!.decisao.pendentes).not.toContain("BPL-006");
    expect(resolveStageAccess(MENTOCOACH, c)!.isSequenceLocked).toBe(false);
  });
});

describe("Fase C — compra direta/avulsa se auto-satisfaz", () => {
  it("so o MentoCoach contratado: abre de imediato", () => {
    const c = ctx(["BPL-005"], []);
    expect(resolveStageAccess(MENTOCOACH, c)!.isSequenceLocked).toBe(false);
    expect(resolveStageAccess(MENTOCOACH, c)!.hasAccess).toBe(true);
  });

  it("MentoCoach + Onboarding ja concluido: abre", () => {
    const c = ctx(["BPL-000", "BPL-005"], ["BPL-000"]);
    expect(resolveStageAccess(MENTOCOACH, c)!.isSequenceLocked).toBe(false);
  });

  it("RESSALVA ACEITA: avulso comprado no meio da jornada trava — desbloqueio e' via admin", () => {
    // Membro ja na jornada compra o MentoCoach avulso. A derivacao nao distingue
    // procedencia (decisao da Gestora: sem campo novo), entao ele espera o resto.
    const c = ctx(["BPL-000", "BPL-002", "BPL-003", "BPL-005"], ["BPL-000"]);
    expect(resolveStageAccess(MENTOCOACH, c)!.isSequenceLocked).toBe(true);

    // A excecao do admin (dispensaPreRequisito) resolve o caso isolado.
    const comDispensa = ctx(["BPL-000", "BPL-002", "BPL-003", "BPL-005"], ["BPL-000"], ["BPL-005"]);
    expect(resolveStageAccess(MENTOCOACH, comDispensa)!.isSequenceLocked).toBe(false);
  });
});

describe("Fase C — a excecao e' do admin", () => {
  it("dispensa do admin libera o paralelo mesmo com a trilha incompleta", () => {
    const c = ctx(PACOTE_EMBAIXADOR, ["BPL-000"], ["BPL-005"]);
    expect(resolveStageAccess(MENTOCOACH, c)!.isSequenceLocked).toBe(false);
    // A dispensa e' POR SERVICO: nao vaza para o outro paralelo.
    expect(resolveStageAccess(POSICIONAMENTO, c)!.isSequenceLocked).toBe(true);
  });
});

describe("Fase C — invariantes preservadas", () => {
  it("selo revogado ainda expulsa do clube (a regra 1 do motor vence)", () => {
    // BUG-035: escopo vem antes de tudo. O modo novo nao pode furar isso.
    const c = { ...ctx(PACOTE_EMBAIXADOR, ["BPL-000", "BPL-002", "BPL-003", "BPL-004"]), selo: false };
    expect(resolveStageAccess(MENTOCOACH, c)!.hasAccess).toBe(false);
    expect(resolveStageAccess(MENTOCOACH, c)!.decisao.resultado).toBe("PREVIA");
  });

  it("nao possuir o servico continua sendo UPSELL, nao trava de sequencia", () => {
    const c = { ...ctx(PACOTE_EMBAIXADOR, []), legacyEntitled: false };
    expect(resolveStageAccess(MENTOCOACH, c)!.decisao.resultado).toBe("UPSELL");
  });

  it("etapas da trilha principal nao sao afetadas pelo modo novo", () => {
    const c = ctx(PACOTE_EMBAIXADOR, ["BPL-000"]);
    expect(resolveStageAccess(ANALISE, c)!.isSequenceLocked).toBe(false);
    expect(resolveStageAccess(PLANO, c)!.decisao.pendentes).toEqual(["BPL-002"]);
  });

  it("sem `etapasDoMembro` o modo nao trava ninguem (nao quebra chamador legado)", () => {
    const semContexto: JourneyAccessContext = {
      selo: true, legacyEntitled: true, conclusoes: [], dispensaPreRequisito: [],
    };
    expect(resolveStageAccess(MENTOCOACH, semContexto)!.isSequenceLocked).toBe(false);
  });
});
