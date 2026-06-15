import { SurveyConfig } from "@/types/survey";

export const planoFase4Survey: SurveyConfig = {
  id: "survey_plano_fase4",
  kind: "survey",
  title: "Plano de Carreira: Consolidação do Plano",
  description: "Fase 4 — Consolidação do Plano",
  submitLabel: "Concluído! Salvar e Avançar",
  analytics: {
    surveyId: "survey_plano_fase4",
    domain: "SURVEY",
    context: "CAREER_PLAN",
    tags: ["carreira", "consolidacao"]
  },
  policy: {
    editable: true,
    allowReset: false
  },
  steps: [
    {
      id: "step_intro_consolidacao",
      question: "Olá, {{User_Nickname}}! Te damos as boas-vindas ao último passo do desenho do seu Plano de Carreira!",
      description: "[Concluído] Definição de Objetivo\n[Concluído] Seleção de Recursos\n[Concluído] Plano de Ação\n[Etapa Atual] Consolidação do Plano\n\nEssa etapa consiste em consolidar todos os checkpoints anteriores e firmar o seu compromisso com a execução do plano.\n\nReserve de 25 a 30 minutos em um ambiente tranquilo para prosseguir. Os dados preenchidos ficam salvos somente com a conclusão total. Caso precise fechar a página durante o processo, ele será reiniciado.",
      nextLabel: "Avançar",
      fields: [
        {
          id: "info_kit_bplen",
          type: "info",
          label: "ATENÇÃO: Para esse checkpoint você precisará do Kit BPlen que foi enviado ao seu endereço e de uma caneta."
        },
        {
          id: "check_kit",
          type: "choice",
          label: "Confirmação de Materiais",
          options: ["Estou com o Kit BPlen do lado e a caneta."],
          required: true
        }
      ]
    },
    {
      id: "step_q1_referencia",
      question: "Quem é sua referência?",
      description: "{{User_Nickname}}, ninguém chega ao topo sem se inspirar em alguém.\n\nHoje, quem é a pessoa que você tem como sua maior referência ou liderança inspiradora para alcançar seu objetivo de carreira?\n(Pode ser mãe, pai, um tio, tia, figura pública, artista ou líder religioso).",
      nextLabel: "Avançar",
      fields: [
        {
          id: "nome_referencia",
          type: "text",
          label: "Nome da sua referência",
          placeholder: "Nome de pessoa...",
          required: true
        },
        {
          id: "foto_referencia",
          type: "file",
          label: "Faça o upload da foto dessa pessoa aqui (Caso você tenha uma foto junto com ela, melhor!)",
          required: false
        }
      ]
    },
    {
      id: "step_q2_referencia_o_que_inspira",
      question: "O que te inspira? (Aproximando a Realidade)",
      description: "{{User_Nickname}}, por que a sua referência ({{Nome_Referencia}}) te inspira? Quais são as atitudes, ideias e ações que a tornam especial?\n\nO que você diria que há de semelhante entre vocês (como por exemplo traços físicos, histórias, comportamentos, área de atuação) e o que há de diferença?",
      nextLabel: "Avançar",
      fields: [
        {
          id: "analise_semelhancas_diferencas",
          type: "textarea",
          label: "Análise da Referência",
          placeholder: "Ela me inspira porque... Temos de semelhante... E de diferente...",
          required: true
        }
      ]
    },
    {
      id: "step_q3_carta_5anos",
      question: "Viagem a 5 anos no tempo",
      description: "Agora faremos uma viagem no tempo. Imagine que 5 anos se passaram e você alcançou o seu maior objetivo de carreira ({{Objetivo_Principal_Fase1}}).\n\nVocê decide escrever uma carta para a sua referência ({{Nome_Referencia}}), contando como foi a jornada desses 5 anos. Você quer relatar quais foram os resultados atingidos, quais barreiras você superou e quem te ajudou a superá-las. Quais foram as pequenas vitórias conquistadas, as mudanças que ocorreram na sua casa, na sua rotina, no seu trabalho e no seu círculo de relacionamentos. E por fim, você conclui essa carta dizendo como a sua referência ({{Nome_Referencia}}) te ajudou nesse processo, e pelo que você a agradece.\n\nINSTRUÇÕES IMPORTANTES:\n- Essa carta deve ser feita de próprio punho, na folha de papel;\n- Possivelmente você ainda tem de 15 a 20 minutos. Redija a carta dentro desse tempo. Mesmo que tenha mais o que falar, escolha as mensagens mais importantes e respeite o tempo limite;\n- Após escrevê-la, tire uma foto e faça o upload da foto no campo abaixo para prosseguir.\n\nSUGESTÃO: Esse é um exercício de imaginação e criatividade. Caso não saiba bem o que dizer, imagine que você está criando uma história. Neste momento, brinque de ser o autor de uma história sobre uma jornada profissional de 5 anos, narrando o que aconteceu nesse período.",
      nextLabel: "Avançar",
      fields: [
        {
          id: "info_apoio_lis",
          type: "info",
          label: "Rede de Apoio: Se precisar da ajuda da Lis, lembre-se de ligar a ela ou enviar uma mensagem no WhatsApp e pedir 8 minutos de atenção."
        },
        {
          id: "foto_carta_manuscrita",
          type: "file",
          label: "Anexar foto da Carta",
          required: true
        }
      ]
    },
    {
      id: "step_q4_carta_5anos_lacre",
      question: "Lacrar a carta",
      description: "{{User_Nickname}}, muito bem! Com certeza você escreveu uma carta incrível.\n\nAbra o Kit BPlen. Dentro dele haverá um envelope e uma cera para lacre. Guarde a carta dentro do envelope e lacre com a cera.\n\nNa reunião de devolutiva você receberá mais instruções sobre o que fazer com a carta.",
      nextLabel: "Avançar",
      fields: [
        {
          id: "check_carta_lacrada",
          type: "choice",
          label: "Confirmação de Ação",
          options: ["Carta guardada e lacrada."],
          required: true
        }
      ]
    },
    {
      id: "step_fechamento_fase4",
      question: "Plano de Carreira Concluído!",
      description: "{{User_Nickname}}, parabéns pela dedicação e coragem de concluir mais um passo importante da sua jornada!\n\nChegar até aqui reflete padrões de atitudes de um perfil vencedor, obstinado e coerente com uma carreira sólida e com propósito.\n\nA próxima etapa será a Devolutiva da Análise do Plano. Marque esta etapa como concluída e avance para agendar a sua reunião.",
      fields: []
    }
  ]
};
