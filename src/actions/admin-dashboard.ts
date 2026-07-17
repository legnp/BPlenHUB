"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-guards";
import { safeSerialize } from "@/lib/utils/firestore";
import { isBlockerEvent } from "@/lib/booking/blocker";
import { eventStartKey } from "@/lib/calendar/window";
import { getWeekBounds, resolveSyncFreshness, SyncFreshness } from "@/lib/admin/dashboard";
import { GoogleCalendarEvent } from "@/types/calendar";

/**
 * Dados do dashboard do admin, com leitura BOUNDED — não mais o full scan da
 * coleção inteira que exibia uma ficção (BUG-091/092) e alimentava o apagão de
 * cota (BUG-087). Uma consulta pela janela da semana (~dezenas de docs) + 1
 * leitura para a frescura do sync.
 */
export interface AdminDashboardData {
  /** Sessões "1 to 1" desta semana ISO com ao menos um participante. */
  oneToOneThisWeek: number;
  /** Há quanto tempo a agenda foi sincronizada — estado real, não string fixa. */
  sync: SyncFreshness;
  /** Próximas sessões desta semana (a partir de agora), para a lista do painel. */
  upcoming: GoogleCalendarEvent[];
}

const UPCOMING_LIMIT = 8;

export async function getAdminDashboardData(idToken?: string): Promise<AdminDashboardData> {
  const now = new Date();
  try {
    await requireAdmin(idToken);
    const db = getAdminDb();
    const { startKey, endKey } = getWeekBounds(now);
    const nowKey = eventStartKey(now);

    // Eventos da semana ISO — janela pequena, não a coleção inteira.
    const weekSnap = await db.collection("Calendar_Events")
      .where("start", ">=", startKey)
      .where("start", "<=", endKey)
      .get();
    const weekEvents = weekSnap.docs.map(d => ({ id: d.id, ...d.data() } as GoogleCalendarEvent & { registeredCount?: number }));

    const oneToOneThisWeek = weekEvents.filter(e =>
      (e.summary || "").toLowerCase().includes("1 to 1") && (e.registeredCount || 0) > 0
    ).length;

    const upcoming = weekEvents
      .filter(e => !isBlockerEvent(e) && typeof e.start === "string" && e.start >= nowKey)
      .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0))
      .slice(0, UPCOMING_LIMIT)
      .map(e => safeSerialize<GoogleCalendarEvent>(e));

    // Frescura do sync: o `lastSync` mais recente da coleção — 1 leitura.
    const lastSyncSnap = await db.collection("Calendar_Events")
      .orderBy("lastSync", "desc")
      .limit(1)
      .get();
    const lastSync = lastSyncSnap.empty ? null : (lastSyncSnap.docs[0].data().lastSync as string | undefined);

    return { oneToOneThisWeek, sync: resolveSyncFreshness(lastSync, now), upcoming };
  } catch (error) {
    console.error("Erro ao carregar o dashboard do admin:", error);
    // Falha não vira "tudo ok" (BUG-089): a frescura cai em estado crítico.
    return { oneToOneThisWeek: 0, sync: resolveSyncFreshness(null, now), upcoming: [] };
  }
}
