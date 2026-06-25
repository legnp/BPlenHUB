import { SurveyConfig } from "@/types/survey";
import { PDI_COMBUSTIVEIS, PDI_FREIOS } from "./pdi-constants";

export const pdiFase2Survey: SurveyConfig = {
  id: "survey_pdi_fase2",
  kind: "survey",
  title: "Seleção de recursos e habilidades",
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
      question: "Seleção de recursos e habilidades",
      description: "Ninguém alcança um objetivo usando apenas os pontos fortes, e ninguém fracassa apenas pelos pontos fracos.\n\nAs forças para o sucesso são a perspectiva e a gestão das incongruências. Nesta etapa, você mapeará quais dos seus recursos atuais serão combustíveis para o seu \"motor\" (te ajudarão a acelerar), e quais poderão criar barreiras (te frear).",
      nextLabel: "Avançar",
      fields: []
    },
    {
      id: "step_q1_combustiveis_freios",
      question: "Seleção de combustíveis e freios",
      description: "Da lista abaixo, selecione os **2** aspectos que você acredita que serão os seus maiores ACELERADORES e os **2** que serão seus maiores FREIOS.",
      nextLabel: "Avançar",
      layout: "split-columns", // Sinalizador para o SurveyEngine renderizar em 2 colunas (Esq: Combustíveis / Dir: Freios)
      fields: [
        {
          id: "combustivel_1",
          type: "choice",
          label: "Combustível 1",
          options: [...PDI_COMBUSTIVEIS, "Outro, qual?"],
          required: true,
          column: "left"
        },
        {
          id: "combustivel_2",
          type: "choice",
          label: "Combustível 2",
          options: [...PDI_COMBUSTIVEIS, "Outro, qual?"],
          required: true,
          excludeIfSelectedIn: "combustivel_1",
          dependsOn: "combustivel_1",
          column: "left"
        },
        {
          id: "freio_1",
          type: "choice",
          label: "Freio 1",
          options: [...PDI_FREIOS, "Outro, qual?"],
          required: true,
          dependsOn: "combustivel_2",
          column: "right"
        },
        {
          id: "freio_2",
          type: "choice",
          label: "Freio 2",
          options: [...PDI_FREIOS, "Outro, qual?"],
          required: true,
          excludeIfSelectedIn: "freio_1",
          dependsOn: "freio_1",
          column: "right"
        }
      ]
    },
    {
      id: "step_q3_escuridao",
      question: "Estratégias de contingências",
      description: "O cérebro gera respostas físicas reais para cenários imaginários de estresse.\nAo imaginar e escrever o pior cenário possível, você tira o poder do medo, mostrando para a sua mente que, mesmo na pior das hipóteses, você sobreviveria e recomeçaria.\n\nPara isso:\nApague a luz do ambiente onde você está...\nMas se não puder, apenas feche os olhos por 5 expirações e observe o escuro.",
      nextLabel: "Pronto, percebi e senti o escuro!",
      fields: []
    },
    {
      id: "step_q4_reflexao",
      question: "O dia seguinte",
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
      question: "Os seus inegociáveis",
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
