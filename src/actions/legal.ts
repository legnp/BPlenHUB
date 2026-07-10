"use server";

import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { getDriveClient } from "@/lib/google-auth";
import { ensureFolder, uploadFileToDrive } from "@/lib/drive-utils";
import { serverEnv } from "@/env";
import PDFDocument from "pdfkit";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { Readable } from "stream";
import { getErrorMessage } from "@/lib/utils/errors";
import { safeSerialize } from "@/lib/utils/firestore";
import { Product } from "@/types/products";
import { buildContractClauses, ContractContentData } from "@/lib/contract-content";
import { PRODUCTS_COLLECTION, USER_ORDERS_COLLECTION, USER_COLLECTION } from "@/config/collections";
import { headers } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { ContractOrigin } from "@/types/contracts";

/**
 * Rótulo humano do meio de contratação, a partir do `gateway` gravado em User_Orders.
 * Evita expor strings internas (`retroactive_bypass`/`bplen_free_bypass`) no contrato.
 */
function friendlyGateway(gateway?: string): string {
  switch (gateway) {
    case "retroactive_bypass":
      return "Faturamento Interno (Retroativo)";
    case "bplen_free_bypass":
      return "Cortesia / Cupom BPlen";
    default:
      return "Pagamento Online";
  }
}

export interface LegalAudit {
  auditId: string;
  userId: string;
  productId: string;
  orderId: string | null;
  timestamp: string;
  ipAddress: string;
  documentUrl: string;
  documentHash: string;
}

// Subcoleção legada `User/{uid}/Orders` — sem escritor conhecido no código atual,
// distinta da coleção raiz `User_Orders` (ver src/actions/orders.ts). Campos
// opcionais porque o schema real não é garantido.
interface LegacyOrderDoc {
  productId?: string;
  totalAmount?: number;
  paymentMethod?: string;
}

export async function getPendingContracts(userId: string) {
  try {
    const db = getAdminDb();
    const ordersSnap = await db.collection("User").doc(userId).collection("Orders").where("status", "in", ["paid", "active", "completed"]).get();
    const auditsSnap = await db.collection("User").doc(userId).collection("Legal_Audits").get();
    
    const signedProductIds = new Set(auditsSnap.docs.map(d => d.data().productId));
    const pendingProducts: { productId: string, orderId: string, title: string }[] = [];
    
    for (const doc of ordersSnap.docs) {
      const order = doc.data() as LegacyOrderDoc;
      const pId = order.productId;
      if (pId && !signedProductIds.has(pId)) {
         // Check if product exists and if it requires SLA (we can just assume yes for now if it's an order)
         const pDoc = await db.collection("Products").doc(pId).get();
         if (pDoc.exists) {
            const pData = safeSerialize<Product>({ ...pDoc.data(), id: pDoc.id });
            if (pData.price !== 0) { // Or any logic to determine SLA
               pendingProducts.push({
                 productId: pId,
                 orderId: doc.id,
                 title: pData.title || pId
               });
            }
         }
      }
    }
    
    return { success: true, pendingProducts };
  } catch (error: unknown) {
    console.error("❌ [Pending Contracts] Erro:", error);
    return { success: false, pendingProducts: [] };
  }
}

export async function getUserLegalAudits(userId: string) {
  try {
    const db = getAdminDb();
    const auditsSnap = await db.collection("User").doc(userId).collection("Legal_Audits").orderBy("timestamp", "desc").get();
    const audits = auditsSnap.docs.map(d => d.data() as LegalAudit);
    return { success: true, audits };
  } catch (e: unknown) {
    return { success: false, audits: [] as LegalAudit[] };
  }
}

export async function generateContractPdf(
  userId: string,
  productId: string,
  orderId?: string,
  origin: ContractOrigin = "checkout"
) {
  try {
    const db = getAdminDb();

    // Resolve a matrícula: os docs de `User` são chaveados por matrícula (BP-xxx), não
    // por uid. O caller passa o uid; resolvemos via _AuthMap (mesmo padrão do
    // grantServiceEntitlement). Sem isto, `User/{uid}` nunca existe. (BUG-051 / CT-0)
    const authMapSnap = await db.collection("_AuthMap").doc(userId).get();
    const matricula = authMapSnap.exists ? (authMapSnap.data()?.matricula as string | undefined) : undefined;
    if (!matricula) throw new Error("Matrícula não encontrada para o usuário.");

    // Produto — coleção canônica `products` (minúscula). Antes lia `Products`
    // (maiúsculo, inexistente) -> "Produto não encontrado". Por id, com fallback por slug.
    let productDoc = await db.collection(PRODUCTS_COLLECTION).doc(productId).get();
    if (!productDoc.exists) {
      const bySlug = await db.collection(PRODUCTS_COLLECTION).where("slug", "==", productId).limit(1).get();
      if (!bySlug.empty) productDoc = bySlug.docs[0];
    }
    if (!productDoc.exists) throw new Error("Produto não encontrado.");
    const product = safeSerialize<Product>({ ...productDoc.data(), id: productDoc.id });

    // Dados do contratante — fonte canônica `User/{matricula}.profile` (F0-03).
    // Antes lia `User/{uid}/forms/dados-cadastrais` (uid errado + id com hífen).
    const userDoc = await db.collection(USER_COLLECTION).doc(matricula).get();
    const profile = (userDoc.data()?.profile ?? {}) as {
      fullName?: string;
      cpf?: string;
      address?: { street?: string; number?: string; complement?: string; city?: string; state?: string; cep?: string };
    };
    const addr = profile.address ?? {};
    const addressStr = [addr.street, addr.number, addr.complement, addr.city, addr.state, addr.cep]
      .filter(Boolean)
      .join(", ") || "endereço cadastrado na plataforma";
    const dados = { fullName: profile.fullName || "", cpf: profile.cpf || "", address: addressStr };

    // Order — loja raiz `User_Orders` (antes lia a subcoleção legada `User/{uid}/Orders`).
    let orderAmount = "Valor registrado na contratação";
    let orderMethod = "Gateway Digital";
    if (orderId) {
      const orderDoc = await db.collection(USER_ORDERS_COLLECTION).doc(orderId).get();
      if (orderDoc.exists) {
        const order = orderDoc.data() as { finalPrice?: number; gateway?: string };
        if (order.finalPrice !== undefined) {
          orderAmount = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(order.finalPrice);
        }
        orderMethod = friendlyGateway(order.gateway);
      }
    }
    
    // Build PDF Buffer
    const buffer = await createContractBuffer({
      product,
      dados,
      matricula,
      orderAmount,
      orderMethod
    });
    
    // Generate Hash
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");
    
    // Upload to Drive
    const drive = await getDriveClient();
    const baseFolderId = serverEnv.GOOGLE_DRIVE_USUARIOS_ID;
    
    // Caminho Hierárquico: Categoria (B2B/B2C) -> Matrícula -> 2.Documentos
    const isPJ = matricula.includes("-PJ-");
    const categoryFolderId = await ensureFolder(drive, baseFolderId, isPJ ? "2.3.B2B" : "2.2.B2C");
    const userFolderId = await ensureFolder(drive, categoryFolderId, matricula);
    const docsFolderId = await ensureFolder(drive, userFolderId, "2.Documentos");
    
    const dateStr = new Date().toISOString().split("T")[0];
    const cleanProductName = (product.title || "Contrato").replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const fileName = `CONTRATO_${dateStr}_${cleanProductName}.pdf`;
    
    // O googleapis faz `.pipe()` no corpo da mídia — precisa de um Readable stream,
    // não de um Buffer (senão: "body.pipe is not a function"). Envolvemos o buffer.
    const pdfStream = new Readable();
    pdfStream.push(buffer);
    pdfStream.push(null);

    const result = await uploadFileToDrive(
      drive,
      docsFolderId,
      fileName,
      "application/pdf",
      pdfStream
    );
    
    // Prova de aceite (clickwrap): IP real + user-agent do cliente na assinatura
    // (validade jurídica — item f / BUG-054). Server action -> lê os headers do request.
    const hdrs = await headers();
    const ip =
      hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      hdrs.get("x-real-ip") ||
      "desconhecido";
    const userAgent = hdrs.get("user-agent") || "desconhecido";
    const now = new Date();

    // Save Audit Log (subcoleção soberana chaveada por matrícula) — transitório;
    // consolidado na entidade Contracts (CT-4).
    const auditRef = db.collection(USER_COLLECTION).doc(matricula).collection("Legal_Audits");
    const auditId = auditRef.doc().id;

    await auditRef.doc(auditId).set({
      auditId,
      userId,
      matricula,
      productId,
      orderId: orderId || null,
      timestamp: now.toISOString(),
      ipAddress: ip,
      documentUrl: result.webViewLink,
      documentHash: hash
    });

    // Entidade de contrato (CT-1) — `User/{matricula}/Contracts/{contractId}`.
    // Id determinístico por serviço: não duplica (base do aviso de duplicidade, item a /
    // CT-2) e uma re-assinatura/retificação atualiza o mesmo doc, preservando createdAt.
    const contractId = (product.serviceCode || product.slug || productId).replace(/[^a-zA-Z0-9._-]/g, "_");
    const contractRef = db.collection(USER_COLLECTION).doc(matricula).collection("Contracts").doc(contractId);
    const contractExists = (await contractRef.get()).exists;
    await contractRef.set(
      {
        contractId,
        matricula,
        serviceCode: product.serviceCode ?? null,
        productSlug: product.slug ?? null,
        productTitle: product.title ?? null,
        status: "assinado",
        origin,
        orderId: orderId || null,
        documentUrl: result.webViewLink,
        documentHash: hash,
        signature: { signedAt: now.toISOString(), ip, userAgent },
        updatedAt: FieldValue.serverTimestamp(),
        ...(contractExists ? {} : { createdAt: FieldValue.serverTimestamp() })
      },
      { merge: true }
    );

    return { success: true, url: result.webViewLink, hash };
    
  } catch (error: unknown) {
    console.error("❌ [Contract Generator] Erro:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

function createContractBuffer(data: ContractContentData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const content = buildContractClauses(data);
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      const primaryColor = "#ff2c8d";
      const textColor = "#333333";
      
      const logoPath = path.join(process.cwd(), "public", "logo_bplen", "logo.png");
      
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, { width: 150 });
        doc.moveDown(1);
      } else {
        doc.fontSize(24).font("Helvetica-Bold").fillColor(primaryColor).text("BPlen", { align: "left", continued: true }).fillColor("#333333").text(" HUB");
        doc.moveDown(1);
      }

      doc.fontSize(16).font("Helvetica-Bold").fillColor("#111111").text(content.documentTitle, { align: "center" });
      doc.moveDown(1.5);

      // Renderiza as cláusulas da fonte única (contract-content.ts) — o mesmo texto
      // que o cliente lê na tela antes de assinar (CT-3a).
      for (const clause of content.clauses) {
        doc.fontSize(12).font("Helvetica-Bold").fillColor(primaryColor).text(clause.heading);
        doc.moveDown(0.5);
        doc.font("Helvetica").fontSize(11).fillColor(textColor).text(clause.body);
        doc.moveDown(1);
      }
      doc.moveDown(1);

      // Footer
      doc.fontSize(10).font("Helvetica-Oblique").fillColor("#666666").text(content.footer, { align: "center" });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}
