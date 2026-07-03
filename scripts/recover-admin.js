/**
 * BPlen HUB - Recuperacao de Conta Admin (execucao LOCAL apenas)
 *
 * Substitui a antiga rota publica /api/admin/recover (removida por conceder
 * admin sem autenticacao - risco de escalacao de privilegio, BUG-003). Este
 * script faz a mesma recuperacao, mas exige credenciais de service account
 * (FIREBASE_*) e roda na maquina do operador, nunca exposto na internet.
 *
 * Uso:
 *   node scripts/recover-admin.js <email> ["Nome de exibicao"]
 *
 * Exemplo:
 *   node scripts/recover-admin.js lisandra.lencina@bplen.com "Lisandra (Admin)"
 *
 * Requer em .env.local: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL,
 * FIREBASE_PRIVATE_KEY. O usuario alvo precisa ter feito login pelo menos uma
 * vez (para existir no Firebase Auth).
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

const auth = admin.auth();
const db = admin.firestore();

async function run() {
  const email = process.argv[2];
  const displayName = process.argv[3] || 'Admin';

  if (!email) {
    console.error('Erro: informe o email. Uso: node scripts/recover-admin.js <email> ["Nome"]');
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase();

  // 1. Buscar o UID no Firebase Auth
  let uid = '';
  try {
    const userRecord = await auth.getUserByEmail(normalizedEmail);
    uid = userRecord.uid;
  } catch (err) {
    console.error(`Usuario com email ${normalizedEmail} nao encontrado no Firebase Auth. Faca login pelo menos uma vez.`);
    process.exit(1);
  }

  // Usa o proprio email como matricula (mesmo comportamento da rota antiga)
  const matricula = normalizedEmail;
  const batch = db.batch();

  // 2. _AuthMap
  const authMapRef = db.collection('_AuthMap').doc(uid);
  batch.set(authMapRef, {
    matricula,
    email: normalizedEmail,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    recoveredBySystem: true
  }, { merge: true });

  // 3. Documento User
  const userRef = db.collection('User').doc(matricula);
  batch.set(userRef, {
    email: normalizedEmail,
    User_Email: normalizedEmail,
    Authentication_Email: normalizedEmail,
    User_Nickname: displayName,
    onboardStatus: 'completed',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // 4. Permissoes soberanas na subcolecao
  const permRef = userRef.collection('User_Permissions').doc('access');
  batch.set(permRef, {
    admin: true,
    role: 'admin',
    services: { member_area_access: true },
    grantedAt: admin.firestore.FieldValue.serverTimestamp(),
    grantedReason: 'LOCAL_EMERGENCY_RECOVERY'
  }, { merge: true });

  await batch.commit();

  console.log(`Conta ${normalizedEmail} recuperada com sucesso (uid ${uid}). Acesso admin restaurado.`);
}

run().catch(err => {
  console.error('Falha na recuperacao:', err);
  process.exit(1);
});
