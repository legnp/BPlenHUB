"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { getDriveClient, getSheetsClient } from "@/lib/google-auth";
import { ensureFolder, createSpreadsheet, syncDataToSheet, uploadFileToDrive, makeFilePublic } from "@/lib/drive-utils";
import { serverEnv, clientEnv } from "@/env";
import { Product } from "@/types/products";
import { Readable } from "stream";
import { revalidatePath } from "next/cache";
import { PRODUCTS_COLLECTION } from "@/config/collections";

/**
 * BPlen HUB — Product Synchronizer (Drive & Sheets) 🛰️
 * Garante que cada serviço tenha sua pasta e documentação no Google Workspace.
 */

/**
 * Sincroniza um produto com o Google Drive
 */
export async function syncProductToDriveAction(product: Product) {
  try {
    const drive = await getDriveClient();
    const sheets = await getSheetsClient();
    
    // 1. Garantir Pasta de Serviços (Catálogo)
    const portfolioId = serverEnv.GOOGLE_DRIVE_PORTFOLIO_ID;
    const servicesFolderId = await ensureFolder(drive, portfolioId, "Serviços");

    // 2. Garantir Pasta Específica do Serviço: {ID}_{Nome}
    const folderName = `${product.serviceCode}_${product.title}`;
    const serviceFolderId = await ensureFolder(drive, servicesFolderId, folderName);

    // 3. Garantir Planilha de Registro
    let sheetId = product.driveConfig?.sheetId;
    let sheetUrl = product.driveConfig?.sheetUrl;

    if (!sheetId) {
      const sheet = await createSpreadsheet(drive, serviceFolderId, `Ficha_Tecnica_${product.serviceCode}`);
      sheetId = sheet.id;
      sheetUrl = sheet.webViewLink;
    }

    // 4. Sincronizar Dados na Planilha
    const headers = [
      "ID do Serviço", "Título", "Slug", "Preço", "Público-Alvo", 
      "Descrição", "Link no HUB", "Última Atualização"
    ];

    const audiences = product.targetAudiences.join(", ");
    const hubLink = `${clientEnv.NEXT_PUBLIC_APP_URL}/servicos/${product.targetAudiences[0]}/${product.slug}`;
    
    const rowData = [
      product.serviceCode,
      product.title,
      product.slug,
      product.price,
      audiences,
      product.sheet.description,
      hubLink,
      new Date().toLocaleString("pt-BR")
    ];

    await syncDataToSheet(sheets, sheetId, headers, rowData);

    console.log(`✅ [Drive Sync] Serviço ${product.serviceCode} sincronizado.`);

    return { 
      success: true, 
      folderId: serviceFolderId, 
      sheetId, 
      sheetUrl 
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ [Drive Sync] Erro Crítico:", errorMessage);
    return { success: false, error: errorMessage };
  }
}


/**
 * Upload de Capa diretamente para o Drive do Serviço
 */
export async function uploadProductCoverAction(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    const folderId = formData.get("folderId") as string;
    const serviceCode = formData.get("serviceCode") as string;
    const productId = formData.get("productId") as string; // Adicionado para soberania Firestore

    if (!file || !folderId) throw new Error("Arquivo ou Pasta de destino ausentes.");

    const drive = await getDriveClient();
    
    // Stream Conversion
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = Readable.from(buffer);

    // Upload (Nomenclatura: CAPA_{ID}_{NOME})
    const fileName = `CAPA_${serviceCode}_${file.name}`;
    const result = await uploadFileToDrive(drive, folderId, fileName, file.type, stream);

    // 🛡️ 1. Garantir Soberania de Visibilidade Pública
    await makeFilePublic(drive, result.id);

    // 📸 2. Gerar URL de Imagem Direta (Formato Proxy Server-Side)
    const directUrl = `/api/media/${result.id}`;

    // 🧬 3. Atualizar Firestore Imediatamente (Soberania Admin)
    if (productId) {
      const db = getAdminDb();
      await db.collection(PRODUCTS_COLLECTION).doc(productId).set({
        sheet: {
          coverImage: directUrl
        },
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log(`✅ [Product Cover] Firestore atualizado para o produto: ${productId}`);
      
      // ⚡ Revalidação de Cache para reflexão imediata
      revalidatePath("/admin/products");
      revalidatePath("/servicos");
    }

    return { 
      success: true, 
      url: directUrl,
      fileId: result.id
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ [Product Cover Upload] Erro:", errorMessage);
    return { success: false, error: errorMessage };
  }
}
