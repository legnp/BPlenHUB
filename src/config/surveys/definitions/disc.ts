import { SurveyConfig } from "@/types/survey";

/**
 * Survey: Análise de Perfil Comportamental (DISC) 🧬
 * Estratégia de Redirecionamento para Portal Externo.
 */
export const discSurvey: SurveyConfig = {
  id: "disc",
  kind: "survey",
  title: "Perfil Comportamental (DISC)",
  description: "Mapeamento de perfil",
  analytics: {
    surveyId: "disc",
    domain: "BEHAVIORAL",
    tags: ["disc", "comportamento", "perfil"]
  },
  policy: {
    editable: false,
    allowReset: false
  },
  submitLabel: "Finalizar Processo DISC",
  completionMessage: "Excelente! Sua participação foi registrada. Nossa equipe analisará os resultados do portal externo e sua devolutiva personalizada será disponibilizada em breve no seu dashboard.",
  steps: [
    {
      id: "intro_disc",
      question: "Perfil Comportamental (DISC)",
      description: "Olá {User_Nickname}! Este diagnóstico visa mapear de forma precisa o seu perfil comportamental através da metodologia DISC, identificando seus principais impulsos de motivação, áreas de talento, estilo de liderança, comunicação e tendências de comportamento sob pressão.\n\n**Tempo estimado:** 10 minutos.\n\n**Instruções Importantes:**\n* Reserve um local silencioso e livre de interrupções para realizar o teste;\n* Uma vez iniciado, não será possível pausar ou retomar a avaliação;\n* O seu progresso não será gravado até a conclusão total do roteiro.",
      nextLabel: "De Acordo",
      fields: []
    },
    {
      id: "portal_bridge",
      question: "Acesso ao Portal de Diagnóstico",
      description: "Para garantir a máxima precisão técnica, utilizamos uma plataforma parceira especializada para esta análise específica.\n\nAo clicar no botão abaixo, você será levado ao portal externo para realizar o seu teste.\n\n**IMPORTANTE:** Após concluir o teste no portal externo, lembre-se de tirar uma captura de tela (print) evidenciando a finalização (garantindo que apareça a barra de pesquisa com a URL e a primeira parte do resultado), retornar a esta aba e anexar a imagem para concluir o processo no BPlen HUB.",
      nextLabel: "Já concluí no Portal",
      fields: [
        {
          id: "disc_portal",
          type: "portal_link",
          required: true
        }
      ]
    },
    {
      id: "confirmacao_final",
      question: "Confirmação e Envio de Evidência",
      description: "Você concluiu com sucesso todas as etapas no portal externo?\n\n**Validação de conclusão:** Para liberar o botão de finalização, tire uma captura de tela (print) da página de conclusão do teste (mostrando a barra de endereços/URL do navegador e a primeira parte do resultado) e anexe-a abaixo. Você pode selecionar o arquivo ou simplesmente copiar a imagem e colar (Ctrl+V) diretamente no campo de upload.",
      fields: [
        {
          id: "disc_completion_evidence",
          type: "evidence_upload",
          required: true
        }
      ]
    }
  ]
};
