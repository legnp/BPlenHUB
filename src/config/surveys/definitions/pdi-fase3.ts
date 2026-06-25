import { SurveyConfig } from "@/types/survey";

export const pdiFase3Survey: SurveyConfig = {
  id: "survey_pdi_fase3",
  kind: "survey",
  title: "Definição de metas e ciclos",
  description: "Definição de metas de curto prazo e ciclos",
  submitLabel: "Salvar e Avançar",
  analytics: {
    surveyId: "survey_pdi_fase3",
    domain: "SURVEY",
    context: "CAREER_PDI",
    tags: ["carreira", "pdi", "fase3"]
  },
  policy: {
    editable: true,
    allowReset: false
  },
  steps: [
    {
      id: "step_intro_fase3",
      question: "Definição de metas e ciclos",
      description: "Pensar no objetivo a longo prazo pode gerar procrastinação e/ou ansiedade.\nDecidir agir no que pode ser feito hoje, com o que já se tem agora, gera a química cerebral necessária para manter o movimento contínuo.",
      nextLabel: "Avançar",
      fields: [
        {
          id: "mini_meta_7_dias",
          type: "text",
          label: "Escreva qual é a ação mais simples, prática e totalmente ao seu alcance que você vai executar dentro dos próximos 7 dias para dar o primeiro passo real rumo ao seu objetivo central?",
          placeholder: "Ex: Na quarta-feira, às 14h, enviarei meu currículo otimizado para 5 vagas",
          required: true
        }
      ]
    },
    {
      id: "step_q1_b_ciclos",
      question: "Organizando ciclos",
      description: "{{User_Nickname}}, essa é só a primeira meta de muitas. No PDF do seu PDI, você terá mais oportunidades de estabelecer mais metas até alcançar seus objetivos.\n\nE para isso: defina uma única parada de 10 a 30 minutos, a cada 3, 7, 10 ou 15 dias para revisar as metas e estabelecer novas metas.",
      nextLabel: "Avançar",
      fields: [
        {
          id: "tempo_revisao",
          type: "dropdown",
          label: "Tempo de revisão",
          options: ["10 minutos", "15 minutos", "20 minutos", "25 minutos", "30 minutos"],
          required: true
        },
        {
          id: "frequencia_revisao",
          type: "dropdown",
          label: "Frequência da revisão",
          options: ["A cada 3 dias", "A cada 7 dias", "A cada 10 dias", "A cada 15 dias"],
          required: true
        }
      ]
    },
    {
      id: "step_q3_rede_apoio",
      question: "Rede de apoio",
      description: "O trabalho individual tem limites e o isolamento pode gerar esgotamento. Por isso, para um PDI ter sucesso é importante contar com o apoio de alguém para dividir a carga.",
      nextLabel: "Avançar",
      fields: [
        {
          id: "nome_rede_apoio",
          type: "text",
          label: "Escolha uma pessoa de sua extrema confiança (um mentor, colega de trabalho, sócio, amigo pessoal, ou quem você preferir), a quem você possa compartilhar o seu objetivo de carreira e pedir para que te apoie durante a jornada. Qual é o nome dessa pessoa?",
          placeholder: "Nome da pessoa",
          required: true
        },
        {
          id: "mensagem_blindagem",
          type: "textarea",
          label: "Quando o seu estresse aumentar e seus freios começarem a te autossabotar, o que você autoriza essa pessoa te dizer ou fazer para te impulsionar, sem que você reaja na defensiva?",
          placeholder: "Eu autorizo que ela...",
          required: true,
          dependsOn: "nome_rede_apoio"
        }
      ]
    }
  ]
};
