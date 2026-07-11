"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { requireMatricula } from "@/lib/auth-guards";
import { USER_ORDERS_COLLECTION, USER_COLLECTION } from "@/config/collections";
import { Contract } from "@/types/contracts";
import { getErrorMessage } from "@/lib/utils/errors";

/**
 * Painel de contratos do membro (CT-4, ver docs/system-audit/CONTRACTS-DESIGN.md).
 *
 * 1 card por SERVIÇO/pacote, unindo `User_Orders` (trilha de pagamento) com
 * `User/{matricula}/Contracts` (status de assinatura + documento + carimbo + nota fiscal).
 * Os dois fluxos são espelhados: checkout pendente = pedido aprovado SEM contrato assinado;
 * avulso pendente = contrato (pendente) SEM pedido ainda. Por isso a união por serviço.
 *
 * Só leitura, com trava de dono (`requireMatricula`). Não altera o gate de liberação
 * (PR #60) — apenas reflete o estado real (nada de "serviço liberado" hardcoded).
 */

type CardState =
  | "aguardando_pagamento"
  | "aguardando_assinatura"
  | "assinado"
  | "cancelado";

export interface ContractCard {
  serviceKey: string;
  productTitle: string;
  productSlug: string | null;
  serviceCode: string | null;
  /** Pedido representativo (se houver). */
  orderId: string | null;
  origin: string | null;
  paymentStatus: string | null;
  finalPrice: number | null;
  purchaseDate: string | null;
  serviceReleased: boolean;
  /** Contrato (se houver). */
  contractStatus: string | null;
  signedAt: string | null;
  documentFileId: string | null;
  verificationCode: string | null;
  geoLocation: string | null;
  invoiceUrl: string | null;
  /** Estado derivado para a UI. */
  cardState: CardState;
  /** True quando o pendente é de checkout (tem pedido) e pode assinar pela tela de sucesso. */
  canSignInApp: boolean;
}

const APPROVED_ORDER_STATUSES = ["approved", "active", "completed", "accredited"];

interface OrderLite {
  orderId?: string;
  productId?: string;
  productSlug?: string | null;
  productTitle?: string | null;
  finalPrice?: number;
  status?: string;
  gateway?: string;
  serviceReleased?: boolean;
  createdAt?: unknown;
}

/** Extrai o fileId do Google Drive a partir do webViewLink gravado no contrato. */
function extractDriveFileId(url: string | null | undefined): string | null {
  if (!url) return null;
  const patterns = [/\/file\/d\/([a-zA-Z0-9_-]+)/, /[?&]id=([a-zA-Z0-9_-]+)/, /\/d\/([a-zA-Z0-9_-]+)/];
  for (const re of patterns) {
    const m = url.match(re);
    if (m && m[1]) return m[1];
  }
  return null;
}

/** String legível do geo (cidade/região, país) a partir do registro de assinatura. */
function geoToString(geo?: { city?: string; region?: string; country?: string }): string | null {
  if (!geo) return null;
  const cityRegion = [geo.city, geo.region].filter(Boolean).join("/");
  const s = [cityRegion, geo.country].filter(Boolean).join(", ");
  return s || null;
}

/** ISO seguro de um timestamp Firestore serializado/objeto. */
function toIso(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object" && v !== null && "toDate" in v && typeof (v as { toDate: unknown }).toDate === "function") {
    try {
      return (v as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return null;
    }
  }
  return null;
}

export async function getMemberContractsPanelAction(
  idToken?: string
): Promise<{ success: boolean; cards?: ContractCard[]; error?: string }> {
  try {
    const session = await requireMatricula(idToken);
    const matricula = session.matricula as string;
    const db = getAdminDb();

    // Pedidos do membro (matrícula + uid, dedup por orderId — mesma cobertura do painel atual).
    const orderQueries = [
      db.collection(USER_ORDERS_COLLECTION).where("matricula", "==", matricula).get(),
      db.collection(USER_ORDERS_COLLECTION).where("userId", "==", session.uid).get(),
    ];
    const orderSnaps = await Promise.all(orderQueries);
    const ordersById = new Map<string, OrderLite>();
    orderSnaps.forEach((snap) =>
      snap.forEach((doc) => {
        const o = doc.data() as OrderLite;
        ordersById.set(doc.id, { ...o, orderId: o.orderId || doc.id });
      })
    );

    // Contratos do membro.
    const contractsSnap = await db.collection(USER_COLLECTION).doc(matricula).collection("Contracts").get();
    const contracts = contractsSnap.docs.map((d) => d.data() as Contract);

    // Chave de serviço unificada (slug prioritário — presente em pedido e contrato).
    const keyOf = (slug?: string | null, serviceCode?: string | null, id?: string | null) =>
      String(slug || serviceCode || id || "servico").toLowerCase();

    const groups = new Map<string, { order?: OrderLite; contract?: Contract }>();

    for (const o of ordersById.values()) {
      const k = keyOf(o.productSlug, null, o.productId);
      const g = groups.get(k) ?? {};
      // Pedido representativo: prefere o liberado/aprovado; senão o mais recente.
      if (!g.order) {
        g.order = o;
      } else {
        const prevApproved = APPROVED_ORDER_STATUSES.includes(String(g.order.status));
        const curApproved = APPROVED_ORDER_STATUSES.includes(String(o.status));
        if ((curApproved && !prevApproved) || (curApproved === prevApproved && String(toIso(o.createdAt)) > String(toIso(g.order.createdAt)))) {
          g.order = o;
        }
      }
      groups.set(k, g);
    }

    for (const c of contracts) {
      const k = keyOf(c.productSlug, c.serviceCode, c.contractId);
      const g = groups.get(k) ?? {};
      g.contract = c;
      groups.set(k, g);
    }

    const cards: ContractCard[] = [];
    for (const [serviceKey, { order, contract }] of groups) {
      const orderApproved = order ? APPROVED_ORDER_STATUSES.includes(String(order.status)) : false;
      const orderCancelled = order ? ["rejected", "cancelled", "payment_failed"].includes(String(order.status)) : false;
      const signed = contract?.status === "assinado";
      const contractPending = contract?.status === "pendente_assinatura" || contract?.status === "em_retificacao";

      let cardState: CardState;
      if (signed) cardState = "assinado";
      else if (orderCancelled && !contractPending) cardState = "cancelado";
      else if ((order && orderApproved && !signed) || contractPending) cardState = "aguardando_assinatura";
      else if (order && !orderApproved) cardState = "aguardando_pagamento";
      else cardState = "aguardando_assinatura";

      // Pode assinar pela tela de sucesso quando há pedido aprovado (checkout grátis/pago);
      // avulso pendente (contrato sem pedido) é assinado pelo link único enviado pela BPlen.
      const canSignInApp = cardState === "aguardando_assinatura" && !!order && orderApproved && !signed;

      cards.push({
        serviceKey,
        productTitle: order?.productTitle || contract?.productTitle || "Serviço BPlen",
        productSlug: order?.productSlug ?? contract?.productSlug ?? null,
        serviceCode: contract?.serviceCode ?? null,
        orderId: order?.orderId ?? contract?.orderId ?? null,
        origin: contract?.origin ?? order?.gateway ?? null,
        paymentStatus: order?.status ?? null,
        finalPrice: order?.finalPrice ?? null,
        purchaseDate: toIso(order?.createdAt) ?? contract?.createdAt ?? null,
        serviceReleased: !!order?.serviceReleased || signed,
        contractStatus: contract?.status ?? null,
        signedAt: contract?.signature?.signedAt ?? null,
        documentFileId: extractDriveFileId(contract?.documentUrl),
        verificationCode: contract?.signature?.verificationCode ?? null,
        geoLocation: geoToString(contract?.signature?.geo),
        invoiceUrl: contract?.invoice?.url ?? null,
        cardState,
        canSignInApp,
      });
    }

    // Ordena: pendências primeiro (assinatura, pagamento), depois assinados, depois cancelados.
    const order: Record<CardState, number> = {
      aguardando_assinatura: 0,
      aguardando_pagamento: 1,
      assinado: 2,
      cancelado: 3,
    };
    cards.sort((a, b) => order[a.cardState] - order[b.cardState]);

    return { success: true, cards };
  } catch (error: unknown) {
    console.error("[Member Contracts Panel] Erro:", error);
    return { success: false, error: getErrorMessage(error, "Falha ao carregar seus contratos.") };
  }
}
