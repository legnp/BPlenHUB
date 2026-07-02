"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import admin from "firebase-admin";
import { getDriveClient } from "@/lib/google-auth";
import { ensureFolder, uploadFileToDrive, makeFilePublic } from "@/lib/drive-utils";
import { serverEnv } from "@/env";
import { Readable } from "stream";
import { revalidatePath } from "next/cache";
import { getErrorMessage } from "@/lib/utils/errors";
import { safeSerialize } from "@/lib/utils/firestore";

/**
 * BPlen HUB — Admin Partners Actions 🤝🛡️
 * Gestão de Parceiros Estratégicos e Ativos no Drive.
 */

export interface PartnerData {
  id?: string;
  name: string;
  description: string;
  serviceType: string; // Ramo de Atuação
  keywords: string[];
  photoUrl?: string;
  photoDriveId?: string;
  socials: {
    instagram?: string;
    linkedin?: string;
    site?: string;
  };
  isActive: boolean;
  createdAt?: string;
}

/**
 * Busca todos os parceiros cadastrados
 */
export async function getPartnersAction(): Promise<PartnerData[]> {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection("Partners").get();

    const rawPartners = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as (Omit<PartnerData, "createdAt"> & { createdAt?: FirebaseFirestore.Timestamp })[];

    // Ordenação client-side (evita necessidade de índice no Firestore)
    rawPartners.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    return safeSerialize<PartnerData[]>(rawPartners);
  } catch (error: unknown) {
    console.error("❌ [GetPartners] Erro:", getErrorMessage(error), error);
    return [];
  }
}

/**
 * Cria ou Atualiza um Parceiro com Upload para o Drive
 */
export async function upsertPartnerAction(data: PartnerData, base64Image?: string) {
  try {
    const db = getAdminDb();
    const drive = await getDriveClient();
    
    let photoUrl = data.photoUrl;
    let photoDriveId = data.photoDriveId;

    // 1. Processar Upload para o Drive se houver nova imagem 📸
    if (base64Image) {
      console.log(`📡 [AdminPartners] Iniciando upload para o Drive: ${data.name}`);
      
      // Hierarquia: 2.3.B2B > Parceiros > [Nome do Parceiro]
      const baseFolderId = serverEnv.GOOGLE_DRIVE_USUARIOS_ID;
      const b2bFolderId = await ensureFolder(drive, baseFolderId, "2.3.B2B");
      const partnersFolderId = await ensureFolder(drive, b2bFolderId, "Parceiros");
      const specificPartnerFolderId = await ensureFolder(drive, partnersFolderId, data.name);

      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const fileName = `foto_parceiro_${Date.now()}.webp`;

      const result = await uploadFileToDrive(
        drive,
        specificPartnerFolderId,
        fileName,
        "image/webp",
        Readable.from(buffer)
      );

      await makeFilePublic(drive, result.id);
      photoDriveId = result.id;
      photoUrl = `https://drive.google.com/thumbnail?id=${result.id}&sz=s1000`;
    }

    // 2. Salvar no Firestore 🏛️
    const partnerId = data.id || db.collection("Partners").doc().id;
    const partnerRef = db.collection("Partners").doc(partnerId);

    // Excluímos 'id' do body para não salvar o campo 'id' dentro do documento
    const { id: _excludeId, ...dataWithoutId } = data;

    const finalData = {
      ...dataWithoutId,
      photoUrl,
      photoDriveId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: data.createdAt || admin.firestore.FieldValue.serverTimestamp()
    };

    await partnerRef.set(finalData, { merge: true });
    
    revalidatePath("/hub/networking");
    revalidatePath("/admin/partners");

    return { success: true, id: partnerId };
  } catch (error: unknown) {
    console.error("❌ [UpsertPartner] Erro:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Remove um parceiro
 */
export async function deletePartnerAction(id: string) {
  try {
    const db = getAdminDb();
    await db.collection("Partners").doc(id).delete();
    
    revalidatePath("/hub/networking");
    revalidatePath("/admin/partners");
    
    return { success: true };
  } catch (error: unknown) {
    console.error("❌ [DeletePartner] Erro:", error);
    return { success: false };
  }
}
