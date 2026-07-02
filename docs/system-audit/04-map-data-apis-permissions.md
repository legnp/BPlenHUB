# Mapa 4 — Dados, APIs/Server Actions e Permissões

Status: **completo.** (a) Firestore cobre identidade, permissões, jornada,
cotas, calendário/booking, carreira, networking/convites, conteúdo, QR codes,
produtos/cupons e checkout/orders financeiro. (b/c) API routes e Server
Actions inventariadas por completo (60 arquivos de `src/actions` + 7 grupos de
rotas em `src/app/api`).

---

## a) Firestore — Coleções e Schema Real

### Identidade e Permissões

| Coleção | Schema real (resumo) | Lida/Escrita por | Drift |
|---|---|---|---|
| `_AuthMap/{uid}` | `matricula`, `email`, `updatedAt/healedAt/linkedAt` (FieldValue), `manualLink` | `journey.ts`, `quotas.ts`, `auth-permissions.ts`, `get-user-results.ts`, `survey-effects.ts`, `user-identity.ts`, `AuthContext.tsx` (client), `invitations.ts` | Sem interface TS dedicada — acesso 100% via `.data()?.matricula` sem type guard. `recoveredAt`/`linkedAt`/`createdAt` usam nomes de campo de timestamp diferentes conforme o branch de escrita que gravou por último |
| `User/{matricula}` (doc raiz) | `Authentication_Name`, `User_Name`, `User_Nickname`, `User_Type`, `email`/`User_Email`, `uid`, `hasCompletedWelcome`, `photoUrl`, `lastPhotoUpdate` (string ISO, não Timestamp), `profile{fullName,cpf,birthDate,phone,address,billing,networking,lastRegistrationUpdate}`, `User_Welcome` (legado) | Muitos arquivos — ver `profile*.ts`, `users-admin.ts`, `AuthContext.tsx`, `invitations.ts`, `survey-effects.ts` | `AdminUser` (tipo) é um DTO calculado, não reflete o doc real. **`profile` inteiro (fullName/cpf/address/billing/networking) não tem tipo declarado em `src/types`.** Nome/nickname/email lidos de até 4-7 campos possíveis diferentes (`profile.fullName`, `Authentication_Name`, `User_Nickname`, `nickname`, `User_Welcome.User_Nickname`, `User_Name`, `User_Email`) — schema legado fragmentado |
| `User/{matricula}/User_Permissions/access` | `role` (`UserRole`), `admin` (bool), `services` (`Record<string,bool>`), `metadata{disc_link,maslow_menor_pilar,maslow_maior_pilar,combustiveis_custom[],barreiras_custom[]}`, `grantedAt/grantedReason/updatedBy` | `auth-permissions.ts`, `users-admin.ts`, `career-module.ts`, `AuthContext.tsx` | `AdminUser.metadata` só documenta `disc_link` + index genérico — os demais campos reais (`maslow_*`, `*_custom`) não estão na interface pública. `UserRole` inclui `"suspended"` mas `ALLOWED_ROLES` em `users-admin.ts` nunca permite atribuí-lo via UI |
| `User_Permissions/{uid}` (raiz, **legado**) | `role`, `services`, `onboardStatus`, `migratedToSubcollection` | `auth-permissions.ts` (só fallback de auto-cura) | Chave por `uid`, não `matricula` — confirma migração incompleta para o padrão de subcoleção |
| `User/{matricula}/User_Permissions/quotas` | `uid`, `quotas: Record<string,{total,used,lastUpdated}>`, `mentoCoachSessionsLimit` | `quotas.ts`, `users-admin.ts` | ⚠️ **Bug de case da chave**: `updateMemberQuotasAction` grava `"1-TO-1"` (uppercase); `consumeQuotaAction`/`getMemberQuotasAction` esperam `"1-to-1"` (lowercase-hífen). Duas convenções coexistindo — ver `BUGS.md` |
| `entitlements` (raiz) | `uid`,`productId`,`status`,`acquiredAt`,`expiresAt?`,`progress` | Só `entitlements.ts` (nenhum outro caller) | **Coleção órfã** — sistema de acesso paralelo nunca conectado ao resto do app |

### Jornada

| Coleção | Schema real (resumo) | Lida/Escrita por | Drift |
|---|---|---|---|
| `User/{matricula}/User_Journey/progress` | `matricula`, `lastActiveStepId`, `overallProgress`, `steps:Record<id,{status,completedSubSteps,subStepCompletionDates,dynamicSubSteps,updatedAt}>` | `journey.ts` (get/update/assign) | Campo `updatedAt` gravado no doc raiz mas **ausente da interface `JourneyProgress`**. Cast `as unknown as JourneyProgress` em `journey.ts:482` sem validação |
| `User/{matricula}/User_JourneyMap/progress` (fallback legado) | `currentPhase`,`currentStep`,`overallProgress`,`phases{atracao,qualificacao,venda,pos_venda}` | Escrito só por `welcome-survey.ts` (onboarding); **nenhum leitor confirmado** downstream | Segunda modelagem de jornada (funil de vendas) sem tipo declarado — provável arquitetura abandonada, mas ainda escrita a cada novo onboarding |
| `User/{matricula}/Career_Backlog/{taskId}` | `createdAt`,`title`,`status` | `sync-tools.ts` (leitura), escrita em `career-module.ts` | — |

### Calendário / Booking (módulo com mais drift encontrado)

| Coleção | Schema real (resumo) | Drift |
|---|---|---|
| `Calendar_Events/{eventId}` | `summary,start,end,location,htmlLink,meetingLink,totalCapacity,mentor,theme,slug,registeredCount,lifecycleStatus,postEventCompleted,metrics{presenceCount,npsAvg,reviewsCount},summarySheetId/Url,eventFolderUrl` | `baixadoAt` gravado mas ausente do tipo `GoogleCalendarEvent`; `postponedFromEventId` do tipo é **campo morto** (nunca lido/escrito); `theme` ora `string\|null` ora `undefined`; `metrics` é sobrescrito inteiro em uma função e incrementado via `FieldValue.increment` em outra — dois padrões concorrentes |
| `Calendar_Events/{eventId}/attendees/{id}` | Ver abaixo | ⚠️ **Maior drift do projeto** — ver achado crítico #1 |
| `User/{matricula}/User_Bookings/{eventId}` | `eventId,bookedAt,week,year,category,oneToOneData,attendanceStatus,rating,feedback,evaluatedAt` + campos pós-evento | ⚠️ `getUserBookingsAction` lê `data.timestamp`, mas todo fluxo ativo grava `bookedAt` — `UserBooking.timestamp` provavelmente **sempre nulo em produção** (ver `BUGS.md`) |
| `Datas_Center/Programacao_Registry` (doc único) | `lastUpdated,count,events[]` (array de `ProgramacaoEntry`) | Schema mais bem alinhado do módulo — só o envelope (`lastUpdated`/`count`) não tem tipo |
| `Booking_Proposals/{id}` | `...formData,status,createdAt(string),type,leadId` | **Sem nenhum tipo declarado** — zero type-safety numa coleção recebendo leads externos |
| `Settings/OneToOne` | `types:string[]`, `updatedAt` | — |

**Achado crítico #1 — duas implementações divergentes de `adminAddAttendeeAction`:**
`calendar-module/booking.ts` usa `userUid` como ID do doc de attendee; `calendar-module/post-event.ts` tem uma **segunda função com o mesmo nome** que usa `matricula` como ID e grava `week`/`year` como **string** (a de `booking.ts` usa `number`). Só a de `booking.ts` está no dispatcher `calendar.ts` — a outra pode ser código morto, mas está exportada e usa paths incompatíveis com a "oficial". **Investigar antes de qualquer limpeza.**

### Carreira / Assessments / Resultados

| Coleção | Schema real (resumo) | Drift |
|---|---|---|
| `User/{matricula}/results/{resultId}` (`disc`, `gestao_tempo`, `preferencias_aprendizado`, `preferencias_reconhecimento`, `pre_analise_comportamental`, `check_in`) | `isReleased,lastStatusUpdate,submittedAt,scores{...por assessment},file?` | Dados legados gravados **sem** o wrapper `scores` (direto nos campos-raiz) exigem normalização manual em `get-user-results.ts`. `beneficios_pacote` (dentro de `check_in`) tem **dois formatos coexistentes** (array legado vs `Record<string,BenefitData>`) reconciliados só em runtime |
| `User/{matricula}/Feedbacks`, `/Atas`, `/Shared_Documents` | Campos com defaults `""` (title, content, author, fileUrl, etc.) | Subcoleções privadas corretas; sem Zod parse, tipagem via `doc.data()` implícita |
| `User/{matricula}/profile/networking` | `participation_talent_bank,networking_visibility,sales_pitch,hashtags[],contacts{...}` | **Duplicado intencionalmente** em `User/{matricula}.profile.networking` (denormalização p/ query) — dois `batch.set()` distintos com listas de campo digitadas manualmente 2x, sem schema compartilhado (risco de divergência) |

### Conteúdo / Networking / Convites / QR Codes

| Coleção | Schema real (resumo) | Drift |
|---|---|---|
| `content_posts` | `platform,url,title,summary,thumbnail,publishedAt,isActive,isFeatured,content?,author?,slug?,createdAt/updatedAt` | Tipo `SocialPost` importa `Timestamp` do **SDK client**, mas gravação usa **Admin SDK** `FieldValue.serverTimestamp()` — inconsistência de import de tipo entre SDKs (mitigada na leitura via `serializeTimestamp`) |
| `Partners` (raiz) | `name,description,serviceType,keywords[],photoUrl?,socials{instagram,linkedin,site},isActive` | Dado de negócio (parceiro), não PII de usuário — não viola regra de subcoleção. Cast sem validação em `partners.ts:46` |
| `Invitation_Events/{slug}` | `slug,name,date,time,location,specificMessage,description,isActive,createdAt` | Tipo declara `createdAt?: string`, código grava `FieldValue.serverTimestamp()` (Timestamp) — mitigado por `serializeDoc()` na maioria das leituras, mas não em `sendInvitationRsvpEmailsAction` (cast direto sem serializar) |
| `Invitation_Tokens/{token}` | `token,eventSlug,status,claimedBy,claimedAt,guestName,guestEmail` | **PII em coleção raiz** (`guestName`/`guestEmail` de convidados sem matrícula ainda) — aceitável dado o fluxo de pré-cadastro, mas confirmar `firestore.rules` restringe leitura |
| `qrcodes` (raiz) | `title,link,driveFileId,driveUrl,createdAt` | Sem drift — schema declarado bate com uso real |
| `_internal/counters/user/global` | `count` (incrementado manualmente lendo+somando, **não usa `FieldValue.increment`**), `lastUpdated` | Usado para gerar sequencial de matrícula — lógica crítica de identidade; risco teórico de race condition mitigado por rodar dentro de `runTransaction` |

### Produtos / Cupons (sync via arquivo)

| Coleção | Schema real (resumo) | Drift |
|---|---|---|
| `products` | `slug,...spread do JSON externo,createdAt/updatedAt(string ISO),status` | `createdAt`/`updatedAt` são strings manuais, não `Timestamp` — inconsistente com o resto do projeto. Escrita via spread de `JSON.parse()` **sem validação Zod** — schema não tipado na gravação |
| `marketing_coupons` | `code,...spread do JSON,createdAt/updatedAt(string),usageCount,active` | Mesmo padrão de dado externo não validado |

### Checkout / Pedidos (financeiro)

Existem **dois fluxos de checkout com mecanismos completamente diferentes**,
confirmado por leitura direta dos 3 arquivos:

| Arquivo | Fluxo | Mecanismo |
|---|---|---|
| `src/actions/checkout.ts:processServicePurchaseAction` | Usado por `/checkout/[slug]` (público) | **Não aciona Mercado Pago.** Resolve cupom (V2 com CPF-hash + fallback V1), chama `grantServiceEntitlement` (`@/lib/checkout`) direto, e só grava em `User_Orders` se o `orderId` resultante começar com `"BPLEN-FREE-"` (produto gratuito ou zerado por cupom) — grava com `gateway:"bplen_free_bypass"`, `status:"approved"` direto, sem gateway externo. Dispara e-mail `sendFreeOrderApprovedEmail` |
| `src/actions/mp-checkout.ts:createPreferenceAction` / `processPaymentAction` / `getCheckoutProductAction` | Usado por `/hub/membro/checkout/[slug]` (membro) | **Integração real com Mercado Pago** (`mpClient`, `Preference`/`Payment` do SDK oficial). Cria `Order` com `status:"pending"` e `gateway:"mercadopago"`, cria preferência com `back_urls` para `/hub/membro/checkout/{success,failure,status}` e `notification_url` para `/api/webhooks/mercadopago`. `processPaymentAction` cobra via Payment Brick (checkout transparente) e atualiza status. Dispara `sendOrderRequestedEmail` |

Isso **resolve a ambiguidade do `BUG-002`**: o checkout público (`/checkout/[slug]`) parece ser deliberadamente um "resgate gratuito/cupom-100%", não um checkout pago paralelo — mas isso não estava documentado em lugar nenhum do código nem da UI, e a página não deixa isso explícito ao usuário nem impede tentar um produto pago por esse caminho (`processServicePurchaseAction` não valida `product.price === 0` antes de conceder acesso caso não haja cupom). **Reclassificar `BUG-002`** para refletir esse achado mais preciso.

| Coleção | Schema real (resumo) | Lida/Escrita por | Drift |
|---|---|---|---|
| `User_Orders` (raiz, `USER_ORDERS_COLLECTION`) | `orderId,userId,userEmail,matricula,productId,productSlug,productTitle,productKicker,basePrice,couponCode,appliedDiscount,finalPrice,currency,status,statusDetail,gateway,mpPreferenceId,mpPaymentId,createdAt,updatedAt` | Escrita por `checkout.ts` (bypass gratuito) e `mp-checkout.ts` (fluxo pago); lida por `orders.ts:getUserOrdersAction` | `getUserOrdersAction` busca por **3 queries diferentes** (`userId==uid`, `matricula==matricula`, e um fallback legado `userId==matricula`) — sinal de que já existiram gravações inconsistentes de qual identificador vai em `userId`. `createdAt`/`updatedAt` usam `FieldValue.serverTimestamp()` (consistente aqui, diferente de `products`/`marketing_coupons`) |
| `Coupons_V2` / `Coupon_Batches` (raiz, `COUPONS_V2_COLLECTION`/`COUPON_BATCHES_COLLECTION`) | Cupom: `code,batchId,isRedeemed,cpfHash,isUsedInOrder`; Lote: `batchId,service,discount,quantityTotal,quantityUsed,expiresAfterDays,terms,createdAt` | Lidos por `checkout.ts`/`mp-checkout.ts` (validação no momento da compra) e `coupon-v2.ts` (geração/resgate); geridos pelo admin em `/admin/marketing` | Validação de cupom V2 duplicada quase identicamente em `checkout.ts` e `mp-checkout.ts` (mesmo bloco de ~20 linhas copiado nos dois arquivos) — risco de os dois divergirem com o tempo se um for corrigido e o outro não |

**Rota de webhook confirmada**: `POST /api/webhooks/mercadopago` — recebe notificação assíncrona do Mercado Pago referenciada por `external_reference: orderId` (não lida em detalhe nesta rodada, ver inventário de API routes abaixo).

### Governança — coleções raiz soltas com dado sensível (achado explícito pedido pela tarefa)

| Coleção | Por que é sensível | Situação |
|---|---|---|
| `Support_Tickets` (raiz) | `uid,email,matricula,userName,description` (texto livre) + possível **imagem em base64 embutida** (print de tela do usuário) | **Violação direta** da regra do CLAUDE.md ("dados sensíveis em subcoleções `User/{matricula}/...`"). Comentário no código nomeia a escolha como intencional, mas contradiz a diretriz vigente — ver `BUG-001` |
| `User_Orders` (raiz, `USER_ORDERS_COLLECTION`) | Preço, desconto, `orderId`, `productTitle` associados por campo `matricula` (não por hierarquia de path) | Mesma violação — dado financeiro em coleção raiz solta, filtrado só via `.where()`. Pode ser legado preservado deliberadamente (CLAUDE.md permite mediante avaliação de impacto) — não corrigido aqui, só registrado |
| `Invitation_Tokens` | Nome/e-mail de convidado pré-matrícula | Ver linha acima na tabela de Convites — risco menor, fluxo o exige |

---

## Resumo de achados de schema transversais (para priorizar Fase 0)

1. **Timestamps inconsistentes em quase todo o projeto**: mistura de `Date` nativo, string ISO manual e `FieldValue.serverTimestamp()` para o mesmo tipo de campo (`createdAt`/`updatedAt`/`lastUpdated`), variando por arquivo — sem um padrão único. Isso é o "bug crítico de Timestamp" já citado na memória do projeto como pendência conhecida da onda 3 de limpeza de `any`.
2. **Nenhum uso de `any` explícito** foi encontrado em nenhum dos arquivos lidos nesta rodada — a regra "Zero Any" está sendo respeitada no código-fonte do projeto. O risco real de schema vem de **casts (`as Tipo`) e do retorno `DocumentData` do Admin SDK**, que é estruturalmente `any` mesmo sem aparecer como tal no código.
3. **Dois sistemas de identidade/nome coexistindo** sem fonte única de verdade (`User` raiz tem até 7 campos possíveis para nome/nickname/email).
4. **Duas coleções órfãs confirmadas**: `entitlements` (acesso) e `User_JourneyMap` (jornada) — ambas parecem arquitetura abandonada, ainda sendo escritas ou mantidas no código sem consumidor real.

---

## b) e c) API Routes e Server Actions

Status: **completo** — 7 rotas de API e as ~60 Server Actions de `src/actions/`
inventariadas por leitura direta do corpo de cada função (guard real, não
assumido pelo nome).

### Rotas de API

| Rota | Chamada por | Guard | Integração externa |
|---|---|---|---|
| `GET /api/admin/recover` | Nenhum caller no código — só acessível por URL direta | **Nenhum** — concede `admin:true` a qualquer e-mail da query string | Nenhuma (Firebase Admin) — `BUG-003` |
| `GET /api/docs/[fileId]` | `UserBookings.tsx`, `visao_geral`, `gestao_carreira`, `MemberDashboardView` (via `window.open` com `?token=`) | Valida `token` via `getServerSession(token)` | Google Drive |
| `GET /api/ghosts` | Nenhum caller — rota órfã de debug | **Nenhum** | Nenhuma — `BUG-023` |
| `GET /api/liandra` | Nenhum caller — rota órfã de debug, matrícula hardcoded | **Nenhum** | Nenhuma — `BUG-023` |
| `GET /api/media/[fileId]` | `<img src>` a partir de URLs montadas em `profile.ts`/`product-sync.ts` | Nenhum — público por design (fotos/capas) | Google Drive |
| `GET /api/trigger-sync` | Nenhum caller no código — presumível cron externo | **Nenhum** | Nenhuma — `BUG-024` |
| `POST /api/webhooks/mercadopago` | Mercado Pago (callback externo) | Sem verificação de assinatura HMAC; revalida buscando o pagamento na API do MP (mitigação parcial) | Mercado Pago, Resend, Google Drive/Sheets — `BUG-025` |

### Server Actions — visão por padrão de guard

Em vez de listar as ~60 arquivos linha a linha aqui (ver os relatórios brutos
das sessões de pesquisa para o detalhe função-a-função), esta tabela resume o
padrão de guard encontrado, que é o dado acionável para a Fase 0/Track T-02:

| Padrão de guard | O que significa | Exemplos confirmados |
|---|---|---|
| `requireAuth(idToken)` real | Padrão correto para ação de usuário autenticado | `checkout.ts`, `mp-checkout.ts`, `coupons.ts`, `coupon-v2.ts:applyCouponV2Action`, `delivery.ts:getServiceDeliveryDataAction`, `orders.ts`, `profile-professional.ts`, `profile-registration.ts`, `calendar-module/queries.ts:getProgramacaoForMemberAction` |
| `requireAdmin(idToken/adminToken)` real | Padrão correto para ação administrativa | `users-admin.ts` (todas), `products.ts` (mutações), `social.ts` (mutações), `social-drive.ts`, `qrcode.ts`, `coupon-v2.ts`/`coupons.ts` (admin), `admin-devolutiva.ts`, `admin-fs.ts`, `OneToOneActions.ts:updateOneToOneTypes`, `submit-devolutiva.ts`, `calendar-module/sync.ts`, boa parte de `calendar-module/post-event.ts` e `booking.ts` (ações de admin), `career-module.ts` (parte admin), `admin/sync-tools.ts` |
| Guard próprio via cookie de sessão (`verifySignedSession`/`getServerSession`) | Padrão correto, usado fora do esquema idToken | `auth-session.ts`, `support-ticket.ts`, `activity-artifacts.ts` |
| Guard combinado dono-ou-admin (`session.matricula===matricula \|\| isAdmin` + entitlement) | Padrão correto e mais granular | `career-module.ts:checkAuthAndGetDb` (usado por todas as funções de backlog/objetivos) |
| **Nenhum guard — recebe identificador (`uid`/`matricula`) direto do client** | Ponto de atenção sistêmico — ver `BUG-019`, `BUG-020` | `profile.ts` (as 2 funções, IDOR confirmado), todo o fluxo de `calendar-module/booking.ts`/`queries.ts` (exceto as 3-4 já listadas como admin/auth), `admin/partners.ts` (as 3 funções, incluindo mutações), `admin-assessments.ts`, `admin-forms.ts`, `admin-surveys.ts`, `journey.ts:assignDynamicSubstep*`, `migration-welcome.ts`, `portfolio-commands.ts`, `product-sync.ts:uploadProductCoverAction`, `external-booking.ts` (público por design, aceitável), `entitlements.ts` (irrelevante — código órfão), `auth-permissions.ts:fetchUserPermissionsStatus` |
| Guard condicional frágil (`idToken?` opcional — só valida se fornecido) | Ponto de atenção — fácil de contornar omitindo o parâmetro | `calendar-module/queries.ts:getSyncedEvents`, `getEventNpsDetailsAction` |
| Guard ad-hoc paralelo (`getAdminAuth().verifyIdToken()` direto, não usa `auth-guards.ts`) | Funciona, mas inconsistente com o resto do projeto | `upload-to-drive.ts` (as 2 funções) — `BUG-021` |

### Integrações externas — onde cada uma é acionada

| Integração | Acionada por (amostra representativa) |
|---|---|
| **Mercado Pago** | `mp-checkout.ts` (criação de preferência, pagamento transparente), `/api/webhooks/mercadopago` (callback) |
| **Resend (e-mail)** | `invitations.ts`, `checkout.ts`/`mp-checkout.ts` (confirmação de compra), `calendar-module/booking.ts`/`post-event.ts` (confirmação/cancelamento/presença/ausência de agendamento), `coupon-v2.ts`, `external-booking.ts`, `products.ts:registerFaqQuestionAction` |
| **Google Drive** | `profile.ts`, `product-sync.ts`, `admin/partners.ts`, `social-drive.ts`, `qrcode.ts`, `upload-to-drive.ts`, `legal.ts:generateContractPdf`, `coupon-v2.ts` (aceite de termos), `submit-devolutiva.ts`, `admin/sync-tools.ts` |
| **Google Sheets** | `form-effects.ts`, `effects/*.ts` (todos os efeitos de survey), `product-sync.ts`, `social-drive.ts` (backup de conteúdo), `calendar-module/post-event.ts:generateEventSummarySheetAction`, `admin/sync-tools.ts` |

### Achados adicionais relevantes desta parte

- **Duas rotas de webhook/automação órfãs** (`/api/ghosts`, `/api/liandra`) e
  uma terceira sem caller conhecido (`/api/trigger-sync`) — ver `BUG-023`/`BUG-024`.
- **Server Actions completamente órfãs** (sem nenhum caller em `src/app`,
  `src/components`, `src/hooks`): `entitlements.ts` (inteiro, já sinalizado no
  Mapa 4a como coleção órfã), `admin/sync-tools.ts:triggerRetroactiveDriveSyncAction`,
  `delivery.ts:getMyActiveServicesAction`, `seed-products.ts:seedInitialProductsAction`,
  `survey-effects.ts:getUserMetadata`, as 5 funções `get*Result` de
  `get-user-results.ts`, `member-area.ts:validateMemberAreaAccess`.
- **Dispatcher `calendar.ts`**: é um puro reexport de `queries.ts`/`sync.ts`/
  `booking.ts`/`post-event.ts` — não adiciona nem remove guard, então o guard
  real de cada função de calendário está nos arquivos-fonte, não no dispatcher.
- **`post-event.ts` tem uma segunda `adminAddAttendeeAction`** duplicada da de
  `booking.ts` (já registrado como `BUG-010`) — confirmado aqui que o
  dispatcher `calendar.ts` reexporta a versão de `booking.ts`, reforçando que a
  de `post-event.ts` é código morto/duplicado a ser investigado.
