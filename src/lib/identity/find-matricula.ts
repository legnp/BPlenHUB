import admin from "@/lib/firebase-admin";
import { getAdminDb } from "@/lib/firebase-admin";

/**
 * FONTE UNICA da resolucao "uid -> matricula" (lote 2b.2 do `BUG-103`).
 *
 * ## Por que este arquivo existe
 *
 * A mesma logica vivia em DUAS copias — `lib/user-matricula.ts:resolveMatricula`
 * e `actions/survey-effects.ts:resolveUserIdentity`. Elas divergiram, e foi essa
 * divergencia que deixou o `BUG-032` (Critico de identidade) ser corrigido em
 * `auth-permissions.ts` e **sobreviver nas outras duas** por meses, ate virar o
 * `BUG-106` (sequestro de conta). Enquanto forem copias, o proximo
 * endurecimento conserta uma e a outra sobrevive (Licoes 21/37/44).
 *
 * As duas chamadoras faziam exatamente os mesmos 3 passos; a unica diferenca
 * era **o que fazer quando nao acha** — devolver `null` ou cunhar matricula.
 * Isso e politica de quem chama, nao da resolucao, e por isso fica fora daqui.
 *
 * ## Contrato
 *
 * Este arquivo **nao e `"use server"`**: nao e endpoint de rede. Quem chama daqui
 * ja verificou identidade por outro meio (sessao, HMAC, cron).
 *
 * **`verifiedEmail` (BUG-106, CRITICO).** O passo 3 casa o `User` pelo e-mail e
 * **reescreve o `uid` do dono da conta**. Se esse e-mail vier do cliente,
 * qualquer um assume a conta de qualquer um. O argumento **so pode** receber
 * e-mail de **sessao verificada** e **so quando a sessao e o DONO do `uid`** —
 * com um admin agindo sobre outro uid, o e-mail dele resolveria para a matricula
 * errada. Na duvida, passe `undefined`: sem e-mail a funcao nao cura, o que e
 * sempre seguro.
 */
export async function findMatriculaByIdentity(
  uid: string,
  verifiedEmail?: string
): Promise<string | null> {
  const db = getAdminDb();
  const authMapRef = db.doc(`_AuthMap/${uid}`);

  // 1. Mapeamento direto (rapido, o caminho normal)
  const authMapSnap = await authMapRef.get();
  if (authMapSnap.exists && authMapSnap.data()?.matricula) {
    return authMapSnap.data()?.matricula;
  }

  // 2. Auto-healing por UID: a conta existe, o AuthMap e que faltava.
  const byUid = await db.collection("User").where("uid", "==", uid).limit(1).get();
  if (!byUid.empty) {
    const matricula = byUid.docs[0].id;
    await authMapRef.set(
      { matricula, recoveredAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
    return matricula;
  }

  // 3. Auto-healing por e-mail VERIFICADO (ver contrato acima).
  if (verifiedEmail) {
    const normalized = verifiedEmail.trim().toLowerCase();
    const byEmail = await db.collection("User").where("email", "==", normalized).limit(1).get();
    if (!byEmail.empty) {
      const matricula = byEmail.docs[0].id;
      await byEmail.docs[0].ref.update({ uid });
      await authMapRef.set(
        { matricula, recoveredAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
      return matricula;
    }
  }

  return null;
}
