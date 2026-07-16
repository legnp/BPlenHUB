/**
 * Farol (beacon) de uma etapa na navegacao da jornada: cor + rotulo.
 *
 * Funcao PURA — extraida do `JourneyNav` para poder ser testada. A ORDEM das
 * regras aqui e' a propria regra, e ja produziu dois rotulos mentirosos:
 *
 * 1. A trava de sequencia e' avaliada ANTES do progresso. Estava depois, entao
 *    uma etapa travada com qualquer progresso (o MentoCoach tem 33% das paradas
 *    de Analise Comportamental, que ele compartilha) era rotulada "Foco Atual",
 *    mascarando a trava.
 * 2. Existe caso explicito para "acessivel, mas nao e' a proxima da fila"
 *    ("Disponivel"). Sem ele, essa etapa caia no default e aparecia como
 *    "Nao Liberado" mesmo estando liberada e clicavel (caso do Posicionamento).
 */

export interface StageBeaconInput {
  /** Status resolvido da etapa (`getStageTelemetry`). */
  status: string;
  /** 0-100 — progresso das paradas da etapa. */
  percentage: number;
  /** O usuario possui/pode entrar na etapa. */
  hasAccess: boolean;
  /** E' a proxima etapa da fila. */
  isNext: boolean;
  /** Possui o servico, mas os pre-requisitos ainda nao foram cumpridos. */
  isSequenceLocked: boolean;
  /** E' a etapa aberta na tela agora. */
  isCurrent: boolean;
}

export interface StageBeacon {
  status: string;
  color: string;
}

export function resolveStageBeacon(input: StageBeaconInput): StageBeacon {
  const { status, percentage, hasAccess, isNext, isSequenceLocked, isCurrent } = input;

  // Possui o servico, mas a sequencia ainda nao liberou.
  const isBlockedBySequence = hasAccess && isSequenceLocked;

  if (status === "completed") {
    return { status: "Concluído", color: "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]" };
  }

  if (isBlockedBySequence) {
    return { status: "Aguardando Fase Anterior", color: "bg-amber-100/40 border-amber-400/30" };
  }

  if (isCurrent || percentage > 0) {
    return { status: "Foco Atual", color: "bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)]" };
  }

  if (hasAccess && isNext) {
    return { status: "Próximo Passo", color: "bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]" };
  }

  if (hasAccess) {
    // Liberada e acessivel — so nao e' a proxima da fila.
    return { status: "Disponível", color: "bg-blue-500/40" };
  }

  if (isNext) {
    // Nao possui o servico, mas e' a proxima: aguardando liberacao administrativa.
    return {
      status: "Bloqueado Admin",
      color: "bg-[#ff2c8d] shadow-[0_0_15px_rgba(255,44,141,0.8)] animate-pulse"
    };
  }

  return { status: "Não Liberado", color: "bg-slate-400/40" };
}
