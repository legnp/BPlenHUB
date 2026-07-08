/**
 * BPlen HUB — Motor de Acesso (Fase B / B1)
 *
 * Funcao PURA que decide o acesso de um usuario a um servico/etapa a partir de
 * atributos de dados. Nao faz I/O, nao importa Firebase, nao conhece rota nem UI.
 *
 * Principio-guia (ACCESS-MODEL-DESIGN.md secao 0): criar um servico/pacote novo =
 * preencher atributos. O motor nao muda. Toda regra de jornada vive no dado
 * (`escopo`, `preRequisitos`) e no estado do usuario (`selo`, `entitlements`,
 * `conclusoes`, `dispensaPreRequisito`).
 *
 * NAO conhece o conceito de admin. Segundo o modelo, admin nao herda a area de
 * membro (os selos coexistem) — se algum caller quiser auto-liberar para um admin,
 * essa decisao e' do caller, nunca do motor.
 *
 * Este modulo ainda NAO tem consumidor: o adaptador que normaliza o estado real
 * (services + quotas + libera + progresso) entra no PR B2.
 */

/** Resultado da decisao de acesso (ver ACCESS-MODEL-DESIGN.md secao 4). */
export type ResultadoAcesso =
  /** Usuario pode entrar no servico. */
  | "LIBERADO"
  /** Servico e' de escopo `member` e o usuario nao tem o selo: mostrar como previa. */
  | "PREVIA"
  /** Usuario tem o selo (ou o servico e' publico), mas nao possui o servico: ofertar. */
  | "UPSELL"
  /** Usuario possui o servico, mas nao cumpriu os pre-requisitos. */
  | "SEQUENCE_LOCK";

export type ModoPreRequisito = "nenhum" | "todos" | "qualquer";

/** Atributos do servico/etapa relevantes para a decisao. */
export interface ServicoAcesso {
  serviceCode: string;
  /**
   * Onde o servico e' entregue. `member` exige o selo.
   * Ausente = tratado como `public` (nao bloqueia) — estado pre-sincronizacao
   * da aba `Atributos`, em que nenhum produto declara escopo.
   */
  escopo?: "public" | "member";
  /** Ausente = equivalente a `{ modo: "nenhum" }`. */
  preRequisitos?: {
    modo: ModoPreRequisito;
    /** serviceCodes exigidos. */
    etapas: string[];
  };
}

/** Estado do usuario relevante para a decisao. */
export interface UsuarioAcesso {
  /** `member_area_access` — o selo de membro. */
  selo: boolean;
  /** serviceCodes que o usuario possui (compra avulsa + pacote + atribuicao admin). */
  entitlements: string[];
  /** serviceCodes de etapas ja concluidas. */
  conclusoes: string[];
  /** serviceCodes cujo pre-requisito o admin (ou o workflow de elegibilidade) dispensou. */
  dispensaPreRequisito: string[];
}

export interface DecisaoAcesso {
  resultado: ResultadoAcesso;
  /**
   * Em `SEQUENCE_LOCK`, os serviceCodes que faltam concluir.
   * Em `modo: "qualquer"`, lista as alternativas aceitas (qualquer uma libera).
   * Vazio nos demais resultados.
   */
  pendentes: string[];
}

/** serviceCode e' um identificador (ASCII, imutavel) — comparacao case-insensitive. */
function normalizarCodigo(serviceCode: string): string {
  return serviceCode.trim().toUpperCase();
}

function normalizarLista(codigos: readonly string[]): Set<string> {
  const resultado = new Set<string>();
  for (const codigo of codigos) {
    if (typeof codigo !== "string") continue;
    const normalizado = normalizarCodigo(codigo);
    if (normalizado) resultado.add(normalizado);
  }
  return resultado;
}

/**
 * Decide o acesso de um usuario a um servico. Ordem das regras (secao 4 do design):
 *
 *   1. Escopo      — servico `member` sem selo         -> PREVIA
 *   2. Entitlement — servico nao possuido              -> UPSELL
 *   3. Pre-requisito:
 *        modo `nenhum` (ou ausente)                    -> LIBERADO
 *        dispensa concedida para este servico          -> LIBERADO
 *        `todos`    — todas as etapas concluidas       -> LIBERADO | SEQUENCE_LOCK
 *        `qualquer` — ao menos uma etapa concluida     -> LIBERADO | SEQUENCE_LOCK
 *
 * A ordem importa: um membro que teve o selo revogado ve PREVIA mesmo nos servicos
 * que possui — e' assim que a revogacao expulsa do clube (BUG-035).
 */
export function resolverAcesso(usuario: UsuarioAcesso, servico: ServicoAcesso): DecisaoAcesso {
  const codigo = normalizarCodigo(servico.serviceCode);

  // 1. Escopo
  if (servico.escopo === "member" && !usuario.selo) {
    return { resultado: "PREVIA", pendentes: [] };
  }

  // 2. Entitlement
  if (!normalizarLista(usuario.entitlements).has(codigo)) {
    return { resultado: "UPSELL", pendentes: [] };
  }

  // 3. Pre-requisito
  const preRequisitos = servico.preRequisitos;
  if (!preRequisitos || preRequisitos.modo === "nenhum") {
    return { resultado: "LIBERADO", pendentes: [] };
  }

  if (normalizarLista(usuario.dispensaPreRequisito).has(codigo)) {
    return { resultado: "LIBERADO", pendentes: [] };
  }

  const exigidas = Array.from(normalizarLista(preRequisitos.etapas ?? []));
  // Sem etapas declaradas nao ha o que exigir, qualquer que seja o modo.
  if (exigidas.length === 0) {
    return { resultado: "LIBERADO", pendentes: [] };
  }

  const concluidas = normalizarLista(usuario.conclusoes);

  if (preRequisitos.modo === "qualquer") {
    const alguma = exigidas.some(etapa => concluidas.has(etapa));
    return alguma
      ? { resultado: "LIBERADO", pendentes: [] }
      : { resultado: "SEQUENCE_LOCK", pendentes: exigidas };
  }

  // modo "todos"
  const faltando = exigidas.filter(etapa => !concluidas.has(etapa));
  return faltando.length === 0
    ? { resultado: "LIBERADO", pendentes: [] }
    : { resultado: "SEQUENCE_LOCK", pendentes: faltando };
}
