"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import admin from "firebase-admin";
import { requireAuth } from "@/lib/auth-guards";
import { resolveMatricula } from "./get-user-results";
import { getErrorMessage } from "@/lib/utils/errors";
import type { BenefitData } from "@/components/forms/SurveyFields/BenefitsPackage";

/**
 * BPlen HUB — Profile Professional Actions 🧬🏛️
 * Motor de soberania para gestão de carreira e networking.
 */

export interface ContactItem {
  value: string;
  isPublic: boolean;
}

export interface FileUploadData {
  url: string;
  fileName: string;
}

export interface ProfessionalProfileData {
  // Dados Internos (Survey Sync)
  regime_choice?: string;
  beneficios_pacote?: Record<string, BenefitData>;
  cv_upload?: FileUploadData | null;
  portfolio_upload?: FileUploadData | null;
  linkedin_url?: string;
  instagram_url?: string;
  web_url?: string;
  portfolio_url?: string;
  comentarios_carreira?: string;

  // Dados de Networking (Novos)
  participation_talent_bank: boolean;
  networking_visibility: boolean;
  cv_networking_visibility: boolean;
  portfolio_networking_visibility: boolean;
  display_name: string; // Nome exibido no card da página de Networking (fallback: nome completo)
  sales_pitch: string;
  hashtags: string[];
  contacts: {
    email: ContactItem;
    phone: ContactItem;
    whatsapp: ContactItem;
    instagram: ContactItem;
    linkedin: ContactItem;
    tiktok: ContactItem;
    discord: ContactItem;
    site: ContactItem;
  };

  // Matrícula (para FileField uploads)
  matricula?: string;
}

/**
 * Busca o Perfil Profissional consolidado
 */
export async function getProfessionalProfileAction(idToken?: string) {
  try {
    const session = await requireAuth(idToken);
    const matricula = await resolveMatricula(session.uid, session.email || "");
    
    if (!matricula) throw new Error("Matrícula não identificada.");

    const db = getAdminDb();
    
    // 1. Buscar Dados da Survey Check-in (fonte real: Surveys/check_in, campo `data`).
    // Antes lia `results/check_in` (doc órfão, nunca escrito pela survey) — o que
    // quebrava o fluxo bidirecional. Agora lê o mesmo doc que a survey grava.
    const surveySnap = await db.doc(`User/${matricula}/Surveys/check_in`).get();
    const surveyData = surveySnap.exists ? (surveySnap.data()?.data || {}) : {};

    // 2. Buscar Dados de Networking/Profile
    const networkingSnap = await db.doc(`User/${matricula}/profile/networking`).get();
    const netData = networkingSnap.exists ? networkingSnap.data() : {};

    const defaultContact = { value: "", isPublic: false };

    // 3. Migração transparente de beneficios_pacote 🛡️
    // Formato legado (survey antiga): string[] ex: ["Salário", "Comissão"]
    // Formato rico (BenefitsPackage): Record<string, BenefitData> ex: { "Salário": { enabled: true, value: "5000", currency: "BRL" } }
    let beneficiosData: Record<string, BenefitData> = {};
    const rawBeneficios = surveyData?.beneficios_pacote;
    
    if (rawBeneficios) {
      if (Array.isArray(rawBeneficios)) {
        // Formato legado: converter string[] → Record com enabled:true
        rawBeneficios.forEach((name: string) => {
          beneficiosData[name] = { enabled: true };
        });
      } else if (typeof rawBeneficios === 'object') {
        // Formato rico: usar diretamente
        beneficiosData = rawBeneficios;
      }
    }

    // 4. Consolidar Objeto de Resposta
    const profile: ProfessionalProfileData = {
      // Dados da Survey (Fallbacks)
      regime_choice: surveyData?.regime_choice || "",
      beneficios_pacote: beneficiosData,
      cv_upload: surveyData?.cv_upload || null,
      portfolio_upload: surveyData?.portfolio_upload || null,
      linkedin_url: surveyData?.linkedin_url || "",
      instagram_url: surveyData?.instagram_url || "",
      web_url: surveyData?.web_url || "",
      portfolio_url: surveyData?.portfolio_url || "",
      comentarios_carreira: surveyData?.comentarios_carreira || "",

      // Dados de Networking
      participation_talent_bank: netData?.participation_talent_bank ?? (surveyData?.banco_talentos === "Sim, quero fazer parte"),
      networking_visibility: netData?.networking_visibility ?? false,
      cv_networking_visibility: netData?.cv_networking_visibility ?? false,
      portfolio_networking_visibility: netData?.portfolio_networking_visibility ?? false,
      display_name: netData?.display_name || "",
      sales_pitch: netData?.sales_pitch || "",
      hashtags: netData?.hashtags || ["", "", "", "", ""],
      contacts: {
        email: netData?.contacts?.email || { value: session.email || "", isPublic: false },
        phone: netData?.contacts?.phone || defaultContact,
        whatsapp: netData?.contacts?.whatsapp || defaultContact,
        instagram: netData?.contacts?.instagram || defaultContact,
        linkedin: netData?.contacts?.linkedin || { value: surveyData?.linkedin_url || "", isPublic: false },
        tiktok: netData?.contacts?.tiktok || defaultContact,
        discord: netData?.contacts?.discord || defaultContact,
        site: netData?.contacts?.site || { value: surveyData?.web_url || "", isPublic: false },
      },
      matricula,
    };

    return { success: true, data: profile, matricula };
  } catch (error: unknown) {
    console.error("❌ [GetProfessionalProfile] Erro:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Atualiza o Perfil Profissional de forma atômica
 */
export async function updateProfessionalProfileAction(data: ProfessionalProfileData, idToken?: string) {
  try {
    const session = await requireAuth(idToken);
    const matricula = await resolveMatricula(session.uid, session.email || "");
    if (!matricula) throw new Error("Matrícula não identificada.");

    const db = getAdminDb();

    // 🏛️ Operação Atômica de Sincronização
    const batch = db.batch();

    // 1. Atualizar Documento de Networking
    const netRef = db.doc(`User/${matricula}/profile/networking`);
    batch.set(netRef, {
      participation_talent_bank: data.participation_talent_bank,
      networking_visibility: data.networking_visibility,
      cv_networking_visibility: data.cv_networking_visibility,
      portfolio_networking_visibility: data.portfolio_networking_visibility,
      display_name: data.display_name || "",
      sales_pitch: data.sales_pitch,
      hashtags: data.hashtags,
      contacts: data.contacts,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // 2. Sincronizar campos na Survey Check-in (Soberania de Dados 🛡️).
    // Grava no MESMO doc/estrutura da survey (`Surveys/check_in`, campo `data`),
    // com merge — NUNCA seta `status`, para não marcar o onboarding como concluído
    // indevidamente (checkSurveyCompletedAction exige status === "completed").
    const surveyRef = db.doc(`User/${matricula}/Surveys/check_in`);
    batch.set(surveyRef, {
      data: {
        regime_choice: data.regime_choice,
        beneficios_pacote: data.beneficios_pacote, // Formato rico Record<string, BenefitData>
        cv_upload: data.cv_upload || null,
        portfolio_upload: data.portfolio_upload || null,
        linkedin_url: data.linkedin_url,
        instagram_url: data.instagram_url,
        web_url: data.web_url,
        portfolio_url: data.portfolio_url,
        comentarios_carreira: data.comentarios_carreira,
        banco_talentos: data.participation_talent_bank ? "Sim, quero fazer parte" : "Não, obrigado",
      },
      syncWithProfileAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // 3. Denormalizar dados no documento principal do User 🛰️
    // Necessário para que a query de Networking consiga filtrar por networking_visibility
    // Firestore NÃO suporta queries em subcoleções via campo do documento pai
    const userRef = db.doc(`User/${matricula}`);
    batch.set(userRef, {
      profile: {
        networking: {
          networking_visibility: data.networking_visibility,
          cv_networking_visibility: data.cv_networking_visibility,
          portfolio_networking_visibility: data.portfolio_networking_visibility,
          display_name: data.display_name || "",
          sales_pitch: data.sales_pitch,
          hashtags: data.hashtags,
          contacts: data.contacts,
          participation_talent_bank: data.participation_talent_bank,
          // URLs dos documentos enviados (CV/portfólio) denormalizadas para o
          // networking poder expô-las quando o dono ativa a visibilidade (BUG-071).
          cv_doc_url: data.cv_upload?.url || "",
          cv_doc_name: data.cv_upload?.fileName || "",
          portfolio_doc_url: data.portfolio_upload?.url || "",
          portfolio_doc_name: data.portfolio_upload?.fileName || "",
        }
      },
      // Atualiza photo das URLs de CV/Portfolio no nível raiz para acesso rápido
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await batch.commit();

    return { success: true };
  } catch (error: unknown) {
    console.error("❌ [UpdateProfessionalProfile] Erro:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Atualiza APENAS a participação no Banco de Talentos (toggle independente).
 * O toggle vive no cabeçalho da aba (fora das seções editáveis), então grava
 * na hora — sem depender do modo de edição. Espelha o mesmo destino da
 * gravação completa: subcoleção networking + denormalização no User + a
 * chave `banco_talentos` da survey de check-in (bidirecional com o onboarding).
 */
export async function updateTalentBankParticipationAction(value: boolean, idToken?: string) {
  try {
    const session = await requireAuth(idToken);
    const matricula = await resolveMatricula(session.uid, session.email || "");
    if (!matricula) throw new Error("Matrícula não identificada.");

    const db = getAdminDb();
    const batch = db.batch();

    batch.set(db.doc(`User/${matricula}/profile/networking`), {
      participation_talent_bank: value,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    batch.set(db.doc(`User/${matricula}`), {
      profile: { networking: { participation_talent_bank: value } },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    batch.set(db.doc(`User/${matricula}/Surveys/check_in`), {
      data: { banco_talentos: value ? "Sim, quero fazer parte" : "Não, obrigado" },
      syncWithProfileAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await batch.commit();
    return { success: true };
  } catch (error: unknown) {
    console.error("❌ [UpdateTalentBankParticipation] Erro:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}
