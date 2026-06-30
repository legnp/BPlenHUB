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
  console.error("[ERRO] Variaveis de ambiente nao carregadas. Use --env-file=.env.local");
  process.exit(1);
}

const db = admin.firestore();
const ADMIN_EMAIL = "legnp@bplen.com";
const COLLECTIONS = ["User", "_AuthMap", "content_posts", "Events", "Networking", "Checkouts", "ServiceRequests"];

// Trava de seguranca: o Firestore conectado tem dados reais de usuarios.
// Este script so executa se a env var abaixo for definida explicitamente
// com o nome exato do projeto Firebase que se pretende limpar, na mesma
// chamada do comando. Isso evita execucao acidental (ex: rodar o arquivo
// errado, copiar e colar um comando antigo, autocompletar no terminal).
//
// Uso: CONFIRM_DB_RESET_PROJECT_ID=<project-id-exato> node scripts/db-reset.js
const confirmation = process.env.CONFIRM_DB_RESET_PROJECT_ID;

if (confirmation !== process.env.FIREBASE_PROJECT_ID) {
  console.error("[ABORTADO] Confirmacao de seguranca ausente ou incorreta.");
  console.error(`Projeto carregado: ${process.env.FIREBASE_PROJECT_ID || "(nao definido)"}`);
  console.error("Para executar de proposito, rode:");
  console.error(`  CONFIRM_DB_RESET_PROJECT_ID=${process.env.FIREBASE_PROJECT_ID || "<project-id>"} node scripts/db-reset.js`);
  process.exit(1);
}

async function runReset() {
  console.log("[RESET] Iniciando limpeza profunda...");

  try {
    for (const colName of COLLECTIONS) {
      console.log(`Analisando: ${colName}`);
      const colRef = db.collection(colName);
      const snapshot = await colRef.get();

      if (snapshot.empty) {
        console.log(`   Vazia.`);
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
      console.log(`${colName}: ${count} removidos, ${preserved} preservados.`);
    }
    console.log("\n[SUCESSO] Operacao finalizada.");
  } catch (err) {
    console.error("[ERRO] Falha no reset:", err);
  }
}

runReset();
