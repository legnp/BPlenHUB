import type { FieldValue, Timestamp } from "firebase/firestore";
import { EntityKind } from "./intake";

/**
 * BPlen HUB — Survey Strategy Types
 * Contratos técnicos para o motor de experiência narrativa e analítica.
 */

export type UserType = "PF" | "PJ";
export type SurveyStatus = "draft" | "completed" | "archived";

export interface SurveyAnalyticsMeta {
  surveyId: string;
  version?: string;
  context?: string;
  tags?: string[];
  domain?: string; // e.g. CONTEUDO, PRODUTO
  durationSeconds?: number;
}

export interface SurveyEditPolicy {
  editable: boolean;
  allowReset?: boolean;
  expiresAt?: string;
}

export interface WelcomeSurveyData {
  uid: string;
  email: string;
  Authentication_Name: string;
  User_Nickname: string;
  User_Type: UserType;
  Customer_FirstTopics: string[];
  Customer_FirstDemand: string;
  Customer_Origin: string;
  submittedAt?: string;
}

export interface SurveyStep {
  id: string;
  question: string;
  content: React.ReactNode;
  canProgress: boolean;
}

// Novos Contratos Institucionais

export interface SurveyFieldConfig {
  id: string;
  type: "choice" | "text" | "textarea" | "scale" | "info" | "buttons" | "multi_select" | "cascaded" | "benefits" | "currency_group" | "likert" | "ranking" | "likert_group" | "file" | "evidence_upload" | "portal_link" | "date" | "slider" | "calendar_embed" | "image" | "dynamic_list";
  subFields?: SurveyFieldConfig[]; // Utilizado pelo tipo dynamic_list para renderizar as linhas de loop
  label?: string;
  placeholder?: string;
  options?: string[] | { label: string; value: string; subOptions?: string[] }[]; 
  required?: boolean;
  autoFocus?: boolean;
  min?: number; 
  max?: number; 
  isMultiple?: boolean; 
  logic?: Record<string, string>; // Mapeamento de valor -> ID do próximo passo
  secondaryLabel?: string; // Rótulo para o segundo nível de campos cascateados
  validation?: {
    minSelections?: number;
    maxSelections?: number;
    pattern?: string;
  };
  cols?: 1 | 2 | 3 | 4;
  randomize?: boolean; // Se as opções devem ser exibidas em ordem aleatória
  imageUrl?: string; // URL da imagem para o campo do tipo "image"
  filterSummary?: string; // Filtro opcional de summary de compromissos para calendar_embed
  scaleLabels?: string[]; // Legendas customizadas para campos do tipo scale (escala de 1 a 5)
  excludeIfSelectedIn?: string; // ID de outro campo do qual este deve excluir opções selecionadas
  dependsOn?: string; // ID de outro campo que deve estar preenchido para este aparecer
  column?: "left" | "right"; // Em layout split-columns, define em qual coluna o campo fica
}

export interface SurveyStepConfig {
  id: string;
  question: string;
  description?: string;
  nextStepId?: string; // Força salto direto para um ID específico
  nextLabel?: string; // Rótulo customizado para o botão de avançar (ex: "De acordo", "Iniciar")
  layout?: "default" | "split-columns";
  fields: SurveyFieldConfig[];
}

export interface SurveyConfig {
  id: string;
  kind: Extract<EntityKind, "survey">;
  title: string;
  description?: string;
  steps: SurveyStepConfig[];
  analytics: SurveyAnalyticsMeta;
  policy: SurveyEditPolicy;
  submitLabel?: string;
  completionMessage?: string; // Mensagem final exibida ao fechar a pesquisa
  templateData?: Record<string, string>; // Dados para interpolação nas perguntas
}

export type SurveyValue = string | string[] | number | boolean | null | Record<string, unknown> | Record<string, unknown>[];

export interface SurveyResponse {
  surveyId: string;
  matricula: string;
  status: SurveyStatus;
  data: Record<string, SurveyValue>;
  submittedAt: FieldValue | Timestamp | Date | null;
  metadata: SurveyAnalyticsMeta;
}
