"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { SurveyConfig, SurveyResponse, SurveyValue } from "@/types/survey";
import { requireAuth, AuthorizationError } from "@/lib/auth-guards";

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
  // Dono-ou-admin pela MATRICULA da sessao: ate o BUG-103 a matricula vinha do
  // cliente sem conferencia, entao dava para ler as respostas de qualquer membro.
  const session = await requireAuth();
  if (session.matricula !== matricula && !session.isAdmin) {
    throw new AuthorizationError("Voce nao pode acessar as respostas de outro membro.");
  }

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
  // Dono-ou-admin pela MATRICULA da sessao: ate o BUG-103 a matricula vinha do
  // cliente sem conferencia, entao dava para ler as respostas de qualquer membro.
  const session = await requireAuth();
  if (session.matricula !== matricula && !session.isAdmin) {
    throw new AuthorizationError("Voce nao pode acessar as respostas de outro membro.");
  }

    const db: admin.firestore.Firestore = getAdminDb();
    const docRef1 = db.doc(`User/${matricula}/Surveys/survey_plano_fase1`);
    const docRef2 = db.doc(`User/${matricula}/Surveys/survey_plano_fase2`);
    const docRefPdi = db.doc(`User/${matricula}/Surveys/survey_pdi_fase1`);
    const docRefMaster = db.doc(`User/${matricula}/Surveys/master_cv`);
    const docRefCvFocado = db.doc(`User/${matricula}/Surveys/cv_focado`);

    const [snap1, snap2, snapPdi, snapMaster, snapCvFocado] = await Promise.all([
      docRef1.get(),
      docRef2.get(),
      docRefPdi.get(),
      docRefMaster.get(),
      docRefCvFocado.get()
    ]);

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

    if (snapPdi.exists) {
      const dataPdi = snapPdi.data();
      if (dataPdi && dataPdi.data) {
        Object.assign(result, dataPdi.data);
      }
    }

    if (snapMaster.exists) {
      const dataMaster = snapMaster.data();
      if (dataMaster && dataMaster.data) {
        result["master_cv"] = dataMaster.data;
      }
    }

    if (snapCvFocado.exists) {
      const dataCvFocado = snapCvFocado.data();
      if (dataCvFocado && dataCvFocado.data) {
        result["cv_focado"] = dataCvFocado.data;
      }
    }

    return result;
  } catch (error) {
    console.error("Erro [getPreviousSurveysDataAction]:", error);
    return {};
  }
}

/**
 * Recupera de forma consolidada no servidor as respostas das 4 fases do PDI (Fases 1 a 4)
 */
export async function getPdiSurveysDataAction(matricula: string): Promise<Record<string, SurveyValue>> {
  try {
  // Dono-ou-admin pela MATRICULA da sessao: ate o BUG-103 a matricula vinha do
  // cliente sem conferencia, entao dava para ler as respostas de qualquer membro.
  const session = await requireAuth();
  if (session.matricula !== matricula && !session.isAdmin) {
    throw new AuthorizationError("Voce nao pode acessar as respostas de outro membro.");
  }

    const db: admin.firestore.Firestore = getAdminDb();
    const docRef1 = db.doc(`User/${matricula}/Surveys/survey_pdi_fase1`);
    const docRef2 = db.doc(`User/${matricula}/Surveys/survey_pdi_fase2`);
    const docRef3 = db.doc(`User/${matricula}/Surveys/survey_pdi_fase3`);
    const docRef4 = db.doc(`User/${matricula}/Surveys/survey_pdi_fase4`);

    const [snap1, snap2, snap3, snap4] = await Promise.all([
      docRef1.get(),
      docRef2.get(),
      docRef3.get(),
      docRef4.get()
    ]);

    const result: Record<string, SurveyValue> = {};

    if (snap1.exists && snap1.data()?.data) {
      Object.assign(result, snap1.data()?.data);
    }
    if (snap2.exists && snap2.data()?.data) {
      Object.assign(result, snap2.data()?.data);
    }
    if (snap3.exists && snap3.data()?.data) {
      Object.assign(result, snap3.data()?.data);
    }
    if (snap4.exists && snap4.data()?.data) {
      Object.assign(result, snap4.data()?.data);
    }

    return result;
  } catch (error) {
    console.error("Erro [getPdiSurveysDataAction]:", error);
    return {};
  }
}


