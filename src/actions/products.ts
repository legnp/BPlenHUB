"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-guards";
import { Product } from "@/types/products";
import { safeSerialize } from "@/lib/utils/firestore";
import { revalidatePath } from "next/cache";
import { PRODUCTS_COLLECTION, COUPONS_COLLECTION } from "@/config/collections";
import { Resend } from "resend";
import { serverEnv } from "@/env";
import { buildSoberanaEmail, EMAIL_STYLES } from "@/lib/emails/soberana-layout";
import fs from "fs";
import path from "path";
import { PortfolioPayloadSchema, CouponsPayloadSchema } from "@/lib/validations/portfolio";


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

    // 2.B Ler e validar o payload de campanhas/cupons se existir
    const campanhasPath = path.join(process.cwd(), "portfolio", "campanhas_payload.json");
    let couponsPayload: {
      id: string;
      code: string;
      type: "percentage" | "fixed";
      value: number;
      description?: string;
      active: boolean;
      expiryDate?: string;
      usageLimit?: number;
      usageCount: number;
      restrictedToProducts?: string[];
      minPurchaseValue?: number;
    }[] = [];
    
    if (fs.existsSync(campanhasPath)) {
      const rawCampanhas = fs.readFileSync(campanhasPath, "utf-8");
      const parsedCampanhas = JSON.parse(rawCampanhas);
      const camValidation = CouponsPayloadSchema.safeParse(parsedCampanhas);
      if (!camValidation.success) {
        console.error("[Portfolio Sync] Erro de validação Zod de campanhas:", camValidation.error.format());
        throw new Error(`O payload de campanhas é inválido: ${JSON.stringify(camValidation.error.format())}`);
      }
      couponsPayload = camValidation.data;
    }
    
    // 3. Backup diferencial preventivo das informações atuais de produtos
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

    // 3.B Backup incremental de cupons se houver dados
    const couponsSnapshot = await db.collection(COUPONS_COLLECTION).get();
    let couponsBackupCol = "";
    if (!couponsSnapshot.empty && couponsPayload.length > 0) {
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      couponsBackupCol = `coupons_backup_${timestamp}`;
      const cpBackupBatch = db.batch();
      
      couponsSnapshot.docs.forEach((doc) => {
        const bDocRef = db.collection(couponsBackupCol).doc(doc.id);
        cpBackupBatch.set(bDocRef, doc.data());
      });
      
      await cpBackupBatch.commit();
      console.log(`[Portfolio Sync] Backup de cupons concluído na coleção: ${couponsBackupCol}`);
    }
    
    // 4. Gravação em lote (Batch Write) para Sincronização de Produtos e Cupons
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
    
    // Arquiva produtos obsoletos que não estão no payload
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

    // Sincronização dos Cupons
    const couponsSlugs = new Set(couponsPayload.map(c => c.code));
    couponsPayload.forEach((coupon) => {
      const existingCp = couponsSnapshot.docs.find(d => d.id === coupon.code);
      const createdAt = existingCp?.data()?.createdAt || new Date().toISOString();
      const updatedAt = new Date().toISOString();
      const usageCount = existingCp?.data()?.usageCount || 0;
      
      const couponToSave = {
        ...coupon,
        createdAt,
        updatedAt,
        usageCount,
      };
      
      const docRef = db.collection(COUPONS_COLLECTION).doc(coupon.code);
      syncBatch.set(docRef, couponToSave);
    });

    // Desativa cupons órfãos antigos
    let deactivatedCouponsCount = 0;
    couponsSnapshot.docs.forEach((doc) => {
      if (!couponsSlugs.has(doc.id)) {
        const docData = doc.data();
        if (docData.active !== false) {
          const docRef = db.collection(COUPONS_COLLECTION).doc(doc.id);
          syncBatch.update(docRef, {
            active: false,
            updatedAt: new Date().toISOString()
          });
          deactivatedCouponsCount++;
        }
      }
    });
    
    await syncBatch.commit();
    console.log(`[Portfolio Sync] Sincronização concluída. Ativos: ${payload.length}, Arquivados: ${archivedCount}, Cupons Sincronizados: ${couponsPayload.length}, Cupons Desativados: ${deactivatedCouponsCount}`);
    
    // 5. Revalidar rotas afetadas no Next.js
    revalidatePath("/admin/products");
    revalidatePath("/servicos");
    
    return {
      success: true,
      count: payload.length,
      archivedCount,
      couponsCount: couponsPayload.length,
      deactivatedCouponsCount,
      backedUpTo: backupCollectionName || null,
      couponsBackedUpTo: couponsBackupCol || null,
      message: `Sincronização concluída com sucesso! ${payload.length} produtos sincronizados, ${archivedCount} arquivados. ${couponsPayload.length} cupons sincronizados, ${deactivatedCouponsCount} desativados.`
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

import { exec } from "child_process";
import { promisify } from "util";
import { z } from "zod";
import { CouponSchema } from "@/lib/validations/portfolio";

const execPromise = promisify(exec);

/**
 * Realiza o upload temporario e executa o Dry-Run (Sandbox de diferencas)
 * para pre-visualizacao de alteracoes de portfolio e campanhas.
 */
export async function uploadAndDryRunAction(formData: FormData, idToken?: string) {
  try {
    await requireAdmin(idToken);
    
    const db = getAdminDb();
    
    // 1. Processar uploads se fornecidos
    const portfolioFile = formData.get("portfolioFile") as File | null;
    const anunciosFile = formData.get("anunciosFile") as File | null;
    const campanhasFile = formData.get("campanhasFile") as File | null;
    
    const portfolioDir = path.join(process.cwd(), "portfolio");
    if (!fs.existsSync(portfolioDir)) {
      fs.mkdirSync(portfolioDir, { recursive: true });
    }
    
    if (portfolioFile && portfolioFile.size > 0) {
      const buffer = Buffer.from(await portfolioFile.arrayBuffer());
      fs.writeFileSync(path.join(portfolioDir, "portfolio_bplen.xlsx"), buffer);
    }
    
    if (anunciosFile && anunciosFile.size > 0) {
      const buffer = Buffer.from(await anunciosFile.arrayBuffer());
      fs.writeFileSync(path.join(portfolioDir, "anuncios_bplen.docx"), buffer);
    }
    
    if (campanhasFile && campanhasFile.size > 0) {
      const buffer = Buffer.from(await campanhasFile.arrayBuffer());
      fs.writeFileSync(path.join(portfolioDir, "campanhas_bplen.xlsx"), buffer);
    }
    
    // 2. Executar o script do parser Python de forma controlada
    let runError: string | null = null;
    try {
      await execPromise("python scripts/portfolio_parser.py");
    } catch (e: unknown) {
      const err = e as Error;
      console.error("[Portfolio Dry-Run] Erro ao executar parser Python:", err);
      runError = err.message;
    }
    
    if (runError) {
      return {
        success: false,
        error: `Erro ao executar o parser Python: ${runError}`,
        productsAdded: [],
        productsModified: [],
        productsArchived: [],
        couponsAdded: [],
        couponsModified: [],
        couponsDeactivated: []
      };
    }
    
    // 3. Ler os payloads gerados localmente
    const pPath = path.join(portfolioDir, "portfolio_payload.json");
    const cPath = path.join(portfolioDir, "campanhas_payload.json");
    
    if (!fs.existsSync(pPath)) {
      throw new Error("O arquivo portfolio_payload.json nao foi gerado pelo parser.");
    }
    
    const rawP = fs.readFileSync(pPath, "utf-8");
    const parsedP = JSON.parse(rawP);
    const valP = PortfolioPayloadSchema.safeParse(parsedP);
    if (!valP.success) {
      throw new Error(`Dados do catalogo invalidos: ${JSON.stringify(valP.error.format())}`);
    }
    const newProducts = valP.data;
    
    let newCoupons: z.infer<typeof CouponsPayloadSchema> = [];
    if (fs.existsSync(cPath)) {
      const rawC = fs.readFileSync(cPath, "utf-8");
      const parsedC = JSON.parse(rawC);
      const valC = CouponsPayloadSchema.safeParse(parsedC);
      if (!valC.success) {
        throw new Error(`Dados de campanhas invalidos: ${JSON.stringify(valC.error.format())}`);
      }
      newCoupons = valC.data;
    }
    
    // 4. Buscar estado atual no Firestore
    const pSnapshot = await db.collection(PRODUCTS_COLLECTION).get();
    const cSnapshot = await db.collection(COUPONS_COLLECTION).get();
    
    const dbProducts = pSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
    
    const dbCoupons = cSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as z.infer<typeof CouponSchema>[];
    
    // 5. Comparar Produtos
    const productsAdded: { slug: string; title: string; price: number }[] = [];
    const productsModified: {
      slug: string;
      title: string;
      changes: { field: string; old: string | number | undefined; new: string | number | undefined }[];
    }[] = [];
    const productsArchived: { slug: string; title: string }[] = [];
    
    const newSlugs = new Set(newProducts.map(p => p.slug));
    
    newProducts.forEach((newP) => {
      const oldP = dbProducts.find(p => p.slug === newP.slug);
      if (!oldP) {
        productsAdded.push({
          slug: newP.slug,
          title: newP.title,
          price: newP.price
        });
      } else {
        const changes: { field: string; old: string | number | undefined; new: string | number | undefined }[] = [];
        
        if (oldP.title !== newP.title) {
          changes.push({ field: "Titulo", old: oldP.title, new: newP.title });
        }
        if (oldP.price !== newP.price) {
          changes.push({ field: "Preco Cartao", old: oldP.price, new: newP.price });
        }
        if (oldP.pricePix !== newP.pricePix) {
          changes.push({ field: "Preco PIX", old: oldP.pricePix, new: newP.pricePix });
        }
        if (oldP.maxInstallments !== newP.maxInstallments) {
          changes.push({ field: "Parcelas Maximas", old: oldP.maxInstallments, new: newP.maxInstallments });
        }
        if (oldP.status !== newP.status) {
          changes.push({ field: "Status", old: oldP.status, new: newP.status });
        }
        
        if (changes.length > 0) {
          productsModified.push({
            slug: newP.slug,
            title: newP.title,
            changes
          });
        }
      }
    });
    
    dbProducts.forEach((oldP) => {
      if (!newSlugs.has(oldP.slug) && oldP.status !== "archived") {
        productsArchived.push({
          slug: oldP.slug,
          title: oldP.title
        });
      }
    });
    
    // 6. Comparar Cupons
    const couponsAdded: { code: string; type: string; value: number }[] = [];
    const couponsModified: {
      code: string;
      changes: { field: string; old: string | number | boolean | undefined; new: string | number | boolean | undefined }[];
    }[] = [];
    const couponsDeactivated: { code: string }[] = [];
    
    const newCouponCodes = new Set(newCoupons.map(c => c.code));
    
    newCoupons.forEach((newC) => {
      const oldC = dbCoupons.find(c => c.code === newC.code);
      if (!oldC) {
        couponsAdded.push({
          code: newC.code,
          type: newC.type,
          value: newC.value
        });
      } else {
        const changes: { field: string; old: string | number | boolean | undefined; new: string | number | boolean | undefined }[] = [];
        
        if (oldC.type !== newC.type) {
          changes.push({ field: "Tipo", old: oldC.type, new: newC.type });
        }
        if (oldC.value !== newC.value) {
          changes.push({ field: "Valor", old: oldC.value, new: newC.value });
        }
        if (oldC.active !== newC.active) {
          changes.push({ field: "Ativo", old: oldC.active, new: newC.active });
        }
        if (oldC.expiryDate !== newC.expiryDate) {
          changes.push({ field: "Validade", old: oldC.expiryDate, new: newC.expiryDate });
        }
        
        if (changes.length > 0) {
          couponsModified.push({
            code: newC.code,
            changes
          });
        }
      }
    });
    
    dbCoupons.forEach((oldC) => {
      if (!newCouponCodes.has(oldC.code) && oldC.active !== false) {
        couponsDeactivated.push({
          code: oldC.code
        });
      }
    });
    
    return {
      success: true,
      productsAdded,
      productsModified,
      productsArchived,
      couponsAdded,
      couponsModified,
      couponsDeactivated
    };
    
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[Portfolio Dry-Run] Erro critico:", err);
    return {
      success: false,
      error: err.message || "Erro desconhecido no Dry-Run",
      productsAdded: [],
      productsModified: [],
      productsArchived: [],
      couponsAdded: [],
      couponsModified: [],
      couponsDeactivated: []
    };
  }
}

