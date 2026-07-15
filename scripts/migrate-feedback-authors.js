/**
 * BPlen HUB - Re-sync do autor dos feedbacks de carreira (item 8.2)
 *
 * Contexto: o feedback auto-gerado da Gestao de Carreira (subcolecao
 * `User/{matricula}/Feedbacks`, doc id `booking-{eventId}`) vinha gravado com
 * `author: "Consultor BPlen"` (alias generico). A regra nova (item 8.2) e exibir
 * o ORIENTADOR do respectivo evento — o campo `mentor` do `Calendar_Events`
 * (parseado de "Orientador:" na descricao do evento, ver sync.ts). A partir de
 * agora o codigo ja grava assim; este script corrige os feedbacks JA criados nas
 * contas que foram sincronizadas antes da mudanca (`legacySynced_v3=true`).
 *
 * Escopo conservador: so toca feedbacks cujo id comeca com `booking-` E cujo
 * author atual e exatamente "Consultor BPlen" (os auto-gerados). Feedbacks
 * manuais do admin (author proprio) e os que ja tem orientador nao sao tocados.
 * So reescreve quando o evento tem `mentor` nao-vazio.
 *
 * Uso (SEGURO por padrao - dry-run, NAO escreve nada; lista o diff):
 *   node scripts/migrate-feedback-authors.js
 *
 * Aplicar de verdade (faz backup em scratch/ e reescreve o campo `author`):
 *   node scripts/migrate-feedback-authors.js --apply
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
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
    }),
  });
}

const db = admin.firestore();
const APPLY = process.argv.slice(2).includes('--apply');
const BACKUP_DIR = path.join(__dirname, '..', 'scratch', 'feedback-author-backups');

const GENERIC_AUTHOR = 'Consultor BPlen';

async function main() {
  console.log(`\n=== Re-sync autor dos feedbacks (item 8.2) — modo: ${APPLY ? 'APPLY' : 'DRY-RUN'} ===\n`);

  const usersSnap = await db.collection('User').get();
  console.log(`Usuarios: ${usersSnap.size}\n`);

  // 1. Coleta os candidatos (feedbacks auto-gerados com author generico).
  const candidates = []; // { matricula, feedbackId, eventId, ref, oldAuthor }
  const eventIds = new Set();

  for (const userDoc of usersSnap.docs) {
    const matricula = userDoc.id;
    const fbSnap = await userDoc.ref.collection('Feedbacks').get();
    fbSnap.forEach(fb => {
      const id = fb.id;
      const data = fb.data() || {};
      if (id.startsWith('booking-') && data.author === GENERIC_AUTHOR) {
        const eventId = id.replace(/^booking-/, '');
        candidates.push({ matricula, feedbackId: id, eventId, ref: fb.ref, oldAuthor: data.author });
        eventIds.add(eventId);
      }
    });
  }

  if (candidates.length === 0) {
    console.log('Nenhum feedback auto-gerado com autor generico encontrado. Nada a fazer.');
    return;
  }

  // 2. Resolve o orientador (mentor) de cada evento em lote.
  const mentorByEvent = new Map();
  const eventRefs = Array.from(eventIds).map(eid => db.collection('Calendar_Events').doc(eid));
  for (let i = 0; i < eventRefs.length; i += 300) {
    const chunk = eventRefs.slice(i, i + 300);
    const snaps = await db.getAll(...chunk);
    snaps.forEach(s => {
      if (s.exists) {
        const m = s.data() || {};
        const mentor = typeof m.mentor === 'string' ? m.mentor.trim() : '';
        if (mentor) mentorByEvent.set(s.id, mentor);
      }
    });
  }

  // 3. Monta o plano (so quem tem orientador conhecido e diferente do generico).
  const plan = candidates
    .map(c => ({ ...c, newAuthor: mentorByEvent.get(c.eventId) || null }))
    .filter(c => c.newAuthor && c.newAuthor !== c.oldAuthor);

  const skipped = candidates.length - plan.length;

  console.log(`Candidatos (author "${GENERIC_AUTHOR}"): ${candidates.length}`);
  console.log(`A reescrever (evento com orientador): ${plan.length}`);
  console.log(`Sem orientador no evento (mantidos): ${skipped}\n`);

  plan.forEach(p => {
    console.log(`  ${p.matricula} / ${p.feedbackId}: "${p.oldAuthor}" -> "${p.newAuthor}"`);
  });

  if (plan.length === 0) {
    console.log('\nNada a aplicar.');
    return;
  }

  if (!APPLY) {
    console.log('\n(DRY-RUN — nada foi escrito. Rode com --apply para gravar.)');
    return;
  }

  // 4. Backup + escrita.
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const backupFile = path.join(BACKUP_DIR, `feedback-authors-${usersSnap.size}u-${plan.length}fb.json`);
  fs.writeFileSync(backupFile, JSON.stringify(plan.map(p => ({
    matricula: p.matricula, feedbackId: p.feedbackId, eventId: p.eventId, oldAuthor: p.oldAuthor, newAuthor: p.newAuthor
  })), null, 2));
  console.log(`\nBackup do estado a alterar: ${backupFile}`);

  let batch = db.batch();
  let ops = 0;
  for (const p of plan) {
    batch.update(p.ref, { author: p.newAuthor });
    ops++;
    if (ops % 400 === 0) { await batch.commit(); batch = db.batch(); }
  }
  if (ops % 400 !== 0) await batch.commit();

  console.log(`\nOK — ${plan.length} feedbacks reescritos com o orientador do evento.`);
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
