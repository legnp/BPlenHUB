import { surveys } from "@/config/surveys";
import { forms } from "@/config/forms";

/**
 * BPlen HUB — Registro unificado de instrumentos (F&S).
 *
 * "Instrumento" e o nome de negocio do que pode ser pendurado num checkpoint da
 * jornada de um cliente especifico: uma survey ou um formulario. Os dois registros
 * vivem separados em `src/config`, mas para quem atribui sao a mesma lista.
 *
 * O `referenceId` e a CHAVE do registro, nao um id inventado: e por ela que o
 * `StepRenderer` resolve a configuracao na hora de desenhar o checkpoint
 * (`getSurveyConfig`/`getFormConfig`) e que o motor de conclusao cruzada casa
 * atividades identicas pelo par `type:referenceId`.
 */

export type InstrumentType = "survey" | "form";

export interface InstrumentOption {
  referenceId: string;
  title: string;
  type: InstrumentType;
}

/** Lista unica de instrumentos atribuiveis, ordenada por tipo e depois por titulo. */
export function listInstruments(): InstrumentOption[] {
  const surveyOptions: InstrumentOption[] = Object.entries(surveys).map(([key, config]) => ({
    referenceId: key,
    title: config?.title || key,
    type: "survey",
  }));

  const formOptions: InstrumentOption[] = Object.entries(forms).map(([key, config]) => ({
    referenceId: key,
    title: config?.title || key,
    type: "form",
  }));

  return [...surveyOptions, ...formOptions].sort((a, b) => {
    if (a.type !== b.type) return a.type === "survey" ? -1 : 1;
    return a.title.localeCompare(b.title, "pt-BR");
  });
}

/**
 * Localiza um instrumento pela chave. O tipo e opcional: sem ele, a survey ganha
 * precedencia (os dois registros nao compartilham chave hoje, mas a ordem deixa o
 * comportamento explicito em vez de dependente da iteracao).
 */
export function findInstrument(
  referenceId: string,
  type?: InstrumentType
): InstrumentOption | undefined {
  return listInstruments().find(
    (option) => option.referenceId === referenceId && (!type || option.type === type)
  );
}
