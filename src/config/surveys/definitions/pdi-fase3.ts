import { SurveyConfig } from "@/types/survey";

export const pdiFase3Survey: SurveyConfig = {
  id: "survey_pdi_fase3",
  kind: "survey",
  title: "Definição de metas e ciclos",
  description: "Definição de metas de curto prazo e ciclos",
  submitLabel: "Salvar e Avançar",
  analytics: {
    surveyId: "survey_pdi_fase3",
    domain: "SURVEY",
    context: "CAREER_PDI",
    tags: ["carreira", "pdi", "fase3"]
  },
  policy: {
    editable: true,
    allowReset: false
  },
  steps: [
    {
      id: "step_intro_fase3",
      question: "Definição de metas e ciclos",
      description: "Na fase anterior falamos de consistência diária (as regras inegociáveis). Nesta etapa, vamos definir metas de curto prazo e ciclos de revisão para garantir que o seu plano não seja apenas um documento guardado na gaveta.",
      nextLabel: "Avançar",
      fields: []
    },
    {
      id: "step_q1_mini_meta",
      question: "Defina a sua Primeira Mini Meta",
      description: "O que você fará nos próximos 7 dias que te deixará mais próximo(a) do seu objetivo final? (Dica: pense em algo palpável, como \"atualizar o meu currículo e enviar para 5 empresas\", \"fazer a inscrição no curso XYZ\", \"conversar com 3 pessoas da área\").",
      nextLabel: "Avançar",
      fields: [
        {
          id: "mini_meta_7_dias",
          type: "text",
          label: "Mini Meta de 7 dias",
          placeholder: "Ex: Atualizar meu currículo e enviar para 5 empresas",
          required: true
        }
      ]
    },
    {
      id: "step_q2_ciclo_revisao",
      question: "Ciclo de Revisão",
      description: "Qual o melhor dia e horário para você reservar 30 minutos, toda semana, para revisar as suas mini metas e definir as próximas? (Exemplo: \"Todo domingo, às 10h da manhã\", \"Toda sexta-feira, logo após o expediente\").",
      nextLabel: "Avançar",
      fields: [
        {
          id: "ciclo_revisao",
          type: "text",
          label: "Dia e horário para revisão semanal",
          placeholder: "Ex: Todo domingo, às 10h da manhã",
          required: true
        }
      ]
    },
    {
      id: "step_q3_rede_apoio",
      question: "Quem fará parte da sua Rede de Apoio?",
      description: "Em uma jornada desafiadora, compartilhar os seus objetivos com pessoas de confiança pode fazer toda a diferença. Liste abaixo o nome de até 3 pessoas que você sabe que poderá contar caso pense em desistir ou precise de um incentivo. (Exemplo: \"Minha mãe\", \"Meu amigo Roberto da faculdade\").",
      nextLabel: "Avançar",
      fields: [
        {
          id: "rede_apoio",
          type: "text",
          label: "Sua Rede de Apoio (Até 3 pessoas)",
          placeholder: "Ex: Minha mãe, Meu amigo Roberto",
          required: true
        }
      ]
    },
    {
      id: "step_q4_mensagem_blindagem",
      question: "Mensagem de Blindagem",
      description: "O que você precisa ler ou lembrar nos momentos mais difíceis para não desistir? Escreva uma frase, um lema ou um conselho que a sua Rede de Apoio te daria, e que servirá como um lembrete para você não desviar do foco. (Exemplo: \"Você já superou coisas mais difíceis\", \"Lembre-se do motivo pelo qual você começou\", \"O esforço de hoje é o resultado de amanhã\").",
      nextLabel: "Avançar",
      fields: [
        {
          id: "mensagem_blindagem",
          type: "text",
          label: "Mensagem de Blindagem",
          placeholder: "Ex: O esforço de hoje é o resultado de amanhã",
          required: true
        }
      ]
    }
  ]
};
