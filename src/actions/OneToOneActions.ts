"use server";

import admin, { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-guards";
import { getErrorMessage } from "@/lib/utils/errors";

/**
 * BPlen HUB — One-to-One Settings Actions
 * Gerencia os tipos de serviços 1-to-1 para o dropdown do usuário.
 */

const SETTINGS_DOC_ID = "OneToOne";
const SETTINGS_COLLECTION = "Settings";

export async function getOneToOneTypes(): Promise<string[]> {
  try {
    const db = getAdminDb();
    const docRef = db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      return docSnap.data()?.types || [];
    }
    return [];
  } catch (error) {
    console.error("Erro ao buscar tipos 1-to-1:", error);
    return [];
  }
}

export async function updateOneToOneTypes(types: string[], idToken?: string) {
  try {
    // 🛡️ Segurança Real no Servidor
    await requireAdmin(idToken);
    
    const db = getAdminDb();
    const docRef = db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);
    
    await docRef.set({ 
      types,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    return { success: true };
  } catch (error: unknown) {
    console.error("Erro ao atualizar tipos 1-to-1:", error);
    return { success: false, message: getErrorMessage(error, "Erro ao salvar configurações.") };
  }
}
