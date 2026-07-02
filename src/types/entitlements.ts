/**
 * BPlen HUB — Tipos de Cotas do Membro
 *
 * Nota: o tipo `UserEntitlement` e a coleção órfã `entitlements` (com a action
 * `entitlements.ts`) foram removidos na Fase 0 (F0-04) por serem código morto —
 * o acesso real do produto é resolvido via `User_Permissions/access.services` +
 * `grantServiceEntitlement` (`@/lib/checkout`). Este arquivo permanece porque
 * hospeda os tipos de cota ativos (`MemberQuota`/`MemberQuotaWallet`), usados por
 * `quotas.ts` e `useJourney.ts`.
 */

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
