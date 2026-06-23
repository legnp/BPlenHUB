import { SurveyConfig } from "@/types/survey";

export const planoFase2Survey: SurveyConfig = {
  id: "survey_plano_fase2",
  kind: "survey",
  title: "Plano de Carreira: Seleção de Recursos",
  description: "Fase 2 — Seleção de Recursos",
  submitLabel: "Concluído! Salvar e Avançar",
  analytics: {
    surveyId: "survey_plano_fase2",
    domain: "SURVEY",
    context: "CAREER_PLAN",
    tags: ["carreira", "recursos"]
  },
  policy: {
    editable: true,
    allowReset: false
  },
  steps: [
    {
      id: "step_intro_recursos",
      question: "Olá, {{User_Nickname}}! Agora que seu objetivo está definido, vamos organizar a sua \"bagagem\" para a jornada.",
      description: "Ninguém alcança um objetivo usando apenas os pontos fortes, e ninguém fracassa apenas pelos pontos fracos.\n\nAs forças para o sucesso são a perspectiva e a gestão das incongruências. Nesta etapa, você mapeará quais dos seus recursos atuais serão combustíveis para o seu \"motor\" (te ajudarão a acelerar), e quais poderão criar barreiras (te frear).",
      nextLabel: "Estou pronto",
      fields: [
        {
          id: "info_tempo_fase2",
          type: "info",
          label: "Atenção: Reserve de 15 a 20 minutos em um ambiente tranquilo para prosseguir. Os dados preenchidos ficam salvos somente com a conclusão total. Caso precise fechar a página durante o processo, ele será reiniciado."
        }
      ]
    },
    {
      id: "step_q1_combustiveis",
      question: "1) Quais \"combustíveis\" você utilizará?",
      description: "Na análise comportamental, pudemos mapear algumas das suas principais competências e recursos.\n\nDa lista abaixo, selecione os 3 aspectos que você acredita que serão os seus maiores ACELERADORES para te sustentar, motivar e manter engajado e focado durante a sua jornada, principalmente diante de situações desafiadoras.",
      nextLabel: "Avançar",
      fields: [
        {
          id: "combustiveis_selecionados",
          type: "multi_select",
          isMultiple: true,
          validation: {
            minSelections: 3,
            maxSelections: 3
          },
          options: [
            "Capacidade de comunicação e persuasão",
            "Alto nível de organização e planejamento",
            "Energia e rapidez na execução de tarefas",
            "Habilidade analítica e leitura de dados",
            "Facilidade em criar conexões e networking",
            "Conhecimento técnico e especialização",
            "Reservas financeiras atuais",
            "Flexibilidade de tempo na agenda atual",
            "Gestão emocional para lidar com crises",
            "Capacidade de adaptação rápida a mudanças",
            "Foco em resultados e alcance de metas",
            "Habilidade de mediar conflitos e apaziguar",
            "Criatividade e facilidade para gerar novas ideias",
            "Disciplina para manter rotinas consistentes",
            "Empatia e facilidade em entender o outro",
            "Rede de apoio familiar ou pessoal estruturada",
            "Coragem para assumir riscos calculados",
            "Pensamento estratégico e visão de longo prazo",
            "Autodidatismo e facilidade para aprender rápido",
            "Alta tolerância à frustração e resiliência"
          ],
          required: true
        }
      ]
    },
    {
      id: "step_q2_barreiras",
      question: "2) Quais atitudes podem gerar ou intensificar \"barreiras\"?",
      description: "Em toda jornada há incongruências (atritos, conflitos, hesitações, dúvidas, confusão). Elas são como freios para nossa proteção, mas quando acionadas bruscamente ou com muita frequência, o carro não anda ou pode causar um acidente.\n\nA boa notícia é que podemos nos preparar para diminuir esses riscos, e para isso precisamos entender quais são eles.\n\nDa lista abaixo, selecione os 3 aspectos que você acredita que têm o maior potencial para FREAR, atrapalhar ou te fazer desistir no meio do caminho.",
      nextLabel: "Avançar",
      fields: [
        {
          id: "barreiras_selecionadas",
          type: "multi_select",
          isMultiple: true,
          validation: {
            minSelections: 3,
            maxSelections: 3
          },
          options: [
            "Dificuldade em dizer 'não' e impor limites",
            "Excesso de perfeccionismo (demorar para entregar)",
            "Falta de recursos financeiros no curto prazo",
            "Medo da exposição ou do julgamento alheio",
            "Desorganização e perda de tempo com circunstâncias",
            "Impaciência e necessidade de resultados imediatos",
            "Dificuldade em focar em uma única tarefa",
            "Falta de uma rede de apoio ou parceiros estratégicos",
            "Procrastinação de tarefas difíceis ou chatas",
            "Resistência ou medo de mudanças repentinas",
            "Dificuldade em delegar e centralização excessiva",
            "Síndrome do impostor e autocrítica severa",
            "Dificuldade em lidar com críticas e feedbacks negativos",
            "Baixa tolerância à frustração diante de erros",
            "Sobrecarga por assumir responsabilidades de terceiros",
            "Necessidade excessiva de agradar ou ser aceito",
            "Insegurança para tomar decisões sem consultar outros",
            "Comunicação ríspida ou agressiva sob pressão",
            "Apego excessivo a métodos antigos (falta de inovação)",
            "Fuga de conversas difíceis ou conflitos"
          ],
          required: true
        }
      ]
    },
    {
      id: "step_q3_justificativa",
      question: "3) Histórico dos combustíveis e barreiras",
      description: "{{User_Nickname}}, qual o motivo de ter selecionado os combustíveis e barreiras?\n\nQuais foram as situações mais marcantes na sua trajetória em que eles apareceram e o que aconteceu? Como você reagiu e quais foram os resultados gerados?",
      nextLabel: "Avançar",
      fields: [
        {
          id: "justificativa_recursos",
          type: "textarea",
          label: "Análise de Padrões",
          placeholder: "Escolhi esses itens porque na situação X, eu agi de tal forma...",
          required: true
        }
      ]
    },
    {
      id: "step_q4_luz_acao",
      question: "4) A Escuridão (O Pior Cenário)",
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
      question: "O dia seguinte",
      description: "Neste momento você está no escuro (ou mentalmente no escuro). Esse escuro representa que o seu plano de carreira deu totalmente errado. Você se esforçou, deu o seu melhor, mas as barreiras que mapeamos {{barreiras_selecionadas}} te venceram.\n\nQual é a pior coisa que poderia acontecer na sua vida profissional e financeira? Não ter o que comer? Não ter o que vestir? Perder o imóvel? O veículo? Ter má reputação no mercado? Ficar ultrapassado demais?\n\nE apesar dessa pior coisa ter acontecido, o que você poderia fazer no dia seguinte para sobreviver e recomeçar?",
      nextLabel: "Avançar",
      fields: [
        {
          id: "pior_cenario_recomeco",
          type: "textarea",
          label: "O Plano de Sobrevivência",
          placeholder: "A pior coisa seria... Mas no dia seguinte, para sobreviver, eu...",
          required: true
        }
      ]
    },
    {
      id: "step_q5_inegociaveis",
      question: "5) Os seus inegociáveis",
      description: "{{User_Nickname}}, sabemos que imaginar o que de pior pode acontecer é uma tarefa difícil e pouco confortável, mas a tarefa foi cumprida. Parabéns!\n\nAssim como as situações desconfortáveis passam, a motivação e a inspiração também passam. O que permanece é a disciplina. Para garantir que os seus motores {{combustiveis_selecionados}} continuem funcionando e as barreiras {{barreiras_selecionadas}} não te paralisem, defina 3 regras inegociáveis que você cumprirá todos os dias, faça chuva ou faça sol (ou acabe a luz ou pegue fogo), para manter o foco e o ritmo rumo ao seu objetivo.\n\n(Exemplo: \"Falar não, mesmo que me doa\"; \"Não olhar o WhatsApp até as 10h\"; \"Fazer 2 contatos de prospecção por dia\"; \"Sair do trabalho exatamente às 18h\").",
      fields: [
        {
          id: "regras_inegociaveis",
          type: "textarea",
          label: "Suas 3 Regras Diárias",
          placeholder: "1. ... \n2. ... \n3. ...",
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
