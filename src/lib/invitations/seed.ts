import { getAdminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { InvitationEvent } from "@/types/invitations";

/**
 * Bootstrap do evento de convite `pre_inauguracao` — camada CRUA, sem guard e
 * sem `"use server"` (lote 4 do `BUG-103` / `BUG-102`).
 *
 * Ate aqui esta logica vivia em `actions/invitations.ts:seedInvitationEventAndTokens`,
 * que e `"use server"` — logo era **endpoint de rede** que qualquer requisicao nao
 * autenticada podia disparar, escrevendo em `Invitation_Events` e
 * `Invitation_Tokens`.
 *
 * Ela e chamada por UM lugar so: o Server Component `app/convites/[slug]/page.tsx`,
 * durante o render, quando o evento ainda nao existe. Server Component -> lib e
 * chamada direta (nao passa pela rede), entao mover a logica para ca **remove a
 * porta sem mudar o comportamento** (Protocolo item 8, mesmo desenho do
 * `updateGlobalProgramacaoRegistryAction` no lote 3). Verificado na base real: o
 * evento e os 10 tokens JA existem em producao, entao este bloco esta inerte no
 * caminho da pagina — a mudanca e puramente de superficie.
 *
 * NOTA para o F4-02 (fluxo de convite, nao endereçada aqui): estes 10 tokens
 * `BPL-INV-TEST*` com convidados ficticios sao dados de TESTE semeados em
 * producao. Se o fluxo de convite for real, eles deveriam sair; a decisao e da
 * Gestora, na validacao do F4-02.
 */
export async function bootstrapPreInauguracaoInvitation(): Promise<{ success: boolean; message: string }> {
  try {
    const db = getAdminDb();

    // A. Evento (idempotente — so cria se faltar)
    const eventRef = db.collection("Invitation_Events").doc("pre_inauguracao");
    const eventSnap = await eventRef.get();

    if (!eventSnap.exists) {
      const event: InvitationEvent = {
        slug: "pre_inauguracao",
        name: "Pré-Inauguração BPlen",
        date: "2026-06-25",
        time: "19:00",
        location: "Avenida Paulista, 1000 - Bela Vista, Sao Paulo - SP",
        specificMessage: "intimista com convidados especiais",
        description: "Seja bem-vindo ao primeiro encontro exclusivo do BPlen HUB.",
        isActive: true,
      };

      await eventRef.set({
        ...event,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log("[bootstrapPreInauguracaoInvitation] Evento 'pre_inauguracao' criado.");
    }

    // B. 10 tokens de teste
    const batch = db.batch();
    const testTokens = [
      "BPL-INV-TEST01", "BPL-INV-TEST02", "BPL-INV-TEST03", "BPL-INV-TEST04", "BPL-INV-TEST05",
      "BPL-INV-TEST06", "BPL-INV-TEST07", "BPL-INV-TEST08", "BPL-INV-TEST09", "BPL-INV-TEST10",
    ];

    for (const token of testTokens) {
      const tokenRef = db.collection("Invitation_Tokens").doc(token);
      batch.set(tokenRef, {
        token,
        eventSlug: "pre_inauguracao",
        status: "unused",
        claimedBy: null,
        claimedAt: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        guestName: `Convidado de Teste ${token.slice(-2)}`,
        guestEmail: `convidado${token.slice(-2)}@bplen.com`
      }, { merge: true });
    }

    await batch.commit();
    console.log(`[bootstrapPreInauguracaoInvitation] ${testTokens.length} tokens de teste semeados.`);

    return { success: true, message: "Evento e tokens de teste semeados." };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[bootstrapPreInauguracaoInvitation] Falha de seeding:", errorMessage);
    return { success: false, message: errorMessage };
  }
}
