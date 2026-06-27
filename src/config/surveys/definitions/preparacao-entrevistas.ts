import { SurveyConfig } from "@/types/survey";

/**
 * BPlen HUB — Survey Definition: Preparacao para Entrevistas e Networking
 */
export const preparacaoEntrevistasSurvey: SurveyConfig = {
  id: "preparacao_entrevistas_networking",
  kind: "survey",
  title: "Preparacao para Entrevistas e Reunioes de Networking",
  description: "Preparacao do seu discurso e interacoes profissionais.",
  submitLabel: "Concluir o Modulo e Aguardar a minha Consultoria Final de Posicionamento!",
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
      question: "Preparacao para Entrevistas e Reunioes de Networking",
      description: "Ola {{User_Nickname}}! Voce ja construiu o Master CV (a central de dados da sua historia profissional), elaborou o CV Focado (para mirar exatamente onde voce deseja chegar) e estruturou seu perfil profissional nas plataformas digitais. Agora, focaremos na preparacao do seu discurso e interacoes profissionais.\n\nReserve de 20 a 30 minutos em um ambiente tranquilo para prosseguir.\nOs dados preenchidos ficam salvos somente com a conclusao total.\nCaso precise fechar a pagina durante o processo, ele sera reiniciado.",
      nextLabel: "Vamos la, estou com tudo pronto!",
      fields: []
    },
    {
      id: "tela2_alinhamentos",
      question: "Alinhamentos gerais",
      description: "A preparacao de roteiros de fala e essencial para quem busca crescimento na carreira. Mas {{User_Nickname}}, note que um bom roteiro nao e um texto decorado que deixa o discurso engessado, e sim um guia estruturado em pautas (topicos) com comeco, meio e fim. Ele serve como sua ancora e permite a escuta ativa, a adaptacao do discurso, e a espontaneidade nas conversas profissionais.\n\nPense no roteiro como pequenos checkpoints essenciais para uma conversa de qualidade.\n\nAntes de comecarmos, vale um importante alerta:\nPara Junior/Pleno: Nao subestime a entrevista achando que lhe falta bagagem, nem a superestime achando que precisa saber tudo. Avaliadores buscam potencial, adaptabilidade e como voce resolve problemas praticos no dia a dia.\nPara Senior/Lider: Nao subestime a entrevista confiando apenas no seu historico, nem superestime sua autoridade. O comite de decisao quer visao de futuro e alinhamento cultural. Executivos com excelente historico podem perder oportunidades quando nao conseguem traduzir seu passado e adapta-los para os desafios futuros como o da {{cv_focado.pdi_empresa_target}}.",
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
      description: "{{User_Nickname}}, o Pitch e a sua resposta estruturada para a pergunta: \"Fale sobre voce\". Ele deve ser curto, direto e focado em como voce agrega valor para a posicao de {{cv_focado.pdi_posicao_target}}.",
      fields: [
        {
          id: "pitch_desc1",
          type: "info",
          description: "Passo 1: Escrevendo o Pitch\n\nElabore ao menos 3 topicos para 3 problemas diferentes, conte com o apoio do framework ABT.\n\nLegenda do Framework: A estrutura ABT (And, But, Therefore - E, Mas, Portanto) e um modelo de comunicacao que cria contexto (E), introduz uma tensao ou problema (Mas) e apresenta a resolucao operacional que voce oferece (Portanto).\n\nDica: Para cada topico aplique o modelo, como o exemplo a seguir:\n(Se Junior/Pleno): Qual e a sua base tecnica (E), qual problema comum na operacao voce notou (Mas), e como voce atua para resolver isso (Portanto)?\nExemplo Pratico (Jr/Pleno): \"Tenho solida formacao em analise de dados (E), notei que a extracao de relatorios costuma tomar muito tempo da equipe (Mas). Portanto, utilizo a ferramenta X para automatizar esse fluxo e aumentar a eficiencia da area.\"\n(Se Senior/Lider): Considerando o cenario atual da {{cv_focado.pdi_empresa_target}}, qual e a fortaleza deles (E), qual e a dor estrategica que enfrentam (Mas), e como sua visao de lideranca transforma isso em resultado (Portanto)?\nExemplo Pratico (Sr/Lider): \"A empresa tem um produto excelente no mercado (E), mas a retencao de clientes enterprise esta caindo devido a falhas no processo de onboarding (Mas). Portanto, minha prioridade na cadeira de lideranca sera reestruturar essa jornada para proteger a receita e escalar a satisfacao.\"",
          required: false
        },
        {
          id: "pitch_pautas",
          type: "textarea",
          label: "Escreva seu Pitch em topicos.",
          placeholder: "Digite seus topicos...",
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
          description: "Passo 2: Escuta e Calibracao\n\nA melhor forma de nao soar mecanizado e ouvir a propria voz. Leia seu pitch em voz alta, de forma conversacional. Se a fala nao fluir naturalmente, reescreva de forma mais direta e confortavel para voce.\n\nAo falar seu pitch em voz alta voce nao precisa usar as palavras exatas, apenas seguir a estrutura das pautas.\nUtilize o espaco abaixo para gravar a sua fala e se escutar...",
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
      description: "Entrevistas utilizam metodologias comportamentais, pedindo exemplos do seu passado para prever sua atuacao no futuro. Vamos criar um guia de pautas baseadas no seu Master CV.",
      fields: [
        {
          id: "entrevista_desc1",
          type: "info",
          description: "Passo 1: Selecionando Casos de Sucesso\n\n(Framework STAR-LA)\n\nLegenda do Framework: O metodo STAR-LA e uma estrutura de resposta comportamental:\nSituation/Situacao (o contexto);\nTask/Tarefa (seu papel);\nAction/Acao (o que voce fez);\nResult/Resultado (o impacto alcancado);\nLearning/Aprendizado (o que voce aprendeu);\nApplication/Aplicacao (como voce usara esse aprendizado na nova empresa).",
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
          description: "Exemplos Pratico:\n(Se Junior/Pleno): \"Na empresa anterior, tinhamos um atraso constante no fechamento (Situacao/Tarefa). Implementei macros no Excel (Acao) que reduziram o tempo de entrega em 30% (Resultado). Aprendi a importancia de questionar processos manuais repetitivos (Aprendizado) e pretendo aplicar essa visao de melhoria continua aqui na {{cv_focado.pdi_empresa_target}} (Aplicacao).\"\n(Se Senior/Lider): Baseado nas demandas da posicao em foco, qual projeto transversal voce liderou que uniu varias areas? Como o aprendizado dessa lideranca sera crucial para o momento atual da {{cv_focado.pdi_empresa_target}}?",
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
          label: "Minhas pautas estao prontas para me guiar!",
          required: true
        },
        {
          id: "plano_desc2",
          type: "info",
          description: "Passo 2: O Plano de Acao Estrategico (Apenas para Senior e Lideres)\n\nEm posicoes de lideranca, o planejamento para os primeiros 90 dias demonstra maturidade e capacidade de planejamento e avaliacao antes da execucao.",
          required: false,
          dependsOn: "entrevista_check1,cv_focado.senioridade_pretendida=Sênior|Liderança (Coordenação/Gerência)|C-Level / Diretoria"
        },
        {
          id: "plano_30_dias",
          type: "textarea",
          label: "Plano de 30 dias (Escuta e Avaliacao)",
          placeholder: "Digite os objetivos para os primeiros 30 dias...",
          required: true,
          dependsOn: "entrevista_check1,cv_focado.senioridade_pretendida=Sênior|Liderança (Coordenação/Gerência)|C-Level / Diretoria"
        },
        {
          id: "plano_60_dias",
          type: "textarea",
          label: "Plano de 60 dias (Estrategia e Ajustes)",
          placeholder: "Digite os objetivos para os primeiros 60 dias...",
          required: true,
          dependsOn: "entrevista_check1,cv_focado.senioridade_pretendida=Sênior|Liderança (Coordenação/Gerência)|C-Level / Diretoria"
        },
        {
          id: "plano_90_dias",
          type: "textarea",
          label: "Plano de 90 dias (Execucao de Impacto)",
          placeholder: "Digite os objetivos para os primeiros 90 dias...",
          required: true,
          dependsOn: "entrevista_check1,cv_focado.senioridade_pretendida=Sênior|Liderança (Coordenação/Gerência)|C-Level / Diretoria"
        },
        {
          id: "plano_check2",
          type: "checkbox",
          label: "Plano de 90 dias estruturado em topicos!",
          required: true,
          dependsOn: "entrevista_check1,cv_focado.senioridade_pretendida=Sênior|Liderança (Coordenação/Gerência)|C-Level / Diretoria"
        }
      ]
    },
    {
      id: "tela5_networking",
      question: "Prepare-se para criar conexoes de alto valor.",
      description: "Reunioes de networking nao sao pedidos diretos de emprego ou negocios, sao momentos de construcao de relacionamento, troca de informacoes de mercado e consolidacao de autoridade.",
      fields: [
        {
          id: "networking_desc1",
          type: "info",
          description: "Passo 1: Posicionamento Consultivo\n\nUma boa conversa de networking respeitar a Jornada do Heroi Corporativa.\n\nLegenda do Framework: A Jornada do Heroi, adaptada ao ambiente corporativo, e uma estrutura onde voce NAO e o heroi da historia. A empresa ou o cliente e o \"Heroi\" que enfrenta um grande desafio. Voce assume o papel de \"Mentor\", aquele que possui experiencia, ferramentas e visao para ajuda-los a superar os obstaculos e alcancar o sucesso.\n\nAtencao: um mentor nao e o dono da verdade, ele compreende o contexto, formula possiveis solucoes e sugere como alternativas. A decisao de implantar a solucao sempre sera do Heroi.\n\nDescricao: Imagine que voce tera a oportunidade de conversar com uma pessoa relevante da {{cv_focado.pdi_empresa_target}}. Lembre-se que o contexto deles, conforme voce pontuou, pode ser: \"{{cv_focado.cultura_empresa_target}}\". Quais informacoes de mercado, tendencias ou dados sobre a operacao voce precisaria obter do seu interlocutor para ajuda-los a formular uma solucao para esse problema? Facas perguntas nesse sentido.",
          required: false
        },
        {
          id: "networking_pergunta1",
          type: "text",
          label: "Campo 1 (Texto Curto): Escreva sua 1a pergunta exploratoria.",
          required: true
        },
        {
          id: "networking_pergunta2",
          type: "text",
          label: "Campo 2 (Texto Curto): Escreva sua 2a pergunta exploratoria.",
          required: true
        },
        {
          id: "networking_pergunta3",
          type: "text",
          label: "Campo 3 (Texto Curto): Escreva sua 3a pergunta exploratoria.",
          required: true
        },
        {
          id: "networking_check1",
          type: "checkbox",
          label: "Pautas de networking criadas com foco em escuta ativa e entendimento do negocio.",
          required: true
        }
      ]
    },
    {
      id: "tela6_adaptacao",
      question: "Ajuste sua comunicacao de acordo com a audiencia",
      description: "{{User_Nickname}}, o segredo de conversas profissionais de alta qualidade e saber adaptar as pautas que voce criou dependendo de quem esta do outro lado te escutando.",
      fields: [
        {
          id: "adaptacao_check1",
          type: "checkbox",
          label: "Se o ouvinte for de Recursos Humanos, fale para si mesmo: Vou focar minhas pautas no alinhamento cultural, no comportamento e na capacidade de adaptacao.\n\nExemplo Pratico (Jr/Pleno): Eu posso falar como a minha vontade de evoluir se conecta com a cultura de aprendizado continuo da empresa.\n\nExemplo Pratico (Sr/Lider): Eu vou dar exemplos da minha abordagem para formar equipes resilientes, reter talentos e promover a diversidade.",
          required: true
        },
        {
          id: "adaptacao_check2",
          type: "checkbox",
          label: "Se o ouvinte for a Lideranca Direta ou Par Tecnico, fale para si mesmo: Vou aprofundar na capacidade operacional, fluxos de trabalho e ferramentas que resolvem os gargalos do setor.\n\nExemplo Pratico (Jr/Pleno): Eu vou detalhar o raciocinio logico que utilizei para tratar um banco de dados no software X.\n\nExemplo Pratico (Sr/Lider): Eu vou explicar o modelo de gestao que eu utilizei para reestruturar um processo cruzado entre areas, ganhando velocidade na entrega.",
          required: true,
          dependsOn: "adaptacao_check1"
        },
        {
          id: "adaptacao_check3",
          type: "checkbox",
          label: "Se o ouvinte for o C-Level, Conselho ou Investidor, fale a si mesmo: Vou utilizar a Piramide de Minto (Comunicacao Top-Down).\n\nLegenda do Framework: A Piramide de Minto e um modelo de comunicacao executiva que inverte a ordem tradicional. Voce inicia direto com a resposta final ou conclusao (topo da piramide), seguida pelos seus tres argumentos principais e, apenas se necessario, apresenta os dados detalhados. Executivos nao tem tempo para longos raciocinios; eles focam no impacto.\n\nExemplo Pratico (Jr/Pleno): Eu vou iniciar a resposta afirmando qual o impacto financeiro (economia de tempo ou recurso) do meu trabalho, antes de explicar como eu faço ele.\n\nExemplo Pratico (Sr/Lider): Eu primeiro vou falar dos resultados (\"O projeto aumentou o market share em X%\"), depois vou falar das bases que sustentaram o resultado e apenas caso me perguntem, explico o detalhamento.",
          required: true,
          dependsOn: "adaptacao_check2"
        }
      ]
    },
    {
      id: "tela7_apresentacao",
      question: "Configuracoes para o ambiente fisico e hibrido",
      description: "Com o discurso alinhado, vamos configurar os ultimos detalhes praticos para encontros presenciais ou hibridos.\n\nPasso 1: Cartao de Visita Digital\nO uso de cartoes de papel convencionais tem diminuido, mas a troca rapida de contatos continua sendo essencial na rotina.\n\n{{User_Nickname}}, vamos gerar um cartao digital com um QR Code, ideal para ser compartilhado na tela de uma videochamada ou presencialmente pelo celular?",
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
      description: "{{User_Nickname}}, voce construiu seus roteiros, estruturou suas pautas e definiu sua narrativa. No entanto, um discurso so se torna natural quando testado no mundo real.\n\nNesta etapa final, te propomos tres desafios praticos para calibrar o seu Pitch Profissional e suas taticas de networking antes de ir para as entrevistas oficiais. Siga os passos abaixo e marque as caixas apenas quando concluir cada acao.\n\nObservacao: sabemos que os desafios propostos podem nao ser possiveis de realizar exatamente agora, por isso, essa tela permanecera salva ate que voce conclua os 3 desafios. Pode fechar e voltar aqui sem preocupacoes. Seu progresso esta mais que salvo, esta fantastico!",
      fields: [
        {
          id: "pratico_desc1",
          type: "info",
          description: "Passo 1: Teste do pitch presencial\n\nO primeiro passo e testar seu pitch verbal e presencialmente com alguem do seu convivio diario (um colega de trabalho, um chefe atual com quem tenha abertura, ou um amigo da area). O objetivo nao e pedir emprego, mas sim validar a clareza da sua mensagem, e se preciso ajusta-la.\n\n(Se Junior/Pleno): Aborde um colega ou mentor. Apresente seu pitch de 60 segundos e faca uma pergunta para validar se a sua mensagem foi entendida: \"Ficou claro qual e a minha principal ferramenta tecnica e qual problema rotineiro eu consigo resolver com ela?\"\n(Se Senior/Lider): Aborde um par estrategico, parceiro de negocios ou chefe atual. Ao apresentar seu pitch, pergunte a essa pessoa: \"O meu discurso transmite o impacto financeiro/operacional de forma clara? Ele soa como alguem pronto para assumir os desafios da cadeira de {{cv_focado.pdi_posicao_target}}?\"",
          required: false
        },
        {
          id: "pratico_check1",
          type: "checkbox",
          label: "Desafio concluido! Apresentei meu pitch, coletei feedbacks e ajustei os pontos que nao soaram naturais.",
          required: true
        },
        {
          id: "pratico_feedback1",
          type: "text",
          label: "Nos conte como foi aplicar o exercicio na vida real, e quais foram os feedbacks:",
          required: false,
          dependsOn: "pratico_check1"
        },
        {
          id: "pratico_desc2",
          type: "info",
          description: "Passo 2: Teste do pitch digital\n\nFaca uma abordagem real via LinkedIn ou WhatsApp com um profissional da sua area de interesse (seja alguem que ja trabalhe na {{cv_focado.pdi_empresa_target}} ou em uma organizacao similar).\n\n(Se Junior/Pleno): Envie uma mensagem no LinkedIn para um potencial par de equipe ou recrutador. Exemplo de pauta: Apresente-se brevemente usando as duas primeiras linhas do seu pitch e peca 15 minutos para uma conversa rapida sobre como e o dia a dia e os processos na empresa deles. Foco em aprendizado e conexao.\n(Se Senior/Lider): Faca contato com um Headhunter do seu setor ou um C-Level da {{cv_focado.pdi_empresa_target}}. Exemplo de pauta: Utilize a abordagem consultiva (Jornada do Heroi). Aponte um cenario ou desafio que a empresa ou o setor deles esta enfrentando, apresente seu pitch como uma possivel solucao e sugira uma troca de ideias sobre o mercado.",
          required: false
        },
        {
          id: "pratico_check2",
          type: "checkbox",
          label: "Desafio concluido! Fiz minha abordagem de networking e iniciei uma conversa real.",
          required: true
        },
        {
          id: "pratico_feedback2",
          type: "text",
          label: "Nos conte como foi aplicar o exercicio na vida real, e quais foram os feedbacks:",
          required: false,
          dependsOn: "pratico_check2"
        },
        {
          id: "pratico_desc3",
          type: "info",
          description: "Passo 3: O pitch de alto valor\n\n{{User_Nickname}}, voce chegou ao ultimo desafio deste modulo. E hora de apresentar todo o seu trabalho para a sua consultora. O seu desafio agora e abordar a Lis, diretamente pelo WhatsApp ou LinkedIn.\n\nSua missao: Envie o seu Pitch finalizado (em texto ou, preferencialmente, grave um audio para testarmos o seu tom de voz e cadencia) e proponha uma pauta geral de assuntos para a reuniao.\n\nO Objetivo: Essa abordagem sera o nosso ponto de partida para o seu ultimo passo nesta jornada: uma consultoria individual com a equipe BPlen. Neste encontro, faremos uma revisao completa e com feedback aprofundado sobre todo o seu processo de posicionamento de carreira (desde o Master CV e a otimizacao publica, ate a afinacao do seu discurso para entrevistas e networking).",
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
          label: "Desafio Master concluido! Enviei meu pitch para a Lis e propus a pauta para a nossa reuniao.",
          required: true
        },
        {
          id: "pratico_feedback3",
          type: "text",
          label: "Nos conte como foi aplicar o exercicio na vida real, e quais foram os feedbacks:",
          required: false,
          dependsOn: "pratico_check3"
        }
      ]
    }
  ]
};
