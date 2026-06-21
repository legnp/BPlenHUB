/**
 * BPlen HUB — Step Journey Configuration Types 🧬🛡️
 * Strict typing for the 6-stage member journey.
 */

export type StepStatus = "locked" | "available" | "current" | "completed";

export type ContentType = 
  | "survey"      // SurveyEngine (Multi-step forms with TypedText)
  | "form"        // Simple Forms (Data collection)
  | "result"      // Results Visualization (DISC, Triad, etc)
  | "content"     // Informative Cards / Videos
  | "meeting"     // Schedule/Join 1-to-1 or group sessions
  | "upload"      // Document submission
  | "feedback";   // Event feedback / Post-session notes

export interface SubStepConfig {
  id: string;
  title: string;
  type: ContentType;
  referenceId: string; // The ID of the survey, form, or document being referenced
  description?: string;
  allowReview?: boolean; // Se verdadeiro, exibe o botão de revisão após conclusão
}

import { WorkflowStep } from "./products";

export interface JourneyStep {
  id: string;
  order: number;
  title: string;
  subtitle?: string;
  icon: string; // Lucide icon name
  description: string;
  substeps: SubStepConfig[];
  
  // Rules
  isOptional?: boolean;
  unlockRequirement?: string; // ID of the previous step that must be completed
  isLocked?: boolean;

  kicker?: string;
  workflow?: WorkflowStep[];
}

export interface UserStepProgress {
  stepId: string;
  status: StepStatus;
  completedSubSteps: string[];
  subStepCompletionDates?: Record<string, string>; // Mapeamento do subStepId para a data de conclusão
  currentSubStepId?: string;
  startedAt?: string;
  completedAt?: string;
  updatedAt?: string;
}

export interface JourneyProgress {
  matricula: string;
  lastActiveStepId: string;
  steps: Record<string, UserStepProgress>;
  overallProgress: number; // 0-100
}
