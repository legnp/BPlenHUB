/**
 * Subsistema de Contratos (BPlen HUB) — ver docs/system-audit/CONTRACTS-DESIGN.md
 *
 * Entidade soberana de contrato, chaveada por matrícula em
 * `User/{matricula}/Contracts/{contractId}`. Introduzida na fase CT-1; absorve
 * gradualmente o antigo registro `Legal_Audits` (a consolidação acontece no CT-4).
 */

/** Ciclo de vida da assinatura do contrato. */
export type ContractStatus =
  | "pendente_assinatura"
  | "em_retificacao"
  | "assinado"
  | "cancelado";

/** Origem do contrato (por qual fluxo foi formalizado). */
export type ContractOrigin = "checkout" | "retroativo";

/** Prova de aceite (clickwrap) capturada no momento da assinatura. */
export interface ContractSignature {
  /** ISO timestamp do aceite. */
  signedAt: string;
  /** IP real do cliente na assinatura (validade jurídica — item f). */
  ip: string;
  /** User-Agent do cliente na assinatura. */
  userAgent: string;
}

export interface Contract {
  contractId: string;
  matricula: string;
  serviceCode: string | null;
  productSlug: string | null;
  productTitle: string | null;
  status: ContractStatus;
  origin: ContractOrigin;
  orderId: string | null;
  /** Link do documento no Google Drive (nulo enquanto pendente de assinatura). */
  documentUrl: string | null;
  /** SHA-256 do PDF gerado (nulo enquanto pendente). */
  documentHash: string | null;
  /** Preenchido apenas quando `status === "assinado"`. */
  signature: ContractSignature | null;
  /** Nota fiscal anexada (admin/automação — item d; preenchido em fase futura). */
  invoice?: { url: string; uploadedAt: string } | null;
  /** Timestamps serializados na leitura (gravados via serverTimestamp — F0-02). */
  createdAt?: string;
  updatedAt?: string;
}
