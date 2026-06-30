import { it, expect } from "vitest";
import { getAdminDb } from "../src/lib/firebase-admin";

it("Diagnóstico de integridade de usuários", async () => {
  console.log("🔍 [Diagonal] Iniciando diagnóstico de integridade de usuários...");
  
  const authMapRef = getAdminDb().collection("_AuthMap");
  const authMapSnap = await authMapRef.get();
  
  console.log(`📊 Total no _AuthMap: ${authMapSnap.size}`);
  
  const mismatches: any[] = [];
  
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
    
    console.log(`✅ UID: ${uid} -> Matrícula: ${matricula} | Acesso Área Membro: ${hasAccess}`);
  }
  
  if (mismatches.length > 0) {
    console.warn("⚠️ Inconsistências encontradas:");
    console.table(mismatches);
  } else {
    console.log("✨ Nenhuma inconsistência de mapeamento encontrada.");
  }
}, 30000); // 30s timeout
