const admin = require("firebase-admin");

/**
 * BPlen HUB — Reset Script (Versão Nativa)
 * Executado com o suporte nativo do Node.js para .env
 *
 * ATENCAO: este script apaga TODOS os documentos das colecoes User, _AuthMap,
 * content_posts, Events, Networking, Checkouts e ServiceRequests, preservando
 * apenas os registros do e-mail/CNPJ mestre. Conecta com as credenciais ativas
 * do .env.local no momento da execucao. NAO executar sem confirmacao explicita
 * do project owner e sem verificar manualmente qual projeto Firebase esta
 * carregado em FIREBASE_PROJECT_ID.
 */

// O replace de \n é o padrão da indústria para carregar chaves privadas de variáveis de ambiente
const privateKey = process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : null;

if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
} else if (!process.env.FIREBASE_PROJECT_ID) {
  console.error("❌ Erro: Variáveis de ambiente não carregadas. Use --env-file=.env.local");
  process.exit(1);
}

const db = admin.firestore();
const ADMIN_EMAIL = "legnp@bplen.com";
const COLLECTIONS = ["User", "_AuthMap", "content_posts", "Events", "Networking", "Checkouts", "ServiceRequests"];

async function runReset() {
  console.log("🚀 [NATIVE-RESET] Iniciando limpeza profunda...");
  
  try {
    for (const colName of COLLECTIONS) {
      console.log(`🧹 Analisando: ${colName}`);
      const colRef = db.collection(colName);
      const snapshot = await colRef.get();

      if (snapshot.empty) {
        console.log(`   ℹ️ Vazia.`);
        continue;
      }

      const batch = db.batch();
      let count = 0;
      let preserved = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const isMaster = 
          data.Authentication_Email === ADMIN_EMAIL || 
          data.email === ADMIN_EMAIL || 
          data.User_Email === ADMIN_EMAIL ||
          doc.id === ADMIN_EMAIL ||
          doc.id === "62.857.668/0001-07";

        if (!isMaster) {
          batch.delete(doc.ref);
          count++;
        } else {
          preserved++;
        }
      });

      if (count > 0) {
        await batch.commit();
      }
      console.log(`✅ ${colName}: ${count} removidos, ${preserved} preservados.`);
    }
    console.log("\n🏁 [SUCESSO] Operação finalizada.");
  } catch (err) {
    console.error("❌ Erro no reset:", err);
  }
}

runReset();
