/**
 * BPlen HUB — Invitation Engine Types (📧💎)
 * Definições de tipos e interfaces para eventos de convite e tokens de acesso único.
 */

export interface InvitationEvent {
  slug: string; // Ex: "pre_inauguracao"
  name: string; // Ex: "Pré-Inauguração BPlen"
  date: string; // Formato ISO "YYYY-MM-DD" ou descritivo
  time: string; // Formato "HH:MM"
  location: string; // Endereço físico completo
  specificMessage: string; // Mensagem customizada (ex: "intimista com convidados especiais")
  description?: string; // Descrição opcional
  isActive?: boolean;
  createdAt?: string; // Serialized string ISO para compatibilidade Next.js RSC
}

export interface InvitationToken {
  token: string; // Ex: "BPL-INV-8F2A9C"
  eventSlug: string; // Ex: "pre_inauguracao"
  status: "unused" | "claimed";
  claimedBy: string | null; // Matrícula do usuário que utilizou o token
  claimedAt: string | null; // Data de claim
  createdAt: string;
  guestName?: string | null;
  guestEmail?: string | null;
}
