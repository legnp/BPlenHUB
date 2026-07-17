import { describe, it, expect } from "vitest";
import { isBlockerSummary, isBlockerEvent } from "@/lib/booking/blocker";

/**
 * Titulos reais, levantados por inventario read-only da agenda de producao e de
 * `Calendar_Events` (2026-07-16): 795 eventos na janela de 90 dias + 538 docs.
 * Nenhum titulo legitimo contem "bloq" — o que torna o radical seguro.
 */
const TITULOS_REAIS_DE_SESSAO = [
  "1 to 1",
  "BPlen | 1 to 1",
  "MentoCoach",
  "Orientação em Grupo",
  "Devolutiva Análise Comportamental",
  "Consultoria Plano de Carreira",
  "Onboarding BPlen",
  "Feedback",
  "Autoconhecimento e Aprendizagem",
];

describe("isBlockerSummary — o que conta como bloqueio de agenda", () => {
  it("reconhece o bloqueio como a Gestora escreve hoje", () => {
    expect(isBlockerSummary("Bloqueado")).toBe(true);
    expect(isBlockerSummary("bloqueado")).toBe(true);
    expect(isBlockerSummary("BLOQUEADO")).toBe(true);
    expect(isBlockerSummary("Bloqueado - compromisso pessoal")).toBe(true);
  });

  it("tolera o erro de digitacao que escapava do filtro antigo (BUG-075)", () => {
    // Regressao: 5 eventos "Bloquado" (sem o "e") entraram na base como evento
    // comum, porque o filtro casava a palavra inteira "bloqueado".
    expect(isBlockerSummary("Bloquado")).toBe(true);
    expect(isBlockerSummary("bloquado")).toBe(true);
  });

  it("cobre as variacoes da mesma palavra", () => {
    expect(isBlockerSummary("Bloqueio")).toBe(true);
    expect(isBlockerSummary("Bloqueada")).toBe(true);
    expect(isBlockerSummary("Agenda bloqueada")).toBe(true);
  });

  it("nao captura nenhum titulo real de sessao (falso-positivo)", () => {
    // A trava do radical: se um titulo de servico passar a conter "bloq", este
    // teste quebra ANTES de a sessao sumir da agenda do membro em producao.
    for (const titulo of TITULOS_REAIS_DE_SESSAO) {
      expect(isBlockerSummary(titulo)).toBe(false);
    }
  });

  it("trata ausencia de titulo sem quebrar", () => {
    expect(isBlockerSummary("")).toBe(false);
    expect(isBlockerSummary(null)).toBe(false);
    expect(isBlockerSummary(undefined)).toBe(false);
  });
});

describe("isBlockerEvent — campo tem precedencia sobre o titulo", () => {
  it("usa o campo isBlocker gravado pelo sync", () => {
    expect(isBlockerEvent({ isBlocker: true, summary: "Reuniao" })).toBe(true);
    expect(isBlockerEvent({ isBlocker: false, summary: "Bloqueado" })).toBe(false);
  });

  it("cai no titulo apenas para o doc legado, sem o campo", () => {
    // Os 340 docs de eventos passados nunca sao reescritos pelo sync (so a janela
    // futura), entao nunca ganham o campo — precisam do fallback.
    expect(isBlockerEvent({ summary: "Bloqueado" })).toBe(true);
    expect(isBlockerEvent({ summary: "Bloquado" })).toBe(true);
    expect(isBlockerEvent({ summary: "MentoCoach" })).toBe(false);
  });

  it("nao confunde isBlocker=false com campo ausente", () => {
    // `false` e uma resposta; ausente e "nao sei, olhe o titulo".
    expect(isBlockerEvent({ isBlocker: false, summary: "Bloquado" })).toBe(false);
    expect(isBlockerEvent({ summary: "Bloquado" })).toBe(true);
  });
});
