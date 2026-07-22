/**
 * BPlen HUB — Calendar Types 📅
 */

export type EventLifecycleStatus = "scheduled" | "completed" | "cancelled" | "postponed" | "baixado";
export type AttendanceStatus = "pending" | "present" | "absent";

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  htmlLink: string;
  meetingLink?: string;
  totalCapacity?: number;
  registeredCount?: number;
  mentor?: string;
  theme?: string | null;
  status?: string;
  /**
   * Identificador do tipo de evento (`1-to-1` / `consultoria-individual` /
   * `consultoria-em-grupo`), classificado no sync pelo `googleTitle`
   * (Etapa 3.1, ver `types/calendar-event-types.ts`). `null` = titulo sem tipo
   * casado. Usado pela trava de cota 1:1 (BUG-013) via `isOneToOneEvent`.
   */
  tipoId?: string | null;

  // Post-event Fields
  lifecycleStatus?: EventLifecycleStatus | null;
  postEventCompleted?: boolean;
  internalGeneralComment?: string;
  publicGeneralComment?: string;
  meetingMinutesFile?: { url: string; fileId: string; fileName: string; uploadedAt: string } | null;
  postponedFromEventId?: string | null;
  postEventUpdatedAt?: string | null;
  postEventUpdatedBy?: string;
  lastSync?: string | null;
  
  // Administrative Summary Sheet
  summarySheetUrl?: string;
  summarySheetId?: string;
  eventFolderUrl?: string;
  summarySheetUpdatedAt?: string | null;
  slug?: string;

  // Real-time Aggregated Metrics
  metrics?: {
    presenceCount: number;
    npsAvg: number;
    reviewsCount: number;
  };
}

/**
 * Snapshot leve de um evento para o Datas_Center/Programacao_Registry,
 * consumido por dashboards de membro e admin sem precisar ler Calendar_Events inteiro.
 */
export interface ProgramacaoEntry {
  id: string;
  summary: string;
  start: string;
  end: string;
  mentor: string;
  theme: string | null;
  statusLabel: "futuro" | "pendente" | "concluido" | "baixado";
  folderUrl: string | null;
  htmlLink: string;
  meetingLink: string;
  location: string;
  registeredCount: number;
  totalCapacity: number;
  metrics: { presenceCount: number; npsAvg: number; reviewsCount: number };
  postEventCompleted: boolean;
  lifecycleStatus: EventLifecycleStatus | null;
  internalGeneralComment: string;
  publicGeneralComment: string;
  meetingMinutesFile: { url: string; fileId: string; fileName: string; uploadedAt: string } | null;
}

export interface UserBooking {
  id: string;
  eventId: string;
  userId: string;
  week: number;
  year: number;
  category?: string;
  /**
   * Nome do evento gravado no ato do agendamento — usado pelo limite semanal
   * por TIPO de sessão. Denormalizado de propósito: `category` só distingue
   * "1to1" de "geral" (grosseiro demais) e o join com `eventDetail` some se o
   * evento sair de `Calendar_Events`. Ausente em agendamentos legados, que caem
   * no fallback do `eventDetail.summary`.
   */
  eventSummary?: string;
  timestamp: string | null;
  rating: number;
  feedback: string;
  evaluatedAt?: string | null;
  eventDetail: GoogleCalendarEvent | null;
  /** Cancelado dentro das 24h que preservam o crédito (ver política de agendamento). */
  lateCancellation?: boolean;

  // Mirrored Post-event Fields
  eventLifecycleStatus?: EventLifecycleStatus;
  attendanceStatus?: AttendanceStatus;
  publicGeneralComment?: string;
  meetingMinutesFile?: { url: string; fileId: string; fileName: string; uploadedAt: string } | null;
  participantFeedback?: string;
  participantTasks?: string;
  participantDocs?: Array<{ url: string; fileId: string; fileName: string; uploadedAt: string }>;

  // 1-to-1 Demand Data
  oneToOneData?: { type: string; expectations: string } | null;
}

export interface AttendeeData {
  userId: string;
  matricula: string;
  nickname: string;
  email: string;
  phone?: string | null;
  isLead: boolean;
  timestamp: string | null;
  
  // Post-event fields
  attendanceStatus?: AttendanceStatus;
  participantFeedback?: string;
  participantTasks?: string;
  participantDocs?: Array<{ url: string; fileId: string; fileName: string; uploadedAt: string }>;
  attendanceCheckedAt?: string | null;
  attendanceCheckedBy?: string;

  // 1 to 1 data
  type?: string;
  expectations?: string;

  /**
   * Marca a reserva que debitou 1 credito da cota 1:1 (BUG-013). So reservas com
   * esta flag estornam no cancelamento em tempo habil; preservada no reagendamento
   * (spread da reserva). Ausente/false = nao consumiu (reserva anterior a trava,
   * lead publico, ou tipo que nao e 1:1).
   */
  quotaConsumed?: boolean;
}
