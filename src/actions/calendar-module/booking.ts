import admin, { getAdminDb } from "@/lib/firebase-admin";
import { requireAuth, requireAdmin, AuthorizationError } from "@/lib/auth-guards";
import { serverEnv } from "@/env";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Resend } from "resend";
import { CALENDAR_CONFIG } from "@/config/calendarConfig";
import {
  getBookingWindowError,
  hasReachedWeeklyLimit,
  preservesCredit,
  resolveEventType,
  resolveEventWeek,
  isOneToOneEvent
} from "@/lib/booking/policy";
import { consumeQuota, refundQuota, ONE_TO_ONE_QUOTA_KEY } from "@/lib/quota-keys";
import { MemberQuota } from "@/types/entitlements";
import { isBlockerEvent } from "@/lib/booking/blocker";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { GoogleCalendarEvent, AttendeeData } from "@/types/calendar";
import { updateGlobalProgramacaoRegistryAction, recalculateEventMetrics } from "./post-event";
import { getBookingConfirmationEmail, getAdminInclusionEmail, getCancellationEmail, getRescheduleEmail, getTeamBookingNotificationEmail, getTeamCancellationNotificationEmail, getTeamInclusionNotificationEmail, getTeamRescheduleNotificationEmail } from "@/lib/email-templates";
import { formatDateInBR, formatTimeInBR } from "@/lib/timezone";
import { generateIcsString } from "@/lib/ics-utils";
import { submitSurvey } from "../submit-survey";
import { bookingEvaluationSurveyConfig } from "@/config/surveys/booking-evaluation";

const resend = new Resend(serverEnv.RESEND_API_KEY);
const OFFICIAL_SENDER = `BPlen HUB <hub@bplen.com>`;

// Doc de attendee legado pode carregar `displayName`/`oneToOneData` aninhado além
// dos campos flat (`type`/`expectations`) já modelados em AttendeeData (comportamento
// preservado, ver Onda 3 de limpeza de `any`).
type LegacyAttendeeDoc = AttendeeData & {
  displayName?: string;
  oneToOneData?: { type: string; expectations: string } | null;
};

// Documento raiz `User/{matricula}` — nomenclatura legada Pascal_Snake.
interface RawUserDoc {
  User_Nickname?: string;
  User_Welcome?: { User_Nickname?: string };
  Authentication_Name?: string;
  User_Name?: string;
}

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
    // Guard de sessao: fluxo de membro exige sessao propria (ou admin); funil de
    // lead publico (sem matricula, com leadInfo) permanece aberto como hoje.
    if (matricula) {
      const session = await requireAuth();
      if (session.matricula !== matricula && !session.isAdmin) {
        throw new AuthorizationError("Voce nao pode agendar em nome de outro membro.");
      }
    } else if (!leadInfo) {
      throw new AuthorizationError("Requisicao de agendamento invalida.");
    }

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

      // Bloqueio de agenda nao e evento agendavel: existe so para ocupar o horario
      // na agenda publica. Nenhuma tela expoe o id de um bloqueio, mas a checagem
      // de vaga abaixo trata `totalCapacity: 0` como ILIMITADO — e bloqueio nao tem
      // "Vagas:" na descricao, entao entra com 0. Sem esta trava, quem descobrisse
      // o id agendaria em cima de um horario bloqueado.
      if (isBlockerEvent(eventData)) {
        throw new Error("Evento não encontrado");
      }

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

      const { week, year } = resolveEventWeek(eventData.start);
      const eventType = resolveEventType(eventData.summary);

      // Trava de cota 1:1 (BUG-013): so o tipo `1-to-1` consome a carteira
      // `1-to-1`. Consultoria Individual/em Grupo, onboarding e offboarding NAO
      // entram (isOneToOneEvent decide por `tipoId`, nao por texto). O debito e
      // aplicado no MESMO commit da reserva (write phase abaixo) — atomico.
      const oneToOne = isOneToOneEvent(eventData);
      const walletRef = matricula
        ? db.doc(`User/${matricula}/User_Permissions/quotas`)
        : null;
      let quotaConsumed = false;
      let newQuotas: Record<string, MemberQuota> | null = null;

      // Politica de agendamento do MEMBRO — validada aqui, e nao so escondida na
      // tela. O funil de lead publico (sem matricula) fica de fora de proposito:
      // ele roda com PUBLIC_BOOKING_SETTINGS (janela de 33 dias) e aplicar esta
      // regra a ele quebraria o funil.
      if (matricula) {
        const windowError = getBookingWindowError(eventData.start);
        if (windowError) throw new Error(windowError);

        const userBookingsSnap = await transaction.get(
          db.collection("User").doc(matricula).collection("User_Bookings")
            .where("week", "==", week).where("year", "==", year)
        );

        const sameWeek: Array<{ week: number; year: number; eventType: string }> = [];
        for (const doc of userBookingsSnap.docs.filter(d => d.id !== eventId)) {
          const data = doc.data();
          let bookedType = resolveEventType(data.eventSummary);
          if (!bookedType) {
            // Agendamento legado (anterior a este PR, sem `eventSummary`): resolve
            // o tipo pelo evento, para a regra valer desde o primeiro dia em vez
            // de so daqui a ~3 semanas, quando os legados sairem da janela.
            const legacyEvent = await transaction.get(
              db.collection("Calendar_Events").doc(data.eventId || doc.id)
            );
            bookedType = resolveEventType(legacyEvent.data()?.summary);
          }
          sameWeek.push({ week: data.week, year: data.year, eventType: bookedType });
        }

        if (hasReachedWeeklyLimit(sameWeek, { week, year, eventType })) {
          throw new Error(
            `Você já tem uma sessão de ${eventData.summary} nesta semana. Sessões de outros tipos seguem disponíveis.`
          );
        }

        // Ultima leitura antes das escritas: saldo de cota 1:1. Bloqueia sem saldo.
        if (oneToOne && walletRef) {
          const walletDoc = await transaction.get(walletRef);
          const consumed = consumeQuota(walletDoc.data()?.quotas, ONE_TO_ONE_QUOTA_KEY);
          if (!consumed.ok) {
            throw new Error(
              "Você não possui créditos de 1 to 1 disponíveis. Adquira uma sessão para agendar."
            );
          }
          quotaConsumed = true;
          newQuotas = consumed.quotas;
        }
      }

      const bookingPayload = {
        userId,
        displayName,
        email: userEmail,
        matricula: matricula || null,
        bookedAt: admin.firestore.FieldValue.serverTimestamp(),
        attendanceStatus: "pending",
        week,
        year,
        eventSummary: eventData.summary || "",
        oneToOneData: oneToOneData || null,
        leadInfo: leadInfo || null,
        // Marca a reserva que DE FATO debitou cota 1:1 (BUG-013). O estorno no
        // cancelamento so credita reservas com esta flag — nunca as anteriores a
        // trava (que nunca consumiram), evitando creditar saldo do nada.
        quotaConsumed
      };

      transaction.set(userBookingRef, bookingPayload);

      if (matricula) {
        const userSubLinkRef = db.collection("User").doc(matricula).collection("User_Bookings").doc(eventId);
        transaction.set(userSubLinkRef, {
          eventId,
          bookedAt: admin.firestore.FieldValue.serverTimestamp(),
          week,
          year,
          eventSummary: eventData.summary || "",
          category: (eventData.summary || "").toLowerCase().includes("1 to 1") ? "1to1" : "geral",
          oneToOneData: oneToOneData || null,
          attendanceStatus: "pending"
        }, { merge: true });
      }

      transaction.update(eventRef, {
        registeredCount: registeredCount + 1,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });

      // Debito da cota 1:1 no mesmo commit da reserva (BUG-013): reserva e debito
      // sobem juntos ou nenhum dos dois. `update` substitui o campo `quotas`
      // inteiro (mapa ja normalizado por consumeQuota/foldQuotaMap).
      if (quotaConsumed && walletRef && newQuotas) {
        transaction.update(walletRef, { quotas: newQuotas });
      }

      return { success: true, eventData, bookingId: userId };
    });

    try {
      const emailHtml = getBookingConfirmationEmail({
        displayName,
        summary: result.eventData.summary,
        dateStr: formatDateInBR(result.eventData.start),
        timeStr: formatTimeInBR(result.eventData.start),
        mentor: result.eventData.mentor,
        theme: result.eventData.theme || undefined,
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
          theme: result.eventData.theme || undefined,
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
    const session = await requireAuth();
    if (session.matricula !== matricula && !session.isAdmin) {
      throw new AuthorizationError("Voce nao pode cancelar o agendamento de outro membro.");
    }

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

      // Politica de cancelamento: cancelar dentro das 24h continua PERMITIDO (o
      // membro nao vai comparecer de todo jeito, e a vaga volta para o grupo) —
      // o que se perde e o credito da sessao. Admin nao perde credito de ninguem.
      const isLate = !session.isAdmin && eventData?.start && !preservesCredit(eventData.start);

      // Estorno de cota 1:1 (BUG-013): so reservas que DEBITARAM (flag
      // `quotaConsumed`) e canceladas EM TEMPO HABIL recuperam o credito.
      // Cancelamento tardio perde o credito (a vaga ja nao volta a tempo);
      // cancelamento por admin nao e "tardio" (isLate=false), entao credita de
      // volta. A leitura da carteira acontece aqui, antes das escritas.
      const wasConsumed = bookingData?.quotaConsumed === true;
      const walletRef = db.doc(`User/${matricula}/User_Permissions/quotas`);
      let refundedQuotas: Record<string, MemberQuota> | null = null;
      if (wasConsumed && !isLate) {
        const walletDoc = await transaction.get(walletRef);
        refundedQuotas = refundQuota(walletDoc.data()?.quotas, ONE_TO_ONE_QUOTA_KEY);
      }

      transaction.delete(userBookingInEventRef);
      transaction.delete(userBookingSubColRef);

      // Rastro do cancelamento tardio para o debito de credito (BUG-013), fora
      // das subcolecoes que acabaram de ser apagadas.
      if (isLate) {
        const lateRef = db.collection("User").doc(matricula)
          .collection("User_Booking_History").doc(eventId);
        transaction.set(lateRef, {
          eventId,
          eventSummary: eventData?.summary || "",
          eventStart: eventData?.start || null,
          cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
          lateCancellation: true,
          creditPreserved: false
        }, { merge: true });
      }

      transaction.update(eventRef, {
        registeredCount: admin.firestore.FieldValue.increment(-1),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });

      // Credita de volta a cota 1:1, no mesmo commit do cancelamento (BUG-013).
      if (refundedQuotas) {
        transaction.update(walletRef, { quotas: refundedQuotas });
      }

      return { success: true, eventData, isLate, nickname: bookingData?.displayName || "Membro", email: bookingData?.email };
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

    return { success: true, lateCancellation: !!result.isLate };
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
      const { week: evWeek, year: evYear } = resolveEventWeek(eventDoc.data()?.start);

      transaction.set(userBookingRef, {
        userId: userUid,
        displayName,
        email: userEmail,
        matricula,
        bookedAt: admin.firestore.FieldValue.serverTimestamp(),
        attendanceStatus: "present",
        week: evWeek,
        year: evYear,
        adminInclusion: true
      });

      const userSubLinkRef = db.collection("User").doc(matricula).collection("User_Bookings").doc(eventId);
      transaction.set(userSubLinkRef, {
        eventId,
        bookedAt: admin.firestore.FieldValue.serverTimestamp(),
        week: evWeek,
        year: evYear,
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
    const session = await requireAuth();
    if (session.matricula !== matricula && !session.isAdmin) {
      throw new AuthorizationError("Voce nao pode avaliar o agendamento de outro membro.");
    }

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
      const attendeeData = attendeeDoc.data() as LegacyAttendeeDoc;

      let userData: RawUserDoc | null = null;
      if (attendeeData.matricula) {
        const userRef = db.collection("User").doc(attendeeData.matricula);
        const userDoc = await transaction.get(userRef);
        if (userDoc.exists) {
          userData = userDoc.data() as RawUserDoc;
        }
      }

      // Validação de vagas no novo evento
      const newAttendeesCol = newEventRef.collection("attendees");
      const newAttendeesSnap = await transaction.get(newAttendeesCol);
      const newRegisteredCount = newAttendeesSnap.size;
      const capacity = newEventData.totalCapacity || 0;

      if (capacity > 0 && newRegisteredCount >= capacity) {
        throw new Error("Não há vagas disponíveis para o novo evento.");
      }

      const { week, year } = resolveEventWeek(newEventData.start);

      // Desinscreve do evento antigo
      transaction.delete(oldAttendeeRef);
      transaction.update(oldEventRef, {
        registeredCount: admin.firestore.FieldValue.increment(-1),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });

      // Inscreve no novo evento
      const { attendanceCheckedAt, attendanceCheckedBy, ...restAttendeeData } = attendeeData;

      const resolvedName = userData
        ? (userData.User_Nickname || userData.User_Welcome?.User_Nickname || userData.Authentication_Name || userData.User_Name || "Membro BPlen")
        : (attendeeData.nickname || attendeeData.displayName || "Membro BPlen");

      const newAttendeePayload = {
        ...restAttendeeData,
        displayName: resolvedName,
        nickname: resolvedName,
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
        attendeeData: {
          ...attendeeData,
          displayName: resolvedName,
          nickname: resolvedName
        }
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
