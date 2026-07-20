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
 * EFEITO: Preferências de Aprendizado (VACD) 🧠
 * Mapa de Representação: Visual, Auditivo, Cinestésico, Digital.
 */
export async function handlePreferenciasAprendizadoEffect(
  responses: Record<string, SurveyValue>,
  matricula: string
) {
  const db = getAdminDb();
  console.log(`📡 [Effects:Aprendizado] Processando resultados: ${matricula}`);
  
  // 1. Lógica de Cálculo
  let totalV = 0, totalA = 0, totalC = 0, totalD = 0;
  const getRanks = (qId: string) => (responses[qId] as Record<string, number>) || {};

  // Q1
  const r1 = getRanks("q1");
  totalC += r1["Minha intuição"] || 0;
  totalA += r1["O que me soa melhor"] || 0;
  totalV += r1["O que me parece melhor"] || 0;
  totalD += r1["Um estudo preciso e minucioso do assunto"] || 0;

  // Q2
  const r2 = getRanks("q2");
  totalA += r2["O tom de voz da outra pessoa"] || 0;
  totalV += r2["Se eu posso ou não ver o argumento da outra pessoa"] || 0;
  totalD += r2["A lógica do argumento da outra pessoa"] || 0;
  totalC += r2["Se eu entro em contato ou não com os sentimentos reais do outro"] || 0;

  // Q3
  const r3 = getRanks("q3");
  totalV += r3["No modo como me visto e aparento"] || 0;
  totalC += r3["Pelos sentimentos que compartilho"] || 0;
  totalD += r3["Pelas palavras que escolho"] || 0;
  totalA += r3["Pelo tom da minha voz"] || 0;

  // Q4
  const r4 = getRanks("q4");
  totalA += r4["Achar o volume e a sintonia ideais num sistema de som"] || 0;
  totalD += r4["Selecionar o ponto mais relevante relativo a um assunto interessante"] || 0;
  totalC += r4["Escolher os móveis mais confortáveis"] || 0;
  totalV += r4["Escolher as combinações de cores mais ricas e atraentes"] || 0;

  // Q5
  const r5 = getRanks("q5");
  totalA += r5["Se estou muito em sintonia com os sons do ambiente"] || 0;
  totalD += r5["Se sou muito capaz de raciocinar com fatos e dados novos"] || 0;
  totalC += r5["Eu sou muito senível à maneira como a roupa veste o meu corpo"] || 0;
  totalV += r5["Eu respondo fortemente às cores e à aparência de uma sala"] || 0;

  const pctV = totalV * 2;
  const pctA = totalA * 2;
  const pctC = totalC * 2;
  const pctD = totalD * 2;

  const metadata = (responses.metadata as SurveyMetadata) || {};

  // 2. Persistência no Firestore
  const resultRef = db.doc(`User/${matricula}/results/preferencias_aprendizado`);
  await resultRef.set({
    surveyId: "preferencias_aprendizado",
    matricula,
    scores: {
      visual: { total: totalV, percentage: pctV },
      auditivo: { total: totalA, percentage: pctA },
      cinestesico: { total: totalC, percentage: pctC },
      digital: { total: totalD, percentage: pctD }
    },
    responses: Object.fromEntries(Object.entries(responses).filter(([k]) => k !== "metadata")),
    durationSeconds: metadata.durationSeconds || 0,
    isReleased: false,
    submittedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 3. Sincronização Drive
  try {
    await syncSurveyToUserDrive({
      matricula,
      surveyTitle: "Preferências de Aprendizado",
      headers: ["Timestamp", "Matrícula", "Duração (s)", "% Visual", "% Auditivo", "% Cinestésico", "% Digital", "Análise de Hábitos"],
      rowData: [
        new Date().toLocaleString("pt-BR"),
        matricula,
        metadata.durationSeconds || 0,
        pctV, pctA, pctC, pctD,
        String(responses.habitos_aprendizagem || "N/A")
      ]
    });
  } catch (driveErr) {
    console.error(`❌ [Effects:Aprendizado] Erro na sincronização Drive:`, driveErr);
  }
}
