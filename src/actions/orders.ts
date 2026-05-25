"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { USER_ORDERS_COLLECTION } from "@/config/collections";
import { requireAuth } from "@/lib/auth-guards";
import { resolveMatricula } from "./get-user-results";

export interface Order {
  id: string;
  orderId: string;
  userId: string;
  userEmail: string;
  productId: string;
  productSlug: string;
  productTitle: string;
  productKicker?: string;
  basePrice: number;
  appliedDiscount: number;
  finalPrice: number;
  currency: string;
  status: string;
  statusDetail?: string;
  gateway: string;
  mpPreferenceId?: string;
  mpPaymentId?: string;
  createdAt: string; 
  updatedAt: string;
}

/**
 * BPlen HUB — Orders Action
 * Busca a trilha e o histórico financeiro do usuário logado.
 */
export async function getUserOrdersAction(idToken?: string): Promise<{ success: boolean; data?: Order[]; error?: string }> {
  try {
    const session = await requireAuth(idToken);
    // 🏛️ 3. Ativação Soberana (via Matrícula 🛡️)
    const matricula = await resolveMatricula(session.uid, session.email || "");
    console.log(`📡 [Orders:Fetch] UID: ${session.uid}, Matrícula: ${matricula}`);

    const db = getAdminDb();

    // Governança: Busca em Paralelo para máxima cobertura
    const queries = [
       db.collection(USER_ORDERS_COLLECTION).where("userId", "==", session.uid).get()
    ];

    if (matricula) {
       queries.push(db.collection(USER_ORDERS_COLLECTION).where("matricula", "==", matricula).get());
       // Caso algum legado use matrícula no campo userId
       queries.push(db.collection(USER_ORDERS_COLLECTION).where("userId", "==", matricula).get());
    }

    const snaps = await Promise.all(queries);
    const ordersMap = new Map<string, Order>();

    snaps.forEach((snap) => {
      snap.forEach((doc) => {
        const data = doc.data();
        
        // Mapeamento Robusto de Datas (Timestamp, Date ou String)
        const parseDate = (val: { toDate?: () => Date } | string | Date | number | null) => {
           if (!val) return new Date().toISOString();
           if (val && typeof val === 'object' && 'toDate' in val && typeof val.toDate === 'function') {
              return val.toDate().toISOString();
           }
           return new Date(val as string | number | Date).toISOString();
        };

        ordersMap.set(doc.id, {
          id: doc.id,
          orderId: data.orderId || "",
          userId: data.userId || "",
          userEmail: data.userEmail || "",
          productId: data.productId || "",
          productSlug: data.productSlug || "",
          productTitle: data.productTitle || "",
          productKicker: data.productKicker || "",
          basePrice: data.basePrice || 0,
          appliedDiscount: data.appliedDiscount || 0,
          finalPrice: data.finalPrice || 0,
          currency: data.currency || "BRL",
          status: data.status || "pending",
          statusDetail: data.statusDetail || "",
          gateway: data.gateway || "mercadopago",
          mpPreferenceId: data.mpPreferenceId || "",
          mpPaymentId: data.mpPaymentId || "",
          createdAt: parseDate(data.createdAt),
          updatedAt: parseDate(data.updatedAt),
        });
      });
    });

    // 🏆 Ordenação Soberana (Server-side JS para evitar falhas de índice)
    const orders = Array.from(ordersMap.values()).sort((a, b) => 
       b.createdAt.localeCompare(a.createdAt)
    );

    return { success: true, data: orders };

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno ao buscar faturamentos.";
    console.error("❌ [Orders Action Error]:", error);
    return { success: false, error: message };
  }
}
