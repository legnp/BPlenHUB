import { create } from 'zustand';
import { TourStep } from '@/components/shared/GuidedTourOverlay';

interface TourState {
  isActive: boolean;
  tourId: string | null;
  steps: TourStep[];
  currentIndex: number;
  isNavigating: boolean;
  
  // Ações
  startTour: (tourId: string, steps: TourStep[]) => void;
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
