import { FormConfig } from "@/types/forms";

/**
 * Configuração: Sugestão de Temas (Forms_Global 🧬)
 */
export const themeSuggestionFormConfig: FormConfig = {
  id: "theme_suggestion",
  kind: "form",
  title: "Sugestão de Temas e Ideias",
  sections: [
    {
      id: "suggestion",
      title: "Voz do Usuário: Temas",
      description: "Qual o seu próximo tema você quer ver na BPlen?",
      fields: [
        {
          id: "suggestion",
          type: "textarea",
          label: "Ideia ou Tema",
          placeholder: "Ex: Inteligência Emocional em Tempos de IA...",
          required: true
        },
        {
          id: "justification",
          type: "textarea",
          label: "Por que isso é importante?",
          placeholder: "Como esse tema ajudaria você hoje?",
          required: true
        },
        {
          id: "channels",
          type: "checkbox",
          label: "Canais de Preferência",
          options: [
            "Instagram",
            "LinkedIn",
            "BPlen Hub",
            "TikTok",
            "WhatsApp",
            "Receber por e-mail"
          ],
          required: true
        }
      ]
    },
    {
      id: "contact",
      title: "Dados de Contato (Opcional)",
      fields: [
        {
          id: "contact_name",
          type: "text",
          label: "Nome Completo",
          placeholder: "Nome"
        },
        {
          id: "contact_email",
          type: "text",
          label: "E-mail",
          placeholder: "seu@email.com"
        },
        {
          id: "contact_phone",
          type: "text",
          label: "WhatsApp (DDD)",
          placeholder: "(DDD) 00000-0000"
        }
      ]
    }
  ],
  submitLabel: "Enviar para Time BPlen",
  driveFolder: "Sugestões de Temas",
  sheetNamePrefix: "Sugestoes_Feed",
};
