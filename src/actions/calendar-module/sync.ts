import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-guards";
import { getCalendarClient } from "@/lib/google-auth";
import { formatISO, addDays } from "date-fns";
import { serverEnv } from "@/env";
import { GoogleCalendarEvent } from "@/types/calendar";
import { CALENDAR_CONFIG } from "@/config/calendarConfig";
import { calendar_v3 } from "googleapis";
import { getEventStandardSlug } from "@/lib/utils";

/**
 * Sincronização de 90 Dias (Firestore 🛡️)
 * Identifica novos eventos, atualiza existentes e remove "fantasmas".
 */
export async function syncCalendarToFirestore(idToken?: string) {
  try {
    await requireAdmin(idToken);
    const calendar = await getCalendarClient();
    const db = getAdminDb();
    const now = new Date();
    const ninetyDaysOut = addDays(now, CALENDAR_CONFIG.SYNC_WINDOW_DAYS);

    const timeMin = formatISO(now);
    const timeMax = formatISO(ninetyDaysOut);

    const response = await calendar.events.list({
      calendarId: serverEnv.GOOGLE_CALENDAR_ID,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
    });

    const rawGoogleItems = response.data.items || [];
    const googleItems = rawGoogleItems.filter(item => {
      const summary = item.summary || "";
      return !summary.toLowerCase().includes("bloqueado");
    });
    const googleIds = new Set(googleItems.map(item => item.id).filter(Boolean));

    // Cleanup: Buscar eventos no Firestore nesse período
    const firestoreEventsSnap = await db.collection("Calendar_Events")
      .where("start", ">=", timeMin)
      .where("start", "<=", timeMax)
      .get();

    const batch = db.batch();
    let deletedCount = 0;
    let syncedCount = 0;
    
    // Remover deletados
    firestoreEventsSnap.docs.forEach(doc => {
      if (!googleIds.has(doc.id)) {
        batch.delete(doc.ref);
        deletedCount++;
      }
    });

    // Upsert dos vindos do Google
    googleItems.forEach((item: calendar_v3.Schema$Event) => {
      if (!item.id) return;
      const ref = db.collection("Calendar_Events").doc(item.id);
      
      const rawDescription = item.description || "";
      const plainDescription = rawDescription.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "\n");
      const capacityMatch = plainDescription.match(/Vagas:\s*(\d+)/i);
      const mentorMatch = plainDescription.match(/Orientador:\s*([^\n;]+)/i);
      const themeMatch = plainDescription.match(/Tema:\s*([^\n;]+)/i);

      batch.set(ref, {
        summary: item.summary,
        start: item.start?.dateTime || item.start?.date,
        end: item.end?.dateTime || item.end?.date,
        location: item.location || "",
        htmlLink: item.htmlLink,
        totalCapacity: capacityMatch ? parseInt(capacityMatch[1]) : 0,
        mentor: mentorMatch ? mentorMatch[1].trim() : "",
        theme: themeMatch ? themeMatch[1].trim() : undefined,
        slug: getEventStandardSlug(item.summary || "", item.start?.dateTime || item.start?.date || "", item.id),
        lastSync: new Date().toISOString()
      }, { merge: true });
      syncedCount++;
    });

    await batch.commit();
    return { success: true, count: googleItems.length, synced: syncedCount, deleted: deletedCount };
  } catch (error) {
    console.error("Erro na sincronização de calendário:", error);
    return { success: false, message: (error as Error).message };
  }
}
