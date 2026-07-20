"use server";

import { ANON_MATRICULA } from "@/lib/survey/identity";
import { getAdminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { getDriveClient, getSheetsClient } from "@/lib/google-auth";
import { serverEnv } from "@/env";
import { FormConfig, FormResponse, FormRecord } from "@/types/forms";
import { 
  checkKeySignature, 
  ensureFolder, 
  createSpreadsheet, 
  syncDataToSheet 
} from "@/lib/drive-utils";

/**
 * BPlen HUB — Generic Form Submission (V2.0 📡)
 * Recebe respostas da Plataforma e as persiste de forma hierárquica e operacional.
 * Aderente à Forms_Global e Soberania de Dados (Server-Authoritative) 🛡️.
 */
export async function submitGenericForm(config: FormConfig, response: FormResponse, userUid?: string) {
  try {
    checkKeySignature();
    const db = getAdminDb();

    // 1. Obter Matrícula do Usuário (Lookup no _AuthMap Admin)
    // Sem uid = envio anonimo (rota publica). Explicito, em vez de consultar
    // `_AuthMap/undefined` e depender do miss (BUG-107).
    let matricula: string = ANON_MATRICULA;
    if (userUid) {
      const authMapSnap = await db.doc(`_AuthMap/${userUid}`).get();
      if (authMapSnap.exists && authMapSnap.data()?.matricula) {
        matricula = authMapSnap.data()?.matricula;
      }
    }

    // 2. Gravar no Firestore (Persistência Hierárquica Oficial 🛡️)
    // Mesma regra do submit-survey: na pasta unica de anonimos o id do doc
    // precisa ser unico, senao um envio sobrescreve o outro.
    const docId = matricula === ANON_MATRICULA ? `${config.id}__${Date.now()}` : config.id;
    const operationalRef = db.doc(`User/${matricula}/Forms/${docId}`);
    const recordPayload: FormRecord = {
      formId: config.id,
      matricula,
      // Anonimo grava string vazia, nao `undefined`: o tipo do registro exige
      // string e o vazio diz "sem identidade" sem inventar uma (BUG-107).
      userUid: userUid || "",
      mode: "submitted",
      status: "submitted",
      data: response,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      workflow: config.workflow
    };

    await operationalRef.set(recordPayload, { merge: true });

    // 3. Disparar Efeitos Colaterais (Business Logic & Drive 卫星)
    // O usuário espera aqui conforme solicitado (await) para garantir integridade.
    const { handleFormSideEffects } = await import("./form-effects");
    await handleFormSideEffects(config, response, matricula);

    console.log(`✅ [Generic Form] Persistência Hierárquica Concluída: ${config.id} - ${matricula}`);
    return { success: true, matricula };
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`❌ Erro [submitGenericForm] para ${config.id}:`, error);
    throw new Error(error.message || "Falha na submissão do formulário.");
  }
}
