import { getAdminDb } from "@/lib/firebase-admin";

/**
 * Resolucao de matricula a partir da identidade — camada CRUA, sem guard.
 *
 * Este arquivo NAO e `"use server"`: nao e endpoint de rede. Ate o `BUG-103`
 * esta funcao vivia em `src/actions/get-user-results.ts` (que e `"use server"`),
 * entao qualquer chamador podia descobrir a matricula de outra pessoa a partir
 * de um uid ou e-mail.
 *
 * Guardar a funcao no lugar nao era o caminho: ela e **primitivo de
 * infraestrutura**, chamado por 8 modulos (checkout, cupom, mp-checkout, orders,
 * perfil profissional, cadastro, e os proprios getters de resultado) que **ja
 * autenticaram** e passam `session.uid`. Um guard aqui seria redundante em ~20
 * pontos e custaria uma leitura de sessao no caminho quente do checkout.
 * Mesmo desenho do lote 7 do `BUG-020` e da carteira de cotas (Protocolo item 8).
 *
 * REGRA: quem chama daqui ja verificou identidade. Nao reexportar de um arquivo
 * `"use server"` sem guard proprio.
 */
export async function resolveMatricula(userUid: string, email?: string): Promise<string | null> {
  const db = getAdminDb();
  console.log(`🔍 [GetResults:resolveMatricula] Resolvendo para UID: ${userUid}, Email: ${email}`);
  
  // 1. Tentar Mapeamento Direto (AuthMap) - Alta Performance
  const authMapSnap = await db.doc(`_AuthMap/${userUid}`).get();
  if (authMapSnap.exists && authMapSnap.data()?.matricula) {
    const mat = authMapSnap.data()?.matricula;
    console.log(`🔍 [GetResults:resolveMatricula] Matrícula via AuthMap: ${mat}`);
    return mat;
  }

  // 2. Fallback: Buscar na base User por ID de Autenticação (UID)
  const userByUidSnap = await db.collection("User").where("uid", "==", userUid).limit(1).get();
  if (!userByUidSnap.empty) {
    const matricula = userByUidSnap.docs[0].id;
    console.log(`🔍 [GetResults:resolveMatricula] Matrícula via UID Search: ${matricula}`);
    // Auto-Healing: Grava no AuthMap para a próxima vez
    await db.doc(`_AuthMap/${userUid}`).set({ matricula, recoveredAt: new Date() }, { merge: true });
    return matricula;
  }

  // 3. Last Resort: Buscar por E-mail (Normalizado)
  if (email) {
    const normalizedEmail = email.trim().toLowerCase();
    const userByEmailSnap = await db.collection("User").where("email", "==", normalizedEmail).limit(1).get();
    if (!userByEmailSnap.empty) {
      const matricula = userByEmailSnap.docs[0].id;
      console.log(`🔍 [GetResults:resolveMatricula] Matrícula via Email Search: ${matricula}`);
      
      // Auto-Healing: Vincula o UID atual à matrícula e atualiza o AuthMap
      await userByEmailSnap.docs[0].ref.update({ uid: userUid });
      await db.doc(`_AuthMap/${userUid}`).set({ matricula, recoveredAt: new Date() }, { merge: true });
      return matricula;
    }
  }

  console.warn(`⚠️ [GetResults:resolveMatricula] Nenhuma matrícula legítima para UID: ${userUid}`);
  return null;
}
