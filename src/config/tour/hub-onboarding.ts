import { TourStep } from "@/components/shared/GuidedTourOverlay";

export const hubOnboardingSteps: TourStep[] = [
  {
    route: "/hub",
    targetId: "hub-social-menu-btn",
    title: "Seu Menu Principal",
    content: "{User_Nickname}, aqui você acessa todas as suas configurações, áreas exclusivas e também nossas redes sociais da Conexão Digital. Vamos abrir e dar uma olhada!",
    buttonLabel: "Ver Menu",
    customAction: "open_social_menu",
    placement: 'left',
    gap: 300,
  },
  {
    route: "/hub",
    targetId: "hub-social-menu-area",
    title: "Áreas do Hub",
    content: "Aqui você encontra os atalhos para navegar nas áreas do HUB, como: Início, a Área de Membro, Seus Contratos, Configurações e o Networking BPlen. \n\n(Nós vamos te guiar por algumas dessas funções logo a seguir!).",
    buttonLabel: "Entendi",
  },
  {
    route: "/hub/profile_settings",
    targetId: "tour-profile-photo",
    title: "Sua Identidade",
    content: "Vamos personalizar o seu espaço! \n\nAqui você pode escolher uma foto de perfil para te representar dentro da BPlen HUB. \n\nVocê pode adicioná-la agora, ou se preferir pode retornar mais tarde!",
    buttonLabel: "Próximo Passo",
  },
  {
    route: "/hub",
    targetId: "jornada-membro-card",
    title: "Jornada Membro BPlen",
    content: "Este espaço é habilitado especialmente para clientes que se tornam Membros BPlen. \n\nEsse espaço é onde toda a jornada de desenvolvimento de carreira acontece.\n\nMas te liberamos a etapa e Primeiros Passos para que você desfrute um pouco da plataforma!",
    buttonLabel: "Vamos lá",
  },
  {
    route: "/hub",
    targetId: "ultimos-conteudos",
    title: "Novidades quentinhas!",
    content: "Voltando para o Hub... Neste bloco você sempre terá acesso aos conteúdos mais recentes da BPlen, para nunca perder nenhuma atualização importante.",
    buttonLabel: "Ok, Entendi",
  },
  {
    route: "/hub",
    targetId: "primeiros-passos-acesso",
    title: "Trilha de Início",
    content: "Aqui é o seu atalho rápido para os 'Primeiros Passos', onde você começa sua jornada de desenvolvimento.",
    buttonLabel: "Legal",
  },
  {
    route: "/hub/primeiros_passos",
    targetId: "hub-primeiros-passos-nav",
    title: "Trilha de Conhecimento",
    content: "Dentro dos Primeiros Passos, o conteúdo é dividido por Checkpoints. É aqui que os materiais, vídeos e desafios são apresentados para você evoluir passo a passo.",
    buttonLabel: "Entendi",
  },
  {
    route: "/hub/primeiros_passos",
    targetId: "hub-support-btn",
    title: "Canais de Suporte",
    content: "Se precisar de ajuda: o ícone de exclamação abre um formulário para você reportar bugs ou abrir chamados técnicos. O botão do WhatsApp te leva direto para conversar com nossa equipe!",
    buttonLabel: "Ótimo",
  },
  {
    route: "/hub/primeiros_passos",
    targetId: "theme-switcher-btn",
    title: "Sua Cara, Suas Cores",
    content: "Você pode mudar o tema do Hub a qualquer momento clicando aqui. \n\nNavegue e escolha a paleta que mais combina com você!",
    buttonLabel: "Prosseguir",
  },
  {
    route: "/hub/primeiros_passos",
    title: "Tudo Pronto!",
    content: "{User_Nickname}, te damos as boas vindas à BPlen HUB! Te desejamos sucesso na sua jornada rumo ao sucesso da sua carreira! \n\nAproveite o melhor do BPlen HUB, esse espaço é todo seu!",
    buttonLabel: "Explorar a Plataforma",
  }
];
