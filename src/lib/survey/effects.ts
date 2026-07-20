import { SurveyValue } from "@/types/survey";
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
 * DESPACHANTE DE EFEITOS COLATERAIS ⚡
 * Roteia a execução para o módulo responsável por cada Survey.
 */
export async function handleSurveySideEffects(surveyId: string, responses: Record<string, SurveyValue>, matricula: string, userUid?: string) {
  console.log(`🔥 [SurveyEffects] Dispatching: "${surveyId}" para ${matricula}`);

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
          console.warn(`⚠️ [SurveyEffects] Nenhum efeito colateral mapeado para: ${surveyId}`);
        }
    }
  } catch (globalErr) {
    console.error(`🚨 [SurveyEffects:Fatal] Falha no Dispatcher (${surveyId}):`, globalErr);
  }
}
