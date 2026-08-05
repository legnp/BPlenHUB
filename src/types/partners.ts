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
/**
 * Condicao de exibicao de um bloco do termo. O documento juridico da BPlen tem blocos
 * marcados como "EXIBIDO APENAS SE ...", e eles precisam ser condicao de DADO, nao
 * instrucao em texto para alguem lembrar de apagar na hora de assinar.
 */
export const PartnerTermsConditionSchema = z.enum(["always", "commercial", "public_showcase"]);

export const PartnerTermsSectionSchema = z.object({
  title: z.string().optional(),
  body: z.string(),
  condition: PartnerTermsConditionSchema.default("always"),
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

/**
 * Entrada do diretorio de parceiros — o que alimenta a pergunta "Como voce nos
 * conheceu?" da Welcome Survey.
 *
 * O cliente novo escolhe um NOME, nunca uma matricula: a matricula do parceiro nao
 * chega ao navegador de terceiros. A resolucao nome -> parceiro acontece no servidor,
 * no efeito da survey.
 */
export const PartnerDirectoryEntrySchema = z.object({
  partnerMatricula: z.string(),
  displayName: z.string(),
  active: z.boolean().default(true),
});

export const PartnerDirectorySchema = z.object({
  entries: z.array(PartnerDirectoryEntrySchema).default([]),
});

export type PartnerDirectoryEntry = z.infer<typeof PartnerDirectoryEntrySchema>;

/** Indicacao registrada sob User/{partnerMatricula}/Partner_Referrals/{indicado}. */
export const PartnerReferralSchema = z.object({
  referredMatricula: z.string(),
  referredNome: z.string(),
  /** Uso SERVER-ONLY: nunca retornado ao parceiro (plano secao 7.1). */
  cpfHash: z.string().nullable().default(null),
  dataIndicacao: z.string(),
  /** Copia do percentual vigente no momento da indicacao — audita o historico. */
  commissionPercent: z.number(),
  source: z.literal("welcome_survey"),
});

export type PartnerReferral = z.infer<typeof PartnerReferralSchema>;

/** Registro do aceite, gravado em User/{matricula}/Partner_Consent/current. */
export const PartnerConsentRecordSchema = z.object({
  version: z.string(),
  documentId: z.string(),
  signedName: z.string(),
  acceptedIds: z.array(z.string()),
  signedAt: z.string(),
});

export type PartnerConsentRecord = z.infer<typeof PartnerConsentRecordSchema>;
