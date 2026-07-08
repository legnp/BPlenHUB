/**
 * BPlen HUB - Exclusao dos produtos legados/arquivados de `products`
 * (BUG-041 / Trilha 3c - execucao LOCAL)
 *
 * Contexto: a colecao `products` tem o catalogo ATIVO canonico (12 docs: 7 etapas
 * BPL-000..006 + 5 pacotes BPL-PAC-*) e ~13 legados marcados `status: archived`
 * (mentoria, coaching, desenvolvimento-*, junior/pleno/senior soltos, 1-to-1,
 * plano-embaixadores-bplen, preparacao-de-carreira, etc.). Apos a Trilha 3b
 * (BUG-042), NENHUM cliente referencia mais os arquivados — seguro excluir.
 *
 * CRITERIO CONSERVADOR: so apaga docs com `status === 'archived'`. Um produto
 * ativo (ou sem status) NUNCA e tocado. Cada doc e exportado em JSON para
 * scratch/legacy-products-export/ antes de apagar (reversivel).
 *
 * Uso (SEGURO - dry-run):   node scripts/cleanup-legacy-products.js
 * Aplicar:                  node scripts/cleanup-legacy-products.js --apply
 *   opcional: --limit=N
 */
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (m) { let v = m[2] || ''; if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1); process.env[m[1]] = v.replace(/\\n/g, '\n'); }
  });
}
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  })});
}
const db = admin.firestore();

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const limitArg = args.find(a => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;

const EXPORT_DIR = path.join(__dirname, '..', 'scratch', 'legacy-products-export');

async function main() {
  console.log(`\n=== Exclusao de produtos legados (BUG-041) - modo: ${APPLY ? 'APPLY' : 'DRY-RUN (nada sera apagado)'} ===\n`);

  const snap = await db.collection('products').get();
  const active = [];
  let toDelete = [];
  snap.docs.forEach(d => {
    const st = (d.data().status || '').toLowerCase();
    if (st === 'archived') toDelete.push(d);
    else active.push({ id: d.id, sc: d.data().serviceCode || '?', st: d.data().status || '(sem status)' });
  });

  console.log(`Catalogo: ${snap.size} docs | ATIVOS/preservados: ${active.length} | ARQUIVADOS (candidatos): ${toDelete.length}\n`);
  console.log('PRESERVADOS (nunca tocados):');
  active.sort((a,b)=>a.id.localeCompare(b.id)).forEach(p => console.log(`  [MANTER ] ${p.sc.padEnd(12)} ${p.id}  (${p.st})`));

  if (LIMIT) toDelete = toDelete.slice(0, LIMIT);

  console.log(`\nA EXCLUIR (status=archived) — ${toDelete.length}:`);
  if (APPLY && !fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR, { recursive: true });
  for (const d of toDelete) {
    const data = d.data();
    if (!APPLY) {
      console.log(`  [DRY-RUN] ${(data.serviceCode||'?').padEnd(12)} ${d.id}`);
      continue;
    }
    fs.writeFileSync(path.join(EXPORT_DIR, `${d.id}.json`), JSON.stringify(data, null, 2));
    await d.ref.delete();
    console.log(`  [APAGADO] ${(data.serviceCode||'?').padEnd(12)} ${d.id}  (export salvo)`);
  }

  console.log(`\n${toDelete.length} produto(s) ${APPLY ? 'excluidos' : 'seriam excluidos'}.`);
  if (!APPLY && toDelete.length > 0) console.log('Rode com --apply para executar (exporta cada doc antes).');
}

main().then(() => process.exit(0)).catch(e => { console.error('ERRO:', e); process.exit(1); });
