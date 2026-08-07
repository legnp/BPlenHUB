/**
 * Limpeza de dados dos instrumentos descontinuados `showroom_interest` (form) e
 * `revisao_curriculo` (survey), removidos do codigo em 07/08/2026.
 *
 * Sem essa limpeza os registros ficam orfaos: o admin resolve titulo e preview
 * pelo registro (`FORMS_REGISTRY`/`getSurveyConfig`), que nao conhece mais esses
 * ids, e um checkpoint atribuido continua contando para o total da etapa sem
 * nunca conseguir renderizar o motor — a etapa trava sem caminho de conclusao.
 *
 * Varre quatro frentes:
 *   1. `products`                                 — deliverySteps[] e capabilities.{surveys,forms}
 *   2. `User/{matricula}/Surveys/{doc}`           — respostas gravadas
 *   3. `User/{matricula}/Forms/{doc}`             — respostas gravadas
 *   4. `User/{matricula}/User_Journey/{progress,partner_progress}`
 *                                                 — dynamicSubSteps, completedSubSteps
 *                                                   e subStepCompletionDates
 *
 * Uso:
 *   node scripts/cleanup-instrumentos-removidos.js            (dry-run: so relata)
 *   node scripts/cleanup-instrumentos-removidos.js --apply    (executa a remocao)
 *
 * Nao toca em copias no acervo do usuario (planilhas geradas por
 * `syncSurveyToUserDrive`): apagar arquivo de acervo e irreversivel e exige
 * decisao separada.
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

const APLICAR = process.argv.includes('--apply');

const SURVEYS_ALVO = new Set(['revisao_curriculo']);
const FORMS_ALVO = new Set(['showroom_interest']);
const REFERENCIAS_ALVO = new Set([...SURVEYS_ALVO, ...FORMS_ALVO]);

const DOCS_PROGRESSO = ['progress', 'partner_progress'];

/**
 * Ids de sub-passo que o app gera para esses instrumentos. Os do modo dinamico
 * (`deliverySteps[].id`) sao coletados da propria base durante a varredura dos
 * produtos, porque vem do parser do portfolio e nao de uma formula.
 */
const idsDeSubPassoAlvo = new Set([
  'ss-srv-revisao_curriculo',
  'ss-frm-showroom_interest'
]);

const relatorio = {
  produtos: [],
  respostasSurvey: [],
  respostasForm: [],
  progresso: []
};

/** Varre `products`, tirando os alvos de deliverySteps[] e capabilities. */
async function varrerProdutos() {
  const snap = await db.collection('products').get();

  for (const doc of snap.docs) {
    const data = doc.data() || {};
    const mudancas = {};
    const detalhes = [];

    const deliverySteps = Array.isArray(data.deliverySteps) ? data.deliverySteps : null;
    if (deliverySteps) {
      const mantidos = deliverySteps.filter(step => {
        const alvo = REFERENCIAS_ALVO.has(step?.referenceId);
        if (alvo) {
          // O id vem do dado; e por ele que a conclusao foi gravada no progresso.
          if (step?.id) idsDeSubPassoAlvo.add(step.id);
          detalhes.push(`deliveryStep "${step.title || step.referenceId}" (${step.referenceId})`);
        }
        return !alvo;
      });
      if (mantidos.length !== deliverySteps.length) mudancas.deliverySteps = mantidos;
    }

    const capSurveys = data.capabilities?.surveys;
    if (Array.isArray(capSurveys)) {
      const mantidas = capSurveys.filter(id => !SURVEYS_ALVO.has(id));
      if (mantidas.length !== capSurveys.length) {
        mudancas['capabilities.surveys'] = mantidas;
        detalhes.push(`capabilities.surveys`);
      }
    }

    const capForms = data.capabilities?.forms;
    if (Array.isArray(capForms)) {
      const mantidos = capForms.filter(id => !FORMS_ALVO.has(id));
      if (mantidos.length !== capForms.length) {
        mudancas['capabilities.forms'] = mantidos;
        detalhes.push(`capabilities.forms`);
      }
    }

    if (Object.keys(mudancas).length === 0) continue;

    relatorio.produtos.push({ id: doc.id, titulo: data.title || doc.id, detalhes });
    if (APLICAR) await doc.ref.update(mudancas);
  }
}

/** Apaga as respostas gravadas em `User/{matricula}/{Surveys,Forms}`. */
async function varrerRespostas() {
  const alvos = [
    { colecao: 'Surveys', campo: 'surveyId', ids: SURVEYS_ALVO, destino: relatorio.respostasSurvey },
    { colecao: 'Forms', campo: 'formId', ids: FORMS_ALVO, destino: relatorio.respostasForm }
  ];

  for (const { colecao, campo, ids, destino } of alvos) {
    // Sem `where`: filtrar por campo num collection group exigiria um indice de
    // excecao so para esta limpeza. A base inteira de respostas ja e varrida do
    // mesmo jeito pelo snapshot diario de metricas, entao o custo e conhecido.
    const snap = await db.collectionGroup(colecao).get();

    for (const doc of snap.docs) {
      const instrumento = doc.data()?.[campo];
      if (!ids.has(instrumento)) continue;

      // .../User/{matricula}/{colecao}/{docId}
      const matricula = doc.ref.parent.parent?.id || '(desconhecida)';
      destino.push({ matricula, docId: doc.id, instrumento, status: doc.data()?.status });
      if (APLICAR) await doc.ref.delete();
    }
  }
}

/**
 * Limpa o progresso de jornada. Roda DEPOIS dos produtos, porque a varredura de
 * produtos e quem descobre os ids de sub-passo do modo dinamico.
 */
async function varrerProgresso() {
  const usersSnap = await db.collection('User').get();

  for (const userDoc of usersSnap.docs) {
    const matricula = userDoc.id;

    for (const nomeDoc of DOCS_PROGRESSO) {
      const ref = db
        .collection('User')
        .doc(matricula)
        .collection('User_Journey')
        .doc(nomeDoc);

      const progressDoc = await ref.get();
      if (!progressDoc.exists) continue;

      const data = progressDoc.data() || {};
      const steps = data.steps || {};
      const stepsAtualizados = JSON.parse(JSON.stringify(steps));
      const detalhes = [];

      for (const [stepId, progresso] of Object.entries(stepsAtualizados)) {
        if (!progresso || typeof progresso !== 'object') continue;

        // Os sub-passos dinamicos carregam o referenceId no proprio documento.
        const dinamicos = Array.isArray(progresso.dynamicSubSteps) ? progresso.dynamicSubSteps : [];
        const dinamicosMantidos = dinamicos.filter(ds => {
          const alvo = REFERENCIAS_ALVO.has(ds?.referenceId);
          if (alvo && ds?.id) idsDeSubPassoAlvo.add(ds.id);
          return !alvo;
        });
        if (dinamicosMantidos.length !== dinamicos.length) {
          progresso.dynamicSubSteps = dinamicosMantidos;
          detalhes.push(`${stepId}: ${dinamicos.length - dinamicosMantidos.length} sub-passo(s) dinamico(s)`);
        }

        const concluidos = Array.isArray(progresso.completedSubSteps) ? progresso.completedSubSteps : [];
        const concluidosMantidos = concluidos.filter(id => !idsDeSubPassoAlvo.has(id));
        if (concluidosMantidos.length !== concluidos.length) {
          progresso.completedSubSteps = concluidosMantidos;
          detalhes.push(`${stepId}: ${concluidos.length - concluidosMantidos.length} conclusao(oes) (status atual "${progresso.status}")`);
        }

        const datas = progresso.subStepCompletionDates;
        if (datas && typeof datas === 'object') {
          const chavesAlvo = Object.keys(datas).filter(k => idsDeSubPassoAlvo.has(k));
          if (chavesAlvo.length > 0) {
            chavesAlvo.forEach(k => delete datas[k]);
            detalhes.push(`${stepId}: ${chavesAlvo.length} data(s) de conclusao`);
          }
        }
      }

      if (detalhes.length === 0) continue;

      relatorio.progresso.push({ matricula, documento: nomeDoc, detalhes });
      if (APLICAR) await ref.update({ steps: stepsAtualizados });
    }
  }
}

function imprimirSecao(titulo, linhas) {
  console.log(`\n--- ${titulo} ---`);
  if (linhas.length === 0) {
    console.log('  nada encontrado');
    return;
  }
  linhas.forEach(l => console.log(`  ${l}`));
}

async function run() {
  console.log(`\n=== Limpeza de instrumentos descontinuados ===`);
  console.log(`Modo: ${APLICAR ? 'APLICAR (grava no banco)' : 'DRY-RUN (nao grava nada)'}`);
  console.log(`Alvos: survey "revisao_curriculo", form "showroom_interest"`);

  await varrerProdutos();
  await varrerRespostas();
  await varrerProgresso();

  imprimirSecao(
    'products',
    relatorio.produtos.map(p => `${p.id} (${p.titulo}) -> ${p.detalhes.join(', ')}`)
  );
  imprimirSecao(
    'respostas de survey',
    relatorio.respostasSurvey.map(r => `${r.matricula} | doc=${r.docId} | ${r.instrumento} | status=${r.status}`)
  );
  imprimirSecao(
    'respostas de formulario',
    relatorio.respostasForm.map(r => `${r.matricula} | doc=${r.docId} | ${r.instrumento} | status=${r.status}`)
  );
  imprimirSecao(
    'progresso de jornada',
    relatorio.progresso.flatMap(p => [`${p.matricula} | ${p.documento}`, ...p.detalhes.map(d => `    ${d}`)])
  );

  const total =
    relatorio.produtos.length +
    relatorio.respostasSurvey.length +
    relatorio.respostasForm.length +
    relatorio.progresso.length;

  console.log(`\nTotal de documentos afetados: ${total}`);
  if (!APLICAR && total > 0) {
    console.log('Rode novamente com --apply para efetivar.');
  }
  console.log('');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Falha na limpeza:', err);
    process.exit(1);
  });
