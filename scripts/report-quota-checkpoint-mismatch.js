const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

/**
 * BPlen HUB - Relatorio do descasamento cota x checkpoints (Fase 0).
 *
 * READ-ONLY. Nao escreve nada, em nenhum modo.
 *
 * A jornada mostra um numero FIXO de checkpoints por etapa (vem do `deliverySteps` do
 * produto), mas quantas sessoes o membro efetivamente contratou vive na carteira de
 * cotas. Este relatorio poe os dois lado a lado para a decisao da Fase 0: qual campo e a
 * fonte de verdade de "quantas sessoes este membro tem".
 *
 * Uso:
 *   node scripts/report-quota-checkpoint-mismatch.js
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

/** Compara chaves ignorando hifen/underscore/caixa - pega duplicata que a normalizacao de caixa NAO pega. */
const loose = (k) => String(k || '').toLowerCase().replace(/[-_]/g, '');

function pad(s, n) {
  const v = String(s);
  return v.length >= n ? v : v + ' '.repeat(n - v.length);
}

async function main() {
  console.log('======================================================================');
  console.log(' FASE 0 - Descasamento cota x checkpoints (relatorio READ-ONLY)');
  console.log('======================================================================');

  // ---------- 1. CATALOGO ----------
  const prodSnap = await db.collection('products').get();
  const produtos = prodSnap.docs.map((d) => Object.assign({ docId: d.id }, d.data()));

  const chavesConcedidas = new Set();
  produtos.forEach((p) => {
    Object.keys(p.grantedQuotas || {}).forEach((k) => chavesConcedidas.add(k));
  });

  const etapas = produtos
    .filter((p) => p.isStepJourney && p.order !== undefined && p.order !== null)
    .sort((a, b) => Number(a.order) - Number(b.order));

  console.log(NL + '--- 1. CATALOGO: o que cada etapa entrega e o que concede ---' + NL);
  const sessoesPorEtapa = {};

  etapas.forEach((p) => {
    const steps = Array.isArray(p.deliverySteps) ? p.deliverySteps : [];
    const contagem = {};
    steps.forEach((s) => {
      const k = s.type + ':' + s.referenceId;
      contagem[k] = (contagem[k] || 0) + 1;
    });
    const repetidas = Object.keys(contagem).filter((k) => contagem[k] > 1);
    const totalSessoes = repetidas.reduce((acc, k) => acc + contagem[k], 0);
    const slug = p.slug || p.docId;
    sessoesPorEtapa[slug] = { total: totalSessoes, chaves: repetidas };

    console.log(pad(slug, 30) + ' order=' + pad(p.order, 3) + ' checkpoints=' + pad(steps.length, 3) +
      ' | paradas de sessao: ' + (totalSessoes || 0) + (repetidas.length ? ' (' + repetidas.join(', ') + ')' : ''));
    Object.keys(p.grantedQuotas || {}).forEach((k) => {
      console.log('    concede  ' + pad(k, 34) + ' = ' + p.grantedQuotas[k]);
    });
  });

  console.log(NL + '--- 2. PACOTES (nao sao etapas, mas concedem cota) ---' + NL);
  produtos
    .filter((p) => !p.isStepJourney && Object.keys(p.grantedQuotas || {}).length > 0)
    .forEach((p) => {
      console.log(pad(p.slug || p.docId, 30) + ' ' + (p.serviceCode || ''));
      Object.keys(p.grantedQuotas).forEach((k) => {
        console.log('    concede  ' + pad(k, 34) + ' = ' + p.grantedQuotas[k]);
      });
    });

  // ---------- 3. MEMBROS ----------
  console.log(NL + '--- 3. MEMBROS: carteira de cotas x progresso ---' + NL);

  const users = await db.collection('User').get();
  const orfas = {};
  const duplicadasFrouxas = {};

  for (const u of users.docs) {
    const matricula = u.id;
    const nome = (u.data() || {}).name || '';

    const qSnap = await db.collection('User').doc(matricula)
      .collection('User_Permissions').doc('quotas').get();
    const qData = qSnap.exists ? (qSnap.data() || {}) : {};
    const carteira = qData.quotas || {};

    const pSnap = await db.collection('User').doc(matricula)
      .collection('User_Journey').doc('progress').get();
    const steps = pSnap.exists ? ((pSnap.data() || {}).steps || {}) : {};

    console.log('* ' + matricula + (nome ? ' (' + nome + ')' : ''));
    console.log('    mentoCoachSessionsLimit: ' +
      (qData.mentoCoachSessionsLimit === undefined ? 'ausente (o admin assume 10)' : qData.mentoCoachSessionsLimit));

    if (Object.keys(carteira).length === 0) {
      console.log('    (carteira vazia)');
    }

    // Duplicatas que a normalizacao de CAIXA nao resolve (hifen x sem hifen).
    const porFrouxa = {};
    Object.keys(carteira).forEach((k) => {
      const f = loose(k);
      if (!porFrouxa[f]) porFrouxa[f] = [];
      porFrouxa[f].push(k);
    });

    Object.keys(carteira).sort().forEach((k) => {
      const v = carteira[k] || {};
      const marcas = [];
      if (!chavesConcedidas.has(k)) marcas.push('SEM PRODUTO QUE CONCEDA');
      if (porFrouxa[loose(k)].length > 1) marcas.push('DUPLICATA: ' + porFrouxa[loose(k)].join(' / '));
      console.log('    cota ' + pad('"' + k + '"', 36) + ' total=' + pad(v.total, 4) + ' used=' + pad(v.used, 4) +
        (marcas.length ? '  <- ' + marcas.join(' | ') : ''));

      if (!chavesConcedidas.has(k)) orfas[k] = (orfas[k] || 0) + 1;
      if (porFrouxa[loose(k)].length > 1) duplicadasFrouxas[loose(k)] = porFrouxa[loose(k)];
    });

    // Divergencia por etapa com paradas de sessao.
    Object.keys(sessoesPorEtapa).forEach((slug) => {
      const info = sessoesPorEtapa[slug];
      if (!info.total) return;

      const chave = Object.keys(steps).find((k) => loose(k) === loose(slug));
      const sp = chave ? steps[chave] : null;
      const concluidos = sp && sp.completedSubSteps ? sp.completedSubSteps.length : 0;

      const creditos1a1 = (carteira['1-to-1'] || {}).total;
      const limite = qData.mentoCoachSessionsLimit;

      console.log('    etapa ' + pad(slug, 26) +
        ' paradas de sessao no produto=' + pad(info.total, 3) +
        ' | creditos 1-to-1 na carteira=' + pad(creditos1a1 === undefined ? '-' : creditos1a1, 4) +
        (slug === 'mentocoach' ? ' | mentoCoachSessionsLimit=' + (limite === undefined ? '-' : limite) : '') +
        ' | progresso gravado: ' + concluidos + ' concluidos');
    });
  }

  // ---------- 4. SINTESE ----------
  console.log(NL + '--- 4. SINTESE PARA DECISAO ---' + NL);

  console.log('a) Chaves de cota na carteira de alguem que NENHUM produto concede hoje');
  console.log('   (legado ou lancamento manual - candidatas a limpeza):');
  const chavesOrfas = Object.keys(orfas).sort();
  if (chavesOrfas.length === 0) console.log('   nenhuma');
  chavesOrfas.forEach((k) => console.log('   - "' + k + '" em ' + orfas[k] + ' membro(s)'));

  console.log(NL + 'b) Duplicatas por hifen/underscore (a normalizacao de CAIXA nao resolve):');
  const dups = Object.keys(duplicadasFrouxas);
  if (dups.length === 0) console.log('   nenhuma');
  dups.forEach((f) => console.log('   - ' + duplicadasFrouxas[f].join('  <->  ')));

  console.log(NL + 'c) Candidatos a fonte de verdade de "quantas sessoes o membro tem":');
  console.log('   1. deliverySteps do produto  -> desenho do programa, igual para todos');
  console.log('   2. mentoCoachSessionsLimit   -> existe SO para MentoCoach, editavel no admin');
  console.log('   3. cota "1-to-1"             -> moeda de agendamento, COMPARTILHADA entre');
  console.log('      MentoCoach e GDC e tambem gasta pelo botao avulso "Agendar 1 to 1"');
  console.log(NL + '   Nenhum campo hoje declara, por membro E por servico, o numero de');
  console.log('   paradas contratadas. Essa e a lacuna a decidir na Fase 0.');
}

main().then(() => process.exit(0)).catch((e) => {
  console.error('[report-quota-checkpoint-mismatch] falhou:', e);
  process.exit(1);
});
