"use server";

import { z } from "zod";
import { after } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { verifySignedSession } from "@/actions/auth-session";
import { findMatriculaByIdentity } from "@/lib/identity/find-matricula";

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

    // Resolucao canonica da identidade (AuthMap -> UID -> E-mail, com auto-healing).
    //
    // Antes lia `_AuthMap/{uid}` direto — uma QUARTA copia da resolucao, sem o
    // passo de e-mail. Quem tem matricula mas esta com o mapeamento faltando
    // (troca de provedor, transferencia de conta) era tratado como se nao tivesse
    // identidade: o chamado caia na gaveta por uid, separado da propria pasta, e
    // o espelhamento nao acontecia. E o modo de falha que o cabecalho de
    // `find-matricula.ts` descreve — copia que diverge e sobrevive ao conserto.
    const matricula: string | null = await findMatriculaByIdentity(
      session.uid,
      session.email ?? undefined
    );

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

    // Espelho no acervo do membro. Sem matricula nao ha pasta (chamado cai na
    // gaveta por uid), entao nao ha o que espelhar — mesma logica do visitante
    // anonimo, registrada em WORKSPACE_GLOBAL.
    if (matricula) {
      const ticketMatricula = matricula;
      after(async () => {
        try {
          // Rele o documento para pegar o `createdAt` ja resolvido: e ele a chave
          // de idempotencia do resgate, e o serverTimestamp so vira data depois da
          // escrita. Usar o relogio daqui produziria uma chave diferente da que o
          // resgate calcularia depois.
          const saved = await ticketRef.get();
          const createdAt = saved.data()?.createdAt;
          const createdAtStr =
            createdAt && typeof createdAt.toDate === "function"
              ? createdAt.toDate().toLocaleString("pt-BR")
              : new Date().toLocaleString("pt-BR");

          const { syncSupportTicketToUserDrive } = await import("@/lib/drive-sync");
          await syncSupportTicketToUserDrive(ticketMatricula, {
            createdAt: createdAtStr,
            description,
            currentPage: currentPage ?? null,
            status: "open",
            priority: "normal",
            attachment: imageName ?? null,
          });
        } catch (mirrorError: unknown) {
          const message = mirrorError instanceof Error ? mirrorError.message : String(mirrorError);
          console.error("[Suporte] Falha ao espelhar chamado no acervo:", message);
        }
      });
    }

    return { success: true, ticketId: ticketRef.id };
  } catch (error) {
    console.error("❌ [Suporte] Erro ao criar ticket:", error);
    return { success: false, error: "Erro interno. Tente novamente em instantes." };
  }
}
