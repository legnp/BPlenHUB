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
export type ContractOrigin = "checkout" | "avulso";

/** Prova de aceite (clickwrap) capturada no momento da assinatura. */
export interface ContractSignature {
  /** ISO timestamp do aceite. */
  signedAt: string;
  /** IP real do cliente na assinatura (validade jurídica — item f). */
  ip: string;
  /** User-Agent do cliente na assinatura. */
  userAgent: string;
  /** Ids dos termos (checkboxes) aceitos na assinatura. */
  acceptedTerms?: string[];
  /**
   * Código único de verificação estampado no PDF, amarrando serviço + contrato +
   * pagamento MP: `BPLEN-{serviceCode}-{orderId}-{paymentRef}`. Para grátis/avulso
   * sem pagamento MP, `paymentRef` é o próprio id do pedido.
   */
  verificationCode?: string;
  /** Hash curto SHA-256 (ids + signedAt) para integridade/unicidade do carimbo. */
  verificationHash?: string;
  /**
   * Geolocalização aproximada do signatário na assinatura, derivada do IP pelos headers
   * de edge da Vercel (país/região/cidade/lat-long). Aproximada e não invasiva (sem GPS
   * nem consentimento adicional) — validade jurídica complementar (item f).
   */
  geo?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: string;
    longitude?: string;
  };
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
  /** Id do pagamento Mercado Pago que originou o contrato (nulo p/ grátis/avulso). */
  paymentId?: string | null;
  /** Link do documento no Google Drive (nulo enquanto pendente de assinatura). */
  documentUrl: string | null;
  /** SHA-256 do PDF gerado (nulo enquanto pendente). */
  documentHash: string | null;
  /** Preenchido apenas quando `status === "assinado"`. */
  signature: ContractSignature | null;
  /** Nota fiscal anexada (upload pelo admin — item d / CT-4). */
  invoice?: { url: string; uploadedAt?: string; uploadedByAdmin?: boolean } | null;
  /** Timestamps serializados na leitura (gravados via serverTimestamp — F0-02). */
  createdAt?: string;
  updatedAt?: string;
}
