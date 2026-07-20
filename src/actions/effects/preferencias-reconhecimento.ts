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
import { getAdminDb } from "@/lib/firebase-admin";
import { SurveyValue, SurveyMetadata } from "@/types/survey";
import { syncSurveyToUserDrive } from "@/lib/drive-sync";

/**
 * EFEITO: Preferências de Reconhecimento 💖
 * Linguagens de Apreciação: Afirmação, Serviço, Presentes, Tempo, Toque.
 */
export async function handlePreferenciasReconhecimentoEffect(
  responses: Record<string, SurveyValue>,
  matricula: string
) {
  const db = getAdminDb();
  console.log(`📡 [Effects:Reconhecimento] Processando resultados: ${matricula}`);
  
  let totalA = 0, totalB = 0, totalC = 0, totalD = 0, totalE = 0;
  const groups = ["grupo1", "grupo2", "grupo3", "grupo4", "grupo5"];
  
  groups.forEach(gId => {
    const resp = responses[gId];
    if (typeof resp === "string") {
       if (resp.startsWith("A.")) totalA += 1;
       if (resp.startsWith("B.")) totalB += 1;
       if (resp.startsWith("C.")) totalC += 1;
       if (resp.startsWith("D.")) totalD += 1;
       if (resp.startsWith("E.")) totalE += 1;
    } else if (typeof resp === "object" && resp !== null) {
       Object.entries(resp).forEach(([label, value]) => {
         const v = Number(value) || 0;
         if (label.startsWith("A.")) totalA += v;
         else if (label.startsWith("B.")) totalB += v;
         else if (label.startsWith("C.")) totalC += v;
         else if (label.startsWith("D.")) totalD += v;
         else if (label.startsWith("E.")) totalE += v;
       });
    }
  });

  const totalGeral = totalA + totalB + totalC + totalD + totalE;
  const getPct = (val: number) => totalGeral > 0 ? Math.round((val / totalGeral) * 100) : 0;

  const scores = {
    afirmacao: { total: totalA, percentage: getPct(totalA) },
    servico: { total: totalB, percentage: getPct(totalB) },
    presentes: { total: totalC, percentage: getPct(totalC) },
    tempo: { total: totalD, percentage: getPct(totalD) },
    toque: { total: totalE, percentage: getPct(totalE) },
    totalGeral
  };

  const metadata = (responses.metadata as SurveyMetadata) || {};

  // 2. Persistência no Firestore
  const resultRef = db.doc(`User/${matricula}/results/preferencias_reconhecimento`);
  await resultRef.set({
    surveyId: "preferencias_reconhecimento",
    matricula,
    scores,
    responses: Object.fromEntries(Object.entries(responses).filter(([k]) => k !== "metadata")),
    durationSeconds: metadata.durationSeconds || 0,
    isReleased: false,
    submittedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 3. Sincronização Drive
  try {
    await syncSurveyToUserDrive({
      matricula,
      surveyTitle: "Preferências de Reconhecimento",
      headers: ["Timestamp", "Matrícula", "Duração (s)", "% Afirmação", "% Serviço", "% Presentes", "% Tempo", "% Toque", "Análise"],
      rowData: [
        new Date().toLocaleString("pt-BR"),
        matricula,
        metadata.durationSeconds || 0,
        scores.afirmacao.percentage, scores.servico.percentage, scores.presentes.percentage, scores.tempo.percentage, scores.toque.percentage,
        String(responses.comunicacao_relacoes || "N/A")
      ]
    });
  } catch (driveErr) {
    console.error(`❌ [Effects:Reconhecimento] Erro na sincronização Drive:`, driveErr);
  }
}
