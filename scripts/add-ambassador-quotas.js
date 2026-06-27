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

async function addQuotas(matricula) {
  const docPath = `User/${matricula}/User_Permissions/quotas`;
  const walletRef = db.doc(docPath);
  
  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(walletRef);
    const now = new Date().toISOString();
    let currentQuotas = {};

    if (doc.exists) {
      currentQuotas = doc.data().quotas || {};
    }

    // Grant or overwrite Gestao e Desenvolvimento and Mentocoach
    currentQuotas["GESTAO-E-DESENVOLVIMENTO"] = {
      total: 1,
      used: currentQuotas["GESTAO-E-DESENVOLVIMENTO"]?.used || 0,
      lastUpdated: now
    };

    currentQuotas["MENTOCOACH"] = {
      total: 1,
      used: currentQuotas["MENTOCOACH"]?.used || 0,
      lastUpdated: now
    };

    transaction.set(walletRef, {
      quotas: currentQuotas,
      updatedAt: now
    }, { merge: true });
  });

  console.log(`Successfully updated quotas for ${matricula}`);
}

async function run() {
  await addQuotas("BP-002-PF-260331"); // legnp@bplen.com
  await addQuotas("BP-005-PF-260523"); // lisandra.lencina@gmail.com
}

run().catch(console.error);
