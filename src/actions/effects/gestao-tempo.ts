"use server";

import * as admin from "firebase-admin";
import { getAdminDb } from "@/lib/firebase-admin";
import { SurveyValue, SurveyMetadata } from "@/types/survey";
import { syncSurveyToUserDrive } from "@/lib/drive-sync";

/**
 * EFEITO: Gestão do Tempo (Tríade) ⏳
 * Calcula a porcentagem de Urgência, Importância e Circunstância.
 */
export async function handleGestaoTempoEffect(
  responses: Record<string, SurveyValue>,
  matricula: string
) {
  const db = getAdminDb();
  console.log(`📡 [Effects:GestaoTempo] Processando resultados: ${matricula}`);

  // 1. Cálculo da Tríade
  const getVal = (id: string) => Number(responses[id] || 0);
  
  const totalCircunstancia = getVal("q1") + getVal("q3") + getVal("q6") + getVal("q9") + getVal("q12") + getVal("q15");
  const totalImportancia = getVal("q4") + getVal("q7") + getVal("q10") + getVal("q11") + getVal("q14") + getVal("q17");
  const totalUrgencia = getVal("q2") + getVal("q5") + getVal("q8") + getVal("q13") + getVal("q16") + getVal("q18");
  
  const totalGeral = totalCircunstancia + totalImportancia + totalUrgencia;
  
  const pctImportancia = totalGeral > 0 ? Math.round((totalImportancia / totalGeral) * 100) : 0;
  const pctUrgencia = totalGeral > 0 ? Math.round((totalUrgencia / totalGeral) * 100) : 0;
  const pctCircunstancia = totalGeral > 0 ? Math.round((totalCircunstancia / totalGeral) * 100) : 0;

  const metadata = (responses.metadata as SurveyMetadata) || {};

  // 2. Persistência no Firestore
  const resultRef = db.doc(`User/${matricula}/results/gestao_tempo`);
  await resultRef.set({
    surveyId: "gestao_tempo",
    matricula,
    scores: {
      importancia: { total: totalImportancia, percentage: pctImportancia },
      urgencia: { total: totalUrgencia, percentage: pctUrgencia },
      circunstancia: { total: totalCircunstancia, percentage: pctCircunstancia },
      totalGeral
    },
    responses: Object.fromEntries(Object.entries(responses).filter(([k]) => k !== "metadata")),
    durationSeconds: metadata.durationSeconds || 0,
    isReleased: false, 
    submittedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 3. Sincronização Google Sheets
  try {
    await syncSurveyToUserDrive({
      matricula,
      surveyTitle: "Gestão do Tempo",
      headers: [
        "Timestamp", "Matrícula", "Duração (s)", 
        "Total Importância", "% Importância", 
        "Total Urgência", "% Urgência", 
        "Total Circunstância", "% Circunstância",
        "Análise Final"
      ],
      rowData: [
        new Date().toLocaleString("pt-BR"),
        matricula,
        metadata.durationSeconds || 0,
        totalImportancia, pctImportancia,
        totalUrgencia, pctUrgencia,
        totalCircunstancia, pctCircunstancia,
        String(responses.auto_avaliacao || "N/A")
      ]
    });
  } catch (driveErr) {
    console.error(`❌ [Effects:GestaoTempo] Erro na sincronização Drive:`, driveErr);
  }
}
