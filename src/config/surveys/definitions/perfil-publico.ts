import { SurveyConfig } from "@/types/survey";

/**
 * BPlen HUB — Survey Definition: Perfil Profissional Público
 * Objetivo: Auxiliar o usuário a atualizar e otimizar suas páginas profissionais online (LinkedIn, Catho, etc.)
 */
export const perfilProfissionalPublicoSurvey: SurveyConfig = {
  id: "perfil_profissional_publico",
  kind: "survey",
  title: "Perfil Profissional Público",
  description: "Otimização das páginas profissionais online (LinkedIn, Catho, etc.)",
  submitLabel: "Avançar para o Módulo: Preparação para Entrevistas, Pitches e Networking",
  analytics: {
    surveyId: "perfil_profissional_publico",
    domain: "CONTEUDO",
    context: "perfil_profissional_publico",
    version: "1.0"
  },
  policy: {
    editable: true,
    allowReset: true
  },
  steps: [
    {
      id: "tela1_boas_vindas",
      question: "{{User_Nickname}}, chegou a hora de mostrar o seu perfil profissional ao mercado!",
      description: "Você já construiu o Master CV com todo seu histórico profissional, e elaborou o CV Focado para a posição de {{cv_focado.pdi_posicao_target}}. Agora, vamos pegar esse documento e usá-lo para atualizar as suas páginas profissionais online.\n\nNesta etapa, não vamos inventar nada novo. Vamos apenas copiar, colar e adaptar o conteúdo do seu CV Focado para os algoritmos do LinkedIn, da Catho e dos sistemas de vagas (Gupy, Workday, etc.).\n\nReserve de 20 a 30 minutos em um ambiente tranquilo para prosseguir.\nOs dados preenchidos ficam salvos somente com a conclusão total.\nCaso precise fechar a página durante o processo, ele será reiniciado.",
      nextLabel: "Estou com tudo pronto! Podemos continuar!",
      fields: [
        {
          id: "boas_vindas_check1",
          type: "checkbox",
          label: "Entendido! Já abri meu CV Focado e minhas plataformas em outra aba. Podemos começar!",
          required: true
        }
      ]
    },
    {
      id: "tela2_headlines",
      question: "Como você quer ser encontrado?",
      description: "{{User_Nickname}}, o título (Headline) é o campo de maior impacto para os motores de busca. Vamos ajustá-lo passo a passo.",
      fields: [
        {
          id: "headline_consulta",
          type: "cv_headline_copier",
          required: false
        },
        {
          id: "headline_check1",
          type: "checkbox",
          label: "Copiei minha headline!",
          required: true
        },
        {
          id: "headline_desc2",
          type: "info",
          description: "Passo 2: Adaptando sua headline para o LinkedIn.\n\nNo LinkedIn, os recrutadores buscam por jargões e ferramentas. Cole a sua headline lá e garanta que ela tenha a estrutura:\n\n**Cargo Alvo | Especialidade 1 | Ferramenta que domina.**",
          required: false,
          dependsOn: "headline_check1"
        },
        {
          id: "headline_check2",
          type: "checkbox",
          label: "Atualizei e salvei meu título no LinkedIn!",
          required: true,
          dependsOn: "headline_check1"
        },
        {
          id: "headline_cbo",
          type: "cbo_search_dropdown",
          label: "Passo 3: Adaptando para Catho e Plataformas Regionais",
          description: "Na Catho, os filtros são rígidos. Evite nomes em inglês se a vaga for de uma empresa nacional. Traduza para a CBO padrão (Ex: se no LinkedIn você usou 'Customer Success', na Catho use 'Analista de Relacionamento'). Para te ajudar, consulte aqui a lista das CBOs mais populares e a que posição ela equivale em inglês.",
          required: false,
          dependsOn: "headline_check2"
        },
        {
          id: "headline_check3",
          type: "checkbox",
          label: "Ajustei meu título de forma padronizada nas outras plataformas!",
          required: true,
          dependsOn: "headline_check2"
        }
      ]
    },
    {
      id: "tela3_sobre",
      question: "A sua narrativa em primeira pessoa",
      description: "Vamos atualizar a seção 'Sobre' do seu LinkedIn e os campos de 'Objetivo/Resumo' dos portais de vagas.",
      fields: [
        {
          id: "resumo_consulta",
          type: "cv_resumo_copier",
          required: false
        },
        {
          id: "resumo_check1",
          type: "checkbox",
          label: "Copiei o texto do meu resumo!",
          required: true
        },
        {
          id: "resumo_desc2",
          type: "info",
          description: "Passo 2: Toque pessoal no LinkedIn:\n\nCole o texto na seção 'Sobre' do LinkedIn.\n\nDica: Deixe o tom mais acolhedor e em primeira pessoa. Ex: 'Focado na transição para {{cv_focado.senioridade_pretendida}}, tenho dedicado minha carreira a...'. E lembre-se de colocar seu e-mail no final do texto ou outro meio para entrarem em contato com você diretamente. Isso aumentará suas chances de ser acionado. (Obs: esse dado é opcional, e recomendamos que utilize um contato que possa ser público/amplamente divulgado.)",
          required: false,
          dependsOn: "resumo_check1"
        },
        {
          id: "resumo_check2",
          type: "checkbox",
          label: "Colei e personalizei meu 'Sobre' no LinkedIn!",
          required: true,
          dependsOn: "resumo_check1"
        },
        {
          id: "resumo_desc3",
          type: "info",
          description: "Passo 3: Gupy, Catho e ATS\n\nDireto ao ponto para os portais de vagas tradicionais, cole o texto original do seu CV focado. Mantenha o formato estritamente profissional, técnico e sem emojis.",
          required: false,
          dependsOn: "resumo_check2"
        },
        {
          id: "resumo_check3",
          type: "checkbox",
          label: "Atualizei meu resumo nos portais de emprego!",
          required: true,
          dependsOn: "resumo_check2"
        }
      ]
    },
    {
      id: "tela4_competencias",
      question: "Falando a língua dos Robôs (SEO)",
      description: "{{User_Nickname}}, vamos aplicar as principais palavras-chaves para facilitar a busca por robôs e profissionais humanos.",
      fields: [
        {
          id: "keywords_consulta",
          type: "cv_keywords_copier",
          required: false
        },
        {
          id: "keywords_check1",
          type: "checkbox",
          label: "Revisei minhas palavras-chave principais!",
          required: true
        },
        {
          id: "keywords_desc2",
          type: "info",
          description: "Passo 2: Fixando no LinkedIn\n\nVá até a seção 'Competências' do LinkedIn. Adicione as palavras listadas e fixe (pin) as 3 principais no topo do seu perfil.\n\nDica: Recomendamos fazer uma limpeza de possíveis palavras-chave já contidas no seu perfil para evitar poluição, principalmente por termos que não tenham conexão com a posição pretendida.",
          required: false,
          dependsOn: "keywords_check1"
        },
        {
          id: "keywords_check2",
          type: "checkbox",
          label: "Competências adicionadas e fixadas no LinkedIn!",
          required: true,
          dependsOn: "keywords_check1"
        },
        {
          id: "keywords_desc3",
          type: "info",
          description: "Passo 3: Espalhando a palavra\n\nGaranta que as palavras-chave de ferramentas e metodologias (Ex: Metodologia Ágil, Salesforce, Power BI) também estejam citadas dentro das descrições das suas experiências. O robô cruza a competência com o local onde você a aplicou! Aplique isso no LinkedIn e nas demais plataformas.",
          required: false,
          dependsOn: "keywords_check2"
        },
        {
          id: "keywords_check3",
          type: "checkbox",
          label: "Palavras-chave distribuídas nas minhas experiências!",
          required: true,
          dependsOn: "keywords_check2"
        }
      ]
    },
    {
      id: "tela5_upload",
      question: "O documento certo para a plataforma certa",
      description: "{{User_Nickname}}, o formato do seu arquivo importa muito. Vamos submetê-lo corretamente para não quebrar a leitura dos robôs.",
      fields: [
        {
          id: "exporter_pdf",
          type: "cv_focado_exporter",
          label: "Passo 1: Candidatura Simplificada no LinkedIn",
          description: "Exporte seu CV Focado em PDF (baseado em texto). Anexe-o no seu perfil na seção 'Em Destaque' e use-o nas vagas de 'Candidatura Simplificada' (Easy Apply).",
          required: false,
          options: ["pdf"]
        },
        {
          id: "upload_check1",
          type: "checkbox",
          label: "PDF gerado e anexado no LinkedIn!",
          required: true
        },
        {
          id: "exporter_word",
          type: "cv_focado_exporter",
          label: "Passo 2: Plataformas ATS Complexas (Gupy, Workday, Kenoby)",
          description: "Estes sistemas usam robôs de leitura rígidos. Envie preferencialmente o formato .DOCX (Word) ou um PDF 100% limpo (sem imagens ou colunas duplas).",
          required: false,
          dependsOn: "upload_check1",
          options: ["word"]
        },
        {
          id: "upload_check2",
          type: "checkbox",
          label: "Upload feito nas plataformas de ATS.",
          required: true,
          dependsOn: "upload_check1"
        },
        {
          id: "upload_check3",
          type: "checkbox",
          label: "Arquivo guardado para futuras aplicações em plataformas de ATS.",
          required: true,
          dependsOn: "upload_check1"
        },
        {
          id: "upload_desc3",
          type: "info",
          description: "Passo 3: Portais de Formulário (Catho, Vagas.com)\n\nA regra aqui é preencher os formulários deles copiando e colando seus bullet points do CV Focado.\n\nAtenção: Se atente a campos de localização e pretensão salarial, pois eles são filtros eliminatórios automáticos.",
          required: false,
          dependsOn: "upload_check2"
        },
        {
          id: "upload_check4",
          type: "checkbox",
          label: "Entendi as regras de preenchimento manual e filtros eliminatórios!",
          required: true,
          dependsOn: "upload_check2"
        }
      ]
    },
    {
      id: "tela6_fotos",
      question: "Uma imagem vale mais que mil palavras, {{User_Nickname}}!",
      description: "Anteriormente, não incluímos foto nos seus currículos (para evitar vieses e eliminação em sistemas ATS). Porém, nas plataformas online como o LinkedIn e a Catho, a foto é altamente recomendável e gera muito mais visitas e credibilidade ao seu perfil.\n\nVamos garantir que sua imagem transmita o mesmo profissionalismo do seu texto!",
      fields: [
        {
          id: "photo_guide",
          type: "cv_photo_guide",
          label: "Passo 1: A Foto de Perfil",
          description: "Sua foto deve ser focada no seu rosto (ocupando cerca de 75% do espaço).\n\nO que fazer: Escolha um fundo neutro (liso), use boa iluminação (preferencialmente luz natural), vista roupas condizentes com a {{cv_focado.pdi_empresa_target}} (ou seu setor) e mantenha uma expressão natural e confiante.\n\nO que evitar: Nada de selfies com ângulos forçados, fotos recortadas de grupos, roupas de festa ou fundos com muita distração.\n\nDica: Inspire-se nos exemplos a seguir.",
          required: false
        },
        {
          id: "photo_check1",
          type: "checkbox",
          label: "Minha foto de perfil está atualizada, profissional e alinhada ao meu objetivo!",
          required: true
        },
        {
          id: "photo_desc2",
          type: "info",
          description: "Passo 2: Imagem de Capa (O Outdoor da sua Marca Profissional)\n\nNão deixe o fundo cinza padrão do LinkedIn! Utilize a imagem de capa para reforçar a sua marca pessoal e contar um pouco mais sobre quem você é.\n\nO que fazer: Adicione uma imagem em alta resolução que reflita o seu setor de atuação, sua paixão profissional, ou uma foto sua em ação (dando uma palestra, em um projeto, etc.). Você pode usar ferramentas gratuitas como o Canva para criar uma capa com a sua proposta de valor escrita.",
          required: false,
          dependsOn: "photo_check1"
        },
        {
          id: "photo_check2",
          type: "checkbox",
          label: "Atualizei minha imagem de capa e meu perfil não tem mais o fundo padrão!",
          required: true,
          dependsOn: "photo_check1"
        },
        {
          id: "photo_desc3",
          type: "info",
          description: "Passo 3: Missão Cumprida nas Plataformas Digitais!\n\nSensacional, {{User_Nickname}}! As suas páginas profissionais online estão prontas! Blindadas contra erros de algoritmos e visualmente impecáveis. O seu perfil agora reflete com exatidão a sua capacidade para assumir a posição de {{cv_focado.pdi_posicao_target}}.\n\nPorém, ter um perfil campeão e um currículo de alto impacto é apenas a preparação do palco. Agora que os headhunters e empresas vão te encontrar e te ligar, você precisa saber o que falar.",
          required: false,
          dependsOn: "photo_check2"
        },
        {
          id: "photo_check3",
          type: "checkbox",
          label: "Tudo pronto! Quero preparar meu pitch de vendas para entrevistas e reuniões!",
          required: true,
          dependsOn: "photo_check2"
        }
      ]
    }
  ]
};
