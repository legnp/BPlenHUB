import { Product } from "@/types/products";

/**
 * Audiencia da jornada — de quem e' a trilha que esta sendo montada.
 *
 * O motor de jornada (src/actions/journey.ts) monta as etapas a partir dos produtos
 * do portfolio marcados como `isStepJourney`. Ate a Fase 1 da Area de Parceiros ele
 * nao filtrava por audiencia: qualquer produto de jornada aparecia para todo mundo.
 * Com a jornada de parceiro isso vira vazamento — os checkpoints do parceiro
 * apareceriam na jornada de TODOS os membros.
 *
 * Este modulo e' puro de proposito: a regra de quem ve o que precisa ser testavel
 * sem banco (Licao 28 — rodar a regra de acesso contra a populacao inteira antes de
 * mergear, nao so contra o caso que a motivou).
 */
export type JourneyAudience = "member" | "partner";

/**
 * Doc de progresso de cada audiencia, dentro de `User/{matricula}/User_Journey`.
 * Docs IRMAOS de proposito: os ids de etapa das duas trilhas convivem sem colidir,
 * e o progresso do membro nunca e' reescrito pelo do parceiro.
 */
export const JOURNEY_PROGRESS_DOC: Record<JourneyAudience, string> = {
  member: "progress",
  partner: "partner_progress",
};

/**
 * Planilha de progresso de cada audiencia no acervo do usuario.
 *
 * Contraparte de `JOURNEY_PROGRESS_DOC` no Drive. O espelho da jornada e'
 * snapshot — a aba e' limpa antes de cada escrita —, entao um nome unico para as
 * duas trilhas fazia a conclusao de um checkpoint numa apagar o retrato da
 * outra, para quem e' membro E parceiro ao mesmo tempo.
 *
 * O nome do membro e' o legado DE PROPOSITO: as planilhas que ja existem
 * continuam validas, sem migracao.
 */
export function journeySheetName(matricula: string, audience: JourneyAudience): string {
  const base = `Progresso_Jornada - ${matricula}`;
  return audience === "partner" ? `${base} - Parceria` : base;
}

/** Audiencia de portfolio que marca um produto como trilha de parceiro. */
const PARTNER_AUDIENCE = "partners";

/**
 * Decide se um produto de jornada pertence a trilha da audiencia informada.
 *
 * Regra deliberadamente conservadora, para NAO mexer no que o membro ja ve hoje:
 * - Parceiro: so produto que declara explicitamente a audiencia `partners`.
 * - Membro: tudo, MENOS o produto que e' exclusivamente de parceiro. Produto legado
 *   sem `targetAudiences` continua na jornada de membro (era o comportamento antes
 *   deste filtro), e produto de audiencia dupla (ex.: `people` + `partners`) aparece
 *   nas duas trilhas — que e' a leitura natural de quem marcou as duas.
 */
export function productServesJourneyAudience(
  product: Pick<Product, "targetAudiences">,
  audience: JourneyAudience
): boolean {
  const audiences = Array.isArray(product.targetAudiences) ? product.targetAudiences : [];

  if (audience === "partner") {
    return audiences.includes(PARTNER_AUDIENCE);
  }

  const isPartnerOnly = audiences.length > 0 && audiences.every((a) => a === PARTNER_AUDIENCE);
  return !isPartnerOnly;
}
