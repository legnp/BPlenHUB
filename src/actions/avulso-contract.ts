"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin, requireMatricula } from "@/lib/auth-guards";
import { PRODUCTS_COLLECTION, USER_ORDERS_COLLECTION, USER_COLLECTION } from "@/config/collections";
import { Product } from "@/types/products";
import { generateContractPdf } from "@/actions/legal";
import { buildContractClauses } from "@/lib/contract-content";
import { FieldValue } from "firebase-admin/firestore";
import crypto from "crypto";

/**
 * Contrato retroativo — fluxo robusto (CT-2, ver docs/system-audit/CONTRACTS-DESIGN.md).
 *
 * (a) O admin gera um link a partir de `admin/users`; se já existe contrato ASSINADO do
 *     mesmo serviço para o cliente, a action exige confirmação (retificação) antes de
 *     prosseguir — evita contrato duplicado.
 * (b) O link é **vinculado à matrícula** do cliente: só a conta liberada (logada) resolve
 *     e assina o contrato — não por outro e-mail, nem deslogado.
 * (c) Cada link é **único e de uso único**: um token aleatório mapeia para o contrato via
 *     `_ContractTokens/{sha256(token)}` e é **consumido** na assinatura.
 */

const CONTRACT_TOKENS_COLLECTION = "_ContractTokens";
const TOKEN_TTL_DAYS = 30;

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/** Id determinístico do contrato por serviço (mesmo do generateContractPdf/CT-1). */
function contractIdFor(serviceCode: string | null, slug: string | null | undefined, id: string): string {
  return String(serviceCode || slug || id).replace(/[^a-zA-Z0-9._-]/g, "_");
}

interface ContractTokenDoc {
  matricula?: string;
  serviceCode?: string | null;
  contractId?: string;
  productId?: string;
  productSlug?: string | null;
  productTitle?: string | null;
  consumed?: boolean;
  expiresAt?: string;
  status?: string;
}

type TokenValidation =
  | {
      ok: true;
      data: {
        matricula: string;
        productId: string;
        productSlug: string | null;
        productTitle: string | null;
        serviceCode: string | null;
        contractId: string;
      };
    }
  | { ok: false; reason: "invalid" | "consumed" | "expired" | "wrong_account" };

async function validateToken(
  db: FirebaseFirestore.Firestore,
  tokenHash: string,
  callerMatricula: string
): Promise<TokenValidation> {
  const snap = await db.collection(CONTRACT_TOKENS_COLLECTION).doc(tokenHash).get();
  if (!snap.exists) return { ok: false, reason: "invalid" };
  const d = (snap.data() ?? {}) as ContractTokenDoc;
  if (d.consumed) return { ok: false, reason: "consumed" };
  if (d.expiresAt && new Date(d.expiresAt).getTime() < Date.now()) return { ok: false, reason: "expired" };
  if (d.matricula !== callerMatricula) return { ok: false, reason: "wrong_account" };
  return {
    ok: true,
    data: {
      matricula: d.matricula ?? callerMatricula,
      productId: d.productId ?? "",
      productSlug: d.productSlug ?? null,
      productTitle: d.productTitle ?? null,
      serviceCode: d.serviceCode ?? null,
      contractId: d.contractId ?? "",
    },
  };
}

export interface AvulsoInvitationResult {
  success: boolean;
  /** Já existe contrato assinado — reenviar com confirmRetification=true para retificar. */
  needsConfirmation?: boolean;
  message?: string;
  error?: string;
  /** Token cru (aparece apenas uma vez, no link). */
  token?: string;
  /** Caminho relativo do link único a copiar. */
  path?: string;
  status?: string;
}

/**
 * ADMIN — gera um link único de contrato retroativo para {matricula, produto}.
 * Retorna `needsConfirmation` se já houver contrato assinado (item a).
 */
export async function createAvulsoContractInvitationAction(
  matricula: string,
  productId: string,
  confirmRetification: boolean = false
): Promise<AvulsoInvitationResult> {
  try {
    await requireAdmin();
    const db = getAdminDb();

    // Produto — coleção canônica `products` (por id, com fallback por slug).
    let productDoc = await db.collection(PRODUCTS_COLLECTION).doc(productId).get();
    if (!productDoc.exists) {
      const bySlug = await db.collection(PRODUCTS_COLLECTION).where("slug", "==", productId).limit(1).get();
      if (!bySlug.empty) productDoc = bySlug.docs[0];
    }
    if (!productDoc.exists) return { success: false, error: "Produto não encontrado." };
    const product = productDoc.data() as Product;
    const serviceCode = product.serviceCode ?? null;
    const contractId = contractIdFor(serviceCode, product.slug, productDoc.id);

    // (a) Aviso de duplicidade — contrato já assinado exige confirmação de retificação.
    const contractRef = db.collection(USER_COLLECTION).doc(matricula).collection("Contracts").doc(contractId);
    const existing = await contractRef.get();
    const alreadySigned = existing.exists && existing.data()?.status === "assinado";
    if (alreadySigned && !confirmRetification) {
      return {
        success: false,
        needsConfirmation: true,
        message: `Já existe um contrato ASSINADO de "${product.title}" para este cliente. Gerar um novo link inicia uma RETIFICAÇÃO do contrato existente.`,
      };
    }

    const status = alreadySigned ? "em_retificacao" : "pendente_assinatura";

    // Contract em pendente/retificação (base do painel — CT-4). Preserva createdAt/assinatura.
    await contractRef.set(
      {
        contractId,
        matricula,
        serviceCode,
        productSlug: product.slug ?? null,
        productTitle: product.title ?? null,
        status,
        origin: "avulso",
        updatedAt: FieldValue.serverTimestamp(),
        ...(existing.exists
          ? {}
          : { createdAt: FieldValue.serverTimestamp(), documentUrl: null, documentHash: null, orderId: null, signature: null }),
      },
      { merge: true }
    );

    // (c) Token único de uso único (lookup por hash, sem índice).
    const rawToken = crypto.randomBytes(24).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
    await db.collection(CONTRACT_TOKENS_COLLECTION).doc(tokenHash).set({
      matricula,
      serviceCode,
      contractId,
      productId: productDoc.id,
      productSlug: product.slug ?? null,
      productTitle: product.title ?? null,
      consumed: false,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: expiresAt.toISOString(),
      status,
    });

    return { success: true, token: rawToken, path: `/contrato-avulso/${rawToken}`, status };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao gerar link de contrato.";
    console.error("❌ [Retroactive Invitation]:", error);
    return { success: false, error: msg };
  }
}

/**
 * CLIENTE — resolve o token para exibir o resumo do contrato. Exige login na conta
 * liberada (matrícula do token === matrícula da sessão). Não consome o token.
 */
export async function resolveAvulsoContractTokenAction(token: string, idToken?: string) {
  try {
    const session = await requireMatricula(idToken);
    const matricula = session.matricula as string;
    const db = getAdminDb();
    const v = await validateToken(db, hashToken(token), matricula);
    if (!v.ok) return { valid: false as const, reason: v.reason };

    // Preço/título atuais para o resumo.
    const productDoc = await db.collection(PRODUCTS_COLLECTION).doc(v.data.productId).get();
    const p = productDoc.exists ? (productDoc.data() as Product) : null;

    // Dados do contratante para preencher as cláusulas (mesma fonte do PDF — CT-3a).
    const userDoc = await db.collection(USER_COLLECTION).doc(matricula).get();
    const profile = (userDoc.data()?.profile ?? {}) as {
      fullName?: string;
      cpf?: string;
      address?: { street?: string; number?: string; complement?: string; city?: string; state?: string; cep?: string };
    };
    const addr = profile.address ?? {};
    const addressStr = [addr.street, addr.number, addr.complement, addr.city, addr.state, addr.cep]
      .filter(Boolean)
      .join(", ") || "endereço cadastrado na plataforma";
    const price = p?.price ?? 0;
    const orderAmount = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);

    // Cláusulas renderizadas na tela ANTES de assinar (o cliente lê o que vai assinar).
    const content = p
      ? buildContractClauses({
          product: p,
          dados: { fullName: profile.fullName || "", cpf: profile.cpf || "", address: addressStr },
          matricula,
          orderAmount,
          orderMethod: "Faturamento Interno (Avulso)",
        })
      : null;

    return {
      valid: true as const,
      product: {
        slug: v.data.productSlug,
        title: p?.title ?? v.data.productTitle,
        serviceCode: v.data.serviceCode,
        price,
      },
      clauses: content?.clauses ?? [],
      documentTitle: content?.documentTitle ?? "TERMO E FORMALIZAÇÃO DE PRESTAÇÃO DE SERVIÇO",
    };
  } catch {
    // requireMatricula lança se não logado / sem matrícula -> a página pede login.
    return { valid: false as const, reason: "auth" as const };
  }
}

/**
 * CLIENTE — processa a assinatura do contrato retroativo a partir do token.
 * Valida vínculo à conta + uso único, cria a ordem, gera o PDF e CONSOME o token.
 */
export async function processAvulsoContractAction(token: string, idToken?: string, acceptedTerms: string[] = []) {
  try {
    const session = await requireMatricula(idToken);

    const { checkRateLimit, RATE_LIMITS } = await import("@/lib/rate-limit");
    const rateCheck = await checkRateLimit({ action: "checkout", uid: session.uid, windowSeconds: RATE_LIMITS.CHECKOUT.windowSeconds });
    if (!rateCheck.allowed) {
      return { success: false, error: `Aguarde ${rateCheck.retryAfterSeconds}s antes de tentar novamente.` };
    }

    const db = getAdminDb();
    const tokenHash = hashToken(token);
    const matricula = session.matricula as string;
    const v = await validateToken(db, tokenHash, matricula);
    if (!v.ok) {
      const map: Record<typeof v.reason, string> = {
        invalid: "Link inválido.",
        consumed: "Este contrato já foi assinado.",
        expired: "Link expirado. Solicite um novo à BPlen.",
        wrong_account: "Este contrato foi liberado para outra conta.",
      };
      return { success: false, error: map[v.reason] };
    }

    const productId = v.data.productId;
    const productDoc = await db.collection(PRODUCTS_COLLECTION).doc(productId).get();
    const product = (productDoc.exists ? productDoc.data() : {}) as Product;

    // Ordem retroativa (User_Orders).
    const slugForId = String(product.slug || v.data.productSlug || productId).toUpperCase().substring(0, 10);
    const orderId = `BPLEN-RETRO-${matricula}-${slugForId}-${Date.now()}`;
    await db.collection(USER_ORDERS_COLLECTION).doc(orderId).set({
      orderId,
      userId: session.uid,
      matricula,
      userEmail: session.email || "",
      productId,
      productSlug: product.slug || v.data.productSlug,
      productTitle: product.title || v.data.productTitle,
      productKicker: product.kicker || "",
      basePrice: product.price || 0,
      couponCode: null,
      appliedDiscount: 0,
      finalPrice: product.price || 0,
      currency: "BRL",
      status: "approved",
      statusDetail: "retroactive",
      gateway: "retroactive_bypass",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Gera o PDF e vira o Contract para `assinado` (CT-1).
    const pdfResult = await generateContractPdf(session.uid, productId, orderId, "avulso");
    if (!pdfResult.success) {
      console.error(`❌ [Retroactive Contract] Falha ao gerar PDF para ${session.uid}:`, pdfResult.error);
      return { success: false, error: `Ordem criada, mas falha ao gerar PDF: ${pdfResult.error}` };
    }

    // Registra quais termos (checkboxes) foram aceitos na assinatura — merge deep no
    // map `signature` (não apaga signedAt/ip/userAgent gravados pelo generateContractPdf).
    if (v.data.contractId) {
      await db.collection(USER_COLLECTION).doc(matricula).collection("Contracts").doc(v.data.contractId)
        .set({ signature: { acceptedTerms } }, { merge: true });
    }

    // (c) Consome o token — uso único.
    await db.collection(CONTRACT_TOKENS_COLLECTION).doc(tokenHash).update({
      consumed: true,
      consumedAt: FieldValue.serverTimestamp(),
    });

    // Registra o aceite no doc de permissões.
    const userAccessRef = db.doc(`User/${matricula}/User_Permissions/access`);
    const accessSnap = await userAccessRef.get();
    if (accessSnap.exists) {
      await userAccessRef.update({
        legalConsentGiven: true,
        legalConsentTimestamp: FieldValue.serverTimestamp(),
      });
    }

    console.log(`✅ [Retroactive Contract] Contrato assinado por ${session.email} (${matricula}) — ${product.title}`);
    return { success: true, productTitle: product.title || v.data.productTitle, orderId, documentUrl: pdfResult.url };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro interno ao processar contrato.";
    console.error("❌ [Retroactive Contract Error]:", error);
    return { success: false, error: errorMessage };
  }
}
