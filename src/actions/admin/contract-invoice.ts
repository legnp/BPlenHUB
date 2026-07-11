"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-guards";
import { getDriveClient } from "@/lib/google-auth";
import { ensureFolder, uploadFileToDrive } from "@/lib/drive-utils";
import { serverEnv } from "@/env";
import { Readable } from "stream";
import { FieldValue } from "firebase-admin/firestore";
import { USER_COLLECTION } from "@/config/collections";
import { Contract } from "@/types/contracts";
import { getErrorMessage } from "@/lib/utils/errors";

/**
 * Gestão da NOTA FISCAL e listagem de contratos pelo admin (CT-4, item d — ver
 * docs/system-audit/CONTRACTS-DESIGN.md). Lê a entidade de contrato
 * (`User/{matricula}/Contracts`) e anexa a nota fiscal; o painel do membro passa a
 * exibir/baixar. `requireAdmin` — área admin/identidade.
 */

/** Linha serializável de contrato para a tela de admin. */
export interface AdminContractRow {
  contractId: string;
  productTitle: string | null;
  serviceCode: string | null;
  productSlug: string | null;
  status: string;
  origin: string | null;
  documentUrl: string | null;
  documentHash: string | null;
  signedAt: string | null;
  verificationCode: string | null;
  invoiceUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/** ISO seguro de um timestamp Firestore (Timestamp | string | null). */
function toIso(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object" && v !== null && "toDate" in v && typeof (v as { toDate: unknown }).toDate === "function") {
    try {
      return (v as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * ADMIN — lista os contratos do usuário pela ENTIDADE `Contracts` (chaveada por matrícula),
 * com TODOS os status (pendente/retificação/assinado/cancelado). Substitui a leitura antiga
 * de `Legal_Audits` pela chave errada (uid), que fazia o painel aparecer vazio.
 */
export async function getUserContractsAdminAction(
  matricula: string
): Promise<{ success: boolean; contracts?: AdminContractRow[]; error?: string }> {
  try {
    await requireAdmin();
    if (!matricula) return { success: false, error: "Matrícula ausente." };
    const db = getAdminDb();
    const snap = await db.collection(USER_COLLECTION).doc(matricula).collection("Contracts").get();
    const contracts: AdminContractRow[] = snap.docs.map((d) => {
      const c = d.data() as Contract;
      return {
        contractId: c.contractId || d.id,
        productTitle: c.productTitle ?? null,
        serviceCode: c.serviceCode ?? null,
        productSlug: c.productSlug ?? null,
        status: c.status ?? "pendente_assinatura",
        origin: c.origin ?? null,
        documentUrl: c.documentUrl ?? null,
        documentHash: c.documentHash ?? null,
        signedAt: c.signature?.signedAt ?? null,
        verificationCode: c.signature?.verificationCode ?? null,
        invoiceUrl: c.invoice?.url ?? null,
        createdAt: toIso(c.createdAt),
        updatedAt: toIso(c.updatedAt),
      };
    });
    // Pendentes primeiro, depois assinados; dentro, mais recentes primeiro.
    const rank: Record<string, number> = { pendente_assinatura: 0, em_retificacao: 1, assinado: 2, cancelado: 3 };
    contracts.sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9) || String(b.updatedAt).localeCompare(String(a.updatedAt)));
    return { success: true, contracts };
  } catch (error: unknown) {
    console.error("[Admin Contracts] Erro:", error);
    return { success: false, error: getErrorMessage(error, "Falha ao carregar os contratos do usuário.") };
  }
}

export async function attachContractInvoiceAction(
  matricula: string,
  contractId: string,
  base64File: string,
  fileName: string,
  mimeType: string = "application/pdf"
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    await requireAdmin();
    const db = getAdminDb();

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
