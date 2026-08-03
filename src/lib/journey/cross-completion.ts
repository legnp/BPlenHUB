import type { ContentType, SubStepConfig } from "@/types/journey";

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
 * Duas regras, uma de semantica e outra da forma do dado:
 *
 * 1. **Ocorrencia nao cruza.** Uma sessao e um EVENTO: participar de uma nao e
 *    participar de outra, em servico nenhum. Vale mesmo quando a chave aparece uma
 *    unica vez na etapa.
 * 2. **Chave repetida na etapa nao cruza.** Se o mesmo `type:referenceId` aparece mais
 *    de uma vez, sao ocorrencias contaveis (1a, 2a, 3a...), nao a mesma atividade.
 *    Protege um servico futuro que repita uma survey de proposito (um check-in mensal,
 *    por exemplo) sem depender de alguem lembrar desta regra.
 */

/** Tipos que representam ocorrencia no tempo, nao conteudo produzido uma vez. */
const OCCURRENCE_TYPES: ReadonlySet<ContentType> = new Set<ContentType>(["meeting"]);

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
  if (OCCURRENCE_TYPES.has(sub.type)) return false;
  return !repeatedKeys.has(activityKeyOf(sub));
}
