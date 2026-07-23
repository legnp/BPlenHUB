"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { SURVEY_REGISTRY } from "@/config/surveys";
import { SurveyStatus } from "@/types/survey";
import { requireAdmin } from "@/lib/auth-guards";
import { getErrorMessage } from "@/lib/utils/errors";
import { getAdminMetricsSnapshotOrCompute } from "@/lib/admin/metrics-snapshot";

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

/**
 * BPlen HUB — Admin Survey Strategy (Analytics)
 */
export async function getAdminSurveysAnalytics(): Promise<{
  surveys: SurveyAnalyticsSummary[];
  stats: GlobalSurveyStats;
  error?: string;
}> {
  try {
    await requireAdmin();
    const db = getAdminDb();

    // T1-2: le o snapshot diario (Admin_Metrics_Daily) em vez de varrer a base a cada
    // visita; antes do 1o cron cai em calculo ao vivo (sem regressao). Semantica
    // preservada: aqui contam-se TODAS as respostas (sem filtro de status), como antes.
    const snap = await getAdminMetricsSnapshotOrCompute(db);

    // Mapear com o Registro de Configurações (SURVEY_REGISTRY) + contagens do snapshot
    const surveysSummaries: SurveyAnalyticsSummary[] = SURVEY_REGISTRY.map(config => ({
      id: config.id,
      title: config.title,
      totalResponses: snap.surveys.countById[config.id] || 0,
      status: "completed", // Simplificado: se está no registry e tem motor, está ativa
      lastResponseAt: snap.surveys.lastResponseAtById[config.id] || null,
      completionRate: 100 // Placeholder analítico: futuramente pode ser (concluidas / iniciadas)
    }));

    // Estatísticas Globais
    const stats: GlobalSurveyStats = {
      totalGlobalResponses: snap.surveys.total,
      activeSurveysCount: SURVEY_REGISTRY.length,
      responsesLast24h: snap.surveys.last24hAll
    };

    return {
      surveys: surveysSummaries,
      stats
    };
  } catch (err: unknown) {
    console.error("[getAdminSurveysAnalytics] Erro crítico:", err);
    // Falha não vira "0 respostas" mudo (BUG-096): devolve `error` para a página
    // distinguir "sem dados" de "não consegui ler" (ex.: cota do Firestore).
    return {
      surveys: [],
      stats: { totalGlobalResponses: 0, activeSurveysCount: 0, responsesLast24h: 0 },
      error: getErrorMessage(err, "Falha ao carregar as estatísticas de pesquisas.")
    };
  }
}
