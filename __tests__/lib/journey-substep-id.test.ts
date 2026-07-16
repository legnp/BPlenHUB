import { describe, it, expect } from "vitest";
import type { DeliveryStep } from "@/types/products";

/**
 * Regra de identidade das paradas da jornada (journey.ts, modo deliverySteps).
 *
 * O id vem do dado; recalcular a partir de type+referenceId colapsava todas as
 * paradas que repetem o mesmo referenceId num id so. Como a conclusao e gravada
 * por id (`completedSubSteps`), concluir uma parada marcava todas as irmas.
 */
const resolveSubstepId = (step: Pick<DeliveryStep, "id" | "type" | "referenceId">) =>
  step.id || `ss-${step.type}-${step.referenceId}`;

/** Paradas do MentoCoach como o parser do portfolio as gera (dado real). */
const mentocoachSteps: Array<Pick<DeliveryStep, "id" | "type" | "referenceId" | "title">> = [
  { id: "ss-survey-disc", type: "survey", referenceId: "disc", title: "Análise Comportamental" },
  { id: "ss-meeting-devolutiva-analise-comportamental", type: "meeting", referenceId: "devolutiva-analise-comportamental", title: "Análise Comportamental" },
  { id: "ss-meeting-sessao-mentocoach-2", type: "meeting", referenceId: "sessao-mentocoach", title: "1ª Sessão de MentoCoach" },
  { id: "ss-meeting-sessao-mentocoach-3", type: "meeting", referenceId: "sessao-mentocoach", title: "2ª Sessão de MentoCoach" },
  { id: "ss-meeting-sessao-mentocoach-4", type: "meeting", referenceId: "sessao-mentocoach", title: "3ª Sessão de MentoCoach" }
];

describe("identidade das paradas — id vem do dado", () => {
  it("paradas que repetem o referenceId tem ids distintos", () => {
    const ids = mentocoachSteps.map(resolveSubstepId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("concluir uma sessao NAO marca as irmas (BUG-077)", () => {
    // Regressao: as 10 sessoes compartilhavam `ss-meeting-sessao-mentocoach`,
    // entao concluir a 1a marcava as 10 como concluidas.
    const primeira = mentocoachSteps.find(s => s.title === "1ª Sessão de MentoCoach")!;
    const completedSubSteps = [resolveSubstepId(primeira)];

    const marcadas = mentocoachSteps.filter(s => completedSubSteps.includes(resolveSubstepId(s)));
    expect(marcadas).toHaveLength(1);
    expect(marcadas[0].title).toBe("1ª Sessão de MentoCoach");
  });

  it("cada parada abre a si mesma na navegacao (BUG-077)", () => {
    // Regressao: `substeps.find(ss => ss.id === currentSubStepId)` devolvia sempre
    // a PRIMEIRA ocorrencia, entao clicar na 3a abria a 1a.
    const terceira = mentocoachSteps.find(s => s.title === "3ª Sessão de MentoCoach")!;
    const aberta = mentocoachSteps.find(s => resolveSubstepId(s) === resolveSubstepId(terceira));
    expect(aberta?.title).toBe("3ª Sessão de MentoCoach");
  });

  it("cai no id derivado quando o dado nao traz id (produto legado)", () => {
    expect(resolveSubstepId({ id: "", type: "survey", referenceId: "disc" })).toBe("ss-survey-disc");
  });

  it("o id do dado tem precedencia sobre o derivado", () => {
    const step = { id: "ss-meeting-sessao-mentocoach-7", type: "meeting" as const, referenceId: "sessao-mentocoach" };
    expect(resolveSubstepId(step)).toBe("ss-meeting-sessao-mentocoach-7");
    expect(resolveSubstepId(step)).not.toBe("ss-meeting-sessao-mentocoach");
  });
});
