import { SubStepConfig } from "@/types/journey";

/**
 * Casamento entre uma parada da jornada (type=meeting) e os eventos da agenda.
 *
 * O filtro do StepRenderer exige que o nome do evento no Google CONTENHA a
 * palavra-chave devolvida aqui. Cada tipo de sessao tem uma regra propria
 * porque o nome do evento na agenda e mais curto que o titulo da parada
 * (ex.: evento "MentoCoach" x parada "1a Sessao de MentoCoach").
 *
 * O `referenceId` e consultado ANTES do titulo: ele identifica o tipo de
 * sessao, enquanto o titulo e texto livre editavel no admin. Consultar o
 * titulo primeiro fazia paradas que apenas citavam outro servico no nome
 * herdarem o filtro errado (BUG-074).
 */
const MEETING_KEYWORD_RULES: Array<{ match: (source: string) => boolean; keyword: string }> = [
  { match: (s) => s.includes("feedback") && s.includes("posicionamento"), keyword: "feedback posicionamento" },
  { match: (s) => s.includes("onboarding"), keyword: "onboarding" },
  { match: (s) => s.includes("mentocoach"), keyword: "mentocoach" },
  { match: (s) => s.includes("analise") || s.includes("comportamental"), keyword: "analise comportamental" },
  { match: (s) => s.includes("carreira") || s.includes("plano"), keyword: "plano de carreira" },
  { match: (s) => s.includes("grupo"), keyword: "orientacao em grupo" },
  { match: (s) => s.includes("individual"), keyword: "orientacao individual" },
  { match: (s) => s.includes("coaching"), keyword: "coaching" },
  { match: (s) => s.includes("mentoria"), keyword: "mentoria" },
  { match: (s) => s.includes("offboarding"), keyword: "offboarding" }
];

function resolveKeywordFrom(source: string): string | null {
  if (!source) return null;
  return MEETING_KEYWORD_RULES.find(rule => rule.match(source))?.keyword ?? null;
}

export function getMeetingFilterKeyword(substep: Pick<SubStepConfig, "referenceId" | "title">): string {
  const refId = (substep.referenceId || "").toLowerCase();
  const title = (substep.title || "").toLowerCase();

  const keyword = resolveKeywordFrom(refId) ?? resolveKeywordFrom(title);
  if (keyword) return keyword;

  return substep.referenceId
    ? substep.referenceId.replace(/_/g, " ").replace(/-/g, " ").toLowerCase()
    : title;
}
