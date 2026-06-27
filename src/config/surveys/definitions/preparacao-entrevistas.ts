import { SurveyConfig } from "@/types/survey";

/**
 * BPlen HUB — Survey Definition: Preparação para Entrevistas e Networking
 */
export const preparacaoEntrevistasSurvey: SurveyConfig = {
  id: "preparacao_entrevistas_networking",
  kind: "survey",
  title: "Preparação para Entrevistas e Reuniões de Networking",
  description: "Preparação do seu discurso e interações profissionais.",
  submitLabel: "Concluir o Módulo e Aguardar a minha Consultoria Final de Posicionamento!",
  analytics: {
    surveyId: "preparacao_entrevistas_networking",
    domain: "CONTEUDO",
    context: "preparacao_entrevistas_networking",
    version: "1.0"
  },
  policy: {
    editable: true,
    allowReset: true
  },
  steps: [
    {
      id: "tela1_boas_vindas",
      question: "Preparação para Entrevistas e Reuniões de Networking",
      description: "Olá {{User_Nickname}}! Você já construiu o Master CV (a central de dados da sua história profissional), elaborou o CV Focado (para mirar exatamente onde você deseja chegar) e estruturou seu perfil profissional nas plataformas digitais. Agora, focaremos na preparação do seu discurso e interações profissionais.\n\nReserve de 20 a 30 minutos em um ambiente tranquilo para prosseguir.\nOs dados preenchidos ficam salvos somente com a conclusão total.\nCaso precise fechar a página durante o processo, ele será reiniciado.",
      nextLabel: "Vamos lá, estou com tudo pronto!",
      fields: []
    },
    {
      id: "tela2_alinhamentos",
      question: "Alinhamentos gerais",
      description: "A preparação de roteiros de fala é essencial para quem busca crescimento na carreira. Mas {{User_Nickname}}, note que um bom roteiro não é um texto decorado que deixa o discurso engessado, e sim um guia estruturado em pautas (tópicos) com começo, meio e fim. Ele serve como sua âncora e permite a escuta ativa, a adaptação do discurso, e a espontaneidade nas conversas profissionais.\n\nPense no roteiro como pequenos checkpoints essenciais para uma conversa de qualidade.\n\nAntes de começarmos, vale um importante alerta:\n{{alerta_senioridade}}",
      fields: [
        {
          id: "alinhamento_check1",
          type: "checkbox",
          label: "Alinhamento compreendido. Tudo pronto para construir meus roteiros!",
          required: true
        }
      ]
    },
    {
      id: "tela3_pitch",
      question: "O seu posicionamento em 60 segundos",
      description: "{{User_Nickname}}, o Pitch é a sua resposta estruturada para a pergunta: \"Fale sobre você\". Ele deve ser curto, direto e focado em como você agrega valor para a posição de {{cv_focado.pdi_posicao_target}}.",
      fields: [
        {
          id: "pitch_desc1",
          type: "info",
          description: "Passo 1: Escrevendo o Pitch\n\nElabore ao menos 3 tópicos para 3 problemas diferentes, conte com o apoio do framework ABT.\n\nLegenda do Framework: A estrutura ABT (And, But, Therefore - E, Mas, Portanto) é um modelo de comunicação que cria contexto (E), introduz uma tensão ou problema (Mas) e apresenta a resolução operacional que você oferece (Portanto).\n\nDica: Para cada tópico aplique o modelo, conforme sua senioridade:\n{{exemplo_abt}}",
          required: false
        },
        {
          id: "pitch_pautas",
          type: "textarea",
          label: "Escreva seu Pitch em tópicos.",
          placeholder: "Digite seus tópicos...",
          required: true
        },
        {
          id: "pitch_check1",
          type: "checkbox",
          label: "Pitch elaborado em pautas!",
          required: true
        },
        {
          id: "pitch_desc2",
          type: "info",
          description: "Passo 2: Escuta e Calibração\n\nA melhor forma de não soar mecanizado é ouvir a própria voz. Leia seu pitch em voz alta, de forma conversacional. Se a fala não fluir naturalmente, reescreva de forma mais direta e confortável para você.\n\nAo falar seu pitch em voz alta você não precisa usar as palavras exatas, apenas seguir a estrutura das pautas.\nUtilize o espaço abaixo para gravar a sua fala e se escutar...",
          required: false,
          dependsOn: "pitch_check1"
        },
        {
          id: "pitch_audio",
          type: "cv_audio_recorder",
          required: false,
          dependsOn: "pitch_check1"
        },
        {
          id: "pitch_check2",
          type: "checkbox",
          label: "Gravei, escutei e ajustei meu tom de voz. O discurso soa natural e alinhado ao meu objetivo!",
          required: true,
          dependsOn: "pitch_check1"
        }
      ]
    },
    {
      id: "tela4_entrevistas",
      question: "Estruturando a conversa rumo ao seu objetivo.",
      description: "Entrevistas utilizam metodologias comportamentais, pedindo exemplos do seu passado para prever sua atuação no futuro. Vamos criar um guia de pautas baseadas no seu Master CV.",
      fields: [
        {
          id: "entrevista_desc1",
          type: "info",
          description: "Passo 1: Selecionando Casos de Sucesso\n\n(Framework STAR-LA)\n\nLegenda do Framework: O método STAR-LA é uma estrutura de resposta comportamental:\nSituation/Situação (o contexto);\nTask/Tarefa (seu papel);\nAction/Ação (o que você fez);\nResult/Resultado (o impacto alcançado);\nLearning/Aprendizado (o que você aprendeu);\nApplication/Aplicação (como você usará esse aprendizado na nova empresa).",
          required: false
        },
        {
          id: "download_master_cv",
          type: "cv_download_button",
          label: "Baixar meu Master CV",
          required: false
        },
        {
          id: "entrevista_desc_exemplos",
          type: "info",
          description: "Exemplos Práticos:\n{{exemplo_star_la}}",
          required: false
        },
        {
          id: "cv_vaga_desc_button",
          type: "cv_vaga_description_button",
          required: false
        },
        {
          id: "conquistas_pautas",
          type: "textarea",
          label: "Escreva o seu roteiro para entrevista aqui.",
          placeholder: "Digite seu roteiro comportamental...",
          required: true
        },
        {
          id: "entrevista_check1",
          type: "checkbox",
          label: "Minhas pautas estão prontas para me guiar!",
          required: true
        },
        {
          id: "plano_desc2",
          type: "info",
          description: "Passo 2: O Plano de Ação Estratégico (Apenas para Sênior e Líderes)\n\nEm posições de liderança, o planejamento para os primeiros 90 dias demonstra maturidade e capacidade de planejamento e avaliação antes da execução.",
          required: false,
          dependsOn: "entrevista_check1,cv_focado.senioridade_pretendida=Sênior|Liderança (Coordenação/Gerência)|C-Level / Diretoria"
        },
        {
          id: "plano_30_dias",
          type: "textarea",
          label: "Plano de 30 dias (Escuta e Avaliação)",
          placeholder: "Digite os objetivos para os primeiros 30 dias...",
          required: true,
          dependsOn: "entrevista_check1,cv_focado.senioridade_pretendida=Sênior|Liderança (Coordenação/Gerência)|C-Level / Diretoria"
        },
        {
          id: "plano_60_dias",
          type: "textarea",
          label: "Plano de 60 dias (Estratégia e Ajustes)",
          placeholder: "Digite os objetivos para os primeiros 60 dias...",
          required: true,
          dependsOn: "entrevista_check1,cv_focado.senioridade_pretendida=Sênior|Liderança (Coordenação/Gerência)|C-Level / Diretoria"
        },
        {
          id: "plano_90_dias",
          type: "textarea",
          label: "Plano de 90 dias (Execução de Impacto)",
          placeholder: "Digite os objetivos para os primeiros 90 dias...",
          required: true,
          dependsOn: "entrevista_check1,cv_focado.senioridade_pretendida=Sênior|Liderança (Coordenação/Gerência)|C-Level / Diretoria"
        },
        {
          id: "plano_check2",
          type: "checkbox",
          label: "Plano de 90 dias estruturado em tópicos!",
          required: true,
          dependsOn: "entrevista_check1,cv_focado.senioridade_pretendida=Sênior|Liderança (Coordenação/Gerência)|C-Level / Diretoria"
        }
      ]
    },
    {
      id: "tela5_networking",
      question: "Prepare-se para criar conexões de alto valor.",
      description: "Reuniões de networking não são pedidos diretos de emprego ou negócios, são momentos de construção de relacionamento, troca de informações de mercado e consolidação de autoridade.",
      fields: [
        {
          id: "networking_desc1",
          type: "info",
          description: "Passo 1: Posicionamento Consultivo\n\nUma boa conversa de networking respeitará a Jornada do Herói Corporativa.\n\nLegenda do Framework: A Jornada do Herói, adaptada ao ambiente corporativo, é uma estrutura onde você NÃO é o herói da história. A empresa ou o cliente é o \"Herói\" que enfrenta um grande desafio. Você assume o papel de \"Mentor\", aquele que possui experiência, ferramentas e visão para ajudá-los a superar os obstáculos e alcançar o sucesso.\n\nAtenção: um mentor não é o dono da verdade, ele compreende o contexto, formula possíveis soluções e sugere como alternativas. A decisão de implantar a solução sempre será do Herói.\n\nDescrição: Imagine que você terá a oportunidade de conversar com uma pessoa relevante da {{cv_focado.pdi_empresa_target}}. Lembre-se que o contexto deles, conforme você pontuou, pode ser: \"{{cv_focado.cultura_empresa_target}}\". Quais informações de mercado, tendências ou dados sobre a operação você precisaria obter do seu interlocutor para ajudá-los a formular uma solução para esse problema? Faça perguntas nesse sentido.",
          required: false
        },
        {
          id: "networking_pergunta1",
          type: "text",
          label: "Campo 1 (Texto Curto): Escreva sua 1ª pergunta exploratória.",
          required: true
        },
        {
          id: "networking_pergunta2",
          type: "text",
          label: "Campo 2 (Texto Curto): Escreva sua 2ª pergunta exploratória.",
          required: true
        },
        {
          id: "networking_pergunta3",
          type: "text",
          label: "Campo 3 (Texto Curto): Escreva sua 3ª pergunta exploratória.",
          required: true
        },
        {
          id: "networking_check1",
          type: "checkbox",
          label: "Pautas de networking criadas com foco em escuta ativa e entendimento do negócio.",
          required: true
        }
      ]
    },
    {
      id: "tela6_adaptacao",
      question: "Ajuste sua comunicação de acordo com a audiência",
      description: "{{User_Nickname}}, o segredo de conversas profissionais de alta qualidade é saber adaptar as pautas que você criou dependendo de quem está do outro lado te escutando.",
      fields: [
        {
          id: "adaptacao_check1",
          type: "checkbox",
          label: "Se o ouvinte for de Recursos Humanos, fale para si mesmo: Vou focar minhas pautas no alinhamento cultural, no comportamento e na capacidade de adaptação.\n\nExemplo Prático (Jr/Pleno): Eu posso falar como a minha vontade de evoluir se conecta com a cultura de aprendizado contínuo da empresa.\n\nExemplo Prático (Sr/Líder): Eu vou dar exemplos da minha abordagem para formar equipes resilientes, reter talentos e promover a diversidade.",
          required: true
        },
        {
          id: "adaptacao_check2",
          type: "checkbox",
          label: "Se o ouvinte for a Liderança Direta ou Par Técnico, fale para si mesmo: Vou aprofundar na capacidade operacional, fluxos de trabalho e ferramentas que resolvem os gargalos do setor.\n\nExemplo Prático (Jr/Pleno): Eu vou detalhar o raciocínio lógico que utilizei para tratar um banco de dados no software X.\n\nExemplo Prático (Sr/Líder): Eu vou explicar o modelo de gestão que eu utilizei para reestruturar um processo cruzado entre áreas, ganhando velocidade na entrega.",
          required: true,
          dependsOn: "adaptacao_check1"
        },
        {
          id: "adaptacao_check3",
          type: "checkbox",
          label: "Se o ouvinte for o C-Level, Conselho ou Investidor, fale a si mesmo: Vou utilizar a Pirâmide de Minto (Comunicação Top-Down).\n\nLegenda do Framework: A Pirâmide de Minto é um modelo de comunicação executiva que inverte a ordem tradicional. Você inicia direto com a resposta final ou conclusão (topo da pirâmide), seguida pelos seus três argumentos principais e, apenas se necessário, apresenta os dados detalhados. Executivos não têm tempo para longos raciocínios; eles focam no impacto.\n\nExemplo Prático (Jr/Pleno): Eu vou iniciar a resposta afirmando qual o impacto financeiro (economia de tempo ou recurso) do meu trabalho, antes de explicar como eu faço ele.\n\nExemplo Prático (Sr/Líder): Eu primeiro vou falar dos resultados (\"O projeto aumentou o market share em X%\"), depois vou falar das bases que sustentaram o resultado e apenas caso me perguntem, explico o detalhamento.",
          required: true,
          dependsOn: "adaptacao_check2"
        }
      ]
    },
    {
      id: "tela7_apresentacao",
      question: "Configurações para o ambiente físico e híbrido",
      description: "Com o discurso alinhado, vamos configurar os últimos detalhes práticos para encontros presenciais ou híbridos.\n\nPasso 1: Cartão de Visita Digital\nO uso de cartões de papel convencionais tem diminuído, mas a troca rápida de contatos continua sendo essencial na rotina.\n\n{{User_Nickname}}, vamos gerar um cartão digital com um QR Code, ideal para ser compartilhado na tela de uma videochamada ou presencialmente pelo celular?",
      fields: [
        {
          id: "gerador_cartao",
          type: "cv_business_card_generator",
          required: false
        }
      ]
    },
    {
      id: "tela8_posicionamento_pratico",
      question: "Se posicionando na vida real!",
      description: "{{User_Nickname}}, você construiu seus roteiros, estruturou suas pautas e definiu sua narrativa. No entanto, um discurso só se torna natural quando testado no mundo real.\n\nNesta etapa final, te propomos três desafios práticos para calibrar o seu Pitch Profissional e suas táticas de networking antes de ir para as entrevistas oficiais. Siga os passos abaixo e marque as caixas apenas quando concluir cada ação.\n\nObservação: sabemos que os desafios propostos podem não ser possíveis de realizar exatamente agora, por isso, essa tela permanecerá salva até que você conclua os 3 desafios. Pode fechar e voltar aqui sem preocupações. Seu progresso está mais que salvo, está fantástico!",
      fields: [
        {
          id: "pratico_desc1",
          type: "info",
          description: "Passo 1: Teste do pitch presencial\n\nO primeiro passo é testar seu pitch verbal e presencialmente com alguém do seu convívio diário (um colega de trabalho, um chefe atual com quem tenha abertura, ou um amigo da área). O objetivo não é pedir emprego, mas sim validar a clareza da sua mensagem, e se preciso ajustá-la.\n\n{{exemplo_pratico_pitch}}",
          required: false
        },
        {
          id: "pratico_check1",
          type: "checkbox",
          label: "Desafio concluído! Apresentei meu pitch, coletei feedbacks e ajustei os pontos que não soaram naturais.",
          required: true
        },
        {
          id: "pratico_feedback1",
          type: "text",
          label: "Nos conte como foi aplicar o exercício na vida real, e quais foram os feedbacks:",
          required: false,
          dependsOn: "pratico_check1"
        },
        {
          id: "pratico_desc2",
          type: "info",
          description: "Passo 2: Teste do pitch digital\n\nFaça uma abordagem real via LinkedIn ou WhatsApp com um profissional da sua área de interesse (seja alguém que já trabalhe na {{cv_focado.pdi_empresa_target}} ou em uma organização similar).\n\n{{exemplo_pratico_pitch_digital}}",
          required: false
        },
        {
          id: "pratico_check2",
          type: "checkbox",
          label: "Desafio concluído! Fiz minha abordagem de networking e iniciei uma conversa real.",
          required: true
        },
        {
          id: "pratico_feedback2",
          type: "text",
          label: "Nos conte como foi aplicar o exercício na vida real, e quais foram os feedbacks:",
          required: false,
          dependsOn: "pratico_check2"
        },
        {
          id: "pratico_desc3",
          type: "info",
          description: "Passo 3: O pitch de alto valor\n\n{{User_Nickname}}, você chegou ao último desafio deste módulo. É hora de apresentar todo o seu trabalho para a sua consultora. O seu desafio agora é abordar a Lis, diretamente pelo WhatsApp ou LinkedIn.\n\nSua missão: Envie o seu Pitch finalizado (em texto ou, preferencialmente, grave um áudio para testarmos o seu tom de voz e cadência) e proporha uma pauta geral de assuntos para a reunião.\n\nO Objetivo: Esta abordagem será o nosso ponto de partida para o seu último passo nesta jornada: uma consultoria individual com a equipe BPlen. Neste encontro, faremos uma revisão completa e com feedback aprofundado sobre todo o seu processo de posicionamento de carreira (desde o Master CV e a otimização pública, até a afinação do seu discurso para entrevistas e networking).",
          required: false
        },
        {
          id: "pratico_contato_lis",
          type: "cv_lis_contact_button",
          required: false
        },
        {
          id: "pratico_check3",
          type: "checkbox",
          label: "Desafio Master concluído! Enviei meu pitch para a Lis e propus a pauta para a nossa reunião.",
          required: true
        },
        {
          id: "pratico_feedback3",
          type: "text",
          label: "Nos conte como foi aplicar o exercício na vida real, e quais foram os feedbacks:",
          required: false,
          dependsOn: "pratico_check3"
        }
      ]
    }
  ]
};
