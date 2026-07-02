# Mapa 1 — Features e Variações

Status: **completo** — consolidado a partir dos Mapas 2, 3, 4 e 5, todos
fechados. Contagens abaixo são finais, não mais "mínimas".

Referência de universo: **14 páginas** na área hub (`/hub`, `/hub/membro`,
`/hub/membro/journey`, `/hub/membro/journey/[stepId]`, `/hub/step-journey`,
`/hub/membro/gestao_carreira`, `/hub/membro/gestao_agenda`,
`/hub/membro/contratos`, `/hub/membro/checkout/[slug]`,
`/hub/membro/checkout/success`, `/hub/networking`, `/hub/profile_settings`,
`/hub/servicos/[slug]`, `/hub/visao_geral`) e **19 páginas** na área admin.

---

- **Feature pai: Jornada de Membro (Journey Engine)**
  - Variação: Motor de etapas (survey/conteúdo por substep) → `/hub/membro/journey/[stepId]` (1x)
  - Variação: Índice/redirect → `/hub/membro/journey` (1x)
  - Variação: Dashboard alternativo (stepper horizontal, **órfão — sem nenhum link de entrada no código**) → `/hub/step-journey` (1x)
  - Variação: Preview para não-membro pleno → `/hub` via `MemberJourneyHero` (1x)
  - Variação: Sequence Lock (bloqueio por etapa anterior incompleta) → dentro do motor de jornada (1x)
  - Variação: Upsell Gate (não-membro sem acesso) → `JourneyNav` (1x)
  - Variação: Modal específico de Offboarding para não-membro → `JourneyNav` (1x)
  - Variação: Atribuição dinâmica de subcheckpoint pós-evento (admin) → `PostEventWizard` (via `/admin/gestao-agenda`) (1x)

- **Feature pai: Agendamento (Calendar/Booking)**
  - Variação: Agendamento público (leads, sem login) → `/agendar` (1x)
  - Variação: Substep de agendamento dentro da jornada (type `meeting`) → `/hub/membro/journey/[stepId]` (1x)
  - Variação: Painel de cotas 1:1 (visual, não bloqueia booking) → `/hub/membro/gestao_carreira` (1x)
  - Variação: Vista de agenda do membro (somente leitura, sem calendário) → `/hub/membro/gestao_agenda` (1x)
  - Variação: Sincronização Google Calendar → Firestore (admin) → `/admin/agenda` (1x)
  - Variação: Gestão de programação + agenda completa (admin, 2 abas) → `/admin/gestao-agenda` (1x, 2 sub-variações internas: `ProgramacaoResumo` e `AgendaManagementView` sem `hideCalendar`)
  - Variação: Reagendamento/inclusão manual (exclusivo admin) → dentro de `/admin/gestao-agenda` (`PostEventWizard`/`ProgramacaoResumo`) (1x)

- **Feature pai: Avaliações / Assessments (DISC, Tríade do Tempo, VACD, Reconhecimento, Pré-Análise)**
  - Variação: Preenchimento via SurveyEngine → substeps da jornada (múltiplas etapas)
  - Variação: Injeção manual de devolutiva DISC (admin) → `/admin/fs/devolutiva` (via `DevolutivaComportamentalView` + `DiscDevolutivaModal`) (1x)
  - Variação: Toggle de liberação de assessment (admin) → `/admin/fs/devolutiva` **e** `/admin/users` (mesma action `toggleAssessmentRelease`, 2 pontos de entrada) (2x)
  - Variação: Consulta de resultado pelo membro → `/hub/membro/gestao_carreira`, `/hub/visao_geral` (2x)
  - Variação: Analytics agregado (F&S) → `/admin/fs`, `/admin/fs/forms`, `/admin/fs/surveys` (3x)
  - Variação: Preview sandbox de survey/form (sem gravar dado real) → `/admin/fs/forms/preview/[id]`, `/admin/fs/surveys/preview/[id]` (2x)

- **Feature pai: Checkout / Contratação**
  - Variação: Checkout público "resgate gratuito/cupom-100%" (não aciona Mercado Pago) → `/checkout/[slug]` (1x) — comportamento agora confirmado por leitura de `checkout.ts`, ver `BUG-002`
  - Variação: Checkout de membro logado com Mercado Pago real (Preference + Payment Brick) → `/hub/membro/checkout/[slug]` (1x)
  - Variação: Tela de sucesso → `/hub/membro/checkout/success` (1x)
  - Variação: Contrato retroativo (assinatura pós-compra, também sem gateway — `retroactive_bypass`) → `/contrato-retroativo/[slug]` (1x)
  - Variação: Geração de link de contrato retroativo (admin) → `/admin/users` (1x)
  - Variação: Gate de contrato pendente (bloqueio global) → `HubShell`, renderizado nas **14 páginas do hub** (14x)
  - Variação: Webhook de confirmação assíncrona → `POST /api/webhooks/mercadopago` (sem página, 1x)

- **Feature pai: Cotas / Entitlements**
  - Variação: Painel de cotas 1:1 → `/hub/membro/gestao_carreira` (1x)
  - Variação: Gestão de cotas e cota MentoCoach pelo admin → `/admin/users` (1x)
  - Variação: Sistema paralelo "entitlements" → **0x — código órfão confirmado (nenhuma Server Action do módulo tem caller fora do próprio arquivo)**

- **Feature pai: Gestão de Carreira**
  - Variação: CRUD de backlog de tarefas → `/hub/membro/gestao_carreira` (1x)
  - Variação: CRUD de objetivos/metas → `/hub/membro/gestao_carreira` (1x)
  - Variação: Visão unificada cross-feature (jornada + backlog + artefatos + agendamentos) → `/hub/visao_geral` (1x)
  - Variação: Toggle de liberação do módulo (admin) → `/admin/fs/devolutiva` (via `DevolutivaComportamentalView`) (1x)

- **Feature pai: Conteúdo Editorial**
  - Variação: Feed de conteúdo público → `/conteudo` (1x)
  - Variação: Leitura de artigo + avaliação/NPS → `/conteudo/artigo/[id]` (1x)
  - Variação: Gestão de conteúdo (CRUD, publish/despublish, upload de thumbnail) → `/admin/social` (1x)

- **Feature pai: Networking**
  - Variação: Diretório (membros/profissionais/parceiros) → `/hub/networking` (1x)
  - Variação: Cartão de visita profissional público → `/profissionais/[slug]` (1x)
  - Variação: Edição de visibilidade/contatos/hashtags → `/hub/profile_settings` (1x)
  - Variação: Gestão de parceiros (admin, CRUD) → `/admin/partners` (1x)

- **Feature pai: Convites / RSVP**
  - Variação: Fluxo de convite com token único → `/convites/[slug]` (1x)

- **Feature pai: Cupons**
  - Variação: Aplicação de cupom V1/V2 no checkout de membro → `/hub/membro/checkout/[slug]` via `CouponInput` (1x) — ponto de resgate confirmado
  - Variação: Aplicação de cupom no checkout público (implementação própria, fora do `CouponInput`) → `/checkout/[slug]` (1x)
  - Variação: Gestão de cupons V1 e geração de lotes V2 (admin) → `/admin/marketing` (1x, 2 sub-variações internas)

- **Feature pai: Suporte**
  - Variação: Botão flutuante de ticket + WhatsApp → `FloatingHubActions`, renderizado nas **14 páginas do hub** (14x)

- **Feature pai: Catálogo de Serviços / Produtos**
  - Variação: Vitrine pública por audiência → `/servicos/[audience]` (1x)
  - Variação: Detalhe de produto/pacote → `/servicos/[audience]/[slug]` (1x)
  - Variação: Entrega de serviço contratado (delivery) → `/hub/servicos/[slug]` (1x)
  - Variação: Gestão de portfólio com dry-run/diff e sync via arquivos (admin) → `/admin/products` (1x)
  - Variação: Edição/criação de produto individual (admin) → `/admin/products/[id]`, `/admin/products/new` (2x)

- **Feature pai: Perfil / Cadastro**
  - Variação: Identidade / Registro / Profissional (3 abas) → `/hub/profile_settings` (1x, 3 sub-variações internas)

- **Feature pai: Tema (Theme Switcher)**
  - Variação: Seletor de 7 temas, via `HubHeader` → renderizado em **14 páginas do hub + 19 páginas admin = 33x confirmado**
  - Variação: `ThemeSelector.tsx` standalone → **0x — componente órfão, zero imports em todo o projeto** (`BUG-027`)

- **Feature pai: Contratos / Financeiro (trilha do membro)**
  - Variação: "Meus Contratos" (lista de pedidos + status + retry) → `/hub/membro/contratos` (1x)

- **Feature pai: Utilitários Admin**
  - Variação: Migração de welcome survey legado → `/admin/migrate-welcome` (1x)
  - Variação: Recuperação de admin de emergência (rota insegura, sem página) → `/api/admin/recover` (1x — `BUG-003`)
  - Variação: Máquina de QR Codes → `/admin/qrcodes` (1x)
  - Variação: Sandbox de testes de tour guiado → `/admin/sandbox` (1x)
  - Variação: Rotas de debug órfãs (sem página, dado hardcoded) → `/api/ghosts`, `/api/liandra` (2x — `BUG-023`)
  - Variação: Trigger de sincronização externo (sem página, sem guard) → `/api/trigger-sync` (1x — `BUG-024`)

---

## Notas de fechamento

- Todas as contagens marcadas como "mínimas"/"pendente" na versão anterior
  deste mapa foram fechadas com os dados dos Mapas 2, 4 e 5 completos.
- O ponto de resgate de Cupom V2 (antes "não localizado com certeza") está
  confirmado: `CouponInput.tsx`, usado dentro do fluxo de checkout de membro
  (`/hub/membro/checkout/[slug]`), não no checkout público.
- A contagem exata de quantas etapas da jornada usam `SurveyEngine`
  permanece como a única lacuna estrutural deste mapa — depende de detalhar
  `src/config/journey` estágio a estágio, o que não foi feito nesta rodada
  (escopo não solicitado nas Tarefas 1-9 originais; considerar para uma
  eventual Fase 2 mais granular).
