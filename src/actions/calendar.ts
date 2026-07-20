"use server";

import * as Queries from "./calendar-module/queries";
import * as Sync from "./calendar-module/sync";
import * as Booking from "./calendar-module/booking";
import * as PostEvent from "./calendar-module/post-event";

/**
 * BPlen HUB — Calendar Actions Dispatcher (Hardened 🛡️)
 * Explicit Wrapper Pattern to satisfy Next.js 15 Turbopack module boundaries.
 * This pattern ensures that only async functions are exported.
 */

// --- Queries ---

export async function fetchCalendarEvents(dateReference: Date) {
  return Queries.fetchCalendarEvents(dateReference);
}

export async function getEventAttendees(eventId: string) {
  return Queries.getEventAttendees(eventId);
}

export async function getProgramacaoForMemberAction() {
  return Queries.getProgramacaoForMemberAction();
}

export async function getProgramacaoSummaryAction(idToken?: string) {
  return Queries.getProgramacaoSummaryAction(idToken);
}

export async function getEventNpsDetailsAction(eventId: string, idToken?: string) {
  return Queries.getEventNpsDetailsAction(eventId, idToken);
}

export async function getSyncedEvents(idToken?: string) {
  return Queries.getSyncedEvents(idToken);
}

export async function getUpcomingEvents(idToken?: string) {
  return Queries.getUpcomingEvents(idToken);
}

export async function getUserBookingsAction(matricula: string) {
  return Queries.getUserBookingsAction(matricula);
}

// --- Sync ---

export async function syncCalendarToFirestore(idToken?: string) {
  return Sync.syncCalendarToFirestore(idToken);
}

// --- Booking ---

export async function bookEventAction(
  eventId: string, 
  userUid: string, 
  userEmail: string,
  matricula?: string,
  nickname?: string,
  oneToOneData?: { type: string; expectations: string },
  leadInfo?: { name?: string; phone?: string }
) {
  return Booking.bookEventAction(eventId, userUid, userEmail, matricula, nickname, oneToOneData, leadInfo);
}

export async function cancelBookingAction(matricula: string, bookingId: string, eventId: string, userUid: string) {
  return Booking.cancelBookingAction(matricula, bookingId, eventId, userUid);
}

export async function submitEvaluationAction(matricula: string, bookingId: string, rating: number, feedback: string, userUid: string) {
  return Booking.submitEvaluationAction(matricula, bookingId, rating, feedback, userUid);
}

// --- Post-Event ---

export async function closeEventAction(eventId: string, data: PostEvent.CloseEventData) {
  return PostEvent.closeEventAction(eventId, data);
}

export async function closeAttendeeAction(eventId: string, userId: string, matricula: string, data: PostEvent.CloseAttendeeData) {
  return PostEvent.closeAttendeeAction(eventId, userId, matricula, data);
}

export async function adminAddAttendeeAction(eventId: string, matricula: string, idToken: string) {
  return Booking.adminAddAttendeeAction(eventId, matricula, idToken);
}

export async function generateEventSummarySheetAction(eventId: string, adminToken: string) {
  return PostEvent.generateEventSummarySheetAction(eventId, adminToken);
}

// `updateGlobalProgramacaoRegistryAction` NAO e reexportada aqui de proposito.
//
// Ela reescreve o registro global `Datas_Center/Programacao_Registry` — a mesma
// capacidade que o BUG-024 removeu quando estava exposta como rota
// `/api/trigger-sync`, e que seguia alcancavel por este dispatcher (BUG-102).
// Nenhuma tela a chamava: os consumidores legitimos (o cron das 03h em `sync.ts`,
// o funil de lead publico em `booking.ts` e o proprio `post-event.ts`) importam
// direto de `./calendar-module/post-event`, sem passar pela rede. Guardar a
// funcao no lugar quebraria o cron e o funil, que nao tem sessao — entao a
// correcao e tirar a porta, nao trancar a sala (Protocolo item 8).

export async function healProgramacaoMasterAction(idToken: string) {
  return PostEvent.healProgramacaoMasterAction(idToken);
}

export async function rescheduleAttendeeAction(oldEventId: string, newEventId: string, userUid: string, idToken?: string) {
  return Booking.rescheduleAttendeeAction(oldEventId, newEventId, userUid, idToken);
}

export async function baixarEventoAction(eventId: string, idToken: string) {
  return PostEvent.baixarEventoAction(eventId, idToken);
}
