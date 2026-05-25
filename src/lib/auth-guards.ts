import { getServerSession, Session } from "./server-session";
import { revalidateTag } from "next/cache";

/**
 * BPlen HUB — Autenticação e Autorização Protegida (Guards 🛡️)
 * Camada reutilizável para bloquear execuções no servidor quando não autorizado.
 */

export class AuthorizationError extends Error {
  constructor(message = "Acesso Negado: Ação restrita a administradores.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Exige permissão Administrativa para continuar a execução.
 * 
 * @param idToken Token de Identidade opcional (atualmente obrigatório enquanto não houver cookies).
 * @returns Objeto Session se autenticado e autorizado.
 * @throws {AuthorizationError} Se a identidade não for resolvida ou o usuário não for admin.
 */
export async function requireAdmin(idToken?: string): Promise<Session> {
  const session = await getServerSession(idToken);

  if (!session) {
    console.error("❌ [Authorization] Falha na identificação do chamador.");
    throw new AuthorizationError("Sessão inválida ou expirada. Autentique-se novamente.");
  }

  // 🚨 BLOCK: Banimento Global
  if (session.role === "suspended") {
     throw new AuthorizationError("Sua conta foi suspensa por violar os termos da consultoria. Entre em contato com o suporte.");
  }

  if (!session.isAdmin) {
    console.error(`❌ [Authorization] Acesso bloqueado para o UID: ${session.uid}`);
    throw new AuthorizationError("Você não tem permissão para realizar esta operação.");
  }

  // Se passou, logamos o acesso legítimo (Auditoria 🕵️)
  console.log(`✅ [Authorization] Acesso administrativo autorizado para: ${session.email}`);
  
  return session;
}

/**
 * Exige permissão de Área de Membro para continuar a execução.
 * 
 * @param idToken Token de Identidade opcional.
 * @returns Objeto Session se autenticado e autorizado.
 * @throws {AuthorizationError} Se o usuário não tiver o entitlement 'member_area_access'.
 */
export async function requireMemberAccess(idToken?: string): Promise<Session> {
  const session = await getServerSession(idToken);

  if (!session) {
    throw new AuthorizationError("Sessão inválida ou expirada. Autentique-se novamente.");
  }

  // 🚨 BLOCK: Banimento Global
  if (session.role === "suspended") {
     throw new AuthorizationError("Acesso Negado: Sua assinatura bPlen foi suspensa. Verifique sua situação financeira ou termos de uso.");
  }

  // 🚨 Governança Soberana v3.1: Acesso Granular
  // No BPlen HUB, privilégio administrativo não herda acesso à experiência de membro.
  // Isso permite que gestores testem o bloqueio e gerenciem acessos de forma isolada.
  const hasAccess = session.services?.member_area_access === true;

  if (!hasAccess) {
    console.error(`❌ [Authorization] Acesso À ÁREA DE MEMBRO negado para o UID: ${session.uid}`);
    throw new AuthorizationError("Seu plano atual não inclui acesso a esta área restrita ou o acesso foi revogado pela administração.");
  }

  console.log(`✅ [Authorization] Acesso à Área de Membro autorizado para: ${session.email}`);
  return session;
}

/**
 * Exige apenas autenticação simples para prosseguir (ex: Checkout).
 * 
 * @param idToken Token de Identidade opcional.
 * @returns Objeto Session se autenticado.
 * @throws {AuthorizationError} Se a identidade não for resolvida.
 */
export async function requireAuth(idToken?: string): Promise<Session> {
  const session = await getServerSession(idToken);

  if (!session) {
    throw new AuthorizationError("Sessão inválida ou expirada. Autentique-se novamente.");
  }

  // Banimento impede até o checkout
  if (session.role === "suspended") {
     throw new AuthorizationError("Sua conta está suspensa. Não é possível realizar novas contratações.");
  }

  return session;
}

/**
 * Exige matrícula ativa para prosseguir (ex: Etapa final de Checkout).
 * 
 * @param idToken Token de Identidade opcional.
 * @returns Objeto Session se autenticado e com matrícula.
 * @throws {AuthorizationError} Se não possuir matrícula.
 */
export async function requireMatricula(idToken?: string): Promise<Session> {
  const session = await requireAuth(idToken);

  if (!session.matricula) {
    console.error(`❌ [Authorization] Matrícula ausente para o UID: ${session.uid}`);
    throw new AuthorizationError("MATRICULA_REQUIRED");
  }

  return session;
}
