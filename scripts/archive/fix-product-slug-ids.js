/**
 * BPlen HUB — Fix Product IDs Script 🧬
 * Corrige produtos criados com IDs aleatórios, migrando-os para ID = Slug.
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Carregar variáveis de ambiente do .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const index = trimmed.indexOf('=');
        if (index > 0) {
            const k = trimmed.substring(0, index).trim();
            let v = trimmed.substring(index + 1).trim();
            if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
            if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
            v = v.replace(/\\n/g, '\n');
            process.env[k] = v;
        }
    });
}

if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY,
        })
    });
}

const db = admin.firestore();

async function fixIds() {
    console.log("🔍 Buscando produtos com IDs não-padronizados...");
    const snapshot = await db.collection('products').get();
    
    for (const doc of snapshot.docs) {
        const data = doc.data();
        const currentId = doc.id;
        const slug = data.slug;

        // Se o ID for diferente do slug e o slug existir...
        if (slug && currentId !== slug) {
            console.log(`🚀 Migrando [${data.title}] de ID "${currentId}" para "${slug}"...`);
            
            // 1. Criar novo documento com o ID correto
            await db.collection('products').doc(slug).set({
                ...data,
                id: slug,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // 2. Deletar documento antigo
            await db.collection('products').doc(currentId).delete();
            
            console.log(`✅ Sucesso! [${slug}] agora é o ID oficial.`);
        } else {
            console.log(`- Produto [${data.title}] já está ok com ID: ${currentId}`);
        }
    }
}

fixIds().then(() => {
    console.log("✨ Processo concluído.");
    process.exit(0);
}).catch(err => {
    console.error("💥 Erro:", err.message);
    process.exit(1);
});
