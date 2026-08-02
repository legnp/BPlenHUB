import { it, expect } from "vitest";
import { getAdminDb } from "../src/lib/firebase-admin";

/** Inconsistencia entre o _AuthMap e a colecao User. */
interface AuthMapMismatch {
  uid: string;
  matricula?: string;
  error: string;
}

it("Diagnóstico de integridade de usuários", async () => {
  console.log("[diagnose-auth] Iniciando diagnostico de integridade de usuarios...");

  const authMapRef = getAdminDb().collection("_AuthMap");
  const authMapSnap = await authMapRef.get();

  console.log(`[diagnose-auth] Total no _AuthMap: ${authMapSnap.size}`);

  const mismatches: AuthMapMismatch[] = [];
  
  for (const doc of authMapSnap.docs) {
    const data = doc.data();
    const uid = doc.id;
    const matricula = data.matricula;
    
    if (!matricula) {
      mismatches.push({ uid, error: "Mapeamento sem matrícula" });
      continue;
    }
    
    const userRef = getAdminDb().collection("User").doc(matricula);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      mismatches.push({ uid, matricula, error: "Matrícula no _AuthMap não existe na coleção User" });
      continue;
    }
    
    const permsRef = userRef.collection("User_Permissions").doc("access");
    const permsSnap = await permsRef.get();
    
    const permsData = permsSnap.exists ? permsSnap.data() : null;
    const hasAccess = permsData?.services?.member_area_access === true;
    
    console.log(`[diagnose-auth] UID: ${uid} -> Matricula: ${matricula} | Acesso a area de membro: ${hasAccess}`);
  }

  if (mismatches.length > 0) {
    console.warn("[diagnose-auth] Inconsistencias encontradas:");
    console.table(mismatches);
  } else {
    console.log("[diagnose-auth] Nenhuma inconsistencia de mapeamento encontrada.");
  }
}, 30000); // 30s timeout
