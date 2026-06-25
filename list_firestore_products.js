const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync('.env.local', 'utf8');
envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.substring(1, value.length - 1);
        process.env[match[1]] = value.replace(/\\n/g, '\n');
    }
});

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

async function checkAll() {
    const snapshot = await db.collection('products').where('isStepJourney', '==', true).get();
    console.log(`Total journey products: ${snapshot.size}`);
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`ID: ${doc.id} | Order: ${data.order} | Title: ${data.title} | Status: ${data.status}`);
    });
}

checkAll().then(() => process.exit(0));
