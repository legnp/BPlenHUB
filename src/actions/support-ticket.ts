"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { verifySignedSession } from "@/actions/auth-session";

/**
 * BPlen HUB — Support Ticket Action (Suporte 🆘)
 * Recebe tickets de bug report / chamados de suporte dos membros.
 * Salva na coleção Support_Tickets do Firestore com metadados de contexto.
 */

interface SubmitTicketInput {
  description: string;
  imageBase64?: string | null;
  imageName?: string | null;
  currentPage?: string;
}

export async function submitSupportTicket(input: SubmitTicketInput) {
  try {
    // Verificação de sessão assinada
    const session = await verifySignedSession();
    if (!session) {
      return { success: false, error: "Sessão inválida. Faça login novamente." };
    }

    const { description, imageBase64, imageName, currentPage } = input;

    if (!description || description.trim().length < 10) {
      return { success: false, error: "Descreva o problema com pelo menos 10 caracteres." };
    }

    // Buscar matrícula do usuário via _AuthMap
    const uidMapRef = getAdminDb().collection("_AuthMap").doc(session.uid);
    const uidMapSnap = await uidMapRef.get();
    const matricula = uidMapSnap.exists ? uidMapSnap.data()?.matricula : null;

    // Buscar nome do usuário
    let userName = session.email || "Desconhecido";
    if (matricula) {
      const userSnap = await getAdminDb().collection("User").doc(matricula).get();
      if (userSnap.exists) {
        const userData = userSnap.data();
        userName = userData?.User_Nickname || userData?.Authentication_Name || userData?.User_Name || userName;
      }
    }

    // Criar o ticket
    const ticketData: Record<string, unknown> = {
      uid: session.uid,
      email: session.email || null,
      matricula: matricula || null,
      userName,
      description: description.trim(),
      currentPage: currentPage || null,
      status: "open",
      priority: "normal",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      hasImage: !!imageBase64,
      imageName: imageName || null,
    };

    // Se houver imagem, salvar como base64 no ticket (para imagens pequenas < 1MB)
    if (imageBase64) {
      ticketData.imageBase64 = imageBase64;
    }

    const ticketRef = await getAdminDb().collection("Support_Tickets").add(ticketData);

    console.log(`🆘 [Suporte] Novo ticket criado: ${ticketRef.id} | Usuário: ${userName} (${session.email})`);

    return { success: true, ticketId: ticketRef.id };
  } catch (error) {
    console.error("❌ [Suporte] Erro ao criar ticket:", error);
    return { success: false, error: "Erro interno. Tente novamente em instantes." };
  }
}
