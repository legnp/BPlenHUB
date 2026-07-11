"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-guards";
import { getDriveClient } from "@/lib/google-auth";
import { ensureFolder, uploadFileToDrive } from "@/lib/drive-utils";
import { serverEnv } from "@/env";
import { Readable } from "stream";
import { FieldValue } from "firebase-admin/firestore";
import { PRODUCTS_COLLECTION, USER_COLLECTION } from "@/config/collections";
import { Product } from "@/types/products";
import { getErrorMessage } from "@/lib/utils/errors";

/**
 * Upload da NOTA FISCAL de um contrato pelo admin (CT-4, item d — ver
 * docs/system-audit/CONTRACTS-DESIGN.md). Anexa o arquivo à entidade de contrato
 * (`User/{matricula}/Contracts/{contractId}.invoice`); o painel do membro passa a
 * exibir/baixar. `requireAdmin` — área admin/identidade.
 */

/** Id determinístico do contrato por serviço (mesmo do generateContractPdf/CT-1). */
function contractIdFor(serviceCode: string | null | undefined, slug: string | null | undefined, id: string): string {
  return String(serviceCode || slug || id).replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function attachContractInvoiceAction(
  matricula: string,
  productId: string,
  base64File: string,
  fileName: string,
  mimeType: string = "application/pdf"
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    await requireAdmin();
    const db = getAdminDb();

    // Resolve o produto (por id, com fallback por slug) para chegar ao contractId.
    let productDoc = await db.collection(PRODUCTS_COLLECTION).doc(productId).get();
    if (!productDoc.exists) {
      const bySlug = await db.collection(PRODUCTS_COLLECTION).where("slug", "==", productId).limit(1).get();
      if (!bySlug.empty) productDoc = bySlug.docs[0];
    }
    const product = productDoc.exists ? (productDoc.data() as Product) : null;
    const contractId = contractIdFor(product?.serviceCode, product?.slug ?? null, productId);

    const contractRef = db.collection(USER_COLLECTION).doc(matricula).collection("Contracts").doc(contractId);
    const contractSnap = await contractRef.get();
    if (!contractSnap.exists) {
      return { success: false, error: "Contrato não encontrado para este serviço/cliente." };
    }

    // Decodifica o arquivo (data URL base64) e envia ao Drive na pasta do cliente.
    const base64Data = base64File.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const drive = await getDriveClient();
    const baseFolderId = serverEnv.GOOGLE_DRIVE_USUARIOS_ID;
    const isPJ = matricula.includes("-PJ-");
    const categoryFolderId = await ensureFolder(drive, baseFolderId, isPJ ? "2.3.B2B" : "2.2.B2C");
    const userFolderId = await ensureFolder(drive, categoryFolderId, matricula);
    const invoiceFolderId = await ensureFolder(drive, userFolderId, "3.Notas Fiscais");

    const safeName = (fileName || `NotaFiscal_${contractId}`).replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const result = await uploadFileToDrive(drive, invoiceFolderId, safeName, mimeType, Readable.from(buffer));

    await contractRef.set(
      {
        invoice: {
          url: result.webViewLink,
          uploadedAt: FieldValue.serverTimestamp(),
          uploadedByAdmin: true,
        },
      },
      { merge: true }
    );

    console.log(`[Contract Invoice] Nota fiscal anexada ao contrato ${contractId} de ${matricula}.`);
    return { success: true, url: result.webViewLink };
  } catch (error: unknown) {
    console.error("[Contract Invoice] Erro:", error);
    return { success: false, error: getErrorMessage(error, "Falha ao anexar a nota fiscal.") };
  }
}
