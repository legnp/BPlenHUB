import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin, requireAuth } from "@/lib/auth-guards";
import { getCalendarClient } from "@/lib/google-auth";
import { serverEnv } from "@/env";
import { formatISO, parseISO, isBefore } from "date-fns";
import { calendar_v3 } from "googleapis";
import { safeSerialize } from "@/lib/utils/firestore";
import { GoogleCalendarEvent, AttendeeData, UserBooking } from "@/types/calendar";
import { toISOSafe } from "@/lib/date-utils";

/**
 * Busca eventos do Google Calendar para visualização rápida no Front.
 */
export async function fetchCalendarEvents(dateReference: Date): Promise<GoogleCalendarEvent[]> {
  try {
    const calendar = await getCalendarClient();
    const timeMin = formatISO(new Date(dateReference.getFullYear(), dateReference.getMonth(), 1));
    const timeMax = formatISO(new Date(dateReference.getFullYear(), dateReference.getMonth() + 1, 0));

    const response = await calendar.events.list({
      calendarId: serverEnv.GOOGLE_CALENDAR_ID,
      timeMin,
      timeMax,
      maxResults: 250,
      singleEvents: true,
      orderBy: "startTime",
    });

    const items = response.data.items || [];
    const filteredItems = items.filter(item => {
      const summary = item.summary || "";
      return !summary.toLowerCase().includes("bloqueado");
    });

    return filteredItems.map((item: calendar_v3.Schema$Event) => {
      const rawDescription = item.description || "";
      const plainDescription = rawDescription.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "\n");
      
      const capacityMatch = plainDescription.match(/Vagas:\s*(\d+)/i);
      const mentorMatch = plainDescription.match(/Orientador:\s*([^\n;]+)/i);
      const themeMatch = plainDescription.match(/Tema:\s*([^\n;]+)/i);

      const cleanDescription = plainDescription
        .replace(/Vagas:\s*\d+/gi, "")
        .replace(/Orientador:\s*[^\n;]*/gi, "")
        .replace(/Tema:\s*[^\n;]*/gi, "")
        .replace(/\n{2,}/g, "\n")
        .trim();

      return {
        id: item.id || crypto.randomUUID(),
        summary: item.summary || "Sem Título",
        description: cleanDescription,
        start: item.start?.dateTime || item.start?.date || "",
        end: item.end?.dateTime || item.end?.date || "",
        location: item.location || "",
        htmlLink: item.htmlLink || "",
        meetingLink: item.hangoutLink || "",
        totalCapacity: capacityMatch ? parseInt(capacityMatch[1]) : 0,
        mentor: mentorMatch ? mentorMatch[1].trim() : "",
        theme: themeMatch ? themeMatch[1].trim() : undefined,
      };
    });
  } catch (error) {
    console.error("Erro ao buscar eventos do Google Calendar:", error);
    return [];
  }
}

/**
 * Busca eventos sincronizados diretamente do Firestore.
 */
export async function getSyncedEvents(idToken?: string): Promise<GoogleCalendarEvent[]> {
    try {
      if (idToken) await requireAdmin(idToken);
      const db = getAdminDb();
      const snap = await db.collection("Calendar_Events").get();
      
      return snap.docs.map(doc => {
        const data = doc.data();
        const summary = data.summary || "";
        if (summary.toLowerCase().includes("bloqueado")) {
          return null;
        }
        return safeSerialize<GoogleCalendarEvent>({
          id: doc.id,
          ...data
        });
      }).filter(Boolean) as GoogleCalendarEvent[];
    } catch (error) {
      console.error("Erro ao buscar eventos do Firestore:", error);
      return [];
    }
}

/**
 * Busca agendamentos do usuário diretamente de sua subcoleção dedicada.
 */
export async function getUserBookingsAction(matricula: string): Promise<UserBooking[]> {
  try {
    const db = getAdminDb();
    const bookingsSnap = await db.collection("User").doc(matricula).collection("User_Bookings").get();
    
    const allEvents = await getSyncedEvents();
    const eventsMap = new Map(allEvents.map(e => [e.id, e]));

    return bookingsSnap.docs.map(docSnap => {
      const data = docSnap.data();
      const eventDetail = eventsMap.get(data.eventId);
      
      return {
        id: docSnap.id,
        eventId: data.eventId,
        userId: matricula,
        week: data.week,
        year: data.year,
        category: data.category || "geral",
        timestamp: data.timestamp?.toDate?.()?.toISOString() || null,
        rating: data.rating || 0,
        feedback: data.feedback || "",
        evaluatedAt: data.evaluatedAt?.toDate?.()?.toISOString() || null,
        eventDetail: eventDetail || null,
        // Post-event mirrored fields
        eventLifecycleStatus: data.eventLifecycleStatus || null,
        attendanceStatus: data.attendanceStatus || null,
        publicGeneralComment: data.publicGeneralComment || "",
        meetingMinutesFile: data.meetingMinutesFile || null,
        participantFeedback: data.participantFeedback || "",
        participantTasks: data.participantTasks || "",
        participantDocs: data.participantDocs || [],
        oneToOneData: data.oneToOneData || null
      } as UserBooking;
    }).sort((a: any, b: any) => {
      const startA = a.eventDetail ? new Date(a.eventDetail.start).getTime() : 0;
      const startB = b.eventDetail ? new Date(b.eventDetail.start).getTime() : 0;
      return startB - startA;
    });
  } catch (error) {
    console.error("Erro ao buscar agendamentos na subcoleção:", error);
    return [];
  }
}

/**
 * Busca os inscritos de um evento para o painel administrativo.
 */
export async function getEventAttendees(eventId: string): Promise<AttendeeData[]> {
  try {
    const db = getAdminDb();
    const attendeesSnap = await db.collection("Calendar_Events").doc(eventId).collection("attendees").get();
    
    const attendees = (await Promise.all(attendeesSnap.docs.map(async (doc) => {
      try {
        const data = doc.data();
        let realProfilePhoto = null;
        let realPhone = data.phone || null;
        
        if (data.matricula && typeof data.matricula === "string" && data.matricula.trim() !== "") {
          const userDoc = await db.collection("User").doc(data.matricula).get();
          if (userDoc.exists) {
            const uData = userDoc.data();
            realProfilePhoto = uData?.photoUrl || null;
            if (uData?.Authentication_Phone) {
              realPhone = uData.Authentication_Phone;
            }
          }
        }
        
        // Conversão robusta de datas
        const timestamp = toISOSafe(data.bookedAt || data.timestamp);
        const attendanceCheckedAt = toISOSafe(data.attendanceCheckedAt);

        // Extração segura dos campos aninhados do 1 to 1 para atender às expectativas de UI
        const oneToOne = data.oneToOneData || null;
        const type = oneToOne?.type || null;
        const expectations = oneToOne?.expectations || null;

        return safeSerialize<AttendeeData>({
          ...data,
          nickname: data.nickname || data.displayName || "Participante",
          photoUrl: realProfilePhoto,
          phone: realPhone,
          userId: doc.id,
          timestamp,
          attendanceCheckedAt,
          type: type || data.type || null,
          expectations: expectations || data.expectations || null,
        });
      } catch (innerError) {
        console.error(`Erro ao processar inscrito ${doc.id}:`, innerError);
        return null;
      }
    }))).filter(Boolean) as AttendeeData[];
    
    return attendees;
  } catch (error) {
    console.error("Erro ao buscar inscritos do evento:", error);
    return [];
  }
}

/**
 * REATOR DE DASHBOARD 🛰️ (Versão Datas_Center - Membro)
 */
export async function getProgramacaoForMemberAction(): Promise<any[]> {
  try {
    await requireAuth();
    const db = getAdminDb();
    const registrySnap = await db.collection("Datas_Center").doc("Programacao_Registry").get();
    if (!registrySnap.exists) return [];
    return registrySnap.data()?.events || [];
  } catch (error) {
    console.error("Erro ao ler programação para membro:", error);
    return [];
  }
}

/**
 * REATOR DE DASHBOARD 🛰️ (Versão Datas_Center - Admin)
 */
export async function getProgramacaoSummaryAction(idToken?: string): Promise<any[]> {
  try {
    await requireAdmin(idToken);
    const db = getAdminDb();
    const registrySnap = await db.collection("Datas_Center").doc("Programacao_Registry").get();
    if (!registrySnap.exists) return [];
    return registrySnap.data()?.events || [];
  } catch (error) {
    console.error("Erro ao ler resumo de programação do Datas_Center:", error);
    return [];
  }
}

/**
 * Busca detalhes das avaliações NPS de um evento (para modal admin).
 */
export async function getEventNpsDetailsAction(
  eventId: string,
  idToken?: string
): Promise<{ 
  success: boolean;
  npsAvg: number;
  reviewsCount: number;
  reviews: Array<{ nickname: string; matricula: string; rating: number; feedback: string; evaluatedAt: string | null }>;
}> {
  try {
    if (idToken) await requireAdmin(idToken);
    const db = getAdminDb();
    
    const eventRef = db.collection("Calendar_Events").doc(eventId);
    const attendeesSnap = await eventRef.collection("attendees").get();
    const reviews: Array<{ nickname: string; matricula: string; rating: number; feedback: string; evaluatedAt: string | null }> = [];
    
    attendeesSnap.docs.forEach((att) => {
      const attData = att.data();
      if (attData.rating && attData.rating > 0) {
        reviews.push({
          nickname: attData.nickname || attData.matricula || "Participante",
          matricula: attData.matricula || "",
          rating: attData.rating,
          feedback: attData.feedback || "",
          evaluatedAt: attData.evaluatedAt?.toDate?.()?.toISOString() || null
        });
      }
    });
    
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const npsAvg = reviews.length > 0 ? parseFloat((totalRating / reviews.length).toFixed(1)) : 0;
    reviews.sort((a, b) => b.rating - a.rating);
    
    return { success: true, npsAvg, reviewsCount: reviews.length, reviews };
  } catch (error) {
    console.error("Erro ao buscar detalhes NPS:", error);
    return { success: false, npsAvg: 0, reviewsCount: 0, reviews: [] };
  }
}
