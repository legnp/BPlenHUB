"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { SURVEY_REGISTRY } from "@/config/surveys";
import { FORMS_REGISTRY } from "@/config/forms";
import { SurveyResponse } from "@/types/survey";
import { FormRecord } from "@/types/forms";
import { toSafeDate } from "@/lib/date-utils";
import { requireAdmin } from "@/lib/auth-guards";

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
    // 🛡️ Segurança Real no Servidor
    await requireAdmin();

    const db = getAdminDb();

    // 1. Buscar todas as respostas de Pesquisas via Collection Group
    const surveysSnapshot = await db.collectionGroup("Surveys").where("status", "==", "completed").get();
    const surveyResponses = surveysSnapshot.docs.map(doc => doc.data() as SurveyResponse);

    // 2. Buscar todas as respostas de Formulários via Collection Group
    // Filtramos por 'submitted' ou 'updated' para garantir que apenas dados finais apareçam
    const formsSnapshot = await db.collectionGroup("Forms").get();
    let formResponses = formsSnapshot.docs
      .map(doc => doc.data() as FormRecord)
      .filter(f => f.status === "submitted" || f.status === "updated");

    // 2.5. Especial: Dados Cadastrais (Soberania de Dados)
    // Buscamos usuários que tenham a data de atualização do perfil preenchida
    const usersSnap = await db.collection("User").get();
    const registrationResponses: FormRecord[] = [];
    
    usersSnap.forEach(doc => {
      const data = doc.data();
      if (data.profile?.lastRegistrationUpdate) {
        registrationResponses.push({
          formId: "dados_cadastrais",
          matricula: doc.id,
          userUid: data.uid || "",
          mode: "submitted",
          status: "submitted",
          data: {}, // Metadados apenas para contagem
          submittedAt: toSafeDate(data.profile.lastRegistrationUpdate) || new Date(),
        });
      }
    });

    // Unificar respostas de formulários (Collection Group + Perfil)
    formResponses = [...formResponses, ...registrationResponses];

    // 3. Contabilizar respostas por ID
    const surveyCounts: Record<string, number> = {};
    surveyResponses.forEach(res => {
      const id = res.surveyId;
      surveyCounts[id] = (surveyCounts[id] || 0) + 1;
    });

    const formCounts: Record<string, number> = {};
    formResponses.forEach(res => {
      const id = res.formId;
      formCounts[id] = (formCounts[id] || 0) + 1;
    });

    // 4. Calcular respostas nas últimas 24h
    let responsesLast24h = 0;
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const checkLast24h = (dateVal: any) => {
      const d = toSafeDate(dateVal);
      if (d && d >= oneDayAgo) {
        responsesLast24h++;
      }
    };

    surveyResponses.forEach(res => checkLast24h(res.submittedAt));
    formResponses.forEach(res => checkLast24h(res.submittedAt));

    // 5. Mapear itens disponíveis usando os registros estáticos (Registry)
    const items: FSRegistrySummary[] = [
      ...SURVEY_REGISTRY.map(s => ({
        id: s.id,
        title: s.title,
        type: "survey" as const,
        totalResponses: surveyCounts[s.id] || 0,
      })),
      ...FORMS_REGISTRY.map(f => ({
        id: f.id,
        title: f.title,
        type: "form" as const,
        totalResponses: formCounts[f.id] || 0,
      })),
    ];

    // Estatísticas Globais
    const stats: FSGlobalStats = {
      totalForms: FORMS_REGISTRY.length,
      totalSurveys: SURVEY_REGISTRY.length,
      totalGlobalResponses: surveyResponses.length + formResponses.length,
      responsesLast24h,
    };

    return {
      success: true,
      stats,
      items: items.sort((a, b) => b.totalResponses - a.totalResponses), // Ordena por popularidade
    };
  } catch (err: any) {
    console.error("❌ [getAdminFSAnalytics] Erro crítico:", err);
    return {
      success: false,
      error: err.message || "Falha ao processar estatísticas unificadas.",
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
    // 🛡️ Segurança Real no Servidor
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
    let respondents: FSRespondent[] = [];

    if (type === "survey") {
      const config = SURVEY_REGISTRY.find(s => s.id === id);
      title = config?.title || "Pesquisa";

      const snapshot = await db.collectionGroup("Surveys")
        .where("surveyId", "==", id)
        .where("status", "==", "completed")
        .get();
      const responses = snapshot.docs.map(doc => doc.data() as SurveyResponse);

      totalRespondents = responses.length;

      // Calcular tempo médio de conclusão das pesquisas (durationSeconds)
      let totalDuration = 0;
      let countWithDuration = 0;

      responses.forEach(res => {
        const subAt = toSafeDate(res.submittedAt);
        const iso = subAt ? subAt.toISOString() : new Date().toISOString();
        const matricula = res.matricula || "";
        const uInfo = userMap[matricula] || { name: "Membro BPlen", nickname: "" };

        respondents.push({
          matricula,
          name: uInfo.name,
          nickname: doc.ref.path, // TEMP: Expondo o path para debug
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
  } catch (err: any) {
    console.error(`❌ [getFSItemDetails] Erro para ${type} ID ${id}:`, err);
    return {
      success: false,
      error: err.message || "Falha ao processar detalhes da estrutura selecionada.",
    };
  }
}

// Auxiliar para normalizar o ID caso necessário
function configId(id: string): string {
  return id;
}
