import { SurveyConfig } from "@/types/survey";

/**
 * Survey: Análise de Gestão do Tempo (Tríade do Tempo) ⏳
 * Focado em mapear Importância, Urgência e Circunstância.
 */
export const gestaoTempoSurvey: SurveyConfig = {
  id: "gestao_tempo",
  kind: "survey",
  title: "Análise de Gestão do Tempo",
  description: "Produtividade e foco",
  analytics: {
    surveyId: "gestao_tempo",
    domain: "GESTAO_TEMPO",
    tags: ["produtividade", "comportamento", "triade"]
  },
  policy: {
    editable: false,
    allowReset: false
  },
  submitLabel: "Finalizar Avaliação",
  completionMessage: "Agradecemos sua participação! Seus resultados serão analisados por nossa equipe e apresentados a você na reunião de devolutiva da análise comportamental.",
  steps: [
    {
      id: "intro_objetivo",
      question: "Objetivo da Análise",
      description: "Olá {User_Nickname}! Essa análise visa mapear a forma como você tende a gerenciar o seu tempo e, organizar e priorizar suas tarefas.\n\nTempo estimado: 20 minutos.\nInstruções: Reserve um lugar silencioso e sem interrupções. Uma vez iniciado, não será possível pausar.",
      nextLabel: "De acordo",
      fields: []
    },
    {
      id: "intro_instrucoes",
      question: "Instruções da Análise",
      description: "A seguir serão apresentadas algumas afirmações. Avalie com qual frequência cada uma acontece no seu dia a dia utilizando a escala abaixo:",
      nextLabel: "Iniciar",
      fields: [
        {
          id: "info_escala",
          type: "info",
          label: "1 = Nunca | 2 = Raramente | 3 = Às vezes | 4 = Quase sempre | 5 = Sempre"
        }
      ]
    },
    // Questões de 1 a 18 (Escala 1-5)
    {
      id: "q1",
      question: "1. Costumo ir a eventos, festas ou cursos, mesmo sem ter muita vontade, para agradar meu chefe, meus amigos ou minha família.",
      fields: [{ id: "q1", type: "scale", options: ["1", "2", "3", "4", "5"], required: true }]
    },
    {
      id: "q2",
      question: "2. Não consigo realizar tudo que me propus a fazer no dia; preciso fazer hora extra e levar trabalho para casa.",
      fields: [{ id: "q2", type: "scale", options: ["1", "2", "3", "4", "5"], required: true }]
    },
    {
      id: "q3",
      question: "3. Quando recebo um novo e-mail, costumo dar uma olhada para checar o conteúdo.",
      fields: [{ id: "q3", type: "scale", options: ["1", "2", "3", "4", "5"], required: true }]
    },
    {
      id: "q4",
      question: "4. Costumo visitar, com regularidade, pessoas relevantes em minha vida, como amigos, parentes e filhos.",
      fields: [{ id: "q4", type: "scale", options: ["1", "2", "3", "4", "5"], required: true }]
    },
    {
      id: "q5",
      question: "5. É comum aparecerem problemas inesperados no meu dia a dia.",
      fields: [{ id: "q5", type: "scale", options: ["1", "2", "3", "4", "5"], required: true }]
    },
    {
      id: "q6",
      question: "6. Assumo compromissos com outras pessoas ou aceito novas posições na empresa, mesmo que não goste muito da nova atividade, se for para aumentar meus rendimentos ou obter uma promoção.",
      fields: [{ id: "q6", type: "scale", options: ["1", "2", "3", "4", "5"], required: true }]
    },
    {
      id: "q7",
      question: "7. Tenho um tempo definido para dedicar a mim mesmo, e nele posso fazer o que quiser.",
      fields: [{ id: "q7", type: "scale", options: ["1", "2", "3", "4", "5"], required: true }]
    },
    {
      id: "q8",
      question: "8. Costumo deixar para fazer relatórios, imposto de renda, compras de Natal, estudar para provas e outras tarefas perto do prazo de entrega.",
      fields: [{ id: "q8", type: "scale", options: ["1", "2", "3", "4", "5"], required: true }]
    },
    {
      id: "q9",
      question: "9. Nos dias de descanso, costumo passar boa parte do dia assistindo à televisão, jogando ou acessando a internet.",
      fields: [{ id: "q9", type: "scale", options: ["1", "2", "3", "4", "5"], required: true }]
    },
    {
      id: "q10",
      question: "10. Faço um planejamento por escrito de tudo que preciso fazer durante minha semana.",
      fields: [{ id: "q10", type: "scale", options: ["1", "2", "3", "4", "5"], required: true }]
    },
    {
      id: "q11",
      question: "11. Posso afirmar que estou conseguindo realizar tudo que gostaria em minha vida e que o tempo está passando na velocidade correta.",
      fields: [{ id: "q11", type: "scale", options: ["1", "2", "3", "4", "5"], required: true }]
    },
    {
      id: "q12",
      question: "12. Costumo participar de reuniões sem saber direito o conteúdo, por que devo participar ou a que resultado aquele encontro pode levar.",
      fields: [{ id: "q12", type: "scale", options: ["1", "2", "3", "4", "5"], required: true }]
    },
    {
      id: "q13",
      question: "13. Consigo melhores resultados e me sinto mais produtivo quando estou sob pressão ou com o prazo curto.",
      fields: [{ id: "q13", type: "scale", options: ["1", "2", "3", "4", "5"], required: true }]
    },
    {
      id: "q14",
      question: "14. Quando quero alguma coisa, defino esse objetivo por escrito, estabeleço prazos em minha agenda, monitoro os resultados obtidos e os comparo com os esperados.",
      fields: [{ id: "q14", type: "scale", options: ["1", "2", "3", "4", "5"], required: true }]
    },
    {
      id: "q15",
      question: "15. Leio muitos e-mails desnecessários, com piadas, correntes, propagandas, apresentações, produtos etc.",
      fields: [{ id: "q15", type: "scale", options: ["1", "2", "3", "4", "5"], required: true }]
    },
    {
      id: "q16",
      question: "16. Estive atrasado com minhas tarefas ou reuniões nas últimas semanas.",
      fields: [{ id: "q16", type: "scale", options: ["1", "2", "3", "4", "5"], required: true }]
    },
    {
      id: "q17",
      question: "17. Faço esporte com regularidade, me alimento de forma adequada e tenho o lazer que gostaria.",
      fields: [{ id: "q17", type: "scale", options: ["1", "2", "3", "4", "5"], required: true }]
    },
    {
      id: "q18",
      question: "18. É comum reduzir meu horário de almoço ou até mesmo comer enquanto trabalho para concluir um projeto ou tarefa.",
      fields: [{ id: "q18", type: "scale", options: ["1", "2", "3", "4", "5"], required: true }]
    },
    {
      id: "fechamento_aberto",
      question: "Análise Final",
      description: "Para concluir, descreva com suas palavras como avalia sua capacidade e disposição para gerenciar seu tempo, organizar e priorizar tarefas hoje.",
      fields: [
        {
          id: "auto_avaliacao",
          type: "textarea",
          label: "Autoavaliação de Gestão de Tempo",
          placeholder: "O quanto a forma como você cuida desses aspectos te ajuda ou te trava no dia a dia?",
          required: true
        }
      ]
    }
  ]
};
