import type { SubStepConfig } from "@/types/journey";

/**
 * BPlen HUB — Elegibilidade para a conclusao cruzada (BUG-118).
 *
 * O motor de auto-conclusao cruzada existe para nao pedir a MESMA coisa duas vezes:
 * uma survey respondida num servico ja vale nos outros. Ele casa atividades pelo par
 * `type:referenceId`.
 *
 * O problema: servicos que repetem sessoes (MentoCoach 10x `sessao-mentocoach`, GDC 10x
 * `orientacao-em-grupo`) compartilham o mesmo `referenceId` DE PROPOSITO — e ele que
 * identifica o TIPO de sessao para casar a parada com o evento da agenda
 * (`getMeetingFilterKeyword`/`eventMatchesSubstep`). Sem uma regra de elegibilidade,
 * concluir a 1a sessao marcava as dez (e desmarcar uma desmarcava as dez).
 *
 * A regra e uma so: **chave repetida dentro da etapa nao cruza.** Se o mesmo
 * `type:referenceId` aparece mais de uma vez, sao ocorrencias contaveis (1a, 2a, 3a...),
 * nao a mesma atividade. Vale para qualquer tipo — protege tambem um servico futuro que
 * repita uma survey de proposito (um check-in mensal, por exemplo).
 *
 * Nao ha vazamento de uma etapa para outra: a chave repetida e excluida ja na COLETA,
 * entao a conclusao de uma sessao nunca entra no conjunto que propaga.
 *
 * A primeira versao desta correcao tinha uma segunda regra — "`meeting` nunca cruza",
 * pelo argumento de que sessao e ocorrencia. Era larga demais: a **Devolutiva de
 * Analise** e o MESMO checkpoint (`ss-meeting-devolutiva-analise-comportamental`) nas
 * etapas `analise-comportamental` e `mentocoach`, uma unica vez em cada. E uma unica
 * sessao, a que o membro participa uma vez — sincronizar as duas pontas esta correto, e
 * a regra derrubava isso. Removida.
 */

type ActivityLike = Pick<SubStepConfig, "type" | "referenceId">;

/** Identidade da atividade para efeito de conclusao cruzada. */
export function activityKeyOf(sub: ActivityLike): string {
  return `${sub.type}:${sub.referenceId}`;
}

/** Chaves que aparecem mais de uma vez na etapa — ocorrencias contaveis. */
export function repeatedActivityKeys(substeps: ReadonlyArray<ActivityLike>): Set<string> {
  const count = new Map<string, number>();
  for (const sub of substeps) {
    if (!sub.referenceId) continue;
    const key = activityKeyOf(sub);
    count.set(key, (count.get(key) ?? 0) + 1);
  }

  const repeated = new Set<string>();
  for (const [key, total] of count) {
    if (total > 1) repeated.add(key);
  }
  return repeated;
}

/**
 * Esta parada participa da conclusao cruzada — tanto para PROPAGAR a propria conclusao
 * quanto para RECEBER a de outra?
 */
export function isCrossCompletable(
  sub: ActivityLike,
  repeatedKeys: ReadonlySet<string>
): boolean {
  if (!sub.referenceId) return false;
  return !repeatedKeys.has(activityKeyOf(sub));
}
