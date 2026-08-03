import { describe, it, expect } from "vitest";
import {
  activityKeyOf,
  repeatedActivityKeys,
  isCrossCompletable,
} from "@/lib/journey/cross-completion";
import type { SubStepConfig } from "@/types/journey";

/**
 * Regressao do BUG-118: concluir a 1a Sessao de MentoCoach marcava as dez, porque as
 * 10 paradas compartilham `referenceId="sessao-mentocoach"` e o motor de conclusao
 * cruzada casa por `type:referenceId`. Sonda em producao confirmou 10 conclusoes
 * gravadas contra 1 unica presenca real na agenda.
 */

const sub = (id: string, type: SubStepConfig["type"], referenceId: string): SubStepConfig => ({
  id,
  title: id,
  type,
  referenceId,
});

/** Forma real da etapa MentoCoach (ids conforme o BUG-077, referenceId compartilhado). */
const MENTOCOACH = Array.from({ length: 10 }, (_, i) =>
  sub(`ss-meeting-sessao-mentocoach-${i + 2}`, "meeting", "sessao-mentocoach")
);

/**
 * Forma real da etapa Analise Comportamental: 4 surveys + a Devolutiva de Analise.
 * Os CINCO ids abaixo aparecem tambem dentro da etapa `mentocoach` (uma unica vez la),
 * porque uma contratacao de MentoCoach embute a estrutura da analise.
 */
const ANALISE = [
  sub("ss-survey-disc", "survey", "disc"),
  sub("ss-survey-preferencias_reconhecimento", "survey", "preferencias_reconhecimento"),
  sub("ss-survey-preferencias_aprendizado", "survey", "preferencias_aprendizado"),
  sub("ss-survey-gestao_tempo", "survey", "gestao_tempo"),
  sub("ss-meeting-devolutiva-analise-comportamental", "meeting", "devolutiva-analise-comportamental"),
];

/** Etapa MentoCoach como esta em producao: a analise embutida + as 10 sessoes. */
const MENTOCOACH_COMPLETO = [...ANALISE, ...MENTOCOACH];

describe("repeatedActivityKeys — ocorrencias contaveis dentro da etapa", () => {
  it("detecta a chave repetida das 10 sessoes", () => {
    expect(repeatedActivityKeys(MENTOCOACH)).toEqual(new Set(["meeting:sessao-mentocoach"]));
  });

  it("nao acusa repeticao onde cada atividade e unica", () => {
    expect(repeatedActivityKeys(ANALISE).size).toBe(0);
  });

  it("ignora parada sem referenceId", () => {
    expect(repeatedActivityKeys([sub("a", "content", ""), sub("b", "content", "")]).size).toBe(0);
  });
});

describe("isCrossCompletable — quem participa da conclusao cruzada", () => {
  it("NENHUMA das 10 sessoes cruza: concluir uma nao pode marcar as outras", () => {
    const repeated = repeatedActivityKeys(MENTOCOACH_COMPLETO);
    for (const sessao of MENTOCOACH) {
      expect(isCrossCompletable(sessao, repeated)).toBe(false);
    }
  });

  it("a Devolutiva de Analise CRUZA: e a mesma sessao nas duas etapas", () => {
    // Regressao do ajuste de 2026-08-03: a primeira versao excluia todo `meeting` da
    // conclusao cruzada e quebrava justamente este caso — o membro teria que fechar a
    // MESMA devolutiva duas vezes, uma em cada etapa.
    const devolutiva = ANALISE[4];

    expect(isCrossCompletable(devolutiva, repeatedActivityKeys(ANALISE))).toBe(true);
    expect(isCrossCompletable(devolutiva, repeatedActivityKeys(MENTOCOACH_COMPLETO))).toBe(true);
  });

  it("na mesma etapa, a analise embutida cruza e as sessoes nao", () => {
    const repeated = repeatedActivityKeys(MENTOCOACH_COMPLETO);
    ANALISE.forEach((atividade) => {
      expect(isCrossCompletable(atividade, repeated)).toBe(true);
    });
    expect(isCrossCompletable(MENTOCOACH[0], repeated)).toBe(false);
  });

  it("survey e formulario continuam cruzando — e o que sustenta os instrumentos modulares", () => {
    const repeated = repeatedActivityKeys(ANALISE);
    expect(isCrossCompletable(ANALISE[0], repeated)).toBe(true);
    expect(isCrossCompletable(sub("ss-frm-x", "form", "dados_cadastrais"), repeated)).toBe(true);
  });

  it("survey repetida de proposito na etapa nao cruza (protecao para servico futuro)", () => {
    const checkins = Array.from({ length: 12 }, (_, i) =>
      sub(`ss-survey-check-in-${i + 1}`, "survey", "check_in")
    );
    const repeated = repeatedActivityKeys(checkins);
    expect(isCrossCompletable(checkins[0], repeated)).toBe(false);
  });

  it("parada sem referenceId nunca cruza", () => {
    expect(isCrossCompletable(sub("x", "survey", ""), new Set())).toBe(false);
  });

  it("activityKeyOf compoe a identidade usada pelo motor", () => {
    expect(activityKeyOf(MENTOCOACH[0])).toBe("meeting:sessao-mentocoach");
  });
});
