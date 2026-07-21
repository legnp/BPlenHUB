import admin, { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-guards";
import { parseISO, isBefore } from "date-fns";
import { getSheetsClient, getDriveClient } from "@/lib/google-auth";
import { createSpreadsheet, getEventDriveFolder, syncDataToSheet } from "@/lib/drive-utils";
import { GoogleCalendarEvent, EventLifecycleStatus, AttendanceStatus, ProgramacaoEntry } from "@/types/calendar";
import { getEventAttendees } from "./queries";
import { sendAttendanceRegisteredEmail, sendAbsenceRegisteredEmail } from "@/lib/attendance-emails";
import { isBlockerEvent } from "@/lib/booking/blocker";


export interface CloseEventData {
  lifecycleStatus: EventLifecycleStatus;
  internalGeneralComment: string;
  publicGeneralComment: string;
  meetingMinutesFile: { url: string; fileId: string; fileName: string; uploadedAt: string } | null;
  updatedBy: string;
}

export interface CloseAttendeeData {
  attendanceStatus: AttendanceStatus;
  participantFeedback: string;
  participantTasks: string;
  participantDocs: Array<{ url: string; fileId: string; fileName: string; uploadedAt: string }>;
  checkedBy: string;
}

/**
 * Parte 1: Fechamento Geral do Evento 🏁
 */
export async function closeEventAction(
  eventId: string,
  data: CloseEventData
) {
  try {
    // BUG-102: esta funcao e reexportada pelo dispatcher `calendar.ts` ("use
    // server"), logo e endpoint de rede. Sem guard, um chamador nao autenticado
    // fechava/cancelava qualquer evento, marcava presenca de qualquer membro e
    // gravava feedback/tarefas/documentos na CARREIRA dele. Estava listada no
    // corpo do BUG-020, mas nenhum dos 7 lotes tocou este arquivo.
    // Callers 100% admin (PostEventWizard) — nenhum fluxo legitimo e barrado.
    await requireAdmin();
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

    // Se houver arquivo de ata, replicar automaticamente para o histórico de Atas de todos os participantes
    if (data.meetingMinutesFile && data.meetingMinutesFile.url) {
      const eventSnap = await eventRef.get();
      const eventData = eventSnap.data() || {};
      const eventSummary = eventData.summary || "Sessão de Mentoria";
      const eventStart = eventData.start || "";

      const attendeesSnap = await eventRef.collection("attendees").get();
      if (!attendeesSnap.empty) {
        const batch = db.batch();
        for (const attendeeDoc of attendeesSnap.docs) {
          const attData = attendeeDoc.data();
          const attendeeMatricula = attData.matricula;
          if (!attendeeMatricula || attendeeMatricula === "PENDING") continue;

          const ataId = `booking-${eventId}-ata`;
          const ataRef = db.collection("User").doc(attendeeMatricula).collection("Atas").doc(ataId);
          batch.set(ataRef, {
            title: `Ata de Reunião - ${eventSummary}`,
            meetingDate: eventStart ? eventStart.substring(0, 10) : new Date().toISOString().substring(0, 10),
            fileUrl: data.meetingMinutesFile!.url,
            contentSummary: data.publicGeneralComment || "Ata de mentoria consolidada.",
            createdAt: data.meetingMinutesFile!.uploadedAt || new Date().toISOString()
          }, { merge: true });

          // BUG-101: o agendamento do membro (User_Bookings) so recebia a Ata na
          // closeAttendeeAction, que copia eventData.meetingMinutesFile NO INSTANTE
          // do fechamento do participante. Ata enviada depois desse fechamento
          // ficava invisivel na Gestao de Agenda (caso real: BP-005). Espelhar aqui
          // torna as duas partes independentes de ordem; a fonte da verdade segue
          // sendo o doc do evento.
          const bookingQuery = await db.collection("User").doc(attendeeMatricula)
            .collection("User_Bookings")
            .where("eventId", "==", eventId)
            .limit(1)
            .get();
          if (!bookingQuery.empty) {
            batch.set(bookingQuery.docs[0].ref, {
              meetingMinutesFile: data.meetingMinutesFile,
              postEventUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
          }
        }
        await batch.commit();
      }
    }

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
  data: CloseAttendeeData
) {
  try {
    // BUG-102: esta funcao e reexportada pelo dispatcher `calendar.ts` ("use
    // server"), logo e endpoint de rede. Sem guard, um chamador nao autenticado
    // fechava/cancelava qualquer evento, marcava presenca de qualquer membro e
    // gravava feedback/tarefas/documentos na CARREIRA dele. Estava listada no
    // corpo do BUG-020, mas nenhum dos 7 lotes tocou este arquivo.
    // Callers 100% admin (PostEventWizard) — nenhum fluxo legitimo e barrado.
    await requireAdmin();
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
    let tasksToSync: string[] = [];

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

      // -- AUTOMACAO GESTAO DE CARREIRA (ESPELHAMENTO RETROATIVO E DIRETO) --
      if (matricula && matricula !== "PENDING") {
        // 1. Replicar Feedback Qualitativo
        if (data.participantFeedback && data.participantFeedback.trim()) {
          const feedbackId = `booking-${eventId}`;
          const feedbackRef = db.collection("User").doc(matricula).collection("Feedbacks").doc(feedbackId);
          transaction.set(feedbackRef, {
            title: `Feedback - ${eventData.summary || "Sessão de Mentoria"}`,
            content: data.participantFeedback,
            author: data.checkedBy || "Consultor BPlen",
            createdAt: new Date().toISOString()
          }, { merge: true });
        }

        // 2. Replicar Tarefas do Backlog (Quebrar por linha e limpar marcadores)
        if (data.participantTasks && data.participantTasks.trim()) {
          const taskLines = data.participantTasks
            .split(/\r?\n/)
            .map(line => line.replace(/^[\s*\-\d\.)]+/, "").trim())
            .filter(line => line.length > 0);

          tasksToSync = taskLines; // Save for external sync

          taskLines.forEach((taskTitle, idx) => {
            const taskId = `booking-${eventId}-task-${idx}`;
            const taskRef = db.collection("User").doc(matricula).collection("Career_Backlog").doc(taskId);
            transaction.set(taskRef, {
              title: taskTitle,
              status: "Sprint atual",
              createdAt: new Date().toISOString(),
              statusHistory: [{ status: "Sprint atual", changedAt: new Date().toISOString() }],
              comments: []
            }, { merge: true });
          });
        }

        // 3. Replicar Documentos Compartilhados
        if (data.participantDocs && data.participantDocs.length > 0) {
          data.participantDocs.forEach((doc, idx) => {
            const docId = `booking-${eventId}-doc-${idx}`;
            const docRef = db.collection("User").doc(matricula).collection("Shared_Documents").doc(docId);
            transaction.set(docRef, {
              title: doc.fileName || `Documento - ${eventData.summary || "Mentoria"}`,
              fileUrl: doc.url,
              fileName: doc.fileName || "arquivo.pdf",
              category: eventData.summary || "Mentoria",
              createdAt: doc.uploadedAt || new Date().toISOString()
            }, { merge: true });
          });
        }

        // 4. Replicar Ata Geral do Evento (se houver)
        if (eventData.meetingMinutesFile && eventData.meetingMinutesFile.url) {
          const ataId = `booking-${eventId}-ata`;
          const ataRef = db.collection("User").doc(matricula).collection("Atas").doc(ataId);
          transaction.set(ataRef, {
            title: `Ata de Reunião - ${eventData.summary || "Sessão de Mentoria"}`,
            meetingDate: eventData.start ? eventData.start.substring(0, 10) : new Date().toISOString().substring(0, 10),
            fileUrl: eventData.meetingMinutesFile.url,
            contentSummary: eventData.publicGeneralComment || "Ata de mentoria consolidada.",
            createdAt: eventData.meetingMinutesFile.uploadedAt || new Date().toISOString()
          }, { merge: true });
        }
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

    // 📡 Sincronizar Tarefas com o Google Drive (Assíncrono)
    if (tasksToSync.length > 0 && matricula && matricula !== "PENDING") {
      try {
        const { syncBacklogToUserDrive } = await import("@/lib/drive-sync");
        const eventTitle = eventData.summary || "Sessão de Mentoria";
        const dtAtribuicao = new Date().toLocaleDateString('pt-BR');

        Promise.allSettled(tasksToSync.map(task => {
          const rowData = [
            dtAtribuicao,
            eventTitle,
            task,
            "Sprint atual",
            ""
          ];
          return syncBacklogToUserDrive(matricula, rowData);
        })).catch(err => console.error("🚨 [DriveSync:Backlog] Erro ao engatilhar sync de tarefas:", err));
      } catch (e) {
         console.error("🚨 [DriveSync:Backlog] Falha de import/sync:", e);
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
 * Teto de leitura do registro global. Dimensionado com folga sobre o tamanho real
 * da colecao (538 docs + ~116 bloqueios em 2026-07-16, ~654) para que o corte nao
 * volte a atingir evento real. A colecao cresce de forma monotonica enquanto o
 * BUG-085 (docs de eventos passados nunca removidos) nao for tratado — por isso o
 * aviso abaixo quando o teto for encostado, em vez de truncar calado.
 */
const REGISTRY_MAX_EVENTS = 2000;

/**
 * Snapshot de Alta Performance: Datas_Center 🛰️
 */
export async function updateGlobalProgramacaoRegistryAction() {
  try {
    const db = getAdminDb();
    // O `limit` e aplicado pelo Firestore ANTES do filtro em memoria abaixo, entao
    // ele corta sem distinguir evento real de bloqueio a descartar (BUG-086). Com
    // 538 docs, o teto antigo de 500 ja truncava o registro de forma silenciosa —
    // e passaria a descartar evento real assim que os bloqueios entrassem na base.
    // Filtrar por `where("isBlocker","==",false)` NAO resolve: o Firestore nao casa
    // documento sem o campo, e o sync so reescreve a janela futura (os docs
    // passados nunca o ganham).
    const eventsSnap = await db.collection("Calendar_Events")
      .orderBy("start", "desc")
      .limit(REGISTRY_MAX_EVENTS)
      .get();

    if (eventsSnap.size === REGISTRY_MAX_EVENTS) {
      console.warn(
        `[Programacao_Registry] Teto de ${REGISTRY_MAX_EVENTS} eventos atingido — o registro pode estar omitindo os mais antigos. Ver BUG-085.`
      );
    }

    const eventsRegistry = eventsSnap.docs.map(doc => {
      const data = doc.data() as GoogleCalendarEvent;
      if (isBlockerEvent(data)) {
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
    }).filter(Boolean) as ProgramacaoEntry[];

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

    await syncDataToSheet(sheets, spreadsheetId, headers, rows);

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

// Nota (BUG-010): a versão divergente de `adminAddAttendeeAction` que vivia aqui era
// CÓDIGO MORTO — o dispatcher `calendar.ts` sempre usou a de `booking.ts`, e nada
// importava/chamava esta. Removida para eliminar a duplicidade (que gravava attendee
// com id/tipos diferentes). Fonte única: `booking.ts:adminAddAttendeeAction`.
