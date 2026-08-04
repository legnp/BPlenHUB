const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

/**
 * BPlen HUB - Migracao da lista fechada de tipos de evento: 3 -> 5.
 *
 * Decisao da Gestora (2026-08-03, secao 8.10 do AGENDA-SYNC-DESIGN): Onboarding e
 * Offboarding SAO sessoes em grupo, mas ganham tipo PROPRIO em vez de serem servidos
 * pelo tipo `Consultoria em Grupo` — cada um se chama pelo proprio nome.
 *
 * O que faz em `Settings/CalendarEventTypes`:
 *   1. cria os tipos `onboarding` (atende BPL-000) e `offboarding` (atende BPL-006);
 *   2. tira BPL-000 e BPL-006 do `atende` do `consultoria-em-grupo`, que fica so com
 *      o GDC (BPL-004);
 *   3. preserva `consultorPadrao`, `vagasPadrao` e o `atende` dos tipos existentes.
 *
 * O `atende` VAZIO do `1 to 1` e preservado de proposito: e decisao da Gestora (o 1 to 1
 * e avulso, nao pertence a trilha nenhuma), nao pendencia. O teste
 * `src/__tests__/calendar-event-types.test.ts` trava isso.
 *
 * Uso:
 *   node scripts/migrate-calendar-event-types.js            (dry-run: so o diff)
 *   node scripts/migrate-calendar-event-types.js --apply    (grava)
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

const CONSULTOR_A_DEFINIR = 'a definir';
const GRUPO_SAI = ['BPL-000', 'BPL-006'];

const NOVOS = [
  { id: 'onboarding', label: 'Onboarding', googleTitle: 'Onboarding', vagasPadrao: 10, atende: ['BPL-000'] },
  { id: 'offboarding', label: 'Offboarding', googleTitle: 'Offboarding', vagasPadrao: 10, atende: ['BPL-006'] },
];

async function main() {
  console.log('[migrate-calendar-event-types] modo: ' + (APPLY ? 'APLICAR' : 'DRY-RUN'));

  const ref = db.collection('Settings').doc('CalendarEventTypes');
  const snap = await ref.get();
  const atuais = snap.exists ? (snap.data().types || []) : [];

  console.log(NL + '--- ANTES (' + atuais.length + ' tipos) ---');
  atuais.forEach((t) => {
    console.log('  ' + t.id + ' | "' + t.googleTitle + '" | vagas=' + t.vagasPadrao +
      ' | atende=[' + (t.atende || []).join(', ') + ']');
  });

  const destino = atuais.map((t) => {
    if (t.id !== 'consultoria-em-grupo') return t;
    const atende = (t.atende || []).filter((c) => GRUPO_SAI.indexOf(c) < 0);
    return Object.assign({}, t, { atende: atende });
  });

  NOVOS.forEach((novo) => {
    const existente = destino.find((t) => t.id === novo.id);
    if (existente) {
      console.log(NL + 'tipo "' + novo.id + '" JA existe — preservado como esta.');
      return;
    }
    destino.push({
      id: novo.id,
      label: novo.label,
      googleTitle: novo.googleTitle,
      consultorPadrao: CONSULTOR_A_DEFINIR,
      vagasPadrao: novo.vagasPadrao,
      atende: novo.atende,
    });
  });

  console.log(NL + '--- DEPOIS (' + destino.length + ' tipos) ---');
  destino.forEach((t) => {
    const antes = atuais.find((a) => a.id === t.id);
    const marca = !antes ? '  <- NOVO'
      : (JSON.stringify(antes.atende || []) !== JSON.stringify(t.atende || []) ? '  <- atende alterado' : '');
    console.log('  ' + t.id + ' | "' + t.googleTitle + '" | vagas=' + t.vagasPadrao +
      ' | atende=[' + (t.atende || []).join(', ') + ']' + marca);
  });

  // Trava a mesma invariante da tela: googleTitle nao pode repetir.
  const chaves = destino.map((t) => String(t.googleTitle || '').trim().toLowerCase());
  if (new Set(chaves).size !== chaves.length) {
    console.error(NL + 'ABORTADO: ha googleTitle repetido — o tipoId ficaria ambiguo.');
    process.exit(1);
  }

  if (!APPLY) {
    console.log(NL + 'Nada foi gravado. Rode com --apply para aplicar.');
    return;
  }

  await ref.set({ types: destino, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  console.log(NL + 'Gravado. ' + destino.length + ' tipos em Settings/CalendarEventTypes.');
}

main().then(() => process.exit(0)).catch((e) => {
  console.error('[migrate-calendar-event-types] falhou:', e);
  process.exit(1);
});
