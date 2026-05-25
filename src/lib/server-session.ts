import { getAdminAuth } from "./firebase-admin";
import { fetchUserPermissionsStatus } from "@/actions/auth-permissions";
import { UserRole, UserServices } from "@/types/users";
import { verifySignedSession } from "@/actions/auth-session";

export interface Session {
  uid: string;
  email?: string;
  isAdmin: boolean;
  role?: UserRole;
  services?: UserServices;
  matricula: string | null;
}

/**
 * Resolve a identidade do chamador no servidor.
 * Suporta ID Token JWT (Alta Segurança) ou Cookie de Sessão Assinado.
 * 
 * @param idToken Token de identidade opcional (usado por Server Actions chamadas pelo cliente).
 * @returns Objeto Session ou null se inválido.
 */
export async function getServerSession(idToken?: string): Promise<Session | null> {
  let uid: string | null = null;
  let email: string | undefined = undefined;

  try {
    // 1. Prioridade: ID Token JWT (Vindo do cliente via argumento)
    if (idToken) {
      const decodedToken = await getAdminAuth().verifyIdToken(idToken);
      uid = decodedToken.uid;
      email = decodedToken.email;
    } 
    // 2. Fallback: Cookie de Sessão Assinado (verificação criptográfica 🛡️)
    else {
      const session = await verifySignedSession();
      if (session) {
        uid = session.uid;
        email = session.email;
      }
    }

    if (!uid) return null;

    // 3. Resolver o Papel (Role), Serviços e Matrícula do Usuário via Admin SDK/Firestore
    const { isAdmin, role, services, matricula } = await fetchUserPermissionsStatus(uid);

    return {
      uid,
      email,
      isAdmin,
      role,
      services,
      matricula
    };
  } catch (error) {
    console.error("❌ [Server Session] Falha ao resolver identidade:", error);
    return null;
  }
}
