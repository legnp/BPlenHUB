"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { SurveyResponse, SurveyStatus, SurveyValue } from "@/types/survey";

/**
 * MIGRATION SCRIPT — WelcomeSurvey Legacy to Institutional 🧬
 * Move dados de User/{mat}.User_Welcome para User/{mat}/Surveys/welcome_survey.
 * Soberania Admin para processamento em lote (Bulk Migration).
 */
export interface WelcomeMigrationResults {
  total: number;
  migrated: number;
  skipped: number;
  errors: number;
}

export async function runWelcomeMigration() {
  const results: WelcomeMigrationResults = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0
  };

  try {
    const db = getAdminDb();
    const usersSnap = await db.collection("User").get();
    results.total = usersSnap.size;

    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      const matricula = userDoc.id;
      const legacyWelcome = userData.User_Welcome;

      // 1. Verificar se há dados legados
      if (!legacyWelcome) {
        results.skipped++;
        continue;
      }

      const surveyRef = db.collection("User").doc(matricula).collection("Surveys").doc("welcome_survey");

      // 2. Mapeamento de Campos (Legacy -> Institutional)
      const institutionalData: Record<string, SurveyValue> = {
        nickname: legacyWelcome.User_Nickname || legacyWelcome.nickname || "",
        userType: legacyWelcome.User_Type || legacyWelcome.userType || "",
        topics: legacyWelcome.Customer_FirstTopics || legacyWelcome.topics || [],
        demand: legacyWelcome.Customer_FirstDemand || legacyWelcome.demand || "",
        origin: legacyWelcome.Customer_Origin || legacyWelcome.origin || ""
      };

      const payload: SurveyResponse = {
        surveyId: "welcome_survey",
        matricula,
        status: "completed" as SurveyStatus,
        data: institutionalData,
        submittedAt: legacyWelcome.submittedAt || admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          surveyId: "welcome_survey",
          domain: "ONBOARDING",
          context: "migration_v1_to_v2",
          version: "2.0"
        }
      };

      try {
        // A. Gravar na Subcoleção (Survey_Global)
        await surveyRef.set(payload, { merge: true });

        // B. Atualizar Raiz do Usuário (Identificação Core 🛡️)
        const userRef = db.collection("User").doc(matricula);
        await userRef.set({
          hasCompletedWelcome: true,
          Authentication_Name: legacyWelcome.Authentication_Name || legacyWelcome.name || userData.Authentication_Name || userData.User_Name || "Membro BPlen",
          email: legacyWelcome.email || legacyWelcome.User_Email || userData.email || userData.User_Email || "",
          User_Nickname: institutionalData.nickname,
          User_Type: String(institutionalData.userType).includes("empresa") || String(institutionalData.userType).includes("PJ") ? "PJ" : "PF",
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        results.migrated++;
        console.log(`✅ [Migration] Usuário migrado com sucesso: ${matricula}`);
      } catch (e) {
        console.error(`❌ [Migration] Erro ao migrar ${matricula}:`, e);
        results.errors++;
      }
    }

    return { success: true, results };
  } catch (error) {
    console.error("Erro crítico na migração:", error);
    throw error;
  }
}
