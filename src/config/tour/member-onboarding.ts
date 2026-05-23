import { TourStep } from "@/components/shared/GuidedTourOverlay";

export const memberOnboardingSteps: TourStep[] = [
  {
    title: "Boas-vindas a Área de Membro da BPlen HUB.",
    content: "{User_Nickname}, esse é o novo espaço para você gerenciar o desenvolvimento da sua carreira profissional. Nos próximos segundos, vou te guiar pelos módulos mais importantes para você se ambientar e aproveitar ao máximo cada recurso disponível!",
    buttonLabel: "Ok, vamos nessa!"
  },
  {
    targetId: "hub-journey-nav",
    title: "Sua Jornada de Membro",
    content: "Aqui você acompanha a evolução da sua Jornada como Membro BPlen. Cada ícone representa um Passo a diante, e à medida que você avança, novos conteúdos e ferramentas são desbloqueados automaticamente, enquanto o seu progresso é medido em tempo real.",
    buttonLabel: "Agora eu sei onde ver a minha jornada. Vamos para o próximo módulo."
  },
  {
    targetId: "hub-carreira",
    title: "Gestão de Carreira",
    content: "{User_Nickname}, esse é o coração da SUA trajetória. Aqui você terá a visão geral da evolução da sua Carreira Profissional, através de seus planos individuais, metas, análise de progressão e melhoria, com foco aos seus Objetivos de Carreira.",
    buttonLabel: "Mal vejo a hora de iniciar a Gestão da Minha carreira"
  },
  {
    targetId: "hub-agenda",
    title: "Sua Agenda BPlen",
    content: "Essa é a visualização geral da sua Agenda BPlen. Aqui você terá consolidado o histórico e planejamento da sua agenda conosco como: os 1 to 1, sessões de feedback, desenvolvimento de carreira e mentoria. Após a conclusão de cada agenda, será disponibilizada uma ata e um espaço para você avaliar a sua experiência.",
    buttonLabel: "Entendi"
  },
  {
    targetId: "hub-assessments",
    title: "Perfil & Assessments",
    content: "Nesta área, organizaremos os resultados das suas análises comportamentais. Cada assessment (como DISC e Gestão do Tempo) contribuirá para o melhor planejamento e desenvolvimento do seu perfil profissional.",
    buttonLabel: "Espero descobrir meu perfil profissional logo! Me leve para o próximo módulo."
  },
  {
    targetId: "hub-etapa-checkin",
    title: "Trilha de Checkpoints",
    content: "Aqui na lateral esquerda você tem a sua trilha de atividades. Cada módulo é composto por checkings ou conteúdos que você precisa concluir para avançar para a próxima etapa. Fique de olho nela!",
    buttonLabel: "Perfeito, vou acompanhar por aqui."
  },
  {
    targetId: "hub-conteudo",
    title: "Central de Conteúdo Educativo",
    content: "No centro da tela encontra-se a área principal de conteúdo e execução de tarefas! Sempre que houver um formulário, vídeo ou agendamento, ele será feito e reproduzido exatamente aqui.",
    buttonLabel: "Ficou muito claro!"
  },
  {
    title: "Tour Concluído!",
    content: "{User_Nickname}, parabéns! Você está pronto para dar o seu primeiro passo oficial como Membro BPlen. Basta clicar abaixo para encerrar nosso guia e iniciar a sua jornada.",
    buttonLabel: "Finalizar Tour"
  }
];
