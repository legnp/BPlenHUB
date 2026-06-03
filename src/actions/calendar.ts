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

export async function closeEventAction(eventId: string, data: any) {
  return PostEvent.closeEventAction(eventId, data);
}

export async function closeAttendeeAction(eventId: string, userId: string, matricula: string, data: any) {
  return PostEvent.closeAttendeeAction(eventId, userId, matricula, data);
}

export async function adminAddAttendeeAction(eventId: string, matricula: string, idToken: string) {
  return PostEvent.adminAddAttendeeAction(eventId, matricula, idToken);
}

export async function generateEventSummarySheetAction(eventId: string, adminToken: string) {
  return PostEvent.generateEventSummarySheetAction(eventId, adminToken);
}

export async function updateGlobalProgramacaoRegistryAction() {
  return PostEvent.updateGlobalProgramacaoRegistryAction();
}

export async function healProgramacaoMasterAction(idToken: string) {
  return PostEvent.healProgramacaoMasterAction(idToken);
}

export async function rescheduleAttendeeAction(oldEventId: string, newEventId: string, userUid: string, idToken?: string) {
  return Booking.rescheduleAttendeeAction(oldEventId, newEventId, userUid, idToken);
}
