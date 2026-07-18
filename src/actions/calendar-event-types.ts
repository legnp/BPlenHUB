"use server";

import admin, { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-guards";
import { getErrorMessage } from "@/lib/utils/errors";
import {
  CalendarEventType,
  DEFAULT_EVENT_TYPES,
} from "@/types/calendar-event-types";

/**
 * Configuracao dos tipos de evento da agenda (Etapa 3.1).
 *
 * Guardado num doc unico de `Settings` — sao 3 itens de configuracao, entao uma
 * colecao custaria 3 leituras onde 1 basta. Mesmo padrao do `Settings/OneToOne`
 * que ja existe.
 *
 * As RAZOES do 1 to 1 continuam vivendo em `Settings/OneToOne` (ver
 * `OneToOneActions.ts`) — elas ja alimentam o dropdown do membro hoje e viram o
 * tema do agendamento (design 8.8). Nao duplicamos a fonte aqui: a tela de admin
 * edita as duas coisas, cada uma no seu lugar de origem (Licao 21).
 */

const SETTINGS_COLLECTION = "Settings";
const SETTINGS_DOC_ID = "CalendarEventTypes";

/** Normaliza para comparar titulo do Google sem depender de acento/caixa/espaco. */
function normalizeTitle(value: string | undefined | null): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Le a configuracao. Se ainda nao existe, devolve os 3 tipos padrao (seed em
 * memoria) — a tela grava de verdade no primeiro salvamento.
 */
export async function getCalendarEventTypes(): Promise<CalendarEventType[]> {
  try {
    const db = getAdminDb();
    const snap = await db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID).get();
    const stored = snap.exists ? (snap.data()?.types as CalendarEventType[] | undefined) : undefined;
    if (!stored || stored.length === 0) return DEFAULT_EVENT_TYPES;
    return stored;
  } catch (error) {
    console.error("Erro ao buscar tipos de evento:", error);
    // Falha nao vira "nenhum tipo configurado" mudo: devolve o padrao, que e o
    // que a tela mostraria de qualquer forma no estado inicial.
    return DEFAULT_EVENT_TYPES;
  }
}

export async function updateCalendarEventTypes(
  types: CalendarEventType[],
  idToken?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireAdmin(idToken);

    if (!Array.isArray(types) || types.length === 0) {
      return { success: false, message: "Nenhum tipo informado." };
    }

    // O `googleTitle` e a chave de casamento com a agenda: dois tipos com o mesmo
    // titulo tornariam a resolucao ambigua e silenciosa.
    const vistos = new Set<string>();
    for (const t of types) {
      const chave = normalizeTitle(t.googleTitle);
      if (!chave) {
        return { success: false, message: `O tipo "${t.label}" esta sem titulo do Google.` };
      }
      if (vistos.has(chave)) {
        return { success: false, message: `Ha mais de um tipo com o titulo "${t.googleTitle}".` };
      }
      vistos.add(chave);
      if (!Number.isFinite(t.vagasPadrao) || t.vagasPadrao < 0) {
        return { success: false, message: `Vagas invalidas no tipo "${t.label}".` };
      }
    }

    const db = getAdminDb();
    await db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID).set(
      {
        types,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { success: true };
  } catch (error: unknown) {
    console.error("Erro ao salvar tipos de evento:", error);
    return { success: false, message: getErrorMessage(error, "Erro ao salvar os tipos de evento.") };
  }
}
