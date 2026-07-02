# Mapa 2 — Páginas e Entregas

Status de cobertura: **completo** — área pública/checkout, área hub/membro (9
páginas em detalhe completo + 5 em resumo curto, ver nota) e área admin (19
páginas).

Convenção: **Auth/guard** descreve onde e como o acesso é verificado antes do
conteúdo renderizar. **Entrega** é o que a página produz para o usuário (não é
descrição de UI, é o resultado funcional).

---

## Área pública (sem login)

| Rota | Entrega | Guard |
|---|---|---|
| `/` (home) | Landing institucional (hero, sobre, valores, vitrine de serviços, CTA) — 100% estático, sem dado de backend | nenhum |
| `/servicos` | Segmentação do visitante em 3 públicos (Pessoas/Empresas/Parceiros) | nenhum |
| `/servicos/[audience]` | Lista de produtos do público (preço, parcelamento, PIX), tabela comparativa de pacotes (só `pessoas`); `empresas` mostra bloco "em desenvolvimento" | nenhum |
| `/servicos/[audience]/[slug]` | Detalhe de produto/pacote (descrição, preço, workflow, FAQ, CTA contratar) | nenhum na página; `MatriculaGuard` intercepta o CTA (login → checkout membro) |
| `/profissionais/[slug]` | Cartão de visita digital (bio, vCard, QR code) — dado vem de config estático, não Firestore | nenhum (SSG) |
| `/conteudo` | Feed de conteúdo/artigos ativos com busca/filtro/ordenação | nenhum |
| `/conteudo/artigo/[id]` | Leitura de artigo + formulário de avaliação/NPS | nenhum |
| `/convites/[slug]` | RSVP de evento exclusivo por token único (survey multi-etapa) | login Google exigido a meio do fluxo, não na entrada |
| `/contrato-retroativo/[slug]` | Assinatura digital de contrato retroativo (gera PDF, salva no Drive) | soft-check client + `requireAuth` no server ao assinar |
| `/checkout/[slug]` | Checkout standalone (resumo, cupom, confirmação) — **ver observação de duplicação abaixo** | nenhum na página; `requireAuth` ao aplicar cupom/finalizar |
| `/agendar` | Agendamento público de reunião 1:1 (calendário + formulário) | nenhum — 100% público |
| `/privacidade` | Política de Privacidade (LGPD), estática | nenhum |
| `/termos` | Termos de Uso (Sequence Lock, reembolso, foro), estático | nenhum |

**Observações transversais da área pública:**
- **Não existe `src/middleware.ts`** — não há gating de rota no nível Next.js. Toda proteção é feita no client (hooks condicionando UI/redirect) ou no server dentro das próprias Server Actions (`requireAuth`).
- `/checkout/[slug]` **não reaproveita** nenhum componente de `src/components/checkout/` (CheckoutFlow, PaymentBrick, CouponInput, RegistrationStep, PaymentStatus) — reimplementa cupom/resumo/confirmação manualmente. O "pagamento" ali é texto fixo "Resgate via Faturamento Interno", sem integração Mercado Pago visível. Ver `BUG-002` em `BUGS.md`.
- `/profissionais/[slug]`: dados vêm de `@/config/profissionais` (dicionário hardcoded), não do Firestore — decisão aparentemente deliberada (comentário no código remove FloatingCTAs/SocialSidebar desta rota especificamente).
- `/convites/[slug]`: auto-seed condicional hardcoded para o slug literal `"pre_inauguracao"` acoplado à página de rota — ver observação de hardcoded específico de evento.

---

## Área logada — Hub (membro)

### Detalhado

| Rota | Entrega | Guard |
|---|---|---|
| `/hub` | Home pós-login: força Welcome Survey se `hasCompletedWelcome` falso; senão renderiza `HubHomeView` (com preview de jornada para quem não é membro pleno) | client: `if (!user && !loading) return null` |
| `/hub/membro` | Dashboard unificado de membro (`MemberDashboardView`) | **server-side**: `verifySignedSession()` + `fetchUserPermissionsStatus` — exige `isAdmin \|\| services.member_area_access === true`, senão `redirect("/hub")` |
| `/hub/membro/journey` | Índice — redireciona para `/hub/membro/journey/onboarding` | client redirect, sem verificação própria |
| `/hub/membro/journey/[stepId]` | Motor de jornada: renderiza substep atual (survey/conteúdo), navegação lateral, tour guiado; aplica Sequence Lock e bloqueio por falta de acesso | `telemetry.hasAccess` (redireciona a `/hub/membro` se falso); Sequence Lock bloqueia com tela própria se etapa anterior incompleta |
| `/hub/step-journey` | **Página duplicada/órfã**: dashboard alternativo de jornada (stepper horizontal `JourneyNav` + card central) — mesmo propósito de `/hub/membro/journey/[stepId]` mas implementação diferente | nenhum guard próprio na página (herda do layout) |
| `/hub/membro/gestao_carreira` | Dashboard de Gestão de Carreira: backlog CRUD, objetivos/metas CRUD, painel de cotas 1:1, acordeões de feedbacks/atas/documentos | gate de feature: `careerData?.isCareerPlanningReleased === true`, senão tela "Módulo Bloqueado" |
| `/hub/membro/gestao_agenda` | Vista de agenda do próprio membro (lista de eventos, sem calendário) — reusa `AgendaManagementView` do admin com `hideCalendar` | nenhum guard local — depende do layout `/hub` |
| `/hub/membro/contratos` | "Meus Contratos": lista de pedidos com status e CTA contextual (acessar hub / retry pagamento) | guard próprio explícito: `getServerSession()` + `redirect("/")` se ausente (redundante ao layout) |
| `/hub/visao_geral` | Central unificada cross-feature: cruza jornada + backlog/objetivos (se liberado) + artefatos de atividade + agendamentos em 3 colunas (Próximas/Em Foco/Concluídas) | nenhum guard local — depende do layout; resiliente a membro sem módulo de carreira liberado |

### Resumo curto (detalhe completo pendente para próxima sessão)

| Rota | Entrega (resumo) | Guard (achado-chave) |
|---|---|---|
| `/hub/membro/checkout/[slug]` | Checkout "oficial" do fluxo de membro (fluxo real com Mercado Pago) | `createPreferenceAction`/`getCheckoutProductAction` usam só `requireAuth` — **não exigem `member_area_access` nem matrícula confirmada** antes de criar preferência de pagamento |
| `/hub/membro/checkout/success` | Tela de sucesso pós-pagamento | — |
| `/hub/networking` | Diretório de networking (membros/profissionais/parceiros) | `getNetworkingDataAction` importa `requireAuth` mas **nunca o invoca** — ver `BUG-006` |
| `/hub/profile_settings` | Edição de perfil (identidade/registro/profissional/networking) | herda do layout |
| `/hub/servicos/[slug]` | Entrega de serviço contratado (delivery) | guard mais rígido do hub: exige matrícula vinculada **e** entitlement real (`User_Permissions.services[serviceCode]` ou admin) |

**Observação**: `quotas.used` aparece hardcoded em `0` em `src/actions/delivery.ts` (achado do agente que cobriu essas 5 rotas) — candidato a bug, ver `BUGS.md`.

**Guard estrutural comum a todo o hub**: `src/app/hub/layout.tsx` (Server Component) chama `verifySignedSession()` e faz `redirect("/")` antes de renderizar `HubShell` para toda a árvore `/hub/*` — é a barreira real. `HubShell` renderiza incondicionalmente em todas as páginas: `ContractGateModal` (bloqueia tela inteira se houver contrato pendente de assinatura), `GuidedTourOverlay`, `HubHeader` (contém o seletor de tema, sempre acionável) e `FloatingHubActions` (suporte/bug report).

---

## Área admin

**Guard estrutural**: `src/app/admin/layout.tsx` → `AdminLayoutClient.tsx`, **guard client-side apenas** (`useAuthContext()`: `if (!user || !isAdmin) redirect("/")`). Diferente do padrão do hub, **não há verificação server-side** antes de enviar o JS/HTML inicial — ver `BUG-007`. Nenhuma das 19 páginas abaixo adiciona um guard próprio (nem client nem server) — todas confiam 100% no layout. Duas páginas (`fs/forms`, `fs/surveys`) são Server Components `async` que chamam a Server Action diretamente no render, também sem checagem própria.

| Rota | Entrega | Componentes/Actions principais |
|---|---|---|
| `/admin` | Dashboard com atalhos e 1 métrica real (contagem de eventos "1 to 1" com participantes) | `getSyncedEvents` (`@/actions/calendar`) |
| `/admin/agenda` | Sincronização manual Google Calendar → Firestore, preview/filtro/ordenação dos eventos sincronizados, configuração dos tipos de reunião "1 to 1" | `syncCalendarToFirestore`, `getSyncedEvents` (`@/actions/calendar`), `getOneToOneTypes`/`updateOneToOneTypes` (`@/actions/OneToOneActions`); usa `GlassModal` |
| `/admin/gestao-agenda` | 2 abas: "Gestão de Programação" (`ProgramacaoResumo`) e "Gestão de Agenda" (`AgendaManagementView`, componente compartilhado com a vista de membro) | `getSyncedEvents`; delega a `AgendaManagementView` (`@/components/shared`) e `ProgramacaoResumo`/`PostEventWizard` (`@/components/admin`) |
| `/admin/users` | Gestão central de usuários: papel (role), acessos granulares por serviço, cotas numéricas por serviço, cota de sessões MentoCoach, selo "Profissional BPlen", link/lançamento de devolutiva DISC, contratos assinados, geração de link de contrato retroativo, gatilho de migração de dados legados | `getAdminUsersList`, `updateUserPermissions`, `toggleProfessionalStatusAction`, `updateMentoCoachSessionsQuotaAction` (`@/actions/users-admin`); `getMemberQuotasAction`/`updateMemberQuotasAction` (`@/actions/quotas`); `getUserAssessments`/`toggleAssessmentRelease` (`@/actions/admin-assessments`); `getUserLegalAudits` (`@/actions/legal`); `runWelcomeMigration` (`@/actions/migration-welcome`); `DiscDevolutivaModal` |
| `/admin/products` | "Portfolio Command Center": upload de planilhas/docs (portfólio, anúncios, campanhas) com dry-run de diff antes de aplicar, sincronização via arquivos do repositório (git), listagem/busca de produtos | `getAdminProducts`, `uploadAndDryRunAction`, `syncPortfolioAction` (`@/actions/products`), `syncPortfolioFromFilesAction` (`@/actions/portfolio-commands`) |
| `/admin/products/[id]` | Edição de produto existente via `AdminProductBuilder` | Busca produto **direto pelo SDK client do Firestore** (`doc(db,"products",id)`), não por Server Action — único ponto do admin que lê Firestore direto do client |
| `/admin/products/new` | Criação de novo produto via `AdminProductBuilder` | — |
| `/admin/partners` | CRUD de parceiros (nome, ramo, contatos, foto) | `getPartnersAction`, `upsertPartnerAction`, `deletePartnerAction` (`@/actions/admin/partners`) |
| `/admin/marketing` | Gestão de cupons — 2 abas: V1 (`Coupon`, lista/cria) e V2 (lotes por `batchId`, geração em massa, CPF-locked, termos customizáveis) | `getAdminCouponsList`/`saveCouponAction` (`@/actions/coupons`); `generateCouponBatchAction`/`getAdminCouponsV2Action` (`@/actions/coupon-v2`); `GlassModal` |
| `/admin/social` | CRUD de posts de conteúdo/social (artigos, posts), toggle de status, upload/remoção de thumbnail no Drive | `getSocialPosts`, `deleteSocialPost`, `togglePostStatus` (`@/actions/social`); `uploadSocialThumbnailToDrive`/`deleteSocialThumbnailFromDrive` (`@/actions/social-drive`); `SocialPostForm`, `GlassModal` |
| `/admin/qrcodes` | CRUD de QR Codes (título, link, geração de imagem, upload ao Drive) | `getQRCodesAction`, `deleteQRCodeAction` (`@/actions/qrcode`); `QRCodeForm`, `GlassModal`; renderização via lib `qrcode.react` |
| `/admin/fs` | Dashboard consolidado "F&S" (Formulários & Surveys): stats globais, lista de itens (surveys/forms), detalhe de respondentes por item com busca | `getAdminFSAnalytics`, `getFSItemDetails` (`@/actions/admin-fs` — **contém o vazamento de path do `BUG-004`**) |
| `/admin/fs/forms` | Analytics de formulários operacionais (Forms_Global), stats via `collectionGroup` | `getAdminFormsAnalytics` (`@/actions/admin-forms`) — Server Component `async`, chama a action direto no render |
| `/admin/fs/forms/preview/[id]` | Sandbox de preview de um formulário específico (`FormsEngine`) sem gravar dados reais (mock submit) | `getFormConfig` (`@/config/forms`) |
| `/admin/fs/surveys` | Analytics de surveys/pesquisas (Survey_Global), stats via `collectionGroup` | `getAdminSurveysAnalytics` (`@/actions/admin-surveys`) — Server Component `async` |
| `/admin/fs/surveys/preview/[id]` | Sandbox de preview de uma survey específica (`SurveyEngine`) com submit mockado | `getSurveyConfig` (`@/config/surveys`) |
| `/admin/fs/devolutiva` | Painel de análise comportamental/carreira 360º | `DevolutivaComportamentalView` (`@/components/admin`) |
| `/admin/sandbox` | Atalhos para testar tours guiados (Member Tour, Onboarding Tour) em ambiente real via query params | Nenhuma action — só `router.push` com querystring |
| `/admin/migrate-welcome` | Ferramenta de migração one-shot de dados legados de `User_Welcome` para `User/{mat}/Surveys/welcome_survey` | `runWelcomeMigration` (`@/actions/migration-welcome`) |

**Observação de segurança**: `/admin/products/[id]` é a única página admin que lê Firestore diretamente do client (SDK `firebase/firestore`), sem passar por Server Action — a proteção de leitura recai inteiramente sobre `firestore.rules` para a coleção `products` (não auditado aqui), não sobre `requireAdmin`.
