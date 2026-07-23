"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { SURVEY_REGISTRY } from "@/config/surveys";
import { FORMS_REGISTRY } from "@/config/forms";
import { SurveyResponse } from "@/types/survey";
import { FormRecord } from "@/types/forms";
import { toSafeDate } from "@/lib/date-utils";
import { requireAdmin } from "@/lib/auth-guards";
import { getErrorMessage } from "@/lib/utils/errors";
import { getAdminMetricsSnapshotOrCompute } from "@/lib/admin/metrics-snapshot";

export interface FSRegistrySummary {
  id: string;
  title: string;
  type: "form" | "survey";
  totalResponses: number;
}

export interface FSGlobalStats {
  totalForms: number;
  totalSurveys: number;
  totalGlobalResponses: number;
  responsesLast24h: number;
}

export interface FSRespondent {
  matricula: string;
  name: string;
  nickname: string;
  submittedAt: string;
  userUid?: string;
}

export interface FSItemDetails {
  id: string;
  title: string;
  type: "form" | "survey";
  totalRespondents: number;
  averageCompletionTimeSeconds: number | null; // null se for form ou se não houver dados
  respondents: FSRespondent[];
}

/**
 * Busca estatísticas unificadas e lista de estruturas disponíveis de Formulários & Pesquisas.
 */
export async function getAdminFSAnalytics(): Promise<{
  success: boolean;
  stats?: FSGlobalStats;
  items?: FSRegistrySummary[];
  error?: string;
}> {
  try {
    // Seguranca real no servidor.
    await requireAdmin();

    const db = getAdminDb();

    // T1-2: le o snapshot diario (Admin_Metrics_Daily) em vez de varrer a base a cada
    // visita. Antes do 1o cron, cai em calculo ao vivo (mesmo custo de antes, sem
    // regressao). A semantica e preservada: aqui contam surveys `completed` e forms
    // `submitted`/`updated`, mais os cadastros derivados do perfil (dados_cadastrais).
    const snap = await getAdminMetricsSnapshotOrCompute(db);

    // Mapear itens disponiveis usando os registros estaticos (Registry) + as contagens
    // data-derived do snapshot. dados_cadastrais soma os cadastros do perfil (como antes,
    // que os unia aos forms) alem de eventuais docs reais na colecao Forms.
    const items: FSRegistrySummary[] = [
      ...SURVEY_REGISTRY.map(s => ({
        id: s.id,
        title: s.title,
        type: "survey" as const,
        totalResponses: snap.surveys.completedCountById[s.id] || 0,
      })),
      ...FORMS_REGISTRY.map(f => ({
        id: f.id,
        title: f.title,
        type: "form" as const,
        totalResponses:
          f.id === "dados_cadastrais"
            ? (snap.forms.submittedUpdatedCountById[f.id] || 0) + snap.registrations.count
            : snap.forms.submittedUpdatedCountById[f.id] || 0,
      })),
    ];

    // Estatisticas Globais
    const stats: FSGlobalStats = {
      totalForms: FORMS_REGISTRY.length,
      totalSurveys: SURVEY_REGISTRY.length,
      totalGlobalResponses:
        snap.surveys.completedTotal + snap.forms.submittedUpdatedTotal + snap.registrations.count,
      responsesLast24h:
        snap.surveys.last24hCompleted + snap.forms.last24hSubmittedUpdated + snap.registrations.last24h,
    };

    return {
      success: true,
      stats,
      items: items.sort((a, b) => b.totalResponses - a.totalResponses), // Ordena por popularidade
    };
  } catch (err: unknown) {
    console.error("[getAdminFSAnalytics] Erro crítico:", err);
    return {
      success: false,
      error: getErrorMessage(err, "Falha ao processar estatísticas unificadas."),
    };
  }
}

/**
 * Busca os detalhes específicos e respondentes de um determinado Formulário ou Pesquisa.
 */
export async function getFSItemDetails(
  id: string,
  type: "form" | "survey"
): Promise<{
  success: boolean;
  details?: FSItemDetails;
  error?: string;
}> {
  try {
    // Seguranca real no servidor.
    await requireAdmin();

    const db = getAdminDb();

    // 1. Buscar todos os usuários para cruzar informações de matrícula -> nome
    const usersSnap = await db.collection("User").get();
    const userMap: Record<string, { name: string; nickname: string; uid?: string }> = {};

    usersSnap.forEach(doc => {
      const data = doc.data();
      const matricula = doc.id;
      userMap[matricula] = {
        name: data.Authentication_Name || data.User_Name || "Membro BPlen",
        nickname: data.User_Nickname || "",
        uid: data.uid || undefined,
      };
    });

    let title = "";
    let totalRespondents = 0;
    let averageCompletionTimeSeconds: number | null = null;
    const respondents: FSRespondent[] = [];

    if (type === "survey") {
      const config = SURVEY_REGISTRY.find(s => s.id === id);
      title = config?.title || "Pesquisa";

      const snapshot = await db.collectionGroup("Surveys")
        .where("surveyId", "==", id)
        .where("status", "==", "completed")
        .get();

      totalRespondents = snapshot.docs.length;

      // Calcular tempo médio de conclusão das pesquisas (durationSeconds)
      let totalDuration = 0;
      let countWithDuration = 0;

      snapshot.docs.forEach(doc => {
        const res = doc.data() as SurveyResponse;
        const subAt = toSafeDate(res.submittedAt);
        const iso = subAt ? subAt.toISOString() : new Date().toISOString();
        const matricula = res.matricula || "";
        const uInfo = userMap[matricula] || { name: "Membro BPlen", nickname: "" };

        respondents.push({
          matricula,
          name: uInfo.name,
          nickname: uInfo.nickname,
          submittedAt: iso,
          userUid: uInfo.uid,
        });

        const duration = res.metadata?.durationSeconds;
        if (typeof duration === "number" && duration > 0) {
          totalDuration += duration;
          countWithDuration++;
        }
      });

      if (countWithDuration > 0) {
        averageCompletionTimeSeconds = Math.round(totalDuration / countWithDuration);
      }
    } else {
      const config = FORMS_REGISTRY.find(f => f.id === id);
      title = config?.title || "Formulário";

      let formRecords: Partial<FormRecord>[] = [];

      if (id === "dados_cadastrais") {
        // Lógica especial: buscar do perfil soberano
        usersSnap.forEach(doc => {
          const data = doc.data();
          if (data.profile?.lastRegistrationUpdate) {
            formRecords.push({
              formId: "dados_cadastrais",
              matricula: doc.id,
              userUid: data.uid || "",
              submittedAt: data.profile.lastRegistrationUpdate,
              data: {}
            });
          }
        });
      } else {
        const snapshot = await db.collectionGroup("Forms").where("formId", "==", id).get();
        formRecords = snapshot.docs
          .map(doc => doc.data() as FormRecord)
          .filter(f => f.status === "submitted" || f.status === "updated");
      }

      totalRespondents = formRecords.length;

      formRecords.forEach(res => {
        const subAt = toSafeDate(res.submittedAt);
        const iso = subAt ? subAt.toISOString() : new Date().toISOString();
        const matricula = res.matricula || "";
        const uInfo = userMap[matricula] || { name: "Membro BPlen", nickname: "" };

        respondents.push({
          matricula,
          name: uInfo.name,
          nickname: uInfo.nickname,
          submittedAt: iso,
          userUid: res.userUid || uInfo.uid, // Manter fallback caso falte na resposta
        });
      });
    }

    // Ordenar respondentes por data decrescente (mais recentes primeiro)
    respondents.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

    const details: FSItemDetails = {
      id,
      title,
      type,
      totalRespondents,
      averageCompletionTimeSeconds,
      respondents,
    };

    return {
      success: true,
      details,
    };
  } catch (err: unknown) {
    console.error(`[getFSItemDetails] Erro para ${type} ID ${id}:`, err);
    return {
      success: false,
      error: getErrorMessage(err, "Falha ao processar detalhes da estrutura selecionada."),
    };
  }
}
