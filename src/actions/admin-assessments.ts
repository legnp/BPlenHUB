"use server";

import { getAdminDb } from "@/lib/firebase-admin";

export interface UserAssessment {
  id: string;
  title: string;
  isReleased: boolean;
  submittedAt: string;
}

/**
 * BPlen HUB — Admin Assessments Logic (🧬)
 */

/**
 * getUserAssessments
 * Lista todas as pesquisas realizadas por um usuário que geraram resultados.
 */
export async function getUserAssessments(matricula: string): Promise<UserAssessment[]> {
  try {
    const db = getAdminDb();
    const resultsSnap = await db.collection(`User/${matricula}/results`).get();
    
    if (resultsSnap.empty) return [];

    return resultsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: formatTitle(doc.id),
        isReleased: data.isReleased || false,
        submittedAt: data.submittedAt ? new Date(data.submittedAt.seconds * 1000).toISOString() : new Date().toISOString()
      };
    });
  } catch (err) {
    console.error(`❌ [getUserAssessments] Erro ao buscar resultados para ${matricula}:`, err);
    return [];
  }
}

/**
 * toggleAssessmentRelease
 * Inverte o status de liberação de um diagnóstico específico.
 */
export async function toggleAssessmentRelease(matricula: string, resultId: string, currentStatus: boolean) {
  try {
    const db = getAdminDb();
    const resultRef = db.doc(`User/${matricula}/results/${resultId}`);
    
    await resultRef.update({
      isReleased: !currentStatus,
      lastStatusUpdate: new Date()
    });

    return { success: true };
  } catch (err) {
    console.error(`❌ [toggleAssessmentRelease] Erro ao atualizar status:`, err);
    return { success: false, error: "Falha ao atualizar o banco de dados." };
  }
}

/**
 * Auxiliar: Humaniza os IDs das coleções de resultados
 */
function formatTitle(id: string): string {
  const map: Record<string, string> = {
    gestao_tempo: "Tríade do Tempo",
    preferencias_aprendizado: "Preferências de Aprendizado (VACD)",
    preferencias_reconhecimento: "Preferências de Reconhecimento",
    pre_analise_comportamental: "Pré-Análise Comportamental",
    welcome_survey: "Onboarding (Welcome)"
  };
  return map[id] || id.replace(/_/g, " ").toUpperCase();
}
