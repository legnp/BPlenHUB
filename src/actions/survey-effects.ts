"use server";

import { requireAuth } from "@/lib/auth-guards";
import { SurveyValue } from "@/types/survey";

// Importações dos Módulos Decompostos (Arquitetura Fase 2 🏗️)
import { handleWelcomeSurveyEffect } from "./effects/welcome-survey";
import { handleGestaoTempoEffect } from "./effects/gestao-tempo";
import { handlePreferenciasAprendizadoEffect } from "./effects/preferencias-aprendizado";
import { handlePreferenciasReconhecimentoEffect } from "./effects/preferencias-reconhecimento";
import { handlePreAnaliseComportamentalEffect } from "./effects/pre-analise-comportamental";
import { handleCheckInEffect, handleContentFeedbackEffect, handleCVReviewEffect, handleDesmistificandoCandidaturasEffect } from "./effects/misc-surveys";

/**
 * BPlen HUB — Survey Effects Dispatcher (🧠)
 * Centraliza a orquestração de efeitos colaterais após o salvamento de pesquisas.
 * Decomposto em módulos específicos para facilitar a manutenção e escala.
 */

/**
 * Identidade do PROPRIO usuario da sessao.
 *
 * Substitui a antiga `resolveUserIdentity(surveyId, responses, userUid)`, que era
 * exportada daqui — e portanto endpoint de rede recebendo o uid **do cliente**.
 * Com ela, qualquer requisicao podia **cunhar matricula em serie** (o ramo de
 * welcome/cadastro incrementa o contador global) dizendo ser outro uid.
 *
 * A protecao nao e um guard a mais: e a **assinatura**. Sem parametro de uid, nao
 * ha como afirmar identidade — ela vem da sessao. Mesmo racional do lote 1
 * (cotas) e do 2a (PII).
 */
export async function resolveOwnIdentityAction(surveyId: string): Promise<string> {
  const session = await requireAuth();
  const { resolveUserIdentity } = await import("@/lib/survey/identity");
  return resolveUserIdentity(surveyId, {}, session.uid);
}

/**
 * Metadados (apelido + metadata de permissao) do PROPRIO usuario da sessao.
 * Substitui `getUserMetadata(userUid)`, que expunha isso para qualquer uid.
 */
export async function getOwnMetadataAction(): Promise<Record<string, unknown>> {
  const session = await requireAuth();
  const { getUserMetadata } = await import("@/lib/survey/identity");
  return getUserMetadata(session.uid);
}

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
