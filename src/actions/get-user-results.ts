"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuth, AuthorizationError } from "@/lib/auth-guards";
import { resolveMatricula } from "@/lib/user-matricula";

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


export type DiscResult = AssessmentResult<{
  executor?: ScoreEntry;
  comunicador?: ScoreEntry;
  planejador?: ScoreEntry;
  analista?: ScoreEntry;
}> & { file: string | null };


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
 * Lê os campos da survey de check-in (`Surveys/check_in`, campo `data`) que se
 * sobrepõem ao Perfil Profissional para pré-preencher a survey quando o usuário
 * editou esses dados primeiro no perfil. Guardado por sessão (dono) e com
 * whitelist de campos — não trafega Timestamps nem outras respostas ao client.
 */
export async function getOwnCheckinPrefillAction(
  idToken?: string
): Promise<{ success: boolean; data: Record<string, unknown> | null }> {
  try {
    const session = await requireAuth(idToken);
    const matricula = await resolveMatricula(session.uid, session.email || "");
    if (!matricula) return { success: false, data: null };

    const db = getAdminDb();
    const snap = await db.doc(`User/${matricula}/Surveys/check_in`).get();
    if (!snap.exists) return { success: true, data: null };

    const d = (snap.data()?.data || {}) as Record<string, unknown>;
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
  // Dono-ou-admin: o dashboard do membro le o proprio resultado; o admin le o de
  // qualquer um (devolutiva). Ate o BUG-103 nao havia trava e o `userUid` vinha
  // do cliente — dava para ler o resultado psicometrico de qualquer pessoa.
  const session = await requireAuth();
  if (session.uid !== userUid && !session.isAdmin) {
    throw new AuthorizationError("Voce nao pode acessar os resultados de outro membro.");
  }

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
  // Dono-ou-admin: o dashboard do membro le o proprio resultado; o admin le o de
  // qualquer um (devolutiva). Ate o BUG-103 nao havia trava e o `userUid` vinha
  // do cliente — dava para ler o resultado psicometrico de qualquer pessoa.
  const session = await requireAuth();
  if (session.uid !== userUid && !session.isAdmin) {
    throw new AuthorizationError("Voce nao pode acessar os resultados de outro membro.");
  }

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
  // Dono-ou-admin: o dashboard do membro le o proprio resultado; o admin le o de
  // qualquer um (devolutiva). Ate o BUG-103 nao havia trava e o `userUid` vinha
  // do cliente — dava para ler o resultado psicometrico de qualquer pessoa.
  const session = await requireAuth();
  if (session.uid !== userUid && !session.isAdmin) {
    throw new AuthorizationError("Voce nao pode acessar os resultados de outro membro.");
  }

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

export async function getDiscResult(userUid: string, email?: string): Promise<DiscResult | null> {
  // Dono-ou-admin: o dashboard do membro le o proprio resultado; o admin le o de
  // qualquer um (devolutiva). Ate o BUG-103 nao havia trava e o `userUid` vinha
  // do cliente — dava para ler o resultado psicometrico de qualquer pessoa.
  const session = await requireAuth();
  if (session.uid !== userUid && !session.isAdmin) {
    throw new AuthorizationError("Voce nao pode acessar os resultados de outro membro.");
  }

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




