/**
 * BPlen HUB — Career Management Types 🧬🛡️
 * Strict typing for backlog tasks, meeting minutes (atas), feedbacks, shared documents, and strategic goals.
 */

export type CareerTaskStatus = 
  | "Backlog" 
  | "Sprint atual" 
  | "Próxima Sprint" 
  | "Pausada" 
  | "Cancelada" 
  | "Concluída";

export interface CareerTaskComment {
  id: string;
  text: string;
  author: "user" | "admin";
  createdAt: string; // ISO String
}

export interface CareerTaskHistory {
  status: CareerTaskStatus;
  changedAt: string; // ISO String
}

export interface CareerTask {
  id: string;
  title: string;
  status: CareerTaskStatus;
  createdAt: string; // ISO String
  statusHistory: CareerTaskHistory[];
  comments: CareerTaskComment[];
}

export interface CareerFeedback {
  id: string;
  title: string;
  content: string; // Markdown or Rich Text
  author: string;  // Admin/Consultor Name
  createdAt: string; // ISO String
}

export interface CareerAta {
  id: string;
  title: string;
  meetingDate: string; // YYYY-MM-DD
  fileUrl: string; // Google Drive link
  contentSummary?: string;
  createdAt: string; // ISO String
}

export interface CareerSharedDocument {
  id: string;
  title: string;
  fileUrl: string; // Google Drive link
  fileName: string;
  category: "Plano de Carreira" | "Relatório" | "Outros";
  createdAt: string; // ISO String
}

export interface CareerGoal {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string; // Ex: "%", "Cursos", "Artigos"
  completed: boolean;
}

export interface CareerObjective {
  id: string;
  title: string;
  description?: string;
  status: "Não Iniciado" | "Em Andamento" | "Alcançado" | "Pausado";
  targetDate?: string; // YYYY-MM-DD
  goals: CareerGoal[];
  createdAt: string; // ISO String
  completedAt?: string; // ISO String — gravado quando o status entra em "Alcançado" (item 9)
}
