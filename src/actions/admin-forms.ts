"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { FORMS_REGISTRY } from "@/config/forms";
import { requireAdmin } from "@/lib/auth-guards";
import { getErrorMessage } from "@/lib/utils/errors";
import { getAdminMetricsSnapshotOrCompute } from "@/lib/admin/metrics-snapshot";

export interface FormAnalyticsSummary {
  id: string;
  title: string;
  kind: string;
  totalResponses: number;
  status: "active" | "inactive";
  lastResponseAt: string | null;
  sheetNamePrefix?: string;
}

export interface GlobalFormStats {
  totalGlobalResponses: number;
  activeFormsCount: number;
  responsesLast24h: number;
}

/**
 * BPlen HUB — Admin Form Strategy (Analytics)
 */
export async function getAdminFormsAnalytics(): Promise<{
  forms: FormAnalyticsSummary[];
  stats: GlobalFormStats;
  error?: string;
}> {
  try {
    await requireAdmin();
    const db = getAdminDb();

    // T1-2: le o snapshot diario (Admin_Metrics_Daily) em vez de varrer a base a cada
    // visita; antes do 1o cron cai em calculo ao vivo (sem regressao). Semantica
    // preservada: aqui contam-se TODAS as respostas (sem filtro de status), como antes.
    const snap = await getAdminMetricsSnapshotOrCompute(db);

    // Mapear com o Registro de Configurações (FORMS_REGISTRY) + contagens do snapshot
    const formsSummaries: FormAnalyticsSummary[] = FORMS_REGISTRY.map(config => ({
      id: config.id,
      title: config.title,
      kind: config.kind,
      totalResponses: snap.forms.countById[config.id] || 0,
      status: "active",
      lastResponseAt: snap.forms.lastResponseAtById[config.id] || null,
      sheetNamePrefix: config.sheetNamePrefix
    }));

    // Estatísticas Globais
    const stats: GlobalFormStats = {
      totalGlobalResponses: snap.forms.total,
      activeFormsCount: FORMS_REGISTRY.length,
      responsesLast24h: snap.forms.last24hAll
    };

    return {
      forms: formsSummaries,
      stats
    };
  } catch (err: unknown) {
    console.error("[getAdminFormsAnalytics] Erro crítico:", err);
    // Falha não vira "0 respostas" mudo (BUG-096): devolve `error` para a página
    // distinguir "sem dados" de "não consegui ler" (ex.: cota do Firestore).
    return {
      forms: [],
      stats: { totalGlobalResponses: 0, activeFormsCount: 0, responsesLast24h: 0 },
      error: getErrorMessage(err, "Falha ao carregar as estatísticas de formulários.")
    };
  }
}
