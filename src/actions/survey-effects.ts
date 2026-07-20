"use server";

import { requireAuth } from "@/lib/auth-guards";

// Importações dos Módulos Decompostos (Arquitetura Fase 2 🏗️)

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
