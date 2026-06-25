import { welcomeSurveyConfig } from "./welcome";
import { checkInSurvey } from "./definitions/check-in";

import { gestaoTempoSurvey } from "./definitions/gestao-tempo";
import { preferenciasAprendizadoSurvey } from "./definitions/preferencias-aprendizado";
import { preferenciasReconhecimentoSurvey } from "./definitions/preferencias-reconhecimento";
import { preAnaliseComportamentalSurvey } from "./definitions/pre-analise-comportamental";
import { discSurvey } from "./definitions/disc";
import { desmistificandoCandidaturasSurvey } from "./definitions/desmistificando-candidaturas";
import { revisaoCurriculoSurvey } from "./definitions/revisao-curriculo";

// Career module surveys
import { planoAcordosSurvey } from "./definitions/plano-acordos";
import { planoFase1Survey } from "./definitions/plano-fase1";
import { planoFase2Survey } from "./definitions/plano-fase2";
import { planoFase3Survey } from "./definitions/plano-fase3";
import { planoFase4Survey } from "./definitions/plano-fase4";
import { agendamentoDevolutivaSurvey } from "./definitions/agendamento-devolutiva";

// PDI Surveys
import { pdiFase1Survey } from "./definitions/pdi-fase1";
import { pdiFase2Survey } from "./definitions/pdi-fase2";
import { pdiFase3Survey } from "./definitions/pdi-fase3";
import { pdiFase4Survey } from "./definitions/pdi-fase4";

/**
 * BPlen HUB — Survey Registry (🗂️)
 * Centraliza todas as definições de pesquisa do projeto
 * para serem descobertas pelo Admin e pelo SurveyEngine.
 */
export const surveys = {
  welcome_survey: welcomeSurveyConfig,
  check_in: checkInSurvey,

  "gestao_tempo": gestaoTempoSurvey,
  "preferencias_aprendizado": preferenciasAprendizadoSurvey,
  "preferencias_reconhecimento": preferenciasReconhecimentoSurvey,
  "pre_analise_comportamental": preAnaliseComportamentalSurvey,
  "disc": discSurvey,
  "desmistificando_candidaturas": desmistificandoCandidaturasSurvey,
  "revisao_curriculo": revisaoCurriculoSurvey,

  // Career Planning Surveys
  "survey_plano_acordos": planoAcordosSurvey,
  "survey_plano_fase1": planoFase1Survey,
  "survey_plano_fase2": planoFase2Survey,
  "survey_plano_fase3": planoFase3Survey,
  "survey_plano_fase4": planoFase4Survey,
  "survey_agendamento_devolutiva": agendamentoDevolutivaSurvey,

  // PDI (Posicionamento)
  "survey_pdi_fase1": pdiFase1Survey,
  "survey_pdi_fase2": pdiFase2Survey,
  "survey_pdi_fase3": pdiFase3Survey,
  "survey_pdi_fase4": pdiFase4Survey
};

export const SURVEY_REGISTRY = Object.values(surveys);

export type SurveyRegistry = typeof surveys;
export type SurveyId = keyof SurveyRegistry;

export function getSurveyConfig(id: string) {
  return surveys[id as SurveyId];
}
