/**
 * Maquina de estados do ciclo de repasse do parceiro.
 *
 * Mapa aprovado pela Gestora (PARTNER-AREA-EXPANSION-PLAN.md secao 6):
 *
 *   [sem indicacao no mes]        -> nenhuma_indicacao
 *   [1a indicacao com compra]     -> em_andamento
 *   em_andamento    --admin--     -> em_apuracao        (so DEPOIS do fim do mes civil)
 *   em_apuracao     --admin--     -> em_apuracao        (correcao manual do valor)
 *   em_apuracao     --admin--     -> emita_recibo       (valor final aprovado)
 *   emita_recibo    --parceiro--  -> aguardando_repasse (recibo/NF enviado)
 *   emita_recibo    --admin--     -> emita_recibo       (recibo rejeitado, pede novo)
 *   aguardando_repasse --admin--  -> concluido          (comprovante de pagamento)
 *
 * Modulo PURO de proposito: e' a regra que decide quando o dinheiro anda. Ela precisa
 * ser testavel sem banco, sem sessao e sem tela — e e' o unico lugar onde a transicao e'
 * autorizada. As actions perguntam a ela; nunca gravam status por conta propria.
 *
 * Os dois primeiros estados sao CALCULADOS (idempotentes, recalculados a cada geracao);
 * do `em_apuracao` em diante, quem move o ciclo e' uma acao pratica de alguem.
 */

export type PartnerCycleStatus =
  | "nenhuma_indicacao"
  | "em_andamento"
  | "em_apuracao"
  | "emita_recibo"
  | "aguardando_repasse"
  | "concluido";

/** Rotulo exibido ao parceiro e ao admin — fonte unica, sem variacao por tela. */
export const PARTNER_CYCLE_STATUS_LABEL: Record<PartnerCycleStatus, string> = {
  nenhuma_indicacao: "Nenhuma indicação gerada",
  em_andamento: "Ciclo em andamento",
  em_apuracao: "Ciclo em apuração",
  emita_recibo: "Emita o recibo/NF",
  aguardando_repasse: "Aguardando repasse",
  concluido: "Ciclo concluído",
};

/** Estados calculados automaticamente — a geracao do ciclo pode reescrever. */
export const AUTOMATIC_STATUSES: PartnerCycleStatus[] = ["nenhuma_indicacao", "em_andamento"];

/** Quem pode pedir cada transicao. */
export type PartnerCycleActor = "admin" | "partner";

export type PartnerCycleTransition =
  | "aprovar_apuracao"
  | "corrigir_valor"
  | "aprovar_valor_final"
  | "enviar_recibo"
  | "rejeitar_recibo"
  | "registrar_pagamento";

interface TransitionRule {
  from: PartnerCycleStatus[];
  to: PartnerCycleStatus;
  actor: PartnerCycleActor;
  /** Exige que o mes civil do ciclo ja tenha terminado. */
  requiresClosedMonth?: boolean;
}

const TRANSITIONS: Record<PartnerCycleTransition, TransitionRule> = {
  aprovar_apuracao: { from: ["em_andamento"], to: "em_apuracao", actor: "admin", requiresClosedMonth: true },
  corrigir_valor: { from: ["em_apuracao"], to: "em_apuracao", actor: "admin" },
  aprovar_valor_final: { from: ["em_apuracao"], to: "emita_recibo", actor: "admin" },
  enviar_recibo: { from: ["emita_recibo"], to: "aguardando_repasse", actor: "partner" },
  rejeitar_recibo: { from: ["aguardando_repasse", "emita_recibo"], to: "emita_recibo", actor: "admin" },
  registrar_pagamento: { from: ["aguardando_repasse"], to: "concluido", actor: "admin" },
};

/**
 * Status calculado de um ciclo, a partir do que existe no mes. So vale para os estados
 * automaticos: um ciclo que ja passou para apuracao nao volta sozinho.
 */
export function calculateCycleStatus(indicationsWithPurchase: number): PartnerCycleStatus {
  return indicationsWithPurchase > 0 ? "em_andamento" : "nenhuma_indicacao";
}

/** O mes civil do ciclo ("AAAA-MM") ja terminou na data de referencia? */
export function isCycleMonthClosed(cycleId: string, reference: Date): boolean {
  const [year, month] = cycleId.split("-").map(Number);
  if (!year || !month) return false;
  // Primeiro instante do mes seguinte, em Brasilia (o ciclo fecha na virada do mes).
  const firstOfNextMonth = new Date(Date.UTC(year, month, 1, 3, 0, 0));
  return reference.getTime() >= firstOfNextMonth.getTime();
}

export interface TransitionResult {
  allowed: boolean;
  next?: PartnerCycleStatus;
  reason?: string;
}

/**
 * Autoriza (ou nao) uma transicao. Unica porta por onde o status muda.
 *
 * A recusa vem com motivo em linguagem de negocio, para a tela poder exibir sem
 * traduzir — e para o log dizer o que aconteceu.
 */
export function canTransition(input: {
  current: PartnerCycleStatus;
  transition: PartnerCycleTransition;
  actor: PartnerCycleActor;
  cycleId: string;
  reference: Date;
}): TransitionResult {
  const rule = TRANSITIONS[input.transition];
  if (!rule) return { allowed: false, reason: "Ação desconhecida para o ciclo." };

  if (rule.actor !== input.actor) {
    return { allowed: false, reason: "Esta ação não pertence a quem a solicitou." };
  }

  if (!rule.from.includes(input.current)) {
    return {
      allowed: false,
      reason: `O ciclo está em "${PARTNER_CYCLE_STATUS_LABEL[input.current]}" e não aceita esta ação agora.`,
    };
  }

  // Unica barreira temporal real do fluxo: nao fechar o mes corrente antes do fim dele.
  if (rule.requiresClosedMonth && !isCycleMonthClosed(input.cycleId, input.reference)) {
    return { allowed: false, reason: "O mês ainda não terminou — a apuração só abre depois do fim do ciclo." };
  }

  return { allowed: true, next: rule.to };
}
