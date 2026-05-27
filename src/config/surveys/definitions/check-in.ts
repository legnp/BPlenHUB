import { SurveyConfig } from "@/types/survey";

const DEPARTAMENTOS_GLOBAIS = ["Operações", "Financeiro", "Diretoria", "Vendas", "RH", "Marketing", "Logística", "Outros"];
const TEMPOS_EXPERIENCIA_GLOBAIS = ["Até 2 anos", "2 a 5 anos", "5 a 10 anos", "10 a 15 anos", "15 a 20 anos", "+20 anos"];

/**
 * BPlen HUB — Survey: Check-in (V1.0) 📊
 * Coleta dados profundos sobre a carreira e desafios do usuário.
 */
export const checkInSurvey: SurveyConfig = {
  id: "check_in",
  kind: "survey",
  title: "Check-in BPlen",
  description: "Demandas e estado atual da jornada",
  submitLabel: "Finalizar Check-in",
  analytics: {
    surveyId: "check_in",
    domain: "SURVEY",
    context: "HUB_ADMIN",
    tags: ["carreira", "onboarding", "maturidade"]
  },
  policy: {
    editable: true,
    allowReset: false
  },
  steps: [
    {
      id: "q0_aviso",
      question: "Olá {User_Nickname}! Agora que já se familiarizou com a plataforma, vamos fazer o seu check-in?",
      description: "Para fazer o check-in, separe um espaço reservado e sem distrações por cerca de 20 minutos. A progressão não fica salva, então a única maneira de salvar é concluindo-o integralmente.\n\nPor favor, tenha em mãos o seu Currículo, Portfólio, links de redes sociais profissionais e todo material profissional.",
      fields: [
        {
          id: "aviso_choice",
          type: "buttons",
          required: true,
          options: ["Fazer checkin mais tarde", "Ciente, fazer checkin agora"],
          logic: {
            "Fazer checkin mais tarde": "q_mais_tarde",
            "Ciente, fazer checkin agora": "q1_intro"
          }
        }
      ]
    },
    {
      id: "q_mais_tarde",
      question: "Tudo bem, faça no seu tempo!",
      description: "Aguardaremos você estar em um ambiente tranquilo com pelo menos 20 minutos disponíveis para iniciarmos.\n\nComo não é possível salvar o progresso, no seu retorno basta clicar em \"Ciente, fazer checkin agora\" para prosseguir.",
      nextLabel: "Fazer Check-in",
      fields: [
        {
          id: "info_voltar",
          type: "info",
          label: "Você pode usar o menu lateral esquerdo para navegar para outras páginas da plataforma."
        }
      ]
    },
    {
      id: "q1_intro",
      question: "{User_Nickname}, te damos as boas vindas ao check-in! Agora que está disponível, você nos permite conhecer um pouco mais sobre você?",
      fields: [
        {
          id: "intro_choice",
          type: "buttons",
          required: true,
          options: ["Com certeza", "Sim, mas não muito"],
          logic: {
            "Com certeza": "q2_com_certeza",
            "Sim, mas não muito": "q2_mas_nao_muito"
          }
        }
      ]
    },
    {
      id: "q2_mas_nao_muito",
      question: "{User_Nickname}, entendido. Hoje qual é a sua maior preocupação em contar sobre você?",
      fields: [
        {
          id: "preocupacao_desc",
          type: "textarea",
          required: true,
          placeholder: "Descreva brevemente..."
        }
      ]
    },
    {
      id: "q2_com_certeza",
      question: "Legal!!! Vamos nessa! Qual é a melhor coisa sobre você, que deveríamos saber para te apoiar na sua jornada?",
      fields: [
        {
          id: "melhor_coisa_desc",
          type: "textarea",
          required: true,
          placeholder: "Pode ser uma habilidade, um valor ou um sonho..."
        }
      ]
    },
    {
      id: "q3_objetivos",
      question: "{User_Nickname}, qual é o seu principal objetivo pelos próximos 90 dias, 6 meses e 5 anos?",
      fields: [
        {
          id: "objetivos_timeline",
          type: "textarea",
          required: true,
          placeholder: "90 dias: ... \n6 meses: ... \n5 anos: ..."
        }
      ]
    },
    {
      id: "q4_barreiras",
      question: "Quais são as maiores barreiras que você enfrenta hoje para alcançar esses objetivos?",
      fields: [
        {
          id: "barreiras_desc",
          type: "textarea",
          required: true,
          placeholder: "Falta de tempo, ferramentas, mentoria..."
        }
      ]
    },
    {
      id: "q5_desafios",
      question: "Certo! E dentro desse contexto, quais são os SEUS 3 a 5 maiores desafios?",
      fields: [
        {
          id: "desafios_multi",
          type: "multi_select",
          required: true,
          options: [
            "Entender jargões, termos técnicos ou expressões",
            "Organizar o meu tempo e a priorização de tarefas diárias",
            "Esforço excessivo para manter meu foco e concentração",
            "Ergonomia ou ambiente inadequado",
            "Sobrecarga de informações (dificuldade em filtrar o que é útil)",
            "Dificuldade que os outros me entendam com clareza",
            "Resistência ou dificuldade em me adaptar a novas ferramentas",
            "Dificuldade em delegar tarefas e confiar que os outros vão entregar",
            "Falta de clareza no alinhamento de expectativas com outros",
            "Eu travo em dar ou receber feedbacks positivos e/ou difíceis",
            "Sensação de sobrecarga constante ou proximidade de burnout",
            "Síndrome do Impostor (medo de não estar à altura dos desafios)",
            "Ansiedade em relação a resultados futuros ou mudanças",
            "Exaustão mental causada pelo excesso de tomada de decisão",
            "Dificuldade em me desconectar das atividades"
          ],
          validation: {
            minSelections: 3,
            maxSelections: 5
          }
        }
      ]
    },
    {
      id: "q6_nicho",
      question: "Que avanço! Parabéns! Sabemos que nem sempre é tão fácil resumir nossos desafios em algumas palavras. Mas é isso, um passo por vez!\n{User_Nickname}, qual o seu principal nicho e área de atuação hoje?",
      fields: [
        {
          id: "nicho_cascata",
          type: "cascaded",
          required: true,
          label: "Nicho de Atuação",
          secondaryLabel: "Departamento",
          options: [
            { label: "Tecnologia", value: "Tecnologia", subOptions: DEPARTAMENTOS_GLOBAIS },
            { label: "Saúde", value: "Saúde", subOptions: DEPARTAMENTOS_GLOBAIS },
            { label: "Educação", value: "Educação", subOptions: DEPARTAMENTOS_GLOBAIS },
            { label: "Finanças", value: "Finanças", subOptions: DEPARTAMENTOS_GLOBAIS },
            { label: "Marketing", value: "Marketing", subOptions: DEPARTAMENTOS_GLOBAIS },
            { label: "Varejo", value: "Varejo", subOptions: DEPARTAMENTOS_GLOBAIS },
            { label: "Outros", value: "Outros", subOptions: DEPARTAMENTOS_GLOBAIS }
          ]
        }
      ]
    },
    {
      id: "q7_rotina",
      question: "Nos conte um pouco mais sobre o que você faz. Qual é o seu cargo atual? Quais são suas atividades? Como é a sua rotina?",
      fields: [
        {
          id: "rotina_cargo_desc",
          type: "textarea",
          required: true,
          placeholder: "Cargo: ... \nAtividades: ... \nRotina: ..."
        }
      ]
    },
    {
        id: "q8a_maturidade",
        question: "Qual é o estágio da maturidade da sua carreira profissional?",
        fields: [
            {
                id: "maturidade_cascata",
                type: "cascaded",
                required: true,
                label: "Estágio de Maturidade",
                secondaryLabel: "Tempo total de experiência",
                options: [
                    { label: "Aprendiz", value: "Aprendiz", subOptions: TEMPOS_EXPERIENCIA_GLOBAIS },
                    { label: "Junior", value: "Junior", subOptions: TEMPOS_EXPERIENCIA_GLOBAIS },
                    { label: "Pleno", value: "Pleno", subOptions: TEMPOS_EXPERIENCIA_GLOBAIS },
                    { label: "Sênior", value: "Sênior", subOptions: TEMPOS_EXPERIENCIA_GLOBAIS },
                    { label: "Conselheiro", value: "Conselheiro", subOptions: TEMPOS_EXPERIENCIA_GLOBAIS },
                    { label: "Diretoria", value: "Diretoria", subOptions: TEMPOS_EXPERIENCIA_GLOBAIS },
                    { label: "Dono", value: "Dono", subOptions: TEMPOS_EXPERIENCIA_GLOBAIS }
                ]
            }
        ]
    },
    {
      id: "q8b_regime",
      question: "{User_Nickname}, hoje você está empregado em regime CLT ou PJ?",
      fields: [
        {
          id: "regime_choice",
          type: "buttons",
          required: true,
          options: ["CLT", "PJ", "Trabalho informal", "Não estou empregado"],
          logic: {
            "CLT": "q8c_pacote",
            "PJ": "q8c_pacote",
            "Trabalho informal": "q8c_pacote",
            "Não estou empregado": "q8c_pacote_anterior"
          }
        }
      ]
    },
    {
      id: "q8c_pacote",
      question: "Como está o seu pacote de remuneração e benefícios atual?",
      nextStepId: "q8d_carreira_profissional",

      fields: [
        {
          id: "beneficios_pacote",
          type: "benefits",
          required: true,
          options: [
            "Salário", "Comissão", "Bônus", "PLR", "Previdência Privada", "VR/VA Flex", 
            "VR", "VA", "VT", "Vale Combustível", "Estacionamento", 
            "Seguro Médico", "Seguro Odontológico", "Seguro de Vida", 
            "Dayoff", "Home Office", "Expectativa Salarial"
          ]
        }
      ]
    },
    {
        id: "q8c_pacote_anterior",
        question: "Como o seu último pacote de remuneração e benefícios era composto?",
        nextStepId: "q8d_carreira_profissional",
        fields: [
          {
            id: "beneficios_pacote", // Reaproveita ID para unificar dados no banco
            type: "benefits",
            required: true,
            options: [
              "Salário", "Comissão", "Bônus", "PLR", "Previdência Privada", "VR/VA Flex", 
              "VR", "VA", "VT", "Vale Combustível", "Estacionamento", 
              "Seguro Médico", "Seguro Odontológico", "Seguro de Vida", 
              "Dayoff", "Home Office", "Expectativa Salarial"
            ]
          }
        ]
      },
    {
      id: "q8d_carreira_profissional",
      question: "{User_Nickname}, sua Carreira Profissional",
      description: "Queremos conhecer sua trajetória! Anexe seus documentos e nos conte sobre seus canais profissionais.",
      fields: [
        {
          id: "cv_upload",
          type: "file",
          label: "Currículo / Resumo (PDF)",
          required: false
        },
        {
          id: "portfolio_upload",
          type: "file",
          label: "Portfólio / Projetos (PDF/IMG)",
          required: false
        },
        {
          id: "linkedin_url",
          type: "text",
          label: "LinkedIn (URL)",
          placeholder: "linkedin.com/in/..."
        },
        {
          id: "instagram_url",
          type: "text",
          label: "Instagram (URL)",
          placeholder: "@seunome"
        },
        {
          id: "web_url",
          type: "text",
          label: "Página Web Profissional",
          placeholder: "www.seusite.com.br"
        },
        {
          id: "portfolio_url",
          type: "text",
          label: "Página de Portfólio (Behance, GitHub, etc)",
          placeholder: "behance.net/..."
        },
        {
          id: "comentarios_carreira",
          type: "textarea",
          label: "Comentários sobre sua carreira profissional",
          placeholder: "Fale um pouco mais sobre sua trajetória..."
        },
        {
          id: "banco_talentos",
          type: "choice",
          label: "Quero participar do Banco de Talentos da BPlen",
          options: ["Sim, quero fazer parte", "Não, obrigado"],
          required: true
        },
        {
          id: "info_banco",
          type: "info",
          label: "Este banco de talentos não é para trabalhar na BPlen, mas para fazer parte do banco que a BPlen compartilha com empresas parceiras e clientes. Não significa que há vagas abertas no momento ou emprego garantido, mas seu perfil poderá ser consultado para indicações. Você poderá revogar sua participação a qualquer momento."
        }
      ]
    },

    {
      id: "q9_como_podemos_ajudar",
      question: "{User_Nickname}, porque você deu sua permissão a BPlen para te ajudar na jornada do desenvolvimento da sua carreira, o que você espera encontrar por aqui? Como podemos te ajudar?",
      fields: [
        {
          id: "expectativa_ajuda_desc",
          type: "textarea",
          required: true,
          placeholder: "Gostaria de focar em..."
        }
      ]
    },
    {
      id: "q10_likert",
      question: "Até aqui, como você avalia a sua experiência? E como gostaria que continuássemos te conduzindo?",
      fields: [
        {
          id: "experiencia_likert",
          type: "likert",
          required: true,
          options: ["1", "2", "3", "4", "5"]
        }
      ]
    }
  ]
};
