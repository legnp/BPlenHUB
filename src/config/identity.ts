/**
 * BPlen HUB — Identidade confidencial (fonte única)
 *
 * E-mails internos/Master que NUNCA podem aparecer na interface do cliente
 * (regra crítica do CLAUDE.md). Usado tanto pelo guard de auto-grant de admin
 * (`auth-permissions.ts`) quanto pela máscara de exibição (`lib/identity-mask.ts`),
 * para que exista UMA lista só — evita que um e-mail novo seja adicionado num
 * lugar e vaze no outro.
 */
export const MASTER_EMAILS: readonly string[] = [
  "lisandra.lencina@bplen.com",
  "it@bplen.com",
  "legnp@bplen.com",
];

/** Texto público exibido no lugar de um e-mail/identidade interna. */
export const PUBLIC_CONTACT_ALIAS = "Consultoria BPlen";
