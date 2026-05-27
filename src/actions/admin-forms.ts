"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { FORMS_REGISTRY } from "@/config/forms";
import { FormRecord } from "@/types/forms";
import { toSafeDate } from "@/lib/date-utils";

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
 * BPlen HUB — Admin Form Strategy (Analytics 📊)
 */
export async function getAdminFormsAnalytics(): Promise<{
  forms: FormAnalyticsSummary[];
  stats: GlobalFormStats;
}> {
  try {
    const db = getAdminDb();
    
    // 1. Buscar todas as respostas via Collection Group (Caminho Hierárquico: User/*/Forms/*)
    const formsSnapshot = await db.collectionGroup("Forms").get();
    
    const allResponses = formsSnapshot.docs.map(doc => doc.data() as FormRecord);
    
    // 2. Agrupar Respostas por ID de Formulário
    const responseCountMap: Record<string, number> = {};
    const lastResponseMap: Record<string, string | null> = {};
    let responsesLast24h = 0;
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    allResponses.forEach(res => {
      const id = res.formId;
      responseCountMap[id] = (responseCountMap[id] || 0) + 1;
      
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

    // 3. Mapear com o Registro de Configurações (FORMS_REGISTRY)
    const formsSummaries: FormAnalyticsSummary[] = FORMS_REGISTRY.map(config => ({
      id: config.id,
      title: config.title,
      kind: config.kind,
      totalResponses: responseCountMap[config.id] || 0,
      status: "active",
      lastResponseAt: lastResponseMap[config.id] || null,
      sheetNamePrefix: config.sheetNamePrefix
    }));

    // 4. Estatísticas Globais
    const stats: GlobalFormStats = {
      totalGlobalResponses: allResponses.length,
      activeFormsCount: FORMS_REGISTRY.length,
      responsesLast24h
    };

    return {
      forms: formsSummaries,
      stats
    };
  } catch (err: unknown) {
    console.error("❌ [getAdminFormsAnalytics] Erro crítico:", err);
    return {
      forms: [],
      stats: { totalGlobalResponses: 0, activeFormsCount: 0, responsesLast24h: 0 }
    };
  }
}
