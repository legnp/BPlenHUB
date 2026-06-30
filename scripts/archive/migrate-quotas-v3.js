/**
 * BPlen HUB — Migration Script (Quotas V3) 🧬
 * Migra créditos da coleção flat 'Member_Quotas' para o caminho hierárquico 'User/{mat}/User_Permissions/quotas'.
 * Normaliza as chaves para o padrão '1-to-1'.
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Carregar variáveis de ambiente do .env.local manualmente para o script Node
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
            
            // Remover aspas de ambos os lados se existirem
            if (v.startsWith('"') && v.endsWith('"')) {
                v = v.slice(1, -1);
            } else if (v.startsWith("'") && v.endsWith("'")) {
                v = v.slice(1, -1);
            }
            
            // Processar sequências de escape (especialmente \n para o PEM)
            v = v.replace(/\\n/g, '\n');
            process.env[k] = v;
            
            // Suporte para chaves com prefixo NEXT_PUBLIC_ caso as principais faltem
            if (k.startsWith('NEXT_PUBLIC_') && !process.env[k.replace('NEXT_PUBLIC_', '')]) {
                process.env[k.replace('NEXT_PUBLIC_', '')] = v;
            }
        }
    });
}

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (admin.apps.length === 0) {
    try {
        if (!projectId) throw new Error("FIREBASE_PROJECT_ID Ausente");
        
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            })
        });
        console.log("🛡️ Firebase Admin inicializado com sucesso.");
    } catch (e) {
        console.warn("⚠️ Falha na inicialização explícita:", e.message);
        // Tentar inicialização padrão caso o ambiente já tenha ADC
        admin.initializeApp();
    }
}

const db = admin.firestore();

async function migrate() {
    console.log("🚀 Iniciando migração de cotas para V3...");
    
    const oldCollection = db.collection('Member_Quotas');
    const snapshot = await oldCollection.get();
    
    if (snapshot.empty) {
        console.log("ℹ️ Nenhuma cota encontrada na coleção antiga.");
        return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const doc of snapshot.docs) {
        const uid = doc.id;
        const data = doc.data();
        
        try {
            // 1. Resolver Matrícula
            const mapSnap = await db.collection('_AuthMap').doc(uid).get();
            if (!mapSnap.exists) {
                console.warn(`⚠️ [UID: ${uid}] Matrícula não encontrada no _AuthMap. Pulando...`);
                failCount++;
                continue;
            }

            const matricula = mapSnap.data().matricula;
            
            // 2. Preparar Novos Dados (Normalização)
            let quotas = data.quotas || {};
            if (quotas['mentoria_1to1']) {
                quotas['1-to-1'] = quotas['mentoria_1to1'];
                delete quotas['mentoria_1to1'];
            }

            // 3. Salvar no Novo Local
            const newPath = `User/${matricula}/User_Permissions/quotas`;
            await db.doc(newPath).set({
                uid: uid,
                quotas: quotas,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            console.log(`✅ [OK] Migrado: ${uid} -> ${matricula} no path: ${newPath}`);
            successCount++;

        } catch (err) {
            console.error(`❌ [ERRO] Falha ao migrar UID ${uid}:`, err.message);
            failCount++;
        }
    }

    console.log("\n--- Resumo da Migração ---");
    console.log(`Sucessos: ${successCount}`);
    console.log(`Falhas: ${failCount}`);
    console.log("--------------------------");
}

migrate()
    .then(() => {
        console.log("✨ Processo concluído.");
        process.exit(0);
    })
    .catch(err => {
        console.error("💥 Erro crítico no script:", err);
        process.exit(1);
    });
