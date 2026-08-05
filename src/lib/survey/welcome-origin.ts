import { SurveyConfig } from "@/types/survey";

/**
 * Injecao dos parceiros na pergunta "Como voce nos conheceu?" da Welcome Survey.
 *
 * Decisao da Gestora (plano secao 4): a captura da indicacao nao tem link nem codigo —
 * o proprio cliente escolhe o nome de quem o indicou, na pergunta que JA existe. Por
 * isso nao ha campo novo nem motor novo: as opcoes do campo `origin` sao resolvidas
 * antes de montar a configuracao enviada a tela.
 *
 * Regra pura de proposito (testavel sem banco e sem React). Pontos que ela protege:
 * - "Outro" continua sendo a ULTIMA opcao, com os parceiros antes dela;
 * - nome de parceiro que colida com uma origem fixa nao duplica a opcao;
 * - sem parceiros ativos, a configuracao volta intacta.
 */
export function withPartnerOriginOptions(
  config: SurveyConfig,
  partnerNames: string[]
): SurveyConfig {
  const nomes = partnerNames.map((n) => n.trim()).filter(Boolean);
  if (nomes.length === 0) return config;

  return {
    ...config,
    steps: config.steps.map((step) => {
      if (step.id !== "step_origin") return step;

      return {
        ...step,
        fields: step.fields.map((field) => {
          if (field.id !== "origin" || !Array.isArray(field.options)) return field;

          const fixas = field.options.filter(
            (opt): opt is string => typeof opt === "string"
          );
          if (fixas.length !== field.options.length) return field;

          const jaExiste = (nome: string) =>
            fixas.some((opt) => opt.trim().toLowerCase() === nome.toLowerCase());

          const novos = nomes.filter((nome) => !jaExiste(nome));
          if (novos.length === 0) return field;

          // "Outro" fecha a lista — os parceiros entram antes dela.
          const ultima = fixas[fixas.length - 1];
          const fechaComOutro = ultima?.trim().toLowerCase() === "outro";

          const options = fechaComOutro
            ? [...fixas.slice(0, -1), ...novos, ultima]
            : [...fixas, ...novos];

          return { ...field, options };
        }),
      };
    }),
  };
}
