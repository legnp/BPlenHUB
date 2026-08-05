"use server";

import * as admin from "firebase-admin";
import { requireAuth } from "@/lib/auth-guards";
import { getAdminDb } from "@/lib/firebase-admin";
import { findMatriculaByIdentity } from "@/lib/identity/find-matricula";
import { captureRequestProof } from "@/lib/request-proof";
import {
  PartnerTermsDocument,
  PartnerTermsDocumentSchema,
  PartnerConsentRecord,
} from "@/types/partners";
import {
  PartnerTermsContext,
  resolveTermsForPartner,
} from "@/lib/partners/terms-template";

/**
 * BPlen HUB — Termo de Parceria (leitura do documento e registro do aceite).
 *
 * Espelha `src/actions/consent.ts`, com versao propria: identidade SEMPRE da sessao
 * verificada (nunca de parametro do cliente — Licao 44), aceite versionado, prova de
 * requisicao capturada e trilha append-only para auditoria.
 *
 * O documento vive em `Settings/PartnerTerms/documents/{documentId}` para que o
 * conteudo (texto e caixas de aceite) seja publicado sem passar por codigo. Enquanto
 * nao existir documento publicado, a parada exibe o estado "documento em preparacao"
 * e nao permite concluir — resiliente por construcao, como a Gestora pediu.
 */

const DEFAULT_TERMS_DOCUMENT_ID = "formalizacao-parceria";

function termsDocPath(documentId: string): string {
  return `Settings/PartnerTerms/documents/${documentId}`;
}

/**
 * Dados do parceiro que alimentam o termo: quem ele e', qual a taxa dele e quais blocos
 * condicionais se aplicam.
 *
 * `isCommercial` sai da propria taxa (parceria remunerada = tem percentual), e
 * `hasPublicShowcase` do selo de vitrine concedido pelo Admin. Nenhum dos dois e'
 * decidido na tela — sao dado.
 */
async function buildTermsContext(matricula: string): Promise<PartnerTermsContext> {
  const db = getAdminDb();
  const [userSnap, accessSnap, formSnap] = await Promise.all([
    db.doc(`User/${matricula}`).get(),
    db.doc(`User/${matricula}/User_Permissions/access`).get(),
    db.doc(`User/${matricula}/Forms/partner_dados_cadastrais`).get(),
  ]);

  const user = userSnap.data() || {};
  const access = accessSnap.data() || {};
  const form = (formSnap.data()?.responses || {}) as Record<string, string>;

  const commissionPercent =
    typeof access.partnerCommissionPercent === "number" ? access.partnerCommissionPercent : 0;

  const isPJ = form.partner_type === "PJ";
  const endereco = isPJ
    ? [form.company_rua, form.company_numero, form.company_bairro, form.company_cidade, form.company_uf]
    : [form.rua, form.numero, form.bairro, form.cidade, form.uf];

  return {
    partnerName: isPJ
      ? form.razao_social || String(user.Authentication_Name || "")
      : form.full_name || String(user.Authentication_Name || user.User_Name || ""),
    partnerDocument: isPJ ? form.cnpj || "" : form.cpf || "",
    partnerAddress: endereco.filter(Boolean).join(", "),
    partnerMatricula: matricula,
    commissionPercent,
    isCommercial: commissionPercent > 0,
    hasPublicShowcase: access.services?.partner_public_showcase === true,
  };
}

/** Documento vigente + o aceite ja registrado deste parceiro, se houver. */
export async function getPartnerTermsAction(documentId?: string): Promise<{
  document: PartnerTermsDocument | null;
  consent: PartnerConsentRecord | null;
}> {
  try {
    const session = await requireAuth();
    const docId = documentId?.trim() || DEFAULT_TERMS_DOCUMENT_ID;
    const db = getAdminDb();

    const snap = await db.doc(termsDocPath(docId)).get();
    const parsed = snap.exists ? PartnerTermsDocumentSchema.safeParse(snap.data()) : null;
    const document = parsed?.success ? parsed.data : null;

    if (snap.exists && parsed && !parsed.success) {
      console.error("[partner-consent] Documento de termo com formato invalido:", docId);
    }

    const matricula = await findMatriculaByIdentity(session.uid, session.email || undefined);
    if (!matricula) return { document, consent: null };

    // O termo exibido e' o DESTE parceiro: blocos condicionais resolvidos e marcadores
    // preenchidos com o cadastro dele (ver `lib/partners/terms-template.ts`). Assim o
    // texto assinado nunca diverge do que o sistema pratica.
    const documentForPartner = document
      ? resolveTermsForPartner(document, await buildTermsContext(matricula))
      : null;

    const consentSnap = await db.doc(`User/${matricula}/Partner_Consent/current`).get();
    const consentData = consentSnap.exists ? (consentSnap.data() as PartnerConsentRecord) : null;

    // O aceite so vale para a versao vigente do documento (mesma regra do consentimento
    // de conta: mudou a versao, reaceita).
    const consent =
      consentData && document && consentData.version === document.version ? consentData : null;

    return { document: documentForPartner, consent };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[partner-consent] Falha ao ler o termo de parceria:", message);
    return { document: null, consent: null };
  }
}

/** Registra a assinatura do termo. Recusa se faltar aceite obrigatorio ou assinatura. */
export async function recordPartnerTermsAcceptanceAction(input: {
  documentId?: string;
  signedName: string;
  acceptedIds: string[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireAuth();
    const docId = input.documentId?.trim() || DEFAULT_TERMS_DOCUMENT_ID;
    const db = getAdminDb();

    const snap = await db.doc(termsDocPath(docId)).get();
    const parsed = snap.exists ? PartnerTermsDocumentSchema.safeParse(snap.data()) : null;
    if (!parsed?.success || !parsed.data.published) {
      return { success: false, error: "O termo desta etapa ainda não está disponível para assinatura." };
    }
    const document = parsed.data;

    const signedName = input.signedName.trim();
    if (signedName.length < 3) {
      return { success: false, error: "Digite seu nome completo para assinar." };
    }

    // Revalidacao no SERVIDOR dos aceites obrigatorios — a checagem da tela e' conforto,
    // esta e' a que vale.
    const missing = document.acceptances
      .filter((a) => a.required)
      .filter((a) => !input.acceptedIds.includes(a.id));
    if (missing.length > 0) {
      return { success: false, error: "Marque todos os aceites obrigatórios para assinar." };
    }

    const matricula = await findMatriculaByIdentity(session.uid, session.email || undefined);
    if (!matricula) {
      return { success: false, error: "Não foi possível identificar a sua conta. Recarregue a página." };
    }

    const proof = await captureRequestProof();
    const record = {
      version: document.version,
      documentId: docId,
      signedName,
      acceptedIds: input.acceptedIds,
      signedAt: new Date().toISOString(),
      acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
      ip: proof.ip,
      userAgent: proof.userAgent,
      deviceType: proof.deviceType,
      geo: proof.geo,
    };

    await db.doc(`User/${matricula}/Partner_Consent/current`).set(record, { merge: true });
    await db.collection(`User/${matricula}/Partner_Consent_History`).add(record);

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[partner-consent] Falha ao registrar a assinatura do termo:", message);
    return { success: false, error: "Não foi possível registrar a assinatura agora. Tente novamente." };
  }
}
