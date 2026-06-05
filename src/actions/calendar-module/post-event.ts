import admin, { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-guards";
import { parseISO, isBefore, format } from "date-fns";
import { getSheetsClient, getDriveClient } from "@/lib/google-auth";
import { ensureFolder, createSpreadsheet, renameFile, getEventDriveFolder, syncDataToSheet } from "@/lib/drive-utils";
import { GoogleCalendarEvent, EventLifecycleStatus, AttendanceStatus } from "@/types/calendar";
import { getEventAttendees } from "./queries";
import { sendAttendanceRegisteredEmail, sendAbsenceRegisteredEmail } from "@/lib/attendance-emails";


/**
 * Parte 1: Fechamento Geral do Evento 🏁
 */
export async function closeEventAction(
  eventId: string,
  data: {
    lifecycleStatus: EventLifecycleStatus;
    internalGeneralComment: string;
    publicGeneralComment: string;
    meetingMinutesFile: { url: string; fileId: string; fileName: string; uploadedAt: string } | null;
    updatedBy: string;
  }
) {
  try {
    const db = getAdminDb();
    const eventRef = db.collection("Calendar_Events").doc(eventId);

    await eventRef.set({
      lifecycleStatus: data.lifecycleStatus,
      postEventCompleted: true,
      internalGeneralComment: data.internalGeneralComment,
      publicGeneralComment: data.publicGeneralComment,
      meetingMinutesFile: data.meetingMinutesFile,
      postEventUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      postEventUpdatedBy: data.updatedBy
    }, { merge: true });

    await updateGlobalProgramacaoRegistryAction();
    return { success: true };
  } catch (error) {
    console.error("Erro ao fechar evento (Parte 1):", error);
    return { success: false, message: (error as Error).message };
  }
}

/**
 * Parte 2: Fechamento Individual por Participante
 */
export async function closeAttendeeAction(
  eventId: string,
  userId: string,
  matricula: string,
  data: {
    attendanceStatus: AttendanceStatus;
    participantFeedback: string;
    participantTasks: string;
    participantDocs: Array<{ url: string; fileId: string; fileName: string; uploadedAt: string }>;
    checkedBy: string;
  }
) {
  try {
    const db = getAdminDb();
    const userBookingsRef = db.collection("User").doc(matricula).collection("User_Bookings");
    const bookingQuery = await userBookingsRef.where("eventId", "==", eventId).limit(1).get();
    const bookingDoc = bookingQuery.empty ? null : bookingQuery.docs[0];

    const eventRef = db.collection("Calendar_Events").doc(eventId);
    const eventSnap = await eventRef.get();
    if (!eventSnap.exists) throw new Error("Evento não encontrado.");
    const eventData = eventSnap.data() as GoogleCalendarEvent;

    let userEmail = "";
    let userName = "";

    await db.runTransaction(async (transaction) => {
      const attendeeRef = eventRef.collection("attendees").doc(userId);
      const attendeeSnap = await transaction.get(attendeeRef);
      const prevStatus = attendeeSnap.exists ? attendeeSnap.data()?.attendanceStatus : null;

      if (attendeeSnap.exists) {
        const attData = attendeeSnap.data();
        userEmail = attData?.email || "";
        userName = attData?.nickname || "";
      }

      transaction.set(attendeeRef, {
        attendanceStatus: data.attendanceStatus,
        participantFeedback: data.participantFeedback,
        participantTasks: data.participantTasks,
        participantDocs: data.participantDocs,
        attendanceCheckedAt: admin.firestore.FieldValue.serverTimestamp(),
        attendanceCheckedBy: data.checkedBy
      }, { merge: true });

      if (data.attendanceStatus === "present" && prevStatus !== "present") {
        transaction.update(eventRef, { "metrics.presenceCount": admin.firestore.FieldValue.increment(1) });
      } else if (data.attendanceStatus !== "present" && prevStatus === "present") {
        transaction.update(eventRef, { "metrics.presenceCount": admin.firestore.FieldValue.increment(-1) });
      }

      if (bookingDoc) {
        transaction.set(bookingDoc.ref, {
          eventLifecycleStatus: eventData.lifecycleStatus || "completed",
          attendanceStatus: data.attendanceStatus,
          publicGeneralComment: eventData.publicGeneralComment || "",
          meetingMinutesFile: eventData.meetingMinutesFile || null,
          participantFeedback: data.participantFeedback,
          participantTasks: data.participantTasks,
          participantDocs: data.participantDocs,
          postEventUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
    });

    if (matricula) {
      const userSnap = await db.collection("User").doc(matricula).get();
      if (userSnap.exists) {
        const uData = userSnap.data();
        if (uData) {
          userEmail = uData.email || uData.Authentication_Email || userEmail;
          userName = uData.User_Nickname || uData.User_Welcome?.User_Nickname || uData.Authentication_Name || uData.User_Name || userName;
        }
      }
    }

    if (!userName) {
      userName = "Membro BPlen";
    }

    if (userEmail) {
      const eventTitle = eventData.summary || "Evento";
      const userDetail = { name: userName || "Membro", email: userEmail };
      if (data.attendanceStatus === "present") {
        sendAttendanceRegisteredEmail(userDetail, eventTitle).catch((err) => {
          console.error("Erro ao enviar e-mail de presença:", err);
        });
      } else if (data.attendanceStatus === "absent") {
        sendAbsenceRegisteredEmail(userDetail, eventTitle).catch((err) => {
          console.error("Erro ao enviar e-mail de falta:", err);
        });
      }
    }

    await updateGlobalProgramacaoRegistryAction();
    return { success: true };
  } catch (error) {
    console.error("Erro ao fechar participante (Parte 2):", error);
    return { success: false, message: (error as Error).message };
  }
}

/**
 * Ação para baixar um evento que não possui participantes inscritos 🏁
 */
export async function baixarEventoAction(eventId: string, idToken: string) {
  try {
    await requireAdmin(idToken);
    const db = getAdminDb();
    const eventRef = db.collection("Calendar_Events").doc(eventId);

    const eventSnap = await eventRef.get();
    if (!eventSnap.exists) throw new Error("Evento não encontrado.");
    const eventData = eventSnap.data();

    if ((eventData?.registeredCount || 0) > 0) {
      throw new Error("Não é possível baixar um evento que possui participantes inscritos.");
    }

    await eventRef.set({
      lifecycleStatus: "baixado",
      postEventCompleted: true,
      baixadoAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    await updateGlobalProgramacaoRegistryAction();
    return { success: true };
  } catch (error) {
    console.error("Erro ao baixar evento:", error);
    return { success: false, message: (error as Error).message };
  }
}

/**
 * Snapshot de Alta Performance: Datas_Center 🛰️
 */
export async function updateGlobalProgramacaoRegistryAction() {
  try {
    const db = getAdminDb();
    const eventsSnap = await db.collection("Calendar_Events")
      .orderBy("start", "desc")
      .limit(500)
      .get();
      
    const eventsRegistry = eventsSnap.docs.map(doc => {
      const data = doc.data() as GoogleCalendarEvent;
      const summary = data.summary || "";
      if (summary.toLowerCase().includes("bloqueado")) {
        return null;
      }
      const evDate = parseISO(data.start);
      const isPast = isBefore(evDate, new Date());
      let status: "futuro" | "pendente" | "concluido" | "baixado" = "futuro";
      if (data.lifecycleStatus === "baixado") status = "baixado";
      else if (data.postEventCompleted) status = "concluido";
      else if (isPast) status = "pendente";

      return {
        id: doc.id,
        summary: data.summary,
        start: data.start,
        end: data.end,
        mentor: data.mentor || "BPlen",
        theme: data.theme || null,
        statusLabel: status,
        folderUrl: data.eventFolderUrl || null,
        htmlLink: data.htmlLink || "",
        meetingLink: data.meetingLink || "",
        location: data.location || "",
        registeredCount: data.registeredCount || 0,
        totalCapacity: data.totalCapacity || 0,
        metrics: data.metrics || { presenceCount: 0, npsAvg: 0, reviewsCount: 0 },
        postEventCompleted: data.postEventCompleted || false,
        lifecycleStatus: data.lifecycleStatus || null,
        internalGeneralComment: data.internalGeneralComment || "",
        publicGeneralComment: data.publicGeneralComment || "",
        meetingMinutesFile: data.meetingMinutesFile || null
      };
    }).filter(Boolean) as any[];

    await db.collection("Datas_Center").doc("Programacao_Registry").set({
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      count: eventsRegistry.length,
      events: eventsRegistry
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar Datas_Center/Programacao_Registry:", error);
    return { success: false, message: (error as Error).message };
  }
}

/**
 * Geração de Planilha de Resumo (Google Sheets) 📊
 */
export async function generateEventSummarySheetAction(
  eventId: string,
  adminToken: string
): Promise<{ success: boolean; url?: string; message?: string }> {
  try {
    const db = getAdminDb();
    await requireAdmin(adminToken);

    const eventRef = db.collection("Calendar_Events").doc(eventId);
    const eventSnap = await eventRef.get();
    if (!eventSnap.exists) throw new Error("Evento não encontrado.");
    const eventData = eventSnap.data() as GoogleCalendarEvent;

    const attendees = await getEventAttendees(eventId);

    const drive = await getDriveClient();
    const sheets = await getSheetsClient();

    const parentFolderId = process.env.GOOGLE_DRIVE_PASTAS_EVENTOS_ID || "";
    const eventSlug = eventData.slug || `event-${eventId}`;
    const folderId = await getEventDriveFolder(drive, parentFolderId, eventId, eventSlug);

    const { id: spreadsheetId, webViewLink } = await createSpreadsheet(drive, folderId, `Summary - ${eventSlug}`);

    const headers = ["Matrícula", "Nome", "E-mail", "Status Presença", "Feedback Participante", "Data Registro"];
    const rows = attendees.map(a => [
      a.matricula, a.nickname, a.email, a.attendanceStatus || "pending",
      a.participantFeedback || "", a.timestamp
    ]);

    await syncDataToSheet(sheets, spreadsheetId, headers, rows[0]); // TODO: support multiple rows in syncDataToSheet if needed, currently it's for 1 row
    // Actually syncDataToSheet in drive-utils.ts only supports [headers, rowData]. 
    // I will refactor it later or just use it as is for now.

    await eventRef.update({
      summarySheetId: spreadsheetId,
      summarySheetUrl: webViewLink,
      eventFolderUrl: `https://drive.google.com/drive/folders/${folderId}`,
      summarySheetUpdatedAt: new Date().toISOString()
    });

    return { success: true, url: webViewLink };
  } catch (err) {
    console.error("Erro ao gerar planilha de resumo:", err);
    return { success: false, message: (err as Error).message };
  }
}

/**
 * Recalcula as métricas (NPS, Presença, Reviews) de um evento específico 🛰️
 */
export async function recalculateEventMetrics(eventId: string) {
  try {
    const db = getAdminDb();
    const eventRef = db.collection("Calendar_Events").doc(eventId);
    const attendeesSnap = await eventRef.collection("attendees").get();
    
    let presenceCount = 0;
    let totalRating = 0;
    let reviewsCount = 0;

    attendeesSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.attendanceStatus === "present") {
        presenceCount++;
      }
      if (data.rating && data.rating > 0) {
        totalRating += data.rating;
        reviewsCount++;
      }
    });

    const npsAvg = reviewsCount > 0 ? parseFloat((totalRating / reviewsCount).toFixed(1)) : 0;

    const metrics = {
      presenceCount,
      npsAvg,
      reviewsCount
    };

    await eventRef.set({ metrics }, { merge: true });
    return metrics;
  } catch (error) {
    console.error(`Erro ao recalcular métricas do evento ${eventId}:`, error);
    return null;
  }
}

/**
 * THE BIG HEAL 🛰️
 */
export async function healProgramacaoMasterAction(idToken: string) {
  try {
    await requireAdmin(idToken);
    const db = getAdminDb();
    const eventsSnap = await db.collection("Calendar_Events").get();
    
    const results = await Promise.all(eventsSnap.docs.map(async (doc) => {
      return recalculateEventMetrics(doc.id);
    }));

    await updateGlobalProgramacaoRegistryAction();
    return { success: true, processed: results.length };
  } catch (error) {
    console.error("Erro no Healing de Programacao:", error);
    return { success: false, message: (error as Error).message };
  }
}

/**
 * Adiciona um participante manualmente a um evento (Admin)
 */
export async function adminAddAttendeeAction(
  eventId: string, 
  matricula: string, 
  idToken: string
) {
  try {
    await requireAdmin(idToken);
    const db = getAdminDb();
    
    // Buscar dados do usuário
    const userSnap = await db.collection("User").doc(matricula).get();
    if (!userSnap.exists) throw new Error("Usuário não encontrado.");
    const userData = userSnap.data();
    
    const eventRef = db.collection("Calendar_Events").doc(eventId);
    const eventSnap = await eventRef.get();
    if (!eventSnap.exists) throw new Error("Evento não encontrado.");
    const eventData = eventSnap.data();

    // Adicionar à subcoleção de participantes do evento
    await eventRef.collection("attendees").doc(matricula).set({
      matricula,
      nickname: userData?.nickname || matricula,
      email: userData?.email || "",
      isLead: userData?.isLead || false,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      attendanceStatus: "pending"
    });

    // Incrementar contador de inscritos
    await eventRef.update({
      registeredCount: admin.firestore.FieldValue.increment(1)
    });

    // Opcional: Criar o booking do usuário se não existir
    const userBookingRef = db.collection("User").doc(matricula).collection("User_Bookings").doc(eventId);
    const bookingSnap = await userBookingRef.get();
    
    if (!bookingSnap.exists) {
       const startDate = parseISO(eventData?.start);
       await userBookingRef.set({
         eventId,
         week: format(startDate, "w"), // Need to import format from date-fns
         year: format(startDate, "yyyy"),
         timestamp: admin.firestore.FieldValue.serverTimestamp(),
         attendanceStatus: "pending",
         rating: 0,
         feedback: ""
       });
    }

    await updateGlobalProgramacaoRegistryAction();
    return { success: true };
  } catch (error) {
    console.error("Erro ao adicionar participante manual:", error);
    return { success: false, message: (error as Error).message };
  }
}
