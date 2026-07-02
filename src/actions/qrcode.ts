"use server";

import admin, { getAdminDb } from "@/lib/firebase-admin";
import { getDriveClient } from "@/lib/google-auth";
import { ensureFolder, uploadFileToDrive, makeFilePublic } from "@/lib/drive-utils";
import { serverEnv } from "@/env";
import { Readable } from "stream";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guards";
import { BPlenQRCode } from "@/types/qrcode";
import { getErrorMessage } from "@/lib/utils/errors";

const COLLECTION_NAME = "qrcodes";

/**
 * Auxiliar para converter instâncias de Timestamp do Firestore em strings ISO,
 * garantindo que sejam 100% serializáveis pelo Next.js (RSC/Client).
 */
function serializeTimestamp(timestamp: unknown): string {
  if (!timestamp) return new Date().toISOString();
  if (typeof timestamp === "object" && typeof (timestamp as { toDate?: unknown }).toDate === "function") {
    return (timestamp as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof timestamp === "object" && timestamp !== null && typeof (timestamp as { seconds?: unknown }).seconds === "number") {
    return new Date((timestamp as { seconds: number }).seconds * 1000).toISOString();
  }
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  if (typeof timestamp === "string") {
    return timestamp;
  }
  return new Date().toISOString();
}

/**
 * Auxiliar síncrono privado para limpar strings de títulos em nomes de arquivos válidos.
 */
function sanitizeFileName(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "_")
    .replace(/-+/g, "_");
}

/**
 * Server Action: Cria e registra um novo QR Code no Firestore e Google Drive.
 * Recebe o arquivo PNG e metadados no FormData de forma segura.
 */
export async function createQRCodeAction(formData: FormData, adminToken: string) {
  try {
    // 1. Guard de Segurança: Bloquear acessos não autorizados
    await requireAdmin(adminToken);

    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const link = formData.get("link") as string | null;

    if (!file || !title || !link) {
      throw new Error("Dados incompletos fornecidos para a criacao do QR Code.");
    }

    // 2. Preparar integração do Google Drive
    const drive = await getDriveClient();
    const baseFolderId = serverEnv.GOOGLE_DRIVE_ROOT_ID;

    // Garantir existência da subpasta 'QR Codes' de forma organizada
    const qrFolderId = await ensureFolder(drive, baseFolderId, "QR Codes");

    // 3. Conversão de arquivo para Stream legível pela Google API
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = Readable.from(buffer);

    // Formatar nome do arquivo: qr_code_[titulo]_[data].png
    const dateStr = new Date().toISOString().split("T")[0];
    const cleanTitle = sanitizeFileName(title);
    const fileName = `qr_code_${cleanTitle}_${dateStr}.png`;

    // 4. Executar Upload e Definir Permissões
    const uploadResult = await uploadFileToDrive(
      drive,
      qrFolderId,
      fileName,
      "image/png",
      stream
    );

    // Tornar arquivo público para visualização
    await makeFilePublic(drive, uploadResult.id);

    // 5. Salvar registro final no Cloud Firestore
    const db = getAdminDb();
    const docRef = await db.collection(COLLECTION_NAME).add({
      title,
      link,
      driveFileId: uploadResult.id,
      driveUrl: uploadResult.webViewLink,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 6. Atualizar caminhos estáticos
    revalidatePath("/admin/qrcodes");

    return {
      success: true,
      id: docRef.id,
      driveUrl: uploadResult.webViewLink,
    };
  } catch (err: unknown) {
    console.error("Erro critico na criacao do QR Code:", err);
    return {
      success: false,
      error: getErrorMessage(err, "Erro interno ao processar e salvar o QR Code."),
    };
  }
}

/**
 * Server Action: Lista todos os QR Codes gerados no Firestore.
 */
export async function getQRCodesAction(adminToken: string) {
  try {
    // Guard de Segurança
    await requireAdmin(adminToken);

    const db = getAdminDb();
    const querySnapshot = await db
      .collection(COLLECTION_NAME)
      .orderBy("createdAt", "desc")
      .get();

    const qrcodes: BPlenQRCode[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      qrcodes.push({
        id: doc.id,
        title: data.title,
        link: data.link,
        driveFileId: data.driveFileId,
        driveUrl: data.driveUrl,
        createdAt: serializeTimestamp(data.createdAt),
      });
    });

    return { success: true, qrcodes };
  } catch (err: unknown) {
    console.error("Erro ao listar os QR Codes:", err);
    return {
      success: false,
      error: getErrorMessage(err, "Falha ao recuperar a listagem de QR Codes."),
    };
  }
}

/**
 * Server Action: Remove o QR Code do Firestore e do Google Drive corporativo.
 */
export async function deleteQRCodeAction(id: string, driveFileId: string, adminToken: string) {
  try {
    // Guard de Segurança
    await requireAdmin(adminToken);

    const db = getAdminDb();

    // 1. Remover do Google Drive se houver ID de arquivo válido
    if (driveFileId) {
      const drive = await getDriveClient();
      try {
        await drive.files.delete({
          fileId: driveFileId,
          supportsAllDrives: true,
        });
      } catch (driveErr) {
        console.warn(`Aviso: Falha ao deletar arquivo ${driveFileId} no Drive. Continuando exclusao no banco...`, driveErr);
      }
    }

    // 2. Remover do Firestore
    await db.collection(COLLECTION_NAME).doc(id).delete();

    // 3. Atualizar caminhos
    revalidatePath("/admin/qrcodes");

    return { success: true };
  } catch (err: unknown) {
    console.error("Erro critico na exclusao do QR Code:", err);
    return {
      success: false,
      error: getErrorMessage(err, "Falha ao remover o registro do QR Code."),
    };
  }
}
