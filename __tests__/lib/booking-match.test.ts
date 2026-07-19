import { describe, it, expect } from "vitest";
import { eventMatchesSubstep } from "@/lib/journey/booking-match";

/**
 * Fonte unica do casamento parada <-> evento da agenda (BUG-099).
 *
 * O que este arquivo protege: ate o BUG-099 o cabecalho da parada e a lista de
 * agendamentos confirmados casavam a MESMA sessao com criterios diferentes — o
 * cabecalho anunciava "confirmado" e a lista vinha vazia, em 8 de 8 pares reais
 * da base. Os casos abaixo usam titulos e paradas REAIS levantados em produção
 * em 2026-07-19, e o caso decisivo e o do evento SEM tema: e ele que a regra
 * antiga da lista descartava.
 */

const PARADA_DEVOLUTIVA_PLANO = { referenceId: "devolutiva-plano-carreira", title: "Devolutiva do Plano" };
const PARADA_ONBOARDING = { referenceId: "onboarding", title: "Sessão de Onboarding" };
const PARADA_MENTOCOACH = { referenceId: "mentocoach-1", title: "1ª Sessão de MentoCoach" };
const PARADA_GRUPO = { referenceId: "orientacao-grupo-01", title: "Autoconhecimento e Aprendizagem" };

describe("eventMatchesSubstep — evento SEM tema (o caso do BUG-099)", () => {
  it("casa pela palavra-chave quando o evento nao tem tema", () => {
    // Os 4 agendamentos reais do BP-005 tem theme undefined; a regra antiga da
    // lista exigia tema e por isso descartava todos.
    expect(eventMatchesSubstep({ summary: "Consultoria Plano de Carreira" }, PARADA_DEVOLUTIVA_PLANO)).toBe(true);
    expect(eventMatchesSubstep({ summary: "Onboarding" }, PARADA_ONBOARDING)).toBe(true);
    expect(eventMatchesSubstep({ summary: "MentoCoach" }, PARADA_MENTOCOACH)).toBe(true);
  });

  it("casa mesmo com tema explicitamente undefined (forma real gravada no Firestore)", () => {
    expect(eventMatchesSubstep({ summary: "Onboarding", theme: undefined }, PARADA_ONBOARDING)).toBe(true);
  });
});

describe("eventMatchesSubstep — tema tem precedencia sobre a palavra-chave", () => {
  it("casa pelo tema quando ele bate com o titulo da parada", () => {
    expect(eventMatchesSubstep(
      { summary: "Orientação em Grupo", theme: "Autoconhecimento e Aprendizagem" },
      PARADA_GRUPO
    )).toBe(true);
  });

  it("NAO casa quando o evento tem tema de outra parada, ainda que o titulo case", () => {
    // Sem a precedencia do tema, "Orientação em Grupo" casaria a keyword
    // "orientacao em grupo" e a sessao de OUTRO tema apareceria na parada
    // errada — a familia do BUG-074.
    expect(eventMatchesSubstep(
      { summary: "Orientação em Grupo", theme: "Técnicas de Negociação" },
      PARADA_GRUPO
    )).toBe(false);
  });

  it("compara tema ignorando acento e caixa (Licao 30)", () => {
    expect(eventMatchesSubstep(
      { summary: "Orientação em Grupo", theme: "TECNICAS DE NEGOCIACAO" },
      { referenceId: "orientacao-grupo-06", title: "Técnicas de Negociação" }
    )).toBe(true);
  });
});

describe("eventMatchesSubstep — nao vaza entre tipos de sessao (ponto de atencao da Gestora)", () => {
  it("a parada de devolutiva comportamental nao aceita slot de 1 to 1 nem de grupo", () => {
    const parada = { referenceId: "devolutiva-analise", title: "Devolutiva de Análise" };
    expect(eventMatchesSubstep({ summary: "1 to 1" }, parada)).toBe(false);
    expect(eventMatchesSubstep({ summary: "Consultoria em Grupo" }, parada)).toBe(false);
    expect(eventMatchesSubstep({ summary: "Consultoria Individual" }, parada)).toBe(false);
    expect(eventMatchesSubstep({ summary: "Devolutiva Analise Comportamental" }, parada)).toBe(true);
  });

  it("a parada de onboarding nao aceita os 51 slots de 1 to 1 da janela", () => {
    expect(eventMatchesSubstep({ summary: "1 to 1" }, PARADA_ONBOARDING)).toBe(false);
  });

  it("os titulos genericos da Fase 3.1 seguem sem parada (modelo antigo intocado)", () => {
    // Se um dia casarem, este teste quebra ANTES de a sessao errada aparecer.
    const genericos = ["1 to 1", "Consultoria Individual", "Consultoria em Grupo"];
    const paradas = [PARADA_DEVOLUTIVA_PLANO, PARADA_ONBOARDING, PARADA_MENTOCOACH, PARADA_GRUPO];
    for (const summary of genericos) {
      for (const parada of paradas) {
        expect(eventMatchesSubstep({ summary }, parada)).toBe(false);
      }
    }
  });
});

describe("eventMatchesSubstep — bordas", () => {
  it("evento ausente (agendamento fantasma do BUG-097) nao casa nada", () => {
    expect(eventMatchesSubstep(null, PARADA_ONBOARDING)).toBe(false);
    expect(eventMatchesSubstep(undefined, PARADA_ONBOARDING)).toBe(false);
  });

  it("summary vazio nao casa", () => {
    expect(eventMatchesSubstep({ summary: "" }, PARADA_ONBOARDING)).toBe(false);
  });
});
