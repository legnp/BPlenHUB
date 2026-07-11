/**
 * BPlen HUB - Normalizacao de chaves de cota (BUG-008)
 *
 * Contexto: as carteiras de cota (User/{matricula}/User_Permissions/quotas, campo
 * `quotas: { "<chave>": {total, used, lastUpdated} }`) acumularam chaves em
 * convencoes de case misturadas — `updateMemberQuotasAction` gravava em UPPERCASE
 * (`type.toUpperCase()`), uma migracao antiga normalizou para minusculo, e alguns
 * leitores (OneToOneBookingModal, consumeQuotaAction) so enxergam a forma minuscula
 * do catalogo (`1-to-1`). Resultado: saldo aparecendo como nulo em algumas telas e,
 * em casos, a MESMA cota duplicada em dois cases no mesmo mapa.
 *
 * Este script normaliza TODA chave para minusculo (chave canonica, batendo com o
 * catalogo de produtos), dobra o alias legado `mentoria_1to1` -> `1-to-1`, e MESCLA
 * duplicatas resultantes com a politica aprovada pela Gestora:
 *   - total    = MAIOR entre as duplicatas (o artefato de case nao infla o saldo)
 *   - used     = SOMA (nunca devolve credito ja consumido)
 *   - lastUpdated = mais recente
 * Preserva os demais campos do doc (uid, mentoCoachSessionsLimit, updatedAt) e
 * substitui APENAS o campo `quotas` inteiro via update() — set(merge:true) NUNCA
 * apaga chave de map (ver RETROSPECTIVE L16), entao update() e obrigatorio para
 * remover as chaves-lixo de case antigo.
 *
 * A logica de fold espelha `src/lib/quota-keys.ts:foldQuotaMap`.
 *
 * Uso (SEGURO por padrao - dry-run, NAO escreve nada; lista o diff por usuario):
 *   node scripts/normalize-quota-keys.js
 *
 * Aplicar de verdade (faz backup em scratch/ e reescreve o campo `quotas`):
 *   node scripts/normalize-quota-keys.js --apply
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
const BACKUP_DIR = path.join(__dirname, '..', 'scratch', 'quota-key-backups');

/** Chave canonica: minusculo + alias legado mentoria_1to1 -> 1-to-1. */
function normalizeQuotaKey(key) {
  const k = String(key).trim().toLowerCase();
  if (k === 'mentoria_1to1') return '1-to-1';
  return k;
}

/** Espelha src/lib/quota-keys.ts:foldQuotaMap (total=max, used=soma, lastUpdated=recente). */
function foldQuotaMap(raw) {
  const out = {};
  if (!raw) return out;
  for (const [rawKey, val] of Object.entries(raw)) {
    if (!val) continue;
    const key = normalizeQuotaKey(rawKey);
    const total = Number(val.total) || 0;
    const used = Number(val.used) || 0;
    const lastUpdated = val.lastUpdated || '';
    const existing = out[key];
    if (!existing) {
      out[key] = { total, used, lastUpdated };
    } else {
      out[key] = {
        total: Math.max(existing.total, total),
        used: existing.used + used,
        lastUpdated: lastUpdated > existing.lastUpdated ? lastUpdated : existing.lastUpdated,
      };
    }
  }
  return out;
}

/** Comparacao estavel de mapas de cota (chaves + valores), independente de ordem. */
function sameQuotaMap(a, b) {
  const ak = Object.keys(a).sort();
  const bk = Object.keys(b).sort();
  if (ak.length !== bk.length || ak.some((k, i) => k !== bk[i])) return false;
  return ak.every(k => a[k].total === b[k].total && a[k].used === b[k].used);
}

async function run() {
  console.log(`\n[Normalize Quota Keys] Modo: ${APPLY ? 'APPLY (backup + reescreve)' : 'DRY-RUN (nao escreve)'}\n`);

  // Todos os docs `quotas` sob qualquer User_Permissions.
  const snap = await db.collectionGroup('User_Permissions').get();
  const quotaDocs = snap.docs.filter(d => d.id === 'quotas');

  if (!quotaDocs.length) {
    console.log('Nenhuma carteira de cotas encontrada. Nada a normalizar.');
    return;
  }

  if (APPLY && !fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

  let changed = 0;
  let unchanged = 0;

  for (const doc of quotaDocs) {
    const matricula = doc.ref.parent.parent ? doc.ref.parent.parent.id : '(desconhecida)';
    const data = doc.data();
    const original = data.quotas || {};
    const folded = foldQuotaMap(original);

    if (sameQuotaMap(original, folded)) {
      unchanged++;
      continue;
    }

    changed++;
    console.log(`  ${matricula}`);
    console.log(`    antes: ${JSON.stringify(original)}`);
    console.log(`    depois:${JSON.stringify(folded)}`);

    if (APPLY) {
      // Backup do estado original ANTES de qualquer escrita.
      const backupFile = path.join(BACKUP_DIR, `${matricula}.json`);
      fs.writeFileSync(backupFile, JSON.stringify({ matricula, path: doc.ref.path, quotas: original }, null, 2));
      // update() substitui o campo `quotas` inteiro (remove chaves de case antigo),
      // preservando uid / mentoCoachSessionsLimit / updatedAt.
      await doc.ref.update({ quotas: folded });
    }
  }

  console.log(`\nResumo: ${changed} ${APPLY ? 'normalizadas' : 'a normalizar'} | ${unchanged} ja canonicas | ${quotaDocs.length} carteiras no total.`);
  if (!APPLY) console.log('Rode novamente com --apply para efetivar (backups em scratch/quota-key-backups/).\n');
  else console.log(`Aplicado. Backups do estado original em ${BACKUP_DIR}. Reexecute em DRY-RUN para confirmar 0 a normalizar.\n`);
}

run().then(() => process.exit(0)).catch((e) => {
  console.error('Erro na normalizacao:', e);
  process.exit(1);
});
