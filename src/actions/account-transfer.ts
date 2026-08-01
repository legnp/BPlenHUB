"use server";

import * as admin from "firebase-admin";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { requireAdmin } from "@/lib/auth-guards";
import { getAdminDb, getAdminAuth } from "@/lib/firebase-admin";
import { serverEnv, clientEnv } from "@/env";
import { USER_ORDERS_COLLECTION } from "@/config/collections";
import { buildEmailLayout, EMAIL_STYLES } from "@/lib/emails/email-layout";
import { classifyTransfer, transferReasonMessage } from "@/lib/identity/account-transfer";
import { getErrorMessage } from "@/lib/utils/errors";

const resend = new Resend(serverEnv.RESEND_API_KEY);
const SUPPORT_URL = "https://wa.me/5511945152088";

/**
 * Notifica origem e destino da transferencia (best-effort). Ao destino: passou a
 * acessar a conta com este e-mail. A origem: o acesso saiu deste e-mail (sem
 * revelar o novo e-mail — privacidade) + contato para o caso de nao reconhecer.
 */
async function sendTransferEmails(originEmail: string, destEmail: string): Promise<void> {
  const origin = (originEmail || "").trim().toLowerCase();
  const dest = (destEmail || "").trim().toLowerCase();
  const entrarUrl = `${clientEnv.NEXT_PUBLIC_APP_URL || "https://bplen.com"}/entrar`;
  const jobs: Promise<unknown>[] = [];

  if (dest) {
    const content = `
      <p style="${EMAIL_STYLES.eyebrow}">ACESSO</p>
      <h2 style="${EMAIL_STYLES.h2}">Acesso transferido para este e-mail</h2>
      <p style="${EMAIL_STYLES.p}">A partir de agora, você acessa sua conta BPlen HUB com este e-mail. É só entrar normalmente pela página de acesso.</p>
      <div style="text-align: left;"><a href="${entrarUrl}" style="${EMAIL_STYLES.button}">Entrar na BPlen HUB</a></div>
      <p style="${EMAIL_STYLES.p}">Se você não reconhece esta ação, fale com a BPlen imediatamente.</p>
    `;
    jobs.push(
      resend.emails.send({
        from: "BPlen HUB <hub@bplen.com>",
        to: dest,
        subject: "Sua conta BPlen HUB agora é acessada por este e-mail",
        html: buildEmailLayout(content, "BPlen HUB - Desenvolvimento Humano", { eyebrow: "ACESSO" }),
      })
    );
  }

  if (origin && origin !== dest) {
    const content = `
      <p style="${EMAIL_STYLES.eyebrow}">ACESSO</p>
      <h2 style="${EMAIL_STYLES.h2}">O acesso da sua conta foi transferido</h2>
      <p style="${EMAIL_STYLES.p}">O acesso à sua conta BPlen HUB foi transferido para outro e-mail. Este e-mail não acessa mais a conta.</p>
      <div style="text-align: left;"><a href="${SUPPORT_URL}" style="${EMAIL_STYLES.button}">Falar com a BPlen</a></div>
      <p style="${EMAIL_STYLES.p}">Se você não reconhece esta ação, fale com a BPlen imediatamente.</p>
    `;
    jobs.push(
      resend.emails.send({
        from: "BPlen HUB <hub@bplen.com>",
        to: origin,
        subject: "O acesso à sua conta BPlen HUB foi transferido",
        html: buildEmailLayout(content, "BPlen HUB - Desenvolvimento Humano", { eyebrow: "ACESSO" }),
      })
    );
  }

  await Promise.all(jobs);
}

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

    // Origem (a conta com os dados). Captura o e-mail atual ANTES de sobrescrever,
    // para notificar o e-mail de origem da transferencia.
    const sourceSnap = await db.doc(`User/${sourceMatricula}`).get();
    const originEmail = (sourceSnap.data()?.email as string | undefined) || "";

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

    // Notificacao aos dois e-mails (best-effort — nao falha a transferencia ja feita).
    try {
      await sendTransferEmails(originEmail, targetEmail);
    } catch (mailErr) {
      console.warn("[account-transfer] Falha ao enviar e-mails de transferencia:", getErrorMessage(mailErr));
    }

    revalidatePath("/admin/users/autenticacoes");
    return { success: true, targetEmail };
  } catch (error: unknown) {
    console.error("[account-transfer] Falha:", getErrorMessage(error));
    return { success: false, error: getErrorMessage(error, "Falha ao transferir a conta.") };
  }
}
