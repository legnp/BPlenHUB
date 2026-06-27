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
  console.log("Listing users and their quotas...");
  const usersSnap = await db.collection("User").get();
  for (const userDoc of usersSnap.docs) {
    const userData = userDoc.data();
    console.log(`\nUser: ${userDoc.id} | Email: ${userData.email || userData.User_Email} | Name: ${userData.name || userData.User_Name}`);
    
    // Check quotas
    const quotasSnap = await db.collection(`User/${userDoc.id}/User_Permissions`).doc("quotas").get();
    if (quotasSnap.exists) {
      console.log("Quotas:");
      const quotasData = quotasSnap.data();
      console.log(JSON.stringify(quotasData.quotas, null, 2));
    } else {
      console.log("No quotas document found.");
    }
  }
}

run().catch(console.error);
