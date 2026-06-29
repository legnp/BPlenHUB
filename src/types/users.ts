import { Timestamp } from "firebase/firestore";

/**
 * BPlen HUB — User Permissions & Roles (Governança 👥🛡️)
 */

export type UserRole = "visitor" | "member" | "admin" | "suspended";

/**
 * Catálogo de Serviços/Produtos BPlen (Foundation)
 * Chaves padronizadas para controle granular de acesso.
 */
export interface UserServices {
  hub_community?: boolean;
  survey_welcome?: boolean;
  content_premium?: boolean;
  mentoria_1to1?: boolean;
  career_planning?: boolean;
  behavioral_analysis?: boolean;
  member_area_access?: boolean; // 🔒 Acesso Restrito À Área de Membros
  [key: string]: boolean | undefined; // Permite expansão dinâmica
}

/**
 * BPlen HUB — User Admin Schema (Segurança e Operação 🛡️)
 * Estrutura consolidada para exibição no painel administrativo.
 */
export interface AdminUser {
  matricula: string;
  uid?: string;
  name: string;
  nickname?: string;
  email: string;
  isAdmin: boolean;
  onboardStatus?: "completed" | "pending" | "none";
  createdAt?: Timestamp | string;
  lastLogin?: Timestamp | string;
  
  // 👥 Papel/Perfil (Governança Central)
  role: UserRole; 
  
  // 🏗️ Serviços/Entitlements (Acesso Granular)
  services: UserServices;
  
  // 🎯 Cotas de Sessões Customizadas
  mentoCoachSessionsLimit?: number;

  // 🌟 Status Profissional BPlen (Curadoria de Networking)
  isProfessional?: boolean;

  // 📝 Metadados Operacionais
  metadata?: {
    disc_link?: string;
    [key: string]: unknown;
  };
}
