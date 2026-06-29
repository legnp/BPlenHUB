"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { requireAdmin } from "@/lib/auth-guards";
import { AdminUser, UserRole, UserServices } from "@/types/users";
import { revalidatePath } from "next/cache";

/**
 * Constantes de Governança (Allowlist 🛡️)
 */
const ALLOWED_ROLES: UserRole[] = ["visitor", "member", "admin"];
const ALLOWED_SERVICE_KEYS = [
  "hub_community",
  "survey_welcome",
  "content_premium",
  "mentoria_1to1",
  "career_planning",
  "behavioral_analysis",
  "member_area_access"
];

import { toISOSafe } from "@/lib/date-utils";

/**
 * Retorna a lista completa de usuários para o painel administrativo.
 */
export async function getAdminUsersList(adminToken?: string): Promise<{ success: boolean; data?: AdminUser[]; error?: string }> {
  try {
    // 🛡️ Segurança Real no Servidor
    await requireAdmin(adminToken);

    // 1. Puxar todos os usuários da base principal (Node Admin SDK)
    const usersRef = getAdminDb().collection("User");
    const usersSnap = await usersRef.get();

    // 2. Puxar todas as permissões administrativas via Collection Group
    const permissionsRef = getAdminDb().collectionGroup("User_Permissions");
    const permissionsSnap = await permissionsRef.get();

    // Mapear dados de permissão por matrícula para busca O(1)
    interface AccessDocData {
      role?: UserRole;
      services?: UserServices;
      admin?: boolean;
      metadata?: {
        disc_link?: string;
        [key: string]: any;
      };
    }
    
    const permissionsMap = new Map<string, AccessDocData>();
    const quotasMap = new Map<string, number>();

    permissionsSnap.forEach(docSnap => {
       if (docSnap.id === "access") {
          const matricula = docSnap.ref.parent.parent?.id;
          if (matricula) {
             permissionsMap.set(matricula, docSnap.data() as AccessDocData);
          }
       }
       if (docSnap.id === "quotas") {
          const matricula = docSnap.ref.parent.parent?.id;
          if (matricula) {
             const data = docSnap.data();
             const limit = data.mentoCoachSessionsLimit !== undefined 
               ? data.mentoCoachSessionsLimit 
               : (data.quotas && data.quotas["1-TO-1"] ? data.quotas["1-TO-1"].total : 10);
             quotasMap.set(matricula, limit);
          }
       }
    });

    // 3. Montar a lista consolidada
    const adminUsers: AdminUser[] = [];

    usersSnap.forEach(docSnap => {
      const data = docSnap.data();
      const matricula = docSnap.id;
      const perm = permissionsMap.get(matricula) || {};
      
      const name = data.Authentication_Name || data.User_Name || "Membro BPlen";
      const nickname = data.User_Nickname || "";

      // Normalização de Papel (Role)
      const resolvedRole: UserRole = perm.role || (perm.admin ? "admin" : "member");

      // SERIALIZAÇÃO SEGURA: Governança de Datas 🛡️
      const createdAtData = toISOSafe(data.createdAt) || undefined;
      const lastLoginData = toISOSafe(data.lastLogin) || undefined;

      adminUsers.push({
        matricula,
        uid: data.uid || "", // 🧬 Crucial para governança de identidade
        name,
        nickname,
        email: data.email || data.User_Email || "",
        isAdmin: resolvedRole === "admin",
        role: resolvedRole,
        services: perm.services || {},
        mentoCoachSessionsLimit: quotasMap.get(matricula) ?? 10,
        metadata: perm.metadata || {},
        isProfessional: data.profile?.networking?.isBPlenProfessional || false,
        onboardStatus: data.hasCompletedWelcome ? "completed" : "pending",
        createdAt: createdAtData,
      });
    });

    return { success: true, data: adminUsers.sort((a, b) => a.name.localeCompare(b.name)) };

  } catch (error: any) {
    console.error("❌ [Users Admin] Falha ao listar usuários:", error.message);
    return { success: false, error: error.message || "Falha ao carregar lista de usuários." };
  }
}

/**
 * Atualiza permissões granulares de um usuário (Papel e Serviços).
 */
export async function updateUserPermissions(
  targetMatricula: string, 
  updates: { 
    role?: UserRole; 
    services?: UserServices; 
    metadata?: { 
      disc_link?: string;
      maslow_menor_pilar?: string;
      maslow_maior_pilar?: string;
      combustiveis_custom?: string[];
      barreiras_custom?: string[];
    };
  },
  adminToken?: string
) {
  try {
    // 🛡️ Segurança Real no Servidor
    const session = await requireAdmin(adminToken);

    // 1. Validação de Payload (Enforcement de Tipagem no Servidor) 🛡️
    const dataToSave: {
       updatedAt: admin.firestore.FieldValue;
       updatedBy: string;
       role?: UserRole;
       admin?: boolean;
       services?: UserServices;
       metadata?: { disc_link?: string; [key: string]: any };
    } = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: `ADMIN:${session.email || session.uid}`
    };

    if (updates.role) {
       if (!ALLOWED_ROLES.includes(updates.role)) {
          throw new Error(`Papel inválido: ${updates.role}`);
       }
       dataToSave.role = updates.role;
       dataToSave.admin = updates.role === "admin";
    }

    if (updates.services) {
       // Governança Dinâmica: Aceitamos qualquer chave de serviço vinculada a um produto real
       dataToSave.services = updates.services;
    }
    
    if (updates.metadata) {
      dataToSave.metadata = updates.metadata;
    }

    // 2. Proteção Anti-Lockout 🚨
    // Se o admin está tentando se rebaixar, verificamos se ele é o último.
    const isSelfEdit = session.uid === targetMatricula || (session.email && session.email === updates.role); 
    // Nota: UID e Matrícula podem variar. Idealmente comparamos o email ou UID se disponível.
    // Para simplificar, focaremos na regra de "Mínimo de 1 Admin na base".
    
    if (updates.role && updates.role !== "admin") {
      const allAdminsSnap = await getAdminDb()
        .collectionGroup("User_Permissions")
        .where("admin", "==", true)
        .limit(2) // Só preciso saber se tem mais de um
        .get();
      
      if (allAdminsSnap.size <= 1) {
         throw new Error("Operação Bloqueada: Você não pode remover o último administrador do sistema.");
      }
    }

    const permissionsPath = `User/${targetMatricula}/User_Permissions/access`;
    const permissionsRef = getAdminDb().doc(permissionsPath);

    // Escrita Soberana via Admin SDK
    await permissionsRef.set(dataToSave, { merge: true });

    revalidatePath("/admin/users");
    
    console.log(`✅ [Governance Admin] Permissões atualizadas para ${targetMatricula} no path: ${permissionsPath}`);
    return { success: true };

  } catch (error: any) {
    console.error("❌ [Governance Admin] Falha ao atualizar permissões:", error.message);
    throw new Error(error.message || "Falha ao atualizar governança do usuário.");
  }
}

/**
 * forceIdentifyUser (Cura de Identidade 🧬)
 * Vincula manualmente um UID a uma matrícula existente.
 */
export async function forceIdentifyUser(matricula: string, targetUid: string, adminToken?: string) {
  try {
    // 🛡️ Segurança Real no Servidor
    await requireAdmin(adminToken);
    const db = getAdminDb();

    // 1. Atualizar Documento do Usuário
    await db.doc(`User/${matricula}`).update({
      uid: targetUid,
      identityRecoveredAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2. Atualizar AuthMap (🧬 Vínculo Vital)
    await db.doc(`_AuthMap/${targetUid}`).set({
      matricula,
      manualLink: true,
      linkedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (err: any) {
    console.error("❌ [forceIdentifyUser] Erro ao vincular manual:", err);
    return { success: false, error: err.message || "Erro desconhecido ao vincular." };
  }
}

/**
 * Ativa ou Desativa o status de Profissional BPlen de um usuário 🛡️🌟
 */
export async function toggleProfessionalStatusAction(matricula: string, status: boolean, adminToken?: string) {
  try {
    await requireAdmin(adminToken);
    const db = getAdminDb();

    await db.doc(`User/${matricula}`).set({
      profile: {
        networking: {
          isBPlenProfessional: status,
          lastProfessionalStatusUpdate: admin.firestore.FieldValue.serverTimestamp()
        }
      }
    }, { merge: true });

    revalidatePath("/admin/users");
    revalidatePath("/hub/networking");
    
    console.log(`✅ [Governance Admin] Status Profissional ${status ? 'ATIVADO' : 'DESATIVADO'} para ${matricula}`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ [ToggleProfessional] Erro:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Define o limite customizado de sessões de MentoCoach (Cotas 1 to 1) do usuário.
 */
export async function updateMentoCoachSessionsQuotaAction(matricula: string, limit: number, adminToken?: string) {
  try {
    const session = await requireAdmin(adminToken);
    const db = getAdminDb();
    
    const quotaRef = db.doc(`User/${matricula}/User_Permissions/quotas`);
    
    // Gravamos no documento 'quotas' a variável raiz mentoCoachSessionsLimit
    // e atualizamos a auditoria de quem modificou
    await quotaRef.set({
      mentoCoachSessionsLimit: limit,
      updatedBy: session.email || session.uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    revalidatePath("/admin/users");
    revalidatePath("/hub/membro/gestao_carreira");
    
    console.log(`✅ [Governance Admin] Limite de MentoCoach ajustado para ${limit} na matrícula ${matricula}`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ [UpdateMentoCoachQuota] Erro:", error);
    return { success: false, error: error.message || "Erro ao atualizar cota de MentoCoach." };
  }
}

