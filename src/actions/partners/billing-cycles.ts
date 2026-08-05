"use server";

import * as admin from "firebase-admin";
import { requireAdmin, requireAuth } from "@/lib/auth-guards";
import { getAdminDb } from "@/lib/firebase-admin";
import { resolveUserPermissions } from "@/lib/user-permissions";
import { USER_ORDERS_COLLECTION } from "@/config/collections";
import { toISOSafe } from "@/lib/date-utils";
import { computeCommissionValue, cutoffDateOf, cycleIdOf } from "@/lib/partners/commission";
import {
  AUTOMATIC_STATUSES,
  calculateCycleStatus,
  canTransition,
  PartnerCycleActor,
  PartnerCycleStatus,
  PartnerCycleTransition,
} from "@/lib/partners/cycle-status";

/**
 * BPlen HUB — Ciclos de repasse do parceiro (Fase 4).
 *
 * Geracao por ACAO do Admin, nunca por cron (decisao da Gestora, plano secao 9.2 — o
 * plano Hobby tem um unico slot de cron, ja usado). E' idempotente por construcao:
 * recalcula sempre a partir das compras dos indicados, nunca acumula.
 *
 * O status NUNCA e' gravado por conta propria: toda mudanca passa por `canTransition`
 * (`src/lib/partners/cycle-status.ts`), que e' a unica porta e e' testada isoladamente.
 */

const APPROVED_ORDER_STATUSES = ["approved", "active", "completed", "accredited"];

export interface PartnerCycleComment {
  authorRole: PartnerCycleActor;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface PartnerBillingCycle {
  cycleId: string;
  monthYear: string;
  totalIndications: number;
  totalCommissionValue: number;
  adjustedValue: number | null;
  /** Valor que vale para o repasse: a correcao do admin, se houver; senao o calculado. */
  payableValue: number;
  status: PartnerCycleStatus;
  invoiceUpload: { url: string; fileName: string; uploadedAt: string } | null;
  paymentProof: { url: string; fileName: string; uploadedAt: string } | null;
  generatedAt: string | null;
  lastRecalculatedAt: string | null;
  comments: PartnerCycleComment[];
}

function cyclesPath(matricula: string): string {
  return `User/${matricula}/Partner_Billing_Cycles`;
}

/**
 * Confirma o selo de parceiro do chamador JA autenticado e devolve a matricula dele.
 *
 * O `requireAuth()` fica no corpo de cada action de proposito, e nao aqui dentro: a
 * invariante executavel de superficie (`__tests__/lib/server-action-surface.test.ts`,
 * origem do BUG-103) confere o guard no proprio arquivo da action. Guard escondido
 * atras de um helper passa despercebido pela auditoria — e foi exatamente assim que 57
 * funcoes ficaram expostas antes. O guard visivel e' parte do contrato.
 */
async function resolvePartnerSelf(uid: string): Promise<{ matricula: string } | { error: string }> {
  const { matricula, services } = await resolveUserPermissions(uid);
  if (!matricula) return { error: "Conta sem matricula resolvida." };
  if (services?.partner_area_access !== true) return { error: "Acesso de parceiro nao habilitado." };
  return { matricula };
}

function mapCycle(id: string, data: FirebaseFirestore.DocumentData, comments: PartnerCycleComment[]): PartnerBillingCycle {
  const totalCommissionValue = typeof data.totalCommissionValue === "number" ? data.totalCommissionValue : 0;
  const adjustedValue = typeof data.adjustedValue === "number" ? data.adjustedValue : null;
  return {
    cycleId: id,
    monthYear: String(data.monthYear || id),
    totalIndications: typeof data.totalIndications === "number" ? data.totalIndications : 0,
    totalCommissionValue,
    adjustedValue,
    payableValue: adjustedValue ?? totalCommissionValue,
    status: (data.status as PartnerCycleStatus) || "nenhuma_indicacao",
    invoiceUpload: data.invoiceUpload || null,
    paymentProof: data.paymentProof || null,
    generatedAt: toISOSafe(data.generatedAt),
    lastRecalculatedAt: toISOSafe(data.lastRecalculatedAt),
    comments,
  };
}

async function readComments(matricula: string, cycleId: string): Promise<PartnerCycleComment[]> {
  const snap = await getAdminDb()
    .collection(`${cyclesPath(matricula)}/${cycleId}/Comments`)
    .orderBy("createdAt", "asc")
    .get();
  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      authorRole: (data.authorRole as PartnerCycleActor) || "admin",
      authorName: String(data.authorName || "BPlen"),
      text: String(data.text || ""),
      createdAt: toISOSafe(data.createdAt) || "",
    };
  });
}

async function listCycles(matricula: string): Promise<PartnerBillingCycle[]> {
  const db = getAdminDb();
  const snap = await db.collection(cyclesPath(matricula)).orderBy(admin.firestore.FieldPath.documentId(), "desc").get();
  const cycles: PartnerBillingCycle[] = [];
  for (const doc of snap.docs) {
    cycles.push(mapCycle(doc.id, doc.data(), await readComments(matricula, doc.id)));
  }
  return cycles;
}

/** Ciclos do proprio parceiro. */
export async function getPartnerCyclesAction(): Promise<{ cycles: PartnerBillingCycle[]; error?: string }> {
  try {
    const session = await requireAuth();
    const self = await resolvePartnerSelf(session.uid);
    if ("error" in self) return { cycles: [], error: self.error };
    return { cycles: await listCycles(self.matricula) };
  } catch (error: unknown) {
    console.error("[partner-cycles] Falha ao listar ciclos:", error instanceof Error ? error.message : error);
    return { cycles: [], error: "Nao foi possivel carregar os ciclos agora." };
  }
}

/** Ciclos de um parceiro especifico (admin). */
export async function getPartnerCyclesAdminAction(
  partnerMatricula: string,
  adminToken?: string
): Promise<{ cycles: PartnerBillingCycle[]; error?: string }> {
  try {
    await requireAdmin(adminToken);
    return { cycles: await listCycles(partnerMatricula) };
  } catch (error: unknown) {
    console.error("[partner-cycles] Falha ao listar ciclos (admin):", error instanceof Error ? error.message : error);
    return { cycles: [], error: "Nao foi possivel carregar os ciclos deste parceiro." };
  }
}

/**
 * Gera/atualiza os ciclos de um parceiro a partir das compras dos indicados.
 *
 * Idempotente: recalcula do zero e escreve o resultado, nunca soma sobre o que ja
 * estava la. Os valores de ciclos que ja sairam da apuracao continuam sendo
 * recalculados (o admin ve o numero atual), mas o STATUS deles nao regride — so os
 * estados automaticos sao reescritos.
 */
export async function generateOrUpdatePartnerCyclesAction(
  partnerMatricula: string,
  adminToken?: string
): Promise<{ success: boolean; cyclesTouched?: number; error?: string }> {
  try {
    await requireAdmin(adminToken);
    const db = getAdminDb();

    const accessSnap = await db.doc(`User/${partnerMatricula}/User_Permissions/access`).get();
    const commissionFallback =
      typeof accessSnap.data()?.partnerCommissionPercent === "number"
        ? (accessSnap.data()?.partnerCommissionPercent as number)
        : 0;

    const referralsSnap = await db.collection(`User/${partnerMatricula}/Partner_Referrals`).get();

    // Acumula por ciclo (AAAA-MM) a partir das compras aprovadas dos indicados.
    const porCiclo = new Map<string, { valor: number; indicados: Set<string> }>();

    for (const referral of referralsSnap.docs) {
      const data = referral.data();
      const referredMatricula = String(data.referredMatricula || referral.id);
      const percent =
        typeof data.commissionPercent === "number" ? data.commissionPercent : commissionFallback;

      const ordersSnap = await db
        .collection(USER_ORDERS_COLLECTION)
        .where("matricula", "==", referredMatricula)
        .get();

      for (const orderDoc of ordersSnap.docs) {
        const order = orderDoc.data();
        if (!APPROVED_ORDER_STATUSES.includes(String(order.status))) continue;

        const purchasedAt = toISOSafe(order.createdAt);
        if (!purchasedAt) continue;

        const paidValue = typeof order.finalPrice === "number" ? order.finalPrice : 0;
        const commissionValue = computeCommissionValue(paidValue, percent);
        if (commissionValue <= 0) continue;

        const cycleId = cycleIdOf(purchasedAt);
        const atual = porCiclo.get(cycleId) || { valor: 0, indicados: new Set<string>() };
        atual.valor = Math.round((atual.valor + commissionValue) * 100) / 100;
        atual.indicados.add(referredMatricula);
        porCiclo.set(cycleId, atual);
      }
    }

    const batch = db.batch();
    let touched = 0;

    for (const [cycleId, acumulado] of porCiclo.entries()) {
      const ref = db.doc(`${cyclesPath(partnerMatricula)}/${cycleId}`);
      const existente = await ref.get();
      const statusAtual = existente.exists ? (existente.data()?.status as PartnerCycleStatus) : undefined;

      // Status so e' recalculado enquanto o ciclo esta nos estados automaticos. Depois
      // que o admin abriu a apuracao, quem manda e a maquina de estados.
      const status =
        statusAtual && !AUTOMATIC_STATUSES.includes(statusAtual)
          ? statusAtual
          : calculateCycleStatus(acumulado.indicados.size);

      batch.set(
        ref,
        {
          cycleId,
          monthYear: cycleId,
          totalIndications: acumulado.indicados.size,
          totalCommissionValue: acumulado.valor,
          cutoffDate: cutoffDateOf(`${cycleId}-15T12:00:00.000Z`),
          status,
          ...(existente.exists ? {} : { generatedAt: admin.firestore.FieldValue.serverTimestamp() }),
          lastRecalculatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      touched += 1;
    }

    await batch.commit();
    console.log(`[partner-cycles] ${touched} ciclo(s) recalculado(s) para ${partnerMatricula}.`);
    return { success: true, cyclesTouched: touched };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[partner-cycles] Falha ao gerar ciclos:", message);
    return { success: false, error: "Nao foi possivel gerar os ciclos agora." };
  }
}

/** Aplica uma transicao de status, sempre pela maquina de estados. */
async function applyTransition(input: {
  partnerMatricula: string;
  cycleId: string;
  transition: PartnerCycleTransition;
  actor: PartnerCycleActor;
  patch?: Record<string, unknown>;
}): Promise<{ success: boolean; error?: string }> {
  const db = getAdminDb();
  const ref = db.doc(`${cyclesPath(input.partnerMatricula)}/${input.cycleId}`);
  const snap = await ref.get();
  if (!snap.exists) return { success: false, error: "Ciclo nao encontrado." };

  const current = (snap.data()?.status as PartnerCycleStatus) || "nenhuma_indicacao";
  const decision = canTransition({
    current,
    transition: input.transition,
    actor: input.actor,
    cycleId: input.cycleId,
    reference: new Date(),
  });

  if (!decision.allowed || !decision.next) {
    return { success: false, error: decision.reason || "Ação não permitida para este ciclo." };
  }

  await ref.set(
    {
      ...(input.patch || {}),
      status: decision.next,
      statusUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { success: true };
}

/** Admin: abre a apuracao (so depois do fim do mes), corrige valor ou aprova o valor final. */
export async function advancePartnerCycleAdminAction(
  input: {
    partnerMatricula: string;
    cycleId: string;
    transition: Extract<PartnerCycleTransition, "aprovar_apuracao" | "corrigir_valor" | "aprovar_valor_final" | "rejeitar_recibo" | "registrar_pagamento">;
    adjustedValue?: number;
    paymentProof?: { url: string; fileName: string };
  },
  adminToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin(adminToken);

    const patch: Record<string, unknown> = {};

    if (input.transition === "corrigir_valor") {
      if (typeof input.adjustedValue !== "number" || !Number.isFinite(input.adjustedValue) || input.adjustedValue < 0) {
        return { success: false, error: "Informe um valor corrigido válido." };
      }
      patch.adjustedValue = Math.round(input.adjustedValue * 100) / 100;
    }

    if (input.transition === "registrar_pagamento") {
      if (!input.paymentProof?.url) {
        return { success: false, error: "Anexe o comprovante de pagamento para concluir o ciclo." };
      }
      patch.paymentProof = {
        ...input.paymentProof,
        uploadedAt: new Date().toISOString(),
        uploadedByAdmin: true,
      };
    }

    if (input.transition === "rejeitar_recibo") {
      // O recibo recusado sai do ciclo: o parceiro precisa enviar outro.
      patch.invoiceUpload = null;
    }

    return await applyTransition({
      partnerMatricula: input.partnerMatricula,
      cycleId: input.cycleId,
      transition: input.transition,
      actor: "admin",
      patch,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[partner-cycles] Falha na acao administrativa do ciclo:", message);
    return { success: false, error: "Nao foi possivel atualizar o ciclo agora." };
  }
}

/** Parceiro: registra o recibo/NF ja enviado ao acervo e move o ciclo. */
export async function submitPartnerInvoiceAction(input: {
  cycleId: string;
  url: string;
  fileName: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireAuth();
    const self = await resolvePartnerSelf(session.uid);
    if ("error" in self) return { success: false, error: self.error };

    if (!input.url) return { success: false, error: "Envie o arquivo do recibo ou da nota fiscal." };

    return await applyTransition({
      partnerMatricula: self.matricula,
      cycleId: input.cycleId,
      transition: "enviar_recibo",
      actor: "partner",
      patch: {
        invoiceUpload: {
          url: input.url,
          fileName: input.fileName,
          uploadedAt: new Date().toISOString(),
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[partner-cycles] Falha ao registrar recibo:", message);
    return { success: false, error: "Nao foi possivel registrar o recibo agora." };
  }
}

/**
 * Comentario no ciclo — os dois lados escrevem na mesma trilha.
 *
 * O papel do autor vem de quem esta autenticado, nunca do cliente: um parceiro nao pode
 * publicar comentario assinado como BPlen.
 */
export async function addPartnerCycleCommentAction(input: {
  cycleId: string;
  text: string;
  /** So o admin informa; o parceiro comenta sempre no proprio ciclo. */
  partnerMatricula?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const text = input.text.trim();
    if (!text) return { success: false, error: "Escreva uma mensagem antes de enviar." };
    if (text.length > 2000) return { success: false, error: "Mensagem muito longa (máximo 2000 caracteres)." };

    const session = await requireAuth();
    const { matricula, services, isAdmin } = await resolveUserPermissions(session.uid);

    let targetMatricula: string;
    let authorRole: PartnerCycleActor;
    let authorName: string;

    if (isAdmin && input.partnerMatricula) {
      targetMatricula = input.partnerMatricula;
      authorRole = "admin";
      authorName = "Equipe BPlen";
    } else {
      if (!matricula || services?.partner_area_access !== true) {
        return { success: false, error: "Acesso de parceiro nao habilitado." };
      }
      targetMatricula = matricula;
      authorRole = "partner";
      const userSnap = await getAdminDb().doc(`User/${matricula}`).get();
      authorName = String(userSnap.data()?.User_Nickname || userSnap.data()?.Authentication_Name || "Parceiro");
    }

    await getAdminDb()
      .collection(`${cyclesPath(targetMatricula)}/${input.cycleId}/Comments`)
      .add({
        authorRole,
        authorName,
        text,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[partner-cycles] Falha ao comentar no ciclo:", message);
    return { success: false, error: "Nao foi possivel enviar a mensagem agora." };
  }
}
