import { JourneyStep, SubStepConfig } from "@/types/journey";

/**
 * BPlen HUB — Step Journey Registry 🧬
 * Configuração centralizada das 6 etapas da jornada do membro.
 * Segue rigorosamente os tipos definidos em src/types/journey.ts
 */

export const JOURNEY_STAGES: JourneyStep[] = [
  {
    id: "onboarding",
    order: 1,
    title: "Onboarding",
    description: "Inicie sua jornada conhecendo o ecossistema BPlen.",
    icon: "Rocket",
    substeps: [
      { 
        id: "introducao", 
        title: "Introdução", 
        type: "content", 
        referenceId: "welcome_video_01",
        description: "Conheça a visão da BPlen" 
      },
      { 
        id: "check_in_survey", 
        title: "Check-in", 
        type: "survey", 
        referenceId: "check_in",
        description: "Demandas e estado atual da jornada" 
      },
      { 
        id: "sessao_onboarding", 
        title: "Sessão de Onboarding", 
        type: "meeting", 
        referenceId: "onboarding",
        description: "Agende sua sessão individual de boas-vindas com nossos orientadores." 
      }
    ],
  },
  {
    id: "preparacao-de-carreira",
    order: 2,
    title: "Preparação de Carreira",
    description: "Alinhamento de expectativas e bases da sua evolução.",
    icon: "Milestone",
    substeps: [],
  },
  {
    id: "analise-comportamental",
    order: 3,
    title: "Análise Comportamental",
    description: "Desenvolva autoconhecimento profundo através do DISC.",
    icon: "UserCheck",
    substeps: [],
  },
  {
    id: "plano-de-carreira",
    order: 4,
    title: "Plano de Carreira",
    description: "Defina seu norte estratégico e objetivos de longo prazo.",
    icon: "Map",
    substeps: [],
  },
  {
    id: "desenvolvimento-de-carreira",
    order: 5,
    title: "Desenvolvimento de Carreira",
    description: "Aceleração de competências e execução do plano.",
    icon: "TrendingUp",
    substeps: [],
  },
  {
    id: "coaching-e-mentoria",
    order: 6,
    title: "Coaching e Mentoria",
    description: "Acompanhamento especializado para alta performance.",
    icon: "Award",
    substeps: [],
  },
  {
    id: "offboarding",
    order: 7,
    title: "Offboarding",
    description: "Consolidação de resultados e encerramento de ciclo.",
    icon: "DoorOpen",
    substeps: [],
  },
];
