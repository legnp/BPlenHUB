import { showroomFormConfig } from "./showroom";
import { themeSuggestionFormConfig } from "./theme-suggestion";
import { bookingScreeningFormConfig } from "./booking-screening";
import { devolutivaDiscFormConfig } from "./devolutiva-disc";
import { dadosCadastraisForm } from "./definitions/dados-cadastrais";

/**
 * BPlen HUB — Forms Registry
 * Centraliza todas as definicoes de formularios operacionais do projeto.
 */
export const forms = {
  showroom_interest: showroomFormConfig,
  theme_suggestion: themeSuggestionFormConfig,
  booking_screening: bookingScreeningFormConfig,
  devolutiva_disc: devolutivaDiscFormConfig,
  dados_cadastrais: dadosCadastraisForm
};

export const FORMS_REGISTRY = Object.values(forms);

export type FormsRegistry = typeof forms;
export type FormId = keyof FormsRegistry;

export function getFormConfig(id: string) {
  return FORMS_REGISTRY.find(f => f.id === id);
}
