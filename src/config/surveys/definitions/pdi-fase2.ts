import { SurveyConfig } from "@/types/survey";
import { PDI_COMBUSTIVEIS, PDI_FREIOS } from "./pdi-constants";

export const pdiFase2Survey: SurveyConfig = {
  id: "survey_pdi_fase2",
  kind: "survey",
  title: "PDI - Fase 2: Seleção de recursos e habilidades",
  description: "Análise de Potencial e Riscos",
  submitLabel: "Avançar para a Fase 3",
  analytics: {
    surveyId: "survey_pdi_fase2",
    domain: "SURVEY",
    context: "CAREER_PDI",
    tags: ["carreira", "pdi", "fase2"]
  },
  policy: {
    editable: true,
    allowReset: false
  },
  steps: [
    {
      id: "step_intro_fase2",
      question: "PDI - Fase 2: Seleção de recursos e habilidades",
      description: "Ninguém alcança um objetivo usando apenas os pontos fortes, e ninguém fracassa apenas pelos pontos fracos.\n\nAs forças para o sucesso são a perspectiva e a gestão das incongruências. Nesta etapa, você mapeará quais dos seus recursos atuais serão combustíveis para o seu \"motor\" (te ajudarão a acelerar), e quais poderão criar barreiras (te frear).",
      nextLabel: "Avançar",
      fields: []
    },
    {
      id: "step_q1_combustiveis",
      question: "Pergunta 1: Quais \"combustíveis\" você utilizará?",
      description: "Da lista abaixo, selecione os **2** aspectos que você acredita que serão os seus maiores ACELERADORES para te sustentar, motivar e manter engajado e focado durante a sua jornada, principalmente diante de situações desafiadoras.",
      nextLabel: "Avançar",
      fields: [
        {
          id: "combustiveis_selecionados",
          type: "multi_select",
          isMultiple: true,
          validation: {
            minSelections: 2,
            maxSelections: 2
          },
          options: [...PDI_COMBUSTIVEIS, "Outro, qual?"],
          required: true
        },
        {
          id: "combustivel_outro",
          type: "text",
          label: "Se selecionou 'Outro', especifique qual:",
          required: false
        }
      ]
    },
    {
      id: "step_q2_barreiras",
      question: "Pergunta 2: Quais atitudes podem gerar ou intensificar \"barreiras\"?",
      description: "Em toda jornada há incongruências (atritos, conflitos, hesitações, dúvidas, confusão). Elas são como freios para nossa proteção, mas quando acionadas bruscamente ou com muita frequência, o carro não anda ou pode causar um acidente.\n\nDa lista abaixo, selecione os **2** aspectos que você acredita que têm o maior potencial para FREAR, atrapalhar ou te fazer desistir no meio do caminho.",
      nextLabel: "Avançar",
      fields: [
        {
          id: "barreiras_selecionadas",
          type: "multi_select",
          isMultiple: true,
          validation: {
            minSelections: 2,
            maxSelections: 2
          },
          options: [...PDI_FREIOS, "Outro, qual?"],
          required: true
        },
        {
          id: "barreira_outro",
          type: "text",
          label: "Se selecionou 'Outro', especifique qual:",
          required: false
        }
      ]
    },
    {
      id: "step_q3_escuridao",
      question: "Pergunta 3: A Escuridão (O Pior Cenário)",
      description: "Para este próximo exercício, precisamos de uma experiência sensorial. Desligue a luz do ambiente em que você está neste exato momento.",
      fields: [
        {
          id: "status_luz",
          type: "choice",
          options: [
            { label: "Luz Desligada", value: "Luz Desligada" },
            { label: "Não é possível desligar agora", value: "Não é possível desligar agora" }
          ],
          logic: {
            "Luz Desligada": "step_q4_reflexao",
            "Não é possível desligar agora": "step_q4_nao_possivel"
          },
          required: true
        }
      ]
    },
    {
      id: "step_q4_nao_possivel",
      question: "Não se preocupe.",
      description: "Como não é possível alterar a iluminação do seu ambiente agora, apenas feche os olhos por alguns instantes, observe se ainda está claro ou ficou totalmente escuro, e foque totalmente na analogia a seguir.",
      nextStepId: "step_q4_reflexao",
      nextLabel: "Avançar",
      fields: []
    },
    {
      id: "step_q4_reflexao",
      question: "Pergunta 4: O dia seguinte",
      description: "Neste momento você está no escuro (ou mentalmente no escuro). Esse escuro representa que o seu plano de carreira deu totalmente errado. Você se esforçou, deu o seu melhor, mas as barreiras que mapeamos {{barreiras_selecionadas}} te venceram.\n\nQual é a pior coisa que poderia acontecer na sua vida profissional e financeira? Não ter o que comer? Não ter o que vestir? Perder o imóvel? O veículo? Ter má reputação no mercado? Ficar ultrapassado demais?\n\nE apesar dessa pior coisa ter acontecido, o que você poderia fazer no dia seguinte para sobreviver e recomeçar?",
      nextLabel: "Avançar",
      fields: [
        {
          id: "pior_cenario_recomeco",
          type: "textarea",
          label: "O Plano de Contingência",
          placeholder: "A pior coisa seria... Mas no dia seguinte, para sobreviver, eu...",
          required: true
        }
      ]
    },
    {
      id: "step_q5_inegociaveis",
      question: "Pergunta 5: Os seus inegociáveis",
      description: "{{User_Nickname}}, sabemos que imaginar o que de pior pode acontecer é uma tarefa difícil e pouco confortável, mas a tarefa foi cumprida. Parabéns!\n\nAssim como as situações desconfortáveis passam, a motivação e a inspiração também passam. O que permanece é a disciplina. Para garantir que os seus motores {{combustiveis_selecionados}} continuem funcionando e as barreiras {{barreiras_selecionadas}} não te paralisem, defina **3 regras inegociáveis** que você cumprirá todos os dias, faça chuva ou faça sol (ou acabe a luz ou pegue fogo), para manter o foco e o ritmo rumo ao seu objetivo.\n\n(Exemplo: \"Falar não, mesmo que me doa\"; \"Não olhar o WhatsApp até as 10h\"; \"Fazer 2 contatos de prospecção por dia\"; \"Sair do trabalho exatamente às 18h\").",
      nextLabel: "Avançar",
      fields: [
        {
          id: "regra_inegociavel_1",
          type: "text",
          label: "Regra 1",
          placeholder: "Ex: Não olhar o WhatsApp até as 10h",
          required: true
        },
        {
          id: "regra_inegociavel_2",
          type: "text",
          label: "Regra 2",
          placeholder: "Ex: Sair do trabalho exatamente às 18h",
          required: true
        },
        {
          id: "regra_inegociavel_3",
          type: "text",
          label: "Regra 3",
          placeholder: "Ex: Fazer 2 contatos de prospecção por dia",
          required: true
        }
      ]
    },
    {
      id: "step_fechamento_fase2",
      question: "Bagagem organizada, {{User_Nickname}}!",
      description: "O seu cérebro adora a previsibilidade, porque assim ele fica atento para agir e também consegue relaxar.\n\nAgora que você já previu quais poderão ser as principais barreiras e sabe exatamente os combustíveis que mais funcionarão no percurso, o caminho já não é tão desconhecido. A ação está apenas aguardando você apertar o play e começar a viver esse plano.\n\nMas antes, vamos transformar tudo isso em um Plano de Execução e convocar a sua rede de apoio!",
      fields: []
    }
  ]
};
