"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-guards";

/**
 * Serializador seguro para evitar quebras de serializacao do Next.js
 * de objetos complexos (ex: Firestore Timestamps).
 */
function serializeData(data: any): any {
  if (!data) return null;
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (
        value &&
        typeof value === "object" &&
        (value.seconds !== undefined || value._seconds !== undefined)
      ) {
        const seconds = value.seconds ?? value._seconds;
        return new Date(seconds * 1000).toISOString();
      }
      return value;
    })
  );
}

export interface DevolutivaUserData {
  profile: {
    matricula: string;
    uid: string;
    name: string;
    nickname: string;
    email: string;
    photoUrl: string;
    role: string;
    hasCompletedWelcome: boolean;
    discLink?: string;
  };
  journey: {
    currentPhase: string;
    currentStep: string;
    overallProgress: number;
  } | null;
  results: Record<string, any>;
  surveys: Record<string, any>;
  forms: Record<string, any>;
}

/**
 * getDevolutivaUserData
 * Consolida todas as informacoes comportamentais e historico operacional de um usuario especifico.
 */
export async function getDevolutivaUserData(
  matricula: string,
  adminToken?: string
): Promise<{ success: boolean; data?: DevolutivaUserData; error?: string }> {
  try {
    // 1. Garantir acesso administrativo
    await requireAdmin(adminToken);

    const db = getAdminDb();

    // 2. Buscar dados principais do usuario
    const userDocRef = db.doc(`User/${matricula}`);
    const userSnap = await userDocRef.get();

    if (!userSnap.exists) {
      return { success: false, error: "Usuario nao encontrado." };
    }

    const userData = userSnap.data() || {};

    // Autossincronização do UID (Soberania de Identidade 🧬)
    let resolvedUid = userData.uid || "";
    if (!resolvedUid) {
      const authMapQuery = await db.collection("_AuthMap")
        .where("matricula", "==", matricula)
        .limit(1)
        .get();

      if (!authMapQuery.empty) {
        resolvedUid = authMapQuery.docs[0].id;
        await userDocRef.update({ uid: resolvedUid });
        userData.uid = resolvedUid;
      }
    }

    // 3. Buscar progresso da jornada
    const journeyRef = db.doc(`User/${matricula}/User_JourneyMap/progress`);
    const journeySnap = await journeyRef.get();
    let journeyData = null;

    if (journeySnap.exists) {
      const jData = journeySnap.data() || {};
      journeyData = {
        currentPhase: jData.currentPhase || "venda",
        currentStep: jData.currentStep || "onboarding",
        overallProgress: jData.overallProgress || 0,
      };
    }

    // 4. Buscar permissoes e link DISC do usuario
    const accessRef = db.doc(`User/${matricula}/User_Permissions/access`);
    const accessSnap = await accessRef.get();
    const accessData = accessSnap.data() || {};
    const discLink = accessData.metadata?.disc_link || "";

    // 5. Carregar resultados de assessments
    const resultsSnap = await db.collection(`User/${matricula}/results`).get();
    const results: Record<string, any> = {};
    resultsSnap.forEach((doc) => {
      results[doc.id] = doc.data();
    });

    // 6. Carregar Surveys completadas
    const surveysSnap = await db.collection(`User/${matricula}/Surveys`).get();
    const surveys: Record<string, any> = {};
    surveysSnap.forEach((doc) => {
      surveys[doc.id] = doc.data();
    });

    // 7. Carregar Forms completados
    const formsSnap = await db.collection(`User/${matricula}/Forms`).get();
    const forms: Record<string, any> = {};
    formsSnap.forEach((doc) => {
      forms[doc.id] = doc.data();
    });

    // Especial: Se houver dados cadastrais no profile do usuario, geramos um Form virtual
    if (userData.profile?.lastRegistrationUpdate) {
      const profile = userData.profile;
      forms["dados_cadastrais"] = {
        formId: "dados_cadastrais",
        matricula,
        status: "submitted",
        submittedAt: profile.lastRegistrationUpdate,
        data: {
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
          billing_same_as_address: profile.billing?.sameAsAddress || "yes",
          billing_cep: profile.billing?.address?.cep || "",
          billing_pais: profile.billing?.address?.country || "",
          billing_estado: profile.billing?.address?.state || "",
          billing_cidade: profile.billing?.address?.city || "",
          billing_rua: profile.billing?.address?.street || "",
          billing_numero: profile.billing?.address?.number || "",
        },
      };
    }

    // 8. Montar payload consolidado
    const rawPayload: DevolutivaUserData = {
      profile: {
        matricula,
        uid: userData.uid || "",
        name: userData.Authentication_Name || userData.User_Name || "Membro BPlen",
        nickname: userData.User_Nickname || userData.User_Welcome?.User_Nickname || "",
        email: userData.email || userData.User_Email || "",
        photoUrl: userData.photoUrl || userData.profile?.photoUrl || "",
        role: accessData.role || (accessData.admin ? "admin" : "member"),
        hasCompletedWelcome: userData.hasCompletedWelcome || false,
        discLink,
      },
      journey: journeyData,
      results,
      surveys,
      forms,
    };

    return {
      success: true,
      data: serializeData(rawPayload),
    };
  } catch (error: any) {
    console.error(`❌ [admin-devolutiva] Erro para matricula ${matricula}:`, error);
    return {
      success: false,
      error: error.message || "Falha ao carregar informacoes da devolutiva comportamental.",
    };
  }
}
