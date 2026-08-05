import { z } from "zod";

/**
 * BPlen HUB — Area de Parceiros (tipos e schemas)
 *
 * Fase 1: o termo de parceria e o registro do aceite. O restante (indicacoes, ciclos
 * de repasse) entra nas fases seguintes do PARTNER-AREA-EXPANSION-PLAN.md.
 */

/**
 * Um bloco de texto do termo. O documento e' montado por blocos para que a Gestora
 * publique/edite o conteudo sem passar por codigo — a parada de Formalizacao exibe o
 * que estiver publicado, na ordem publicada.
 */
export const PartnerTermsSectionSchema = z.object({
  title: z.string().optional(),
  body: z.string(),
});

/**
 * Caixa de aceite modular. Cada documento declara as suas — obrigatorias ou nao —, e a
 * assinatura so e' liberada quando todas as obrigatorias estao marcadas.
 */
export const PartnerTermsAcceptanceSchema = z.object({
  id: z.string(),
  label: z.string(),
  required: z.boolean().default(true),
});

export const PartnerTermsDocumentSchema = z.object({
  /** Versao do documento. Muda a versao, o aceite anterior deixa de valer. */
  version: z.string(),
  title: z.string(),
  intro: z.string().optional(),
  sections: z.array(PartnerTermsSectionSchema).default([]),
  acceptances: z.array(PartnerTermsAcceptanceSchema).default([]),
  /** Quando false, a parada mostra o estado "documento em preparacao". */
  published: z.boolean().default(false),
});

export type PartnerTermsSection = z.infer<typeof PartnerTermsSectionSchema>;
export type PartnerTermsAcceptance = z.infer<typeof PartnerTermsAcceptanceSchema>;
export type PartnerTermsDocument = z.infer<typeof PartnerTermsDocumentSchema>;

/** Registro do aceite, gravado em User/{matricula}/Partner_Consent/current. */
export const PartnerConsentRecordSchema = z.object({
  version: z.string(),
  documentId: z.string(),
  signedName: z.string(),
  acceptedIds: z.array(z.string()),
  signedAt: z.string(),
});

export type PartnerConsentRecord = z.infer<typeof PartnerConsentRecordSchema>;
