import { SurveyConfig } from "@/types/survey";

export const planoAcordosSurvey: SurveyConfig = {
  id: "survey_plano_acordos",
  kind: "survey",
  title: "Plano de Carreira: Acordos de Convivência",
  description: "Avisos e Acordos para o Plano de Carreira",
  submitLabel: "Acordos Firmados! Iniciar Plano",
  analytics: {
    surveyId: "survey_plano_acordos",
    domain: "SURVEY",
    context: "CAREER_PLAN",
    tags: ["carreira", "acordos"]
  },
  policy: {
    editable: true,
    allowReset: false
  },
  steps: [
    {
      id: "step_avisos_intro",
      question: "Olá, {{User_Nickname}}! A partir desta etapa, a necessidade da sua entrega total durante o processo ficará muito mais intensa.",
      description: "Daqui em diante, tudo o que você viverá e responderá é o que vai te impulsionar do seu estado atual para onde você quer chegar. Algumas ações e reflexões podem parecer genéricas demais, passar a sensação de \"já conheço essa pergunta\", ou pelo contrário, parecer \"coisa de criança\" ou \"muito difícil de entender\". Aqui é onde você precisará deixar o seu julgamento de lado. Leia, ouça e analise cada pergunta, respondendo-as da forma mais honesta e completa possível.",
      nextLabel: "Ciente, vamos aos acordos",
      fields: [
        {
          id: "info_apoio_lis",
          type: "info",
          label: "Sua Rede de Apoio: Caso não consiga executar alguma ação por qualquer motivo, você tem autorização imediata para acionar a Lis e pedir 8 minutos de atenção. Basta ligar ou mandar mensagem no WhatsApp: +55 11 94515 2088."
        }
      ]
    },
    {
      id: "step_acordo_1",
      question: "Acordo 1 de 3: Compromisso com a Mudança",
      nextLabel: "Avançar",
      fields: [
        {
          id: "agree_mudanca",
          type: "choice",
          label: "Você concorda em estruturar um Plano de Carreira que exigirá que você tome novas atitudes para te impulsionar rumo ao seu objetivo?",
          options: ["Sim, eu concordo"],
          required: true
        }
      ]
    },
    {
      id: "step_acordo_2",
      question: "Acordo 2 de 3: Suspensão de Julgamentos",
      nextLabel: "Avançar",
      fields: [
        {
          id: "agree_julgamento",
          type: "choice",
          label: "Você concorda em se dedicar para diminuir o seu julgamento (a voz interna que critica ou desvaloriza o processo) durante toda a sua jornada?",
          options: ["Sim, eu concordo"],
          required: true
        }
      ]
    },
    {
      id: "step_acordo_3",
      question: "Acordo 3 de 3: Pedido de Ajuda",
      fields: [
        {
          id: "agree_ajuda",
          type: "choice",
          label: "Você concorda em acionar a Lis e pedir ajuda quando não conseguir, não puder ou não quiser executar alguma ação proposta?",
          options: ["Sim, eu concordo"],
          required: true
        }
      ]
    }
  ]
};
