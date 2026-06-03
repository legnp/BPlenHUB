/**
 * BPlen HUB — Calendar Types 📅
 */

export type EventLifecycleStatus = "scheduled" | "completed" | "cancelled" | "postponed";
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
  theme?: string;
  status?: string;

  // Post-event Fields
  lifecycleStatus?: EventLifecycleStatus;
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

export interface UserBooking {
  id: string;
  eventId: string;
  userId: string;
  week: number;
  year: number;
  category?: string;
  timestamp: string | null;
  rating: number;
  feedback: string;
  evaluatedAt?: string | null;
  eventDetail: GoogleCalendarEvent | null;

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
}
