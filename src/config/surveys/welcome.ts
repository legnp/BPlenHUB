import { SurveyConfig } from "@/types/survey";

/**
 * Configuração: Welcome Survey (Boas-vindas Institucional 🧬)
 * Esta é a primeira interação do usuário no HUB.
 */
export const welcomeSurveyConfig: SurveyConfig = {
  id: "welcome_survey",
  kind: "survey",
  title: "Boas-vindas ao BPlen HUB",
  description: "Pesquisa Inicial",
  steps: [
    {
      id: "step_nickname",
      question: "Olá {{firstName}}!!!\nFicamos muito felizes com a sua chegada a BPlen HUB!\n\nComo devemos te chamar?",
      fields: [
        {
          id: "nickname",
          type: "text",
          label: "Seu Apelido ou Nome de Preferência",
          placeholder: "Ex: João, Lisa, Eng. Maria...",
          required: true,
          autoFocus: true
        }
      ]
    },
    {
      id: "step_type",
      question: "Para o que você busca a BPlen?",
      fields: [
        {
          id: "userType",
          type: "choice",
          label: "Seu Perfil",
          options: [
            "Para minha Carreira Profissional",
            "Para o DHO da minha empresa",
            "Para uma Parceria de Negócios"
          ],
          required: true,
          // Quem chega por parceria segue por enunciados proprios. Os CAMPOS sao os
          // mesmos (`topics`, `demand`) — so o texto muda, para a resposta continuar
          // comparavel com a de todo mundo.
          logic: {
            "Para uma Parceria de Negócios": "step_topics_partner"
          }
        }
      ]
    },
    {
      id: "step_topics",
      question: "{{nickname}}, quais temas podemos te oferecer aqui na BPlen HUB?",
      fields: [
        {
          id: "topics",
          type: "choice",
          isMultiple: true, 
          cols: 2,
          label: "Temas de Interesse",
          options: [
            "Transição de Carreira",
            "Recolocação Profissional",
            "Liderança e Gestão",
            "Gestão de Tempo",
            "Desenvolvimento Humano Organizacional (DHO)",
            "Técnicas de Negociação",
            "Gestão Emocional",
            "Relacionamento Interpessoal",
            "Resolução de Conflitos",
            "Sucessão de Cargo",
            "Posicionamento Profissional",
            "Outros"
          ],
          randomize: true,
          required: true
          // Nota: O SurveyEngine precisará suportar múltipla escolha se quisermos manter paridade total.
        }
      ]
    },
    {
      id: "step_demand",
      question: "Porque você acredita que podemos te ajudar com os temas selecionados?",
      // Salto explicito: sem ele, a progressao linear cairia nos enunciados de
      // parceria, que vivem logo abaixo no arquivo.
      nextStepId: "step_origin",
      fields: [
        {
          id: "demand",
          type: "textarea",
          label: "Sua Expectativa",
          placeholder: "Descreva brevemente o que espera...",
          required: true
        }
      ]
    },

    // --- Ramo de PARCERIA DE NEGOCIOS ---
    // Mesmos campos (`topics`, `demand`), enunciados proprios. Converge de volta em
    // `step_origin`, que e' onde a indicacao e' capturada para todo mundo.
    {
      id: "step_topics_partner",
      question: "{{nickname}}, quais temas da BPlen mais conversam com a sua proposta de parceria?",
      nextStepId: "step_demand_partner",
      fields: [
        {
          id: "topics",
          type: "choice",
          isMultiple: true,
          cols: 2,
          label: "Temas da Parceria",
          options: [
            "Transição de Carreira",
            "Recolocação Profissional",
            "Liderança e Gestão",
            "Gestão de Tempo",
            "Desenvolvimento Humano Organizacional (DHO)",
            "Técnicas de Negociação",
            "Gestão Emocional",
            "Relacionamento Interpessoal",
            "Resolução de Conflitos",
            "Sucessão de Cargo",
            "Posicionamento Profissional",
            "Outros"
          ],
          randomize: true,
          required: true
        }
      ]
    },
    {
      id: "step_demand_partner",
      question: "Como você imagina essa parceria funcionando na prática?",
      nextStepId: "step_origin",
      fields: [
        {
          id: "demand",
          type: "textarea",
          label: "Sua Proposta",
          placeholder: "Conte brevemente o que você tem em mente...",
          required: true
        }
      ]
    },

    {
      id: "step_origin",
      question: "Como você nos conheceu?",
      fields: [
        {
          id: "origin",
          type: "choice",
          label: "Origem",
          // Apenas CANAIS ficam aqui. Nome de pessoa nunca — pessoa entra pelo
          // diretorio de parceiros (`Settings/PartnerDirectory`), injetado em tempo de
          // render por `withPartnerOriginOptions`. "Lisandra Lencina" era fixa aqui
          // desde antes do programa de parceiros; com a fundadora tambem cadastrada no
          // diretorio, a mesma opcao passou a existir em duas fontes e a resolucao por
          // nome no servidor a transformou, em silencio, em indicacao com comissao.
          // Ver BUG-124.
          options: [
            "Instagram",
            "LinkedIn",
            "TikTok",
            "Pesquisa do Google",
            "Indicação",
            "Outro"
          ],
          required: true
        }
      ]
    },
    {
      id: "step_tour",
      question: "Tudo certo! Queremos te apresentar a plataforma. Deseja fazer um tour guiado rápido ou prefere explorar sozinho?",
      fields: [
        {
          id: "wants_tour",
          type: "choice",
          label: "Opção",
          options: [
            "Sim, quero o tour guiado! 🚀",
            "Não, prefiro explorar sozinho."
          ],
          required: true
        }
      ]
    }
  ],
  analytics: {
    surveyId: "welcome_survey",
    domain: "ONBOARDING",
    context: "first_access",
    version: "2.0"
  },
  policy: {
    editable: false
  },
  submitLabel: "clique aqui para entrar"
};
