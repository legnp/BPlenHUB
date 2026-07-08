import { getAdminDb } from "./firebase-admin";
import { UserRole, UserServices } from "@/types/users";

/**
 * BPlen HUB — Resolvedor cru de permissoes (primitivo de sessao)
 *
 * Le o papel/servicos/matricula de um uid ja verificado. NAO faz guard proprio:
 * e chamado por `getServerSession` DEPOIS de a identidade ja ter sido verificada
 * (idToken ou cookie). Guardar aqui com `requireAuth`/`getServerSession` causaria
 * recursao infinita. O acesso exposto na rede (com trava de dono) vive no action
 * `fetchUserPermissionsStatus`, que delega para esta funcao.
 */
export async function resolveUserPermissions(
  uid: string
): Promise<{ isAdmin: boolean; role: UserRole; services: UserServices; matricula: string | null; dispensaPreRequisito: string[] }> {
  try {
    const uidMapRef = getAdminDb().collection("_AuthMap").doc(uid);
    const uidMapSnap = await uidMapRef.get();

    if (!uidMapSnap.exists) {
      console.warn(`⚠️ [Auth Status] UID ${uid} não encontrado no _AuthMap.`);
      return { isAdmin: false, role: "visitor", services: {}, matricula: null, dispensaPreRequisito: [] };
    }

    const matricula = uidMapSnap.data()?.matricula || null;
    const permissionsPath = `User/${matricula}/User_Permissions/access`;
    const permissionsRef = getAdminDb().doc(permissionsPath);
    const permSnap = await permissionsRef.get();

    console.log(`🔍 [Auth Trace] UID: ${uid} | Matrícula Resolvida: ${matricula} | Path: ${permissionsPath}`);

    if (!permSnap.exists) {
      return { isAdmin: false, role: "member", services: {}, matricula, dispensaPreRequisito: [] };
    }

    const data = permSnap.data();

    return {
      isAdmin: data?.admin === true,
      role: (data?.role || (data?.admin ? "admin" : "member")) as UserRole,
      services: (data?.services || {}) as UserServices,
      matricula,
      // Waiver de pre-requisito (Fase A/A3) — lido pelo motor de acesso (Fase B2)
      dispensaPreRequisito: Array.isArray(data?.dispensaPreRequisito) ? (data.dispensaPreRequisito as string[]) : []
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ [Auth Status] Falha ao buscar permissões do servidor:", errorMessage);
    return { isAdmin: false, role: "visitor", services: {}, matricula: null, dispensaPreRequisito: [] };
  }
}
