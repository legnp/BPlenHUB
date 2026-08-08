"use server";

import { requireAuth } from "@/lib/auth-guards";
import { getAdminDb } from "@/lib/firebase-admin";
import { resolveUserPermissions } from "@/lib/user-permissions";
import { USER_ORDERS_COLLECTION } from "@/config/collections";
import { computeCommissionValue, cutoffDateOf, cycleIdOf } from "@/lib/partners/commission";
import { toISOSafe } from "@/lib/date-utils";

/**
 * BPlen HUB — Gestao de Indicacoes (projecao ao vivo).
 *
 * Espelha o padrao do networking (`src/actions/networking.ts`): a matricula do CHAMADOR
 * vem da sessao verificada, nunca de parametro; o selo e' reconfirmado no servidor; e a
 * leitura cross-user acontece com Admin SDK projetando CAMPO A CAMPO — nunca devolvendo
 * o documento do indicado. Por isso `firestore.rules` nao precisa abrir nada.
 *
 * O que NAO sai daqui: `cpfHash`. E' uso interno da BPlen, nunca exposto na interface do
 * parceiro (decisao da Gestora, reconfirmada em 2026-08-05).
 */

/** Uma compra do indicado que gera repasse. */
export interface PartnerIndicationService {
  orderId: string;
  productTitle: string;
  /** Valor efetivamente pago pelo cliente (ja com desconto aplicado). */
  paidValue: number;
  commissionPercent: number;
  commissionValue: number;
  purchasedAt: string;
  /** Ciclo mensal a que a compra pertence ("AAAA-MM"). */
  cycleId: string;
  /** Ultimo dia do mes da compra. */
  cutoffDate: string;
  status: string;
}

export interface PartnerIndication {
  referredMatricula: string;
  referredNome: string;
  dataIndicacao: string;
  /** Percentual vigente no momento da indicacao (copia congelada). */
  commissionPercent: number;
  journeyStatus: string;
  journeyProgress: number;
  services: PartnerIndicationService[];
  totalCommission: number;
}

const APPROVED_ORDER_STATUSES = ["approved", "active", "completed", "accredited"];

export async function getPartnerIndicationsAction(): Promise<{
  indications: PartnerIndication[];
  totalCommission: number;
  error?: string;
}> {
  try {
    const session = await requireAuth();
    const { matricula, services } = await resolveUserPermissions(session.uid);

    if (!matricula) {
      return { indications: [], totalCommission: 0, error: "Conta sem matricula resolvida." };
    }
    if (services?.partner_area_access !== true) {
      // Nao e' erro de sistema: e' ausencia de selo. A tela ja esta atras do gate de
      // rota; isto e' a segunda camada, do lado do dado.
      return { indications: [], totalCommission: 0, error: "Acesso de parceiro nao habilitado." };
    }

    const db = getAdminDb();
    const referralsSnap = await db.collection(`User/${matricula}/Partner_Referrals`).get();
    if (referralsSnap.empty) return { indications: [], totalCommission: 0 };

    const indications: PartnerIndication[] = [];

    for (const doc of referralsSnap.docs) {
      const data = doc.data();
      const referredMatricula = String(data.referredMatricula || doc.id);
      const commissionPercent =
        typeof data.commissionPercent === "number" ? data.commissionPercent : 0;

      // Status da jornada do indicado — projetado, nao devolvido cru.
      // Copy de interface: acentuada de proposito (Licao 11 do RETROSPECTIVE — nunca
      // remover acento PT-BR de texto que o usuario le). Aparece na tabela de indicacoes
      // e, desde o redesenho da home, tambem na porta de entrada da area.
      let journeyStatus = "Ainda não iniciou";
      let journeyProgress = 0;
      try {
        const progressSnap = await db.doc(`User/${referredMatricula}/User_Journey/progress`).get();
        if (progressSnap.exists) {
          const progress = progressSnap.data();
          journeyProgress = typeof progress?.overallProgress === "number" ? progress.overallProgress : 0;
          journeyStatus = journeyProgress >= 100 ? "Jornada concluída" : "Jornada em andamento";
        }
      } catch (progressErr) {
        console.error("[partner-referrals] Falha ao projetar a jornada do indicado:", progressErr);
      }

      // Compras aprovadas do indicado — o valor do repasse sai daqui.
      const servicesList: PartnerIndicationService[] = [];
      try {
        const ordersSnap = await db
          .collection(USER_ORDERS_COLLECTION)
          .where("matricula", "==", referredMatricula)
          .get();

        for (const orderDoc of ordersSnap.docs) {
          const order = orderDoc.data();
          if (!APPROVED_ORDER_STATUSES.includes(String(order.status))) continue;

          const purchasedAt = toISOSafe(order.createdAt) || null;
          if (!purchasedAt) continue;

          const paidValue = typeof order.finalPrice === "number" ? order.finalPrice : 0;

          servicesList.push({
            orderId: String(order.orderId || orderDoc.id),
            productTitle: String(order.productTitle || "Serviço BPlen"),
            paidValue,
            commissionPercent,
            commissionValue: computeCommissionValue(paidValue, commissionPercent),
            purchasedAt,
            cycleId: cycleIdOf(purchasedAt),
            cutoffDate: cutoffDateOf(purchasedAt),
            status: String(order.status),
          });
        }
      } catch (ordersErr) {
        console.error("[partner-referrals] Falha ao projetar as compras do indicado:", ordersErr);
      }

      servicesList.sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt));

      // Nome atual do indicado (o snapshot da indicacao pode ter envelhecido).
      let referredNome = String(data.referredNome || "Cliente BPlen");
      try {
        const userSnap = await db.doc(`User/${referredMatricula}`).get();
        const user = userSnap.data();
        referredNome =
          (user?.User_Nickname as string) ||
          (user?.Authentication_Name as string) ||
          (user?.User_Name as string) ||
          referredNome;
      } catch (userErr) {
        console.error("[partner-referrals] Falha ao ler o nome do indicado:", userErr);
      }

      indications.push({
        referredMatricula,
        referredNome,
        dataIndicacao: String(data.dataIndicacao || ""),
        commissionPercent,
        journeyStatus,
        journeyProgress,
        services: servicesList,
        totalCommission: servicesList.reduce((acc, s) => acc + s.commissionValue, 0),
      });
    }

    indications.sort((a, b) => b.dataIndicacao.localeCompare(a.dataIndicacao));

    return {
      indications,
      totalCommission: indications.reduce((acc, i) => acc + i.totalCommission, 0),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[partner-referrals] Falha ao projetar as indicacoes:", message);
    return { indications: [], totalCommission: 0, error: "Nao foi possivel carregar as suas indicacoes agora." };
  }
}
