const admin = require('firebase-admin');
const fs = require('fs');

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

async function check() {
    const doc = await db.collection('User').doc('BP-005-PF-260523').collection('User_Permissions').doc('quotas').get();
    if (doc.exists) {
        console.log('Quotas doc data:', JSON.stringify(doc.data(), null, 2));
    } else {
        console.log('Quotas doc does not exist.');
    }
}

check().then(() => process.exit(0));
