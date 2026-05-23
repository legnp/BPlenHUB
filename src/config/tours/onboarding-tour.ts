import { TourStepConfig } from "@/store/tour-store";

export const onboardingTourConfig: TourStepConfig[] = [
  {
    route: "/hub",
    targetId: "hub-social-menu-btn", // ID do botão de chevron no HubHeader
    title: "Seu Menu Principal",
    content: "{User_Nickname}, aqui você acessa todas as suas configurações, áreas exclusivas e também nossas redes sociais da Conexão Digital. Vamos abrir e dar uma olhada!",
    buttonLabel: "Ver Menu",
    customAction: "open_social_menu", // Instrução para o HubHeader expandir o menu
    placement: 'left',
    gap: 300,
  },
  {
    route: "/hub",
    targetId: "hub-social-menu-area", // Área interna do menu sanduíche
    title: "Áreas do Hub",
    content: "Aqui você encontra o Início, a Área de Membro, Seus Contratos, Configurações e o Networking BPlen. (Nós vamos te guiar por algumas dessas funções logo a seguir!).",
    buttonLabel: "Entendi",
    customAction: "reveal_menu_items", // Animação sequencial (Início, Área Membro...)
  },
  {
    route: "/hub/profile_settings",
    targetId: "tour-profile-photo",
    title: "Sua Identidade",
    content: "Vamos personalizar o seu espaço! Você pode escolher uma foto de perfil para te representar dentro da BPlen. Se preferir, pode pular e adicionar mais tarde.",
    buttonLabel: "Próximo Passo",
  },
  {
    route: "/hub",
    targetId: "ultimos-conteudos",
    title: "Novidades Quentinhos",
    content: "Voltando para o Hub... Neste bloco você sempre terá acesso aos conteúdos mais recentes da BPlen, para nunca perder nenhuma atualização importante.",
    buttonLabel: "Ok, Entendi",
  },
  {
    route: "/hub",
    targetId: "primeiros-passos-acesso",
    title: "Trilha de Início",
    content: "Aqui é o seu atalho rápido para os 'Primeiros Passos', onde você começa sua jornada de aprendizado.",
    buttonLabel: "Legal",
  },
  {
    route: "/hub",
    targetId: "jornada-membro-card",
    title: "Jornada BPlen",
    content: "Este espaço é habilitado especialmente para membros BPlen que contratam serviços. Mas a etapa de Primeiros Passos está liberada para que você conheça como funciona a plataforma!",
    buttonLabel: "Vamos lá",
  },
  {
    route: "/hub/primeiros_passos",
    targetId: "checkpoints-area",
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
    content: "Você pode mudar o tema do Hub a qualquer momento clicando aqui. Navegue e escolha a paleta que mais combina com você!",
    buttonLabel: "Prosseguir",
  },
  {
    route: "/hub/primeiros_passos",
    // Sem targetId, fica centralizado
    title: "Tudo Pronto!",
    content: "Seja muito bem-vinda(o) à BPlen HUB, {User_Nickname}! Desejamos uma excelente utilização da plataforma. O espaço é todo seu!",
    buttonLabel: "Explorar a Plataforma",
  }
];
