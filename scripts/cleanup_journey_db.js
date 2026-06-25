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

const OFFICIAL_JOURNEY_SLUGS = {
    'onboarding': 1,
    'posicionamento-profissional': 2,
    'analise-comportamental': 3,
    'plano-de-carreira': 4,
    'gestao-e-desenvolvimento': 5,
    'mentocoach': 6,
    'offboarding': 7
};

async function cleanup() {
    console.log("--- STARTING JOURNEY DATABASE CLEANUP ---");
    const snapshot = await db.collection('products').where('isStepJourney', '==', true).get();
    console.log(`Found ${snapshot.size} products marked as journey steps.`);

    const batch = db.batch();
    let changes = 0;

    snapshot.docs.forEach(doc => {
        const p = doc.data();
        const slug = p.slug;

        if (!OFFICIAL_JOURNEY_SLUGS[slug]) {
            console.log(`[REMOVING FROM JOURNEY] ID: ${doc.id} | Title: ${p.title} | Reason: Not in official list`);
            batch.update(doc.ref, { isStepJourney: false });
            changes++;
        } else {
            const correctOrder = OFFICIAL_JOURNEY_SLUGS[slug];
            if (p.order !== correctOrder || p.status !== 'active') {
                console.log(`[FIXING JOURNEY STEP] ID: ${doc.id} | Title: ${p.title} | New Order: ${correctOrder} | Status: active`);
                batch.update(doc.ref, { 
                    order: correctOrder,
                    status: 'active'
                });
                changes++;
            }
        }
    });

    if (changes > 0) {
        await batch.commit();
        console.log(`--- CLEANUP FINISHED: ${changes} changes applied. ---`);
    } else {
        console.log("--- CLEANUP FINISHED: No changes needed. ---");
    }
}

cleanup().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
