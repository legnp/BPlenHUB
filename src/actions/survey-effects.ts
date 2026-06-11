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
import { handleCheckInEffect, handleContentFeedbackEffect, handleCVReviewEffect } from "./effects/misc-surveys";

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
  
  if (!userUid) {
     console.log(`⚠️ [Effects:Identity] Acesso anônimo detectado para survey: ${surveyId}`);
     return `BP-ANON-${new Date().getTime()}`;
  }

  const authMapRef = db.doc(`_AuthMap/${userUid}`);
  const authMapSnap = await authMapRef.get();
  if (authMapSnap.exists && authMapSnap.data()?.matricula) {
    return authMapSnap.data()?.matricula;
  }

  const userByUidSnap = await db.collection("User").where("uid", "==", userUid).limit(1).get();
  if (!userByUidSnap.empty) {
    const matricula = userByUidSnap.docs[0].id;
    await authMapRef.set({ matricula, recoveredAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    return matricula;
  }

  // Fallback: E-mail
  const userEmail = (responses.email as string) || "";
  if (userEmail) {
    const normalizedEmail = userEmail.trim().toLowerCase();
    const userByEmailSnap = await db.collection("User").where("email", "==", normalizedEmail).limit(1).get();
    if (!userByEmailSnap.empty) {
      const matricula = userByEmailSnap.docs[0].id;
      await userByEmailSnap.docs[0].ref.update({ uid: userUid });
      await authMapRef.set({ matricula, recoveredAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      return matricula;
    }
  }

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
export async function handleSurveySideEffects(surveyId: string, responses: Record<string, SurveyValue>, matricula: string, userUid: string) {
  console.log(`🔥 [SurveyEffects] Dispatching: "${surveyId}" para ${matricula}`);

  try {
    switch (surveyId) {
      case "welcome_survey":
        await handleWelcomeSurveyEffect(responses, matricula, userUid);
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
        await handleContentFeedbackEffect(responses, matricula, "Desmistificando Candidaturas");
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
