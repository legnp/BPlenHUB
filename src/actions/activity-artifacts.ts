"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { getServerSession } from "@/lib/server-session";
import { CareerFeedback, CareerAta, CareerSharedDocument } from "@/types/career";

/**
 * getMemberActivityArtifactsAction — BPlen HUB 🧬
 * 
 * Busca feedbacks, atas e documentos compartilhados de um membro SEM exigir
 * a permissão career_planning. Esses artefatos são gerados a partir de reuniões
 * de TODAS as etapas (Onboarding, Análise Comportamental, etc.), e não apenas
 * do módulo de Gestão de Carreira.
 * 
 * Segurança: Exige sessão autenticada e que o chamador seja admin ou o próprio dono da matrícula.
 */
export async function getMemberActivityArtifactsAction(
  matricula: string
): Promise<{ feedbacks: CareerFeedback[]; atas: CareerAta[]; sharedDocuments: CareerSharedDocument[] }> {
  try {
    const session = await getServerSession();
    if (!session) {
      console.warn("[ActivityArtifacts] Sessão inválida.");
      return { feedbacks: [], atas: [], sharedDocuments: [] };
    }

    // Segurança: Admin pode ver qualquer matrícula; membro só vê a própria
    if (!session.isAdmin && session.matricula !== matricula) {
      console.warn("[ActivityArtifacts] Acesso negado: matrícula não corresponde.");
      return { feedbacks: [], atas: [], sharedDocuments: [] };
    }

    const db = getAdminDb();

    const [feedbacksSnap, atasSnap, docsSnap] = await Promise.all([
      db.collection(`User/${matricula}/Feedbacks`).get(),
      db.collection(`User/${matricula}/Atas`).get(),
      db.collection(`User/${matricula}/Shared_Documents`).get(),
    ]);

    const feedbacks = feedbacksSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || "",
        content: data.content || "",
        author: data.author || "Consultor",
        createdAt: data.createdAt || "",
      };
    });

    const atas = atasSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || "",
        meetingDate: data.meetingDate || "",
        fileUrl: data.fileUrl || "",
        contentSummary: data.contentSummary || "",
        createdAt: data.createdAt || "",
      };
    });

    const sharedDocuments = docsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || "",
        fileUrl: data.fileUrl || "",
        fileName: data.fileName || "",
        category: data.category || "Outros",
        createdAt: data.createdAt || "",
      };
    });

    return { feedbacks, atas, sharedDocuments };
  } catch (error) {
    console.error("[ActivityArtifacts] Erro:", error);
    return { feedbacks: [], atas: [], sharedDocuments: [] };
  }
}
