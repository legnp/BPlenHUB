"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin, requireAuth, AuthorizationError } from "@/lib/auth-guards";
import { getCalendarClient } from "@/lib/google-auth";
import { serverEnv } from "@/env";
import { formatISO, parseISO, isBefore } from "date-fns";
import { calendar_v3 } from "googleapis";
import { safeSerialize } from "@/lib/utils/firestore";
import { GoogleCalendarEvent, AttendeeData, UserBooking, ProgramacaoEntry } from "@/types/calendar";
import { toISOSafe } from "@/lib/date-utils";
import { isBlockerSummary, isBlockerEvent } from "@/lib/booking/blocker";
import { eventStartKey } from "@/lib/calendar/window";

/**
 * Busca eventos do Google Calendar para visualização rápida no Front.
 */
export async function fetchCalendarEvents(dateReference: Date): Promise<GoogleCalendarEvent[]> {
  try {
    await requireAuth();
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
    // Le direto do Google, entao classifica pelo titulo (nao ha campo gravado).
    const filteredItems = items.filter(item => !isBlockerSummary(item.summary));

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
      await requireAuth(idToken);
      const db = getAdminDb();
      const snap = await db.collection("Calendar_Events").get();
      
      // Os bloqueios vivem em `Calendar_Events` (a agenda publica depende deles),
      // mas nao sao entregaveis: nem o admin nem o membro os veem.
      return snap.docs.map(doc => {
        const data = doc.data();
        if (isBlockerEvent(data)) {
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
 * Eventos a partir de agora — para telas que so mostram sessoes agendaveis
 * (a jornada do membro), sem baixar a colecao inteira (BUG-087).
 *
 * A parada da jornada oferece slots FUTUROS; eventos passados nunca sao
 * agendaveis e nao apareciam para o membro. Consultar por intervalo em vez de
 * `getSyncedEvents` (~590 docs) corta o passado acumulado (BUG-085) e reduz a
 * leitura ao que a tela usa. O filtro fino da parada (tema/palavra-chave) segue
 * no cliente — o Firestore nao faz casamento por substring.
 */
export async function getUpcomingEvents(idToken?: string): Promise<GoogleCalendarEvent[]> {
  try {
    await requireAuth(idToken);
    const db = getAdminDb();
    const snap = await db.collection("Calendar_Events")
      .where("start", ">=", eventStartKey(new Date()))
      .get();

    return snap.docs.map(doc => {
      const data = doc.data();
      if (isBlockerEvent(data)) return null;
      return safeSerialize<GoogleCalendarEvent>({ id: doc.id, ...data });
    }).filter(Boolean) as GoogleCalendarEvent[];
  } catch (error) {
    console.error("Erro ao buscar eventos futuros do Firestore:", error);
    return [];
  }
}

/**
 * Busca agendamentos do usuário diretamente de sua subcoleção dedicada.
 */
export async function getUserBookingsAction(matricula: string): Promise<UserBooking[]> {
  try {
    const session = await requireAuth();
    if (session.matricula !== matricula && !session.isAdmin) {
      throw new AuthorizationError("Voce nao pode acessar os agendamentos de outro membro.");
    }
    const db = getAdminDb();
    const bookingsSnap = await db.collection("User").doc(matricula).collection("User_Bookings").get();

    // Detalhe do evento buscado POR ID (uns poucos agendamentos), nao mais pela
    // colecao inteira (`getSyncedEvents`, ~590 docs). Esta funcao e chamada por 8
    // telas do membro — o `MemberDashboardView` a chama 3x — e o full scan interno
    // era o principal multiplicador do apagao de cota (BUG-087). Mesmo padrao de
    // `career-module.ts` (getAll de refs por id).
    const eventIds = Array.from(new Set(
      bookingsSnap.docs.map(d => d.data().eventId || d.id).filter(Boolean)
    ));
    const eventsMap = new Map<string, GoogleCalendarEvent>();
    if (eventIds.length > 0) {
      const refs = eventIds.map(id => db.collection("Calendar_Events").doc(id));
      const eventSnaps = await db.getAll(...refs);
      eventSnaps.forEach(snap => {
        const data = snap.data();
        // Preserva o comportamento antigo: bloqueio nunca vira eventDetail (o
        // `getSyncedEvents` os filtrava, entao um booking legado que apontasse
        // para um bloqueio ficava com eventDetail null).
        if (snap.exists && data && !isBlockerEvent(data)) {
          eventsMap.set(snap.id, safeSerialize<GoogleCalendarEvent>({ id: snap.id, ...data }));
        }
      });
    }

    return bookingsSnap.docs.map(docSnap => {
      const data = docSnap.data();
      const eventDetail = eventsMap.get(data.eventId || docSnap.id);

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
    }).sort((a, b) => {
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
    await requireAdmin();
    const db = getAdminDb();
    const attendeesSnap = await db.collection("Calendar_Events").doc(eventId).collection("attendees").get();
    
    const attendees = (await Promise.all(attendeesSnap.docs.map(async (doc) => {
      try {
        const data = doc.data();
        let realProfilePhoto = null;
        let realPhone = data.phone || null;
        let realNickname = data.nickname || data.displayName || "Participante";
        
        if (data.matricula && typeof data.matricula === "string" && data.matricula.trim() !== "") {
          const userDoc = await db.collection("User").doc(data.matricula).get();
          if (userDoc.exists) {
            const uData = userDoc.data();
            realProfilePhoto = uData?.photoUrl || null;
            if (uData?.Authentication_Phone) {
              realPhone = uData.Authentication_Phone;
            }
            realNickname = uData?.User_Nickname || uData?.User_Welcome?.User_Nickname || uData?.Authentication_Name || uData?.User_Name || realNickname;
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
          nickname: realNickname,
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
export async function getProgramacaoForMemberAction(): Promise<ProgramacaoEntry[]> {
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
export async function getProgramacaoSummaryAction(idToken?: string): Promise<ProgramacaoEntry[]> {
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
    await requireAdmin(idToken);
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

/**
 * Busca a cota real de sessões 1 to 1 contratada pelo membro.
 */
export async function getUserOneToOneQuotaAction(matricula: string): Promise<number | null> {
  try {
    const session = await requireAuth();
    if (session.matricula !== matricula && !session.isAdmin) {
      throw new AuthorizationError("Voce nao pode acessar a cota de outro membro.");
    }
    const db = getAdminDb();

    // Tenta buscar no caminho de quotas sob permissões
    const quotaRef = db.collection("User").doc(matricula).collection("User_Permissions").doc("quotas");
    const snap = await quotaRef.get();
    
    if (snap.exists) {
       const data = snap.data();
       
       // 1. Prioridade Máxima: O novo campo configurado manualmente pelo Admin
       if (data?.mentoCoachSessionsLimit !== undefined) {
         return Number(data.mentoCoachSessionsLimit);
       }
       
       // 2. Fallback: Leitura da chave dentro do mapa "quotas". Chave canonica
       // = "1-to-1" (BUG-008); tolera a legada "1-TO-1" durante a transicao.
       const oneToOne = data?.quotas && (data.quotas["1-to-1"] || data.quotas["1-TO-1"]);
       if (oneToOne && oneToOne.total !== undefined) {
         return Number(oneToOne.total);
       }
       
       // Caso nenhum dos dois exista, retorna null
       return null;
    }
    
    return null;
  } catch (error) {
    console.error("Erro ao buscar cota 1 to 1 do usuário:", error);
    return null;
  }
}
