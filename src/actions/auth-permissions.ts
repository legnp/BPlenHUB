"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { UserRole, UserServices } from "@/types/users";
import { verifySignedSession } from "@/actions/auth-session";
import { resolveUserPermissions } from "@/lib/user-permissions";

/**
 * BPlen HUB — Auth Permissions Action (Segurança 🛡️)
 * Verifica permissões e garante automação de "Admin" para conta Master.
 * Transição para Firebase Admin SDK (Node.js) para governança soberana.
 */

// ──────────────────────────────
// Governança: Allowlist de Administradores Master (Soberania 🛡️)
// Apenas estes e-mails recebem auto-grant se o banco estiver vazio ou para recuperação.
// ──────────────────────────────
const MASTER_EMAILS = [
  "lisandra.lencina@bplen.com", 
  "it@bplen.com", 
  "legnp@bplen.com"
];

export async function syncUserPermissionsOnLogin(uid: string, email: string | null) {
  try {
    // 🛡️ Guard anti-escalacao (BUG-032): nao confiar nos parametros. O cookie de
    // sessao assinado ja existe neste ponto do login (criado por
    // createSignedSessionCookie antes desta chamada). Exigimos que o chamador seja
    // o proprio uid e usamos o e-mail VERIFICADO do cookie para o teste de master —
    // caso contrario qualquer membro poderia passar um e-mail master e se autoconceder admin.
    const caller = await verifySignedSession();
    if (!caller || caller.uid !== uid) {
      console.error("❌ [Auth Sync] Chamador nao corresponde ao uid informado. Sincronizacao negada.");
      return { isAdmin: false, role: "visitor", services: {} };
    }
    email = caller.email ?? null;
    if (!email) return { isAdmin: false, role: "visitor", services: {} };

    const isMasterEmail = MASTER_EMAILS.includes(email.toLowerCase());


    // 1. Determina a Matrícula via UID Mapping (ou Autocorreção via Email) 🛡️
    const uidMapRef = getAdminDb().collection("_AuthMap").doc(uid);
    const uidMapSnap = await uidMapRef.get();

    let matricula = "";
    if (uidMapSnap.exists) {
      const data = uidMapSnap.data();
      matricula = data?.matricula;
      const storedEmail = data?.email;

      // 🚨 Validação de Consistência: Se o e-mail mudou para este UID, re-validamos
      if (storedEmail && email && storedEmail !== email.toLowerCase()) {
         console.warn(`⚠️ [Auth Sync] Conflito de E-mail detectado: ${storedEmail} -> ${email}. Re-sincronizando...`);
         // Buscar matrícula correta pelo novo e-mail
         const correctUserSnap = await getAdminDb()
           .collection("User")
           .where("email", "==", email.toLowerCase())
           .limit(1)
           .get();
         
         if (!correctUserSnap.empty) {
            matricula = correctUserSnap.docs[0].id;
            await uidMapRef.update({ 
               matricula, 
               email: email.toLowerCase(),
               updatedAt: admin.firestore.FieldValue.serverTimestamp() 
            });
         }
      }
    } else {
      // 🔄 Auto-Cura: Se o UID não existe, buscamos por e-mail na coleção User
      console.log(`🔍 [Auth Sync] UID Novo. Tentando localizar por e-mail: ${email}...`);
      const userByEmailSnap = await getAdminDb()
        .collection("User")
        .where("email", "==", email.toLowerCase())
        .limit(1)
        .get();
        
      if (!userByEmailSnap.empty) {
        matricula = userByEmailSnap.docs[0].id;
        await uidMapRef.set({ 
          matricula, 
          email: email.toLowerCase(),
          healedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ [Auth Sync] Mapeamento auto-corrigido: ${uid} -> ${matricula}`);
      }
    }

    console.log(`🔍 [Auth Trace] UID: ${uid} | Matrícula Final: ${matricula || "Visitante"}`);

    if (!matricula) {
       return { 
         isAdmin: isMasterEmail, 
         role: isMasterEmail ? "admin" : "visitor", 
         services: {} 
       };
    }

    // 2. Lógica de Registro/Verificação de Permissão no Banco (Path Soberano)
    const permissionsPath = `User/${matricula}/User_Permissions/access`;
    const permissionsRef = getAdminDb().doc(permissionsPath);
    const permSnap = await permissionsRef.get();

    let isAdmin = false;
    let currentPerms = permSnap.exists ? permSnap.data() : null;

    // 🩹 AUTO-HEALING: Migração de Dados Órfãos (Soberania 3.1 🛡️)
    // Se não houver dados na subcoleção soberana, verificamos na raiz legada.
    const rootPermRef = getAdminDb().collection("User_Permissions").doc(uid);
    const rootPermSnap = await rootPermRef.get();

    if (rootPermSnap.exists && (!currentPerms || !currentPerms.services || Object.keys(currentPerms.services).length === 0)) {
      console.warn(`🩹 [Auth:Healing] Dados herdados encontrados na ROOT para UID: ${uid}. Migrando para Matrícula: ${matricula}...`);
      const rootData = rootPermSnap.data();
      
      const healingData = {
        role: rootData?.role || "member",
        services: rootData?.services || {},
        onboardStatus: rootData?.onboardStatus || "pending",
        healedAt: admin.firestore.FieldValue.serverTimestamp(),
        healingOrigin: "LEGACY_ROOT_MIGRATION"
      };

      await permissionsRef.set(healingData, { merge: true });
      
      // Marcar raiz como migrada para evitar loops ou confusão futura
      await rootPermRef.update({ migratedToSubcollection: true, migratedAt: admin.firestore.FieldValue.serverTimestamp() });
      
      // Atualizar estado local para o retorno da função
      currentPerms = { ...currentPerms, ...healingData };
      console.log(`✅ [Auth:Healing] Migração soberana concluída com sucesso para ${email}`);
    }

    if (currentPerms) {
      isAdmin = currentPerms.admin === true;
    }

    // 3. Auto-Grant para Master Accounts
    if (isMasterEmail && !isAdmin) {
      await permissionsRef.set({
        admin: true,
        grantedAt: admin.firestore.FieldValue.serverTimestamp(),
        grantedReason: "SYSTEM_MASTER_AUTO_GRANT"
      }, { merge: true });
      isAdmin = true;
      console.log(`✅ [Segurança] Admin Auto-Grant via Admin SDK: ${email}`);
      
      // Re-fetch para ter dados consistentes no retorno
      const updatedSnap = await permissionsRef.get();
      currentPerms = updatedSnap.data();
    }

    return {
      isAdmin,
      role: (currentPerms?.role || (isAdmin ? "admin" : "member")) as UserRole,
      services: (currentPerms?.services || {}) as UserServices
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ [Auth Sync] Erro na sincronização de permissões:", errorMessage);
    return { isAdmin: false, role: "visitor", services: {} };
  }
}

/**
 * Busca o Status de Permissão (Server Authority 🛡️)
 */
export async function fetchUserPermissionsStatus(uid: string): Promise<{ isAdmin: boolean; role: UserRole; services: UserServices; matricula: string | null; dispensaPreRequisito: string[] }> {
    // 🛡️ Guard de dono (BUG-020): esta e a porta exposta na rede. Um chamador so
    // pode ler as proprias permissoes. A resolucao crua vive em
    // `@/lib/user-permissions` e e usada por `getServerSession` (identidade ja
    // verificada la), evitando recursao com o guard de sessao.
    const caller = await verifySignedSession();
    if (!caller || caller.uid !== uid) {
      return { isAdmin: false, role: "visitor", services: {}, matricula: null, dispensaPreRequisito: [] };
    }
    return resolveUserPermissions(uid);
}
