"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { requireMatricula } from "@/lib/auth-guards";
import { PRODUCTS_COLLECTION, USER_ORDERS_COLLECTION, USER_COLLECTION } from "@/config/collections";
import { Product } from "@/types/products";
import { generateContractPdf } from "@/actions/legal";
import { buildContractClauses, ContractClause } from "@/lib/contract-content";
import { ContractStatus } from "@/types/contracts";
import { getErrorMessage } from "@/lib/utils/errors";

/**
 * Assinatura de contrato PÓS-CHECKOUT (CT-3b.2, ver CONTRACTS-DESIGN.md §10).
 *
 * O contrato é lido e assinado DEPOIS de concluir o checkout (grátis E pago), na tela
 * `/hub/checkout/success`. Espelha o fluxo do contrato avulso (`avulso-contract.ts`),
 * mas keyed por `orderId` (a order já existe) em vez de token de uso único:
 * - grátis: order nasce `approved` -> assina na hora;
 * - pago: só libera a assinatura quando a order estiver `approved` (confirmação do MP);
 * - idempotente: se o contrato do serviço já está `assinado`, devolve o documento.
 *
 * As cláusulas vêm da fonte única `buildContractClauses` (mesmo texto do PDF), e a
 * geração do PDF com validade jurídica (IP + timestamp) reusa `generateContractPdf`
 * com `origin: "checkout"`.
 */

/** Status de pagamento da order que liberam a assinatura (order "concluída"). */
const APPROVED_ORDER_STATUSES = ["approved", "active", "completed", "accredited"];

/**
 * Rótulo humano do meio de contratação (espelha `friendlyGateway` de `legal.ts`, que
 * não pode ser exportado por ser módulo "use server"). Mantém a tela == PDF.
 */
function friendlyGateway(gateway?: string): string {
  switch (gateway) {
    case "retroactive_bypass":
      return "Faturamento Interno (Avulso)";
    case "bplen_free_bypass":
      return "Cortesia / Cupom BPlen";
    default:
      return "Pagamento Online";
  }
}

/** Id determinístico do contrato por serviço (mesmo do generateContractPdf/CT-1). */
function contractIdFor(serviceCode: string | null | undefined, slug: string | null | undefined, id: string): string {
  return String(serviceCode || slug || id).replace(/[^a-zA-Z0-9._-]/g, "_");
}

interface OrderDoc {
  matricula?: string;
  userId?: string;
  productId?: string;
  productSlug?: string | null;
  productTitle?: string | null;
  finalPrice?: number;
  gateway?: string;
  status?: string;
}

export interface CheckoutContractResolution {
  valid: boolean;
  /** Motivo do bloqueio quando `valid` é false. */
  reason?: "auth" | "not_found" | "wrong_account";
  product?: { slug: string | null; title: string | null; serviceCode: string | null; price: number };
  clauses?: ContractClause[];
  documentTitle?: string;
  /** Status de pagamento da order (define se já pode assinar — pago pendente aguarda). */
  orderApproved?: boolean;
  /** Status atual do contrato (idempotência: se já assinado, mostra o documento). */
  contractStatus?: ContractStatus | null;
  documentUrl?: string | null;
}

/**
 * Carrega order + produto + dono. Fonte única de validação usada tanto pelo preview
 * quanto pela assinatura. `requireMatricula` garante login com matrícula.
 */
async function loadOrderForCaller(orderId: string, callerMatricula: string, callerUid: string) {
  const db = getAdminDb();
  const orderSnap = await db.collection(USER_ORDERS_COLLECTION).doc(orderId).get();
  if (!orderSnap.exists) return { ok: false as const, reason: "not_found" as const };

  const order = (orderSnap.data() ?? {}) as OrderDoc;
  // Trava de dono: a order tem de pertencer à conta logada (matrícula soberana; uid
  // como reforço). Impede assinar/gerar contrato de order de outra pessoa via orderId.
  const belongs = order.matricula === callerMatricula || (!!order.userId && order.userId === callerUid);
  if (!belongs) return { ok: false as const, reason: "wrong_account" as const };

  return { ok: true as const, db, order };
}

/**
 * CLIENTE — resolve a order para exibir as cláusulas e o estado do contrato na tela de
 * sucesso. Não gera nada. `requireMatricula` + trava de dono.
 */
export async function resolveCheckoutContractAction(
  orderId: string,
  idToken?: string
): Promise<CheckoutContractResolution> {
  try {
    const session = await requireMatricula(idToken);
    const matricula = session.matricula as string;
    const loaded = await loadOrderForCaller(orderId, matricula, session.uid);
    if (!loaded.ok) return { valid: false, reason: loaded.reason };

    const { db, order } = loaded;
    const productKey = order.productId || order.productSlug || "";

    // Produto — coleção canônica `products` (por id, com fallback por slug).
    let productDoc = productKey ? await db.collection(PRODUCTS_COLLECTION).doc(productKey).get() : null;
    if ((!productDoc || !productDoc.exists) && order.productSlug) {
      const bySlug = await db.collection(PRODUCTS_COLLECTION).where("slug", "==", order.productSlug).limit(1).get();
      if (!bySlug.empty) productDoc = bySlug.docs[0];
    }
    const product = productDoc && productDoc.exists ? (productDoc.data() as Product) : null;

    // Dados do contratante — fonte canônica `User/{matricula}.profile` (F0-03).
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

    const price = order.finalPrice ?? product?.price ?? 0;
    const orderAmount = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);

    // Cláusulas renderizadas ANTES de assinar (o cliente lê o que vai assinar).
    const content = product
      ? buildContractClauses({
          product,
          dados: { fullName: profile.fullName || "", cpf: profile.cpf || "", address: addressStr },
          matricula,
          orderAmount,
          orderMethod: friendlyGateway(order.gateway),
        })
      : null;

    // Estado atual do contrato (idempotência) — id determinístico por serviço.
    const contractId = contractIdFor(product?.serviceCode, product?.slug ?? order.productSlug, productKey);
    const contractSnap = contractId
      ? await db.collection(USER_COLLECTION).doc(matricula).collection("Contracts").doc(contractId).get()
      : null;
    const contract = contractSnap && contractSnap.exists ? contractSnap.data() : null;

    return {
      valid: true,
      product: {
        slug: product?.slug ?? order.productSlug ?? null,
        title: product?.title ?? order.productTitle ?? null,
        serviceCode: product?.serviceCode ?? null,
        price,
      },
      clauses: content?.clauses ?? [],
      documentTitle: content?.documentTitle ?? "TERMO E FORMALIZAÇÃO DE PRESTAÇÃO DE SERVIÇO",
      orderApproved: APPROVED_ORDER_STATUSES.includes(String(order.status)),
      contractStatus: (contract?.status as ContractStatus) ?? null,
      documentUrl: (contract?.documentUrl as string) ?? null,
    };
  } catch {
    // requireMatricula lança se não logado / sem matrícula.
    return { valid: false, reason: "auth" };
  }
}

export interface CheckoutContractSignResult {
  success: boolean;
  error?: string;
  documentUrl?: string | null;
}

/**
 * CLIENTE — assina o contrato pós-checkout: valida dono + order aprovada, gera o PDF
 * (origin "checkout") e registra os termos aceitos. Não cria order (já existe) nem
 * consome token (o fluxo de checkout não usa token, diferente do avulso).
 */
export async function signCheckoutContractAction(
  orderId: string,
  idToken?: string,
  acceptedTerms: string[] = []
): Promise<CheckoutContractSignResult> {
  try {
    const session = await requireMatricula(idToken);
    const matricula = session.matricula as string;

    const { checkRateLimit, RATE_LIMITS } = await import("@/lib/rate-limit");
    const rateCheck = await checkRateLimit({ action: "checkout", uid: session.uid, windowSeconds: RATE_LIMITS.CHECKOUT.windowSeconds });
    if (!rateCheck.allowed) {
      return { success: false, error: `Aguarde ${rateCheck.retryAfterSeconds}s antes de tentar novamente.` };
    }

    const loaded = await loadOrderForCaller(orderId, matricula, session.uid);
    if (!loaded.ok) {
      return {
        success: false,
        error: loaded.reason === "not_found" ? "Pedido não encontrado." : "Este pedido pertence a outra conta.",
      };
    }

    const { db, order } = loaded;
    // Só assina depois de o checkout concluir: grátis nasce aprovado; pago aguarda a
    // confirmação do Mercado Pago (decisão da Gestora — Cláusula 4 cita a quitação).
    if (!APPROVED_ORDER_STATUSES.includes(String(order.status))) {
      return { success: false, error: "Pagamento ainda não confirmado. Aguarde a aprovação para assinar o contrato." };
    }

    const productKey = order.productId || order.productSlug || "";
    if (!productKey) return { success: false, error: "Serviço do pedido não identificado." };

    // Gera o PDF e vira o Contract para `assinado` (CT-1), com IP/timestamp reais.
    const pdfResult = await generateContractPdf(session.uid, productKey, orderId, "checkout");
    if (!pdfResult.success) {
      console.error(`[Checkout Contract] Falha ao gerar PDF para ${session.uid}:`, pdfResult.error);
      return { success: false, error: `Falha ao gerar o contrato: ${pdfResult.error}` };
    }

    // Registra os termos aceitos — merge deep no map `signature` (não apaga
    // signedAt/ip/userAgent gravados pelo generateContractPdf). Id determinístico
    // por serviço, igual ao usado pelo generateContractPdf.
    const productDoc = productKey ? await db.collection(PRODUCTS_COLLECTION).doc(productKey).get() : null;
    const product = productDoc && productDoc.exists ? (productDoc.data() as Product) : null;
    const contractId = contractIdFor(product?.serviceCode, product?.slug ?? order.productSlug, productKey);
    if (contractId) {
      await db.collection(USER_COLLECTION).doc(matricula).collection("Contracts").doc(contractId)
        .set({ signature: { acceptedTerms } }, { merge: true });
    }

    console.log(`[Checkout Contract] Contrato assinado por ${session.email} (${matricula}) — order ${orderId}`);
    return { success: true, documentUrl: pdfResult.url };
  } catch (error: unknown) {
    console.error("[Checkout Contract Error]:", error);
    return { success: false, error: getErrorMessage(error, "Erro interno ao processar contrato.") };
  }
}
