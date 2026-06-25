import { SurveyConfig } from "@/types/survey";

export const pdiFase1Survey: SurveyConfig = {
  id: "survey_pdi_fase1",
  kind: "survey",
  title: "Definição de Objetivos",
  description: "Definição de objetivos de carreira profissional",
  submitLabel: "Salvar e Avançar",
  analytics: {
    surveyId: "survey_pdi_fase1",
    domain: "SURVEY",
    context: "CAREER_PDI",
    tags: ["carreira", "pdi", "fase1"]
  },
  policy: {
    editable: true,
    allowReset: false
  },
  steps: [
    {
      id: "step_intro_pdi_fase1",
      question: "Olá {{User_Nickname}}!",
      description: "Vamos iniciar o seu Plano de Desenvolvimento Individual?",
      nextLabel: "Estou pronto, prosseguir",
      fields: [
        {
          id: "info_tempo_fase1",
          type: "info",
          label: "Atenção: Reserve de 20 a 30 minutos em um ambiente tranquilo para prosseguir. Os dados preenchidos ficam salvos somente com a conclusão total. Caso precise fechar a página durante o processo, ele será reiniciado."
        }
      ]
    },
    {
      id: "step_acordos_pdi_fase1",
      question: "{{User_Nickname}}, muito bem, vamos lá!",
      description: "Daqui em diante, tudo o que você ler e responder tem um único objetivo: impulsionar você do seu estado atual para onde você quer chegar.\n\nNão subestime o poder de escrever as coisas! Essa simples ação ajuda a clarear os pensamentos, validar se o que você pensa faz sentido, além de servir como um documento do que você precisa fazer. Combinado?",
      nextLabel: "Combinado, vamos lá!",
      fields: []
    },
    {
      id: "step_objetivo_pdi",
      question: "Definição de Objetivos",
      description: "Vamos começar pelo fim! Onde é que você quer chegar? \nSeja específico! E não tenha medo de ser ambicioso.",
      nextLabel: "Avançar",
      fields: [
        {
          id: "objetivo_frase",
          type: "text",
          label: "Escreva em 1 frase curta, direta e objetiva, qual é a sua principal meta profissional para os próximos anos.",
          placeholder: "Ex: \"Me tornar Gerente de Produto\", \"Mudar para a área de Tecnologia\"",
          required: true
        },
        {
          id: "objetivo_detalhes",
          type: "textarea",
          label: "Agora detalhe o que essa frase significa pra você na prática e por que você quer atingi-la.",
          placeholder: "Para mim isso significa...",
          required: true
        }
      ]
    }
  ]
};
