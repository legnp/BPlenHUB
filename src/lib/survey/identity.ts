import admin from "@/lib/firebase-admin";
import { getAdminDb } from "@/lib/firebase-admin";
import { SurveyValue } from "@/types/survey";

/**
 * Identidade do respondente — camada CRUA, sem guard (lote 2b.2-B do `BUG-103`).
 *
 * Este arquivo **nao e `"use server"`**: nao e endpoint de rede. Ate aqui as duas
 * funcoes abaixo eram exportadas de `actions/survey-effects.ts` (que e
 * `"use server"`), logo qualquer requisicao podia:
 *
 * - **cunhar matricula** em serie, chamando `resolveUserIdentity` com
 *   `welcome_survey`/`dados_cadastrais` e um uid arbitrario — o ramo de
 *   cunhagem incrementa o **contador global** `_internal/counters/user/global`;
 * - **ler apelido e metadados de permissao** de qualquer pessoa, passando o uid
 *   dela em `getUserMetadata`.
 *
 * A protecao nao e um guard aqui dentro: e o **formato da assinatura exposta**.
 * Os actions de `survey-effects.ts` nao recebem uid — resolvem tudo pela sessao,
 * entao ninguem consegue dizer "sou esse uid". Quem chama daqui ja verificou
 * identidade (a sessao, ou o proprio `submitSurvey` que a resolveu antes).
 */

/**
 * Resolve ou Gera a Matrícula do usuário (🧬 Soberania de Identidade)
 */
/**
 * Pasta unica onde todo envio anonimo se concentra. Conceitualmente, a base de
 * analise de personas da BPlen: o anonimo nao deixa chave, entao ela serve a
 * padroes agregados (que temas atraem visitante), nunca a rastrear individuos.
 */
export const ANON_MATRICULA = "BP-ANON";

export async function resolveUserIdentity(surveyId: string, responses: Record<string, SurveyValue>, userUid?: string): Promise<string> {
  const db: admin.firestore.Firestore = getAdminDb();
  const authMapRef = db.doc(`_AuthMap/${userUid}`);

  // Acesso anonimo: nao ha identidade a resolver.
  if (!userUid) {
    // PASTA UNICA DE ANONIMOS (pedido da Gestora, 2026-07-20). Antes cada envio
    // criava `BP-ANON-<timestamp>` proprio, espalhando um doc de User por
    // submissao. Concentrar tudo em `BP-ANON` da a ela uma base unica de analise
    // de personas — e continua sincronizando no Drive, que e a estrategia de
    // backup independente da plataforma.
    //
    // ATENCAO: quem grava precisa dar id UNICO ao documento dentro desta pasta.
    // O caminho de escrita e `User/{matricula}/Surveys/{surveyId}` — com a pasta
    // compartilhada, dois visitantes avaliando o MESMO artigo colidiriam e o
    // segundo apagaria o primeiro. Ver `ANON_MATRICULA` em quem escreve.
    console.log(`[Identity] Acesso anonimo para survey: ${surveyId}`);
    return ANON_MATRICULA;
  }

  // Passos 1-3 (AuthMap -> UID -> e-mail verificado) vivem na FONTE UNICA
  // `@/lib/identity/find-matricula`. Ate o lote 2b.2 do BUG-103 eram uma copia
  // desta funcao, irma da de `lib/user-matricula.ts` — e foi essa duplicacao que
  // deixou o padrao do BUG-032 sobreviver aqui ate virar o BUG-106.
  //
  // O e-mail vem da SESSAO VERIFICADA, nunca de `responses.email` (BUG-106,
  // Critico): o passo 3 reescreve o `uid` do dono da conta, entao ler o e-mail de
  // um campo de formulario era sequestro de conta. `getServerSession()` devolve
  // null sem sessao, logo o caminho publico simplesmente nao cura.
  const { getServerSession } = await import("@/lib/server-session");
  const { findMatriculaByIdentity } = await import("@/lib/identity/find-matricula");
  const sessionForHealing = await getServerSession();
  const verifiedEmail = sessionForHealing?.uid === userUid ? sessionForHealing.email : undefined;

  const existente = await findMatriculaByIdentity(userUid, verifiedEmail);
  if (existente) return existente;

  if (surveyId === "welcome_survey" || surveyId === "dados_cadastrais") {
    return await db.runTransaction(async (transaction) => {
      const counterRef = db.doc("_internal/counters/user/global");
      const counterSnap = await transaction.get(counterRef);
      const count = (counterSnap.data()?.count || 0) + 1;
      transaction.set(counterRef, { count, lastUpdated: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      const seq = count.toString().padStart(3, "0");
      const userTypeRaw = (responses.userType as string) || "PF";
      const type = userTypeRaw.includes("empresa") || userTypeRaw.includes("PJ") ? "PJ" : "PF";
      const aammdd = new Date().toISOString().slice(2, 10).replace(/-/g, "");
      const newMat = `BP-${seq}-${type}-${aammdd}`;
      transaction.set(authMapRef, { matricula: newMat, createdAt: admin.firestore.FieldValue.serverTimestamp() });
      return newMat;
    });
  }

  throw new Error("Sua identidade BPlen não pôde ser resolvida.");
}

/**
 * Recupera metadados de permissão do usuário
 */
export async function getUserMetadata(userUid: string) {
  try {
    const db = getAdminDb();
    const authMapSnap = await db.doc(`_AuthMap/${userUid}`).get();
    const matricula = authMapSnap.data()?.matricula;
    if (!matricula) return {};
    
    // Fetch User Nickname (Soberania de Dados v2.0)
    const userSnap = await db.doc(`User/${matricula}`).get();
    const userData = userSnap.data() || {};
    const nickname = userData.User_Nickname || userData.User_Welcome?.User_Nickname || userData.Authentication_Name || userData.User_Name || "Membro";

    const accessSnap = await db.doc(`User/${matricula}/User_Permissions/access`).get();
    const metadata = accessSnap.data()?.metadata || {};

    return { 
      ...metadata, 
      User_Nickname: nickname,
      name: nickname 
    };
  } catch (err) {
    return {};
  }
}
