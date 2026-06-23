"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { SurveyConfig, SurveyResponse, SurveyValue } from "@/types/survey";

/**
 * BPlen HUB — Submit Institutional Survey (📡)
 * Persiste as respostas de uma survey de forma hierárquica por usuário.
 * Aderente à Survey_Global e Soberania de Dados (Server-Authoritative).
 */
export async function submitSurvey(config: SurveyConfig, responses: Record<string, SurveyValue>, userUid: string) {
  try {
    const db: admin.firestore.Firestore = getAdminDb();
    
    // 1. Resolver Matrícula e Identidade (Soberania de Acesso via Effects 🧬)
    const { resolveUserIdentity, handleSurveySideEffects } = await import("./survey-effects");
    console.log(`🔍 [SubmitSurvey] Iniciando resolução para UID: ${userUid}`);
    const matricula = await resolveUserIdentity(config.id, responses, userUid);
    console.log(`🔍 [SubmitSurvey] Matrícula Resolvida: ${matricula}`);

    // 2. Preparar Payload de Resposta (SurveyResponse)
    const surveyPath = `User/${matricula}/Surveys/${config.id}`;
    const surveyRef = db.doc(surveyPath);
    console.log(`🔍 [SubmitSurvey] Gravando Resposta em: ${surveyPath}`);
    
    const payload: SurveyResponse = {
      surveyId: config.id,
      matricula,
      status: "completed",
      data: responses,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: config.analytics
    };

    // 3. Persistir Record conforme Survey_Global (Escrita Soberana 🛡️)
    await surveyRef.set(payload, { merge: true });

    // 4. Disparar Efeitos Colaterais (Business Logic 🧠)
    console.log(`📡 [SubmitSurvey:Trigger] Acionando Side Effects para ${config.id}...`);
    await handleSurveySideEffects(config.id, responses, matricula, userUid);
    console.log(`✅ [SubmitSurvey:Finish] Fluxo completo para ${config.id}`);

    return { success: true, matricula };
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`❌ Erro [submitSurvey] para ${config.id}:`, error);
    throw new Error(error.message || "Falha ao processar pesquisa.");
  }
}

/**
 * BPlen HUB — checkSurveyCompletedAction (📡)
 * Verifica de forma resiliente no servidor se uma pesquisa já foi concluída no Firestore.
 */
export async function checkSurveyCompletedAction(matricula: string, surveyId: string): Promise<boolean> {
  try {
    const db: admin.firestore.Firestore = getAdminDb();
    const doc = await db.doc(`User/${matricula}/Surveys/${surveyId}`).get();
    return doc.exists && doc.data()?.status === "completed";
  } catch (error) {
    console.error("Erro [checkSurveyCompletedAction] para " + surveyId + ":", error);
    return false;
  }
}

export async function getPreviousSurveysDataAction(matricula: string): Promise<Record<string, unknown>> {
  try {
    const db: admin.firestore.Firestore = getAdminDb();
    const docRef1 = db.doc(`User/${matricula}/Surveys/survey_plano_fase1`);
    const docRef2 = db.doc(`User/${matricula}/Surveys/survey_plano_fase2`);

    const [snap1, snap2] = await Promise.all([docRef1.get(), docRef2.get()]);

    const result: Record<string, unknown> = {};

    if (snap1.exists) {
      const data1 = snap1.data();
      if (data1 && data1.data) {
        Object.assign(result, data1.data);
      }
    }

    if (snap2.exists) {
      const data2 = snap2.data();
      if (data2 && data2.data) {
        Object.assign(result, data2.data);
      }
    }

    return result;
  } catch (error) {
    console.error("Erro [getPreviousSurveysDataAction]:", error);
    return {};
  }
}

