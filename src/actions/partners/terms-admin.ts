"use server";

import { requireAdmin } from "@/lib/auth-guards";
import { getAdminDb } from "@/lib/firebase-admin";
import { PartnerTermsDocument, PartnerTermsDocumentSchema } from "@/types/partners";

/**
 * BPlen HUB — edicao do termo de parceria (admin).
 *
 * O texto do termo vive no banco, nao no codigo: a Gestora publica e revisa sem deploy.
 * O modelo oficial fica em `src/lib/partners/terms-template.ts` apenas como ponto de
 * partida carregavel pela tela.
 *
 * Publicar e' ato explicito e separado de salvar — rascunho nao vira contrato por
 * distracao. E mudar a VERSAO invalida o aceite anterior: quem ja assinou reassina, que
 * e' a mesma regra do consentimento de conta.
 */

const DEFAULT_TERMS_DOCUMENT_ID = "formalizacao-parceria";

function termsDocPath(documentId: string): string {
  return `Settings/PartnerTerms/documents/${documentId}`;
}

/** Documento CRU (sem resolver blocos nem marcadores) — e' o que a tela edita. */
export async function getPartnerTermsAdminAction(
  documentId?: string,
  adminToken?: string
): Promise<{ document: PartnerTermsDocument | null; signedCount: number }> {
  try {
    await requireAdmin(adminToken);
    const docId = documentId?.trim() || DEFAULT_TERMS_DOCUMENT_ID;
    const snap = await getAdminDb().doc(termsDocPath(docId)).get();

    if (!snap.exists) return { document: null, signedCount: 0 };

    const parsed = PartnerTermsDocumentSchema.safeParse(snap.data());
    if (!parsed.success) {
      console.error("[partner-terms] Documento com formato invalido:", docId);
      return { document: null, signedCount: 0 };
    }

    // Quantos parceiros ja assinaram a versao vigente — o numero que pesa na decisao de
    // trocar a versao (todos eles reassinam).
    const assinaturas = await getAdminDb()
      .collectionGroup("Partner_Consent")
      .where("documentId", "==", docId)
      .where("version", "==", parsed.data.version)
      .get()
      .catch(() => null);

    return { document: parsed.data, signedCount: assinaturas?.size ?? 0 };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[partner-terms] Falha ao ler o termo para edicao:", message);
    return { document: null, signedCount: 0 };
  }
}

/** Salva o termo. `published` decide se ele ja vale para assinatura. */
export async function savePartnerTermsAdminAction(
  input: { documentId?: string; document: PartnerTermsDocument },
  adminToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin(adminToken);
    const docId = input.documentId?.trim() || DEFAULT_TERMS_DOCUMENT_ID;

    const parsed = PartnerTermsDocumentSchema.safeParse(input.document);
    if (!parsed.success) {
      return { success: false, error: "O termo está com campos inválidos. Revise antes de salvar." };
    }
    const document = parsed.data;

    if (!document.version.trim()) {
      return { success: false, error: "Informe a versão do termo." };
    }
    if (!document.title.trim()) {
      return { success: false, error: "Informe o título do termo." };
    }

    // Publicar sem texto ou sem aceite obrigatorio produziria um contrato vazio, que a
    // tela do parceiro aceitaria assinar. Recusa explicita.
    if (document.published) {
      const temTexto = document.sections.some((s) => s.body.trim().length > 0);
      if (!temTexto) {
        return { success: false, error: "Não é possível publicar um termo sem nenhum texto." };
      }
      if (!document.acceptances.some((a) => a.required)) {
        return {
          success: false,
          error: "Um termo publicado precisa de ao menos um aceite obrigatório.",
        };
      }
      const idsRepetidos = new Set(document.acceptances.map((a) => a.id)).size !== document.acceptances.length;
      if (idsRepetidos) {
        return { success: false, error: "Há aceites com o mesmo identificador. Cada um precisa ser único." };
      }
    }

    await getAdminDb().doc(termsDocPath(docId)).set(document, { merge: false });
    console.log(`[partner-terms] Termo "${docId}" salvo (versao ${document.version}, publicado: ${document.published}).`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[partner-terms] Falha ao salvar o termo:", message);
    return { success: false, error: "Nao foi possivel salvar o termo agora." };
  }
}
