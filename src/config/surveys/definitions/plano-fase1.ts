import { SurveyConfig } from "@/types/survey";

export const planoFase1Survey: SurveyConfig = {
  id: "survey_plano_fase1",
  kind: "survey",
  title: "Plano de Carreira: Definição de Objetivo",
  description: "Fase 1 — Definição de Objetivo",
  submitLabel: "Concluído! Salvar e Avançar",
  analytics: {
    surveyId: "survey_plano_fase1",
    domain: "SURVEY",
    context: "CAREER_PLAN",
    tags: ["carreira", "objetivo"]
  },
  policy: {
    editable: true,
    allowReset: false
  },
  steps: [
    {
      id: "step_intro_objetivo",
      question: "Olá, {{User_Nickname}}! Chegou o momento de desenharmos o futuro da sua carreira profissional.",
      description: "Te parabenizamos pela coragem e ímpeto de chegar até aqui!\n\nSabemos que a decisão de dar este passo não foi simples, porque pensar e agir diferente dos hábitos e atitudes comuns requer esforço e determinação para sair da zona de conforto. Esse é o caminho para gerar novos resultados, adicionar valor ao que já existe e te destacar como um profissional de sucesso no mercado de trabalho.\n\nPara continuar essa jornada com consistência e coerência, é importante um Plano de Carreira para diminuir o nível de esforço e focar a energia na direção correta. E o primeiro passo para isso é definir com clareza onde você quer chegar.",
      nextLabel: "Estou pronto, vamos começar",
      fields: [
        {
          id: "info_tempo_fase1",
          type: "info",
          label: "Atenção: Reserve de 15 a 20 minutos em um ambiente tranquilo para prosseguir. Os dados preenchidos ficam salvos somente com a conclusão total. Caso precise fechar a página durante o processo, ele será reiniciado."
        }
      ]
    },
    {
      id: "step_q1_objetivo_principal",
      question: "1) A Meta Central",
      description: "Pensar em muitas coisas ao mesmo tempo gera confusão. Responda em uma única frase: qual é, hoje, o seu maior objetivo de carreira profissional?\n\n(Exemplo: Uma transição de área, uma promoção, criar ou entregar um projeto, aumentar o faturamento, conseguir uma posição de prestígio).",
      nextLabel: "Avançar",
      fields: [
        {
          id: "objetivo_principal_fase1",
          type: "text",
          label: "O seu grande objetivo",
          placeholder: "Meu objetivo é...",
          required: true
        }
      ]
    },
    {
      id: "step_q2_visualizacao",
      question: "2) A Materialização do Sucesso",
      description: "{{User_Nickname}}, imagine que hoje você alcançou esse objetivo. Conte a história do que está acontecendo ao seu redor.\n\nOnde você está? Quem está com você? O que mudou? Quais são as suas emoções e sentimentos? O que você está fazendo? O que você está vestindo? O que você está falando? Quais ligações ou mensagens você está mandando? Quais emojis você está utilizando? A quem você está agradecendo pelo resultado?",
      nextLabel: "Avançar",
      fields: [
        {
          id: "visualizacao_sucesso",
          type: "textarea",
          label: "A sua história de vitória",
          placeholder: "Estou no escritório (ou em casa), vestindo...",
          required: true
        }
      ]
    },
    {
      id: "step_q3_dor_desistencia",
      question: "3) Como seria a desistência",
      description: "Suponha que você decidiu não caminhar mais em direção a esse objetivo. Por algum motivo você o deixou de lado e seguiu uma carreira profissional totalmente diferente e mais confortável.\n\nVocê receberia mais crítica ou mais apoio? O que as pessoas diriam a você? O que você responderia a elas? E o que você acharia de mudar de carreira? Você sentiria uma sensação de fracasso, de coragem, de alívio ou de vergonha?",
      nextLabel: "Avançar",
      fields: [
        {
          id: "dor_desistencia",
          type: "textarea",
          label: "O custo de desistir",
          placeholder: "Se eu desistisse hoje, as pessoas diriam que...",
          required: true
        }
      ]
    },
    {
      id: "step_q4_conexao_maslow",
      question: "4) Conexão com o seu Termômetro de Maslow",
      description: "{{Maslow_Contexto}}",
      nextLabel: "Avançar",
      fields: [
        {
          id: "maslow_pyramid_image",
          type: "image",
          imageUrl: "/images/maslow-pyramid.png"
        },
        {
          id: "conexao_maslow",
          type: "textarea",
          label: "Alinhamento Estratégico",
          placeholder: "Esse objetivo se conecta com o meu pilar porque...",
          required: true
        }
      ]
    },
    {
      id: "step_fechamento_fase1",
      question: "Muito bem, {{User_Nickname}}!",
      description: "Objetivos abstratos tendem a causar ansiedade e segurança, já objetivos elaborados com profundidade e riqueza de detalhes tangibilizam o caminho e geram movimento!\n\nAgora você pode avançar para decidir quais habilidades e recursos você utilizará durante o percurso.",
      fields: []
    }
  ]
};
