"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { SURVEY_REGISTRY } from "@/config/surveys";
import { SurveyResponse, SurveyStatus } from "@/types/survey";
import { requireAdmin } from "@/lib/auth-guards";

export interface SurveyAnalyticsSummary {
  id: string;
  title: string;
  totalResponses: number;
  status: SurveyStatus;
  lastResponseAt: string | null;
  completionRate: number; // Mockado por enquanto, mas preparado para real
}

export interface GlobalSurveyStats {
  totalGlobalResponses: number;
  activeSurveysCount: number;
  responsesLast24h: number;
}

import { toSafeDate } from "@/lib/date-utils";

/**
 * BPlen HUB — Admin Survey Strategy (Analytics 📊)
 */
export async function getAdminSurveysAnalytics(): Promise<{
  surveys: SurveyAnalyticsSummary[];
  stats: GlobalSurveyStats;
}> {
  try {
    await requireAdmin();
    const db = getAdminDb();

    // 1. Buscar todas as respostas via Collection Group (Caminho Hierárquico: User/*/Surveys/*)
    const surveysSnapshot = await db.collectionGroup("Surveys").get();
    
    const allResponses = surveysSnapshot.docs.map(doc => doc.data() as SurveyResponse);
    
    // 2. Agrupar Respostas por ID de Pesquisa
    const responseCountMap: Record<string, number> = {};
    const lastResponseMap: Record<string, string | null> = {};
    let responsesLast24h = 0;
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    allResponses.forEach(res => {
      const id = res.surveyId;
      responseCountMap[id] = (responseCountMap[id] || 0) + 1;
      
      // Converter Timestamp para String ISO de forma segura (Governança 🛡️)
      const subAt = toSafeDate(res.submittedAt);

      if (subAt) {
        const iso = subAt.toISOString();
        if (!lastResponseMap[id] || iso > (lastResponseMap[id] || "")) {
          lastResponseMap[id] = iso;
        }
        if (subAt >= oneDayAgo) {
          responsesLast24h++;
        }
      }
    });

    // 3. Mapear com o Registro de Configurações (SURVEY_REGISTRY)
    const surveysSummaries: SurveyAnalyticsSummary[] = SURVEY_REGISTRY.map(config => ({
      id: config.id,
      title: config.title,
      totalResponses: responseCountMap[config.id] || 0,
      status: "completed", // Simplificado: se está no registry e tem motor, está ativa
      lastResponseAt: lastResponseMap[config.id] || null,
      completionRate: 100 // Placeholder analítico: futuramente pode ser (concluidas / iniciadas)
    }));

    // 4. Estatísticas Globais
    const stats: GlobalSurveyStats = {
      totalGlobalResponses: allResponses.length,
      activeSurveysCount: SURVEY_REGISTRY.length,
      responsesLast24h
    };

    return {
      surveys: surveysSummaries,
      stats
    };
  } catch (err: unknown) {
    console.error("❌ [getAdminSurveysAnalytics] Erro crítico:", err);
    return {
      surveys: [],
      stats: { totalGlobalResponses: 0, activeSurveysCount: 0, responsesLast24h: 0 }
    };
  }
}
