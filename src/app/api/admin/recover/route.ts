import { NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { getErrorMessage } from "@/lib/utils/errors";

/**
 * Rota de Emergência para Recuperação de Conta Admin 🛡️
 * O script de reset pode ter apagado o documento de usuário se o email logado 
 * era diferente de "legnp@bplen.com". Esta rota restaura os privilégios totais.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email") || "lisandra.lencina@bplen.com";

  try {
    const auth = getAdminAuth();
    const db = getAdminDb();

    // 1. Busca o UID do usuário no Firebase Auth
    let uid = "";
    try {
      const userRecord = await auth.getUserByEmail(email);
      uid = userRecord.uid;
    } catch (err) {
      return NextResponse.json({ 
        success: false, 
        message: `Usuário com email ${email} não encontrado no Firebase Auth. Faça login pelo menos uma vez.` 
      }, { status: 404 });
    }

    // Usaremos o próprio email como matrícula para garantir unicidade e facilitar gestão
    const matricula = email;

    const batch = db.batch();

    // 2. Restaura o _AuthMap
    const authMapRef = db.collection("_AuthMap").doc(uid);
    batch.set(authMapRef, {
      matricula,
      email: email.toLowerCase(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      recoveredBySystem: true
    }, { merge: true });

    // 3. Restaura o Documento User
    const userRef = db.collection("User").doc(matricula);
    batch.set(userRef, {
      email: email.toLowerCase(),
      User_Email: email.toLowerCase(),
      Authentication_Email: email.toLowerCase(),
      User_Nickname: "Lisandra (Admin)",
      onboardStatus: "completed",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // 4. Restaura as Permissões Soberanas na subcoleção
    const permRef = userRef.collection("User_Permissions").doc("access");
    batch.set(permRef, {
      admin: true,
      role: "admin",
      services: { member_area_access: true },
      grantedAt: admin.firestore.FieldValue.serverTimestamp(),
      grantedReason: "SYSTEM_EMERGENCY_RECOVERY"
    }, { merge: true });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: `Conta ${email} recuperada com sucesso! Você já pode acessar a área Admin.` 
    });

  } catch (error: unknown) {
    console.error("Erro na recuperação:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Falha na recuperação.", 
      error: getErrorMessage(error) 
    }, { status: 500 });
  }
}
