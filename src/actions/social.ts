"use server";

import admin, { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase/firestore";
import { SocialPost } from "@/types/social";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guards";
import { syncContentPostToDriveBackup } from "@/actions/social-drive";

const COLLECTION_NAME = "content_posts";

/**
 * BPlen HUB — Social Media Actions (Soberania de Dados)
 * Gerencia o CRUD de postagens manuais para a vitrine de conteúdo usando o Admin SDK.
 */

export async function getSocialPosts(onlyActive: boolean = false) {
  try {
    const db = getAdminDb();
    const querySnapshot = await db.collection(COLLECTION_NAME).get();
    let posts: SocialPost[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt as any as Timestamp,
        updatedAt: data.updatedAt as any as Timestamp,
      } as SocialPost);
    });

    // Filtramos e ordenamos em memória (Seguro para bases pequenas/médias)
    if (onlyActive) {
      posts = posts.filter(p => p.isActive);
    }

    // Ordenação por data (descendente)
    posts.sort((a, b) => {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    return posts;
  } catch (error) {
    console.error("Erro ao buscar posts sociais:", error);
    throw new Error("Falha ao carregar postagens.");
  }
}

export async function getSocialPostById(id: string): Promise<SocialPost | null> {
  try {
    const db = getAdminDb();
    const docSnap = await db.collection(COLLECTION_NAME).doc(id).get();
    
    if (!docSnap.exists) {
      return null;
    }

    const data = docSnap.data();
    if (!data) return null;

    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt as any as Timestamp,
      updatedAt: data.updatedAt as any as Timestamp,
    } as SocialPost;
  } catch (error) {
    console.error(`Erro ao buscar post social ${id}:`, error);
    return null;
  }
}

export async function createSocialPost(data: Omit<SocialPost, "id" | "createdAt" | "updatedAt">, adminToken?: string) {
  try {
    // 🛡️ Segurança Real no Servidor
    await requireAdmin(adminToken);

    const db = getAdminDb();
    const docRef = await db.collection(COLLECTION_NAME).add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    revalidatePath("/admin/social");
    revalidatePath("/conteudo");
    
    // Backup Assíncrono no Google Drive
    syncContentPostToDriveBackup({
      id: docRef.id,
      title: data.title,
      platform: data.platform,
      url: data.url,
      summary: data.summary,
      author: data.author,
      isActive: data.isActive,
      isFeatured: data.isFeatured,
      actionType: "CREATE"
    }, adminToken).catch(console.error);

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Erro ao criar post social:", error);
    throw new Error(error.message || "Falha ao salvar postagem.");
  }
}

export async function updateSocialPost(id: string, data: Partial<SocialPost>, adminToken?: string) {
  try {
    // 🛡️ Segurança Real no Servidor
    await requireAdmin(adminToken);

    const db = getAdminDb();
    await db.collection(COLLECTION_NAME).doc(id).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    revalidatePath("/admin/social");
    revalidatePath("/conteudo");
    
    // Backup Assíncrono no Google Drive
    // Precisamos buscar o post original caso os dados parciais não tenham os dados essenciais para o log.
    // Para simplificar, registramos apenas os dados atualizados.
    syncContentPostToDriveBackup({
      id: id,
      title: data.title || "TÍTULO NÃO ATUALIZADO",
      platform: data.platform || "other",
      url: data.url,
      summary: data.summary,
      author: data.author,
      isActive: data.isActive ?? false,
      isFeatured: data.isFeatured ?? false,
      actionType: "UPDATE"
    }, adminToken).catch(console.error);

    return { success: true };
  } catch (error: any) {
    console.error("Erro ao atualizar post social:", error);
    throw new Error(error.message || "Falha ao atualizar postagem.");
  }
}

export async function deleteSocialPost(id: string, adminToken?: string) {
  try {
    // 🛡️ Segurança Real no Servidor
    await requireAdmin(adminToken);

    const db = getAdminDb();
    await db.collection(COLLECTION_NAME).doc(id).delete();
    
    revalidatePath("/admin/social");
    revalidatePath("/conteudo");
    
    // Backup Assíncrono no Google Drive
    syncContentPostToDriveBackup({
      id: id,
      title: "POST REMOVIDO",
      platform: "other",
      isActive: false,
      isFeatured: false,
      actionType: "DELETE"
    }, adminToken).catch(console.error);

    return { success: true };
  } catch (error: any) {
    console.error("Erro ao deletar post social:", error);
    throw new Error(error.message || "Falha ao remover postagem.");
  }
}

export async function togglePostStatus(id: string, field: "isActive" | "isFeatured", currentValue: boolean, adminToken?: string) {
  try {
    // 🛡️ Segurança Real no Servidor
    await requireAdmin(adminToken);

    const db = getAdminDb();
    await db.collection(COLLECTION_NAME).doc(id).update({
      [field]: !currentValue,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    revalidatePath("/admin/social");
    revalidatePath("/conteudo");
    
    // Backup Assíncrono no Google Drive
    syncContentPostToDriveBackup({
      id: id,
      title: `Alteração de Status: ${field}`,
      platform: "other",
      isActive: field === 'isActive' ? !currentValue : false,
      isFeatured: field === 'isFeatured' ? !currentValue : false,
      actionType: "UPDATE"
    }, adminToken).catch(console.error);

    return { success: true };
  } catch (error: any) {
    console.error("Erro ao alternar status do post:", error);
    throw new Error(error.message || "Falha ao alterar visibilidade/destaque.");
  }
}
