"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth-guards";
import { PartnerData } from "./admin/partners";
import { getErrorMessage } from "@/lib/utils/errors";
import { safeSerialize } from "@/lib/utils/firestore";

/**
 * BPlen HUB — Networking Engine 🌐🧬
 * Busca e consolida dados de membros, profissionais e parceiros para interação.
 */

interface NetworkingContactItem {
  value: string;
  visible: boolean;
}

export interface NetworkingMember {
  id: string; // Matricula
  name: string;
  photoUrl: string;
  pitch: string;
  hashtags: string[];
  isProfessional: boolean;
  contacts: Record<string, NetworkingContactItem | undefined>;
  cvVisible: boolean;
  portfolioVisible: boolean;
  cvUrl?: string;
  portfolioUrl?: string;
  cvName?: string;
  portfolioName?: string;
}

export type NetworkingTab = "membros" | "profissionais" | "parceiros";

/**
 * Busca dados para a página de Networking baseada na aba e filtros
 */
export async function getNetworkingDataAction(
  tab: NetworkingTab,
  query?: string,
  serviceFilter?: string
) {
  try {
    // Espaco de conexao entre usuarios do sistema: exige sessao autenticada.
    // Nao altera a logica de visibilidade (opt-in do dono via networking_visibility
    // e flags por campo) nem o shape dos dados — so garante que o solicitante e um
    // usuario logado. Caller unico e a pagina do hub (membro), ja atras do guard
    // server-side do hub/layout.tsx.
    await requireAuth();

    const db = getAdminDb();

    // 1. ABA: PARCEIROS 🤝
    if (tab === "parceiros") {
      // Busca simples sem compound queries (evita necessidade de índice)
      const snapshot = await db.collection("Partners").get();
      let results = snapshot.docs
        .map(doc => safeSerialize<PartnerData>({ id: doc.id, ...doc.data() }))
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

        // Privacidade (BUG-033): só exporta ao client o VALOR de contatos/CV/portfólio
        // quando o dono marcou como visível. Antes o payload trazia os valores ocultos
        // e o filtro era só no client (vazamento). As flags seguem para a UI.
        const cvVisible = netProfile.cv_networking_visibility || false;
        const portfolioVisible = netProfile.portfolio_networking_visibility || false;
        // O perfil salva cada contato como { value, isPublic }; o networking expõe
        // { value, visible }. Antes o filtro lia `visible` (campo inexistente) e os
        // contatos nunca apareciam (BUG-033/7.1). Lê `isPublic` (tolera `visible` legado).
        const rawContacts = (netProfile.contacts || {}) as Record<string, { value?: string; isPublic?: boolean; visible?: boolean } | undefined>;
        const safeContacts: Record<string, NetworkingContactItem> = {};
        for (const [key, item] of Object.entries(rawContacts)) {
          const isPublic = item?.isPublic ?? item?.visible ?? false;
          if (isPublic && item?.value) {
            safeContacts[key] = { value: item.value, visible: true };
          }
        }

        return {
          id: doc.id,
          // "Nome para exibição" definido pelo membro tem prioridade; senão cai no
          // nome completo / nome de autenticação / apelido (item 2.9).
          name: netProfile.display_name || d.profile?.fullName || d.Authentication_Name || d.User_Nickname || d.nickname || "Membro BPlen",
          photoUrl: d.photoUrl || d.profile?.photoUrl || "",
          pitch: netProfile.sales_pitch || "",
          hashtags: netProfile.hashtags || [],
          isProfessional: netProfile.isBPlenProfessional || false,
          contacts: safeContacts,
          cvVisible,
          portfolioVisible,
          // URL do documento enviado (CV/portfólio) só trafega quando o dono ativa
          // a visibilidade — a leitura no card é via proxy /api/docs (BUG-071).
          cvUrl: cvVisible ? (netProfile.cv_doc_url || "") : "",
          portfolioUrl: portfolioVisible ? (netProfile.portfolio_doc_url || "") : "",
          cvName: cvVisible ? (netProfile.cv_doc_name || "Currículo") : "",
          portfolioName: portfolioVisible ? (netProfile.portfolio_doc_name || "Portfólio") : ""
        } as NetworkingMember;
      })
      .filter(Boolean) as NetworkingMember[];

    // Filtro de busca (o filtro por estágio foi removido — lia campo morto, BUG-033)
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
