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
  const usersSnap = await db.collection("User").get();
  for (const doc of usersSnap.docs) {
    const matricula = doc.id;
    const progressDoc = await db.collection("User").doc(matricula).collection("User_Journey").doc("progress").get();
    if (progressDoc.exists) {
      console.log(`\nFound Progress for Matricula: ${matricula}`);
      const data = progressDoc.data();
      console.log("Steps:");
      Object.keys(data.steps || {}).forEach(k => {
        console.log(`- ${k}: status=${data.steps[k].status}, completedSubSteps=${JSON.stringify(data.steps[k].completedSubSteps)}`);
      });
    } else {
      console.log(`Matricula: ${matricula} -> No progress doc.`);
    }
  }
}

run().catch(console.error);
