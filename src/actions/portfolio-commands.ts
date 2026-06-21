"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { PRODUCTS_COLLECTION, COUPONS_COLLECTION } from "@/config/collections";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";
import openpyxl from "xlsx"; // Usando xlsx para leitura em JS no servidor
import docx from "docx"; // Para leitura de docx se necessário, ou processar o JSON pré-gerado

/**
 * BPlen HUB — Portfolio Command Center 🚀
 * Action para sincronizar o banco de dados com os arquivos locais do repositório.
 */

export async function syncPortfolioFromFilesAction() {
  try {
    const db = getAdminDb();
    const workspaceRoot = process.cwd();
    
    // Caminhos dos arquivos de payload gerados pelo parser
    const productsPayloadPath = path.join(workspaceRoot, "portfolio", "portfolio_payload.json");
    const couponsPayloadPath = path.join(workspaceRoot, "portfolio", "campanhas_payload.json");

    if (!fs.existsSync(productsPayloadPath)) {
      throw new Error("Arquivo de payload de produtos não encontrado. O parser precisa ser executado localmente antes do push.");
    }

    const products = JSON.parse(fs.readFileSync(productsPayloadPath, "utf-8"));
    let coupons = [];
    if (fs.existsSync(couponsPayloadPath)) {
      coupons = JSON.parse(fs.readFileSync(couponsPayloadPath, "utf-8"));
    }

    console.log(`[Sync Action] Iniciando sincronização de ${products.length} produtos e ${coupons.length} cupons.`);

    const batch = db.batch();
    const timestamp = new Date().toISOString();

    // 1. Sincronizar Produtos
    const activeSlugs = new Set();
    for (const product of products) {
      activeSlugs.add(product.slug);
      const docRef = db.collection(PRODUCTS_COLLECTION).doc(product.slug);
      
      // Manter createdAt se já existir
      const existingDoc = await docRef.get();
      const createdAt = existingDoc.exists ? (existingDoc.data()?.createdAt || timestamp) : timestamp;

      batch.set(docRef, {
        ...product,
        createdAt,
        updatedAt: timestamp,
        status: "active"
      }, { merge: true });
    }

    // 2. Arquivar produtos que não estão no payload (Soberania do Excel)
    const allProductsSnap = await db.collection(PRODUCTS_COLLECTION).get();
    allProductsSnap.docs.forEach(doc => {
      if (!activeSlugs.has(doc.id)) {
        const data = doc.data();
        if (data.status !== "archived") {
          batch.update(doc.ref, {
            status: "archived",
            updatedAt: timestamp
          });
          console.log(`[Sync Action] Arquivando produto legado: ${doc.id}`);
        }
      }
    });

    // 3. Sincronizar Cupons
    const activeCoupons = new Set();
    for (const coupon of coupons) {
      activeCoupons.add(coupon.code);
      const cpRef = db.collection(COUPONS_COLLECTION).doc(coupon.code);
      
      const existingCp = await cpRef.get();
      const createdAt = existingCp.exists ? (existingCp.data()?.createdAt || timestamp) : timestamp;
      const usageCount = existingCp.exists ? (existingCp.data()?.usageCount || 0) : 0;

      batch.set(cpRef, {
        ...coupon,
        createdAt,
        updatedAt: timestamp,
        usageCount
      }, { merge: true });
    }

    // 4. Desativar cupons antigos
    const allCouponsSnap = await db.collection(COUPONS_COLLECTION).get();
    allCouponsSnap.docs.forEach(doc => {
      if (!activeCoupons.has(doc.id)) {
        batch.update(doc.ref, {
          active: false,
          updatedAt: timestamp
        });
      }
    });

    await batch.commit();

    // Revalidar rotas afetadas
    revalidatePath("/admin/products");
    revalidatePath("/servicos");
    revalidatePath("/servicos/[audience]");

    return { 
      success: true, 
      message: `Sincronização concluída: ${products.length} produtos ativos.` 
    };

  } catch (error: any) {
    console.error("[Sync Action] Erro:", error.message);
    return { success: false, error: error.message };
  }
}
