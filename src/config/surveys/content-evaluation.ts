import { SurveyConfig } from "@/types/survey";

/**
 * Configuração: Avaliação de Conteúdo (Survey_Global 🧬)
 */
export const contentEvaluationSurveyConfig: SurveyConfig = {
  id: "content_evaluation",
  kind: "survey",
  title: "Avaliação de Conteúdo BPlen",
  steps: [
    {
      id: "feedback",
      question: "Sua opinião ajuda a melhorar o editorial BPlen",
      fields: [
        {
          id: "rating",
          type: "scale",
          label: "Nota Likert (1-5)",
          min: 1,
          max: 5,
          required: true
        },
        {
          id: "comment",
          type: "textarea",
          label: "Comentário (Opcional)",
          placeholder: "Algo mais para compartilhar?"
        }
      ]
    }
  ],
  analytics: {
    surveyId: "content_evaluation",
    domain: "CONTEUDO",
    version: "1.0"
  },
  policy: {
    editable: true,
    allowReset: true
  },
  submitLabel: "Salvar Avaliação"
};
