const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

/**
 * BPlen HUB - Correcao da ordem dos subcheckpoints dinamicos (BUG-117).
 *
 * Instrumentos modulares atribuidos a um cliente vivem em
 * User/{matricula}/User_Journey/progress -> steps[etapa].dynamicSubSteps[].
 *
 * A versao antiga gravava `order` como texto livre (o id do pai concatenado, ex.:
 * "ss-srv-gestao_tempo-sub-1"). O SubStepRail agrupa por String(order).split(".")[0]
 * e ordena por parseFloat, entao esses itens: (a) nao agrupam sob o checkpoint pai,
 * (b) imprimem "Parada ss-srv-...", (c) caem em NaN no comparador. Este script
 * reescreve a ordem para o decimal da parada do pai (ex.: "5.1").
 *
 * NAO altera conclusoes (completedSubSteps), nao remove nada e nao mexe em
 * overallProgress - a contagem depende da QUANTIDADE de subcheckpoints, que nao muda.
 *
 * Uso:
 *   node scripts/fix-dynamic-substep-order.js            (dry-run: so relatorio)
 *   node scripts/fix-dynamic-substep-order.js --apply    (grava a correcao)
 */

// --- Carregador de .env.local byte-safe (sem literais de escape no fonte) ---
const NL = String.fromCharCode(10); // newline real
const BSN = String.fromCharCode(92) + 'n'; // os dois caracteres: barra-invertida + n

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(NL).forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[match[1]] = value.split(BSN).join(NL);
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
const APPLY = process.argv.includes('--apply');
const FALLBACK_MAJOR_ORDER = '99';

// Espelha src/lib/journey/dynamic-substep-order.ts. O script roda fora do bundle do
// Next (CommonJS puro), entao nao da para importar o modulo TS diretamente.
function majorOrderOf(order) {
  if (!order) return FALLBACK_MAJOR_ORDER;
  const major = String(order).split('.')[0].trim();
  return major !== '' && Number.isFinite(Number(major)) ? major : FALLBACK_MAJOR_ORDER;
}

function minorOrderOf(order) {
  if (!order) return null;
  const parts = String(order).split('.');
  if (parts.length < 2) return null;
  const minor = Number.parseInt(parts[1].trim(), 10);
  return Number.isFinite(minor) ? minor : null;
}

function nextDynamicSubstepOrder(parentOrder, siblingOrders) {
  const major = majorOrderOf(parentOrder);
  const usedMinors = siblingOrders
    .filter(function (order) { return majorOrderOf(order) === major; })
    .map(minorOrderOf)
    .filter(function (minor) { return minor !== null; });
  const nextMinor = usedMinors.length > 0 ? Math.max.apply(null, usedMinors) + 1 : 1;
  return major + '.' + nextMinor;
}

/** Uma ordem so e util se o SubStepRail conseguir agrupar e ordenar por ela. */
function isValidOrder(order) {
  return !!order && Number.isFinite(Number.parseFloat(String(order)));
}

/**
 * Unico estagio cujos checkpoints NAO vem do Firestore: `onboarding` e sobrescrito
 * pelo registro estatico (src/config/journey/steps-registry.ts, aplicado no
 * getJourneyStagesAction). Os demais estagios estaticos tem `substeps: []` e nao
 * disparam a sobrescrita.
 */
const STATIC_ONBOARDING_ORDERS = {
  introducao: '1',
  check_in_survey: '2',
  sessao_onboarding: '3',
};

/**
 * Mapa GLOBAL de checkpoint fixo -> ordem, a partir dos produtos de jornada.
 *
 * De proposito nao replica o agrupamento de etapas do getJourneyStagesAction (que
 * junta produtos pelo mesmo `order` e escolhe um "main"): para consertar a ordem
 * basta saber a ordem do PAI. Para escolher o decimal livre o script considera as
 * ordens de todos os estagios, o que no pior caso gasta um numero a mais - nunca
 * gera ordem invalida nem tira o instrumento de baixo do pai.
 */
async function loadFixedOrders() {
  const snapshot = await db.collection('products').where('isStepJourney', '==', true).get();
  const orderById = Object.assign({}, STATIC_ONBOARDING_ORDERS);
  const allOrders = Object.keys(STATIC_ONBOARDING_ORDERS).map(function (k) {
    return STATIC_ONBOARDING_ORDERS[k];
  });

  snapshot.docs.forEach(function (doc) {
    const p = doc.data() || {};
    const steps = Array.isArray(p.deliverySteps) ? p.deliverySteps : [];
    steps.forEach(function (step) {
      const id = step.id || 'ss-' + step.type + '-' + step.referenceId;
      const order = step.order ? String(step.order) : '';
      if (order) {
        orderById[id] = order;
        allOrders.push(order);
      }
    });
  });

  return { orderById: orderById, allOrders: allOrders };
}

async function main() {
  console.log('[fix-dynamic-substep-order] modo: ' + (APPLY ? 'APLICAR' : 'DRY-RUN'));

  const fixed = await loadFixedOrders();
  console.log(
    '[fix-dynamic-substep-order] checkpoints fixos mapeados: ' +
      Object.keys(fixed.orderById).length
  );

  const usersSnap = await db.collection('User').get();
  console.log('[fix-dynamic-substep-order] usuarios: ' + usersSnap.size);

  let usersWithDynamic = 0;
  let totalDynamic = 0;
  let totalBroken = 0;
  let orphanParents = 0;
  let usersFixed = 0;

  for (const userDoc of usersSnap.docs) {
    const matricula = userDoc.id;
    const progressRef = db
      .collection('User')
      .doc(matricula)
      .collection('User_Journey')
      .doc('progress');
    const progressSnap = await progressRef.get();
    if (!progressSnap.exists) continue;

    const data = progressSnap.data() || {};
    const steps = data.steps || {};
    let changedForUser = false;
    let dynamicForUser = 0;

    Object.keys(steps).forEach(function (stepKey) {
      const stepProgress = steps[stepKey] || {};
      const dynamicList = Array.isArray(stepProgress.dynamicSubSteps)
        ? stepProgress.dynamicSubSteps
        : [];
      if (dynamicList.length === 0) return;

      dynamicForUser += dynamicList.length;
      totalDynamic += dynamicList.length;

      dynamicList.forEach(function (ds) {
        if (isValidOrder(ds.order)) return;

        totalBroken += 1;
        const parentOrder = fixed.orderById[ds.parentId];
        if (!parentOrder) orphanParents += 1;

        const siblingOrders = fixed.allOrders.concat(
          dynamicList.map(function (d) { return d.order; })
        );
        const newOrder = nextDynamicSubstepOrder(parentOrder || '', siblingOrders);

        console.log(
          '  ' + matricula +
            ' | etapa ' + stepKey +
            ' | ' + (ds.title || ds.id) +
            ' | order "' + String(ds.order) + '" -> "' + newOrder + '"' +
            (parentOrder ? '' : '  [PAI NAO LOCALIZADO - cai no bucket ' + FALLBACK_MAJOR_ORDER + ', conferir]')
        );

        ds.order = newOrder;
        changedForUser = true;
      });
    });

    if (dynamicForUser > 0) usersWithDynamic += 1;

    if (changedForUser) {
      usersFixed += 1;
      if (APPLY) {
        await progressRef.set({ steps: steps }, { merge: true });
      }
    }
  }

  console.log('');
  console.log('--- RESUMO ---');
  console.log('usuarios com subcheckpoint dinamico: ' + usersWithDynamic);
  console.log('subcheckpoints dinamicos no total:   ' + totalDynamic);
  console.log('com order invalida (BUG-117):        ' + totalBroken);
  console.log('  destes, com pai nao localizado:    ' + orphanParents);
  console.log('usuarios a corrigir:                 ' + usersFixed);
  if (!APPLY && totalBroken > 0) {
    console.log('');
    console.log('Nada foi gravado. Rode com --apply para aplicar.');
  }
}

main()
  .then(function () { process.exit(0); })
  .catch(function (err) {
    console.error('[fix-dynamic-substep-order] falhou:', err);
    process.exit(1);
  });
