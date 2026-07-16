import { normalizeString } from "@/lib/utils";
import type { JourneyStep } from "@/types/journey";
import type { MemberQuotaWallet } from "@/types/entitlements";

/**
 * O membro possui esta etapa? (calculo LEGADO, extraido do `useJourney`.)
 *
 * Comportamento preservado byte a byte do que vivia dentro de `getStageTelemetry`
 * — quotas com match difuso + override de `services` + grants especiais de
 * onboarding/offboarding. Foi extraido porque a Fase C precisa do entitlement de
 * TODAS as etapas (para derivar o conjunto de espera), nao so da etapa corrente,
 * e porque logica de negocio dentro de um hook nao da para testar.
 *
 * NAO e' o motor de acesso: isto responde "possui?", nao "pode entrar?". A
 * decisao final e' do `resolverAcesso` (escopo + entitlement + pre-requisito).
 */
export function isStageEntitled(
  stage: Pick<JourneyStep, "id" | "order">,
  quotas: MemberQuotaWallet | null,
  services: Record<string, boolean> | null | undefined
): boolean {
  const stepId = stage.id;
  const stepIdUpper = stepId.toUpperCase();
  const stepIdLower = stepId.toLowerCase();

  let hasQuota = false;

  if (quotas && quotas.quotas) {
    const stepIdNormalized = normalizeString(stepId);
    for (const [quotaKey, quotaData] of Object.entries(quotas.quotas)) {
      if (quotaData.total <= 0) continue;

      const quotaKeyNormalized = normalizeString(quotaKey);

      if (
        quotaKeyNormalized === stepIdNormalized ||
        quotaKeyNormalized.includes(stepIdNormalized) ||
        stepIdNormalized.includes(quotaKeyNormalized)
      ) {
        hasQuota = true;
        break;
      }

      if (quotaKey.toLowerCase().replace(/[-_]/g, "") === stepIdLower.replace(/[-_]/g, "")) {
        hasQuota = true;
        break;
      }

      const keyUpper = quotaKey.toUpperCase();
      if (stepIdUpper === "COACHING-E-MENTORIA" && (keyUpper.includes("COACHING") || keyUpper.includes("MENTORIA"))) {
        hasQuota = true;
        break;
      }
    }
  }

  if (!hasQuota) {
    const quotaLower = quotas?.quotas[stepIdLower];
    const quotaUpper = quotas?.quotas[stepIdUpper];
    hasQuota = (quotaLower && quotaLower.total > 0) || (quotaUpper && quotaUpper.total > 0) || false;
  }

  let finalHasAccess = hasQuota;

  if (stepIdLower.includes("mentocoach") && quotas && (quotas.mentoCoachSessionsLimit || 0) > 0) {
    finalHasAccess = true;
  }

  // `services` (toggle do admin / compra) SOBRESCREVE a leitura de quotas.
  if (services !== undefined && services !== null) {
    if (services[stepIdLower] === false) {
      finalHasAccess = false;
    } else if (services[stepIdLower] === true) {
      finalHasAccess = true;
    }
  }

  const hasAnyQuota = quotas ? Object.values(quotas.quotas).some(q => q.total > 0) : false;
  const isOffboarding = stepIdLower === "offboarding";

  return finalHasAccess || stage.order === 0 || ((stepId === "onboarding" || isOffboarding) && hasAnyQuota);
}
