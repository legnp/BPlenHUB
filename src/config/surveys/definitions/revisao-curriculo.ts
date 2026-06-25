import { SurveyConfig } from "@/types/survey";

/**
 * BPlen HUB — Survey Definition: Revisão de Currículo 🧬📄
 * Objetivo: Análise guiada e melhoria prática do CV (Resumo e Formação).
 */
export const revisaoCurriculoSurvey: SurveyConfig = {
  id: "revisao_curriculo",
  kind: "survey",
  title: "Revisão de Currículo",
  description: "Otimização estratégica",
  steps: [
    {
      id: "intro",
      question: "Revisão de Currículo",
      description: "{{User_Nickname}}, para iniciar a revisão do seu currículo, siga as seguintes orientações:\n\na) Serão apresentadas perguntas específicas sobre o seu currículo;\nb) Você avaliará o quanto o seu currículo está alinhado com o ideal e implantará uma melhoria prática.",
      nextLabel: "Vamos iniciar",
      fields: []
    },
    {
      id: "check_resumo",
      question: "{{User_Nickname}}, como está o resumo do seu CV?",
      fields: [
        {
          id: "has_resumo",
          type: "choice",
          label: "Status do Resumo",
          options: [
            { label: "Meu CV tem resumo", value: "sim" },
            { label: "Meu CV não tem resumo", value: "nao" }
          ],
          required: true,
          logic: {
            "sim": "step_resumo_existente",
            "nao": "step_resumo_novo"
          }
        }
      ]
    },
    {
        id: "step_resumo_existente",
        question: "Como está o resumo do seu CV?",
        description: "Copie e cole-o no espaço abaixo.",
        nextStepId: "step_exemplo_resumo",
        fields: [
          {
            id: "resumo_atual",
            type: "textarea",
            placeholder: "Cole seu resumo aqui...",
            required: true
          }
        ]
    },
    {
        id: "step_resumo_novo",
        question: "Vamos criar o seu resumo?",
        description: "Use o campo abaixo para elaborar a primeira versão do seu resumo profissional.",
        nextStepId: "step_exemplo_resumo",
        fields: [
          {
            id: "resumo_criado",
            type: "textarea",
            placeholder: "Escreva seu novo resumo aqui...",
            required: true
          }
        ]
    },
    {
      id: "step_exemplo_resumo",
      question: "Veja, este é um exemplo de como um bom resumo funciona:",
      description: "\"Profissional com mais de X anos de experiência em [Área], especialista em [Skill]. Resultados comprovados em [Projeto], reduzindo custos em Y% e liderando equipes de Z pessoas. Foco atual em [Objetivo].\"",
      fields: [
        {
          id: "alinhamento",
          type: "likert",
          label: "{{User_Nickname}}, o quanto o seu resumo atual está alinhado com o exemplo anterior?",
          options: ["1 - Nada Alinhado", "2", "3", "4", "5 - Totalmente Alinhado"],
          required: true,
          logic: {
            "1 - Nada Alinhado": "step_ajuste_resumo",
            "2": "step_ajuste_resumo",
            "3": "step_ajuste_resumo",
            "4": "step_ajuste_resumo",
            "5 - Totalmente Alinhado": "step_formacao"
          }
        }
      ]
    },
    {
      id: "step_ajuste_resumo",
      question: "Melhoria Prática 🧬",
      description: "Use o campo abaixo para deixar o seu resumo alinhadíssimo com as melhores práticas demonstradas.",
      fields: [
        {
          id: "resumo_otimizado",
          type: "textarea",
          placeholder: "Escreva a versão final e otimizada do seu resumo...",
          required: true
        }
      ]
    },
    {
      id: "step_formacao",
      question: "{{User_Nickname}}, como estão as descrições das suas formações acadêmicas no CV?",
      fields: [
        {
          id: "descricao_formacao",
          type: "textarea",
          label: "Descrição da Formação",
          placeholder: "Descreva como as formações estão listadas no seu CV...",
          required: true
        }
      ]
    }
  ],
  analytics: {
    surveyId: "revisao_curriculo",
    domain: "CONTEUDO",
    context: "mentoria_cv",
    version: "1.0"
  },
  policy: {
    editable: true,
    allowReset: true
  },
  submitLabel: "Finalizar Revisão"
};
