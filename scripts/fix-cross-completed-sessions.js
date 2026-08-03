const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

/**
 * BPlen HUB - Reparo das sessoes marcadas em bloco pela conclusao cruzada (BUG-118).
 *
 * O motor casava atividades por `type:referenceId`, e as 10 sessoes do MentoCoach (e as
 * 10 orientacoes do GDC) compartilham o mesmo referenceId. Concluir uma marcava as dez.
 * A correcao no codigo impede novas ocorrencias, mas o sweep so ADICIONA conclusao - o
 * que ja esta gravado precisa ser limpo aqui.
 *
 * NAO adivinha quais sessoes sao reais: quem opera informa, por matricula, os ids a
 * PRESERVAR. Todos os demais ids do mesmo grupo repetido saem de completedSubSteps
 * (e da data de conclusao), e o status da etapa + overallProgress sao recalculados com
 * a mesma formula do app.
 *
 * Uso:
 *   node scripts/fix-cross-completed-sessions.js --matricula BP-002-PF-260331 \
 *        --keep ss-meeting-sessao-mentocoach-2
 *   ... e o mesmo comando com --apply para gravar.
 *
 *   --keep aceita lista separada por virgula. Sem --keep, NENHUMA conclusao do grupo
 *   repetido e preservada (util quando nenhuma sessao aconteceu de fato).
 *   Sem --matricula, roda em modo relatorio sobre todos os usuarios.
 */

// --- Carregador de .env.local byte-safe (sem literais de escape no fonte) ---
const NL = String.fromCharCode(10);
const BSN = String.fromCharCode(92) + 'n';

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split(NL).forEach((line) => {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (m) {
      let v = m[2] || '';
      if (v.startsWith('"') && v.endsWith('"')) v = v.substring(1, v.length - 1);
      process.env[m[1]] = v.split(BSN).join(NL);
    }
  });
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
    }),
  });
}

const db = admin.firestore();

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : null;
}

const APPLY = process.argv.includes('--apply');
const ONLY_MATRICULA = argValue('--matricula');
const KEEP = (argValue('--keep') || '').split(',').map((s) => s.trim()).filter(Boolean);

/**
 * Unico estagio cujos checkpoints NAO vem do Firestore: `onboarding` e sobrescrito pelo
 * registro estatico (src/config/journey/steps-registry.ts) dentro do
 * getJourneyStagesAction. Precisa entrar igual aqui, senao o overallProgress sai errado.
 */
const STATIC_ONBOARDING_SUBSTEPS = [
  { id: 'introducao', type: 'content', referenceId: 'welcome_video_01' },
  { id: 'check_in_survey', type: 'survey', referenceId: 'check_in' },
  { id: 'sessao_onboarding', type: 'meeting', referenceId: 'onboarding' },
];

const normalize = (s) =>
  String(s || '').normalize('NFD').replace(new RegExp('[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']', 'g'), '').toLowerCase().trim();

/** Reproduz o agrupamento de etapas do getJourneyStagesAction. */
async function loadStages() {
  const snap = await db.collection('products').where('isStepJourney', '==', true).get();

  const journeyProducts = snap.docs
    .map((d) => Object.assign({ id: d.id }, d.data()))
    .filter((p) => {
      const status = String(p.status || '').toLowerCase();
      const isActive = !status || status === 'active' || status === 'ativo';
      const hasOrder = p.order !== undefined && p.order !== null;
      return isActive && hasOrder && Number(p.order) >= 0;
    });

  const groups = {};
  journeyProducts.forEach((p) => {
    const order = Number(p.order);
    if (!groups[order]) {
      groups[order] = { main: p, products: [p] };
    } else {
      groups[order].products.push(p);
      if (p.slug && p.slug.length < ((groups[order].main.slug || '').length || 999)) {
        groups[order].main = p;
      }
    }
  });

  let incompleto = false;
  const stages = Object.keys(groups).map((orderStr) => {
    const g = groups[orderStr];
    let substeps = [];
    g.products.forEach((p) => {
      const steps = Array.isArray(p.deliverySteps) ? p.deliverySteps : [];
      if (steps.length === 0) incompleto = true;
      steps.forEach((s) => {
        substeps.push({
          id: s.id || 'ss-' + s.type + '-' + s.referenceId,
          type: s.type,
          referenceId: s.referenceId,
        });
      });
    });
    const id = g.main.slug || g.main.id;
    if (id === 'onboarding') substeps = STATIC_ONBOARDING_SUBSTEPS;
    return { id: id, substeps: substeps };
  });

  return { stages: stages, incompleto: incompleto };
}

/** Ids que pertencem a uma chave `type:referenceId` repetida dentro da etapa. */
function repeatedIdsOf(substeps) {
  const count = {};
  substeps.forEach((s) => {
    if (!s.referenceId) return;
    const k = s.type + ':' + s.referenceId;
    count[k] = (count[k] || 0) + 1;
  });
  return substeps
    .filter((s) => s.referenceId && count[s.type + ':' + s.referenceId] > 1)
    .map((s) => s.id);
}

async function main() {
  console.log('[fix-cross-completed-sessions] modo: ' + (APPLY ? 'APLICAR' : 'DRY-RUN'));
  if (ONLY_MATRICULA) console.log('  matricula alvo: ' + ONLY_MATRICULA);
  console.log('  ids preservados: ' + (KEEP.length ? KEEP.join(', ') : '(nenhum)'));

  const loaded = await loadStages();
  if (loaded.incompleto) {
    console.log('');
    console.log('AVISO: ha produto de jornada SEM deliverySteps (caminho legado por');
    console.log('capabilities). O overallProgress recalculado aqui pode divergir do app.');
  }

  const stages = loaded.stages;
  const repeatedByStage = {};
  stages.forEach((s) => {
    repeatedByStage[s.id] = repeatedIdsOf(s.substeps);
  });

  const users = ONLY_MATRICULA
    ? [await db.collection('User').doc(ONLY_MATRICULA).get()]
    : (await db.collection('User').get()).docs;

  let afetados = 0;

  for (const userDoc of users) {
    if (!userDoc.exists) {
      console.log('usuario nao encontrado: ' + ONLY_MATRICULA);
      continue;
    }
    const matricula = userDoc.id;
    const progressRef = db
      .collection('User').doc(matricula)
      .collection('User_Journey').doc('progress');
    const snap = await progressRef.get();
    if (!snap.exists) continue;

    const data = snap.data() || {};
    const steps = data.steps || {};
    const removidosDoUsuario = [];

    stages.forEach((stage) => {
      const repeatedIds = repeatedByStage[stage.id] || [];
      if (repeatedIds.length === 0) return;

      const stepKey = Object.keys(steps).find((k) => normalize(k) === normalize(stage.id));
      if (!stepKey) return;

      const sp = steps[stepKey] || {};
      const completed = sp.completedSubSteps || [];
      const aRemover = completed.filter(
        (id) => repeatedIds.indexOf(id) >= 0 && KEEP.indexOf(id) < 0
      );
      if (aRemover.length === 0) return;

      const novos = completed.filter((id) => aRemover.indexOf(id) < 0);
      const datas = Object.assign({}, sp.subStepCompletionDates || {});
      aRemover.forEach((id) => { delete datas[id]; });

      const total = stage.substeps.length + ((sp.dynamicSubSteps || []).length);
      const status = sp.status === 'locked'
        ? 'locked'
        : (total > 0 && novos.length >= total ? 'completed' : 'current');

      steps[stepKey] = Object.assign({}, sp, {
        completedSubSteps: novos,
        subStepCompletionDates: datas,
        status: status,
      });

      aRemover.forEach((id) => removidosDoUsuario.push(stepKey + ' :: ' + id));
      console.log('  ' + matricula + ' | etapa ' + stepKey + ' | remove ' + aRemover.length +
        ' de ' + completed.length + ' | status ' + sp.status + ' -> ' + status);
    });

    if (removidosDoUsuario.length === 0) continue;
    afetados += 1;
    removidosDoUsuario.forEach((r) => console.log('      ' + r));

    // overallProgress com a MESMA formula do app: base + dinamicos de cada etapa.
    let totalAll = 0;
    let completedAll = 0;
    stages.forEach((stage) => {
      const stepKey = Object.keys(steps).find((k) => normalize(k) === normalize(stage.id)) || stage.id;
      const sp = steps[stepKey];
      totalAll += stage.substeps.length + ((sp && sp.dynamicSubSteps ? sp.dynamicSubSteps.length : 0));
      completedAll += (sp && sp.completedSubSteps ? sp.completedSubSteps.length : 0);
    });
    const overallProgress = totalAll > 0 ? Math.round((completedAll / totalAll) * 100) : 0;
    console.log('      overallProgress ' + (data.overallProgress || 0) + ' -> ' + overallProgress);

    if (APPLY) {
      // Sem merge: merge nao apaga chave de mapa e as datas removidas voltariam.
      await progressRef.set(
        Object.assign({}, data, {
          steps: steps,
          overallProgress: overallProgress,
          updatedAt: new Date().toISOString(),
        })
      );
    }
  }

  console.log('');
  console.log('--- RESUMO ---');
  console.log('usuarios com conclusao em bloco a limpar: ' + afetados);
  if (!APPLY && afetados > 0) {
    console.log('Nada foi gravado. Confira os ids a preservar e rode com --apply.');
  }
}

main().then(() => process.exit(0)).catch((e) => {
  console.error('[fix-cross-completed-sessions] falhou:', e);
  process.exit(1);
});
