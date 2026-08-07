/**
 * T-06 / Onda 3C — auditoria de entradas vazias em `completedSubSteps`.
 *
 * `updateJourneySubStepAction` grava o identificador do sub-passo sem validar.
 * Se o cliente chamar com string vazia, o servidor empurra "" para a lista de
 * concluidos e cria uma data de conclusao para essa chave. Pior: o status da
 * etapa e' decidido contando o tamanho dessa lista
 * (`newCompleted.length >= totalSubsteps`), entao uma entrada invalida INFLA a
 * contagem e pode marcar a etapa como concluida antes da hora.
 *
 * Este script so LE. Nao altera nada. Serve para dimensionar se a janela de
 * corrida descrita no T-06 ja se materializou em producao.
 *
 * Uso: node scripts/audit-empty-substeps.js
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

// Os dois documentos de progresso possiveis (membro e parceiro).
const DOCS_PROGRESSO = ['progress', 'partner_progress'];

const ehVazio = (id) => typeof id !== 'string' || id.trim() === '';

async function run() {
  const usersSnap = await db.collection('User').get();

  let usuariosLidos = 0;
  let documentosLidos = 0;
  let etapasComEntradaVazia = 0;
  const ocorrencias = [];

  for (const doc of usersSnap.docs) {
    const matricula = doc.id;
    usuariosLidos++;

    for (const nomeDoc of DOCS_PROGRESSO) {
      const progressDoc = await db
        .collection('User')
        .doc(matricula)
        .collection('User_Journey')
        .doc(nomeDoc)
        .get();

      if (!progressDoc.exists) continue;
      documentosLidos++;

      const data = progressDoc.data() || {};
      const steps = data.steps || {};

      for (const [stepId, stepProgress] of Object.entries(steps)) {
        const concluidos = stepProgress?.completedSubSteps || [];
        const vazios = concluidos.filter(ehVazio);

        const datas = stepProgress?.subStepCompletionDates || {};
        const chavesVaziasNasDatas = Object.keys(datas).filter(ehVazio);

        if (vazios.length > 0 || chavesVaziasNasDatas.length > 0) {
          etapasComEntradaVazia++;
          ocorrencias.push({
            matricula,
            documento: nomeDoc,
            stepId,
            status: stepProgress?.status,
            totalConcluidos: concluidos.length,
            entradasVazias: vazios.length,
            chavesVaziasNasDatas: chavesVaziasNasDatas.length
          });
        }
      }
    }
  }

  console.log('\n=== AUDITORIA: entradas vazias em completedSubSteps ===\n');
  console.log(`Usuarios lidos.................: ${usuariosLidos}`);
  console.log(`Documentos de progresso lidos..: ${documentosLidos}`);
  console.log(`Etapas com entrada vazia.......: ${etapasComEntradaVazia}`);

  if (ocorrencias.length === 0) {
    console.log('\nNenhuma entrada vazia encontrada.');
    console.log('A janela de corrida descrita no T-06 nao se materializou ate agora.');
  } else {
    console.log('\n--- Ocorrencias ---');
    for (const o of ocorrencias) {
      console.log(
        `${o.matricula} | ${o.documento} | etapa=${o.stepId} | status=${o.status} | ` +
        `concluidos=${o.totalConcluidos} (vazios=${o.entradasVazias}) | ` +
        `datas com chave vazia=${o.chavesVaziasNasDatas}`
      );
    }
    console.log(
      '\nAtencao: cada entrada vazia INFLA a contagem que decide se a etapa esta ' +
      'concluida. Etapas com status "completed" e entrada vazia merecem conferencia.'
    );
  }

  console.log('');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Falha na auditoria:', err);
    process.exit(1);
  });
