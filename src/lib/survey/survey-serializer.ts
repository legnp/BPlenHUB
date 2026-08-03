import type { SurveyConfig, SurveyFieldConfig, SurveyValue } from "@/types/survey";

/**
 * BPlen HUB — Serializador generico de resposta de survey.
 *
 * Existe para acabar com a cobertura por allowlist: ate aqui, so chegava ao Drive
 * o survey que alguem tivesse cadastrado a mao no dispatcher, com `headers` e
 * `rowData` escritos campo a campo. Survey nao cadastrado caia no `default` e o
 * dado ficava so no Firestore — 18 dos 26 surveys do sistema estavam nessa
 * situacao, incluindo os modulos de Carreira e PDI inteiros.
 *
 * A projecao manual tambem era lossy por construcao: renomear um campo no survey
 * nao quebrava nada, so fazia a coluna virar "N/A" em silencio (BUG-109). Aqui as
 * colunas derivam da PROPRIA definicao do survey, entao campo novo aparece
 * sozinho e campo renomeado acompanha.
 *
 * Funcoes puras, sem I/O: quem grava e `syncSurveyToUserDrive`.
 */

/** Colunas fixas que abrem toda planilha generica. */
const FIXED_HEADERS = ["Timestamp", "Matricula", "Survey"] as const;

/**
 * Tipos de campo que nao carregam resposta do usuario — sao texto de apoio ou
 * ilustracao. Viram coluna vazia em toda linha, entao ficam de fora.
 */
const PRESENTATIONAL_FIELD_TYPES = new Set<SurveyFieldConfig["type"]>([
  "info",
  "image",
]);

/** Rotulo amigavel para chaves que o SurveyEngine anexa fora da definicao. */
const EXTRA_KEY_LABELS: Record<string, string> = {
  metadata: "Metadados da sessao",
  title: "Titulo do conteudo",
};

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Converte um valor de resposta em texto de celula.
 *
 * Os formatos compostos que o motor produz (upload, cascata) ganham tratamento
 * dedicado porque o `JSON.stringify` cru deles e ilegivel na planilha. Qualquer
 * outro objeto cai no JSON — feio, porem integro, que e o ponto: o Drive e a
 * copia de seguranca independente da plataforma.
 */
export function serializeSurveyValue(value: SurveyValue | undefined): string {
  if (value === null || value === undefined) return "";

  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  if (Array.isArray(value)) {
    return value
      .map((item) => (isPlainRecord(item) ? serializeRecord(item) : String(item ?? "")))
      .filter((item) => item.length > 0)
      .join(", ");
  }

  if (isPlainRecord(value)) return serializeRecord(value);

  return "";
}

function serializeRecord(record: Record<string, unknown>): string {
  // Upload (FileField / EvidenceField): o que importa e o link do arquivo.
  if (typeof record.url === "string" && record.url) {
    const fileName = typeof record.fileName === "string" ? record.fileName : "";
    return fileName ? `${fileName} (${record.url})` : record.url;
  }

  // Cascata (CascadedSelect): nivel primario e secundario.
  if (typeof record.primary === "string") {
    const secondary = typeof record.secondary === "string" ? record.secondary : "";
    return [record.primary, secondary].filter(Boolean).join(" > ");
  }

  try {
    return JSON.stringify(record);
  } catch {
    return "[valor nao serializavel]";
  }
}

/** Percorre a definicao do survey e devolve os campos que carregam resposta. */
export function collectAnswerableFields(config: SurveyConfig): SurveyFieldConfig[] {
  const fields: SurveyFieldConfig[] = [];

  for (const step of config.steps ?? []) {
    for (const field of step.fields ?? []) {
      if (PRESENTATIONAL_FIELD_TYPES.has(field.type)) continue;
      fields.push(field);
      // `dynamic_list` guarda as linhas no campo pai; os subFields nao viram
      // coluna propria (virariam N colunas por linha da lista).
    }
  }

  return fields;
}

export interface GenericSurveyRow {
  headers: string[];
  rowData: (string | number | boolean | null)[];
}

/**
 * Monta cabecalhos e linha de uma resposta.
 *
 * Estabilidade das colunas importa mais do que economia: `appendDataToSheet`
 * escreve o cabecalho UMA vez (no primeiro envio) e depois so anexa linhas. Se a
 * ordem variasse entre envios, a linha 3 nao significaria o mesmo que a linha 2.
 * Por isso as colunas saem da definicao do survey — que e igual para todos os
 * envios daquele id — e nunca das chaves presentes nesta resposta especifica.
 * Campo nao respondido vira celula vazia, e nao coluna ausente.
 *
 * Chaves que aparecem na resposta sem estar na definicao (metadados do motor,
 * survey dinamico sem config) entram no fim, em ordem alfabetica, para que a
 * ordem tambem nao dependa da ordem de iteracao do objeto.
 */
export function buildGenericSurveyRow(
  surveyId: string,
  responses: Record<string, SurveyValue>,
  matricula: string,
  config?: SurveyConfig
): GenericSurveyRow {
  const headers: string[] = [...FIXED_HEADERS];
  const rowData: (string | number | boolean | null)[] = [
    new Date().toLocaleString("pt-BR"),
    matricula,
    config?.title || surveyId,
  ];

  const seenKeys = new Set<string>();
  const usedHeaders = new Set<string>(headers);

  /** Garante rotulo unico: coluna duplicada tornaria a planilha ambigua. */
  const uniqueHeader = (label: string, key: string): string => {
    if (!usedHeaders.has(label)) {
      usedHeaders.add(label);
      return label;
    }
    const disambiguated = `${label} (${key})`;
    usedHeaders.add(disambiguated);
    return disambiguated;
  };

  if (config) {
    for (const field of collectAnswerableFields(config)) {
      if (seenKeys.has(field.id)) continue;
      seenKeys.add(field.id);
      headers.push(uniqueHeader(field.label?.trim() || field.id, field.id));
      rowData.push(serializeSurveyValue(responses[field.id]));
    }
  }

  const extraKeys = Object.keys(responses)
    .filter((key) => !seenKeys.has(key))
    .sort();

  for (const key of extraKeys) {
    headers.push(uniqueHeader(EXTRA_KEY_LABELS[key] || key, key));
    rowData.push(serializeSurveyValue(responses[key]));
  }

  return { headers, rowData };
}
