"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth-guards";
import { resolveMatricula } from "@/lib/user-matricula";
import { handleFormSideEffects } from "./form-effects";
import { dadosCadastraisForm } from "@/config/forms/definitions/dados-cadastrais";

/**
 * BPlen HUB — Profile Registration Actions 📋🛡️
 * Motor de soberania para gestão de dados oficiais e fiscais.
 */

export interface RegistrationData {
  // Identificação
  matricula: string;
  email: string;
  user_name: string;

  // Pessoais
  full_name: string;
  cpf: string;
  birth_date: string;
  phone: string;

  // Residencial
  cep: string;
  pais: string;
  estado: string;
  cidade: string;
  rua: string;
  numero: string;
  complemento?: string;

  // Faturamento
  billing_same_as_address: "yes" | "no";
  billing_cep?: string;
  billing_pais?: string;
  billing_estado?: string;
  billing_cidade?: string;
  billing_rua?: string;
  billing_numero?: string;
}

/**
 * Busca os dados cadastrais consolidados do perfil
 */
export async function getRegistrationDataAction(idToken?: string) {
  try {
    const session = await requireAuth(idToken);
    const matricula = await resolveMatricula(session.uid, session.email || "");
    if (!matricula) throw new Error("Matrícula não identificada.");

    const db = getAdminDb();
    const userSnap = await db.doc(`User/${matricula}`).get();
    const userData = userSnap.data();
    const profile = userData?.profile || {};

    // Mapeamento reverso para o formato de formulário
    const registration: RegistrationData = {
      matricula: matricula,
      email: session.email || "",
      user_name: nicknameToName(userData?.nickname || ""),
      full_name: profile.fullName || "",
      cpf: profile.cpf || "",
      birth_date: profile.birthDate || "",
      phone: profile.phone || "",
      cep: profile.address?.cep || "",
      pais: profile.address?.country || "",
      estado: profile.address?.state || "",
      cidade: profile.address?.city || "",
      rua: profile.address?.street || "",
      numero: profile.address?.number || "",
      complemento: profile.address?.complement || "",
      
      // Faturamento (Fallbacks baseados no docs legados ou novos)
      billing_same_as_address: profile.billing?.sameAsAddress || "yes",
      billing_cep: profile.billing?.address?.cep || "",
      billing_pais: profile.billing?.address?.country || "",
      billing_estado: profile.billing?.address?.state || "",
      billing_cidade: profile.billing?.address?.city || "",
      billing_rua: profile.billing?.address?.street || "",
      billing_numero: profile.billing?.address?.number || "",
    };

    return { success: true, data: registration };
  } catch (error) {
    console.error("❌ [GetRegistrationData] Erro:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" };
  }
}

/**
 * Atualiza os Dados Cadastrais (Firestore + Sheets Sync)
 */
export async function updateRegistrationDataAction(data: RegistrationData, idToken?: string) {
  try {
    const session = await requireAuth(idToken);
    const matricula = await resolveMatricula(session.uid, session.email || "");
    if (!matricula) throw new Error("Matrícula não identificada.");

    const db = getAdminDb();

    // 1. Atualizar Documento Soberano (Firestore)
    await db.doc(`User/${matricula}`).set({
      profile: {
        fullName: data.full_name,
        cpf: data.cpf,
        birthDate: data.birth_date,
        phone: data.phone,
        address: {
          cep: data.cep,
          street: data.rua,
          number: data.numero,
          complement: data.complemento || "",
          city: data.cidade,
          state: data.estado,
          country: data.pais
        },
        billing: {
          sameAsAddress: data.billing_same_as_address,
          address: data.billing_same_as_address === "yes" ? null : {
            cep: data.billing_cep,
            street: data.billing_rua,
            number: data.billing_numero,
            city: data.billing_cidade,
            state: data.billing_estado,
            country: data.billing_pais
          }
        },
        lastRegistrationUpdate: new Date().toISOString()
      }
    }, { merge: true });

    // 2. Sincronizar com Google Sheets (Audit Log 📊)
    // Formatamos para o formato exigido pelo Form Effects
    const formResponse = { ...data };
    await handleFormSideEffects(dadosCadastraisForm, formResponse, matricula);

    return { success: true };
  } catch (error) {
    console.error("❌ [UpdateRegistrationData] Erro:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" };
  }
}

function nicknameToName(nickname: string) {
  return nickname || "Não definido";
}
