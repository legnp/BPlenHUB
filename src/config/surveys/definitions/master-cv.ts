import { SurveyConfig } from "@/types/survey";

/**
 * BPlen HUB — Survey Definition: Master CV 📑
 * Objetivo: Coletar histórico profissional detalhado e exportar como Word.
 */
export const masterCvSurvey: SurveyConfig = {
  id: "master_cv",
  kind: "survey",
  title: "Master CV",
  description: "Criação do Banco de Dados de Perfil Profissional",
  steps: [
    {
      id: "tela1_boas_vindas",
      question: "Preparação",
      description: "{{User_Nickname}}, te damos as boas vindas ao início da elaboração e revisão do seu perfil profissional!\n\n**Atenção:** Reserve de 20 a 30 minutos em um ambiente tranquilo para prosseguir. Os dados preenchidos ficam salvos somente com a conclusão total. Caso precise fechar a página durante o processo, ele será reiniciado.",
      nextLabel: "Ok, estou pronto para passar para a próxima tela",
      fields: []
    },
    {
      id: "tela2_explicacao",
      question: "O seu Banco de Dados Profissional",
      description: "{{User_Nickname}}, iniciaremos o processo criando o seu Master CV.\n\nEste será o seu banco de dados de perfil profissional. Ele te possibilitará compilar toda sua trajetória para facilitar a adaptação da sua apresentação profissional em qualquer demanda ou situação.\n\nPreencha cada campo with o máximo de detalhes possível. Ao final você receberá o seu Master CV em word, que você não enviará para ninguém.\n\nEle será exclusivo para a sua organização e auxílio para continuar avançando no processo e adaptação do seu LinkedIn, CV e demais meios e plataformas.",
      nextLabel: "Iniciar meu Master CV",
      fields: []
    },
    {
      id: "tela3_identificacao",
      question: "Identificação: Quem é você?",
      description: "Para CVs Não solicitamos foto, idade, estado civil ou CPF. Nos mercados do Brasil e do Chile (assim como em multinacionais), esses dados são considerados obsoletos e abrem margem para vieses e discriminação.",
      fields: [
        {
          id: "nome_completo",
          type: "text",
          label: "Qual é o seu Nome Completo?",
          required: true
        },
        {
          id: "localizacao",
          type: "text",
          label: "Onde você mora?",
          placeholder: "Digite apenas Cidade e Estado (ex: São Paulo, SP)",
          required: true
        },
        {
          id: "email_profissional",
          type: "text", // Usaremos "text" e não "email" nativo pois faremos a validação customizada no motor/docx
          label: "Qual o seu melhor E-mail Profissional?",
          placeholder: "nome.sobrenome@email.com",
          required: true
        },
        {
          id: "telefone",
          type: "text",
          label: "Qual o seu Telefone? (País + DDD + Número)",
          placeholder: "+55 11 99999-9999",
          required: true
        },
        {
          id: "linkedin",
          type: "text",
          label: "Qual é o link do seu perfil no LinkedIn?",
          placeholder: "Sua URL personalizada (sem números aleatórios no final)",
          required: true
        },
        {
          id: "portfolio",
          type: "text",
          label: "Você possui um Portfólio ou GitHub? Insira o link aqui.",
          required: false
        }
      ]
    },
    {
      id: "tela4_palavras_chave",
      question: "Palavras-Chave: Facilite recrutadores e robôs te localizarem.",
      fields: [
        {
          id: "hard_skills",
          type: "multi_select",
          label: "Hard Skills e Ferramentas",
          placeholder: "Quais softwares e ferramentas você domina? (ex: Excel, Power BI, Salesforce). Sempre que possível, escreva a sigla e o nome por extenso.",
          required: true
        },
        {
          id: "metodologias",
          type: "multi_select",
          label: "Metodologias e Jargões do seu Setor",
          placeholder: "Ex: Metodologia Ágil, Scrum, Lean Six Sigma, B2B, B2C. Da mesma forma, sempre que possível, escreva a sigla e o nome por extenso.",
          required: true
        }
      ]
    },
    {
      id: "tela5_resumo",
      question: "Resumo Profissional: Qual é a história da sua trajetória profissional?",
      description: "Escreva de 3 a 5 parágrafos. Conte sua história de forma coesa, destacando seu posicionamento, metodologias que domina e resultados que já alcançou.\n\n**Dicas:**\n• Conte sua história com começo, meio, fim e próximos passos;\n• Qual foi o maior desafio ou crise que pediram para você resolver em sua carreira? (Desafio-Ação-Resultado);\n• Como seus pares ou líderes descreveriam o seu \"superpoder\" ou principal diferencial técnico no dia a dia?;\n• Qual o contraste entre \"como a área era antes de você\" e \"como ela ficou depois\"?;\n• Se você tivesse que definir o impacto final do seu trabalho no negócio, qual seria?",
      fields: [
        {
          id: "resumo_profissional",
          type: "textarea",
          placeholder: "Escreva a sua história aqui...",
          required: true
        }
      ]
    },
    {
      id: "tela6_historico",
      question: "Histórico Profissional: Quais são os fatos e dados da sua trajetória profissional?",
      description: "Adicione as suas experiências. Lembre-se de não listar tarefas cotidianas, liste resultados quantificáveis. Para elaborar conquistas, use o framework:\n\n1) O que foi feito? + 2) Quais foram os resultados? + 3) Escopo + 4) Qual era a sua principal função? + 5) Como você executou essa função?\n\nExemplo: \"Redução de x% no tempo do processo X, liderando a implementação do software X\"",
      fields: [
        {
          id: "experiencias",
          type: "dynamic_list",
          secondaryLabel: "Adicionar Nova Experiência",
          subFields: [
            { id: "cargo", type: "text", label: "Qual era o seu Cargo?", required: true },
            { id: "empresa", type: "text", label: "Em qual Empresa?", required: true },
            { id: "periodo", type: "text", label: "Período (MM/AAAA a MM/AAAA ou Atual)", placeholder: "03/2022 a 05/2023", required: true },
            { id: "contexto", type: "textarea", label: "Contexto da Posição (Tamanho da empresa, equipe, cenário herdado)", required: true },
            { id: "conquistas", type: "textarea", label: "Conquistas (Liste usando o framework sugerido)", required: true }
          ]
        }
      ]
    },
    {
      id: "tela7_educacao",
      question: "Educação formal: Quais foram suas formações acadêmicas?",
      fields: [
        {
          id: "formacoes",
          type: "dynamic_list",
          secondaryLabel: "Adicionar Nova Formação",
          subFields: [
            { 
              id: "grau", 
              type: "choice", 
              label: "Grau de Formação", 
              options: ["Técnico", "Tecnólogo", "Bacharelado", "Licenciatura", "Especialização/Pós-graduação", "MBA", "Mestrado", "Doutorado", "Pós-doutorado"],
              required: true 
            },
            { id: "curso", type: "text", label: "Nome do Curso", required: true },
            { id: "instituicao", type: "text", label: "Instituição de Ensino", required: true },
            { id: "ano_conclusao", type: "text", label: "Ano de Conclusão (ou Previsão - MM/AAAA)", required: true },
            { id: "destaques", type: "textarea", label: "Destaques e Projetos (Opcional)", required: false }
          ]
        }
      ]
    },
    {
      id: "tela8_certificacoes",
      question: "Certificações e Projetos Extras",
      description: "Possui certificados, cursos relevantes ou trabalho voluntário que conectem com o seu objetivo de carreira?",
      fields: [
        {
          id: "certificacoes_projetos",
          type: "dynamic_list",
          secondaryLabel: "Adicionar Projeto/Certificação",
          subFields: [
            { id: "nome", type: "text", label: "Nome (do projeto/certificação)", required: true },
            { id: "instituicao", type: "text", label: "Instituição Emissora ou Local", required: true },
            { id: "data", type: "text", label: "Data de Conclusão (MM/AAAA)", required: true },
            { id: "objetivo", type: "textarea", label: "Objetivo Geral", required: true },
            { id: "conquistas", type: "textarea", label: "Conquistas e Resultados Quantificáveis", required: false }
          ]
        }
      ]
    },
    {
      id: "tela9_conclusao",
      question: "Tudo pronto!",
      description: "{{User_Nickname}}, o seu Master CV está criado.\n\nClique no botão abaixo para gerar o documento e fazer download. Ele será baixado como um arquivo Word (.docx) estruturado em uma coluna única, perfeito para extrair as partes importantes para candidaturas futuras e amigável para os robôs ATS.",
      nextLabel: "Quero meu Master CV", // Não exibe nativamente um campo export DOCX, mas usaremos onComplete
      fields: []
    }
  ],
  analytics: {
    surveyId: "master_cv",
    domain: "CONTEUDO",
    context: "master_cv",
    version: "1.0"
  },
  policy: {
    editable: true,
    allowReset: true
  },
  submitLabel: "Quero meu Master CV"
};
