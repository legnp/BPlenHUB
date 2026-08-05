// Handlers de efeito colateral de survey — modulo de servidor, NAO server actions.
//
// Ate o lote 5 do BUG-103 este arquivo era `"use server"`, o que tornava cada
// handler exportado um ENDPOINT DE REDE: qualquer requisicao nao autenticada
// podia dispara-lo passando a matricula de outra pessoa, gravando resultado de
// survey e progredindo jornada na conta dela.
//
// O unico chamador de cada handler e o dispatcher `lib/survey/effects.ts`, que
// roda depois de `submitSurvey` ja ter resolvido a identidade pela sessao.
// Sem `"use server"` nao ha porta na rede — e a correcao e remover a porta, nao
// trancar a sala (Protocolo item 8).

import * as admin from "firebase-admin";
import { getAdminDb, getAdminAuth } from "@/lib/firebase-admin";
import { SurveyValue } from "@/types/survey";
import { syncSurveyToUserDrive } from "@/lib/drive-sync";
import { registerReferralFromOrigin } from "@/lib/partners/referrals";

/**
 * EFEITO: Welcome Survey (Onboarding) 🧬
 * Processa a criação de perfil, JourneyMap e sincronização Drive.
 */
export async function handleWelcomeSurveyEffect(
  responses: Record<string, SurveyValue>,
  matricula: string,
  userUid: string
) {
  const db = getAdminDb();
  console.log(`📡 [Effects:Welcome] Processando onboarding: ${matricula}`);

  const userRef = db.doc(`User/${matricula}`);
  const nickname = (responses.nickname as string) || "";
  const userTypeRaw = (responses.userType as string) || "member";
  // Classificacao PF/PJ. A opcao de PARCERIA nao e' nem uma nem outra por si so — quem
  // busca a BPlen para uma parceria pode atuar como pessoa fisica ou por empresa, e
  // isso e' perguntado no cadastro da parceria (`partner_dados_cadastrais`). Sem este
  // ramo, a opcao cairia silenciosamente em "PF" (risco apontado no plano, secao 8).
  const isPartnershipIntent = userTypeRaw.toLowerCase().includes("parceria");
  const userType = userTypeRaw.includes("empresa") || userTypeRaw.includes("PJ") ? "PJ" : "PF";

  // 1. Sincronizar Identidade (Auth -> Root Profile) 🛡️
  let authName = "Membro BPlen";
  let authEmail = "";
  try {
    const authAdmin = getAdminAuth();
    const userAuth = await authAdmin.getUser(userUid);
    authName = userAuth.displayName || userAuth.email?.split("@")[0] || authName;
    authEmail = userAuth.email || "";
  } catch (authErr) {
    console.warn("⚠️ [Effects:Welcome] Falha ao buscar metadados do Auth:", authErr);
  }

  await userRef.set({
    hasCompletedWelcome: true,
    Authentication_Name: authName,
    email: authEmail,
    User_Nickname: nickname || null,
    User_Type: userType,
    // Intencao declarada na recepcao. Nao concede nada — o selo de parceiro continua
    // sendo concessao do Admin; isto so registra que a pessoa chegou por esse caminho.
    ...(isPartnershipIntent ? { User_PartnershipIntent: true } : {}),
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // 1b. Indicacao: se a origem escolhida for o nome de um parceiro do diretorio, a
  // indicacao e' registrada sob ele. Qualquer outra origem (Instagram, LinkedIn,
  // "Indicacao" generica) segue exatamente como antes — nada muda.
  try {
    await registerReferralFromOrigin({
      origin: String(responses.origin || ""),
      referredMatricula: matricula,
      referredNome: nickname || authName,
      cpfHash: null,
    });
  } catch (referralErr) {
    // Efeito colateral do onboarding: uma falha aqui nunca pode derrubar a entrada do
    // cliente no hub.
    console.error("[Effects:Welcome] Falha ao registrar indicacao de parceria:", referralErr);
  }

  // 2. Sincronização Google Drive (via lib/drive-sync) 🛰️
  try {
    const headers = ["Timestamp", "Matrícula", "UID", "Nickname", "Interesses", "Origem"];
    const rowData = [
      new Date().toLocaleString("pt-BR"),
      matricula,
      userUid,
      nickname,
      Array.isArray(responses.topics) 
        ? responses.topics.map(t => (t === "Outros" && responses.topics_other) ? `Outros: ${responses.topics_other}` : t).join(", ") 
        : String(responses.topics || ""),
      responses.origin_other ? `${responses.origin} (${responses.origin_other})` : String(responses.origin || "N/A")
    ];

    await syncSurveyToUserDrive({
      matricula,
      surveyTitle: "User_Welcome",
      headers,
      rowData
    });
  } catch (driveErr) {
    console.error(`❌ [Effects:Welcome] Erro na Sincronização Drive:`, driveErr);
  }

  // 3. User_JourneyMap (mapa de jornada LEGADO) deixou de ser escrito aqui.
  // O sistema de jornada canonico e o v3 (User/{matricula}/User_Journey/progress),
  // criado/atualizado por journey.ts (lazy-write no 1o acesso). Os dados de captacao
  // do onboarding NAO se perdem: userType/nickname ficam em User_Type/User_Nickname
  // no doc do User, e origin/demand(reason)/topics(interests) ficam na resposta crua
  // do survey (User/{matricula}/Surveys/welcome_survey.data). Consolidacao: BUG-018
  // (migracao/remocao do User_JourneyMap legado dos clientes antigos = Acao 2).
}
