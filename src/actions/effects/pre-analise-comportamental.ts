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
 * EFEITO: Pré-Análise Comportamental 🧬
 * Coleta traços iniciais e visões de mundo.
 */
export async function handlePreAnaliseComportamentalEffect(
  responses: Record<string, SurveyValue>,
  matricula: string
) {
  const db = getAdminDb();
  console.log(`📡 [Effects:PreAnalise] Processando resultados: ${matricula}`);
  
  const metadata = (responses.metadata as SurveyMetadata) || {};

  // 1. Persistência no Firestore
  const resultRef = db.doc(`User/${matricula}/results/pre_analise_comportamental`);
  await resultRef.set({
    surveyId: "pre_analise_comportamental",
    matricula,
    responses: Object.fromEntries(Object.entries(responses).filter(([k]) => k !== "metadata")),
    durationSeconds: metadata.durationSeconds || 0,
    isReleased: false,
    submittedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 2. Sincronização Google Sheets
  try {
    const resAfirmacoes = (responses.afirmacoes as Record<string, number>) || {};

    await syncSurveyToUserDrive({
      matricula,
      surveyTitle: "Pré-Análise Comportamental",
      headers: [
        "Timestamp", "Matrícula", "Duração (s)", 
        "Traços Selecionados",
        "Vida: Destino/Sorte", "Vida: Caráter/Destino", "Vida: Confia Opiniões", "Vida: Vive como quer",
        "Conflito", "Conflito (Outro)",
        "Frases Guia", "Referência Humana", "Foco Temporal", "Autodescrição", "Qualidades Admiradas", "Palavra Resumo"
      ],
      rowData: [
        new Date().toLocaleString("pt-BR"),
        matricula,
        metadata.durationSeconds || 0,
        Array.isArray(responses.tracos) ? responses.tracos.join(", ") : "N/A",
        resAfirmacoes["A minha vida depende do destino ou da sorte"] || "N/A",
        resAfirmacoes["É o caráter que molda o destino"] || "N/A",
        resAfirmacoes["Eu confio nas opiniões de outras pessoas"] || "N/A",
        resAfirmacoes["Eu vivo da forma como eu quero"] || "N/A",
        String(responses.conflito || "N/A"),
        String(responses.conflito_other || "N/A"),
        String(responses.frases_vida || "N/A"),
        String(responses.referencia_humana || "N/A"),
        String(responses.reflexao_tempo || "N/A"),
        String(responses.autodescricao_3p || "N/A"),
        String(responses.qualidades_outros || "N/A"),
        String(responses.resumo_pessoa || "N/A")
      ]
    });
  } catch (driveErr) {
    console.error(`❌ [Effects:PreAnalise] Erro na sincronização Drive:`, driveErr);
  }
}
