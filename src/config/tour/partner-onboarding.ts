import { TourStep } from "@/components/shared/GuidedTourOverlay";

/**
 * Tour guiado da Area de Parceiros — checkpoint 1 da jornada de parceria
 * ("Boas-vindas", deixado por ultimo a pedido da Gestora, para so existir depois que
 * todas as telas que ele apresenta ja estivessem prontas).
 *
 * Adaptado do tour do hub: mesma mecanica, paradas proprias. Ele apresenta a alternancia
 * de contexto (que e' a novidade estrutural para quem ja usa o hub) e as tres frentes da
 * parceria — jornada, agenda e indicacoes.
 */
export const partnerOnboardingSteps: TourStep[] = [
  {
    route: "/hub/partners",
    targetId: "hub-social-menu-btn",
    title: "Seu menu, agora com a parceria",
    content:
      "{User_Nickname}, sua área de parceria está ativa. Tudo dela vive no mesmo menu que você já usa — vamos abrir para você ver.",
    buttonLabel: "Ver menu",
    customAction: "open_social_menu",
    placement: "left",
    gap: 40,
    holePadding: 16,
    holeRadius: 60,
  },
  {
    route: "/hub/partners",
    targetId: "hub-social-menu-area",
    title: "Alternar entre membro e parceiro",
    content:
      "No topo do menu está o seletor de contexto. Ele troca a sua navegação entre a área de membro e a de parceria, sem precisar sair da conta.\n\nA seção Parceria reúne os atalhos das suas telas.",
    buttonLabel: "Entendi",
    holePadding: 20,
    holeRadius: 40,
  },
  {
    route: "/hub/partners",
    targetId: "partner-home-atalhos",
    title: "As três frentes da parceria",
    content:
      "Jornada, Agenda e Indicações. A jornada é o ponto de partida: é ela que libera cada parte da parceria, começando pelo check-in e pela formalização.",
    buttonLabel: "Próximo",
    holePadding: 16,
  },
  {
    route: "/hub/partners",
    targetId: "partner-home-metricas",
    title: "Seu acompanhamento",
    content:
      "Aqui ficam suas indicações registradas, o repasse acumulado e os ciclos em aberto. Quando um ciclo precisar do seu recibo, o aviso aparece nesta mesma tela.",
    buttonLabel: "Concluir",
    holePadding: 16,
  },
];
