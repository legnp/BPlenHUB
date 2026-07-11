/**
 * BPlen HUB - Migracao de PII: tickets de suporte para subcolecoes privadas (BUG-001)
 *
 * Contexto: os tickets de suporte eram gravados na colecao RAIZ `Support_Tickets`,
 * misturando PII (uid/email/matricula/nome/descricao + print base64) de todos os
 * usuarios. A regra do projeto (CLAUDE.md) exige dado sensivel em subcolecao privada
 * por usuario. A partir do PR do BUG-001, os tickets novos vao para:
 *   - com matricula: User/{matricula}/Support_Tickets/{id}
 *   - sem matricula: _SupportTickets/{uid}/tickets/{id}
 *
 * Este script MOVE os tickets antigos da raiz para o novo local (preservando o id do
 * doc) e apaga o doc raiz. SEM backup por decisao da Gestora (todos os tickets atuais
 * sao de teste, nenhum real). Docs sem uid nem matricula sao reportados e NAO movidos.
 *
 * Uso (SEGURO por padrao - dry-run, NAO escreve nada):
 *   node scripts/migrate-support-tickets.js
 *
 * Aplicar de verdade (move e apaga da raiz):
 *   node scripts/migrate-support-tickets.js --apply
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

async function run() {
  console.log(`\n[Support Tickets Migration] Modo: ${APPLY ? 'APPLY (move e apaga)' : 'DRY-RUN (nao escreve)'}\n`);

  const snap = await db.collection('Support_Tickets').get();
  if (snap.empty) {
    console.log('Nenhum ticket na raiz Support_Tickets. Nada a migrar.');
    return;
  }

  let moved = 0;
  let skipped = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const matricula = data.matricula || null;
    const uid = data.uid || null;

    let targetRef = null;
    let targetPath = '';
    if (matricula) {
      targetRef = db.collection('User').doc(matricula).collection('Support_Tickets').doc(doc.id);
      targetPath = `User/${matricula}/Support_Tickets/${doc.id}`;
    } else if (uid) {
      targetRef = db.collection('_SupportTickets').doc(uid).collection('tickets').doc(doc.id);
      targetPath = `_SupportTickets/${uid}/tickets/${doc.id}`;
    } else {
      console.warn(`  ! SKIP ${doc.id}: sem matricula nem uid (nao ha destino privado).`);
      skipped++;
      continue;
    }

    console.log(`  ${APPLY ? '->' : '(dry)'} ${doc.id}  ->  ${targetPath}`);

    if (APPLY) {
      await targetRef.set(data);
      await doc.ref.delete();
    }
    moved++;
  }

  console.log(`\nResumo: ${moved} ${APPLY ? 'movidos' : 'a mover'} | ${skipped} pulados (sem destino).`);
  if (!APPLY) console.log('Rode novamente com --apply para efetivar.\n');
  else console.log('Migracao aplicada. A raiz Support_Tickets deve estar vazia (confira).\n');
}

run().then(() => process.exit(0)).catch((e) => {
  console.error('Erro na migracao:', e);
  process.exit(1);
});
