import { SurveyConfig } from "@/types/survey";

export const agendamentoDevolutivaSurvey: SurveyConfig = {
  id: "survey_agendamento_devolutiva",
  kind: "survey",
  title: "Plano de Carreira: Agendamento da Devolutiva",
  description: "Checkpoint 6 — Agendamento da Devolutiva",
  submitLabel: "Concluir Jornada",
  analytics: {
    surveyId: "survey_agendamento_devolutiva",
    domain: "SURVEY",
    context: "CAREER_PLAN",
    tags: ["carreira", "agendamento"]
  },
  policy: {
    editable: true,
    allowReset: false
  },
  steps: [
    {
      id: "step_preparacao_agendamento",
      question: "Olá, {{User_Nickname}}! Bora agendar a sua Devolutiva do Plano de Carreira?",
      description: "Para que o nosso encontro seja uma experiência completa e transformadora, você precisará ter em mãos alguns itens. Prepare-os com antecedência e traga-os para a nossa reunião:\n\n- A sua Carta Lacrada (do Kit BPlen);\n- 1 Limão cortado ao meio (sim, um limão real. Confie no processo!);\n- Uma caneta e um papel para anotações.",
      nextLabel: "Ir para o Calendário",
      fields: [
        {
          id: "check_ciente_itens",
          type: "choice",
          label: "Confirmação de Preparo",
          options: ["Ciente! Estou com os itens anotados e providenciarei."],
          required: true
        }
      ]
    },
    {
      id: "step_calendario",
      question: "Escolha o melhor horário",
      description: "Selecione abaixo a data e horário para a sua Devolutiva da Análise do Plano.",
      nextLabel: "Confirmar Agendamento",
      fields: [
        {
          id: "calendario_devolutiva",
          type: "calendar_embed",
          required: true
        }
      ]
    },
    {
      id: "step_confirmacao_agendamento",
      question: "Reunião Agendada com Sucesso!",
      description: "{{User_Nickname}}, o seu horário está reservado. Nos vemos no dia {{Data_Agendamento}} às {{Horario_Agendamento}}.\n\nPara não esquecer, tire um print ou anote o seu checklist para o nosso encontro:\n\n[ ] Carta Lacrada\n[ ] Limão cortado ao meio\n[ ] Papel e caneta\n\nAté lá!",
      fields: []
    }
  ]
};
