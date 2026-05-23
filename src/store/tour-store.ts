import { create } from 'zustand';

export interface TourStepConfig {
  targetId?: string;
  route: string; // Rota necessária para este passo (ex: "/hub", "/hub/profile_settings")
  title?: string;
  content: string;
  buttonLabel?: string;
  // Ação customizada a ser executada ANTES ou DURANTE o passo.
  // Ex: "open_social_menu", "reveal_item_1", etc.
  customAction?: string; 
  placement?: 'right' | 'left' | 'top' | 'bottom' | 'center';
  gap?: number;
}

interface TourState {
  isActive: boolean;
  tourId: string | null;
  steps: TourStepConfig[];
  currentIndex: number;
  isNavigating: boolean;
  
  // Ações
  startTour: (tourId: string, steps: TourStepConfig[]) => void;
  endTour: () => void;
  nextStep: () => void;
  setNavigating: (navigating: boolean) => void;
}

export const useTourStore = create<TourState>((set, get) => ({
  isActive: false,
  tourId: null,
  steps: [],
  currentIndex: 0,
  isNavigating: false,

  startTour: (tourId, steps) => set({
    isActive: true,
    tourId,
    steps,
    currentIndex: 0,
    isNavigating: false
  }),

  endTour: () => set({
    isActive: false,
    tourId: null,
    steps: [],
    currentIndex: 0,
    isNavigating: false
  }),

  nextStep: () => {
    const { currentIndex, steps } = get();
    if (currentIndex < steps.length - 1) {
      set({ currentIndex: currentIndex + 1 });
    } else {
      // Chegou ao fim
      get().endTour();
    }
  },

  setNavigating: (isNavigating) => set({ isNavigating }),
}));
