import { describe, it, expect } from "vitest";
import {
  calculateCycleStatus,
  canTransition,
  isCycleMonthClosed,
  PARTNER_CYCLE_STATUS_LABEL,
  PartnerCycleStatus,
} from "@/lib/partners/cycle-status";

/**
 * Maquina de estados do ciclo de repasse (plano secao 6).
 *
 * E' a regra que decide quando o dinheiro anda: quem pode mover o ciclo, a partir de
 * qual estado, e a unica barreira temporal real (nao fechar o mes corrente antes do fim
 * dele). Por isso e' pura e testada sem banco, sessao ou tela.
 */

const AGOSTO = new Date("2026-08-15T12:00:00.000Z");
const SETEMBRO = new Date("2026-09-02T12:00:00.000Z");

describe("calculateCycleStatus", () => {
  it("mes sem indicacao com compra fica em 'nenhuma indicacao'", () => {
    expect(calculateCycleStatus(0)).toBe("nenhuma_indicacao");
  });

  it("a primeira indicacao com compra poe o ciclo em andamento", () => {
    expect(calculateCycleStatus(1)).toBe("em_andamento");
    expect(calculateCycleStatus(9)).toBe("em_andamento");
  });
});

describe("isCycleMonthClosed", () => {
  it("nao fecha o mes corrente", () => {
    expect(isCycleMonthClosed("2026-08", AGOSTO)).toBe(false);
  });

  it("fecha assim que vira o mes", () => {
    expect(isCycleMonthClosed("2026-08", SETEMBRO)).toBe(true);
    expect(isCycleMonthClosed("2026-07", AGOSTO)).toBe(true);
  });

  it("recusa id de ciclo malformado em vez de assumir fechado", () => {
    expect(isCycleMonthClosed("", AGOSTO)).toBe(false);
    expect(isCycleMonthClosed("agosto", AGOSTO)).toBe(false);
  });
});

describe("canTransition — caminho feliz completo", () => {
  it("percorre em_andamento -> em_apuracao -> emita_recibo -> aguardando_repasse -> concluido", () => {
    const apuracao = canTransition({
      current: "em_andamento",
      transition: "aprovar_apuracao",
      actor: "admin",
      cycleId: "2026-08",
      reference: SETEMBRO,
    });
    expect(apuracao).toEqual({ allowed: true, next: "em_apuracao" });

    const valorFinal = canTransition({
      current: "em_apuracao",
      transition: "aprovar_valor_final",
      actor: "admin",
      cycleId: "2026-08",
      reference: SETEMBRO,
    });
    expect(valorFinal.next).toBe("emita_recibo");

    const recibo = canTransition({
      current: "emita_recibo",
      transition: "enviar_recibo",
      actor: "partner",
      cycleId: "2026-08",
      reference: SETEMBRO,
    });
    expect(recibo.next).toBe("aguardando_repasse");

    const pagamento = canTransition({
      current: "aguardando_repasse",
      transition: "registrar_pagamento",
      actor: "admin",
      cycleId: "2026-08",
      reference: SETEMBRO,
    });
    expect(pagamento.next).toBe("concluido");
  });
});

describe("canTransition — barreira do mes corrente", () => {
  it("nao deixa apurar antes do fim do mes", () => {
    const resultado = canTransition({
      current: "em_andamento",
      transition: "aprovar_apuracao",
      actor: "admin",
      cycleId: "2026-08",
      reference: AGOSTO,
    });
    expect(resultado.allowed).toBe(false);
    expect(resultado.reason).toMatch(/mês ainda não terminou/i);
  });
});

describe("canTransition — quem pode o que", () => {
  it("parceiro nao aprova apuracao nem registra pagamento", () => {
    expect(
      canTransition({
        current: "em_andamento",
        transition: "aprovar_apuracao",
        actor: "partner",
        cycleId: "2026-08",
        reference: SETEMBRO,
      }).allowed
    ).toBe(false);

    expect(
      canTransition({
        current: "aguardando_repasse",
        transition: "registrar_pagamento",
        actor: "partner",
        cycleId: "2026-08",
        reference: SETEMBRO,
      }).allowed
    ).toBe(false);
  });

  it("admin nao envia o recibo no lugar do parceiro", () => {
    expect(
      canTransition({
        current: "emita_recibo",
        transition: "enviar_recibo",
        actor: "admin",
        cycleId: "2026-08",
        reference: SETEMBRO,
      }).allowed
    ).toBe(false);
  });
});

describe("canTransition — recusas por estado", () => {
  it("nao pula etapa: de em_andamento nao se emite recibo", () => {
    const resultado = canTransition({
      current: "em_andamento",
      transition: "aprovar_valor_final",
      actor: "admin",
      cycleId: "2026-08",
      reference: SETEMBRO,
    });
    expect(resultado.allowed).toBe(false);
    expect(resultado.reason).toContain(PARTNER_CYCLE_STATUS_LABEL.em_andamento);
  });

  it("ciclo concluido nao aceita mais nenhuma acao", () => {
    const acoes = [
      "aprovar_apuracao",
      "corrigir_valor",
      "aprovar_valor_final",
      "enviar_recibo",
      "rejeitar_recibo",
      "registrar_pagamento",
    ] as const;

    acoes.forEach((transition) => {
      const actor = transition === "enviar_recibo" ? "partner" : "admin";
      expect(
        canTransition({ current: "concluido", transition, actor, cycleId: "2026-08", reference: SETEMBRO }).allowed
      ).toBe(false);
    });
  });

  it("ciclo sem indicacao nao entra no fluxo de repasse", () => {
    expect(
      canTransition({
        current: "nenhuma_indicacao",
        transition: "aprovar_apuracao",
        actor: "admin",
        cycleId: "2026-08",
        reference: SETEMBRO,
      }).allowed
    ).toBe(false);
  });
});

describe("canTransition — correcoes e rejeicao", () => {
  it("correcao de valor mantem o ciclo em apuracao", () => {
    const resultado = canTransition({
      current: "em_apuracao",
      transition: "corrigir_valor",
      actor: "admin",
      cycleId: "2026-08",
      reference: SETEMBRO,
    });
    expect(resultado).toEqual({ allowed: true, next: "em_apuracao" });
  });

  it("recibo rejeitado volta a pedir novo envio", () => {
    expect(
      canTransition({
        current: "aguardando_repasse",
        transition: "rejeitar_recibo",
        actor: "admin",
        cycleId: "2026-08",
        reference: SETEMBRO,
      }).next
    ).toBe("emita_recibo");
  });
});

describe("rotulos", () => {
  it("todo status tem rotulo unico em portugues", () => {
    const statuses: PartnerCycleStatus[] = [
      "nenhuma_indicacao",
      "em_andamento",
      "em_apuracao",
      "emita_recibo",
      "aguardando_repasse",
      "concluido",
    ];
    const labels = statuses.map((s) => PARTNER_CYCLE_STATUS_LABEL[s]);
    expect(new Set(labels).size).toBe(statuses.length);
    labels.forEach((label) => expect(label.length).toBeGreaterThan(0));
  });
});
