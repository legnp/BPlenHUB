/**
 * BPlen HUB — Product Engine Types 🧬
 * Estrutura de dados para o sistema dinâmico de produtos e serviços.
 */

export interface ProductSheet {
  description: string;
  coverImage: string;
  paymentConditions: string;
  faq: { question: string; answer: string }[];
  termsAndConditions: string;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  deliverables?: string[]; // Lista de entregáveis do serviço
}

export interface CapabilityConfig {
  surveys: string[]; // IDs das pesquisas (SURVEY_REGISTRY)
  forms: string[];   // IDs dos formulários operacionais
  allowedEventTypes: string[]; // IDs de tipos de eventos do calendário
}

export interface WorkflowStep {
  id: string;
  title: string;
  type: 'milestone' | 'task';
  description: string;
  requiredSubStepId?: string; // Dependência
}

export interface Product {
  id: string;
  slug: string; // URL amigável
  serviceCode: string; // Ex: BPL-001 imutável
  title: string;
  kicker?: string; // Frase de destaque opcional
  targetAudiences: ('people' | 'companies' | 'partners' | 'internal')[];
  price: number;
  
  // Flag para Jornada do Membro
  isStepJourney: boolean;
  order?: number; // Ordem na jornada (1 a 6)

  sheet: ProductSheet;
  capabilities: CapabilityConfig;
  workflow: WorkflowStep[];

  // Configurações de Governança no Drive 📂
  driveConfig?: {
    folderId: string;
    sheetId: string;
    sheetUrl: string;
  };

  // Cotas de Serviço (Destaque para Agendamentos)
  grantedQuotas: Record<string, number>; // Tipo de Evento -> Quantidade Inclusa

  status: 'draft' | 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}
