const admin = require('firebase-admin');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * BPlen HUB - Backfill do indice de unicidade de CPF (_CpfIndex) - Fase 1b.
 *
 * Popula _CpfIndex/{cpfHash} -> { matricula } a partir dos profile.cpf ja
 * existentes, para que a trava passe a valer tambem contra CPFs legados (sem
 * isto, um CPF legado so entra no indice quando o usuario re-salva o cadastro).
 *
 * Privacidade: NUNCA imprime CPF - so hash e matricula. Reusa o MESMO algoritmo
 * de hash do app (HMAC-SHA256 com salt = FIREBASE_PROJECT_ID), senao o indice
 * nao casaria com o que a trava calcula em producao.
 *
 * Reporta DUPLICATAS (mesmo CPF em matriculas diferentes) - os casos legados a
 * investigar (ver a nota de governanca: baldes A/B/C). Nao mescla nada.
 *
 * Uso:
 *   node scripts/backfill-cpf-index.js --dry-run   (so relatorio, nao grava)
 *   node scripts/backfill-cpf-index.js             (grava o indice)
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

// Salt IGUAL ao do app (src/utils/crypto.ts).
const SALT = process.env.FIREBASE_PROJECT_ID || 'bplen-hub-default-salt-key';
const onlyDigits = (s) => String(s || '').replace(/[^0-9]/g, '');

function hashCpf(cpf) {
  return crypto.createHmac('sha256', SALT).update(onlyDigits(cpf)).digest('hex');
}

// Validacao de CPF (digito verificador) - espelha src/utils/validations.ts.
function validateCPF(cpf) {
  const c = onlyDigits(cpf);
  if (c.length !== 11) return false;
  if (/^([0-9])\1+$/.test(c)) return false;
  let sum = 0;
  for (let i = 1; i <= 9; i++) sum += parseInt(c.substring(i - 1, i), 10) * (11 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(c.substring(9, 10), 10)) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) sum += parseInt(c.substring(i - 1, i), 10) * (12 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(c.substring(10, 11), 10)) return false;
  return true;
}

// Dono preferido em caso de duplicata: --prefer=BP-XXX (pode repetir). Se uma das
// matriculas candidatas estiver na lista, ela vira a dona do indice; senao usa a
// primeira encontrada. Nunca mescla contas - so decide qual referencia o indice.
function preferredOwners() {
  const p = '--prefer=';
  return process.argv.filter((a) => a.indexOf(p) === 0).map((a) => a.slice(p.length));
}

function chooseOwner(mats, preferred) {
  const pick = mats.find((m) => preferred.indexOf(m) !== -1);
  return pick || mats[0];
}

async function run() {
  const dryRun = process.argv.includes('--dry-run');
  const preferred = preferredOwners();
  console.log(`[backfill-cpf-index] Iniciando ${dryRun ? '(DRY-RUN, nao grava)' : '(GRAVANDO)'}...`);
  if (preferred.length) console.log(`[backfill-cpf-index] Donos preferidos: ${preferred.join(', ')}`);

  const usersSnap = await db.collection('User').get();
  console.log(`[backfill-cpf-index] ${usersSnap.size} docs em User.`);

  const byHash = {}; // hash -> [matricula, ...]
  let withCpf = 0;
  let invalid = 0;
  let noCpf = 0;

  usersSnap.forEach((doc) => {
    const cpf = doc.data() && doc.data().profile ? doc.data().profile.cpf : null;
    if (!cpf) {
      noCpf++;
      return;
    }
    if (!validateCPF(cpf)) {
      invalid++;
      return;
    }
    withCpf++;
    const h = hashCpf(cpf);
    if (!byHash[h]) byHash[h] = [];
    byHash[h].push(doc.id);
  });

  const hashes = Object.keys(byHash);
  const duplicates = hashes.filter((h) => byHash[h].length > 1);

  // Gravacao (idempotente). Para duplicatas, grava a PRIMEIRA matricula e marca
  // o doc com a lista completa para investigacao manual (nunca mescla).
  let written = 0;
  if (!dryRun) {
    for (const h of hashes) {
      const mats = byHash[h];
      const payload = {
        matricula: chooseOwner(mats, preferred),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        source: 'backfill',
      };
      if (mats.length > 1) payload.duplicateMatriculas = mats;
      await db.collection('_CpfIndex').doc(h).set(payload, { merge: true });
      written++;
    }
  }

  console.log('');
  console.log('===== RESUMO =====');
  console.log(`Com CPF valido:      ${withCpf}`);
  console.log(`Sem CPF:             ${noCpf}`);
  console.log(`CPF invalido (skip): ${invalid}`);
  console.log(`CPFs unicos:         ${hashes.length}`);
  console.log(`Entradas gravadas:   ${dryRun ? 0 : written}`);
  console.log(`DUPLICATAS:          ${duplicates.length}`);

  if (duplicates.length > 0) {
    console.log('');
    console.log('===== CPFs DUPLICADOS (mesma pessoa, contas diferentes) =====');
    console.log('(hash do CPF - nunca o CPF em claro - e as matriculas envolvidas)');
    duplicates.forEach((h) => {
      const owner = chooseOwner(byHash[h], preferred);
      console.log(`- ${h.substring(0, 12)}...  ->  ${byHash[h].join(', ')}  [dona: ${owner}]`);
    });
    console.log('');
    console.log('Investigar cada caso (baldes A/B/C da nota de governanca). Nao mesclar automaticamente.');
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[backfill-cpf-index] Falha:', err);
    process.exit(1);
  });
