import * as admin from "firebase-admin";
import { hashCpf } from "@/utils/crypto";
import { validateCPF } from "@/utils/validations";

/**
 * BPlen HUB — Indice de unicidade de CPF (unicidade por pessoa — Fase 1b).
 *
 * Camada 2 da unicidade de conta (a camada 1 e o linking por e-mail): impede que
 * o MESMO CPF vire duas contas BPlen com e-mails diferentes. Fonte unica da
 * decisao, chamada por TODOS os pontos que persistem `profile.cpf` (aba de perfil
 * e etapa de cadastro do checkout) — para nao deixar porta paralela (Licao 21/44).
 *
 * Privacidade (regra 4): o CPF nunca e gravado em claro aqui. O indice e keyed
 * pelo HASH (`hashCpf`, o mesmo ja usado no fluxo de cupom), num doc dedicado
 * `_CpfIndex/{cpfHash} -> { matricula }`. Server-only (Admin SDK); nenhuma regra
 * nova de client. A mensagem de bloqueio nao revela QUEM e o dono.
 *
 * Nunca mescla automaticamente: se o CPF pertence a outra matricula, bloqueia e
 * encaminha para contato (a transferencia manual e a ferramenta de admin da Fase 3).
 */

export const CPF_INDEX_COLLECTION = "_CpfIndex";

/** Mensagem unica de bloqueio (nao revela o dono). */
export const CPF_TAKEN_MESSAGE =
  "Este CPF ja esta vinculado a uma conta BPlen. Para acessar com este e-mail, fale com a BPlen para transferirmos sua conta.";

export type CpfOwnership = "free" | "owned" | "taken";

/**
 * Pura: dada a matricula dona atual do CPF no indice, classifica a posse para uma
 * matricula candidata. `free` = ninguem tem; `owned` = e a propria pessoa
 * reeditando; `taken` = pertence a OUTRA conta (bloqueio). Testavel sem Firestore.
 */
export function classifyCpfOwnership(
  existingMatricula: string | null | undefined,
  myMatricula: string
): CpfOwnership {
  if (!existingMatricula) return "free";
  return existingMatricula === myMatricula ? "owned" : "taken";
}

export type CpfCheckStatus = "invalid" | "available" | "owned" | "taken";

/**
 * Leitura (sem gravar): status do CPF para uma matricula. Usado pelo feedback de
 * blur no formulario. `available` = livre; `owned` = ja e seu; `taken` = de outra
 * conta; `invalid` = formato/digito verificador invalido.
 */
export async function checkCpfStatus(
  db: admin.firestore.Firestore,
  cpf: string,
  matricula: string
): Promise<CpfCheckStatus> {
  if (!validateCPF(cpf)) return "invalid";
  const ref = db.collection(CPF_INDEX_COLLECTION).doc(hashCpf(cpf));
  const snap = await ref.get();
  const owner = snap.exists ? (snap.data()?.matricula as string | undefined) : null;
  const ownership = classifyCpfOwnership(owner, matricula);
  return ownership === "free" ? "available" : ownership;
}

export type CpfClaimResult = { ok: true } | { ok: false; reason: "invalid" | "taken" };

class CpfTakenError extends Error {}

/**
 * Valida e reivindica o CPF para a matricula de forma atomica. Se pertence a
 * OUTRA matricula, retorna `taken` SEM gravar nada. Se livre ou ja e sua,
 * reivindica/atualiza o indice; se o CPF mudou (`previousCpf`), limpa o hash
 * antigo que apontava para esta matricula (evita falso-positivo futuro).
 *
 * A transacao garante que dois cadastros concorrentes com o mesmo CPF nao
 * reivindiquem ambos — so um vence.
 */
export async function assertAndClaimCpf(
  db: admin.firestore.Firestore,
  cpf: string,
  matricula: string,
  previousCpf?: string
): Promise<CpfClaimResult> {
  if (!validateCPF(cpf)) return { ok: false, reason: "invalid" };

  const newHash = hashCpf(cpf);
  const newRef = db.collection(CPF_INDEX_COLLECTION).doc(newHash);
  const oldHash = previousCpf && validateCPF(previousCpf) ? hashCpf(previousCpf) : null;
  const oldRef = oldHash && oldHash !== newHash ? db.collection(CPF_INDEX_COLLECTION).doc(oldHash) : null;

  try {
    await db.runTransaction(async (tx) => {
      // Leituras primeiro (exigencia do Firestore).
      const snap = await tx.get(newRef);
      const owner = snap.exists ? (snap.data()?.matricula as string | undefined) : null;
      if (classifyCpfOwnership(owner, matricula) === "taken") {
        throw new CpfTakenError();
      }
      const oldSnap = oldRef ? await tx.get(oldRef) : null;

      // Escritas.
      tx.set(
        newRef,
        { matricula, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
      if (oldRef && oldSnap && oldSnap.exists && oldSnap.data()?.matricula === matricula) {
        tx.delete(oldRef);
      }
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof CpfTakenError) return { ok: false, reason: "taken" };
    throw err;
  }
}
