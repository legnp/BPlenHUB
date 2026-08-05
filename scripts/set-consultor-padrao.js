const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

/**
 * BPlen HUB - Define o consultor padrao dos tipos de evento da agenda.
 *
 * Decisao da Gestora (2026-08-05): o campo deixa de nascer como "a definir" e passa a
 * nascer com a consultora atual. Isto REVERTE a decisao da secao 8.2 do
 * AGENDA-SYNC-DESIGN, que criava fila de trabalho visivel em vez de um padrao
 * inventado — o padrao deixou de ser inventado.
 *
 * So mexe no `consultorPadrao`. `atende`, `vagasPadrao`, `googleTitle` e as listas de
 * motivos ficam intactos — em especial o `atende` VAZIO do `1 to 1`, que e decisao.
 *
 * A atribuicao por ocorrencia (Fase 3.2) continua sendo o caminho para excecoes.
 *
 * Uso:
 *   node scripts/set-consultor-padrao.js                          (dry-run)
 *   node scripts/set-consultor-padrao.js --apply
 *   node scripts/set-consultor-padrao.js --nome "Outra Pessoa" --apply
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
const APPLY = process.argv.includes('--apply');

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : null;
}

// Espelha CONSULTOR_PADRAO de src/types/calendar-event-types.ts.
const NOME = argValue('--nome') || 'Lisandra Lencina';

async function main() {
  console.log('[set-consultor-padrao] modo: ' + (APPLY ? 'APLICAR' : 'DRY-RUN'));
  console.log('  consultor: "' + NOME + '"');

  const ref = db.collection('Settings').doc('CalendarEventTypes');
  const snap = await ref.get();
  if (!snap.exists) {
    console.log('Documento Settings/CalendarEventTypes nao existe — nada a fazer.');
    return;
  }

  const tipos = (snap.data() || {}).types || [];
  let mudam = 0;

  const destino = tipos.map((t) => {
    if (t.consultorPadrao === NOME) {
      console.log('  ' + t.id + ' | ja esta como "' + NOME + '"');
      return t;
    }
    mudam += 1;
    console.log('  ' + t.id + ' | "' + t.consultorPadrao + '" -> "' + NOME + '"');
    return Object.assign({}, t, { consultorPadrao: NOME });
  });

  console.log('');
  console.log('tipos a alterar: ' + mudam + ' de ' + tipos.length);

  if (!APPLY) {
    console.log('Nada foi gravado. Rode com --apply para aplicar.');
    return;
  }
  if (mudam === 0) return;

  await ref.set({ types: destino, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  console.log('Gravado.');
}

main().then(() => process.exit(0)).catch((e) => {
  console.error('[set-consultor-padrao] falhou:', e);
  process.exit(1);
});
