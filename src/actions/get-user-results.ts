"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth-guards";

interface ScoreEntry {
  percentage: number;
}

interface AssessmentResult<TScores> {
  surveyId: string;
  scores: TScores | null;
  isReleased: boolean;
  submittedAt: string | null;
}

export type GestaoTempoResult = AssessmentResult<{
  importancia?: ScoreEntry;
  urgencia?: ScoreEntry;
  circunstancia?: ScoreEntry;
}>;

export type AprendizadoResult = AssessmentResult<{
  visual?: ScoreEntry;
  auditivo?: ScoreEntry;
  cinestesico?: ScoreEntry;
  digital?: ScoreEntry;
}>;

export type ReconhecimentoResult = AssessmentResult<{
  afirmacao?: ScoreEntry;
  tempo?: ScoreEntry;
  presentes?: ScoreEntry;
  servico?: ScoreEntry;
  toque?: ScoreEntry;
}>;

export type PreAnaliseComportamentalResult = AssessmentResult<Record<string, unknown>>;

export type DiscResult = AssessmentResult<{
  executor?: ScoreEntry;
  comunicador?: ScoreEntry;
  planejador?: ScoreEntry;
  analista?: ScoreEntry;
}> & { file: string | null };

/**
 * BPlen HUB — Robust Results Connection (🧬🛡️)
 * Este helper garante que o usuário sempre encontre sua matrícula, 
 * mesmo que o mapeamento inicial tenha falhado.
 */
export async function resolveMatricula(userUid: string, email?: string): Promise<string | null> {
  const db = getAdminDb();
  console.log(`🔍 [GetResults:resolveMatricula] Resolvendo para UID: ${userUid}, Email: ${email}`);
  
  // 1. Tentar Mapeamento Direto (AuthMap) - Alta Performance
  const authMapSnap = await db.doc(`_AuthMap/${userUid}`).get();
  if (authMapSnap.exists && authMapSnap.data()?.matricula) {
    const mat = authMapSnap.data()?.matricula;
    console.log(`🔍 [GetResults:resolveMatricula] Matrícula via AuthMap: ${mat}`);
    return mat;
  }

  // 2. Fallback: Buscar na base User por ID de Autenticação (UID)
  const userByUidSnap = await db.collection("User").where("uid", "==", userUid).limit(1).get();
  if (!userByUidSnap.empty) {
    const matricula = userByUidSnap.docs[0].id;
    console.log(`🔍 [GetResults:resolveMatricula] Matrícula via UID Search: ${matricula}`);
    // Auto-Healing: Grava no AuthMap para a próxima vez
    await db.doc(`_AuthMap/${userUid}`).set({ matricula, recoveredAt: new Date() }, { merge: true });
    return matricula;
  }

  // 3. Last Resort: Buscar por E-mail (Normalizado)
  if (email) {
    const normalizedEmail = email.trim().toLowerCase();
    const userByEmailSnap = await db.collection("User").where("email", "==", normalizedEmail).limit(1).get();
    if (!userByEmailSnap.empty) {
      const matricula = userByEmailSnap.docs[0].id;
      console.log(`🔍 [GetResults:resolveMatricula] Matrícula via Email Search: ${matricula}`);
      
      // Auto-Healing: Vincula o UID atual à matrícula e atualiza o AuthMap
      await userByEmailSnap.docs[0].ref.update({ uid: userUid });
      await db.doc(`_AuthMap/${userUid}`).set({ matricula, recoveredAt: new Date() }, { merge: true });
      return matricula;
    }
  }

  console.warn(`⚠️ [GetResults:resolveMatricula] Nenhuma matrícula legítima para UID: ${userUid}`);
  return null;
}

/**
 * Helper para Serialização Segura (🛡️)
 * Converte Timestamps do Firestore para strings/números simples
 * para evitar erros de serialização no Next.js (Server -> Client).
 */
function serializeData<T>(data: T): T {
  const serialized = JSON.parse(JSON.stringify(data, (key, value) => {
    // Se for um Timestamp do Firestore (objeto com ._seconds ou .seconds)
    if (value && typeof value === 'object' && (value.seconds !== undefined || value._seconds !== undefined)) {
      const seconds = value.seconds ?? value._seconds;
      return new Date(seconds * 1000).toISOString();
    }
    return value;
  }));

  return serialized;
}

/**
 * Prefill bidirecional da survey de check-in (item 2.6).
 * Lê os campos do `results/check_in` que se sobrepõem ao Perfil Profissional
 * (`profile_settings`) para pré-preencher a survey quando o usuário editou esses
 * dados primeiro no perfil. Guardado por sessão (dono) e com whitelist de campos
 * — não trafega Timestamps nem outras respostas do check-in ao client.
 */
export async function getOwnCheckinPrefillAction(
  idToken?: string
): Promise<{ success: boolean; data: Record<string, unknown> | null }> {
  try {
    const session = await requireAuth(idToken);
    const matricula = await resolveMatricula(session.uid, session.email || "");
    if (!matricula) return { success: false, data: null };

    const db = getAdminDb();
    const snap = await db.doc(`User/${matricula}/results/check_in`).get();
    if (!snap.exists) return { success: true, data: null };

    const d = snap.data() || {};
    const KEYS = [
      "regime_choice", "beneficios_pacote", "cv_upload", "portfolio_upload",
      "linkedin_url", "instagram_url", "web_url", "portfolio_url",
      "comentarios_carreira", "banco_talentos"
    ];
    const picked: Record<string, unknown> = {};
    for (const k of KEYS) {
      if (d[k] !== undefined && d[k] !== null) picked[k] = d[k];
    }
    return { success: true, data: serializeData(picked) };
  } catch (error) {
    console.error("❌ [getOwnCheckinPrefill] Erro:", error);
    return { success: false, data: null };
  }
}

/**
 * Funções de Busca com Resolução Robusta (Mínimo Payload 🛡️)
 */

export async function getGestaoTempoResult(userUid: string, email?: string): Promise<GestaoTempoResult | null> {
  const matricula = await resolveMatricula(userUid, email);
  if (!matricula) {
    console.warn(`⚠️ [GetResults:GestaoTempo] Matrícula não resolvida para UID: ${userUid}`);
    return null;
  }

  const db = getAdminDb();
  const path = `User/${matricula}/results/gestao_tempo`;
  
  try {
    const res = await db.doc(path).get();
    if (!res.exists) {
      console.log(`ℹ️ [GetResults:GestaoTempo] Nenhum documento em ${path}`);
      return null;
    }
    
    const rawData = res.data() || {};
    
    // Normalização básica de schema
    let scores = rawData.scores;
    if (!scores && (rawData.importancia || rawData.urgencia)) {
      scores = rawData;
    }

    const payload = serializeData({
      surveyId: rawData.surveyId || 'gestao_tempo',
      scores: scores || null,
      isReleased: rawData.isReleased !== false,
      submittedAt: rawData.submittedAt || null
    });

    console.log(`✅ [GetResults:GestaoTempo] Sucesso para ${matricula}. Chaves:`, Object.keys(payload));
    return payload;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`🚨 [GetResults:GestaoTempo] Erro fatal lendo ${path}:`, errorMessage);
    throw error;
  }
}

export async function getAprendizadoResult(userUid: string, userEmail: string): Promise<AprendizadoResult | null> {
  const matricula = await resolveMatricula(userUid, userEmail);
  if (!matricula) {
    console.warn(`⚠️ [GetResults:Aprendizado] Matrícula não resolvida para UID: ${userUid}`);
    return null;
  }

  const db = getAdminDb();
  const path = `User/${matricula}/results/preferencias_aprendizado`;

  try {
    const res = await db.doc(path).get();
    if (!res.exists) {
      console.log(`ℹ️ [GetResults:Aprendizado] Nenhum documento em ${path}`);
      return null;
    }
    
    const rawData = res.data() || {};
    
    // Normalização básica de schema
    let scores = rawData.scores;
    if (!scores && (rawData.visual || rawData.auditivo)) {
      scores = rawData;
    }

    const payload = serializeData({
      surveyId: rawData.surveyId || 'preferencias_aprendizado',
      scores: scores || null,
      isReleased: rawData.isReleased !== false,
      submittedAt: rawData.submittedAt || null
    });

    console.log(`✅ [GetResults:Aprendizado] Sucesso para ${matricula}. Chaves:`, Object.keys(payload));
    return payload;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`🚨 [GetResults:Aprendizado] Erro fatal lendo ${path}:`, errorMessage);
    throw error;
  }
}

export async function getReconhecimentoResult(userUid: string, userEmail: string): Promise<ReconhecimentoResult | null> {
  const matricula = await resolveMatricula(userUid, userEmail);
  if (!matricula) {
    console.warn(`⚠️ [GetResults:Reconhecimento] Matrícula não resolvida para UID: ${userUid}`);
    return null;
  }

  const db = getAdminDb();
  const path = `User/${matricula}/results/preferencias_reconhecimento`;

  try {
    const res = await db.doc(path).get();
    if (!res.exists) {
      console.log(`ℹ️ [GetResults:Reconhecimento] Nenhum documento em ${path}`);
      return null;
    }
    
    const rawData = res.data() || {};
    
    // Normalização básica de schema
    let scores = rawData.scores;
    if (!scores && (rawData.afirmacao || rawData.palavras || rawData.presentes || rawData.tempo)) {
      scores = rawData;
    }

    const payload = serializeData({
      surveyId: rawData.surveyId || 'preferencias_reconhecimento',
      scores: scores || null,
      isReleased: rawData.isReleased !== false,
      submittedAt: rawData.submittedAt || null
    });

    console.log(`✅ [GetResults:Reconhecimento] Sucesso para ${matricula}. Chaves:`, Object.keys(payload));
    return payload;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`🚨 [GetResults:Reconhecimento] Erro fatal lendo ${path}:`, errorMessage);
    throw error;
  }
}

export async function getPreAnaliseComportamentalResult(userUid: string, email?: string): Promise<PreAnaliseComportamentalResult | null> {
  const matricula = await resolveMatricula(userUid, email);
  if (!matricula) {
    console.warn(`⚠️ [GetResults:PreAnalise] Matrícula não resolvida para UID: ${userUid}`);
    return null;
  }

  const db = getAdminDb();
  const path = `User/${matricula}/results/pre_analise_comportamental`;

  try {
    const res = await db.doc(path).get();
    if (!res.exists) {
      console.log(`ℹ️ [GetResults:PreAnalise] Nenhum documento em ${path}`);
      return null;
    }

    const rawData = res.data() || {};
    const payload = serializeData({
      surveyId: rawData.surveyId || 'pre_analise_comportamental',
      scores: rawData.scores || null, // Nota: Este assessment pode ser qualitativo (scores null)
      isReleased: rawData.isReleased !== false,
      submittedAt: rawData.submittedAt || null
    });

    console.log(`✅ [GetResults:PreAnalise] Sucesso para ${matricula}. Chaves:`, Object.keys(payload));
    return payload;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`🚨 [GetResults:PreAnalise] Erro fatal lendo ${path}:`, errorMessage);
    throw error;
  }
}

export async function getDiscResult(userUid: string, email?: string): Promise<DiscResult | null> {
  const matricula = await resolveMatricula(userUid, email);
  if (!matricula) {
    console.warn(`⚠️ [GetResults:DISC] Matrícula não resolvida para UID: ${userUid}`);
    return null;
  }

  const db = getAdminDb();
  const path = `User/${matricula}/results/disc`;

  try {
    const res = await db.doc(path).get();
    if (!res.exists) {
      console.log(`ℹ️ [GetResults:DISC] Nenhum documento em ${path}`);
      return null;
    }

    const rawData = res.data() || {};
    const payload = serializeData({
      surveyId: 'disc',
      scores: rawData.scores || null,
      file: rawData.file || null,
      isReleased: rawData.isReleased !== false,
      submittedAt: rawData.submittedAt || null
    });

    console.log(`✅ [GetResults:DISC] Sucesso para ${matricula}`);
    return payload;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`🚨 [GetResults:DISC] Erro fatal lendo ${path}:`, errorMessage);
    throw error;
  }
}




