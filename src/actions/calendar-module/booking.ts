import admin, { getAdminDb } from "@/lib/firebase-admin";
import { requireAuth, requireAdmin } from "@/lib/auth-guards";
import { serverEnv } from "@/env";
import { format, getISOWeek, getYear, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Resend } from "resend";
import { CALENDAR_CONFIG } from "@/config/calendarConfig";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { GoogleCalendarEvent } from "@/types/calendar";
import { updateGlobalProgramacaoRegistryAction, recalculateEventMetrics } from "./post-event";
import { getBookingConfirmationEmail, getAdminInclusionEmail, getCancellationEmail, getRescheduleEmail, getTeamBookingNotificationEmail, getTeamCancellationNotificationEmail, getTeamInclusionNotificationEmail, getTeamRescheduleNotificationEmail } from "@/lib/email-templates";
import { formatDateInBR, formatTimeInBR } from "@/lib/timezone";
import { generateIcsString } from "@/lib/ics-utils";
import { submitSurvey } from "../submit-survey";
import { bookingEvaluationSurveyConfig } from "@/config/surveys/booking-evaluation";

const resend = new Resend(serverEnv.RESEND_API_KEY);
const OFFICIAL_SENDER = `BPlen HUB <hub@bplen.com>`;

/**
 * Reserva de Vaga em Evento (BPlen HUB 🛡️)
 */
export async function bookEventAction(
  eventId: string, 
  userUid: string, 
  userEmail: string,
  matricula?: string,
  nickname?: string,
  oneToOneData?: { type: string; expectations: string },
  leadInfo?: { name?: string; phone?: string }
) {
  try {
    const rateLimit = await checkRateLimit({
      action: "BOOKING",
      uid: userUid,
      windowSeconds: RATE_LIMITS.BOOKING.windowSeconds
    });

    if (!rateLimit.allowed) {
      throw new Error(`Muitas solicitações. Aguarde ${rateLimit.retryAfterSeconds}s.`);
    }

    const db = getAdminDb();
    const eventRef = db.collection("Calendar_Events").doc(eventId);
    const userId = userUid;
    const displayName = nickname || userEmail.split("@")[0];

    const result = await db.runTransaction(async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists) throw new Error("Evento não encontrado");
      const eventData = eventDoc.data() as GoogleCalendarEvent;

      const attendeesCol = eventRef.collection("attendees");
      const userBookingRef = attendeesCol.doc(userId);
      const userBookingDoc = await transaction.get(userBookingRef);
      if (userBookingDoc.exists) throw new Error("Você já está inscrito neste evento");

      const attendeesSnap = await transaction.get(attendeesCol);
      const registeredCount = attendeesSnap.size;
      const capacity = eventData.totalCapacity || 0;

      if (capacity > 0 && registeredCount >= capacity) {
        throw new Error("Não há mais vagas disponíveis para este evento.");
      }

      const evDate = parseISO(eventData.start);
      const week = getISOWeek(evDate);
      const year = getYear(evDate);

      const bookingPayload = {
        userId,
        displayName,
        email: userEmail,
        matricula: matricula || null,
        bookedAt: admin.firestore.FieldValue.serverTimestamp(),
        attendanceStatus: "pending",
        week,
        year,
        oneToOneData: oneToOneData || null,
        leadInfo: leadInfo || null
      };

      transaction.set(userBookingRef, bookingPayload);

      if (matricula) {
        const userSubLinkRef = db.collection("User").doc(matricula).collection("User_Bookings").doc(eventId);
        transaction.set(userSubLinkRef, {
          eventId,
          bookedAt: admin.firestore.FieldValue.serverTimestamp(),
          week,
          year,
          category: (eventData.summary || "").toLowerCase().includes("1 to 1") ? "1to1" : "geral",
          oneToOneData: oneToOneData || null,
          attendanceStatus: "pending"
        }, { merge: true });
      }

      transaction.update(eventRef, {
        registeredCount: registeredCount + 1,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });

      return { success: true, eventData, bookingId: userId };
    });

    try {
      const emailHtml = getBookingConfirmationEmail({
        displayName,
        summary: result.eventData.summary,
        dateStr: formatDateInBR(result.eventData.start),
        timeStr: formatTimeInBR(result.eventData.start),
        mentor: result.eventData.mentor,
        theme: result.eventData.theme,
        htmlLink: result.eventData.htmlLink || "",
        cancelLink: "https://hub.bplen.com/hub/membro/dashboard",
        oneToOneInfo: oneToOneData ? `<p><b>Tipo:</b> ${oneToOneData.type}<br/><b>Expectativas:</b> ${oneToOneData.expectations}</p>` : undefined
      });

      const icsString = generateIcsString({
        title: result.eventData.summary,
        description: `Sessão de mentoria com ${result.eventData.mentor || 'BPlen'}${result.eventData.theme ? ` - Tema: ${result.eventData.theme}` : ''}`,
        location: result.eventData.htmlLink || 'Online (BPlen HUB)',
        start: new Date(result.eventData.start),
        end: new Date(result.eventData.end),
        uid: result.eventData.id || `booking-${userId}`
      });

      await resend.emails.send({
        from: OFFICIAL_SENDER,
        to: userEmail,
        subject: `${displayName}, seu evento ${result.eventData.summary} foi agendado.`,
        html: emailHtml,
        attachments: [
          {
            filename: "invite.ics",
            content: Buffer.from(icsString)
          }
        ]
      });

      try {
        const teamEmailHtml = getTeamBookingNotificationEmail({
          displayName,
          userEmail,
          summary: result.eventData.summary,
          dateStr: formatDateInBR(result.eventData.start),
          timeStr: formatTimeInBR(result.eventData.start),
          mentor: result.eventData.mentor,
          theme: result.eventData.theme,
          oneToOneInfo: oneToOneData ? `<p><b>Tipo:</b> ${oneToOneData.type}<br/><b>Expectativas:</b> ${oneToOneData.expectations}</p>` : undefined,
          isLead: !!leadInfo
        });

        await resend.emails.send({
          from: OFFICIAL_SENDER,
          to: "notificacao@bplen.com",
          subject: `Novo agendamento: ${result.eventData.summary} - ${displayName}`,
          html: teamEmailHtml
        });
      } catch (teamErr) {
        console.error("Erro ao enviar email de notificacao para a equipe:", teamErr);
      }
    } catch (e) {}

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido no agendamento.";
    console.error("Erro no agendamento:", error);
    return { success: false, message: errorMessage };
  }
}

/**
 * Cancelamento de Vaga (BPlen HUB 🛡️)
 */
export async function cancelBookingAction(
  matricula: string,
  bookingId: string, 
  eventId: string,
  userUid: string
) {
  try {
    const db = getAdminDb();
    const eventRef = db.collection("Calendar_Events").doc(eventId);
    const userBookingInEventRef = eventRef.collection("attendees").doc(userUid);
    const userBookingSubColRef = db.collection("User").doc(matricula).collection("User_Bookings").doc(eventId);

    const result = await db.runTransaction(async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      const bookingDoc = await transaction.get(userBookingInEventRef);

      if (!bookingDoc.exists) throw new Error("Agendamento não encontrado");
      const eventData = eventDoc.data() as GoogleCalendarEvent;
      const bookingData = bookingDoc.data();

      transaction.delete(userBookingInEventRef);
      transaction.delete(userBookingSubColRef);
      
      transaction.update(eventRef, {
        registeredCount: admin.firestore.FieldValue.increment(-1),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });

      return { success: true, eventData, nickname: bookingData?.displayName || "Membro", email: bookingData?.email };
    });

    try {
      if (result.email) {
        const emailHtml = getCancellationEmail({
          nickname: result.nickname,
          eventSummary: result.eventData.summary,
          platformLink: "https://hub.bplen.com/hub/membro/dashboard"
        });

        await resend.emails.send({
          from: OFFICIAL_SENDER,
          to: result.email,
          subject: `${result.nickname}, seu evento ${result.eventData.summary} foi cancelado.`,
          html: emailHtml
        });

        try {
          const teamEmailHtml = getTeamCancellationNotificationEmail({
            nickname: result.nickname,
            email: result.email || "",
            eventSummary: result.eventData.summary
          });

          await resend.emails.send({
            from: OFFICIAL_SENDER,
            to: "notificacao@bplen.com",
            subject: `Cancelamento de agendamento: ${result.eventData.summary} - ${result.nickname}`,
            html: teamEmailHtml
          });
        } catch (teamErr) {
          console.error("Erro ao enviar email de notificacao para a equipe:", teamErr);
        }
      }
    } catch (e) {}

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao cancelar agendamento.";
    console.error("Erro ao cancelar agendamento:", error);
    return { success: false, message: errorMessage };
  }
}

/**
 * Inclusão Administrativa (Admin 🛡️)
 */
export async function adminAddAttendeeAction(
  eventId: string,
  matricula: string,
  idToken?: string
) {
  try {
    await requireAdmin(idToken);
    const db = getAdminDb();
    
    const userDoc = await db.collection("User").doc(matricula).get();
    if (!userDoc.exists) throw new Error(`Usuário com matrícula ${matricula} não encontrado`);
    const userData = userDoc.data();
    
    const authMapDoc = await db.collection("_AuthMap").doc(matricula).get();
    const userUid = authMapDoc.exists ? authMapDoc.data()?.uid : matricula;

    const eventRef = db.collection("Calendar_Events").doc(eventId);
    const displayName = userData?.User_Nickname || userData?.User_Welcome?.User_Nickname || userData?.Authentication_Name || userData?.User_Name || "Membro BPlen";
    const userEmail = userData?.email || "";

    await db.runTransaction(async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists) throw new Error("Evento não encontrado");
      
      const userBookingRef = eventRef.collection("attendees").doc(userUid);
      const evDate = parseISO(eventDoc.data()?.start);
      
      transaction.set(userBookingRef, {
        userId: userUid,
        displayName,
        email: userEmail,
        matricula,
        bookedAt: admin.firestore.FieldValue.serverTimestamp(),
        attendanceStatus: "present",
        week: getISOWeek(evDate),
        year: getYear(evDate),
        adminInclusion: true
      });

      const userSubLinkRef = db.collection("User").doc(matricula).collection("User_Bookings").doc(eventId);
      transaction.set(userSubLinkRef, {
        eventId,
        bookedAt: admin.firestore.FieldValue.serverTimestamp(),
        week: getISOWeek(evDate),
        year: getYear(evDate),
        category: (eventDoc.data()?.summary || "").toLowerCase().includes("1 to 1") ? "1to1" : "geral",
        attendanceStatus: "present",
        adminInclusion: true
      }, { merge: true });
      
      transaction.update(eventRef, {
        registeredCount: admin.firestore.FieldValue.increment(1),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    try {
      if (userEmail) {
        const eventDoc = await eventRef.get();
        const evData = eventDoc.data() as GoogleCalendarEvent | undefined;

        const emailHtml = getAdminInclusionEmail({
          displayName,
          summary: evData?.summary || eventId,
          dateStr: evData?.start ? formatDateInBR(evData.start) : "Sessão Agendada",
          timeStr: evData?.start ? formatTimeInBR(evData.start) : "Consultar Painel",
          mentor: evData?.mentor || "BPlen",
          htmlLink: evData?.htmlLink || "https://hub.bplen.com/hub/membro/dashboard"
        });

        let attachments: { filename: string; content: Buffer }[] = [];
        if (evData?.start && evData?.end) {
          try {
            const icsString = generateIcsString({
              title: evData.summary,
              description: `Sessão de mentoria com ${evData.mentor || 'BPlen'}${evData.theme ? ` - Tema: ${evData.theme}` : ''}`,
              location: evData.htmlLink || 'Online (BPlen HUB)',
              start: new Date(evData.start),
              end: new Date(evData.end),
              uid: evData.id || `inclusion-${eventId}-${userUid}`
            });
            attachments = [
              {
                filename: "invite.ics",
                content: Buffer.from(icsString)
              }
            ];
          } catch (icsErr) {
            console.error("Erro ao gerar ICS de inclusao manual:", icsErr);
          }
        }

        await resend.emails.send({
          from: OFFICIAL_SENDER,
          to: userEmail,
          subject: `${displayName}, você foi incluído no evento.`,
          html: emailHtml,
          attachments: attachments.length > 0 ? attachments : undefined
        });

        try {
          const teamEmailHtml = getTeamInclusionNotificationEmail({
            displayName,
            userEmail,
            summary: evData?.summary || eventId,
            dateStr: evData?.start ? formatDateInBR(evData.start) : "Não informada",
            timeStr: evData?.start ? formatTimeInBR(evData.start) : "Não informado",
            mentor: evData?.mentor || "BPlen"
          });

          await resend.emails.send({
            from: OFFICIAL_SENDER,
            to: "notificacao@bplen.com",
            subject: `Inclusao administrativa: ${evData?.summary || eventId} - ${displayName}`,
            html: teamEmailHtml
          });
        } catch (teamErr) {
          console.error("Erro ao enviar email de notificacao para a equipe:", teamErr);
        }
      }
    } catch (e) {}

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido na inclusão administrativa.";
    return { success: false, message: errorMessage };
  }
}

/**
 * Avaliação de Evento (NPS & Feedback 🧬)
 */
export async function submitEvaluationAction(
  matricula: string,
  bookingId: string, 
  rating: number,
  feedback: string,
  userUid: string
) {
  try {
    const db = getAdminDb();
    const eventId = bookingId; 

    const userBookingRef = db.collection("User").doc(matricula).collection("User_Bookings").doc(eventId);
    await userBookingRef.update({
      rating,
      feedback,
      evaluatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    try {
      const eventRef = db.collection("Calendar_Events").doc(eventId);
      const attendeeRef = eventRef.collection("attendees").doc(userUid);
      await attendeeRef.update({
        rating,
        feedback,
        evaluatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const eventDoc = await eventRef.get();
      const eventData = eventDoc.data();
      
      // submitSurvey(config, responses, userUid)
      await submitSurvey(
        bookingEvaluationSurveyConfig,
        {
          nps_rating: rating,
          feedback_text: feedback,
          target_event_id: eventId,
          target_event_name: eventData?.summary || "Sessão BPlen",
          target_mentor: eventData?.mentor || "BPlen"
        },
        userUid
      );
    } catch (err) {}

    try {
      await recalculateEventMetrics(eventId);
      await updateGlobalProgramacaoRegistryAction();
    } catch (registryErr) {}

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao enviar avaliação.";
    console.error("❌ Erro ao enviar avaliação:", error);
    return { success: false, message: errorMessage };
  }
}

/**
 * Reagendamento de Inscrito (Admin 🛡️)
 */
export async function rescheduleAttendeeAction(
  oldEventId: string,
  newEventId: string,
  userUid: string,
  idToken?: string
) {
  try {
    await requireAdmin(idToken);
    const db = getAdminDb();

    const oldEventRef = db.collection("Calendar_Events").doc(oldEventId);
    const newEventRef = db.collection("Calendar_Events").doc(newEventId);

    const oldAttendeeRef = oldEventRef.collection("attendees").doc(userUid);
    const newAttendeeRef = newEventRef.collection("attendees").doc(userUid);

    const result = await db.runTransaction(async (transaction) => {
      const oldEventDoc = await transaction.get(oldEventRef);
      const newEventDoc = await transaction.get(newEventRef);
      const attendeeDoc = await transaction.get(oldAttendeeRef);

      if (!oldEventDoc.exists) throw new Error("Evento original não encontrado.");
      if (!newEventDoc.exists) throw new Error("Novo evento não encontrado.");
      if (!attendeeDoc.exists) throw new Error("Participante não encontrado no evento original.");

      const oldEventData = oldEventDoc.data() as GoogleCalendarEvent;
      const newEventData = newEventDoc.data() as GoogleCalendarEvent;
      const attendeeData = attendeeDoc.data() as any;

      // Validação de vagas no novo evento
      const newAttendeesCol = newEventRef.collection("attendees");
      const newAttendeesSnap = await transaction.get(newAttendeesCol);
      const newRegisteredCount = newAttendeesSnap.size;
      const capacity = newEventData.totalCapacity || 0;

      if (capacity > 0 && newRegisteredCount >= capacity) {
        throw new Error("Não há vagas disponíveis para o novo evento.");
      }

      const newEvDate = parseISO(newEventData.start);
      const week = getISOWeek(newEvDate);
      const year = getYear(newEvDate);

      // Desinscreve do evento antigo
      transaction.delete(oldAttendeeRef);
      transaction.update(oldEventRef, {
        registeredCount: admin.firestore.FieldValue.increment(-1),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });

      // Inscreve no novo evento
      const { attendanceCheckedAt, attendanceCheckedBy, ...restAttendeeData } = attendeeData;

      const newAttendeePayload = {
        ...restAttendeeData,
        week,
        year,
        bookedAt: admin.firestore.FieldValue.serverTimestamp(),
        attendanceStatus: "pending",
      };
      
      transaction.set(newAttendeeRef, newAttendeePayload);
      transaction.update(newEventRef, {
        registeredCount: admin.firestore.FieldValue.increment(1),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });

      // Atualiza coleção privada do usuário (se possuir matrícula)
      if (attendeeData.matricula) {
        const userBookingsCol = db.collection("User").doc(attendeeData.matricula).collection("User_Bookings");
        const oldUserBookingRef = userBookingsCol.doc(oldEventId);
        const newUserBookingRef = userBookingsCol.doc(newEventId);

        transaction.delete(oldUserBookingRef);
        
        transaction.set(newUserBookingRef, {
          eventId: newEventId,
          bookedAt: admin.firestore.FieldValue.serverTimestamp(),
          week,
          year,
          category: (newEventData.summary || "").toLowerCase().includes("1 to 1") ? "1to1" : "geral",
          oneToOneData: attendeeData.oneToOneData || null,
          attendanceStatus: "pending"
        }, { merge: true });
      }

      return {
        success: true,
        oldEventData,
        newEventData,
        attendeeData
      };
    });

    // Envio de E-mail
    try {
      if (result.attendeeData.email) {
        const participantName = result.attendeeData.nickname || result.attendeeData.displayName || "Participante";
        const emailHtml = getRescheduleEmail({
          participantName,
          eventName: result.newEventData.summary,
          oldDateStr: formatDateInBR(result.oldEventData.start, "dd/MM/yyyy"),
          oldTimeStr: formatTimeInBR(result.oldEventData.start),
          oldMentor: result.oldEventData.mentor || "BPlen",
          newDateStr: formatDateInBR(result.newEventData.start, "dd/MM/yyyy"),
          newTimeStr: formatTimeInBR(result.newEventData.start),
          newMentor: result.newEventData.mentor || "BPlen",
          platformLink: "https://hub.bplen.com/hub/membro/dashboard"
        });

        // Subject based on the new email
        const subject = `seu evento ${result.oldEventData.summary} foi alterado para...`;

        let attachments: { filename: string; content: Buffer }[] = [];
        try {
          const icsString = generateIcsString({
            title: result.newEventData.summary,
            description: `Sessão de mentoria com ${result.newEventData.mentor || 'BPlen'}${result.newEventData.theme ? ` - Tema: ${result.newEventData.theme}` : ''}`,
            location: result.newEventData.htmlLink || 'Online (BPlen HUB)',
            start: new Date(result.newEventData.start),
            end: new Date(result.newEventData.end),
            uid: result.newEventData.id || `reschedule-${result.newEventData.id}`
          });
          attachments = [
            {
              filename: "invite.ics",
              content: Buffer.from(icsString)
            }
          ];
        } catch (icsErr) {
          console.error("Erro ao gerar ICS de reagendamento:", icsErr);
        }

        await resend.emails.send({
          from: OFFICIAL_SENDER,
          to: result.attendeeData.email,
          subject: subject,
          html: emailHtml,
          attachments: attachments.length > 0 ? attachments : undefined
        });

        try {
          const teamEmailHtml = getTeamRescheduleNotificationEmail({
            participantName,
            email: result.attendeeData.email,
            eventName: result.newEventData.summary,
            oldDateStr: formatDateInBR(result.oldEventData.start, "dd/MM/yyyy"),
            oldTimeStr: formatTimeInBR(result.oldEventData.start),
            oldMentor: result.oldEventData.mentor || "BPlen",
            newDateStr: formatDateInBR(result.newEventData.start, "dd/MM/yyyy"),
            newTimeStr: formatTimeInBR(result.newEventData.start),
            newMentor: result.newEventData.mentor || "BPlen"
          });

          await resend.emails.send({
            from: OFFICIAL_SENDER,
            to: "notificacao@bplen.com",
            subject: `Reagendamento de evento: ${result.oldEventData.summary} para ${result.newEventData.summary} - ${participantName}`,
            html: teamEmailHtml
          });
        } catch (teamErr) {
          console.error("Erro ao enviar email de notificacao para a equipe:", teamErr);
        }
      }
    } catch (e) {
      console.error("Erro ao enviar e-mail de reagendamento:", e);
    }

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido no reagendamento.";
    console.error("Erro no reagendamento:", error);
    return { success: false, message: errorMessage };
  }
}
