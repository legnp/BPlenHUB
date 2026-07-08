import { resolverAcesso, type DecisaoAcesso } from "./resolve-access";
import type { JourneyStep, JourneyProgress } from "@/types/journey";

/**
 * BPlen HUB — Adaptador do motor de acesso para a jornada (Fase B2)
 *
 * Traduz o estado real da jornada (etapas derivadas dos produtos + progresso +
 * permissoes) para o vocabulario do motor puro `resolverAcesso`, e o resultado
 * do motor de volta para a telemetria que a UI ja consome
 * (`hasAccess`/`isSequenceLocked`).
 *
 * ADAPTADOR LENIENTE (decisao da Gestora, 2026-07-08): o entitlement da etapa e'
 * o calculo legado do useJourney (quotas com fuzzy match + overrides de
 * `services` + grants especiais de onboarding/offboarding), passado pronto em
 * `legacyEntitled`. Nao ha expansao de `libera` em leitura porque o checkout ja
 * grava `services[stageId]` por quota na compra de pacote (`checkout.ts`,
 * quotaBasedStageActivations) — o modo estrito por serviceCode so entra depois
 * da Trilha 3b (BUG-042).
 *
 * O motor so assume a decisao quando a etapa tem atributos sincronizados
 * (`serviceCode` + `preRequisitos` — aba Atributos do portfolio). Sem eles,
 * devolve null e o chamador mantem o comportamento legado por inteiro.
 */

export interface JourneyAccessContext {
  /** `member_area_access` do usuario. */
  selo: boolean;
  /** Resultado do calculo legado de acesso do useJourney para ESTA etapa. */
  legacyEntitled: boolean;
  /** serviceCodes das etapas ja concluidas (ver `conclusoesFromProgress`). */
  conclusoes: string[];
  /** Waivers de pre-requisito do usuario (Fase A/A3). */
  dispensaPreRequisito: string[];
}

export interface StageAccessDecision {
  hasAccess: boolean;
  isSequenceLocked: boolean;
  /** Decisao crua do motor, para UI futura (ex.: listar `pendentes` no modal). */
  decisao: DecisaoAcesso;
}

/**
 * Deriva as conclusoes (em serviceCode) do progresso real: uma etapa conta como
 * concluida quando seu status no `JourneyProgress` e' "completed".
 */
export function conclusoesFromProgress(
  stages: readonly JourneyStep[],
  progress: JourneyProgress | null
): string[] {
  if (!progress?.steps) return [];
  const conclusoes: string[] = [];
  for (const stage of stages) {
    if (!stage.serviceCode) continue;
    if (progress.steps[stage.id]?.status === "completed") {
      conclusoes.push(stage.serviceCode);
    }
  }
  return conclusoes;
}

/**
 * Decide o acesso de uma etapa via motor `resolverAcesso`.
 * Retorna null quando a etapa nao tem atributos sincronizados — o chamador deve
 * manter a decisao legada (fallback de transicao pre-Sync).
 */
export function resolveStageAccess(
  stage: Pick<JourneyStep, "serviceCode" | "escopo" | "preRequisitos">,
  ctx: JourneyAccessContext
): StageAccessDecision | null {
  if (!stage.serviceCode || !stage.preRequisitos) return null;

  const decisao = resolverAcesso(
    {
      selo: ctx.selo,
      entitlements: ctx.legacyEntitled ? [stage.serviceCode] : [],
      conclusoes: ctx.conclusoes,
      dispensaPreRequisito: ctx.dispensaPreRequisito,
    },
    {
      serviceCode: stage.serviceCode,
      escopo: stage.escopo,
      preRequisitos: stage.preRequisitos,
    }
  );

  return {
    // LIBERADO e SEQUENCE_LOCK significam "possui o servico" (o lock e' so de
    // ordem metodologica); PREVIA e UPSELL significam "nao acionavel" — a UI
    // abre o modal de upsell, como no comportamento legado.
    hasAccess: decisao.resultado === "LIBERADO" || decisao.resultado === "SEQUENCE_LOCK",
    isSequenceLocked: decisao.resultado === "SEQUENCE_LOCK",
    decisao,
  };
}
