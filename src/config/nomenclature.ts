export const BPLEN_NOMENCLATURE = {
  // --- [GLOBAL] ECOSSISTEMA & NAVEGAÇÃO ---
  navigation: {
    home: "Início",
    member_area: "Área de Membro",
    profile: "Perfil & Configurações",
    networking: "Networking BPlen",
    logout: "Sair",
    logging_out: "Saindo...",
    sync_status: "Sincronizado",
    social_label: "Social Media",

    // Área de Parceiros — rótulos do menu e da alternância de contexto.
    // Só aparecem para quem tem o selo de parceiro.
    partner_area: "Área de Parceiros",
    partnership_section: "Parceria",
    context_label: "Contexto",
    context_member: "Membro",
    context_partner: "Parceiro",
  },

  // --- [PÁGINA: PRIMEIROS PASSOS] (Trilha de Boas-vindas) ---
  primeiros_passos: {
    back_button: "Voltar ao Início",
    
    // Rótulos de Categoria (Badges)
    badge_survey: "O que você precisa saber sobre candidaturas",
    badge_form: "Formulário BPlen",
    badge_content: "Conteúdo Educativo",
    badge_meeting: {
      confirmed: "Sessão Confirmada",
      completed: "Sessão Concluída",
      booking: "Agendamento de Sessão",
    },
    badge_tour: "Tour Guiado BPlen",
    
    // Checkpoints & Bloqueios
    checklist_label: "Checkpoints",
    locked_title: "Conteúdo Bloqueado",
    locked_desc: "Esta parte da jornada será liberada assim que você concluir os passos anteriores.",

    // Instruções Internas (Meio da Tela)
    instructions: {
      welcome_title: "Boas-vindas ao HUB",
      welcome_desc: "Prepare-se para conhecer o seu novo ecossistema de desenvolvimento de carreira.",
      tour_play_label: "Aperte o Play para iniciar o Tour",
      tour_helper_text: "A BPlen preparou um guia narrado para te apresentar todos os recursos do HUB.",
      content_play_label: "Aperte o Play para iniciar",
      form_helper_ready: "Complete as informações necessárias para este estágio.",
      survey_status_done: "100% Concluído",
    },

    // Botões de Ação (CTAs)
    actions: {
      survey_start: "Iniciar",
      form_start: "Iniciar",
      mark_as_done: "Marcar como Concluído",
      start_tour: "Aperte o Play para iniciar o Tour",
      review: "Rever conteúdo",
    }
  },

  // --- [PÁGINA: ÁREA DE MEMBRO] (Dashboard & Jornada Completa) ---
  member_area: {
    hero_title: "Jornada do seu desenvolvimento",
    hero_badge: "Jornada de Membro BPlen",
    hero_action: "Ir para área de membro",
    profiles_section: "Perfil & Assessments",
    comportamental_title: "Análise Comportamental",
    blade_prefix: "Lâmina",
    status_active: "Ativo",
    status_analyzed: "Analisado",
    agenda_title: "Sua agenda BPlen",
    agenda_subtitle: "1 to 1 & Sessões",
    career_module: "Gestão de Carreira",
    development_label: "Em desenvolvimento",

    // Renderizações da Jornada de Membro (Onboarding e Estágios)
    journey: {
      badge_survey: "Passaporte do Membro BPlen",
      badge_form: "Formulário BPlen",
      badge_content: "Conteúdo Educativo",
      badge_meeting: {
        confirmed: "Sessão Confirmada",
        completed: "Sessão Concluída",
        booking: "Agendamento de Sessão",
      },
      badge_tour: "Tour Guiado BPlen",
      
      checklist_label: "Checkpoints",
      locked_title: "Conteúdo Bloqueado",
      locked_desc: "Esta parte da jornada será liberada assim que você concluir os passos anteriores.",

      instructions: {
        welcome_title: "Boas-vindas ao HUB",
        welcome_desc: "Prepare-se para conhecer o seu novo ecossistema de desenvolvimento de carreira.",
        tour_play_label: "Aperte o Play para iniciar o Tour",
        tour_helper_text: "A BPlen preparou um guia narrado para te apresentar todos os recursos do HUB.",
        content_play_label: "Aperte o Play para iniciar",
        form_helper_ready: "Complete as informações necessárias para este estágio.",
        survey_status_done: "100% Concluído",
      },

      actions: {
        survey_start: "Iniciar",
        form_start: "Iniciar",
        mark_as_done: "Marcar como Concluído",
        start_tour: "Aperte o Play para iniciar o Tour",
        review: "Rever conteúdo",
      }
    }
  },

  // --- [ÁREA DE PARCEIROS] (Jornada de Parceria) ---
  // Mesmas chaves da jornada de membro (o renderizador de paradas escolhe o
  // dicionário pelo contexto). Sem isto, a trilha do parceiro exibiria os rótulos
  // de membro — "Passaporte do Membro BPlen" e afins.
  partner_journey: {
    badge_survey: "Check-in de Parceria",
    badge_form: "Cadastro da Parceria",
    badge_content: "Conteúdo da Parceria",
    badge_meeting: {
      confirmed: "Reunião Confirmada",
      completed: "Reunião Concluída",
      booking: "Agendamento de Reunião",
    },
    badge_tour: "Boas-vindas ao Parceiro",
    badge_action: "Próximo Passo",
    badge_contract: "Formalização da Parceria",

    checklist_label: "Checkpoints",
    locked_title: "Etapa Bloqueada",
    locked_desc: "Esta parte da parceria será liberada assim que você concluir os passos anteriores.",

    instructions: {
      welcome_title: "Boas-vindas à Parceria BPlen",
      welcome_desc: "Vamos te apresentar como a parceria funciona por aqui.",
      tour_play_label: "Aperte o Play para iniciar",
      tour_helper_text: "A BPlen preparou um guia rápido sobre a sua área de parceiro.",
      content_play_label: "Aperte o Play para iniciar",
      form_helper_ready: "Complete as informações necessárias para esta etapa.",
      survey_status_done: "100% Concluído",
      action_helper: "Acesse a tela para concluir esta etapa e volte aqui quando terminar.",
      contract_pending: "Documento em preparação",
      contract_pending_desc: "O termo desta etapa ainda não foi disponibilizado. Assim que estiver pronto, ele aparece aqui para leitura e assinatura.",
      contract_signed: "Termo assinado",
      contract_signature_label: "Digite seu nome completo para assinar",
    },

    actions: {
      survey_start: "Iniciar",
      form_start: "Iniciar",
      mark_as_done: "Marcar como Concluído",
      start_tour: "Aperte o Play para iniciar",
      review: "Rever conteúdo",
      open_screen: "Abrir tela",
      sign_contract: "Assinar e Concluir",
    }
  }
};
