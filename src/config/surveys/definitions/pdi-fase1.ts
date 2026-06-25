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
      nextLabel: "Tudo pronto! Podemos avançar!",
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
      description: "Daqui em diante, tudo o que você ler e responder tem um único objetivo: impulsionar você do seu estado atual para onde você quer chegar.\n\nNão importa se você atua hoje no regime CLT, se é autônomo, dono de negócio ou se está em transição buscando recolocação profissional. A gestão da sua carreira exige que você assuma a própria jornada.\n\nPara que este guia funcione, precisamos firmar um acordo: suspenda o seu julgamento.\n• A sua mente tentará dizer que algumas reflexões são óbvias ou difíceis demais, atuando como um mecanismo de defesa;\n• Deixe a autocrítica de lado e responda com total honestidade.\n\nLigue a sua playlist favorita e vamos começar!",
      nextLabel: "Avançar",
      fields: []
    },
    {
      id: "step_objetivo_pdi",
      question: "Objetivos abstratos ou muito longos tendem a causar ansiedade e paralisia.",
      description: "O nosso cérebro precisa de previsibilidade para relaxar e focar energia na direção correta. Pensar em muitas coisas ao mesmo tempo gera confusão, por isso, vamos afunilar.",
      nextLabel: "Avançar",
      fields: [
        {
          id: "objetivo_frase",
          type: "text",
          label: "Responda em uma única frase: qual é, hoje, o seu maior objetivo profissional prático?",
          placeholder: "Ex: \"Me tornar Gerente de Produto\", \"Mudar para a área de Tecnologia\"",
          required: true
        },
        {
          id: "objetivo_detalhes",
          type: "textarea",
          label: "Descreva o seu objetivo com detalhes: quais seriam os primeiros passos até ele? Quais são as habilidades e recursos que você já tem que poderão te ajudar a chegar lá? Quem são as pessoas que você poderá contar no meio do caminho? Onde esse objetivo será concretizado?",
          placeholder: "Para mim isso significa...",
          required: true,
          dependsOn: "objetivo_frase"
        }
      ]
    },
    {
      id: "step_barreiras_pdi",
      question: "Barreiras do percurso",
      description: "O medo de falhar costuma ser paralisante. Mas o que acontece se você simplesmente não fizer nada? Ao encarar o custo de desistir, você percebe que a estagnação é mais dolorosa que o esforço da mudança.\n\nSuponha que você decidiu não caminhar mais em direção a esse objetivo, abandonando-o por um caminho mais confortável.\nO que você sentiria: alívio, fracasso, coragem ou vergonha? O que você diria a si mesmo no futuro? O que as pessoas ao seu redor te diriam?",
      nextLabel: "Avançar",
      fields: [
        {
          id: "reflexao_desistir",
          type: "textarea",
          label: "Sua reflexão sobre desistir",
          required: true
        }
      ]
    }
  ]
};
