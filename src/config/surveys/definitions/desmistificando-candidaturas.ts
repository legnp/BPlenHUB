import { SurveyConfig } from "@/types/survey";

/**
 * BPlen HUB — Survey Definition: Desmistificando Candidaturas 🧬✨
 * Objetivo: Desmistificar estilos de currículos em diferentes plataformas e coletar diagnóstico.
 */
export const desmistificandoCandidaturasSurvey: SurveyConfig = {
  id: "desmistificando_candidaturas",
  kind: "survey",
  title: "Desmistificando Candidaturas",
  description: "Entenda o mercado e adeque o seu posicionamento",
  submitLabel: "Finalizar Desafio",
  analytics: {
    surveyId: "desmistificando_candidaturas",
    domain: "CONTEUDO",
    context: "carreira_preparacao",
    version: "2.0"
  },
  policy: {
    editable: true,
    allowReset: true
  },
  steps: [
    {
      id: "step_boas_vindas",
      question: "Olá, {{User_Nickname}}!",
      description: "Aqui começa a estruturação da sua carreira profissional com método, clareza e foco.\n\nE para dar o primeiro passo é importante estar ciente de alguns pontos essenciais para a jornada.\n\nÀs vezes o mercado de trabalho pode parecer complexo e exigente demais. E, de fato, ele é (para quem tenta seguir fórmulas mágicas ou caminhos genéricos).\n\n**Observação:** Aqui na BPlen, carreira não é apenas o cargo que você ocupa, mas o caminho consciente que VOCÊ escolhe percorrer.\n\nIsso significa que carreira não é apenas ter uma formação, um emprego, ou ter a carreira que o pai ou a mãe direcionaram, ou a trajetória que uma empresa te propôs ou seguir por um caminho porque outras pessoas seguiram e deram certo (O que dá certo para um, não é garantia que dará certo para outro).\n\nIsso significa: construir uma carreira de acordo com o que VOCÊ ESCOLHE, de acordo com quem você é, com os seus valores e com os limites e ritmos que você preferir.",
      fields: [
        {
          id: "desafios",
          type: "multi_select",
          label: "Antes de avançarmos, queremos te ouvir. Para personalizarmos a sua jornada, quais são os seus maiores desafios profissionais hoje? (Selecione até 2 opções)",
          options: [
            "Não sei exatamente qual é o meu próximo passo ou objetivo de carreira.",
            "Sinto que meu currículo e perfil não atraem boas oportunidades.",
            "Tenho dificuldades em passar pelas triagens iniciais e robôs de RH (Gupy, etc.).",
            "Não sei como abordar pessoas ou fazer um networking que funcione.",
            "Sinto estagnação: tenho competência técnica, mas não sou promovido ou reconhecido.",
            "Outro"
          ],
          required: true,
          validation: {
            maxSelections: 2
          }
        },
        {
          id: "detalhes_desafios",
          type: "textarea",
          label: "Se quiser, deixe mais detalhes desses desafios:",
          placeholder: "Sinta-se à vontade para complementar sua resposta...",
          required: false
        }
      ]
    },
    {
      id: "step_sistemas_trabalho",
      question: "Sistemas de Trabalho e Alinhamentos",
      description: "Não existem carreiras certas ou erradas. O que existe são carreiras mais ou menos adequadas ao que chamamos de Sistema de Trabalho (a cultura, a ética, as regras invisíveis e o modo de operar de cada empresa ou região).\n\nEntender esse sistema é crucial, mas há algo ainda mais importante: entender quem você é. Suas tendências comportamentais, seus valores e seus objetivos concretos.\n\nQuando você cruza esses dois dados, você descobre o nível de esforço necessário para que o seu crescimento profissional seja fluido, sólido e sustentável.",
      fields: [
        {
          id: "fit_termometro",
          type: "scale",
          label: "De 1 a 5, o quanto você sente que o seu perfil atual tem \"fit\" (alinhamento de valores e estilo) com a empresa onde você trabalha ou deseja trabalhar?",
          min: 1,
          max: 5,
          required: true,
          scaleLabels: [
            "Não está nada alinhado",
            "Quase nada alinhado",
            "Às vezes parece que tem \"fit\"",
            "Quase sempre sinto que está alinhado",
            "Meu perfil está totalmente alinhado"
          ]
        },
        {
          id: "fit_justificativa",
          type: "textarea",
          label: "O que te faz acreditar nessa resposta que você deu? (Opcional)",
          placeholder: "Escreva aqui...",
          required: false
        }
      ]
    },
    {
      id: "step_mercado_oculto",
      question: "O Mercado Oculto",
      description: "Vamos quebrar o primeiro grande mito do mercado: A maioria das contratações acontece em vagas que nunca foram publicadas.\n\nO que você vê no LinkedIn, Catho ou Infojobs é apenas a ponta do iceberg. As melhores oportunidades de carreira (principalmente para cargos seniores e de liderança) acontecem nos bastidores: através de conexões com outras pessoas, indicações e conversas que começaram muito antes da vaga existir.",
      fields: [
        {
          id: "fonte_oportunidade",
          type: "choice",
          label: "Olhando para o seu histórico, como você ficou sabendo ou conquistou o seu último emprego?",
          options: [
            "Alguém me indicou (Amigo, colega, ex-chefe ou conhecido de mercado)",
            "Me inscrevi online em canais abertos (LinkedIn, Catho, Infojobs, Indeed)",
            "Um Headhunter/Recrutador me procurou diretamente",
            "Fui promovido internamente na empresa onde já estava",
            "Outro"
          ],
          required: true
        }
      ]
    },
    {
      id: "step_ats_filtro",
      question: "Formatos de Currículos e o Filtro dos Robôs (ATS)",
      description: "Se você opta por se candidatar online, precisa conhecer as regras do jogo. Plataformas como Gupy, Workday e Taleo usam uma tecnologia chamada ATS (Sistema de Rastreamento de Candidatos).\n\nOs robôs dessas plataformas não leem designs complexos, colunas, gráficos ou fotos. Eles leem texto puro, palavras-chave e linhas narrativas coerentes. Um currículo visualmente lindo feito no Canva pode ser descartado pelo robô simplesmente por ser ilegível para a tecnologia.\n\nPara o digital, menos design é mais resultado. Já para oportunidades presenciais ou entregas diretas, o formato e o modelo padrão mudam completamente.",
      fields: [
        {
          id: "canal_oportunidade",
          type: "choice",
          label: "Qual é o meio que você mais utiliza atualmente para buscar novas oportunidades?",
          options: [
            "Plataformas de vagas online (Gupy, portais de empresas, etc.)",
            "O feed e conexões diretas do LinkedIn",
            "Contatos diretos via Networking (WhatsApp, e-mail, reuniões)",
            "Agências de recrutamento e Headhunters",
            "Candidaturas presenciais ou envio direto impresso",
            "Outros"
          ],
          required: true
        },
        {
          id: "canal_oportunidade_outros",
          type: "text",
          label: "Se selecionou 'Outros', especifique qual:",
          required: false
        }
      ]
    },
    {
      id: "step_base_iceberg",
      question: "A base do iceberg",
      description: "Como você percebeu, ajustar um currículo ou clicar em \"candidatar-se\" é apenas a superfície.\n\nO verdadeiro sucesso e a sustentabilidade da sua carreira estão na base do iceberg: no seu autoconhecimento, na sua estratégia de posicionamento, na sua capacidade de gerar valor e na escolha de um objetivo intencional.\n\nQuem foca apenas na ponta do iceberg vive frustrado com os robôs de RH.\nQuem reconstrói a base assume o controle da própria trajetória.",
      fields: [
        {
          id: "exploracao_iceberg",
          type: "choice",
          label: "Se houvesse uma parte do iceberg da sua carreira que você ainda não explorou, qual seria?",
          options: [
            "Topo: Em busca por oportunidades, posicionamento e reconhecimento.",
            "Meio: Adquirir novas habilidades e comportamentos para transformar e elevar a carreira.",
            "Fundo: Planejamento a longo prazo, para sustentar uma carreira sólida com autoridade.",
            "Base: Autoconhecimento profundo para dominar as estratégias da minha carreira."
          ],
          required: true
        },
        {
          id: "imagem_iceberg",
          type: "image",
          imageUrl: "/images/iceberg-carreira-profissional.png"
        },
        {
          id: "impacto_exploracao",
          type: "textarea",
          label: "O que poderia mudar na sua carreira profissional se você explorasse essa parte do iceberg?",
          required: true
        }
      ]
    },
    {
      id: "step_encerramento",
      question: "Nosso alinhamento está feito. Agora, vamos à prática?",
      description: "Suas respostas mostraram exatamente onde o seu perfil está no mercado hoje. Você já entendeu que o mercado oculto exige relacionamentos, e que o mercado digital exige que você saiba falar a língua dos robôs (ATS).\n\nNão adianta ter uma história profissional incrível se o seu currículo atual estiver \"escondendo\" o seu potential ou sendo bloqueado pelas plataformas.\n\nChegou a hora de transformar o seu posicionamento em uma ferramenta adequada para atrair as melhores oportunidades.\n\n**Seu próximo Checkpoint no BPlen HUB foi liberado:** Módulo de Revisão e Elaboração de CV. Lá, vamos estruturar o seu novo currículo juntos, linha por linha.\n\nBora abrir as portas do mercado oculto e deixar seu perfil pronto para os robôs e para os headhunters?",
      fields: [
        {
          id: "proximo_passo",
          type: "choice",
          options: [
            "Sim, quero destravar meu novo currículo agora!",
            "Quero ver as orientações do próximo módulo."
          ],
          required: true
        }
      ]
    }
  ]
};
