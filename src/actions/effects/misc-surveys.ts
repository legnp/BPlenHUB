"use server";

import { SurveyValue } from "@/types/survey";
import { syncSurveyToUserDrive } from "@/lib/drive-sync";

// Valor emitido pelo campo "cascaded" (CascadedSelect.tsx) — tipo local não exportado lá.
interface CascadedFieldValue {
  primary?: string;
}

// Valor de upload de arquivo (mesmo shape de FileUploadData em profile-professional.ts,
// campos opcionais aqui porque a origem é SurveyValue, um union amplo).
interface UploadFieldValue {
  url?: string;
  fileName?: string;
}

/**
 * EFEITO: Check-in BPlen 📊
 * Coleta objetivos, desafios e links iniciais de carreira.
 */
export async function handleCheckInEffect(
  responses: Record<string, SurveyValue>,
  matricula: string
) {
  console.log(`📡 [Effects:CheckIn] Processando resultados: ${matricula}`);
  
  try {
    await syncSurveyToUserDrive({
      matricula,
      surveyTitle: "Check-in",
      headers: [
        "Timestamp", "Matrícula", "Nicho", "Desafios", "Objetivos", "Regime",
        "CV Drive", "Portfólio Drive", "LinkedIn", "Instagram", "Web/Portfolio", "Banco Talentos", "Comentários Carreira"
      ],
      rowData: [
        new Date().toLocaleString("pt-BR"),
        matricula,
        String((responses.nicho_cascata as CascadedFieldValue)?.primary || "N/A"),
        Array.isArray(responses.desafios_multi) ? responses.desafios_multi.join(", ") : "N/A",
        String(responses.objetivos_timeline || "N/A"),
        String(responses.regime_choice || "N/A"),
        (responses.cv_upload as UploadFieldValue)?.url || "N/A",
        (responses.portfolio_upload as UploadFieldValue)?.url || "N/A",
        String(responses.linkedin_url || "N/A"),
        String(responses.instagram_url || "N/A"),
        `${responses.web_url || ""} | ${responses.portfolio_url || ""}`,
        String(responses.banco_talentos || "N/A"),
        String(responses.comentarios_carreira || "N/A")
      ]
    });
  } catch (err) {
    console.error(`❌ [Effects:CheckIn] Erro na sincronização Drive:`, err);
  }
}

/**
 * EFEITO: Feedback de Conteúdo 📋
 */
export async function handleContentFeedbackEffect(
  responses: Record<string, SurveyValue>,
  matricula: string,
  surveyTitle: string
) {
  try {
    await syncSurveyToUserDrive({
      matricula,
      surveyTitle,
      headers: ["Timestamp", "Matrícula", "Utilidade (Likert)", "Comentários/Feedback"],
      rowData: [
        new Date().toLocaleString("pt-BR"),
        matricula,
        String(responses.utilidade || "N/A"),
        String(responses.comentários || "N/A")
      ]
    });
  } catch (err) {
    console.error(`❌ [Effects:Feedback] Erro na sincronização Drive:`, err);
  }
}

/**
 * EFEITO: Revisão de Currículo 📄
 */
export async function handleCVReviewEffect(
  responses: Record<string, SurveyValue>,
  matricula: string
) {
  try {
    await syncSurveyToUserDrive({
      matricula,
      surveyTitle: "Revisão de Currículo",
      headers: ["Timestamp", "Matrícula", "Possuía Resumo?", "Resumo Original/Criado", "Alinhamento (Escala)", "Resumo Otimizado", "Descrição Formação"],
      rowData: [
        new Date().toLocaleString("pt-BR"),
        matricula,
        responses.has_resumo === "sim" ? "Sim" : "Não",
        String(responses.resumo_atual || responses.resumo_criado || "N/A"),
        String(responses.alinhamento || "N/A"),
        String(responses.resumo_otimizado || "N/A"),
        String(responses.descricao_formacao || "N/A")
      ]
    });
  } catch (err) {
    console.error(`❌ [Effects:CV Review] Erro na sincronização Drive:`, err);
  }
}

/**
 * EFEITO: Desmistificando Candidaturas 🧬📋
 */
export async function handleDesmistificandoCandidaturasEffect(
  responses: Record<string, SurveyValue>,
  matricula: string
) {
  try {
    const desafios = Array.isArray(responses.desafios) ? responses.desafios.join(", ") : String(responses.desafios || "N/A");
    
    await syncSurveyToUserDrive({
      matricula,
      surveyTitle: "Desmistificando Candidaturas",
      headers: [
        "Timestamp", 
        "Matrícula", 
        "Desafios", 
        "Outro Desafio", 
        "Detalhes Desafios",
        "Termômetro de Fit",
        "Justificativa Fit",
        "Fonte Oportunidade",
        "Outra Fonte",
        "Canal Oportunidade",
        "Próximo Passo"
      ],
      rowData: [
        new Date().toLocaleString("pt-BR"),
        matricula,
        desafios,
        String(responses.desafios_other || "N/A"),
        String(responses.detalhes_desafios || "N/A"),
        String(responses.fit_termometro || "N/A"),
        String(responses.fit_justificativa || "N/A"),
        String(responses.fonte_oportunidade || "N/A"),
        String(responses.fonte_oportunidade_other || "N/A"),
        String(responses.canal_oportunidade || "N/A"),
        String(responses.proximo_passo || "N/A")
      ]
    });
  } catch (err) {
    console.error(`❌ [Effects:DesmistificandoCandidaturas] Erro na sincronização Drive:`, err);
  }
}
