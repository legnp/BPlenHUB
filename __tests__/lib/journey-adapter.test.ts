import { describe, it, expect } from "vitest";
import { resolveStageAccess, conclusoesFromProgress } from "@/lib/access/journey-adapter";
import type { JourneyStep, JourneyProgress } from "@/types/journey";

/** Etapas como getJourneyStagesAction as devolve pos-Sync (atributos reais do §3.1). */
function stage(patch: Partial<JourneyStep>): JourneyStep {
  return {
    id: "x", order: 1, title: "X", icon: "Target", description: "", substeps: [],
    ...patch,
  } as JourneyStep;
}

const ANALISE = stage({ id: "analise-comportamental", serviceCode: "BPL-002", escopo: "member", preRequisitos: { modo: "nenhum", etapas: [] } });
const PLANO = stage({ id: "plano-de-carreira", serviceCode: "BPL-003", escopo: "member", preRequisitos: { modo: "todos", etapas: ["BPL-002"] } });
const OFFBOARDING = stage({ id: "offboarding", serviceCode: "BPL-006", escopo: "member", preRequisitos: { modo: "qualquer", etapas: ["BPL-004", "BPL-005"] } });
const POSICIONAMENTO = stage({ id: "posicionamento-profissional", serviceCode: "BPL-001", escopo: "public", preRequisitos: { modo: "nenhum", etapas: [] } });

const baseCtx = { selo: true, legacyEntitled: true, conclusoes: [] as string[], dispensaPreRequisito: [] as string[] };

describe("resolveStageAccess — fallback de transicao", () => {
  it("etapa sem serviceCode devolve null (mantem comportamento legado)", () => {
    expect(resolveStageAccess(stage({ preRequisitos: { modo: "nenhum", etapas: [] } }), baseCtx)).toBeNull();
  });

  it("etapa sem preRequisitos devolve null (aba Atributos ainda nao sincronizada)", () => {
    expect(resolveStageAccess(stage({ serviceCode: "BPL-002" }), baseCtx)).toBeNull();
  });
});

describe("resolveStageAccess — mapeamento motor -> telemetria", () => {
  it("LIBERADO -> hasAccess true, sem trava", () => {
    const d = resolveStageAccess(ANALISE, baseCtx);
    expect(d).toEqual(expect.objectContaining({ hasAccess: true, isSequenceLocked: false }));
    expect(d?.decisao.resultado).toBe("LIBERADO");
  });

  it("SEQUENCE_LOCK -> hasAccess true + trava (possui o servico, falta a ordem)", () => {
    const d = resolveStageAccess(PLANO, baseCtx);
    expect(d).toEqual(expect.objectContaining({ hasAccess: true, isSequenceLocked: true }));
    expect(d?.decisao.pendentes).toEqual(["BPL-002"]);
  });

  it("UPSELL -> hasAccess false (UI abre o modal de upsell, como no legado)", () => {
    const d = resolveStageAccess(ANALISE, { ...baseCtx, legacyEntitled: false });
    expect(d).toEqual(expect.objectContaining({ hasAccess: false, isSequenceLocked: false }));
    expect(d?.decisao.resultado).toBe("UPSELL");
  });

  it("PREVIA -> hasAccess false (lead sem selo em etapa member, mesmo entitled)", () => {
    const d = resolveStageAccess(ANALISE, { ...baseCtx, selo: false });
    expect(d?.decisao.resultado).toBe("PREVIA");
    expect(d?.hasAccess).toBe(false);
  });

  it("etapa public nao exige selo (junior acessa o posicionamento sem selo)", () => {
    const d = resolveStageAccess(POSICIONAMENTO, { ...baseCtx, selo: false });
    expect(d?.hasAccess).toBe(true);
  });
});

describe("resolveStageAccess — regras da jornada aprovada", () => {
  it("analise destrava SEM concluir o onboarding (mudanca aprovada vs. trava linear)", () => {
    const d = resolveStageAccess(ANALISE, { ...baseCtx, conclusoes: [] });
    expect(d?.isSequenceLocked).toBe(false);
  });

  it("plano libera com a analise concluida", () => {
    const d = resolveStageAccess(PLANO, { ...baseCtx, conclusoes: ["BPL-002"] });
    expect(d).toEqual(expect.objectContaining({ hasAccess: true, isSequenceLocked: false }));
  });

  it("dispensa do admin pula a trava do plano", () => {
    const d = resolveStageAccess(PLANO, { ...baseCtx, dispensaPreRequisito: ["BPL-003"] });
    expect(d?.isSequenceLocked).toBe(false);
  });

  it("offboarding: GDC OU mentocoach concluido libera; nenhum trava", () => {
    expect(resolveStageAccess(OFFBOARDING, { ...baseCtx, conclusoes: ["BPL-004"] })?.isSequenceLocked).toBe(false);
    expect(resolveStageAccess(OFFBOARDING, { ...baseCtx, conclusoes: ["BPL-005"] })?.isSequenceLocked).toBe(false);
    const travado = resolveStageAccess(OFFBOARDING, { ...baseCtx, conclusoes: ["BPL-002"] });
    expect(travado?.isSequenceLocked).toBe(true);
    expect(travado?.decisao.pendentes).toEqual(["BPL-004", "BPL-005"]);
  });
});

describe("conclusoesFromProgress", () => {
  const stages = [ANALISE, PLANO, OFFBOARDING];

  it("mapeia etapas 'completed' para serviceCode", () => {
    const progress = {
      matricula: "BP-001", lastActiveStepId: "x", overallProgress: 0,
      steps: {
        "analise-comportamental": { stepId: "analise-comportamental", status: "completed", completedSubSteps: [] },
        "plano-de-carreira": { stepId: "plano-de-carreira", status: "current", completedSubSteps: [] },
      },
    } as JourneyProgress;
    expect(conclusoesFromProgress(stages, progress)).toEqual(["BPL-002"]);
  });

  it("reconhece conclusao gravada em chave LEGADA (BUG-079)", () => {
    // Caso REAL da base (BP-005-PF-260523 / BP-011-PF-260526): a escrita resolve a
    // chave por normalizeString e grava na chave legada ja existente no documento.
    // A leitura crua por `stage.id` perdia a conclusao -> a etapa seguinte ficava
    // em SEQUENCE_LOCK permanente, sem erro nenhum.
    const progress = {
      matricula: "BP-005-PF-260523", lastActiveStepId: "x", overallProgress: 0,
      steps: {
        "analise-comportamental": { stepId: "analise-comportamental", status: "completed", completedSubSteps: [] },
        "plano_de_Carreira": { stepId: "plano_de_Carreira", status: "completed", completedSubSteps: [] },
      },
    } as unknown as JourneyProgress;
    expect(conclusoesFromProgress(stages, progress)).toEqual(["BPL-002", "BPL-003"]);
  });

  it("chave legada NAO concluida nao vira conclusao", () => {
    // Discriminante: garante que a tolerancia de chave nao afrouxou o status.
    const progress = {
      matricula: "BP-005-PF-260523", lastActiveStepId: "x", overallProgress: 0,
      steps: {
        "plano_de_Carreira": { stepId: "plano_de_Carreira", status: "current", completedSubSteps: [] },
      },
    } as unknown as JourneyProgress;
    expect(conclusoesFromProgress(stages, progress)).toEqual([]);
  });

  it("chave exata tem precedencia sobre a legada", () => {
    const progress = {
      matricula: "BP-001", lastActiveStepId: "x", overallProgress: 0,
      steps: {
        "plano-de-carreira": { stepId: "plano-de-carreira", status: "current", completedSubSteps: [] },
        "plano_de_Carreira": { stepId: "plano_de_Carreira", status: "completed", completedSubSteps: [] },
      },
    } as unknown as JourneyProgress;
    expect(conclusoesFromProgress(stages, progress)).toEqual([]);
  });

  it("chave sem etapa correspondente e' ignorada (ex.: 'Primeiros Passos' legado)", () => {
    const progress = {
      matricula: "BP-002-PF-260331", lastActiveStepId: "x", overallProgress: 0,
      steps: {
        "Primeiros Passos": { stepId: "Primeiros Passos", status: "completed", completedSubSteps: [] },
      },
    } as unknown as JourneyProgress;
    expect(conclusoesFromProgress(stages, progress)).toEqual([]);
  });

  it("progresso nulo -> vazio; etapa sem serviceCode e' ignorada", () => {
    expect(conclusoesFromProgress(stages, null)).toEqual([]);
    const semCodigo = [stage({ id: "legado" })];
    const progress = {
      matricula: "BP-001", lastActiveStepId: "x", overallProgress: 0,
      steps: { legado: { stepId: "legado", status: "completed", completedSubSteps: [] } },
    } as JourneyProgress;
    expect(conclusoesFromProgress(semCodigo, progress)).toEqual([]);
  });
});
