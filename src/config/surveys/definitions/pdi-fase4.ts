import { SurveyConfig } from "@/types/survey";

export const pdiFase4Survey: SurveyConfig = {
  id: "survey_pdi_fase4",
  kind: "survey",
  title: "Consolidação de PDI",
  description: "Consolidação e carta de compromisso",
  submitLabel: "Finalizar e Acessar meu PDI",
  analytics: {
    surveyId: "survey_pdi_fase4",
    domain: "SURVEY",
    context: "CAREER_PDI",
    tags: ["carreira", "pdi", "fase4"]
  },
  policy: {
    editable: true,
    allowReset: false
  },
  steps: [
    {
      id: "step_intro_fase4",
      question: "Consolidação de PDI",
      description: "Você chegou na última etapa! Tudo o que você mapeou e construiu até aqui forma a base sólida do seu Plano de Desenvolvimento Individual.\n\nMas antes de finalizar, temos um último (e muito importante) desafio para você.",
      nextLabel: "Avançar",
      fields: []
    },
    {
      id: "step_carta_futuro",
      question: "O exercício da Carta ao Futuro",
      description: "Pegue uma folha de papel em branco e uma caneta (sim, precisa ser à próprio punho!).\n\nEscreva uma carta para você mesmo(a) no futuro. Data de hoje até daqui a 6 meses.\nComece a carta com: \"Querido(a) [Seu Nome], nestes últimos 6 meses, minha jornada foi...\"\n\nE então, escreva com orgulho o que você quer ter alcançado, os medos que você superou e como se sente por ter seguido firme no seu plano e cumprido com as suas regras inegociáveis.\nEscreva no passado, como se tudo já tivesse dado certo. E assine no final.",
      nextLabel: "Avançar",
      fields: []
    },
    {
      id: "step_upload_carta",
      question: "Envie a sua carta",
      description: "Tire uma foto legível da sua carta e faça o upload abaixo. Nós guardaremos ela a sete chaves. Daqui a 6 meses, nós te entregaremos essa carta para você ler e celebrar a sua jornada.",
      nextLabel: "Avançar",
      fields: [
        {
          id: "foto_carta_futuro",
          type: "file",
          label: "Foto da Carta ao Futuro",
          required: true
        }
      ]
    },
    {
      id: "step_fechamento_pdi",
      question: "Parabéns, {{User_Nickname}}!",
      description: "O seu Plano de Desenvolvimento Individual está concluído.\n\nVocê acaba de dar o passo mais importante em direção à sua nova realidade profissional. Lembre-se: o PDI é um mapa vivo. Visite-o semanalmente nos dias e horários que você definiu.\n\nO documento consolidado do seu PDI (em formato PDF) já está disponível na sua jornada! Lá estarão registradas todas as suas metas, combustíveis, regras inegociáveis e a sua data de abertura da carta.\n\nDesejamos foco, disciplina e muito sucesso na sua trajetória!",
      fields: []
    }
  ]
};
