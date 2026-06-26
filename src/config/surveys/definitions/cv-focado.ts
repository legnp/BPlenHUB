import { SurveyConfig } from "@/types/survey";

/**
 * BPlen HUB — Survey Definition: CV Focado
 * Objetivo: Adaptar o Master CV para o objetivo target de posicionamento profissional.
 */
export const cvFocadoSurvey: SurveyConfig = {
  id: "cv_focado",
  kind: "survey",
  title: "CV Focado",
  description: "Adaptação do Master CV para Posicionamento Profissional",
  submitLabel: "Exportar meu CV focado",
  analytics: {
    surveyId: "cv_focado",
    domain: "CONTEUDO",
    context: "cv_focado",
    version: "1.0"
  },
  policy: {
    editable: true,
    allowReset: true
  },
  steps: [
    {
      id: "tela1_boas_vindas",
      question: "Preparação",
      description: "{{User_Nickname}}, com o seu Master CV pronto, agora podemos começar a adaptá-lo para a sua estratégia de posicionamento profissional.\n\nA primeira adaptação será para o CV focado.\n\nEste é o currículo curto focado no seu objetivo atual de carreira. Nesta etapa você não adicionará novas informações sobre a sua trajetória profissional, e sim, analisará e selecionará o conteúdo que mais se conecta com o seu próximo objetivo profissional pretendido ({{objetivo_frase}}).\n\nReserve de 20 a 30 minutos em um ambiente tranquilo para prosseguir. Os dados preenchidos ficam salvos somente com a conclusão total. Caso precise fechar a página durante o processo, ele será reiniciado.",
      nextLabel: "Estou com tudo pronto! Podemos continuar!",
      fields: []
    },
    {
      id: "tela2_posicao_foco",
      question: "Qual é a posição em foco?",
      description: "Para organizar o seu CV focado em um documento de alto impacto, precisamos entender exatamente qual é a posição profissional que você está focando hoje. Responda às perguntas abaixo para que possamos adaptar a sua estratégia.",
      fields: [
        {
          id: "senioridade_atual",
          type: "dropdown",
          label: "Qual é a sua Senioridade Atual?",
          options: ["Júnior", "Pleno", "Sênior", "Líder/C-Level", "Dono do meu negócio"],
          required: true
        },
        {
          id: "senioridade_pretendida",
          type: "dropdown",
          label: "Qual é a Senioridade Pretendida nesta transição?",
          options: ["Júnior", "Pleno", "Sênior", "Líder/C-Level", "Dono do meu negócio"],
          required: true,
          dependsOn: "senioridade_atual"
        },
        {
          id: "objetivo_atualmente",
          type: "choice",
          label: "O que você deseja atualmente?",
          options: [
            "Quero me aplicar para uma vaga específica.",
            "Me aplicar para várias vagas no mesmo segmento/área.",
            "Transição interna / Promoção na empresa atual.",
            "Me posicionar para o meu próprio negócio.",
            "Captar novos clientes ou investidores."
          ],
          required: true,
          dependsOn: "senioridade_pretendida"
        },
        {
          id: "pdi_posicao_target",
          type: "text",
          label: "Qual é o nome exato da posição que você deseja?",
          placeholder: "Ex: Diretor de Marketing, Gerente de Projetos...",
          required: true,
          dependsOn: "objetivo_atualmente"
        },
        {
          id: "pdi_empresa_target",
          type: "text",
          label: "Qual é o nome da empresa desejada?",
          placeholder: "Nome da empresa...",
          description: "Caso tenha mais de uma empresa em foco indique o nome da que você tem preferência.",
          required: true,
          dependsOn: "pdi_posicao_target"
        },
        {
          id: "descricao_vaga",
          type: "textarea",
          label: "Deixe aqui uma breve descrição da vaga ou as principais responsabilidades exigidas.",
          placeholder: "Ex: Liderança de times ágeis, gestão de orçamento...",
          description: "Caso você queira copiar e colar aqui a descrição exata da vaga, fique à vontade.",
          required: true,
          dependsOn: "pdi_empresa_target"
        },
        {
          id: "cultura_empresa_target",
          type: "textarea",
          label: "O que você já sabe sobre a cultura, o sistema organizacional ou o momento atual da {{pdi_empresa_target}}?",
          placeholder: "Como você descreveria o ambiente e desafios da empresa...",
          description: "Eles estão passando por uma reestruturação (turnaround)? Estão escalando rápido (startup)? É uma cultura tradicional ou inovadora? Qual problema central o profissional na cadeira de {{pdi_posicao_target}} terá que resolver?",
          required: true,
          dependsOn: "descricao_vaga"
        }
      ]
    },
    {
      id: "tela3_dados_contato",
      question: "Seus dados de apresentação",
      description: "Confirme seus dados para a aplicação na {{pdi_empresa_target}}.\n\nLembre-se: para o mercado corporativo padrão do Brasil, Chile e multinacionais de tecnologia, nunca inclua foto, estado civil ou idade para evitar vieses. Caso a {{pdi_empresa_target}} seja muito tradicional em mercados como México ou Argentina, a foto pode ser esperada, mas inclua somente se solicitado.",
      fields: [
        {
          id: "contato_filtrado",
          type: "cv_contact_filter",
          required: true
        }
      ]
    },
    {
      id: "tela4_resumo_profissional",
      question: "O seu discurso para a posição {{pdi_posicao_target}}",
      description: "A primeira frase do seu resumo deve conter o nome da posição desejada {{pdi_posicao_target}} e a sua principal proposta de valor (o que você resolve/entrega).\n\nLembre-se, neste momento você não precisa criar nada, basta somente ajustar o texto existente.",
      fields: [
        {
          id: "resumo_focado",
          type: "cv_resumo_editor",
          required: true
        }
      ]
    },
    {
      id: "tela5_historico_profissional",
      question: "Contando como você gera valor para {{pdi_empresa_target}}",
      description: "Selecione as empresas e as conquistas do seu Master CV que irão para o currículo focado.\n\nAnalisando a descrição da posição {{pdi_posicao_target}}, a empresa busca alguém capaz de resolver dores específicas. Não exporte toda a sua vida profissional, escolha apenas as conquistas que conectem com essas dores.",
      fields: [
        {
          id: "experiencias_filtradas",
          type: "cv_experience_filter",
          required: true
        }
      ]
    },
    {
      id: "tela6_educacao_projetos",
      question: "Demonstrando as suas bases e autoridade",
      description: "Quais dessas formações agregam valor direto à {{pdi_posicao_target}}? O que você adquiriu nestes lugares que você pode utilizar nessa oportunidade?\n\nDica: Cursos ou projetos muito antigos ou fora do segmento da {{pdi_empresa_target}} podem ser ocultados para economizar espaço e manter o recrutador focado no que importa.",
      fields: [
        {
          id: "educacao_projetos_filtrados",
          type: "cv_education_filter",
          required: true
        }
      ]
    },
    {
      id: "tela7_validacao_exportacao",
      question: "{{User_Nickname}}, tudo pronto para o seu posicionamento para a posição {{pdi_posicao_target}}?",
      description: "O seu currículo foi cuidadosamente adaptado para focar na sua passagem de {{senioridade_atual}} para {{senioridade_pretendida}}.\n\nAntes de exportar o arquivo Word limpo (essencial para quebra de leitura de robôs ATS), revise seu checklist:",
      fields: [
        {
          id: "conclusao_focada",
          type: "cv_conclusao_info",
          required: false
        }
      ]
    }
  ]
};
