import type { Firestore } from "firebase-admin/firestore";
import { SurveyResponse } from "@/types/survey";
import { FormRecord } from "@/types/forms";
import { toSafeDate } from "@/lib/date-utils";

/**
 * BPlen HUB — Snapshot diario de metricas do admin (T-01 / T1-2).
 *
 * Por que existe: as telas de analytics do admin (Formularios & Surveys, Surveys,
 * Forms, Feedback Social) liam a base inteira via `collectionGroup(...).get()` a
 * cada visita — custo O(respostas), inviavel a ~10k usuarios. Os contadores nativos
 * (`count`/`sum`/`average`) exigiriam ~6-10 indices de collection group que NAO
 * existem hoje (medido na T1-2, 2026-07-23) e nao ha pipeline de deploy de indice —
 * subir esse codigo quebraria o painel. Entao o Momento 1 usa **snapshot diario**:
 * o cron faz a varredura SEM filtro 1x/dia (que funciona sem indice novo), grava um
 * documento agregado, e as telas leem 1 documento.
 *
 * Este modulo e o **resolvedor cru** (sem guard) — chamado pelo cron (que valida o
 * `CRON_SECRET`) e pelas actions (que ja tem `requireAdmin`). Padrao Protocolo item 8.
 *
 * Semantica preservada: guarda os agregados data-derived exatamente como cada action
 * os computava (contagens por id ALL vs filtradas por status, ultimos-24h por classe,
 * ultima-resposta por id, soma/contagem de rating, contagem de tema). Os metadados
 * estaticos (titulo/kind/sheetNamePrefix) continuam vindo do registry na action —
 * assim titulos nunca ficam defasados pelo snapshot.
 *
 * `responsesLast24h` vira "nas 24h que antecederam o snapshot" (o painel inteiro
 * passa a ser "ate a ultima atualizacao"); e a natureza do snapshot diario, aceita
 * pela Gestora. A serie historica (`Admin_Metrics_Daily/{dateKey}`) alimenta o EXP-01.
 */

const COLLECTION = "Admin_Metrics_Daily";
const LATEST_DOC = "latest";
const DAY_MS = 24 * 60 * 60 * 1000;
const CONTENT_EVAL_PREFIX = "content_evaluation";
const THEME_FORM_ID = "theme_suggestion";

export interface AdminMetricsSnapshot {
  /** ISO do momento em que o snapshot foi calculado. */
  computedAt: string;
  /** Chave diaria YYYY-MM-DD em UTC (o cron roda em UTC — Licao 39). */
  dateKey: string;
  /** ISO do inicio da janela de 24h usada nos `last24h` (referencia). */
  windowStart: string;
  surveys: {
    total: number;
    completedTotal: number;
    countById: Record<string, number>;
    completedCountById: Record<string, number>;
    lastResponseAtById: Record<string, string>;
    last24hAll: number;
    last24hCompleted: number;
  };
  forms: {
    total: number;
    submittedUpdatedTotal: number;
    countById: Record<string, number>;
    submittedUpdatedCountById: Record<string, number>;
    lastResponseAtById: Record<string, string>;
    last24hAll: number;
    last24hSubmittedUpdated: number;
  };
  registrations: {
    count: number;
    last24h: number;
  };
  social: {
    contentRatingSum: number;
    contentRatingCount: number;
    themeSuggestionCount: number;
  };
}

const inc = (map: Record<string, number>, key: string) => {
  map[key] = (map[key] || 0) + 1;
};

/**
 * Varre a base (sem filtro — funciona sem indice novo) e computa todos os agregados
 * que as 4 telas de analytics precisam. Read-only sobre `Surveys`/`Forms`/`User`.
 */
export async function computeAdminMetricsSnapshot(db: Firestore): Promise<AdminMetricsSnapshot> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - DAY_MS);

  // ---- Surveys ----
  const surveysSnap = await db.collectionGroup("Surveys").get();
  const surveys = {
    total: 0,
    completedTotal: 0,
    countById: {} as Record<string, number>,
    completedCountById: {} as Record<string, number>,
    lastResponseAtById: {} as Record<string, string>,
    last24hAll: 0,
    last24hCompleted: 0,
  };
  let contentRatingSum = 0;
  let contentRatingCount = 0;

  surveysSnap.forEach(doc => {
    const r = doc.data() as SurveyResponse & { data?: Record<string, unknown> };
    const id = r.surveyId;
    if (typeof id !== "string") return;
    surveys.total += 1;
    inc(surveys.countById, id);

    const isCompleted = r.status === "completed";
    if (isCompleted) {
      surveys.completedTotal += 1;
      inc(surveys.completedCountById, id);
    }

    const subAt = toSafeDate(r.submittedAt);
    if (subAt) {
      const iso = subAt.toISOString();
      if (!surveys.lastResponseAtById[id] || iso > surveys.lastResponseAtById[id]) {
        surveys.lastResponseAtById[id] = iso;
      }
      if (subAt >= windowStart) {
        surveys.last24hAll += 1;
        if (isCompleted) surveys.last24hCompleted += 1;
      }
    }

    // Feedback social: avaliacoes de conteudo vivem como surveys content_evaluation_*
    if (id.startsWith(CONTENT_EVAL_PREFIX)) {
      const rating = Number(r.data?.rating);
      if (Number.isFinite(rating) && rating > 0) {
        contentRatingSum += rating;
        contentRatingCount += 1;
      }
    }
  });

  // ---- Forms ----
  const formsSnap = await db.collectionGroup("Forms").get();
  const forms = {
    total: 0,
    submittedUpdatedTotal: 0,
    countById: {} as Record<string, number>,
    submittedUpdatedCountById: {} as Record<string, number>,
    lastResponseAtById: {} as Record<string, string>,
    last24hAll: 0,
    last24hSubmittedUpdated: 0,
  };
  let themeSuggestionCount = 0;

  formsSnap.forEach(doc => {
    const r = doc.data() as FormRecord;
    const id = r.formId;
    if (typeof id !== "string") return;
    forms.total += 1;
    inc(forms.countById, id);

    const isSubmittedOrUpdated = r.status === "submitted" || r.status === "updated";
    if (isSubmittedOrUpdated) {
      forms.submittedUpdatedTotal += 1;
      inc(forms.submittedUpdatedCountById, id);
    }

    const subAt = toSafeDate(r.submittedAt);
    if (subAt) {
      const iso = subAt.toISOString();
      if (!forms.lastResponseAtById[id] || iso > forms.lastResponseAtById[id]) {
        forms.lastResponseAtById[id] = iso;
      }
      if (subAt >= windowStart) {
        forms.last24hAll += 1;
        if (isSubmittedOrUpdated) forms.last24hSubmittedUpdated += 1;
      }
    }

    if (id === THEME_FORM_ID) themeSuggestionCount += 1;
  });

  // ---- Registrations (dados_cadastrais, derivado do perfil soberano) ----
  const usersSnap = await db.collection("User").get();
  let registrationCount = 0;
  let registrationLast24h = 0;
  usersSnap.forEach(doc => {
    const data = doc.data();
    const lastReg = data.profile?.lastRegistrationUpdate;
    if (lastReg === undefined || lastReg === null) return;
    registrationCount += 1;
    const d = toSafeDate(lastReg);
    if (d && d >= windowStart) registrationLast24h += 1;
  });

  return {
    computedAt: now.toISOString(),
    dateKey: now.toISOString().slice(0, 10),
    windowStart: windowStart.toISOString(),
    surveys,
    forms,
    registrations: { count: registrationCount, last24h: registrationLast24h },
    social: { contentRatingSum, contentRatingCount, themeSuggestionCount },
  };
}

/**
 * Grava o snapshot: `latest` (leitura das telas) + `{dateKey}` (serie historica do
 * EXP-01). Idempotente — sobrescreve (Licao 40: reconciliacao recalcula do zero).
 */
export async function writeAdminMetricsSnapshot(
  db: Firestore,
  snapshot: AdminMetricsSnapshot
): Promise<void> {
  const col = db.collection(COLLECTION);
  await Promise.all([
    col.doc(LATEST_DOC).set(snapshot),
    col.doc(snapshot.dateKey).set(snapshot),
  ]);
}

/** Calcula e grava — usado pelo cron e por um eventual recalcular manual. */
export async function refreshAdminMetricsSnapshot(db: Firestore): Promise<AdminMetricsSnapshot> {
  const snapshot = await computeAdminMetricsSnapshot(db);
  await writeAdminMetricsSnapshot(db, snapshot);
  return snapshot;
}

/** Le o snapshot `latest`; devolve null se ausente (antes do 1o cron) ou invalido. */
export async function readAdminMetricsSnapshot(db: Firestore): Promise<AdminMetricsSnapshot | null> {
  const doc = await db.collection(COLLECTION).doc(LATEST_DOC).get();
  if (!doc.exists) return null;
  const data = doc.data() as Partial<AdminMetricsSnapshot> | undefined;
  if (!data || !data.surveys || !data.forms || !data.registrations || !data.social) {
    return null;
  }
  return data as AdminMetricsSnapshot;
}

/**
 * Fonte unica das telas: le o snapshot; se ausente/invalido (ex.: antes do 1o cron),
 * calcula ao vivo — mesmo custo de hoje, sem regressao. Depois do 1o cron, 1 leitura.
 */
export async function getAdminMetricsSnapshotOrCompute(db: Firestore): Promise<AdminMetricsSnapshot> {
  const existing = await readAdminMetricsSnapshot(db);
  if (existing) return existing;
  return computeAdminMetricsSnapshot(db);
}
