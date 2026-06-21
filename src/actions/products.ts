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
import fs from "fs";
import path from "path";
import { PortfolioPayloadSchema } from "@/lib/validations/portfolio";


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
       (data as Partial<Product>).id = id;
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
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Erro ao processar envio de dúvida de FAQ:", err);
    return { success: false, error: err.message || "Erro desconhecido" };
  }
}

/**
 * Realiza a sincronização em massa do portfólio a partir do arquivo portfolio_payload.json.
 * Executa backup preventivo diferencial da coleção products antes de atualizar os dados.
 * Arquiva produtos que não estão mais presentes no payload e atualiza os demais.
 */
export async function syncPortfolioAction(idToken?: string) {
  try {
    await requireAdmin(idToken);
    
    const db = getAdminDb();
    
    // 1. Ler o payload do portfólio a partir do sistema de arquivos local
    const filePath = path.join(process.cwd(), "portfolio", "portfolio_payload.json");
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo de payload do portfólio não encontrado em: ${filePath}`);
    }
    
    const rawData = fs.readFileSync(filePath, "utf-8");
    const parsedJson = JSON.parse(rawData);
    
    // 2. Validar o payload contra o schema do Zod
    const validationResult = PortfolioPayloadSchema.safeParse(parsedJson);
    if (!validationResult.success) {
      console.error("[Portfolio Sync] Erro de validação Zod:", validationResult.error.format());
      throw new Error(`O payload do portfólio é inválido: ${JSON.stringify(validationResult.error.format())}`);
    }
    
    const payload = validationResult.data;
    
    // 3. Backup diferencial preventivo das informações atuais
    const productsSnapshot = await db.collection(PRODUCTS_COLLECTION).get();
    let backupCollectionName = "";
    
    if (!productsSnapshot.empty) {
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      backupCollectionName = `products_backup_${timestamp}`;
      const backupBatch = db.batch();
      
      productsSnapshot.docs.forEach((doc) => {
        const backupDocRef = db.collection(backupCollectionName).doc(doc.id);
        backupBatch.set(backupDocRef, doc.data());
      });
      
      await backupBatch.commit();
      console.log(`[Portfolio Sync] Backup incremental concluído na coleção: ${backupCollectionName}`);
    } else {
      console.log("[Portfolio Sync] Nenhuma coleção de produtos existente para fazer backup.");
    }
    
    // 4. Gravação em lote (Batch Write) para Sincronização
    const syncBatch = db.batch();
    const payloadSlugs = new Set(payload.map(p => p.slug));
    
    // Salva ou atualiza os produtos vindos do payload de forma soberana
    payload.forEach((product) => {
      const existingDoc = productsSnapshot.docs.find(d => d.id === product.slug);
      const createdAt = existingDoc?.data()?.createdAt || new Date().toISOString();
      const updatedAt = new Date().toISOString();
      
      const productToSave = {
        ...product,
        createdAt,
        updatedAt,
      };
      
      const docRef = db.collection(PRODUCTS_COLLECTION).doc(product.slug);
      syncBatch.set(docRef, productToSave);
    });
    
    // Arquiva produtos obsoletos que não estão no payload (mantendo compatibilidade com histórico)
    let archivedCount = 0;
    productsSnapshot.docs.forEach((doc) => {
      if (!payloadSlugs.has(doc.id)) {
        const docData = doc.data();
        if (docData.status !== 'archived') {
          const docRef = db.collection(PRODUCTS_COLLECTION).doc(doc.id);
          syncBatch.update(docRef, {
            status: 'archived',
            updatedAt: new Date().toISOString()
          });
          archivedCount++;
        }
      }
    });
    
    await syncBatch.commit();
    console.log(`[Portfolio Sync] Sincronização concluída com sucesso. Ativos: ${payload.length}, Arquivados: ${archivedCount}`);
    
    // 5. Revalidar rotas afetadas no Next.js
    revalidatePath("/admin/products");
    revalidatePath("/servicos");
    
    return {
      success: true,
      count: payload.length,
      archivedCount,
      backedUpTo: backupCollectionName || null,
      message: `Sincronização concluída com sucesso! ${payload.length} produtos sincronizados, ${archivedCount} arquivados.`
    };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[Portfolio Sync] Erro critico de sincronizacao:", err);
    return {
      success: false,
      error: err.message || "Erro de sincronizacao desconhecido"
    };
  }
}

