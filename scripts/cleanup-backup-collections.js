/**
 * BPlen HUB - Limpeza das colecoes-raiz de backup do sync de portfolio
 * (BUG-040 / Trilha 3d - execucao LOCAL apenas)
 *
 * Contexto: ate a Trilha 3d, cada "Sincronizar Portfolio" criava DUAS colecoes-raiz
 * novas (products_backup_<ts> e coupons_backup_<ts>), acumulando ~50 colecoes na
 * raiz do Firestore. A fonte foi corrigida (namespace unico `_portfolio_backups`
 * com rotacao de 3); este script limpa o legado acumulado.
 *
 * Politica (decisao da Gestora, 2026-07-07): manter os 3 mais recentes de CADA
 * tipo (products_backup_* e coupons_backup_*), apagar o resto. Antes de apagar,
 * cada colecao e exportada em JSON para scratch/portfolio-backup-export/
 * (gitignored) - reversivel.
 *
 * Uso (SEGURO por padrao - dry-run, NAO escreve nada):
 *   node scripts/cleanup-backup-collections.js
 *
 * Aplicar de verdade (exporta e apaga):
 *   node scripts/cleanup-backup-collections.js --apply
 *   node scripts/cleanup-backup-collections.js --apply --limit=5   (poucas por vez)
 *
 * Flags:
 *   --keep=N   quantos backups recentes de cada tipo preservar (default: 3)
 *
 * Requer em .env.local: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.
 */
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

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

// --- Flags ---
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const keepArg = args.find(a => a.startsWith('--keep='));
const KEEP = keepArg ? parseInt(keepArg.split('=')[1], 10) : 3;
const limitArg = args.find(a => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;

const EXPORT_DIR = path.join(__dirname, '..', 'scratch', 'portfolio-backup-export');
const PATTERN = /^(products|coupons)_backup_(\d{14})$/;

async function exportCollection(colId) {
  const snap = await db.collection(colId).get();
  const docs = {};
  snap.docs.forEach(d => { docs[d.id] = d.data(); });
  if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR, { recursive: true });
  const file = path.join(EXPORT_DIR, `${colId}.json`);
  fs.writeFileSync(file, JSON.stringify(docs, null, 2));
  return { count: snap.size, file };
}

async function main() {
  console.log(`\n=== Limpeza de colecoes de backup (BUG-040) - modo: ${APPLY ? 'APPLY' : 'DRY-RUN (nada sera apagado)'} | keep=${KEEP} ===\n`);

  const collections = await db.listCollections();
  const matched = collections
    .map(c => c.id)
    .filter(id => PATTERN.test(id))
    .map(id => {
      const [, tipo, ts] = id.match(PATTERN);
      return { id, tipo, ts };
    });

  const byType = { products: [], coupons: [] };
  matched.forEach(m => byType[m.tipo].push(m));
  Object.values(byType).forEach(list => list.sort((a, b) => b.ts.localeCompare(a.ts)));

  let toDelete = [];
  for (const [tipo, list] of Object.entries(byType)) {
    const keep = list.slice(0, KEEP);
    const stale = list.slice(KEEP);
    console.log(`${tipo}_backup_*: ${list.length} colecoes | mantendo ${keep.length} mais recentes | apagando ${stale.length}`);
    keep.forEach(k => console.log(`  [MANTER ] ${k.id}`));
    toDelete = toDelete.concat(stale);
  }

  if (LIMIT) {
    console.log(`\n--limit=${LIMIT}: processando so as ${LIMIT} primeiras da fila.`);
    toDelete = toDelete.slice(0, LIMIT);
  }

  if (toDelete.length === 0) {
    console.log('\nNada a apagar.');
    return;
  }

  console.log(`\nFila de exclusao (${toDelete.length}):`);
  for (const col of toDelete) {
    if (!APPLY) {
      const snap = await db.collection(col.id).count().get();
      console.log(`  [DRY-RUN] ${col.id} (${snap.data().count} docs) - seria exportada e apagada`);
      continue;
    }
    const { count, file } = await exportCollection(col.id);
    await db.recursiveDelete(db.collection(col.id));
    console.log(`  [APAGADA] ${col.id} (${count} docs; export: ${path.relative(process.cwd(), file)})`);
  }

  console.log(`\nConcluido. ${APPLY ? 'Colecoes removidas com export previo.' : 'Rode com --apply para executar.'}`);
}

main().then(() => process.exit(0)).catch(err => { console.error('ERRO:', err); process.exit(1); });
