import { resolverAcesso, type DecisaoAcesso, type ServicoAcesso } from "./resolve-access";
import type { JourneyStep, JourneyProgress, UserStepProgress } from "@/types/journey";
import { normalizeString } from "@/lib/utils";

/** Pre-requisito no vocabulario do MOTOR (3 modos) — ja sem `apos_contratadas`. */
type ServicoPreRequisitos = NonNullable<ServicoAcesso["preRequisitos"]>;

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
  /**
   * TODAS as etapas da jornada + se o membro possui cada uma. Necessario apenas
   * para o modo `apos_contratadas` (Fase C), que depende do conjunto contratado
   * pelo membro — nao de uma lista fixa. Ausente = o modo cai para "sem exigencia"
   * (ver `expandirAposContratadas`).
   */
  etapasDoMembro?: ReadonlyArray<{
    serviceCode?: string;
    preRequisitos?: JourneyStep["preRequisitos"];
    entitled: boolean;
  }>;
}

/**
 * Expande o modo `apos_contratadas` na lista concreta de pre-requisitos.
 *
 * Regra (ACCESS-MODEL-DESIGN.md secao 10): quando contratados junto com outros
 * servicos, os servicos "paralelos" (Posicionamento, MentoCoach) so liberam
 * apos a conclusao da ultima etapa da TRILHA PRINCIPAL que o membro contratou.
 * Contratados sozinhos, nao ha o que esperar e a regra se auto-satisfaz.
 *
 * A trilha principal e' derivada, SEM nenhum serviceCode hardcoded:
 *   etapas que o membro possui
 *   MENOS as que declaram `apos_contratadas` (sao as paralelas — senao elas
 *        esperariam umas pelas outras para sempre)
 *   MENOS as que citam uma etapa `apos_contratadas` no proprio pre-requisito
 *        (remove o Offboarding automaticamente: ele exige o MentoCoach e
 *        esperaria de volta)
 */
function expandirAposContratadas(
  servicoAtual: string,
  etapas: JourneyAccessContext["etapasDoMembro"]
): string[] {
  if (!etapas) return [];

  const paralelos = new Set(
    etapas
      .filter(e => e.serviceCode && e.preRequisitos?.modo === "apos_contratadas")
      .map(e => e.serviceCode as string)
  );

  const dependeDeParalelo = (etapa: NonNullable<typeof etapas>[number]) =>
    (etapa.preRequisitos?.etapas ?? []).some(codigo => paralelos.has(codigo));

  return etapas
    .filter(e => e.entitled && e.serviceCode)
    .filter(e => e.serviceCode !== servicoAtual)
    .filter(e => !paralelos.has(e.serviceCode as string))
    .filter(e => !dependeDeParalelo(e))
    .map(e => e.serviceCode as string);
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
 *
 * A busca tolera chave LEGADA (BUG-079). A escrita
 * (`updateJourneySubStepAction`) resolve a chave da etapa por `normalizeString` e
 * grava na chave ja existente no documento — que pode ser legada
 * (ex.: "plano_de_Carreira" em vez de "plano-de-carreira"). Ler cru por
 * `stage.id` perdia essas conclusoes para SEMPRE: a etapa seguinte ficava em
 * SEQUENCE_LOCK permanente, sem erro nenhum na tela. Leitura e escrita agora
 * usam a mesma normalizacao.
 */
export function conclusoesFromProgress(
  stages: readonly JourneyStep[],
  progress: JourneyProgress | null
): string[] {
  if (!progress?.steps) return [];

  const porChaveNormalizada = new Map<string, UserStepProgress>();
  for (const [chave, valor] of Object.entries(progress.steps)) {
    const normalizada = normalizeString(chave);
    // Chave exata tem precedencia: so a 1a ocupa o slot normalizado.
    if (normalizada && !porChaveNormalizada.has(normalizada)) {
      porChaveNormalizada.set(normalizada, valor);
    }
  }

  const conclusoes: string[] = [];
  for (const stage of stages) {
    if (!stage.serviceCode) continue;
    const stepProgress =
      progress.steps[stage.id] ?? porChaveNormalizada.get(normalizeString(stage.id));
    if (stepProgress?.status === "completed") {
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

  // `apos_contratadas` e' um modo do DADO. Resolvemos a lista aqui — o adaptador
  // e' quem conhece o estado real do membro — e entregamos ao motor um
  // pre-requisito que ele ja entende. O motor segue puro, com 3 modos; o tipo
  // acima e' o que impede este modo de vazar para ele.
  const preRequisitos: ServicoPreRequisitos =
    stage.preRequisitos.modo === "apos_contratadas"
      ? { modo: "todos", etapas: expandirAposContratadas(stage.serviceCode, ctx.etapasDoMembro) }
      : { modo: stage.preRequisitos.modo, etapas: stage.preRequisitos.etapas };

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
      preRequisitos,
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
