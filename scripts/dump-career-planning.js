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

async function run() {
  const matricula = "BP-005-PF-260523";
  
  const feedbacksSnap = await db.collection(`User/${matricula}/Feedbacks`).get();
  console.log(`Feedbacks (${feedbacksSnap.size}):`);
  feedbacksSnap.forEach(doc => {
    console.log(`- ID: ${doc.id}`);
    console.log(JSON.stringify(doc.data(), null, 2));
  });

  const atasSnap = await db.collection(`User/${matricula}/Atas`).get();
  console.log(`\nAtas (${atasSnap.size}):`);
  atasSnap.forEach(doc => {
    console.log(`- ID: ${doc.id}`);
    console.log(JSON.stringify(doc.data(), null, 2));
  });

  const docsSnap = await db.collection(`User/${matricula}/Shared_Documents`).get();
  console.log(`\nShared Documents (${docsSnap.size}):`);
  docsSnap.forEach(doc => {
    console.log(`- ID: ${doc.id}`);
    console.log(JSON.stringify(doc.data(), null, 2));
  });
}

run().catch(console.error);
