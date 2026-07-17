import { describe, it, expect } from "vitest";
import {
  isWithinBookingWindow,
  getBookingWindowError,
  hasReachedWeeklyLimit,
  preservesCredit,
  resolveEventType,
  resolveEventWeek
} from "@/lib/booking/policy";

/** Relogio fixo, para o teste nao depender da data em que roda. */
const NOW = new Date("2026-07-16T10:00:00-03:00");
const at = (iso: string) => iso;

describe("isWithinBookingWindow — janela de 3 a 20 dias", () => {
  it("recusa sessao com menos de 3 dias de antecedencia", () => {
    expect(isWithinBookingWindow(at("2026-07-16T19:00:00-03:00"), NOW)).toBe(false);
    expect(isWithinBookingWindow(at("2026-07-18T19:00:00-03:00"), NOW)).toBe(false);
  });

  it("aceita a partir de 3 dias", () => {
    expect(isWithinBookingWindow(at("2026-07-19T09:00:00-03:00"), NOW)).toBe(true);
    expect(isWithinBookingWindow(at("2026-07-21T19:55:00-03:00"), NOW)).toBe(true);
  });

  it("recusa alem de 20 dias — a janela agora vale para TODOS os eventos", () => {
    // Regressao: a janela maxima era aplicada so a eventos com "onboarding" no
    // nome; os demais apareciam com ate 90 dias de antecedencia.
    expect(isWithinBookingWindow(at("2026-08-06T10:00:00-03:00"), NOW)).toBe(false);
    expect(isWithinBookingWindow(at("2026-10-01T10:00:00-03:00"), NOW)).toBe(false);
  });

  it("o 20o dia cabe inteiro — a fronteira e por DIA, como o texto comunica", () => {
    // NOW = 16/07. O ultimo dia agendavel e 05/08 (hoje + 20), inclusive ate o
    // fim do dia. A regra legada do Onboarding cortava no inicio do 05/08, o que
    // excluia o 20o dia e contradiria o texto "de 20 a 3 dias antes".
    expect(isWithinBookingWindow(at("2026-08-05T00:30:00-03:00"), NOW)).toBe(true);
    expect(isWithinBookingWindow(at("2026-08-05T23:59:00-03:00"), NOW)).toBe(true);
    expect(isWithinBookingWindow(at("2026-08-06T00:00:00-03:00"), NOW)).toBe(false);
  });

  it("o 3o dia cabe inteiro — simetrico ao maximo", () => {
    expect(isWithinBookingWindow(at("2026-07-19T00:00:00-03:00"), NOW)).toBe(true);
    expect(isWithinBookingWindow(at("2026-07-18T23:59:00-03:00"), NOW)).toBe(false);
  });

  it("a noite de Brasilia nao adianta a janela em um dia (BUG-093)", () => {
    // 16/07 as 22:00 BRT ja e 17/07 01:00 em UTC. Se "hoje" sair do relogio do
    // servidor, a janela inteira escorrega UM DIA: o membro que agenda a noite
    // recebe uma regra diferente da que recebe de manha, no mesmo dia.
    const NOITE = new Date("2026-07-16T22:00:00-03:00");

    // "Hoje" continua sendo 16/07 em Brasilia -> o 3o dia e 19/07.
    expect(isWithinBookingWindow(at("2026-07-19T09:00:00-03:00"), NOITE)).toBe(true);
    expect(isWithinBookingWindow(at("2026-07-18T23:59:00-03:00"), NOITE)).toBe(false);
    // ... e o 20o dia segue sendo 05/08, nao 06/08.
    expect(isWithinBookingWindow(at("2026-08-05T23:59:00-03:00"), NOITE)).toBe(true);
    expect(isWithinBookingWindow(at("2026-08-06T00:00:00-03:00"), NOITE)).toBe(false);
  });

  it("nao depende do nome do evento", () => {
    const dentro = "2026-07-21T19:00:00-03:00";
    expect(isWithinBookingWindow(dentro, NOW)).toBe(true);
    const fora = "2026-09-01T19:00:00-03:00";
    expect(isWithinBookingWindow(fora, NOW)).toBe(false);
  });
});

describe("getBookingWindowError — mensagem util ao membro", () => {
  it("explica o minimo quando esta cedo demais", () => {
    expect(getBookingWindowError(at("2026-07-17T19:00:00-03:00"), NOW)).toContain("3 dias");
  });

  it("explica o maximo quando ainda nao abriu", () => {
    expect(getBookingWindowError(at("2026-09-01T19:00:00-03:00"), NOW)).toContain("20 dias");
  });

  it("devolve null quando esta na janela", () => {
    expect(getBookingWindowError(at("2026-07-21T19:00:00-03:00"), NOW)).toBeNull();
  });
});

describe("hasReachedWeeklyLimit — 1 participacao por TIPO por semana", () => {
  const semana = { week: 30, year: 2026 };
  const umTo1 = { ...semana, eventType: resolveEventType("1 to 1") };
  const devolutiva = { ...semana, eventType: resolveEventType("Devolutiva Analise Comportamental") };

  it("bloqueia a 2a sessao do MESMO tipo na mesma semana", () => {
    expect(hasReachedWeeklyLimit([umTo1], umTo1)).toBe(true);
  });

  it("PERMITE tipos diferentes na mesma semana", () => {
    // Regressao: qualquer agendamento trancava a semana inteira, entao quem
    // tinha uma devolutiva nao conseguia marcar um 1 to 1 na mesma semana.
    expect(hasReachedWeeklyLimit([devolutiva], umTo1)).toBe(false);
    expect(hasReachedWeeklyLimit([umTo1], devolutiva)).toBe(false);
  });

  it("permite o mesmo tipo em semanas diferentes", () => {
    expect(hasReachedWeeklyLimit([{ ...umTo1, week: 29 }], umTo1)).toBe(false);
    expect(hasReachedWeeklyLimit([{ ...umTo1, year: 2025 }], umTo1)).toBe(false);
  });

  it("nao se confunde com acento ou caixa no nome do evento", () => {
    const comAcento = { ...semana, eventType: resolveEventType("Orientação em Grupo") };
    const semAcento = { ...semana, eventType: resolveEventType("ORIENTACAO EM GRUPO") };
    expect(hasReachedWeeklyLimit([comAcento], semAcento)).toBe(true);
  });

  it("carteira vazia nunca bloqueia", () => {
    expect(hasReachedWeeklyLimit([], umTo1)).toBe(false);
  });
});

describe("preservesCredit — prazo de 24h", () => {
  it("preserva o credito com mais de 24h", () => {
    expect(preservesCredit(at("2026-07-21T10:00:00-03:00"), NOW)).toBe(true);
  });

  it("nao preserva dentro das 24h", () => {
    expect(preservesCredit(at("2026-07-17T09:00:00-03:00"), NOW)).toBe(false);
    expect(preservesCredit(at("2026-07-16T23:00:00-03:00"), NOW)).toBe(false);
  });

  it("a fronteira exata de 24h preserva", () => {
    expect(preservesCredit(at("2026-07-17T10:00:00-03:00"), NOW)).toBe(true);
  });
});

describe("resolveEventWeek", () => {
  it("devolve semana ISO e ano do evento", () => {
    expect(resolveEventWeek("2026-07-21T19:55:00-03:00")).toEqual({ week: 30, year: 2026 });
  });

  it("a semana e a de Brasilia, nao a do servidor (BUG-093)", () => {
    // Domingo 19/07 as 22:00 BRT ja e segunda 20/07 01:00 em UTC. Avaliada no fuso
    // do servidor, a sessao cairia na semana 30 (a seguinte) e o membro poderia
    // agendar duas do mesmo tipo na mesma semana, furando o limite semanal.
    expect(resolveEventWeek("2026-07-19T22:00:00-03:00")).toEqual({ week: 29, year: 2026 });
    // Segunda 20/07 00:30 BRT: ai sim, semana 30.
    expect(resolveEventWeek("2026-07-20T00:30:00-03:00")).toEqual({ week: 30, year: 2026 });
  });
});

describe("resolveEventType", () => {
  it("normaliza acento, caixa e espaco", () => {
    expect(resolveEventType("  Orientação em Grupo ")).toBe("orientacao em grupo");
  });

  it("tolera ausencia de nome", () => {
    expect(resolveEventType(undefined)).toBe("");
    expect(resolveEventType(null)).toBe("");
  });
});
