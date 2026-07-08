/**
 * BPlen HUB - Inventario da base Firestore (execucao LOCAL, SOMENTE LEITURA)
 *
 * Mapeia a base para embasar a reestruturacao do modelo de acesso + a higiene de
 * dados (Trilha 3 da auditoria). NAO ESCREVE NADA - so usa listCollections(),
 * count() e get()/limit(). Seguro rodar em producao.
 *
 * O que reporta:
 *   1. Todas as colecoes RAIZ com contagem de documentos, sinalizando candidatas
 *      a backup/legado (nome com "backup", "bkp", "cupom", "coupon", "old", "temp").
 *   2. Inventario detalhado de `products` (id, slug, serviceCode, title, price,
 *      targetAudiences, isStepJourney, order, status) - para identificar produtos
 *      poluentes (mentoria, nomes soltos junior/pleno/senior, primeiros passos,
 *      preparacao-de-carreira, etc.).
 *   3. Inventario das colecoes de cupom conhecidas (contagem + amostra).
 *   4. Tally dos slugs de servico que os CLIENTES atuais possuem
 *      (User/{matricula}/User_Permissions/access.services) - dimensiona a migracao
 *      de slugs antigos -> novos.
 *
 * Uso:
 *   node scripts/inventory-base.js
 *
 * Requer em .env.local: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.
 */
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// --- Carrega .env.local (mesmo padrao de audit-admins.js) ---
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[match[1]] = value.replace(/\\n/g, '\n');
    }
  });
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY
    })
  });
}

const db = admin.firestore();

const BACKUP_HINTS = ['backup', 'bkp', 'cupom', 'coupon', 'old', 'temp', 'copy', 'legacy', '_bak'];
const COUPON_COLLECTIONS = ['marketing_coupons', 'coupon_batches', 'coupons_v2', 'coupon_redemptions', 'coupon_acceptances'];

async function countOf(colRef) {
  try {
    const agg = await colRef.count().get();
    return agg.data().count;
  } catch (e) {
    return `(erro ao contar: ${e.message})`;
  }
}

async function listRootCollections() {
  console.log('\n=== 1. COLECOES RAIZ (contagem de docs) ===');
  const cols = await db.listCollections();
  const rows = [];
  for (const col of cols) {
    const count = await countOf(col);
    const lower = col.id.toLowerCase();
    const flag = BACKUP_HINTS.some(h => lower.includes(h)) ? '  <== CANDIDATA a backup/legado/cupom' : '';
    rows.push({ id: col.id, count, flag });
  }
  rows.sort((a, b) => a.id.localeCompare(b.id));
  rows.forEach(r => console.log(`  ${String(r.count).padStart(6)}  ${r.id}${r.flag}`));
  console.log(`  Total de colecoes raiz: ${rows.length}`);
}

async function inventoryProducts() {
  console.log('\n=== 2. PRODUTOS/SERVICOS (colecao "products") ===');
  const snap = await db.collection('products').get();
  console.log(`  Total: ${snap.size} documentos\n`);
  const rows = [];
  snap.forEach(doc => {
    const d = doc.data();
    rows.push({
      docId: doc.id,
      slug: d.slug || '-',
      serviceCode: d.serviceCode || '-',
      title: d.title || '-',
      price: d.price != null ? d.price : '-',
      audiences: Array.isArray(d.targetAudiences) ? d.targetAudiences.join('|') : '-',
      isStepJourney: d.isStepJourney === true ? 'sim' : 'nao',
      order: d.order != null ? d.order : '-',
      status: d.status || '-'
    });
  });
  rows.sort((a, b) => String(a.order).localeCompare(String(b.order)) || a.docId.localeCompare(b.docId));
  rows.forEach(r => {
    console.log(`  [${r.docId}] slug="${r.slug}" code=${r.serviceCode} | "${r.title}" | R$${r.price} | ${r.audiences} | journey=${r.isStepJourney} | order=${r.order} | ${r.status}`);
  });
}

async function inventoryCoupons() {
  console.log('\n=== 3. COLECOES DE CUPOM CONHECIDAS ===');
  for (const name of COUPON_COLLECTIONS) {
    const col = db.collection(name);
    const count = await countOf(col);
    console.log(`\n  -- ${name}: ${count} docs`);
    const sample = await col.limit(3).get();
    sample.forEach(doc => {
      const d = doc.data();
      const keys = Object.keys(d).slice(0, 8).join(', ');
      console.log(`     amostra [${doc.id}]: {${keys}}`);
    });
  }
}

async function tallyClientServiceSlugs() {
  console.log('\n=== 4. SLUGS DE SERVICO EM POSSE DOS CLIENTES (access.services) ===');
  const snap = await db.collectionGroup('User_Permissions').get();
  const tally = {};
  let accessDocs = 0;
  let clientsComServico = 0;
  for (const doc of snap.docs) {
    if (doc.id !== 'access') continue;
    accessDocs++;
    const services = doc.data().services || {};
    const activeKeys = Object.keys(services).filter(k => services[k] === true);
    if (activeKeys.length > 0) clientsComServico++;
    activeKeys.forEach(k => { tally[k] = (tally[k] || 0) + 1; });
  }
  console.log(`  Docs "access" lidos: ${accessDocs} | com >=1 servico ativo: ${clientsComServico}\n`);
  const rows = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  rows.forEach(([slug, n]) => console.log(`  ${String(n).padStart(4)}x  ${slug}`));
  console.log('\n  (Cruze estes slugs com a colecao "products" acima: slug em cliente que');
  console.log('   nao existe/duplica em products = candidato a migracao/renomeacao.)');
}

async function inspectUserSurveyData() {
  // Para cada usuario: mostra as etiquetas de interesse que ele possui e os docs
  // reais nas subcolecoes Surveys/Forms - para confirmar que, se a etiqueta existe,
  // ha dado correspondente guardado (garantia pedida antes de limpar as tags inertes).
  console.log('\n=== 5. ETIQUETAS x DADOS REAIS DE SURVEY/FORM POR USUARIO ===');
  const TAGS = ['content_premium', 'hub_community', 'survey_welcome', 'career_planning'];
  const users = await db.collection('User').get();
  for (const u of users.docs) {
    const mat = u.id;
    const accessSnap = await db.doc(`User/${mat}/User_Permissions/access`).get();
    const services = accessSnap.exists ? (accessSnap.data().services || {}) : {};
    const tagsHeld = TAGS.filter(t => services[t] === true);
    const surveys = await db.collection(`User/${mat}/Surveys`).get();
    const forms = await db.collection(`User/${mat}/Forms`).get();
    console.log(`\n  Cliente ${mat}`);
    console.log(`    etiquetas de interesse: ${tagsHeld.length ? tagsHeld.join(', ') : '(nenhuma)'}`);
    console.log(`    Surveys (${surveys.size}): ${surveys.docs.map(d => d.id).join(', ') || '(vazio)'}`);
    console.log(`    Forms   (${forms.size}): ${forms.docs.map(d => d.id).join(', ') || '(vazio)'}`);
  }
}

async function run() {
  console.log('BPlen HUB - INVENTARIO DA BASE (somente leitura)');
  console.log('Projeto:', process.env.FIREBASE_PROJECT_ID || '(sem FIREBASE_PROJECT_ID)');
  await listRootCollections();
  await inventoryProducts();
  await inventoryCoupons();
  await tallyClientServiceSlugs();
  await inspectUserSurveyData();
  console.log('\n=== FIM (nenhuma escrita realizada) ===');
}

run().catch(err => { console.error('ERRO:', err); process.exit(1); });
