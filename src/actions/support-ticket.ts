"use server";

import { z } from "zod";
import { getAdminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { verifySignedSession } from "@/actions/auth-session";

/**
 * BPlen HUB — Support Ticket Action (Suporte 🆘)
 * Recebe tickets de bug report / chamados de suporte dos membros.
 * Salva na coleção Support_Tickets do Firestore com metadados de contexto.
 * 
 * Governança: Validação atômica via Zod (ARCHITECTURE.md §4).
 */

// ── Schema Zod (Sensor de Entrada 🛡️) ──────────────────────
const SubmitTicketSchema = z.object({
  description: z
    .string()
    .min(10, "Descreva o problema com pelo menos 10 caracteres.")
    .max(2000, "A descrição não pode ultrapassar 2000 caracteres.")
    .trim(),
  imageBase64: z
    .string()
    .startsWith("data:image/", "Formato de imagem inválido.")
    .max(1_500_000, "A imagem deve ter no máximo 1MB.")
    .nullable()
    .optional(),
  imageName: z.string().max(255).nullable().optional(),
  currentPage: z.string().max(500).optional(),
});

type SubmitTicketInput = z.infer<typeof SubmitTicketSchema>;

export async function submitSupportTicket(rawInput: SubmitTicketInput) {
  try {
    // 🛡️ Verificação de sessão assinada
    const session = await verifySignedSession();
    if (!session) {
      return { success: false, error: "Sessão inválida. Faça login novamente." };
    }

    // 🛡️ Validação Zod (Sensor Atômico — ARCHITECTURE.md §4)
    const parsed = SubmitTicketSchema.safeParse(rawInput);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Dados inválidos.";
      return { success: false, error: firstError };
    }

    const { description, imageBase64, imageName, currentPage } = parsed.data;

    // Buscar matrícula do usuário via _AuthMap
    const uidMapRef = getAdminDb().collection("_AuthMap").doc(session.uid);
    const uidMapSnap = await uidMapRef.get();
    const matricula: string | null = uidMapSnap.exists ? (uidMapSnap.data()?.matricula ?? null) : null;

    // Buscar nome do usuário
    let userName = session.email ?? "Desconhecido";
    if (matricula) {
      const userSnap = await getAdminDb().collection("User").doc(matricula).get();
      if (userSnap.exists) {
        const userData = userSnap.data();
        userName =
          userData?.User_Nickname ??
          userData?.Authentication_Name ??
          userData?.User_Name ??
          userName;
      }
    }

    // Criar o ticket (estrutura soberana)
    const ticketData: Record<string, unknown> = {
      uid: session.uid,
      email: session.email ?? null,
      matricula: matricula ?? null,
      userName,
      description,
      currentPage: currentPage ?? null,
      status: "open",
      priority: "normal",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      hasImage: !!imageBase64,
      imageName: imageName ?? null,
    };

    // Salvar imagem como base64 embutida (< 1MB, validado pelo Zod)
    if (imageBase64) {
      ticketData.imageBase64 = imageBase64;
    }

    // Governança de PII (BUG-001, CLAUDE.md regra 4): o ticket vai para a subcoleção
    // PRIVADA do usuário — `User/{matricula}/Support_Tickets` (dono lê os próprios; escrita
    // só via Admin SDK). Sem matrícula (logado, ainda sem matrícula), cai numa gaveta
    // privada por uid `_SupportTickets/{uid}/tickets`. Antes ia para a raiz `Support_Tickets`,
    // misturando PII de todos os usuários.
    const ticketsCol = matricula
      ? getAdminDb().collection("User").doc(matricula).collection("Support_Tickets")
      : getAdminDb().collection("_SupportTickets").doc(session.uid).collection("tickets");
    const ticketRef = await ticketsCol.add(ticketData);

    console.log(`🆘 [Suporte] Ticket criado: ${ticketRef.id} | ${userName} (${session.email})`);

    return { success: true, ticketId: ticketRef.id };
  } catch (error) {
    console.error("❌ [Suporte] Erro ao criar ticket:", error);
    return { success: false, error: "Erro interno. Tente novamente em instantes." };
  }
}
