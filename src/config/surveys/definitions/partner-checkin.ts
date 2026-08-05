import { SurveyConfig } from "@/types/survey";

/**
 * BPlen HUB — Survey: Check-in de Parceria (V1.0)
 *
 * Classificacao (CLAUDE.md — SURVEY_GLOBAL.md vs FORMS_GLOBAL.md): **SURVEY**.
 * A parada de Check-in do parceiro e' narrativa guiada (um enunciado por vez), de
 * resposta unica e nao editavel: o objetivo e' ACOLHER e INFORMAR — conformidade com a
 * LGPD, onde encontrar os termos e a politica de privacidade, e os acordos essenciais da
 * parceria — registrando a ciencia de cada bloco. Nao alimenta cadastro operacional.
 *
 * O cadastro em si (dados pessoais, empresa, faturamento) e' a parada IRMA desta,
 * classificada como FORM: `partner_dados_cadastrais`.
 */
export const partnerCheckInSurvey: SurveyConfig = {
  id: "partner_check_in",
  kind: "survey",
  title: "Check-in de Parceria",
  description: "Boas-vindas, conformidade e acordos essenciais da parceria",
  submitLabel: "Concluir Check-in",
  analytics: {
    surveyId: "partner_check_in",
    domain: "SURVEY",
    context: "PARTNER_JOURNEY",
    version: "1.0",
    tags: ["parceria", "onboarding", "lgpd"]
  },
  policy: {
    editable: false,
    allowReset: false
  },
  steps: [
    {
      id: "q0_boas_vindas",
      question: "{User_Nickname}, que bom ter você como parceiro da BPlen!",
      description:
        "Este check-in é rápido e serve para deixar tudo claro entre nós desde o começo: como cuidamos dos seus dados, onde ficam os documentos que regem a parceria e quais são os combinados essenciais.\n\nLeva menos de cinco minutos e não precisa de nenhum material em mãos.",
      fields: [
        {
          id: "checkin_start",
          type: "buttons",
          required: true,
          options: ["Vamos começar"]
        }
      ]
    },
    {
      id: "q1_lgpd",
      question: "Primeiro, o cuidado com os seus dados.",
      description:
        "A BPlen segue a Lei Geral de Proteção de Dados (LGPD). Na prática, isso significa que coletamos apenas o que é necessário para operar a parceria, guardamos esses dados de forma protegida e não os compartilhamos com terceiros para finalidades alheias a ela.\n\nVocê pode, a qualquer momento, pedir acesso aos seus dados, corrigi-los ou solicitar a exclusão — basta falar com a gente pelos canais de atendimento.",
      fields: [
        {
          id: "lgpd_ciencia",
          type: "buttons",
          required: true,
          options: ["Entendi como meus dados são tratados"]
        }
      ]
    },
    {
      id: "q2_documentos",
      question: "Onde encontrar os documentos, sempre que precisar.",
      description:
        "Os Termos de Uso e a Política de Privacidade ficam disponíveis a qualquer hora no rodapé da plataforma e nas páginas /termos e /privacidade. Os documentos específicos da sua parceria — incluindo o termo que você vai assinar na próxima parada — ficam guardados na sua área de parceiro, em Meus Contratos.\n\nSempre que um documento for atualizado, avisamos você antes de pedir um novo aceite.",
      fields: [
        {
          id: "documentos_ciencia",
          type: "buttons",
          required: true,
          options: ["Sei onde encontrar os documentos"]
        }
      ]
    },
    {
      id: "q3_acordos",
      question: "Os combinados essenciais da parceria.",
      description:
        "São quatro, e todos valem nos dois sentidos:\n\n1. Indicações são registradas quando a pessoa indicada informa você como origem no primeiro acesso dela à plataforma.\n2. A sua comissão é um percentual fixo, combinado com você e aplicado sobre os serviços efetivamente adquiridos pelas pessoas que você indicou.\n3. Os repasses seguem ciclos mensais, com recibo ou nota emitida por você e comprovante de pagamento disponibilizado pela BPlen.\n4. Informações sobre clientes indicados são confidenciais e existem para acompanhar a parceria — não para prospecção paralela.",
      fields: [
        {
          id: "acordos_ciencia",
          type: "buttons",
          required: true,
          options: ["Estou de acordo com os combinados"]
        }
      ]
    },
    {
      id: "q4_expectativa",
      question: "Para fecharmos: o que você espera desta parceria?",
      description:
        "Sua resposta ajuda a gente a conduzir a parceria do jeito que faz sentido para você. Não existe resposta certa.",
      fields: [
        {
          id: "expectativa_parceria",
          type: "textarea",
          required: true,
          placeholder: "Escreva em poucas linhas o que você espera..."
        }
      ]
    },
    {
      id: "q5_canal",
      question: "E qual o melhor canal para falarmos com você no dia a dia?",
      fields: [
        {
          id: "canal_preferido",
          type: "choice",
          label: "Canal preferido",
          options: ["E-mail", "WhatsApp", "Ligação", "Mensagem pela plataforma"],
          required: true
        }
      ]
    }
  ]
};
