"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { getDriveClient } from "@/lib/google-auth";
import { ensureFolder, uploadFileToDrive, makeFilePublic } from "@/lib/drive-utils";
import { requireAuth, AuthorizationError } from "@/lib/auth-guards";
import { serverEnv } from "@/env";
import { Readable } from "stream";

/**
 * BPlen HUB — Profile Actions 🧬🛡️
 * Motor de sincronização de identidade (Foto -> Drive -> Firestore).
 */

export async function updateProfileImageAction(matricula: string, base64Image: string) {
  console.log(`🛡️ [ProfileAction:Soberano] Iniciando atualização para matrícula: ${matricula}`);
  try {
    // Guard de sessao + dono (via cookie assinado). Bloqueia IDOR: um usuario
    // so pode alterar a propria foto (ou admin). Ver BUG-019.
    const session = await requireAuth();
    if (session.matricula !== matricula && !session.isAdmin) {
      throw new AuthorizationError("Voce nao tem permissao para alterar a foto deste perfil.");
    }

    const drive = await getDriveClient();
    
    // 1. Identificar Segmento (B2B/B2C) — Regra de Negócio BPlen 🛡️
    const isPJ = matricula.includes("-PJ-");
    const subFolderName = isPJ ? "2.3.B2B" : "2.2.B2C";

    // 2. Garantir a hierarquia de pastas
    const baseFolderId = serverEnv.GOOGLE_DRIVE_USUARIOS_ID;
    const categoryFolderId = await ensureFolder(drive, baseFolderId, subFolderName);
    const userFolderId = await ensureFolder(drive, categoryFolderId, matricula);
    const identidadFolderId = await ensureFolder(drive, userFolderId, "Identidade");
    
    // 3. Converter Base64 para Buffer
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    
    // 4. Upload do arquivo
    const fileName = `foto_profile_${matricula}.webp`;
    const result = await uploadFileToDrive(
      drive,
      identidadFolderId,
      fileName,
      "image/webp",
      Readable.from(buffer)
    );

    // 5. Garantir Soberania de Visibilidade (Público para Leitura) 🔓
    await makeFilePublic(drive, result.id);

    // 6. Gerar URL de Incorporação Direta (Formato Proxy Server-Side) 📸
    const directPhotoUrl = `/api/media/${result.id}`;

    // 7. Atualizar o Firestore do Membro via Admin SDK (Soberania de Dados) 🛡️
    const db = getAdminDb();
    await db.collection("User").doc(matricula).set({
      photoUrl: directPhotoUrl,
      photoDriveId: result.id,
      lastPhotoUpdate: new Date().toISOString()
    }, { merge: true });

    console.log(`✅ [ProfileAction:Soberano] Foto atualizada no Firestore para ${matricula}`);

    return { 
      success: true, 
      photoUrl: directPhotoUrl 
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ [ProfileAction] Erro ao atualizar foto:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Remove a foto de perfil e retorna para as iniciais.
 */
export async function deleteProfileImageAction(matricula: string) {
  try {
    // Guard de sessao + dono (via cookie assinado). Bloqueia IDOR. Ver BUG-019.
    const session = await requireAuth();
    if (session.matricula !== matricula && !session.isAdmin) {
      throw new AuthorizationError("Voce nao tem permissao para remover a foto deste perfil.");
    }

    const db = getAdminDb();
    await db.collection("User").doc(matricula).set({
      photoUrl: null,
      photoDriveId: null,
      lastPhotoUpdate: new Date().toISOString()
    }, { merge: true });
    
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ [ProfileAction] Erro ao remover foto:", errorMessage);
    return { success: false, error: errorMessage };
  }
}
