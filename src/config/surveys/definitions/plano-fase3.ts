import { SurveyConfig } from "@/types/survey";

export const planoFase3Survey: SurveyConfig = {
  id: "survey_plano_fase3",
  kind: "survey",
  title: "Plano de Carreira: Plano de Ação",
  description: "Fase 3 — Plano de Ação",
  submitLabel: "Concluído! Salvar e Avançar",
  analytics: {
    surveyId: "survey_plano_fase3",
    domain: "SURVEY",
    context: "CAREER_PLAN",
    tags: ["carreira", "plano_acao"]
  },
  policy: {
    editable: true,
    allowReset: false
  },
  steps: [
    {
      id: "step_intro_acao",
      question: "Olá, {{User_Nickname}}! A partir de agora, daremos início à estruturação prática e operacional do seu plano.",
      description: "Você já sabe onde quer chegar e quais recursos (e atritos) tem na bagagem. Agora, é hora de pavimentar a rota de curto, médio e longo prazo para que os seus objetivos se materializem em ações coordenadas e inegociáveis de autodesenvolvimento.",
      nextLabel: "Estou pronto, vamos traçar as ações",
      fields: []
    },
    {
      id: "step_q1_pequenas_metas",
      question: "1) Pequenas Metas (Próximos 7 dias)",
      description: "Pensar em muitas metas de longo prazo de uma única vez tende a gerar ansiedade e procrastinação. Enquanto isso, decidir pelas poucas que podem ser realizadas hoje com o que já se tem gera a dopamina adequada para manter-se em movimento.\n\nPensando no seu maior objetivo de carreira ({{Objetivo_Principal_Fase1}}), quais são as 3 pequenas ações, simples e ao seu alcance, que você pode realizar nos próximos 7 dias?\n\n(Exemplo: \"Na terça-feira às 14h, vou enviar uma mensagem para 3 contatos no LinkedIn\", ou \"Vou bloquear 1 hora da minha agenda na sexta-feira de manhã apenas para estruturar o escopo do projeto X\").",
      nextLabel: "Avançar",
      fields: [
        {
          id: "acao_7dias_1",
          type: "text",
          label: "Ação 1",
          placeholder: "Descreva a ação prática...",
          required: true
        },
        {
          id: "slider_facilidade_1",
          type: "slider",
          label: "Avalie a facilidade de concluir esta ação:",
          required: true
        },
        {
          id: "acao_7dias_2",
          type: "text",
          label: "Ação 2",
          placeholder: "Descreva a ação prática...",
          required: true
        },
        {
          id: "slider_facilidade_2",
          type: "slider",
          label: "Avalie a facilidade de concluir esta ação:",
          required: true
        },
        {
          id: "acao_7dias_3",
          type: "text",
          label: "Ação 3",
          placeholder: "Descreva a ação prática...",
          required: true
        },
        {
          id: "slider_facilidade_3",
          type: "slider",
          label: "Avalie a facilidade de concluir esta ação:",
          required: true
        }
      ]
    },
    {
      id: "step_q2_checkpoints_90d",
      question: "2) Checkpoints (Próximos 90 dias)",
      description: "Quem tem o objetivo de chegar no topo de uma montanha, como o Everest, geralmente não percorre o caminho em um único dia. Os alpinistas precisam acampar para descansar, reabastecer e confirmar se estão no trajeto correto.\n\nPensando nos próximos 90 dias (3 meses), quais serão as 3 principais paradas (Checkpoints) que você fará para recarregar a energia e avaliar o progresso da sua jornada? Quais tarefas, compromissos, conversas, ideias ou projetos deverão ter sido concluídos antes da parada? E como o que foi concluído vai te aproximar do seu objetivo de carreira?",
      nextLabel: "Avançar",
      fields: [
        {
          id: "parada_90dias_1a",
          type: "textarea",
          label: "Parada 1: O que deverá ter sido concluído?",
          placeholder: "Descreva os projetos, tarefas ou conversas concluídas...",
          required: true
        },
        {
          id: "parada_90dias_1b",
          type: "textarea",
          label: "Como será essa parada?",
          placeholder: "Onde, quando e com quem será esse momento de avaliação...",
          required: true
        },
        {
          id: "parada_90dias_2a",
          type: "textarea",
          label: "Parada 2: O que deverá ter sido concluído?",
          placeholder: "Descreva os projetos, tarefas ou conversas concluídas...",
          required: true
        },
        {
          id: "parada_90dias_2b",
          type: "textarea",
          label: "Como será essa parada?",
          placeholder: "Onde, quando e com quem será esse momento de avaliação...",
          required: true
        },
        {
          id: "parada_90dias_3a",
          type: "textarea",
          label: "Parada 3: O que deverá ter sido concluído?",
          placeholder: "Descreva os projetos, tarefas ou conversas concluídas...",
          required: true
        },
        {
          id: "parada_90dias_3b",
          type: "textarea",
          label: "Como será essa parada?",
          placeholder: "Onde, quando e com quem será esse momento de avaliação...",
          required: true
        }
      ]
    },
    {
      id: "step_q3_aliados",
      question: "3) A sua rede de parceria",
      description: "{{User_Nickname}}, uma das características fundamentais para a evolução humana é a conexão com outros humanos. O trabalho em equipe é precioso porque nos permite distribuir o peso de uma responsabilidade, e assim evitar a falha e o esgotamento.\n\nA jornada é somente sua, mas os aliados podem te ajudar a enxergar as armadilhas e te incentivar a continuar. Hoje, quem poderiam ser seus 3 principais aliados para te apoiar?\n\n(Pode ser um mentor, um colega para trocar ideias, um colaborador para quem você precisará delegar tarefas operacionais, ou até um parceiro de vida para garantir suporte e divisão da rotina). Obs: Você não precisa falar com eles imediatamente. Neste momento, tudo o que precisa é apenas nomear os aliados.",
      nextLabel: "Avançar",
      fields: [
        {
          id: "nome_aliado_1",
          type: "text",
          label: "Nome do Aliado 1",
          placeholder: "Nome...",
          required: true
        },
        {
          id: "justificativa_aliado_1",
          type: "textarea",
          label: "Por que essa pessoa será uma boa aliada?",
          placeholder: "Ela me apoiará porque...",
          required: true
        },
        {
          id: "nome_aliado_2",
          type: "text",
          label: "Nome do Aliado 2",
          placeholder: "Nome...",
          required: true
        },
        {
          id: "justificativa_aliado_2",
          type: "textarea",
          label: "Por que essa pessoa será uma boa aliada?",
          placeholder: "Ela me apoiará porque...",
          required: true
        },
        {
          id: "nome_aliado_3",
          type: "text",
          label: "Nome do Aliado 3",
          placeholder: "Nome...",
          required: true
        },
        {
          id: "justificativa_aliado_3",
          type: "textarea",
          label: "Por que essa pessoa será uma boa aliada?",
          placeholder: "Ela me apoiará porque...",
          required: true
        }
      ]
    },
    {
      id: "step_q4_contrato_parceria",
      question: "4) Contrato de parceria",
      description: "Muito bem! Não basta apenas ter esses aliados por perto, é preciso autorizá-los a te ajudar.\n\nImagine que, no meio do caminho, o seu nível de estresse aumentou e você começou a se autossabotar, acionando exatamente aqueles freios que já mapeamos {{barreiras_selecionadas}}.\n\nQuando e como a sua rede de parceria pode te alertar, te cobrar ou te resgatar sem que você reaja de forma defensiva? O que você permite que essas pessoas te digam nesse momento crítico?",
      nextLabel: "Avançar",
      fields: [
        {
          id: "autorizacao_rede_parceria",
          type: "textarea",
          label: "Suas Regras de Parceria",
          placeholder: "Eu permito que me digam...",
          required: true
        }
      ]
    },
    {
      id: "step_q5_compromissos_autodesenvolvimento",
      question: "5) A Bússola do Autodesenvolvimento",
      description: "{{User_Nickname}}, o mercado muda rápido e as habilidades que te trouxeram até aqui poderão não ser as mesmas que te sustentarão durante toda a sua jornada.\n\nPara que você consiga se autodesenvolver, se adaptar e lidar com as mudanças durante o trajeto, adquirir novos conhecimentos será essencial. Por isso, quais serão os seus 3 compromissos inegociáveis de estudo e autodesenvolvimento para esta jornada?\n\n(Exemplo: \"Vou ler 5 ou 10 páginas de um livro antes de dormir\", \"Vou escutar um podcast sobre tema X todas as terças-feiras no trânsito\", ou \"Participarei de um debate/fórum da minha área uma vez por mês\").",
      nextLabel: "Avançar",
      fields: [
        {
          id: "compromisso_estudo_1a",
          type: "textarea",
          label: "Compromisso 1",
          placeholder: "Descreva o que e quando fará...",
          required: true
        },
        {
          id: "compromisso_estudo_1b",
          type: "textarea",
          label: "O que esse compromisso pode te ensinar para te aproximar do seu objetivo?",
          placeholder: "Isso vai me ajudar a...",
          required: true
        },
        {
          id: "compromisso_estudo_2a",
          type: "textarea",
          label: "Compromisso 2",
          placeholder: "Descreva o que e quando fará...",
          required: true
        },
        {
          id: "compromisso_estudo_2b",
          type: "textarea",
          label: "O que esse compromisso pode te ensinar para te aproximar do seu objetivo?",
          placeholder: "Isso vai me ajudar a...",
          required: true
        },
        {
          id: "compromisso_estudo_3a",
          type: "textarea",
          label: "Compromisso 3",
          placeholder: "Descreva o que e quando fará...",
          required: true
        },
        {
          id: "compromisso_estudo_3b",
          type: "textarea",
          label: "O que esse compromisso pode te ensinar para te aproximar do seu objetivo?",
          placeholder: "Isso vai me ajudar a...",
          required: true
        }
      ]
    },
    {
      id: "step_fechamento_fase3",
      question: "Rota definida com sucesso!",
      description: "{{User_Nickname}}, ao dividir o seu objetivo de carreira ({{Objetivo_Principal_Fase1}}) em pequenas metas e criar medidas de contingência, é possível ter um plano de ação prático, leve e conectado tanto com o seu contexto de vida, quanto com os seus limites e valores.",
      fields: []
    }
  ]
};
