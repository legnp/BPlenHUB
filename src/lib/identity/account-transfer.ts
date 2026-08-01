/**
 * BPlen HUB — Transferencia de conta (Fase 3, admin) — logica pura de decisao.
 *
 * Torna operavel o "fale com a BPlen" (trava de CPF): reassocia uma conta
 * existente (com os dados) a um novo meio de login. NUNCA mescla dados
 * automaticamente. A trava de seguranca vive aqui: so libera a transferencia
 * quando a conta DESTINO nao tem dados a perder (sem contratos/pedidos). Se tiver,
 * recusa e encaminha para merge manual (caso a caso) — sem truncar nada.
 *
 * Pura de proposito para a suite exercer a MESMA decisao que a producao (Licao 18).
 */

export type TransferReason =
  | "source_missing"
  | "source_archived"
  | "same_account"
  | "target_has_data";

export type TransferVerdict = { ok: true } | { ok: false; reason: TransferReason };

export interface TransferInput {
  /** A conta de origem (a que tem os dados) existe? */
  sourceExists: boolean;
  /** A conta de origem ja esta arquivada? */
  sourceArchived: boolean;
  /** Matricula de origem. */
  sourceMatricula: string;
  /** Matricula que o uid destino ja aponta hoje (a "orfa"/nova), ou null. */
  targetCurrentMatricula: string | null;
  /** A conta que o destino aponta hoje tem dados a preservar (contratos/pedidos)? */
  orphanHasData: boolean;
}

/**
 * Decide se a transferencia pode prosseguir. Casos de recusa:
 * - origem inexistente ou arquivada;
 * - destino ja aponta para a propria origem (no-op);
 * - destino aponta para outra conta COM dados (precisa de merge manual — nunca
 *   arquivar/descartar dado automaticamente).
 */
export function classifyTransfer(input: TransferInput): TransferVerdict {
  if (!input.sourceExists) return { ok: false, reason: "source_missing" };
  if (input.sourceArchived) return { ok: false, reason: "source_archived" };
  if (input.targetCurrentMatricula === input.sourceMatricula) {
    return { ok: false, reason: "same_account" };
  }
  if (input.targetCurrentMatricula && input.orphanHasData) {
    return { ok: false, reason: "target_has_data" };
  }
  return { ok: true };
}

/** Mensagem humana da recusa (para a UI admin). */
export function transferReasonMessage(reason: TransferReason): string {
  switch (reason) {
    case "source_missing":
      return "Conta de origem não encontrada.";
    case "source_archived":
      return "Conta de origem já está arquivada.";
    case "same_account":
      return "O acesso de destino já pertence a esta conta. Nada a transferir.";
    case "target_has_data":
      return "O acesso de destino já tem uma conta com dados (contratos ou pedidos). Isso exige uma fusão manual das contas, caso a caso — a transferência automática foi bloqueada para não perder dados.";
  }
}
