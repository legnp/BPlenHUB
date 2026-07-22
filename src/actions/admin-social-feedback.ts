"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-guards";
import { getErrorMessage } from "@/lib/utils/errors";

export interface SocialFeedbackStats {
  /** Média das notas (1 a 5) das avaliações de conteúdo. */
  avgContentRating: number;
  /** Quantidade de avaliações de conteúdo recebidas. */
  contentRatingCount: number;
  /** Total de sugestões de tema recebidas. */
  themeSuggestionCount: number;
}

/**
 * Métricas de voz do usuário para o painel de Mídia e Editorial:
 * - Avaliações de conteúdo (`submitContentFeedback`) vivem como surveys com id
 *   dinâmico `content_evaluation_<postId>`; a nota (1-5) fica em `data.rating`.
 * - Sugestões de tema (`submitThemeSuggestion`) vivem como forms com
 *   `formId === "theme_suggestion"`.
 *
 * NOTE: leitura por full scan de `collectionGroup`, o mesmo padrão de
 * `getAdminSurveysAnalytics`/`getAdminFormsAnalytics` (débito T-01 conhecido;
 * otimizar com `where` + índice de collection group se o volume crescer).
 */
export async function getSocialFeedbackStats(): Promise<{ stats: SocialFeedbackStats; error?: string }> {
  const empty: SocialFeedbackStats = { avgContentRating: 0, contentRatingCount: 0, themeSuggestionCount: 0 };
  try {
    await requireAdmin();
    const db = getAdminDb();

    const surveysSnap = await db.collectionGroup("Surveys").get();
    let ratingSum = 0;
    let ratingCount = 0;
    surveysSnap.forEach((doc) => {
      const r = doc.data() as { surveyId?: string; data?: Record<string, unknown> };
      if (typeof r.surveyId === "string" && r.surveyId.startsWith("content_evaluation")) {
        const rating = Number(r.data?.rating);
        if (Number.isFinite(rating) && rating > 0) {
          ratingSum += rating;
          ratingCount += 1;
        }
      }
    });

    const formsSnap = await db.collectionGroup("Forms").get();
    let themeSuggestionCount = 0;
    formsSnap.forEach((doc) => {
      const r = doc.data() as { formId?: string };
      if (r.formId === "theme_suggestion") themeSuggestionCount += 1;
    });

    return {
      stats: {
        avgContentRating: ratingCount > 0 ? ratingSum / ratingCount : 0,
        contentRatingCount: ratingCount,
        themeSuggestionCount,
      },
    };
  } catch (error) {
    console.error("Erro ao carregar métricas de feedback social:", error);
    return { stats: empty, error: getErrorMessage(error) };
  }
}
