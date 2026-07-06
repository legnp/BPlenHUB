"use server";

import * as admin from "firebase-admin";
import { getAdminDb, getAdminAuth } from "@/lib/firebase-admin";
import { SurveyValue } from "@/types/survey";
import { syncSurveyToUserDrive } from "@/lib/drive-sync";

/**
 * EFEITO: Welcome Survey (Onboarding) 🧬
 * Processa a criação de perfil, JourneyMap e sincronização Drive.
 */
export async function handleWelcomeSurveyEffect(
  responses: Record<string, SurveyValue>,
  matricula: string,
  userUid: string
) {
  const db = getAdminDb();
  console.log(`📡 [Effects:Welcome] Processando onboarding: ${matricula}`);

  const userRef = db.doc(`User/${matricula}`);
  const nickname = (responses.nickname as string) || "";
  const userTypeRaw = (responses.userType as string) || "member";
  const userType = userTypeRaw.includes("empresa") || userTypeRaw.includes("PJ") ? "PJ" : "PF";

  // 1. Sincronizar Identidade (Auth -> Root Profile) 🛡️
  let authName = "Membro BPlen";
  let authEmail = "";
  try {
    const authAdmin = getAdminAuth();
    const userAuth = await authAdmin.getUser(userUid);
    authName = userAuth.displayName || userAuth.email?.split("@")[0] || authName;
    authEmail = userAuth.email || "";
  } catch (authErr) {
    console.warn("⚠️ [Effects:Welcome] Falha ao buscar metadados do Auth:", authErr);
  }

  await userRef.set({
    hasCompletedWelcome: true,
    Authentication_Name: authName,
    email: authEmail,
    User_Nickname: nickname || null,
    User_Type: userType,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // 2. Sincronização Google Drive (via lib/drive-sync) 🛰️
  try {
    const headers = ["Timestamp", "Matrícula", "UID", "Nickname", "Interesses", "Origem"];
    const rowData = [
      new Date().toLocaleString("pt-BR"),
      matricula,
      userUid,
      nickname,
      Array.isArray(responses.topics) 
        ? responses.topics.map(t => (t === "Outros" && responses.topics_other) ? `Outros: ${responses.topics_other}` : t).join(", ") 
        : String(responses.topics || ""),
      responses.origin_other ? `${responses.origin} (${responses.origin_other})` : String(responses.origin || "N/A")
    ];

    await syncSurveyToUserDrive({
      matricula,
      surveyTitle: "User_Welcome",
      headers,
      rowData
    });
  } catch (driveErr) {
    console.error(`❌ [Effects:Welcome] Erro na Sincronização Drive:`, driveErr);
  }

  // 3. User_JourneyMap (mapa de jornada LEGADO) deixou de ser escrito aqui.
  // O sistema de jornada canonico e o v3 (User/{matricula}/User_Journey/progress),
  // criado/atualizado por journey.ts (lazy-write no 1o acesso). Os dados de captacao
  // do onboarding NAO se perdem: userType/nickname ficam em User_Type/User_Nickname
  // no doc do User, e origin/demand(reason)/topics(interests) ficam na resposta crua
  // do survey (User/{matricula}/Surveys/welcome_survey.data). Consolidacao: BUG-018
  // (migracao/remocao do User_JourneyMap legado dos clientes antigos = Acao 2).
}
