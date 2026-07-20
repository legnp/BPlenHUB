"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { SurveyValue } from "@/types/survey";

// Importações dos Módulos Decompostos (Arquitetura Fase 2 🏗️)
import { handleWelcomeSurveyEffect } from "./effects/welcome-survey";
import { handleGestaoTempoEffect } from "./effects/gestao-tempo";
import { handlePreferenciasAprendizadoEffect } from "./effects/preferencias-aprendizado";
import { handlePreferenciasReconhecimentoEffect } from "./effects/preferencias-reconhecimento";
import { handlePreAnaliseComportamentalEffect } from "./effects/pre-analise-comportamental";
import { handleCheckInEffect, handleContentFeedbackEffect, handleCVReviewEffect, handleDesmistificandoCandidaturasEffect } from "./effects/misc-surveys";

/**
 * BPlen HUB — Survey Effects Dispatcher (🧠)
 * Centraliza a orquestração de efeitos colaterais após o salvamento de pesquisas.
 * Decomposto em módulos específicos para facilitar a manutenção e escala.
 */

/**
 * Resolve ou Gera a Matrícula do usuário (🧬 Soberania de Identidade)
 */
export async function resolveUserIdentity(surveyId: string, responses: Record<string, SurveyValue>, userUid?: string): Promise<string> {
  const db: admin.firestore.Firestore = getAdminDb();
  const authMapRef = db.doc(`_AuthMap/${userUid}`);

  // Acesso anonimo: nao ha identidade a resolver.
  if (!userUid) {
    console.log(`[Effects:Identity] Acesso anonimo para survey: ${surveyId}`);
    return `BP-ANON-${new Date().getTime()}`;
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

/**
 * DESPACHANTE DE EFEITOS COLATERAIS ⚡
 * Roteia a execução para o módulo responsável por cada Survey.
 */
export async function handleSurveySideEffects(surveyId: string, responses: Record<string, SurveyValue>, matricula: string, userUid?: string) {
  console.log(`🔥 [SurveyEffects] Dispatching: "${surveyId}" para ${matricula}`);

  try {
    switch (surveyId) {
      case "welcome_survey":
        // O welcome exige usuario autenticado — e onde a matricula nasce. Sem uid
        // nao ha identidade a sincronizar, e chegar aqui anonimo seria estado
        // invalido; a guarda torna isso explicito em vez de alargar o tipo.
        if (userUid) await handleWelcomeSurveyEffect(responses, matricula, userUid);
        break;

      case "check_in":
      case "check_in_v1":
        await handleCheckInEffect(responses, matricula);
        break;

      case "gestao_tempo":
        await handleGestaoTempoEffect(responses, matricula);
        break;

      case "preferencias_aprendizado":
        await handlePreferenciasAprendizadoEffect(responses, matricula);
        break;

      case "preferencias_reconhecimento":
        await handlePreferenciasReconhecimentoEffect(responses, matricula);
        break;

      case "pre_analise_comportamental":
        await handlePreAnaliseComportamentalEffect(responses, matricula);
        break;

      case "desmistificando_candidaturas":
        await handleDesmistificandoCandidaturasEffect(responses, matricula);
        break;

      case "revisao_curriculo":
        await handleCVReviewEffect(responses, matricula);
        break;

      default:
        if (surveyId.startsWith("content_evaluation_")) {
          // Extraímos o título dinâmico da avaliação, se não existir, usa o ID
          const tituloAvaliacao = String(responses.title || `Artigo/Post ID: ${surveyId.replace("content_evaluation_", "")}`);
          await handleContentFeedbackEffect(responses, matricula, `Avaliação - ${tituloAvaliacao}`);
        } else {
          console.warn(`⚠️ [SurveyEffects] Nenhum efeito colateral mapeado para: ${surveyId}`);
        }
    }
  } catch (globalErr) {
    console.error(`🚨 [SurveyEffects:Fatal] Falha no Dispatcher (${surveyId}):`, globalErr);
  }
}
