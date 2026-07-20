"use server";

import { submitGenericForm } from "@/actions/generic-form";
import { submitSurvey } from "@/actions/submit-survey";
import { themeSuggestionFormConfig } from "@/config/forms/theme-suggestion";
import { contentEvaluationSurveyConfig } from "@/config/surveys/content-evaluation";
import { FormResponse } from "@/types/forms";
import { SurveyValue } from "@/types/survey";
import { getServerSession } from "@/lib/server-session";

/**
 * BPlen HUB — Feedback Actions (Institucionalizadas 🧬)
 * Gerencia a captação de voz do usuário (Avaliações e Sugestões) seguindo Forms_Global e Survey_Global.
 */

/**
 * Identidade de quem envia feedback — publico por design, rastreavel quando da.
 *
 * O feedback de conteudo e de sugestao de tema vive em rotas **publicas**
 * (`/conteudo` e `/conteudo/artigo/[id]`): visitante nao logado PRECISA conseguir
 * enviar. Mas ate o `BUG-107` o codigo fabricava um `lead_eval_<timestamp>` que
 * **fingia ser identidade**: por ser truthy, fazia o resolvedor pular o ramo
 * anonimo, falhar nos lookups e terminar em erro — o visitante via "Falha ao
 * registrar sua avaliacao". Confirmado no dado: 0 `BP-ANON` e 0 `_AuthMap`
 * `lead_*` na base, ou seja, nenhum envio anonimo jamais gravou.
 *
 * Alem disso o `uid` chegava **do cliente** e era aceito sem conferencia — o que
 * nao e rastreabilidade, e atribuicao forjavel (familia do `BUG-106`).
 *
 * Regra: com sessao, o uid vem da **sessao verificada**; sem sessao, devolve
 * `undefined` e o resolvedor segue pelo caminho anonimo, que funciona.
 */
async function resolveSubmitterUid(): Promise<string | undefined> {
  const session = await getServerSession();
  return session?.uid;
}

/**
 * Salva uma avaliação de conteúdo específico (Survey).
 */
export async function submitContentFeedback(data: {
  postId: string;
  title: string;
  platform: string;
  publishedAt: string;
  rating: number;
  comment: string;
  uid?: string | null;
  matricula?: string | null;
}) {
  try {
    // BUG-107: sem sessao, `undefined` leva ao caminho anonimo (que funciona);
    // com sessao, o uid vem da sessao VERIFICADA, nao do parametro do cliente.
    const userUid = await resolveSubmitterUid();

    // 1. Preparar Payload da Survey
    const responses: Record<string, SurveyValue> = {
      postId: data.postId,
      title: data.title,
      platform: data.platform,
      publishedAt: data.publishedAt,
      rating: data.rating,
      comment: data.comment
    };

    // 2. Delegar para submitSurvey Institutional
    const dynamicConfig = { 
      ...contentEvaluationSurveyConfig, 
      id: `${contentEvaluationSurveyConfig.id}_${data.postId}` 
    };

    const res = await submitSurvey(dynamicConfig, responses, userUid);
    
    return { success: true, matricula: res.matricula };
  } catch (error) {
    console.error("Erro ao salvar feedback de conteúdo:", error);
    throw new Error("Falha ao registrar sua avaliação.");
  }
}

/**
 * Salva uma nova sugestão de tema/conteúdo (Form).
 */
export async function submitThemeSuggestion(data: {
  suggestion: string;
  justification: string;
  channels: string[];
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  uid?: string | null;
  matricula?: string | null;
}) {
  try {
     // Identificador de soberania: prioriza UID, fallback para hash do e-mail se disponível, ou timestamp
    // BUG-107/BUG-106: identidade da sessao verificada; sem sessao, anonimo.
    // O hash de e-mail digitado deixou de compor identidade — e-mail de campo
    // de formulario nao prova quem e quem.
    const userUid = await resolveSubmitterUid();

    // 1. Mapear para FormResponse
    const response: FormResponse = {
      suggestion: data.suggestion,
      justification: data.justification,
      channels: data.channels,
      contact_name: data.contact?.name || "",
      contact_email: data.contact?.email || "",
      contact_phone: data.contact?.phone || ""
    };

    // 2. Delegar para submitGenericForm Institutional
    const res = await submitGenericForm(themeSuggestionFormConfig, response, userUid);
    
    return { success: true, matricula: res.matricula };
  } catch (error) {
    console.error("Erro ao salvar sugestão de tema:", error);
    throw new Error("Falha ao enviar sua sugestão.");
  }
}
