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

  // 3. Criação do User_JourneyMap (Ciclo de Vida Completo 🧬)
  try {
    console.log(`🗺️ [Effects:Welcome] Criando mapa de jornada para: ${matricula}`);
    const journeyMapRef = db.doc(`User/${matricula}/User_JourneyMap/progress`);

    await journeyMapRef.set({
      currentPhase: "venda",
      currentStep: "onboarding",
      overallProgress: 0,
      phases: {
        atracao: {
          status: "completed",
          capturedData: {
            userType,
            origin: responses.origin_other ? `${responses.origin} (${responses.origin_other})` : String(responses.origin || "N/A"),
            reason: String(responses.demand || "N/A"),
            interests: Array.isArray(responses.topics) 
              ? responses.topics.map(t => (t === "Outros" && responses.topics_other) ? `Outros: ${responses.topics_other}` : t) 
              : [],
            nickname,
          },
          completedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        qualificacao: {
          status: "locked",
          steps: {
            preparacao_candidaturas: { status: "locked", checkpoints: {}, progress: 0 },
            mapa_carreira: { status: "locked", checkpoints: {}, progress: 0 },
            autoanalise_basica: { status: "locked", checkpoints: {}, progress: 0 },
            banco_talentos: { status: "locked", checkpoints: {}, progress: 0 },
            workshops_eventos: { status: "locked", checkpoints: {}, progress: 0 },
          }
        },
        venda: {
          status: "in_progress",
          steps: {
            onboarding: {
              status: "in_progress",
              checkpoints: {
                introducao: { completed: false },
                checkin: { completed: false },
                sessao_onboarding: { completed: false },
              },
              progress: 0
            },
            "preparacao-de-carreira": { status: "locked", checkpoints: {}, progress: 0 },
            "analise-comportamental": { status: "locked", checkpoints: {}, progress: 0 },
            "plano-de-carreira": { status: "locked", checkpoints: {}, progress: 0 },
            "desenvolvimento-de-carreira": { status: "locked", checkpoints: {}, progress: 0 },
            "coaching-e-mentoria": { status: "locked", checkpoints: {}, progress: 0 },
            offboarding: { status: "locked", checkpoints: {}, progress: 0 },
          }
        },
        pos_venda: {
          status: "locked",
          steps: {
            alumni: { status: "locked", checkpoints: {}, progress: 0 },
            embaixador: { status: "locked", checkpoints: {}, progress: 0 },
          }
        }
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (journeyErr) {
    console.error(`❌ [Effects:Welcome] Erro ao criar mapa de jornada:`, journeyErr);
  }
}
