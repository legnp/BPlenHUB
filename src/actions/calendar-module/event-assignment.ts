"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-guards";
import { getErrorMessage } from "@/lib/utils/errors";

/**
 * Atribuicao de uma OCORRENCIA da agenda a uma parada da jornada (Fase 3.2).
 *
 * Existe para os tipos com `exigeParada` — hoje so a `Consultoria em Grupo`, cujas 10
 * paradas do GDC sao temas distintos ("Tecnicas de Negociacao", "Gestao de Tempo"...).
 * Sem esta atribuicao o slot NAO e ofertado ao membro: melhor sem horario do que com
 * horario cujo tema ninguem decidiu (decisao da Gestora, 2026-08-05).
 *
 * E o "tema como OFERTA" da secao 8.8 do design: existe ANTES do agendamento e e o que
 * faz o membro escolher. Diferente do "tema como REGISTRO" da Consultoria Individual,
 * que nasce no agendamento a partir da parada de origem.
 *
 * A atribuicao e por IDENTIFICADOR (o id da parada), nunca por texto digitado — era o
 * casamento por texto livre que produzia o silencio da Licao 30.
 */
export async function assignEventCheckpointAction(
  eventId: string,
  subStepId: string | null
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireAdmin();
    if (!eventId) return { success: false, message: "Evento nao informado." };

    const db = getAdminDb();
    const ref = db.collection("Calendar_Events").doc(eventId);
    const snap = await ref.get();
    if (!snap.exists) return { success: false, message: "Evento nao encontrado." };

    // `merge` de proposito: o documento tambem carrega o que o sync escreve e o
    // `registeredCount` que o agendamento mantem. Escrita cheia apagaria os dois.
    await ref.set({ subStepId: subStepId || null }, { merge: true });

    return { success: true };
  } catch (error: unknown) {
    console.error("Erro ao atribuir parada ao evento:", error);
    return { success: false, message: getErrorMessage(error, "Erro ao atribuir a parada.") };
  }
}
