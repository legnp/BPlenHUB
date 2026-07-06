/**
 * BPlen HUB - Consolidacao de Jornada: limpeza do User_JourneyMap legado
 * (BUG-018, Acao 2 - execucao LOCAL apenas)
 *
 * Contexto: existem duas subcolecoes de jornada redundantes por usuario:
 *   - User/{matricula}/User_Journey/progress    -> v3, CANONICO (motor journey.ts)
 *   - User/{matricula}/User_JourneyMap/progress -> LEGADO (aposentar)
 * A Acao 1a (PR #22) ja parou de escrever o legado para usuarios novos. Este
 * script migra os CLIENTES ATUAIS: para cada usuario que JA tem o v3, faz backup
 * e apaga a subcolecao legada User_JourneyMap. Usuarios que so tem o legado (sem
 * v3) NAO sao apagados - sao reportados para revisao manual (seguranca de dados).
 *
 * Sem perda de dados: o antigo capturedData do legado era desnormalizacao
 * (userType/nickname -> User_Type/User_Nickname no doc do User; origin/demand/
 * topics -> resposta crua em User/{matricula}/Surveys/welcome_survey.data). Ainda
 * assim, este script faz BACKUP local (JSON) de cada doc antes de apagar.
 *
 * Uso (SEGURO por padrao - dry-run, NAO escreve nada):
 *   node scripts/migrate-journeymap-cleanup.js
 *   node scripts/migrate-journeymap-cleanup.js --matricula=BP-013-PF-260527
 *   node scripts/migrate-journeymap-cleanup.js --limit=5
 *
 * Aplicar de verdade (faz backup e apaga o legado onde ha v3):
 *   node scripts/migrate-journeymap-cleanup.js --apply
 *   node scripts/migrate-journeymap-cleanup.js --apply --matricula=BP-013-PF-260527
 *   node scripts/migrate-journeymap-cleanup.js --apply --limit=1     (um por vez)
 *
 * Backups: scratch/journeymap-backups/<matricula>__<docId>.json (scratch e gitignored).
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
const matriculaArg = args.find(a => a.startsWith('--matricula='));
const ONLY_MATRICULA = matriculaArg ? matriculaArg.split('=')[1] : null;
const limitArg = args.find(a => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;
// Por padrao, usuarios so-legado (sem v3) NAO sao apagados (protecao). Com esta
// flag, eles TAMBEM sao apagados (sempre com backup). Seguro pois o capturedData
// ja esta preservado (User_Type/User_Nickname + Surveys/welcome_survey.data) e
// esses usuarios nunca progrediram na jornada (nao tinham v3).
const INCLUDE_NO_V3 = args.includes('--include-sem-v3');

const BACKUP_DIR = path.join(__dirname, '..', 'scratch', 'journeymap-backups');

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function backupDoc(matricula, docId, data) {
  ensureBackupDir();
  const safeMat = String(matricula).replace(/[^\w.-]/g, '_');
  const safeDoc = String(docId).replace(/[^\w.-]/g, '_');
  const file = path.join(BACKUP_DIR, `${safeMat}__${safeDoc}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return file;
}

async function run() {
  console.log('=== Consolidacao de Jornada: limpeza do User_JourneyMap (BUG-018, Acao 2) ===');
  console.log(APPLY ? 'MODO: --apply (vai fazer backup e APAGAR o legado onde houver v3)'
                    : 'MODO: dry-run (NAO escreve nada; apenas relatorio). Use --apply para executar.');
  if (ONLY_MATRICULA) console.log(`Filtro: apenas matricula ${ONLY_MATRICULA}`);
  if (LIMIT) console.log(`Limite: ${LIMIT} usuario(s) processado(s) nesta execucao`);
  console.log('');

  let targets;
  if (ONLY_MATRICULA) {
    targets = [db.collection('User').doc(ONLY_MATRICULA)];
  } else {
    const usersSnap = await db.collection('User').get();
    targets = usersSnap.docs.map(d => d.ref);
  }

  const stats = { total: 0, both_deleted: 0, both_skipped_dryrun: 0, only_legacy_flagged: 0, only_v3: 0, neither: 0 };
  const onlyLegacy = [];
  let processed = 0;

  for (const userRef of targets) {
    if (LIMIT && processed >= LIMIT) break;
    const matricula = userRef.id;
    stats.total++;

    const v3Snap = await userRef.collection('User_Journey').doc('progress').get();
    const legacySnap = await userRef.collection('User_JourneyMap').get(); // toda a subcolecao
    const hasV3 = v3Snap.exists;
    const hasLegacy = !legacySnap.empty;

    if (!hasLegacy) {
      if (hasV3) stats.only_v3++; else stats.neither++;
      continue; // nada de legado para limpar
    }

    processed++;

    if (!hasV3) {
      // So tem o legado, sem v3.
      if (!INCLUDE_NO_V3) {
        // Protecao padrao: nao apagar; reportar para revisao manual.
        stats.only_legacy_flagged++;
        onlyLegacy.push(matricula);
        console.log(`[REVISAR] ${matricula}: tem User_JourneyMap MAS nao tem User_Journey (v3). NAO sera apagado (use --include-sem-v3 para incluir). Ou faca o usuario acessar a jornada (lazy-write cria o v3).`);
        continue;
      }
      const legacyDocIdsNoV3 = legacySnap.docs.map(d => d.id);
      if (!APPLY) {
        stats.only_legacy_would_delete = (stats.only_legacy_would_delete || 0) + 1;
        console.log(`[DRY-RUN sem-v3] ${matricula}: User_JourneyMap presente sem v3 (docs: ${legacyDocIdsNoV3.join(', ')}) -> SERIA apagado com backup (--include-sem-v3).`);
        continue;
      }
      for (const d of legacySnap.docs) {
        const file = backupDoc(matricula, d.id, d.data());
        await d.ref.delete();
        console.log(`[APAGADO sem-v3] ${matricula}/User_JourneyMap/${d.id} (backup: ${path.relative(path.join(__dirname, '..'), file)})`);
      }
      stats.only_legacy_deleted = (stats.only_legacy_deleted || 0) + 1;
      continue;
    }

    // Caso "both": v3 existe -> o legado e redundante e pode ser removido.
    const legacyDocIds = legacySnap.docs.map(d => d.id);
    if (!APPLY) {
      stats.both_skipped_dryrun++;
      console.log(`[DRY-RUN] ${matricula}: v3 OK + User_JourneyMap presente (docs: ${legacyDocIds.join(', ')}) -> SERIA apagado (com backup).`);
      continue;
    }

    // --apply: backup + delete de cada doc da subcolecao legada
    for (const d of legacySnap.docs) {
      const file = backupDoc(matricula, d.id, d.data());
      await d.ref.delete();
      console.log(`[APAGADO] ${matricula}/User_JourneyMap/${d.id} (backup: ${path.relative(path.join(__dirname, '..'), file)})`);
    }
    stats.both_deleted++;
  }

  console.log('\n=== Resumo ===');
  console.log(`Usuarios avaliados: ${stats.total}`);
  console.log(`- Com v3 + legado (both): ${APPLY ? stats.both_deleted + ' apagados' : stats.both_skipped_dryrun + ' seriam apagados (dry-run)'}`);
  if (INCLUDE_NO_V3) {
    console.log(`- So legado, sem v3 (--include-sem-v3): ${APPLY ? (stats.only_legacy_deleted || 0) + ' apagados' : (stats.only_legacy_would_delete || 0) + ' seriam apagados (dry-run)'}`);
  } else {
    console.log(`- So legado, sem v3 (REVISAR, nao apagados): ${stats.only_legacy_flagged}`);
  }
  console.log(`- So v3 (nada a fazer): ${stats.only_v3}`);
  console.log(`- Sem nenhum (nada a fazer): ${stats.neither}`);
  if (onlyLegacy.length) {
    console.log(`\nMatriculas a revisar (so legado): ${onlyLegacy.join(', ')}`);
  }
  if (!APPLY) {
    console.log('\nNada foi alterado (dry-run). Reveja o relatorio acima e rode com --apply quando estiver seguro.');
  } else {
    console.log(`\nConcluido. Backups em: ${path.relative(path.join(__dirname, '..'), BACKUP_DIR)}`);
  }
}

run().catch(err => {
  console.error('Falha na migracao:', err);
  process.exit(1);
});
