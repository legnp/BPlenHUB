/**
 * BPlen HUB - Normalizacao das chaves de entitlement dos clientes
 * (BUG-042 / Trilha 3b - execucao LOCAL)
 *
 * Alvo: os 4 clientes com services nao-vazio (levantamento em
 * inventory-entitlement-keys.js). Regras (decisoes da Gestora 2026-07-08):
 *
 *  (a) REMOVER chaves-lixo (verificadas inertes / arquivadas, grant nenhum):
 *      content_premium, hub_community, survey_welcome  (flags inertes)
 *      vLYKPTLII8tTP2Wo5wpV                            (ID orfao)
 *      1-to-1, desenvolvimento-de-carreira-em-grupo    (produtos arquivados)
 *  (b) RENOMEAR plano_de_Carreira (caixa errada) -> plano-de-carreira, HONRANDO
 *      o valor (BP-002 e conta de teste: valor true).
 *  (c) EMBAIXADORES (BP-005/011/012): remover plano-embaixadores-bplen (arquivado
 *      SERV-EMB-001) e conceder ACESSO TOTAL as etapas que o Pacote Embaixador
 *      (BPL-PAC-EB) libera -> slugs BPL-000..005 = true.
 *  (d) PRESERVAR: member_area_access (selo), career_planning (CAPABILITY VIVA do
 *      modulo Gestao de Carreira - NAO e apelido de plano-de-carreira; correcao ao
 *      design), e qualquer chave de produto ativo ja existente.
 *
 * Sem perda de dado: surveys/forms vivem em subcolecoes proprias (verificado). O
 * script faz BACKUP do doc access inteiro antes de escrever.
 *
 * Uso (SEGURO - dry-run, NAO escreve):   node scripts/migrate-entitlement-keys.js
 * Aplicar:                               node scripts/migrate-entitlement-keys.js --apply
 *   opcional: --matricula=BP-011-...     (um por vez)
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
const only = (args.find(a => a.startsWith('--matricula=')) || '').split('=')[1] || null;

const BACKUP_DIR = path.join(__dirname, '..', 'scratch', 'entitlement-key-backups');

// Chaves-lixo removidas de QUALQUER cliente onde aparecerem.
const REMOVE_ALWAYS = new Set([
  'content_premium', 'hub_community', 'survey_welcome',
  'vLYKPTLII8tTP2Wo5wpV', '1-to-1', 'desenvolvimento-de-carreira-em-grupo',
  'plano-embaixadores-bplen',
]);

// Etapas que o Pacote Embaixador (BPL-PAC-EB) libera, em slug (o motor le por slug).
const AMBASSADOR_STAGES = [
  'onboarding', 'posicionamento-profissional', 'analise-comportamental',
  'plano-de-carreira', 'gestao-e-desenvolvimento', 'mentocoach',
];
const AMBASSADORS = new Set(['BP-005-PF-260523', 'BP-011-PF-260526', 'BP-012-PF-260526']);

function computeTarget(matricula, current) {
  const next = { ...current };

  // (a) remover lixo
  for (const k of REMOVE_ALWAYS) delete next[k];

  // (b) renomear plano_de_Carreira -> plano-de-carreira (honrando valor)
  if ('plano_de_Carreira' in current) {
    next['plano-de-carreira'] = current['plano_de_Carreira'] === true;
    delete next['plano_de_Carreira'];
  }

  // (c) embaixadores: acesso total as etapas do pacote
  if (AMBASSADORS.has(matricula)) {
    for (const slug of AMBASSADOR_STAGES) next[slug] = true;
  }

  return next;
}

function diffKeys(before, after) {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const lines = [];
  for (const k of [...keys].sort()) {
    const b = before[k], a = after[k];
    if (!(k in after)) lines.push(`    - REMOVE  ${k} (era ${b})`);
    else if (!(k in before)) lines.push(`    + ADD     ${k} = ${a}`);
    else if (b !== a) lines.push(`    ~ CHANGE  ${k}: ${b} -> ${a}`);
  }
  return lines;
}

async function main() {
  console.log(`\n=== Migracao de chaves de entitlement (BUG-042) - modo: ${APPLY ? 'APPLY' : 'DRY-RUN (nada sera escrito)'} ===\n`);
  if (APPLY && !fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const permsSnap = await db.collectionGroup('User_Permissions').get();
  let touched = 0;
  for (const doc of permsSnap.docs) {
    if (doc.id !== 'access') continue;
    const matricula = doc.ref.parent.parent?.id;
    if (only && matricula !== only) continue;
    const data = doc.data();
    const current = data.services || {};
    if (Object.keys(current).length === 0) continue;

    const target = computeTarget(matricula, current);
    const lines = diffKeys(current, target);
    if (lines.length === 0) continue;

    touched++;
    console.log(`--- ${matricula} ${AMBASSADORS.has(matricula) ? '(Embaixador)' : ''} ---`);
    lines.forEach(l => console.log(l));

    if (APPLY) {
      // Backup do estado ORIGINAL apenas (nao sobrescreve se ja existe — protege o
      // ponto de restauracao real numa reexecucao).
      const backupFile = path.join(BACKUP_DIR, `${matricula}__access.json`);
      if (!fs.existsSync(backupFile)) {
        fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
      }
      // `update` (NAO set+merge): substitui o mapa `services` INTEIRO por `target`.
      // set(...,{merge:true}) faz merge profundo do mapa e NUNCA remove chave ausente
      // — por isso remocoes nao surtiam efeito. `update` troca o valor do campo todo,
      // preservando os demais campos do doc (role/admin/metadata/...).
      await doc.ref.update({
        services: target,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: 'MIGRATION:bug-042-entitlement-keys',
      });
      console.log(`    [APLICADO] backup original: scratch/entitlement-key-backups/${matricula}__access.json`);
    }
    console.log('');
  }

  console.log(`${touched} cliente(s) ${APPLY ? 'migrados' : 'seriam migrados'}.`);
  if (!APPLY && touched > 0) console.log('Rode com --apply para executar (faz backup de cada doc antes).');
}

main().then(() => process.exit(0)).catch(e => { console.error('ERRO:', e); process.exit(1); });
