"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth-guards";
import { resolveMatricula } from "./get-user-results";
import { PartnerData } from "./admin/partners";
import { getErrorMessage } from "@/lib/utils/errors";

/**
 * BPlen HUB — Networking Engine 🌐🧬
 * Busca e consolida dados de membros, profissionais e parceiros para interação.
 */

export interface NetworkingMember {
  id: string; // Matricula
  name: string;
  photoUrl: string;
  pitch: string;
  hashtags: string[];
  journeyStageId: string;
  isProfessional: boolean;
  contacts: any;
  cvVisible: boolean;
  portfolioVisible: boolean;
  cvUrl?: string;
  portfolioUrl?: string;
}

export type NetworkingTab = "membros" | "profissionais" | "parceiros";

/**
 * Busca dados para a página de Networking baseada na aba e filtros
 */
export async function getNetworkingDataAction(
  tab: NetworkingTab,
  query?: string,
  stageFilter?: string,
  serviceFilter?: string
) {
  try {
    const db = getAdminDb();
    
    // 1. ABA: PARCEIROS 🤝
    if (tab === "parceiros") {
      // Busca simples sem compound queries (evita necessidade de índice)
      const snapshot = await db.collection("Partners").get();
      let results = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as PartnerData))
        .filter(p => p.isActive === true); // Filtra client-side

      // Filtro de ramo de atuação
      if (serviceFilter && serviceFilter !== "Todos") {
        results = results.filter(p => p.serviceType === serviceFilter);
      }

      // Filtro de consulta (busca por texto)
      if (query) {
        const q = query.toLowerCase();
        results = results.filter(p => 
          p.name.toLowerCase().includes(q) || 
          p.description.toLowerCase().includes(q) ||
          p.serviceType.toLowerCase().includes(q) ||
          p.keywords?.some(k => k.toLowerCase().includes(q))
        );
      }

      return { success: true, type: "partners", data: results };
    }

    // 2. ABAS: MEMBROS OU PROFISSIONAIS 🧬
    // Busca simples + filtro client-side (evita compound queries e índices no Firestore)
    const snapshot = await db.collection("User").get();
    
    let users = snapshot.docs
      .map(doc => {
        const d = doc.data();
        const netProfile = d.profile?.networking || {};
        
        // Apenas usuários com visibilidade habilitada
        if (!netProfile.networking_visibility) return null;
        
        // Filtro de profissionais
        if (tab === "profissionais" && !netProfile.isBPlenProfessional) return null;

        return {
          id: doc.id,
          name: d.profile?.fullName || d.Authentication_Name || d.User_Nickname || d.nickname || "Membro BPlen",
          photoUrl: d.photoUrl || d.profile?.photoUrl || "",
          pitch: netProfile.sales_pitch || "",
          hashtags: netProfile.hashtags || [],
          journeyStageId: d.User_JourneyMap?.current_stage || "onboarding",
          isProfessional: netProfile.isBPlenProfessional || false,
          contacts: netProfile.contacts || {},
          cvVisible: netProfile.cv_networking_visibility || false,
          portfolioVisible: netProfile.portfolio_networking_visibility || false,
          cvUrl: d.profile?.address?.cv_url || "",
          portfolioUrl: d.profile?.address?.portfolio_url || ""
        } as NetworkingMember;
      })
      .filter(Boolean) as NetworkingMember[];

    // Filtros de Busca e Estágio
    if (stageFilter && stageFilter !== "Todos") {
      users = users.filter(u => u.journeyStageId === stageFilter);
    }

    if (query) {
      const q = query.toLowerCase();
      users = users.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.pitch.toLowerCase().includes(q) ||
        u.hashtags?.some(h => h.toLowerCase().includes(q))
      );
    }

    return { success: true, type: "members", data: users };

  } catch (error: unknown) {
    console.error("❌ [NetworkingAction] Erro:", getErrorMessage(error), error);
    return { success: false, error: getErrorMessage(error), data: [] };
  }
}
