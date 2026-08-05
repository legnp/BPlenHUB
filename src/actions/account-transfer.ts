"use server";

import * as admin from "firebase-admin";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { requireAdmin } from "@/lib/auth-guards";
import { getAdminDb, getAdminAuth } from "@/lib/firebase-admin";
import { serverEnv, clientEnv } from "@/env";
import { USER_ORDERS_COLLECTION } from "@/config/collections";
import { buildEmailLayout, EMAIL_STYLES } from "@/lib/emails/email-layout";
import { SUPPORT_WHATSAPP_URL } from "@/config/support";
import { classifyTransfer, transferReasonMessage } from "@/lib/identity/account-transfer";
import { getErrorMessage } from "@/lib/utils/errors";

const resend = new Resend(serverEnv.RESEND_API_KEY);
const TEAM_NOTIFICATION_EMAIL = "notificacao@bplen.com";

interface TransferEmailContext {
  originEmail: string;
  destEmail: string;
  sourceMatricula: string;
  orphanMatricula: string | null;
  performedBy: string;
}

/** Linha rotulo/valor da caixa de dados do e-mail interno. */
function teamRow(label: string, value: string): string {
  return `<p style="margin: 4px 0; font-size: 14px; color: #1D1D1F;">${label}: <strong>${value}</strong></p>`;
}

/**
 * Notifica origem, destino e a EQUIPE (registro interno) da transferencia
 * (best-effort). Ao destino: passou a acessar a conta com este e-mail. A origem: o
 * acesso saiu deste e-mail (sem revelar o novo — privacidade) + contato. A equipe
 * (`notificacao@bplen.com`): registro da operacao para auditoria na caixa de e-mail.
 */
async function sendTransferEmails(ctx: TransferEmailContext): Promise<void> {
  const origin = (ctx.originEmail || "").trim().toLowerCase();
  const dest = (ctx.destEmail || "").trim().toLowerCase();
  const entrarUrl = `${clientEnv.NEXT_PUBLIC_APP_URL || "https://bplen.com"}/entrar`;
  const jobs: Promise<unknown>[] = [];

  if (dest) {
    const content = `
      <h2 style="${EMAIL_STYLES.h2}">Acesso transferido para este e-mail</h2>
      <p style="${EMAIL_STYLES.p}">A partir de agora, você acessa a sua conta BPlen HUB com este e-mail. Todo o seu histórico continua no lugar — nada foi perdido.</p>
      <div style="text-align: left;"><a href="${entrarUrl}" style="${EMAIL_STYLES.button}">Entrar na BPlen HUB</a></div>
      <p style="${EMAIL_STYLES.p}">Se você não reconhece esta mudança, fale com a BPlen.</p>
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
      <h2 style="${EMAIL_STYLES.h2}">O acesso da sua conta foi transferido</h2>
      <p style="${EMAIL_STYLES.p}">O acesso à sua conta BPlen HUB passou a ser feito por outro e-mail. Este endereço não acessa mais a conta.</p>
      <div style="text-align: left;"><a href="${SUPPORT_WHATSAPP_URL}" style="${EMAIL_STYLES.button}">Falar com a BPlen</a></div>
      <p style="${EMAIL_STYLES.p}">Se você não reconhece esta mudança, fale com a BPlen imediatamente.</p>
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

  // Registro interno na caixa da equipe (auditoria pesquisavel por matricula).
  const teamContent = `
    <h2 style="${EMAIL_STYLES.h2}">Transferência de conta realizada</h2>
    <p style="${EMAIL_STYLES.p}">Registro interno de uma transferência de acesso executada no BPlen HUB.</p>
    <div style="${EMAIL_STYLES.infoBox}">
      <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8; font-weight: bold; text-transform: uppercase;">Dados da operação</p>
      ${teamRow("Matrícula", ctx.sourceMatricula)}
      ${teamRow("E-mail de origem", origin || "nao informado")}
      ${teamRow("E-mail de destino", dest || "nao informado")}
      ${ctx.orphanMatricula ? teamRow("Conta arquivada", ctx.orphanMatricula) : ""}
      ${teamRow("Executado por", ctx.performedBy)}
    </div>
    <p style="${EMAIL_STYLES.p}">A conta de origem manteve todos os dados. O acesso pelo e-mail anterior foi removido.</p>
  `;
  jobs.push(
    resend.emails.send({
      from: "BPlen HUB <hub@bplen.com>",
      to: TEAM_NOTIFICATION_EMAIL,
      subject: `Transferência de conta realizada - ${ctx.sourceMatricula}`,
      html: buildEmailLayout(teamContent, "BPlen HUB - Notificações Internas", { eyebrow: "EQUIPE" }),
    })
  );

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
    // 5. Auditoria. A referencia fica guardada: `now` e um serverTimestamp, e o
    // espelho precisa da data JA RESOLVIDA — e ela a chave de idempotencia, e
    // usar o relogio daqui geraria uma chave diferente da que o resgate calcula.
    const transferAuditRef = db.collection("_AccountTransfers").doc();
    batch.set(transferAuditRef, {
      sourceMatricula,
      targetUid,
      targetEmail,
      removedUids,
      orphanMatricula: orphanIsDistinct ? targetCurrentMatricula : null,
      performedBy: session.email || session.uid,
      performedAt: now,
    });

    await batch.commit();

    // Espelho no acervo da matricula que sobrevive: a transferencia muda quem e
    // dono do acervo, entao o proprio acervo precisa registrar isso.
    after(async () => {
      try {
        const saved = await transferAuditRef.get();
        const performedAt = saved.data()?.performedAt;
        const performedAtStr =
          performedAt && typeof performedAt.toDate === "function"
            ? performedAt.toDate().toLocaleString("pt-BR")
            : new Date().toLocaleString("pt-BR");

        const { syncAccountTransferToUserDrive } = await import("@/lib/drive-sync");
        await syncAccountTransferToUserDrive(sourceMatricula, {
          performedAt: performedAtStr,
          targetEmail,
          orphanMatricula: orphanIsDistinct ? (targetCurrentMatricula as string) : null,
          removedUids: removedUids.length,
          performedBy: session.email || session.uid,
        });
      } catch (mirrorError: unknown) {
        const message = mirrorError instanceof Error ? mirrorError.message : String(mirrorError);
        console.error("[AccountTransfer] Falha ao espelhar transferencia no acervo:", message);
      }
    });

    // Notificacao aos dois lados + registro na caixa da equipe (best-effort — nao
    // falha a transferencia ja feita).
    try {
      await sendTransferEmails({
        originEmail,
        destEmail: targetEmail,
        sourceMatricula,
        orphanMatricula: orphanIsDistinct ? (targetCurrentMatricula as string) : null,
        performedBy: session.email || session.uid,
      });
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
