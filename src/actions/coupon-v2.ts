"use server";

import admin, { getAdminDb } from "@/lib/firebase-admin";
import { requireAuth, requireAdmin } from "@/lib/auth-guards";
import { 
  COUPON_BATCHES_COLLECTION, 
  COUPONS_V2_COLLECTION, 
  COUPON_REDEMPTIONS_COLLECTION, 
  COUPON_ACCEPTANCES_COLLECTION 
} from "@/config/collections";
import { hashCpf } from "@/utils/crypto";
import { syncCouponAcceptanceToDrive } from "@/lib/drive-sync";
import { sendCouponRedeemedEmail } from "@/lib/checkout-emails";
import { safeSerialize } from "@/lib/utils/firestore";
import { revalidatePath } from "next/cache";

/**
 * BPlen HUB — Coupon Engine V2 (Server Actions)
 * Lógica avançada para controle de cupons por CPF e aceite de termos.
 * Governança: Sem emojis nos logs e sem any de acordo com as regras de governança.
 */

interface GenerateCouponPayload {
  service: string; // 'pacote-embaixador', 'posicionamento-profissional', ou 'junior'/'pleno' etc.
  discount: number; // 0.0 a 1.0 (ex: 1.0 = 100%, 0.7 = 70%)
  quantity: number;
  expiresAfterDays: number;
  terms: string;
}

/**
 * Gera um lote de cupons e os persiste no Firestore (Admin Only).
 */
export async function generateCouponBatchAction(payload: GenerateCouponPayload, idToken?: string) {
  try {
    await requireAdmin(idToken);
    const db = getAdminDb();
    const batch = db.batch();

    const batchId = db.collection(COUPON_BATCHES_COLLECTION).doc().id;
    const batchRef = db.collection(COUPON_BATCHES_COLLECTION).doc(batchId);

    const batchData = {
      batchId,
      service: payload.service,
      discount: payload.discount,
      quantityTotal: payload.quantity,
      quantityUsed: 0,
      expiresAfterDays: payload.expiresAfterDays,
      terms: payload.terms,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    batch.set(batchRef, batchData);

    const generatedCodes: string[] = [];
    const prefixMap: Record<string, string> = {
      "pacote-embaixador": "EMB",
      "posicionamento-profissional": "CAR",
    };
    const prefix = prefixMap[payload.service] || "PAC";

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    for (let i = 0; i < payload.quantity; i++) {
      let code = "";
      // Garantir código único
      while (true) {
        let randomPart = "";
        for (let j = 0; j < 5; j++) {
          randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        code = `${prefix}-${randomPart}`;
        if (!generatedCodes.includes(code)) {
          generatedCodes.push(code);
          break;
        }
      }

      const couponId = db.collection(COUPONS_V2_COLLECTION).doc().id;
      const couponRef = db.collection(COUPONS_V2_COLLECTION).doc(couponId);

      const couponData = {
        couponId,
        batchId,
        code,
        isRedeemed: false,
        isUsedInOrder: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      batch.set(couponRef, couponData);
    }

    await batch.commit();
    revalidatePath("/admin/coupons");

    return { success: true, batchId, codes: generatedCodes };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[generateCouponBatchAction Error]:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Busca a lista de lotes e cupons gerados (Admin Only).
 */
export async function getAdminCouponsV2Action(idToken?: string) {
  try {
    await requireAdmin(idToken);
    const db = getAdminDb();

    const batchesSnap = await db.collection(COUPON_BATCHES_COLLECTION).orderBy("createdAt", "desc").get();
    const couponsSnap = await db.collection(COUPONS_V2_COLLECTION).orderBy("createdAt", "desc").get();

    const batches = batchesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const coupons = couponsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return {
      success: true,
      data: safeSerialize<{ batches: unknown[]; coupons: unknown[] }>({ batches, coupons }),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[getAdminCouponsV2Action Error]:", msg);
    return { success: false, error: msg };
  }
}

interface ValidateCouponPayload {
  code: string;
  cpf: string;
  productSlug: string;
  matricula: string;
  idToken: string;
  acceptTerms?: boolean;
}

/**
 * Valida ou resgata um cupom para um determinado usuário e produto.
 */
export async function applyCouponV2Action(payload: Omit<ValidateCouponPayload, "matricula">) {
  try {
    const session = await requireAuth(payload.idToken);
    const db = getAdminDb();

    const { resolveMatricula } = await import("@/lib/user-matricula");
    const matricula = await resolveMatricula(session.uid, session.email || "");
    if (!matricula) {
      return { valid: false, message: "Matricula nao encontrada para o usuario." };
    }

    const codeClean = payload.code.toUpperCase().trim();
    const cpfClean = payload.cpf.replace(/\D/g, "");
    if (cpfClean.length !== 11) {
      return { valid: false, message: "CPF invalido. Insira os 11 digitos." };
    }

    const cpfHash = hashCpf(cpfClean);

    // 1. Localizar o Cupom
    const couponSnap = await db.collection(COUPONS_V2_COLLECTION)
      .where("code", "==", codeClean)
      .limit(1)
      .get();

    if (couponSnap.empty) {
      return { valid: false, message: "Cupom invalido ou nao encontrado." };
    }

    const couponDoc = couponSnap.docs[0];
    const couponData = couponDoc.data();

    // 2. Localizar o Lote (Batch) correspondente
    const batchDoc = await db.collection(COUPON_BATCHES_COLLECTION).doc(couponData.batchId).get();
    if (!batchDoc.exists) {
      return { valid: false, message: "Lote de cupons nao encontrado para validacao." };
    }
    const batchData = batchDoc.data();
    if (!batchData) {
      return { valid: false, message: "Dados do lote de cupons invalidos." };
    }

    // 3. Validar Restrição de Serviço
    const allowedSlugs: string[] = [];
    if (batchData.service === "pacote-embaixador") {
      allowedSlugs.push("pacote-embaixador");
    } else if (batchData.service === "posicionamento-profissional") {
      allowedSlugs.push("posicionamento-profissional");
    } else if (batchData.service === "pacote-junior-pleno-senior-lider" || batchData.service === "todos-pacotes") {
      allowedSlugs.push("pacote-junior", "pacote-pleno", "pacote-senior", "pacote-lider");
    } else {
      allowedSlugs.push(batchData.service);
    }

    if (!allowedSlugs.includes(payload.productSlug)) {
      return { valid: false, message: "Este cupom nao e valido para o servico selecionado." };
    }

    // 4. Se o cupom já foi usado em uma compra aprovada (completa), barrar
    if (couponData.isUsedInOrder) {
      return { valid: false, message: "Este cupom ja foi utilizado em uma compra." };
    }

    const now = new Date();

    // 5. Se o cupom já foi resgatado por alguém
    if (couponData.isRedeemed) {
      // Verificar se pertence a este CPF
      if (couponData.cpfHash !== cpfHash) {
        return { valid: false, message: "Este cupom pertence a outro CPF e nao pode ser utilizado." };
      }

      // Verificar se já expirou (contando a partir de redeemedAt)
      const redeemedAtDate = couponData.redeemedAt.toDate();
      const expiresAtDate = new Date(redeemedAtDate.getTime() + batchData.expiresAfterDays * 24 * 60 * 60 * 1000);

      if (now > expiresAtDate) {
        return { valid: false, message: "Este cupom ja expirou." };
      }

      // Válido e já associado! Retornar desconto
      return {
        valid: true,
        discount: batchData.discount,
        expiresAt: expiresAtDate.toISOString(),
        couponId: couponData.couponId,
        termsRequired: false,
      };
    }

    // 6. Caso NÃO esteja resgatado:
    // Se não enviou o aceite explícito dos termos, solicitar exibição do modal de aceite
    if (!payload.acceptTerms) {
      return {
        valid: false,
        termsRequired: true,
        termsText: batchData.terms,
        expiresAfterDays: batchData.expiresAfterDays,
      };
    }

    // Se enviou o aceite, efetuar o resgate (vinculação) no backend
    // Validar se esse CPF já utilizou outro cupom deste mesmo lote (Evitar múltiplos resgates da mesma campanha pelo mesmo CPF)
    const redemptionsSnap = await db.collection(COUPON_REDEMPTIONS_COLLECTION)
      .where("cpfHash", "==", cpfHash)
      .where("batchId", "==", couponData.batchId)
      .get();

    if (!redemptionsSnap.empty) {
      return { valid: false, message: "Este CPF ja utilizou um cupom desta mesma campanha promocional." };
    }

    // Executar a transação de resgate
    const expiresAt = new Date(now.getTime() + batchData.expiresAfterDays * 24 * 60 * 60 * 1000);

    const writeBatch = db.batch();

    // Atualizar Cupom
    writeBatch.update(couponDoc.ref, {
      isRedeemed: true,
      redeemedAt: admin.firestore.FieldValue.serverTimestamp(),
      cpfHash,
      matricula: matricula,
      userId: session.uid,
    });

    // Incrementar uso no Lote
    writeBatch.update(batchDoc.ref, {
      quantityUsed: admin.firestore.FieldValue.increment(1),
    });

    // Criar Registro de Redenção
    const redemptionId = db.collection(COUPON_REDEMPTIONS_COLLECTION).doc().id;
    const redemptionRef = db.collection(COUPON_REDEMPTIONS_COLLECTION).doc(redemptionId);
    writeBatch.set(redemptionRef, {
      redemptionId,
      couponId: couponData.couponId,
      batchId: couponData.batchId,
      cpfHash,
      redeemedAt: admin.firestore.FieldValue.serverTimestamp(),
      userId: session.uid,
      matricula: matricula,
    });

    // Criar Registro de Aceite de Termos
    const acceptanceId = db.collection(COUPON_ACCEPTANCES_COLLECTION).doc().id;
    const acceptanceRef = db.collection(COUPON_ACCEPTANCES_COLLECTION).doc(acceptanceId);
    
    // Sync to Google Drive
    let driveFileId = "";
    let driveFileUrl = "";
    try {
      const driveResult = await syncCouponAcceptanceToDrive(
        matricula,
        codeClean,
        batchData.terms,
        {
          cpfHash,
          acceptedAt: now,
        }
      );
      driveFileId = driveResult.id;
      driveFileUrl = driveResult.webViewLink;
    } catch (driveErr) {
      console.error("[applyCouponV2Action] Erro ao sincronizar aceite com o Drive:", driveErr);
    }

    writeBatch.set(acceptanceRef, {
      acceptanceId,
      matricula: matricula,
      couponId: couponData.couponId,
      cpfHash,
      acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
      driveFileId,
      driveFileUrl,
    });

    await writeBatch.commit();

    // Disparar e-mail de confirmação (sem emojis e seguindo a governança)
    try {
      const userEmail = session.email || "";
      const { resolveUserNickname } = await import("@/lib/user-identity");
      const nickname = await resolveUserNickname(session.uid);

      await sendCouponRedeemedEmail(
        { name: nickname, email: userEmail },
        {
          code: codeClean,
          discount: Math.round(batchData.discount * 100),
          serviceName: payload.productSlug === "pacote-embaixador" ? "Pacote Embaixador BPlen" : "Posicionamento de Carreira",
          expiresAt: expiresAt.toLocaleDateString("pt-BR"),
        },
        driveFileUrl || undefined
      );
    } catch (emailErr) {
      console.error("[applyCouponV2Action] Erro ao disparar e-mail de resgate:", emailErr);
    }

    return {
      valid: true,
      discount: batchData.discount,
      expiresAt: expiresAt.toISOString(),
      couponId: couponData.couponId,
      termsRequired: false,
    };

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[applyCouponV2Action Error]:", msg);
    return { valid: false, message: msg };
  }
}
