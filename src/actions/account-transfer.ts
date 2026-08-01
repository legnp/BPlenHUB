"use server";

import * as admin from "firebase-admin";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guards";
import { getAdminDb, getAdminAuth } from "@/lib/firebase-admin";
import { USER_ORDERS_COLLECTION } from "@/config/collections";
import { classifyTransfer, transferReasonMessage } from "@/lib/identity/account-transfer";
import { getErrorMessage } from "@/lib/utils/errors";

/**
 * BPlen HUB — Transferencia de conta (Fase 3, admin).
 *
 * Reassocia uma conta existente (com os dados) a um novo meio de login, tornando
 * operavel o "fale com a BPlen" da trava de CPF. Como a conta e chaveada por
 * MATRICULA (nao por uid), transferir e so trocar quem loga (uid/email) — nenhum
 * dado migra, nada se perde. NUNCA mescla dados automaticamente: se o destino ja
 * tem uma conta COM dados, a operacao e recusada (merge disso e manual).
 */

/** Conta tem dado a preservar? (contratos ou pedidos) */
async function accountHasData(db: admin.firestore.Firestore, matricula: string): Promise<boolean> {
  const [contracts, orders] = await Promise.all([
    db.collection(`User/${matricula}/Contracts`).limit(1).get(),
    db.collection(USER_ORDERS_COLLECTION).where("matricula", "==", matricula).limit(1).get(),
  ]);
  return !contracts.empty || !orders.empty;
}

export interface AccountSnapshot {
  matricula: string;
  name: string;
  email: string;
  uid: string;
  hasCompletedWelcome: boolean;
  hasCpf: boolean;
  archived: boolean;
  isAdmin: boolean;
  counts: { contracts: number; orders: number; surveys: number; forms: number };
}

/** Resumo read-only de uma conta (para o admin confirmar antes de transferir). */
export async function getAccountSnapshotAction(
  matricula: string
): Promise<{ success: boolean; data?: AccountSnapshot; error?: string }> {
  try {
    await requireAdmin();
    const db = getAdminDb();
    const userSnap = await db.doc(`User/${matricula}`).get();
    if (!userSnap.exists) return { success: false, error: "Conta não encontrada." };
    const data = userSnap.data() || {};

    const [contracts, orders, surveys, forms, perm] = await Promise.all([
      db.collection(`User/${matricula}/Contracts`).get(),
      db.collection(USER_ORDERS_COLLECTION).where("matricula", "==", matricula).get(),
      db.collection(`User/${matricula}/Surveys`).get(),
      db.collection(`User/${matricula}/Forms`).get(),
      db.doc(`User/${matricula}/User_Permissions/access`).get(),
    ]);

    return {
      success: true,
      data: {
        matricula,
        name: data.Authentication_Name || data.User_Name || "Membro BPlen",
        email: data.email || data.User_Email || "",
        uid: data.uid || "",
        hasCompletedWelcome: data.hasCompletedWelcome === true,
        hasCpf: Boolean(data.profile?.cpf),
        archived: data.archived === true,
        isAdmin: perm.data()?.admin === true,
        counts: {
          contracts: contracts.size,
          orders: orders.size,
          surveys: surveys.size,
          forms: forms.size,
        },
      },
    };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error, "Falha ao carregar a conta.") };
  }
}

/**
 * Transfere a conta `sourceMatricula` para o login `targetUid` (novo meio de
 * acesso). Recusa com seguranca se o destino ja tem conta COM dados.
 */
export async function transferAccountAction(
  sourceMatricula: string,
  targetUid: string
): Promise<{ success: boolean; error?: string; targetEmail?: string }> {
  try {
    const session = await requireAdmin();
    const db = getAdminDb();

    // Origem (a conta com os dados).
    const sourceSnap = await db.doc(`User/${sourceMatricula}`).get();

    // Destino precisa ser um login real (Firebase Auth) — e-mail VERIFICADO de la.
    let targetEmail = "";
    try {
      const targetUser = await getAdminAuth().getUser(targetUid);
      targetEmail = (targetUser.email || "").toLowerCase();
    } catch {
      return { success: false, error: "Login de destino inválido (não encontrado)." };
    }

    // Conta que o destino aponta hoje (a "orfa"/nova criada com o e-mail novo).
    const targetMapSnap = await db.doc(`_AuthMap/${targetUid}`).get();
    const targetCurrentMatricula = targetMapSnap.exists
      ? ((targetMapSnap.data()?.matricula as string | undefined) || null)
      : null;

    const orphanIsDistinct = Boolean(targetCurrentMatricula && targetCurrentMatricula !== sourceMatricula);
    const orphanHasData = orphanIsDistinct ? await accountHasData(db, targetCurrentMatricula as string) : false;

    const verdict = classifyTransfer({
      sourceExists: sourceSnap.exists,
      sourceArchived: sourceSnap.data()?.archived === true,
      sourceMatricula,
      targetCurrentMatricula,
      orphanHasData,
    });
    if (!verdict.ok) return { success: false, error: transferReasonMessage(verdict.reason) };

    // Fonte da verdade dos logins antigos = o _AuthMap (nao o campo `User.uid`, que
    // pode estar vazio/stale). Removemos TODOS os uids que apontam para a origem,
    // exceto o destino — senao o login antigo continua acessando a mesma conta.
    const oldMapsSnap = await db.collection("_AuthMap").where("matricula", "==", sourceMatricula).get();
    const removedUids = oldMapsSnap.docs.map((d) => d.id).filter((id) => id !== targetUid);

    const now = admin.firestore.FieldValue.serverTimestamp();
    const batch = db.batch();

    // 1. A origem passa a ser acessada pelo novo login.
    batch.set(
      db.doc(`User/${sourceMatricula}`),
      { uid: targetUid, email: targetEmail, identityTransferredAt: now },
      { merge: true }
    );
    // 2. Novo mapeamento uid -> matricula de origem.
    batch.set(
      db.doc(`_AuthMap/${targetUid}`),
      { matricula: sourceMatricula, manualTransfer: true, transferredAt: now },
      { merge: true }
    );
    // 3. Remove os mapeamentos antigos (o login de origem perde o acesso).
    for (const doc of oldMapsSnap.docs) {
      if (doc.id !== targetUid) batch.delete(doc.ref);
    }
    // 4. Arquiva a orfa vazia (nao deleta — reversivel).
    if (orphanIsDistinct) {
      batch.set(
        db.doc(`User/${targetCurrentMatricula as string}`),
        { archived: true, archivedAt: now, archivedReason: "account_transfer", archivedInto: sourceMatricula },
        { merge: true }
      );
    }
    // 5. Auditoria.
    batch.set(db.collection("_AccountTransfers").doc(), {
      sourceMatricula,
      targetUid,
      targetEmail,
      removedUids,
      orphanMatricula: orphanIsDistinct ? targetCurrentMatricula : null,
      performedBy: session.email || session.uid,
      performedAt: now,
    });

    await batch.commit();
    revalidatePath("/admin/users/autenticacoes");
    return { success: true, targetEmail };
  } catch (error: unknown) {
    console.error("[account-transfer] Falha:", getErrorMessage(error));
    return { success: false, error: getErrorMessage(error, "Falha ao transferir a conta.") };
  }
}
