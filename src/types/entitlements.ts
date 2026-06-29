/**
 * BPlen HUB — Entitlements & Access Control 🛡️
 * Define quem tem acesso ao que, e qual o progresso.
 */

export type EntitlementStatus = 'active' | 'completed' | 'expired' | 'suspended';

export interface UserEntitlement {
  id: string;
  uid: string;
  productId: string;
  
  status: EntitlementStatus;
  
  // Metadados de Aquisição
  acquiredAt: string;
  expiresAt?: string;
  
  // Progresso granular no serviço
  progress: {
    completedSubSteps: string[];
    lastAccessedAt: string;
    overallPercentage: number;
  };

  // Histórico de transação (Opcional, link para faturamento)
  transactionId?: string;
}

/**
 * Carteira de Cotas do Membro
 * Rastreia o saldo de créditos para agendamentos e serviços.
 */
export interface MemberQuota {
  total: number;
  used: number;
  lastUpdated: string;
}

export interface MemberQuotaWallet {
  uid: string;
  mentoCoachSessionsLimit?: number; // Cota manual administrativa
  quotas: Record<string, MemberQuota>; // Tipo de Evento -> Dados de Cota
}
