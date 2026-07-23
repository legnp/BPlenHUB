"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-guards";
import { getErrorMessage } from "@/lib/utils/errors";
import { getAdminMetricsSnapshotOrCompute } from "@/lib/admin/metrics-snapshot";

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
 * T1-2: os agregados (soma/contagem de rating, contagem de tema) vêm do snapshot
 * diário `Admin_Metrics_Daily` em vez de full scan de `collectionGroup` a cada visita;
 * antes do 1o cron, cai em cálculo ao vivo (sem regressão). A média é derivada da
 * soma/contagem preservando a semântica anterior (só rating finito e > 0).
 */
export async function getSocialFeedbackStats(): Promise<{ stats: SocialFeedbackStats; error?: string }> {
  const empty: SocialFeedbackStats = { avgContentRating: 0, contentRatingCount: 0, themeSuggestionCount: 0 };
  try {
    await requireAdmin();
    const db = getAdminDb();

    const snap = await getAdminMetricsSnapshotOrCompute(db);
    const { contentRatingSum, contentRatingCount, themeSuggestionCount } = snap.social;

    return {
      stats: {
        avgContentRating: contentRatingCount > 0 ? contentRatingSum / contentRatingCount : 0,
        contentRatingCount,
        themeSuggestionCount,
      },
    };
  } catch (error) {
    console.error("Erro ao carregar métricas de feedback social:", error);
    return { stats: empty, error: getErrorMessage(error) };
  }
}
