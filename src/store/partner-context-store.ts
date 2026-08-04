import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Contexto ativo do hub — Membro ou Parceiro
 * (PARTNER-AREA-EXPANSION-PLAN.md secao 3).
 *
 * IMPORTANTE: esta store NUNCA e' fonte de autorizacao. Ela guarda apenas a
 * preferencia de navegacao do usuario (qual contexto ele estava vendo por ultimo),
 * persistida no navegador. Quem PODE ver a area de parceiro e' decidido pelo
 * `services.partner_area_access`, resolvido no servidor a cada request pelo gate de
 * rota (`src/app/hub/partners/layout.tsx`) e em tempo real no client pelo
 * `AuthContext`. Um usuario que forjar o valor guardado no navegador nao ganha
 * nenhum acesso — cai no redirect do gate.
 */

export type HubContext = "member" | "partner";

interface PartnerContextState {
  activeContext: HubContext;
  /** Vira `true` quando a preferencia guardada no navegador ja foi lida. */
  hasHydrated: boolean;
  setActiveContext: (context: HubContext) => void;
  setHasHydrated: (hydrated: boolean) => void;
}

export const usePartnerContextStore = create<PartnerContextState>()(
  persist(
    (set) => ({
      activeContext: "member",
      hasHydrated: false,
      setActiveContext: (activeContext) => set({ activeContext }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "bplen_active_context",
      // So a preferencia e' persistida; `hasHydrated` e' estado de runtime.
      partialize: (state) => ({ activeContext: state.activeContext }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
