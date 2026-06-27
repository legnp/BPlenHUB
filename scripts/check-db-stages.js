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
  console.log("Fetching journey products from DB...");
  const snap = await db.collection("products").where("isStepJourney", "==", true).get();
  console.log(`Found ${snap.size} journey products.`);
  snap.forEach(doc => {
    const d = doc.data();
    console.log(`- Product Doc ID: ${doc.id} | slug: ${d.slug} | title: ${d.title} | order: ${d.order}`);
  });

  console.log("\nFetching User BP-002-PF-260331 Journey Progress...");
  const progressDoc = await db.collection("User/BP-002-PF-260331/User_Journey").doc("progress").get();
  if (progressDoc.exists) {
    const data = progressDoc.data();
    console.log(`lastActiveStepId: ${data.lastActiveStepId}`);
    console.log("Steps in Progress:");
    Object.keys(data.steps || {}).forEach(k => {
      console.log(`- ${k}: status = ${data.steps[k].status}`);
    });
  } else {
    console.log("No progress doc found.");
  }
}

run().catch(console.error);
