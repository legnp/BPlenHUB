"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-guards";
import { Product } from "@/types/products";
import { safeSerialize } from "@/lib/utils/firestore";
import { revalidatePath } from "next/cache";
import { PRODUCTS_COLLECTION } from "@/config/collections";

/**
 * BPlen HUB — Product Engine Server Actions 🧬
 * Gerenciamento centralizado de produtos e serviços no Firestore.
 */

/**
 * Busca todos os produtos para a administração
 */
export async function getAdminProducts(idToken?: string): Promise<Product[]> {
  try {
    await requireAdmin(idToken);
    const db = getAdminDb();
    const snapshot = await db.collection(PRODUCTS_COLLECTION).get();

    return snapshot.docs.map(doc => {
      return safeSerialize<Product>({
        ...doc.data(),
        id: doc.id
      });
    });
  } catch (error) {
    console.error("Erro ao buscar produtos para o admin:", error);
    return [];
  }
}

/**
 * Busca um produto pelo Slug (para páginas dinâmicas)
 * Por padrão, ignora produtos marcados como 'internal' para proteção da área pública 🛡️
 */
export async function getProductBySlug(slug: string, includeInternal: boolean = false): Promise<Product | null> {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection(PRODUCTS_COLLECTION)
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    const product = safeSerialize<Product>({
      ...doc.data(),
      id: doc.id
    });

    // Governança de Visibilidade: Se for interno e não solicitamos internos, bloqueamos 🔒
    if (!includeInternal && product.targetAudiences?.includes('internal')) {
      return null;
    }

    return product;
  } catch (error) {
    console.error(`Erro ao buscar produto com slug ${slug}:`, error);
    return null;
  }
}

import { syncProductToDriveAction } from "./product-sync";

/**
 * Salva ou atualiza um produto (Admin)
 */
export async function saveProductAction(product: Partial<Product>, idToken?: string) {
  try {
    await requireAdmin(idToken);
    const db = getAdminDb();
    let id = product.id;
    const data = {
      ...product,
      updatedAt: new Date().toISOString(),
    };

    // 1. Salvar no Firestore (Base)
    if (id) {
       await db.collection(PRODUCTS_COLLECTION).doc(id).update(data);
    } else {
       // [PADRONIZAÇÃO BPlen V3 🧬] 
       // Usamos o SLUG como ID do documento para garantir governança limpa.
       if (!product.slug) {
         throw new Error("O campo 'Slug' é obrigatório para criar um novo produto.");
       }

       const slugId = product.slug.trim().toLowerCase().replace(/\s+/g, '-');
       id = slugId;

       await db.collection(PRODUCTS_COLLECTION).doc(id).set({
         ...data,
         id: id,
         createdAt: new Date().toISOString(),
         status: 'draft'
       });

       // Atualizamos o objeto data local para incluir o novo ID para o sync
       (data as any).id = id;
    }

    // 2. Sincronização com Google Drive (Portfolio) 📡
    // Tentamos sincronizar apenas se tivermos os campos mínimos (serviceCode e title)
    if (data.serviceCode && data.title) {
       const syncResult = await syncProductToDriveAction(data as Product);
       
       if (syncResult.success) {
          const driveConfig = {
             folderId: syncResult.folderId!,
             sheetId: syncResult.sheetId!,
             sheetUrl: syncResult.sheetUrl!
          };
          
          // Se o driveConfig mudou, atualizamos o Firestore novamente
          await db.collection(PRODUCTS_COLLECTION).doc(id!).update({
             driveConfig
          });
       }
    }

    revalidatePath("/admin/products");
    revalidatePath("/servicos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar produto:", error);
    throw new Error("Falha ao salvar produto");
  }
}

/**
 * Busca produtos filtrados por público-alvo
 */
export async function getProductsByAudience(audience: 'people' | 'companies' | 'partners'): Promise<Product[]> {
  try {
    const db = getAdminDb();
    const snap = await db.collection(PRODUCTS_COLLECTION)
      .where("status", "==", "active")
      .where("targetAudiences", "array-contains", audience)
      .get();

    // Mapeamento e Ordenação em Memória (Resiliência para produtos sem campo 'order' 🛡️)
    return snap.docs
      .map(doc => {
        return safeSerialize<Product>({
          ...doc.data(),
          id: doc.id
        });
      })
      .filter(p => !p.targetAudiences?.includes('internal'))
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return [];
  }
}

/**
 * Busca produtos da Jornada (Step Journey)
 */
export async function getJourneyProducts(): Promise<Product[]> {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection(PRODUCTS_COLLECTION)
      .where("isStepJourney", "==", true)
      .where("status", "==", "active")
      .orderBy("order", "asc")
      .get();

    return snapshot.docs.map(doc => {
      return safeSerialize<Product>({
        ...doc.data(),
        id: doc.id
      });
    });
  } catch (error) {
    console.error("Erro ao buscar produtos da jornada:", error);
    return [];
  }
}
