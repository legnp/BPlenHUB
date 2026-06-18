"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-guards";
import { Product } from "@/types/products";
import { safeSerialize } from "@/lib/utils/firestore";
import { revalidatePath } from "next/cache";
import { PRODUCTS_COLLECTION } from "@/config/collections";
import { Resend } from "resend";
import { serverEnv } from "@/env";
import { buildSoberanaEmail, EMAIL_STYLES } from "@/lib/emails/soberana-layout";


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

/**
 * Registra uma dúvida de FAQ e dispara e-mails de confirmação e notificação (Dual Dispatch) 📧💎
 */
export async function registerFaqQuestionAction(data: {
  name: string;
  email: string;
  message: string;
  productName: string;
  productSlug: string;
}) {
  try {
    const { name, email, message, productName, productSlug } = data;
    if (!name || !email || !message) {
      throw new Error("Campos obrigatórios ausentes.");
    }

    const resend = new Resend(serverEnv.RESEND_API_KEY);

    // 1. Enviar e-mail de confirmação para o Usuário
    const userEmailHtml = buildSoberanaEmail(`
      <h2 style="${EMAIL_STYLES.h2}">Sua dúvida foi registrada.</h2>
      <p style="${EMAIL_STYLES.p}">
        Olá, <strong>${name}</strong>.
      </p>
      <p style="${EMAIL_STYLES.p}">
        Confirmamos o registro de sua dúvida sobre o serviço <strong>${productName}</strong>. A nossa equipe analisará a sua pergunta e responderá o mais breve possível.
      </p>
      <div style="background: #F8FAFC; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #E2E8F0;">
        <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8; font-weight: bold; text-transform: uppercase;">Dúvida Registrada</p>
        <p style="margin: 4px 0; font-size: 14px; line-height: 1.6; color: #1D1D1F; white-space: pre-line;">${message}</p>
      </div>
      <p style="${EMAIL_STYLES.p}">
        Agradecemos o seu contato e o seu interesse em descomplicar o desenvolvimento humano conosco.
      </p>
    `, "Equipe BPlen HUB");

    await resend.emails.send({
      from: "BPlen HUB <hub@bplen.com>",
      to: email,
      subject: "FAQ BPlen | Dúvida registrada",
      html: userEmailHtml,
    });

    // 2. Enviar e-mail de notificação para a equipe BPlen (notificacao@bplen.com)
    const adminEmailHtml = buildSoberanaEmail(`
      <h2 style="${EMAIL_STYLES.h2}; color: #ff2c8d;">Nova dúvida registrada no FAQ</h2>
      <p style="${EMAIL_STYLES.p}">
        Olá equipe BPlen,
      </p>
      <p style="${EMAIL_STYLES.p}">
        Uma nova dúvida de FAQ foi enviada pelo portal para o serviço <strong>${productName}</strong>.
      </p>
      <div style="background: #F8FAFC; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #E2E8F0;">
        <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8; font-weight: bold; text-transform: uppercase;">Dados do Lead / Membro</p>
        <p style="margin: 4px 0; font-size: 14px; color: #1D1D1F;">Nome: <strong>${name}</strong></p>
        <p style="margin: 4px 0; font-size: 14px; color: #1D1D1F;">E-mail: <strong>${email}</strong></p>
        <p style="margin: 4px 0; font-size: 14px; color: #1D1D1F;">Serviço: <strong>${productName} (Slug: ${productSlug})</strong></p>
      </div>
      <div style="background: #FFF1F2; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #FECDD3;">
        <p style="margin: 0 0 8px 0; font-size: 11px; color: #E11D48; font-weight: bold; text-transform: uppercase;">Mensagem / Dúvida</p>
        <p style="margin: 4px 0; font-size: 14px; line-height: 1.6; color: #1D1D1F; white-space: pre-line;">${message}</p>
      </div>
    `, "BPlen HUB - Notificações Internas");

    await resend.emails.send({
      from: "BPlen HUB <hub@bplen.com>",
      to: "notificacao@bplen.com",
      subject: `FAQ BPlen | Dúvida registrada - ${name}`,
      html: adminEmailHtml,
    });

    console.log(`✉️ [FAQ Contact] E-mails de dúvida enviados com sucesso para ${email} e notificacao@bplen.com`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Erro ao processar envio de dúvida de FAQ:", error);
    return { success: false, error: error.message || "Erro desconhecido" };
  }
}

