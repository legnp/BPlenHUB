import { MASTER_EMAILS, PUBLIC_CONTACT_ALIAS } from "@/config/identity";

/**
 * BPlen HUB — Máscara de identidade interna (defesa de exibição)
 *
 * Regra crítica: e-mails internos/Master nunca podem aparecer para o cliente.
 * Este helper é a última linha de defesa na CAMADA DE EXIBIÇÃO — deve ser
 * aplicado em qualquer texto vindo de dados que possa conter um desses e-mails
 * (ex.: autor de feedback, notas), inclusive dados legados já gravados.
 * A correção da FONTE (não gravar o e-mail) é feita à parte nas actions.
 */
export function maskInternalContact(text: string | null | undefined): string {
  if (!text) return text ?? "";
  let out = text;
  for (const email of MASTER_EMAILS) {
    const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(escaped, "gi"), PUBLIC_CONTACT_ALIAS);
  }
  return out;
}
