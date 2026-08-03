import { SurveyConfig, SurveyValue } from "@/types/survey";
import { handleWelcomeSurveyEffect } from "@/actions/effects/welcome-survey";
import { handleGestaoTempoEffect } from "@/actions/effects/gestao-tempo";
import { handlePreferenciasAprendizadoEffect } from "@/actions/effects/preferencias-aprendizado";
import { handlePreferenciasReconhecimentoEffect } from "@/actions/effects/preferencias-reconhecimento";
import { handlePreAnaliseComportamentalEffect } from "@/actions/effects/pre-analise-comportamental";
import { handleCheckInEffect, handleContentFeedbackEffect, handleCVReviewEffect, handleDesmistificandoCandidaturasEffect } from "@/actions/effects/misc-surveys";

/**
 * Dispatcher de efeitos colaterais de survey — modulo de servidor, NAO action.
 *
 * Ate o lote 5 do `BUG-103` isto vivia em `actions/survey-effects.ts`, que e
 * `"use server"`: era um **endpoint de rede** que aceitava `matricula` como
 * parametro. Uma requisicao nao autenticada podia disparar os efeitos na conta de
 * QUALQUER membro — gravar resultado de survey, progredir jornada, escrever em
 * Feedbacks/Career_Backlog/Shared_Documents.
 *
 * O unico chamador e `submitSurvey`, que roda no servidor e **ja resolveu a
 * identidade pela sessao** antes de chegar aqui. Server -> lib e chamada direta,
 * entao mover para ca **remove a porta sem mudar o comportamento** (Protocolo
 * item 8, mesmo desenho dos lotes 3 e 4).
 */

/**
 * REGISTRO COMPLETO NO DRIVE (cobertura padrao).
 *
 * Roda para TODO survey, antes de qualquer efeito curado. Ate aqui a gravacao no
 * Drive dependia de o `surveyId` estar no `switch` abaixo: quem nao estivesse
 * caia no `default`, que apenas logava um aviso — o dado ficava so no Firestore e
 * nunca aparecia na pasta do usuario. Eram 18 dos 26 surveys, entre eles Carreira
 * e PDI inteiros.
 *
 * Os handlers curados continuam existindo e nao foram tocados, mas sao projecoes
 * PARCIAIS (o de check-in grava 13 colunas de ~36 campos). Por isso o registro
 * completo e universal, e nao um fallback: o Drive e a copia de seguranca
 * independente da plataforma, entao ele precisa conter a resposta inteira.
 *
 * Fail-soft por decisao: falha de Drive nao pode derrubar o envio ja gravado no
 * Firestore — mesmo contrato dos handlers curados.
 */
async function syncCompleteSurveyRecord(
  surveyId: string,
  responses: Record<string, SurveyValue>,
  matricula: string,
  config?: SurveyConfig
) {
  try {
    const { buildGenericSurveyRow } = await import("@/lib/survey/survey-serializer");
    const { syncSurveyToUserDrive } = await import("@/lib/drive-sync");
    const { DRIVE_FOLDERS } = await import("@/lib/drive-utils");

    const { headers, rowData } = buildGenericSurveyRow(surveyId, responses, matricula, config);

    await syncSurveyToUserDrive({
      matricula,
      surveyTitle: `${config?.title || surveyId} (Respostas completas)`,
      headers,
      rowData,
      targetFolderOverride: DRIVE_FOLDERS.SURVEYS,
    });
  } catch (err) {
    console.error(`[SurveyEffects] Falha ao gravar registro completo (${surveyId}):`, err);
  }
}

/**
 * DESPACHANTE DE EFEITOS COLATERAIS ⚡
 * Roteia a execução para o módulo responsável por cada Survey.
 */
export async function handleSurveySideEffects(
  surveyId: string,
  responses: Record<string, SurveyValue>,
  matricula: string,
  userUid?: string,
  config?: SurveyConfig
) {
  console.log(`🔥 [SurveyEffects] Dispatching: "${surveyId}" para ${matricula}`);

  // Cobertura padrao: independe do survey estar mapeado no switch.
  await syncCompleteSurveyRecord(surveyId, responses, matricula, config);

  try {
    switch (surveyId) {
      case "welcome_survey":
        // O welcome exige usuario autenticado — e onde a matricula nasce. Sem uid
        // nao ha identidade a sincronizar, e chegar aqui anonimo seria estado
        // invalido; a guarda torna isso explicito em vez de alargar o tipo.
        if (userUid) await handleWelcomeSurveyEffect(responses, matricula, userUid);
        break;

      case "check_in":
      case "check_in_v1":
        await handleCheckInEffect(responses, matricula);
        break;

      case "gestao_tempo":
        await handleGestaoTempoEffect(responses, matricula);
        break;

      case "preferencias_aprendizado":
        await handlePreferenciasAprendizadoEffect(responses, matricula);
        break;

      case "preferencias_reconhecimento":
        await handlePreferenciasReconhecimentoEffect(responses, matricula);
        break;

      case "pre_analise_comportamental":
        await handlePreAnaliseComportamentalEffect(responses, matricula);
        break;

      case "desmistificando_candidaturas":
        await handleDesmistificandoCandidaturasEffect(responses, matricula);
        break;

      case "revisao_curriculo":
        await handleCVReviewEffect(responses, matricula);
        break;

      default:
        if (surveyId.startsWith("content_evaluation_")) {
          // Extraímos o título dinâmico da avaliação, se não existir, usa o ID
          const tituloAvaliacao = String(responses.title || `Artigo/Post ID: ${surveyId.replace("content_evaluation_", "")}`);
          await handleContentFeedbackEffect(responses, matricula, `Avaliação - ${tituloAvaliacao}`);
        } else {
          // Sem handler curado: o registro completo acima ja garantiu a copia no
          // Drive. O aviso permanece so como sinal de que ainda nao ha curadoria
          // de rotulos para este survey — nao indica mais perda de dado.
          console.log(`[SurveyEffects] Sem efeito curado para "${surveyId}" — registro completo gravado.`);
        }
    }
  } catch (globalErr) {
    console.error(`🚨 [SurveyEffects:Fatal] Falha no Dispatcher (${surveyId}):`, globalErr);
  }
}
