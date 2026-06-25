import { SurveyConfig } from "@/types/survey";

export const pdiFase4Survey: SurveyConfig = {
  id: "survey_pdi_fase4",
  kind: "survey",
  title: "Consolidação de PDI",
  description: "Consolidação e carta de compromisso",
  submitLabel: "Encerrar",
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
      description: "{{User_Nickname}}, seu plano está quase pronto para a prática!\n\nPara selarmos o seu PDI com sucesso, vamos a mais um exercício para potencializar o alcance dos seus resultados. \n\nAntes de iniciar: separe um papel em branco e caneta.\nReserve de 20 a 30 minutos em um ambiente tranquilo para prosseguir.",
      nextLabel: "Estou pronto, prosseguir",
      fields: []
    },
    {
      id: "step_carta_futuro",
      question: "A Carta ao Futuro",
      description: "{{User_Nickname}}, imagine que já se passaram 6 meses desde a data de hoje. Você vivenciou o seu plano, cumpriu as metas necessárias, superou as barreiras, alcançou o seu objetivo. \n\nNos próximos 10 minutos, você é o seu Eu de 6 meses a frente, e quer contar para o seu eu de hoje como foi viver o seu PDI nesse período.\n\nEscreva uma carta contando a história, o passo a passo, as conquistas e barreiras superadas. Como foi o dia e momento em que alcançou o seu objetivo. O que você mais gostou e o que você mais agradece.\nComece a carta com: *\"Querido(a) [Seu Nome], nestes últimos 6 meses, minha jornada foi...\"*\n\nA carta deverá ser escrita a próprio punho com papel e caneta.\nApós concluir:\n- Tire uma foto e faça o upload da carta aqui;\n- Guarde essa carta em um canto especial (ou entregue ao seu parceiro de apoio) para você abri-la a daqui exatos 6 meses.",
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
      question: "{{User_Nickname}}, sabemos que não é fácil chegar até aqui...",
      description: "...por isso te parabenizamos pela coragem e determinação!\n\nCom a sua entrega e dedicação, o seu Plano de Desenvolvimento Individual não é mais uma abstração e você possui um plano claro.\n✔ Sabe exatamente o que fará se tudo der errado;\n✔ Possui três regras diárias para não depender de motivação;\n✔ Definiu o seu primeiro movimento prático para os próximos 7 dias.\n\nO desconforto da execução passa rápido, mas os resultados do planejamento consistente constroem uma carreira sólida e com propósito.\n\nFeche este guia e execute a sua primeira pequena meta de hoje!",
      fields: []
    }
  ]
};
