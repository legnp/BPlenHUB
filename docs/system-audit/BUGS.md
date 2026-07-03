# Registro de Bugs — Processo de Homologação

Registro vivo de bugs encontrados durante todo o processo (planejamento e
execução). Continua vivo após o fim do processo de homologação, como mecanismo
de manutenção contínua do sistema.

## Protocolo

Todo chat que encontrar um bug registra aqui **antes** de decidir corrigir
inline ou adiar. Bugs que tocam áreas sensíveis (fluxos financeiros, identidade/
sessão, `firestore.rules`, infraestrutura compartilhada, sistema de design —
ver `CLAUDE.md` da raiz) exigem plano + aprovação explícita antes de corrigir,
mesmo que a correção em si seja pequena.

**Nota deste chat de planejamento**: todos os bugs abaixo foram encontrados por
inspeção de código durante o mapeamento (Tarefas 1-6), não durante execução/teste.
Nenhum foi corrigido aqui — este chat só planeja, conforme instrução do Gestor.

## Template por bug

```
### BUG-[ID] Título curto

- Severidade: Crítico / Alto / Médio / Baixo
- Área/fase onde foi achado: [ex: Fase 1 — Página Onboarding]
- Arquivo(s) afetado(s): [caminho(s)]
- Cenário de falha: [input/estado → comportamento errado]
- Status: Aberto / Em Progresso / Corrigido / Adiado (motivo) / Não é bug
- Decisão de execução: Corrigido inline / Precisa plano+aprovação (motivo)
- Commit/PR: —
```

---

## Bugs registrados

### BUG-001 `Support_Tickets` em coleção raiz solta com PII

- Severidade: Alto
- Área/fase onde foi achado: Mapeamento — Mapa 4 (Firestore)
- Arquivo(s) afetado(s): `src/actions/support-ticket.ts:submitSupportTicket`
- Cenário de falha: usuário abre um ticket de suporte → documento gravado em
  `Support_Tickets` (raiz, fora de `User/{matricula}/...`) com `uid, email,
  matricula, userName, description` em texto livre e, opcionalmente, uma
  **imagem em base64 embutida** (print de tela, que pode conter dado sensível
  visível na UI). Viola diretamente a regra do `CLAUDE.md` de dados sensíveis
  ficarem em subcoleções privadas.
- Status: Aberto
- Decisão de execução: Precisa plano+aprovação (fluxo toca dado sensível/PII;
  regra explícita do `CLAUDE.md`)
- Commit/PR: —

### BUG-002 Checkout público não valida que o produto é gratuito/100%-cupom antes de conceder acesso

- Severidade: Médio (revisado após completar Mapa 4 — achado original era só
  "duplicidade de fluxo"; a leitura de `checkout.ts`/`mp-checkout.ts` mostrou
  que a duplicidade é intencional — o achado real é a falta de validação)
- Área/fase onde foi achado: Mapeamento — Mapa 2 e Mapa 4 (Firestore
  checkout/orders)
- Arquivo(s) afetado(s): `src/app/checkout/[slug]/page.tsx`,
  `src/actions/checkout.ts:processServicePurchaseAction`
- Cenário de falha: confirmado que existem **dois fluxos de checkout por
  design** — `/checkout/[slug]` (`checkout.ts`) é um "resgate gratuito/cupom-
  100%" que nunca aciona o Mercado Pago, e `/hub/membro/checkout/[slug]`
  (`mp-checkout.ts`) é o fluxo pago real. O problema: `processServicePurchaseAction`
  **não valida que `product.price === 0` ou que o cupom zera o preço** antes
  de chamar `grantServiceEntitlement` — se chamado com um produto pago e sem
  cupom válido, o código ainda tenta conceder o serviço (só não grava em
  `User_Orders` porque a condição de gravação é `orderId.startsWith("BPLEN-FREE-")`,
  mas isso não impede a concessão em si, dependendo de como `grantServiceEntitlement`
  decide o `orderId`). Não documentado em lugar nenhum do código/UI que este é
  o comportamento intencional.
- Status: Aberto
- Decisão de execução: Precisa plano+aprovação (fluxo financeiro/checkout)
- Commit/PR: —

### BUG-003 `/api/admin/recover` concede admin sem autenticação

- Severidade: Crítico
- Área/fase onde foi achado: Mapeamento — Mapa 4 (achado colateral, API routes)
- Arquivo(s) afetado(s): `src/app/api/admin/recover/route.ts`
- Cenário de falha: requisição `GET` para essa rota com `?email=qualquer@x.com`
  concede `admin: true` ao e-mail passado via query string — **nenhum
  `requireAdmin` nem checagem de sessão** antes de gravar `User_Permissions/access`.
  Se a rota estiver acessível publicamente, é escalação de privilégio trivial.
- Status: **Corrigido** — rota removida (2026-07-02); capacidade de recuperação
  preservada em `scripts/recover-admin.js` (admin SDK, execução local, exige
  service account). Plano aprovado pela Gestora (opção "remover + script local").
- Decisão de execução: Corrigido via branch `security/remove-unauthed-api-routes`
  (validado por `tsc --noEmit` + `next build`).
- Commit/PR: **mergeado** — PR #3 (`ca6b0aa`), commit `5108133` (verificado via `git log origin/main`)

### BUG-004 Vazamento de path interno do Firestore em resposta de produção

- Severidade: Alto
- Área/fase onde foi achado: Mapeamento — Mapa 4 (Firestore, admin actions)
- Arquivo(s) afetado(s): `src/actions/admin-fs.ts:getFSItemDetails` (linha ~219)
- Cenário de falha: campo `nickname` da resposta é preenchido com
  `doc.ref.path` (comentário no código: `// TEMP: Expondo o path para debug`),
  vazando `User/{matricula}/Surveys/{docId}` para o client em vez do apelido
  real do usuário — parece código de debug esquecido em produção.
- Status: Aberto
- Decisão de execução: Precisa plano+aprovação (toca dado de identidade exposto
  a admin, avaliar se há exposição além do painel admin)
- Commit/PR: —

### BUG-005 Checkout de membro não exige `member_area_access` antes de criar preferência de pagamento

- Severidade: Médio
- Área/fase onde foi achado: Mapeamento — Mapa 2 (resumo hub/checkout)
- Arquivo(s) afetado(s): `createPreferenceAction`, `getCheckoutProductAction`
  (fluxo `/hub/membro/checkout/[slug]`)
- Cenário de falha: as actions usam apenas `requireAuth` — um usuário
  autenticado mas sem `member_area_access`/matrícula confirmada pode iniciar
  criação de preferência de pagamento no Mercado Pago.
- Status: Aberto
- Decisão de execução: Precisa plano+aprovação (fluxo financeiro)
- Commit/PR: —

### BUG-006 `getNetworkingDataAction` importa `requireAuth` mas nunca o chama

- Severidade: Médio
- Área/fase onde foi achado: Mapeamento — Mapa 2 (resumo hub/networking)
- Arquivo(s) afetado(s): `src/actions/networking.ts`
- Cenário de falha: a Server Action que lista dados de networking (membros,
  profissionais, parceiros) não tem checagem própria de autenticação — o
  import de `requireAuth` está presente mas não é invocado no corpo da função.
- Status: Aberto
- Decisão de execução: Precisa plano+aprovação (avaliar exposição real antes
  de decidir a correção)
- Commit/PR: —

### BUG-007 Guard da área `/admin` é só client-side

- Severidade: Médio
- Área/fase onde foi achado: Mapeamento — Mapa 2 (área admin)
- Arquivo(s) afetado(s): `src/app/admin/AdminLayoutClient.tsx`
- Cenário de falha: diferente do padrão do hub (`src/app/hub/layout.tsx`, Server
  Component com `verifySignedSession()`), o guard do admin é `useAuthContext()`
  no client (`if (!user || !isAdmin) redirect("/")`) — não há verificação
  server-side antes de enviar o HTML/JS inicial. Mitigado se toda Server Action
  chamada pelas páginas admin tiver `requireAdmin` próprio, mas isso não foi
  confirmado página a página nesta rodada.
- Status: **Corrigido** — PR #1 mergeado na `main` em 2026-07-02
- Decisão de execução: Plano apresentado e **aprovado pela Gestora (2026-07-02)**. **[2026-07-02 / F0-05]** Implementado: `src/app/admin/layout.tsx` virou Server Component async chamando `getServerSession()` + `redirect("/")` se sessão ausente / suspenso / não-admin, espelhando `requireAdmin`; guard client mantido como 2ª camada. Validado por `tsc --noEmit` e `next build` (ambos limpos). Ver `F0-DECISIONS.md#f0-05`.
- Commit/PR: https://github.com/legnp/BPlenHUB/pull/1 (mergeado)

### BUG-008 Chave de cota "1-to-1" com capitalização inconsistente

- Severidade: Alto
- Área/fase onde foi achado: Mapeamento — Mapa 4 (Firestore, quotas)
- Arquivo(s) afetado(s): `src/actions/quotas.ts` (`updateMemberQuotasAction` vs
  `consumeQuotaAction`/`getMemberQuotasAction`)
- Cenário de falha: `updateMemberQuotasAction` normaliza e grava a chave como
  `"1-TO-1"` (uppercase); `consumeQuotaAction`/`getMemberQuotasAction` esperam
  `"1-to-1"` (lowercase-hífen). Uma cota concedida por um caminho pode não ser
  enxergada/consumida corretamente pelo outro.
- Status: Aberto
- Decisão de execução: Precisa plano+aprovação (fluxo financeiro/cotas)
- Commit/PR: —

### BUG-009 `UserBooking.timestamp` provavelmente sempre nulo

- Severidade: Médio
- Área/fase onde foi achado: Mapeamento — Mapa 4 (Firestore, calendar/booking)
- Arquivo(s) afetado(s): `src/actions/calendar-module/queries.ts:getUserBookingsAction`
  (lê `data.timestamp`) vs `booking.ts:bookEventAction`/`rescheduleAttendeeAction`
  (gravam `bookedAt`)
- Cenário de falha: o campo lido nunca corresponde ao campo gravado pelos
  fluxos ativos — `UserBooking.timestamp` deve retornar sempre `null`/vazio
  para reservas feitas pelo fluxo normal. Confirmar com leitura direta no
  Firestore antes de decidir se afeta alguma UI hoje.
- Status: Aberto
- Decisão de execução: Precisa plano+aprovação (toca dado financeiro/booking)
- Commit/PR: —

### BUG-010 Duas implementações divergentes de `adminAddAttendeeAction`

- Severidade: Alto
- Área/fase onde foi achado: Mapeamento — Mapa 4 (Firestore, calendar/booking)
- Arquivo(s) afetado(s): `src/actions/calendar-module/booking.ts` (usa `userUid`
  como ID do doc attendee, `week`/`year` como `number`) vs
  `src/actions/calendar-module/post-event.ts` (usa `matricula` como ID,
  `week`/`year` como `string`) — mesma assinatura de função, comportamento
  diferente
- Cenário de falha: se a versão de `post-event.ts` ainda for alcançável por
  algum caminho (a confirmar — só a de `booking.ts` está no dispatcher
  `calendar.ts`), pode criar dois documentos diferentes para o mesmo par
  evento/usuário, com tipos de campo incompatíveis entre si.
- Status: Aberto
- Decisão de execução: Precisa plano+aprovação (investigar se é código morto
  antes de qualquer remoção — toca dado de booking)
- Commit/PR: —

### BUG-011 Regra de antecedência mínima de agendamento não é reforçada na gravação

- Severidade: Médio
- Área/fase onde foi achado: Mapeamento — Mapa 3 (regras de negócio)
- Arquivo(s) afetado(s): `src/actions/external-booking.ts` (só valida na
  listagem) vs `src/actions/calendar-module/booking.ts:bookEventAction` (não
  revalida)
- Cenário de falha: um client que já tenha um `eventId` de um slot fora da
  janela mínima (3 dias) poderia teoricamente reservar chamando a action
  diretamente, pulando a checagem que só existe na função de listagem de slots.
- Status: Aberto
- Decisão de execução: Precisa plano+aprovação (regra de agendamento)
- Commit/PR: —

### BUG-012 Limite de 1 agendamento/semana declarado mas nunca aplicado

- Severidade: Baixo
- Área/fase onde foi achado: Mapeamento — Mapa 3 (regras de negócio)
- Arquivo(s) afetado(s): `src/config/calendarConfig.ts:MAX_BOOKINGS_PER_WEEK`
- Cenário de falha: constante existe na configuração mas nenhuma Server Action
  a utiliza — regra de negócio declarada porém não enforced (débito técnico,
  não necessariamente um bug funcional ativo).
- Status: Aberto
- Decisão de execução: Precisa plano+aprovação (confirmar se a regra ainda é
  desejada antes de implementar)
- Commit/PR: —

### BUG-013 Consumo de cota 1-to-1 não conectado ao fluxo de agendamento

- Severidade: Médio
- Área/fase onde foi achado: Mapeamento — Mapa 3 (regras de negócio)
- Arquivo(s) afetado(s): `src/actions/quotas.ts:consumeQuotaAction` (nunca
  chamada a partir de `calendar-module/booking.ts`)
- Cenário de falha: a cota de sessões 1-to-1 é hoje só exibida (telemetria/UI)
  — não há trava real impedindo agendar além da cota contratada.
- Status: Aberto
- Decisão de execução: Precisa plano+aprovação (fluxo financeiro/cotas)
- Commit/PR: —

### BUG-014 Import morto de `seedComparisonProductsAction`

- Severidade: Baixo
- Área/fase onde foi achado: Mapeamento — Mapa 2 (página `/servicos/[audience]`)
- Arquivo(s) afetado(s): `src/app/servicos/[audience]/page.tsx`
- Cenário de falha: nenhum — é código morto (import não utilizado no fluxo
  atual, comentário indica que o seed sob demanda foi desativado).
- Status: Aberto
- Decisão de execução: Ajuste pequeno e localizado (arquivo único, sem efeito
  colateral) — pode ser removido sem plano formal quando alguém tocar o arquivo
- Commit/PR: —

### BUG-015 `/hub/step-journey` é página órfã/duplicada

- Severidade: Baixo
- Área/fase onde foi achado: Mapeamento — Mapa 2 (páginas hub)
- Arquivo(s) afetado(s): `src/app/hub/step-journey/page.tsx`
- Cenário de falha: nenhum link, `href` ou `router.push` no projeto aponta para
  esta rota (confirmado por busca textual) — implementa um dashboard de
  jornada alternativo ao de `/hub/membro/journey/[stepId]`, mas está
  inacessível pela navegação normal.
- Status: Aberto
- Decisão de execução: Precisa avaliação antes de remover (confirmar se é
  usada por link direto/QR code externo antes de tratar como morta)
- Commit/PR: —

### BUG-016 `quotas.used` hardcoded em `0`

- Severidade: Médio
- Área/fase onde foi achado: Mapeamento — Mapa 2 (resumo hub/servicos)
- Arquivo(s) afetado(s): `src/actions/delivery.ts`
- Cenário de falha: valor de cota usada aparece fixo em `0` na função de
  entrega de serviço — pode exibir saldo incorreto ao membro.
- Status: Aberto
- Decisão de execução: Precisa plano+aprovação (toca dado de cotas)
- Commit/PR: —

### BUG-017 Full collection scans sem paginação em `admin-fs.ts`

- Severidade: Médio
- Área/fase onde foi achado: Mapeamento — Mapa 4 (Firestore, admin actions)
- Arquivo(s) afetado(s): `src/actions/admin-fs.ts:getAdminFSAnalytics`,
  `getFSItemDetails` (`db.collection("User").get()`, sem `where`/paginação)
- Cenário de falha: custo/latência cresce linearmente com o número de usuários
  cadastrados — risco de performance, não de correção funcional.
- Status: Aberto
- Decisão de execução: Precisa plano+aprovação (mudança de padrão de acesso a
  dado em produção)
- Commit/PR: —

### BUG-018 Coleções órfãs mantidas no código (`entitlements`, `User_JourneyMap`)

- Severidade: Baixo
- Área/fase onde foi achado: Mapeamento — Mapa 4 (Firestore)
- Arquivo(s) afetado(s): `src/actions/entitlements.ts` (+ `src/types/entitlements.ts`),
  `src/actions/effects/welcome-survey.ts` (grava `User_JourneyMap` sem
  consumidor confirmado)
- Cenário de falha: nenhum ativo — são sistemas paralelos sem uso real
  (débito técnico / código morto), mas continuam sendo escritos/mantidos.
- Status: Em Progresso — `entitlements` removida (branch `fix/admin-server-side-guard`); `User_JourneyMap` pendente (gated)
- Decisão de execução: **[2026-07-02 / F0-04]** Avaliação de impacto feita e
  executada em parte. **REMOVIDO**: `src/actions/entitlements.ts` (ação órfã) +
  tipos `UserEntitlement`/`EntitlementStatus` (zero uso externo). Correção da
  suposição inicial: `src/types/entitlements.ts` NÃO era órfão (hospeda
  `MemberQuota`/`MemberQuotaWallet`, usados por `quotas.ts`/`useJourney.ts`) —
  mantido; remoção cirúrgica. Validado por type-check + build. **Pendente/gated**:
  parar escrita de `User_JourneyMap` em `welcome-survey.ts`/`survey-effects.ts`
  (god file) = PR próprio com plano+aprovação. Ver `F0-DECISIONS.md#f0-04`.
- Commit/PR: https://github.com/legnp/BPlenHUB/pull/1 (mergeado — remoção de `entitlements`); parte `User_JourneyMap` ainda aberta

### BUG-019 `updateProfileImageAction`/`deleteProfileImageAction` sem qualquer guard — IDOR confirmado

- Severidade: Alto
- Área/fase onde foi achado: Mapeamento — Mapa 4 (API/Server Actions, grupo B)
- Arquivo(s) afetado(s): `src/actions/profile.ts` (lido e confirmado linha a linha)
- Cenário de falha: `updateProfileImageAction(matricula, base64Image)` e
  `deleteProfileImageAction(matricula)` recebem `matricula` como parâmetro
  direto, **sem `idToken` nem qualquer verificação de sessão** — não há
  `requireAuth`, `requireAdmin` nem checagem de que o `matricula` recebido
  pertence ao usuário que está chamando a action. Um client que chame a action
  passando a matrícula de outra pessoa pode sobrescrever/apagar a foto de
  perfil dela.
- Status: **Corrigido** — adicionado guard de sessão + dono nas duas actions
  (2026-07-02). `requireAuth()` resolve a sessão pelo cookie assinado e bloqueia
  se `session.matricula !== matricula && !session.isAdmin`. Sem mudança de
  assinatura nem no caller (`ProfileIdentityTab`); erro cai no try/catch existente.
- Decisão de execução: Plano aprovado pela Gestora. Corrigido via branch
  `security/fix-profile-idor` (validado por eslint + `tsc --noEmit` + `next build`).
- Commit/PR: **mergeado** — PR #4 (`06becd7`), commit `1374712` (verificado via `git log origin/main`)

### BUG-020 Dezenas de Server Actions com efeito sensível/administrativo sem guard interno próprio

- Severidade: Alto (elevado após completar o inventário de Mapa 4b — o volume
  confirmado é sistêmico, não pontual)
- Área/fase onde foi achado: Mapeamento — Mapa 4 (API/Server Actions, grupos A e B)
- Arquivo(s) afetado(s), confirmados por leitura direta do corpo da função
  (lista não-exaustiva, agrupada por módulo):
  - Jornada: `journey.ts:assignDynamicSubstepAction`/`assignDynamicSubstepToPresentAttendeesAction`
  - Migração/portfólio/upload: `migration-welcome.ts:runWelcomeMigration`,
    `portfolio-commands.ts:syncPortfolioFromFilesAction`,
    `product-sync.ts:uploadProductCoverAction`,
    `upload-to-drive.ts:uploadPostEventDocAction` (só valida `verifyIdToken`
    ad-hoc, não papel de admin)
  - Booking (fluxo inteiro): `calendar-module/booking.ts:bookEventAction`,
    `cancelBookingAction`, `submitEvaluationAction`;
    `calendar-module/post-event.ts:closeEventAction`, `closeAttendeeAction`,
    `updateGlobalProgramacaoRegistryAction`;
    `calendar-module/queries.ts:getUserBookingsAction`, `getEventAttendees`,
    `getUserOneToOneQuotaAction`, `fetchCalendarEvents`
  - Admin CRUD sem guard: `admin/partners.ts:upsertPartnerAction`/`deletePartnerAction`/`getPartnersAction`,
    `admin-assessments.ts:toggleAssessmentRelease`/`getUserAssessments`,
    `admin-forms.ts:getAdminFormsAnalytics`, `admin-surveys.ts:getAdminSurveysAnalytics`
  - Guards condicionais frágeis (só checam se o parâmetro opcional for
    passado): `calendar-module/queries.ts:getSyncedEvents(idToken?)`,
    `getEventNpsDetailsAction(eventId, idToken?)`
  - Identidade: `auth-permissions.ts:fetchUserPermissionsStatus(uid)` recebe
    `uid` sem validar que é o próprio chamador
- Cenário de falha: nenhuma dessas Server Actions valida sessão/papel
  internamente — dependem inteiramente de a UI (página) só expor o botão/fluxo
  para o papel certo. Server Actions do Next.js são endpoints de rede
  reais (não apenas funções client-side): qualquer requisição que conheça a
  assinatura da action pode chamá-la diretamente, pulando a página. Isso
  inclui mutações reais (criar/editar/excluir parceiro, liberar assessment,
  fechar evento, cancelar/avaliar agendamento de qualquer usuário passando
  `matricula`/`userUid` arbitrários).
- Status: **Em Progresso** — lote 1 (booking) mergeado (2026-07-03). Corrigido em
  `src/actions/calendar-module/booking.ts`: `cancelBookingAction` e
  `submitEvaluationAction` ganharam `requireAuth()` + checagem dono-ou-admin
  (fecha 2 IDORs confirmados); `bookEventAction` ganhou guard condicional — fluxo
  de membro (com `matricula`) exige sessão própria/admin, funil de lead público
  (sem `matricula`, com `leadInfo`) permanece aberto. As 2 actions admin do
  arquivo (`adminAddAttendeeAction`, `rescheduleAttendeeAction`) já tinham
  `requireAdmin`. Lotes restantes (abertos): partners/assessments/forms/surveys
  CRUD, journey (`assignDynamicSubstep*`), queries (`getEventAttendees`,
  `getUserBookingsAction`, `getUserOneToOneQuotaAction`, `fetchCalendarEvents`,
  guards condicionais frágeis `getSyncedEvents`/`getEventNpsDetailsAction`),
  migração/portfólio/upload, `auth-permissions.ts:fetchUserPermissionsStatus`.
- Decisão de execução: Padronização em lotes por módulo (padrão canônico do T-02:
  `requireAuth()` + dono-ou-admin). Lote 1 validado por eslint + `tsc --noEmit` +
  `next build`; assinaturas inalteradas (sessão pelo cookie assinado, como no
  BUG-019). Plano+aprovação da Gestora antes de cada lote sensível.
- Commit/PR: **lote 1 mergeado** — PR #8 (`6610167`, squash). Demais lotes pendentes.

### BUG-021 Guard "ad-hoc" divergente do padrão em `upload-to-drive.ts`

- Severidade: Baixo
- Área/fase onde foi achado: Mapeamento — Mapa 4 (API/Server Actions, grupo B)
- Arquivo(s) afetado(s): `src/actions/upload-to-drive.ts`
- Cenário de falha: nenhum funcional — usa `getAdminAuth().verifyIdToken(idToken)`
  diretamente em vez de `requireAuth`/`requireMemberAccess` de
  `@/lib/auth-guards.ts`, criando um segundo padrão de verificação de token
  paralelo ao resto do projeto (débito técnico de consistência).
- Status: Aberto
- Decisão de execução: Ajuste pequeno, mas mexe em upload de arquivo de
  usuário — avaliar junto com F0 antes de unificar
- Commit/PR: —

### BUG-022 `retroactive-contract.ts` cria pedido "aprovado" sem gateway de pagamento

- Severidade: Médio
- Área/fase onde foi achado: Mapeamento — Mapa 4 (API/Server Actions, grupo B)
- Arquivo(s) afetado(s): `src/actions/retroactive-contract.ts:processRetroactiveContractAction`
- Cenário de falha: cria registro em `User_Orders` com `status:"approved"` e
  `gateway:"retroactive_bypass"` sem qualquer cobrança real — aparenta ser
  intencional (contrato retroativo é para serviço já pago por fora), mas isso
  não está documentado/confirmado como regra de negócio aprovada, e o padrão
  se soma a `checkout.ts` (`bplen_free_bypass`) como um terceiro caminho que
  gera pedido "aprovado" sem passar pelo Mercado Pago.
- Status: Aberto
- Decisão de execução: Precisa plano+aprovação (fluxo financeiro) — primeiro
  confirmar com a Gestora se os 2 bypasses (`bplen_free_bypass`,
  `retroactive_bypass`) são intencionais e documentá-los como tal
- Commit/PR: —

### BUG-023 Rotas de debug órfãs em produção com dado hardcoded (`/api/ghosts`, `/api/liandra`)

- Severidade: Alto
- Área/fase onde foi achado: Mapeamento — Mapa 4 (API/Server Actions, grupo A)
- Arquivo(s) afetado(s): `src/app/api/ghosts/route.ts`, `src/app/api/liandra/route.ts`
- Cenário de falha: duas rotas `GET` sem nenhum guard, sem nenhum caller no
  código-fonte (não são usadas por nenhuma página/componente) — parecem
  scripts de debug pessoal esquecidos em produção. `/api/liandra` tem uma
  **matrícula real hardcoded** (`BP-013-PF-260527`) na query, o que sugere que
  qualquer requisição `GET` não autenticada retorna dados de um usuário
  específico. `/api/ghosts` roda uma query hardcoded (`surveyId=="check_in" &&
  status=="completed"`) sem filtro de autorização.
- Status: **Corrigido** — ambas as rotas removidas (2026-07-02). Zero callers no
  `src/` (confirmado); só retornavam dados (não mutavam), então a remoção apenas
  estanca o vazamento.
- Decisão de execução: Corrigido via branch `security/remove-unauthed-api-routes`
  (validado por `tsc --noEmit` + `next build`). Assumido que nenhuma automação
  externa dependia dessas rotas de debug (queries hardcoded).
- Commit/PR: **mergeado** — PR #3 (`ca6b0aa`), commit `5108133` (verificado via `git log origin/main`)

### BUG-024 `/api/trigger-sync` sem guard e sem caller conhecido

- Severidade: Médio
- Área/fase onde foi achado: Mapeamento — Mapa 4 (API/Server Actions, grupo A)
- Arquivo(s) afetado(s): `src/app/api/trigger-sync/route.ts`
- Cenário de falha: rota `GET` sem guard que dispara
  `updateGlobalProgramacaoRegistryAction()` (reescreve o registro global de
  programação). Presumivelmente pensada para cron externo, mas sem segredo
  compartilhado/token — qualquer requisição pode disparar a sincronização.
- Status: **Corrigido** — rota removida (2026-07-03). Confirmado órfã por busca
  exaustiva: zero callers de aplicação, nenhuma lib de cron/agendamento no
  `package.json`, `firebase.json` sem funções agendadas, `.github` sem cron na
  URL, e a Gestora confirmou não haver agendador externo (único externo é a API
  do Google Calendar, que não chama de volta). A capacidade em si permanece: a
  função `updateGlobalProgramacaoRegistryAction` continua sendo chamada
  internamente por `booking.ts` e pelas ações de pós-evento — só a casca HTTP
  pública foi removida.
- Decisão de execução: Removida via branch `security/remove-trigger-sync-route`
  (plano/risco apresentados e aprovados pela Gestora; reversível via git se algum
  chamador externo invisível aparecer). Ver `BUG-031` para a melhoria relacionada.
- Commit/PR: **mergeado** — PR #5 (`69fa151`), commit `50d892c` (verificado via `git log origin/main`)

### BUG-025 Webhook do Mercado Pago sem validação de assinatura/segredo

- Severidade: Médio
- Área/fase onde foi achado: Mapeamento — Mapa 4 (API/Server Actions, grupo A)
- Arquivo(s) afetado(s): `src/app/api/webhooks/mercadopago/route.ts`
- Cenário de falha: a rota confia no `data.id` recebido no corpo da
  notificação e revalida buscando o pagamento diretamente na API do Mercado
  Pago (`paymentClient.get`) — isso mitiga spoofing total (um atacante não
  consegue forjar um pagamento aprovado sem que ele exista de fato no MP),
  mas não segue o padrão recomendado de verificação de assinatura HMAC do
  provedor, o que é mais robusto contra replay/enumeração de `data.id`.
- Status: Aberto
- Decisão de execução: Precisa plano+aprovação (fluxo financeiro/webhook)
- Commit/PR: —

### BUG-026 Fragmentação de implementação de Modal (11 de 13 não reaproveitam `GlassModal`)

- Severidade: Médio
- Área/fase onde foi achado: Mapeamento — Mapa 5 (Design System)
- Arquivo(s) afetado(s): `ContractGateModal`, `SequenceLockModal`,
  `UpsellServiceModal`, `WelcomeRedirectModal`, `CouponTermsModal`,
  `ServiceSelectionModal`, `DiscDevolutivaModal`, `ContentEvaluationModal`,
  `ThemeSuggestionModal`, `NonMemberOffboardingModal` (inline em `JourneyNav.tsx`)
- Cenário de falha: cada um reimplementa backdrop/portal/z-index do zero em
  vez de estender `GlassModal` — 6 valores de `z-index` diferentes e não
  coordenados (`50`, `300`, `500`, `1000`, `9999`, `99999`) criam risco real de
  um modal aparecer atrás de outro se dois dispararem ao mesmo tempo (ex.:
  `ContractGateModal` global vs. `UpsellServiceModal` da jornada).
- Status: Aberto (decisão de Fase 0 tomada — ver F0-01)
- Decisão de execução: Precisa plano+aprovação (sistema de design — Fase 0). **[2026-07-02 / F0-01]** Decidido: `GlassModal` é o modal-base único oficial; converger os 11 modais divergentes em 3 lotes, começando por unificar a escala de z-index (correção prioritária: risco ContractGateModal vs UpsellServiceModal). Implementação gated por lote. Ver `F0-DECISIONS.md#f0-01`.
- Commit/PR: —

### BUG-027 `ThemeSelector.tsx` é componente órfão (não é o seletor de tema real)

- Severidade: Baixo
- Área/fase onde foi achado: Mapeamento — Mapa 5 (Design System)
- Arquivo(s) afetado(s): `src/components/ui/ThemeSelector.tsx`
- Cenário de falha: nenhum — zero imports em todo `src/`, autodescrito no
  código como "Componente de Teste UI". O seletor de tema real e efetivamente
  usado vive em `HubHeader.tsx` (confirmado ativo em hub e admin) — não há
  violação da regra do `CLAUDE.md` sobre tema sempre acionável, apenas código
  morto a limpar.
- Status: Aberto
- Decisão de execução: Ajuste pequeno e localizado — remoção segura quando
  alguém tocar o arquivo
- Commit/PR: —

### BUG-028 Login com Google falha sem fallback quando o popup é bloqueado (`auth/popup-blocked`)

- Severidade: ~~Alto~~ **Baixo** (rebaixado 2026-07-02 após validação — ver
  "Reclassificação" ao final do item; produção loga normalmente, o gap real era
  preview-only)
- Área/fase onde foi achado: Reportado pela Gestora (gap de auth no preview/produção);
  validado por leitura de código nesta sessão. Diagnóstico original no chat `Dev_03`.
- Arquivo(s) afetado(s): `src/hooks/use-auth.ts:44` (`signInWithGoogle` →
  `signInWithPopup`), `src/context/AuthContext.tsx` (`onAuthStateChanged`),
  `next.config.ts:91` (COOP — descartado como causa)
- Cenário de falha: o login federado usa **apenas** `signInWithPopup`, sem
  fallback. Em navegadores/configurações que bloqueiam ou fecham o popup OAuth
  (extensões de privacidade, políticas do Chrome/Edge), o Firebase lança
  `auth/popup-blocked` (também `auth/popup-closed-by-user`/
  `auth/cancelled-popup-request`) e o login **não acontece** — o usuário fica sem
  entrar. Reproduzido em navegador normal (não só na ferramenta de preview
  automatizada), o que caracteriza bug de código real, não limitação de ambiente.
- Validação nesta sessão (confirma o diagnóstico do `Dev_03`):
  - `signInWithPopup` é o único caminho de login (`use-auth.ts:44`); sem
    `signInWithRedirect` nem `getRedirectResult`.
  - `Cross-Origin-Opener-Policy: unsafe-none` está correto (`next.config.ts:91`) —
    causa comum de "popup abre e fecha" já descartada.
  - `syncUserPermissionsOnLogin` só roda no caminho popup (`use-auth.ts:55`); o
    cookie de sessão já é criado no `onAuthStateChanged` (funciona para os dois
    caminhos), mas o sync de permissões, não — por isso um fallback via redirect
    exige mover esse sync para o `AuthContext`.
- Plano de correção proposto (validado, aguardando aprovação — toca
  identidade/sessão): manter `signInWithPopup` como caminho primário e cair para
  `signInWithRedirect` nos erros conhecidos de bloqueio; mover
  `syncUserPermissionsOnLogin` para dentro do `onAuthStateChanged`
  (`AuthContext.tsx`), junto da criação de cookie que já roda ali; adicionar
  `getRedirectResult(auth)` no `AuthContext` para capturar/logar erros do fluxo de
  redirect. Efeito colateral aceito: componentes que fazem
  `await signInWithGoogle()` para retomar um fluxo (ex.: `InvitationSurvey.tsx`,
  `FloatingCTAs.tsx`) não retomam automaticamente no caminho redirect (a página
  recarrega) — melhoria líquida para quem hoje não loga, mas a retomada perfeita
  pós-redirect seria escopo maior (tocaria esses componentes de CTA).
- **Reclassificação (2026-07-02, após validação da Gestora — opção B):** os dados
  de validação mostraram que **o login funciona normalmente em produção**
  (`bplen.com`) via popup; o erro ocorre **apenas no preview** (`*.vercel.app`).
  Logo, o problema real **não** é a ausência de fallback popup→redirect (produção
  não precisa dele), e sim o gap de auth no preview (ver `BUG-030`). O fallback +
  retomada de fluxo continua sendo uma melhoria de **robustez** válida (protege o
  subconjunto raro de usuários com popup bloqueado por extensão), mas deixa de ser
  urgente e **não deve ser implementado agora**: seria um refactor grande em
  ~6 arquivos sensíveis do fluxo de auth para endurecer um caminho que hoje
  funciona em produção — risco desproporcional ao benefício. Reavaliar sob demanda
  (ex.: se surgirem relatos reais de usuários de produção sem conseguir logar).
- Status: Aberto — **rebaixado para robustez/baixa prioridade**; implementação
  adiada (não é a causa do gap reportado). Diagnóstico e plano preservados acima
  para retomada futura, se necessário.
- Decisão de execução: Adiado (motivo: produção não afetada; mudança tocaria área
  sensível sem necessidade atual). Se retomado, segue precisando plano+aprovação.
- Commit/PR: —

### BUG-029 Override de `authDomain` anula o proxy first-party de `/__/auth` (força fluxo cross-domain)

- Severidade: ~~Alto~~ **Baixo** (rebaixado 2026-07-02 — a validação mostrou que
  produção loga normalmente apesar do override; é débito de config confuso, não
  defeito ativo)
- Área/fase onde foi achado: Investigação do gap de auth (BUG-028), nesta sessão
- Arquivo(s) afetado(s): `src/lib/firebase.ts:11-14` (override), `next.config.ts:44-55`
  (proxy que fica inutilizado), `src/env.ts` (`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`)
- Cenário de falha: `next.config.ts` já define um reverse-proxy que serve o auth
  handler do Firebase **first-party** no domínio do app
  (`/__/auth/:path* → bplenhub.firebaseapp.com/__/auth/:path*`), o que tornaria os
  cookies de auth de primeira parte e destravaria popup **e** redirect em
  navegadores que bloqueiam cookies de terceiros. **Porém** `firebase.ts` força
  `authDomain` de `bplen.com`/`www.bplen.com` de volta para
  `bplenhub.firebaseapp.com`, fazendo o SDK falar direto com o domínio do Firebase
  e **ignorar o proxy** — o fluxo continua cross-domain e sujeito ao bloqueio de
  terceiros. É a provável causa raiz do gap de auth em produção; em preview
  (`*.vercel.app`) há um agravante estrutural (ver abaixo).
- Nuance de ambiente:
  - **Produção (`bplen.com`):** remover o override (deixar `authDomain=bplen.com`)
    deve ativar o proxy já existente → auth first-party → popup e redirect
    robustos. Hipótese a validar.
  - **Preview (`*.vercel.app`):** o domínio servido é efêmero e nunca igual ao
    `authDomain` fixo, então o fluxo é cross-domain por natureza — limitação
    conhecida de Firebase Auth + preview da Vercel, provavelmente não 100%
    solucionável só por config. Foco do fix é produção.
- Protocolo de validação (Requer execução humana — Gestora):
  1. Confirmar o valor de `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` no ambiente de
     produção da Vercel (esperado: `bplen.com` ou `www.bplen.com`).
  2. Confirmar no Firebase Console → Authentication → Authorized domains que
     `bplen.com` está autorizado.
  3. Em navegador real afetado, em produção (`bplen.com`), reproduzir o login
     atual e anotar o erro exato.
  4. Experimento controlado (em branch/preview dedicado ou toggle): remover o
     override de `firebase.ts` para `authDomain=bplen.com` e testar se o proxy
     `/__/auth/` resolve o popup/redirect em produção.
- **Validação (2026-07-02):** env de produção `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
  bplen.com` (confirmado), `bplen.com` autorizado no Firebase (confirmado), e
  **login funciona em produção** apesar do override forçar `firebaseapp.com`.
  Portanto o override **não é a causa de nenhum gap ativo** — a hipótese inicial
  de que ele quebrava produção foi refutada. O proxy de `/__/auth/` fica ocioso,
  mas inofensivo. **Não mexer sem causa**: o override provavelmente foi adicionado
  para resolver um 404 real de popup no passado; removê-lo às cegas poderia
  regredir produção, que hoje funciona.
- Status: Aberto — **rebaixado**; débito de config a limpar com cuidado (não
  urgente). Só reavaliar se o fluxo de auth for refatorado (junto de `BUG-028`).
- Decisão de execução: Adiado (produção não afetada; risco de regressão sem
  benefício claro). Se tocado, precisa plano+aprovação (infra de identidade).
- Commit/PR: —

### BUG-030 Autenticação Google não funciona nos previews da Vercel (`*.vercel.app` não autorizado)

- Severidade: Baixo (afeta apenas ambiente de preview/QA; produção não é impactada)
- Área/fase onde foi achado: Investigação do gap de auth (BUG-028/029),
  confirmado pela validação da Gestora (2026-07-02)
- Arquivo(s)/config afetado(s): configuração de "Authorized domains" do Firebase
  Auth; domínios efêmeros de preview da Vercel (`*.vercel.app`); `firebase.ts`
  (`authDomain` fixo)
- Cenário de falha: nos deploys de **preview** da Vercel, o app é servido em um
  domínio efêmero `*.vercel.app` que (a) **não** está na lista de Authorized
  Domains do Firebase Auth e (b) nunca coincide com o `authDomain` fixo. O login
  com Google falha só nesse ambiente — enquanto produção (`bplen.com`, autorizado)
  funciona. É a **causa real** do "gap de auth no preview" reportado pela Gestora,
  e é uma **limitação conhecida** de Firebase Auth + preview da Vercel (URLs
  dinâmicas), não um defeito de código do app.
- Opções de tratamento (nenhuma é código de app crítico):
  1. **Aceitar como limitação documentada** (recomendado se o preview é só para
     inspeção visual): testar fluxos de login em produção ou num staging estável.
  2. **Staging com domínio próprio**: criar um subdomínio estável (ex.:
     `staging.bplen.com`) apontado ao deploy de preview/staging, adicioná-lo aos
     Authorized Domains do Firebase e usá-lo como `authDomain` nesse ambiente —
     aí o login passa a funcionar no staging. Exige configuração de DNS/Vercel/
     Firebase (fora de código de app, decisão da Gestora).
- Status: **Aceito como limitação conhecida** (Gestora escolheu a opção 1 em
  2026-07-02) — não será corrigido; fluxos que exigem login são testados em
  produção, não no preview.
- Decisão de execução: Aceito como risco/limitação documentada (ver "Riscos
  Aceitos" no `00-PLAN.md`). Reabrir só se surgir necessidade recorrente de QA de
  telas logadas antes de produção (aí, avaliar staging com domínio próprio).
- Commit/PR: —

### BUG-031 "Sincronizar Agora" não reconstrói a lista de programação dos membros (melhoria de usabilidade)

- Severidade: Baixo (melhoria de usabilidade / consistência de dados)
- Área/fase onde foi achado: Investigação do BUG-024 (rota `trigger-sync`),
  2026-07-03
- Arquivo(s) afetado(s): `src/actions/calendar-module/sync.ts:syncCalendarToFirestore`,
  `src/app/admin/agenda/page.tsx` (botão "Sincronizar Agora"),
  `updateGlobalProgramacaoRegistryAction` (post-event.ts)
- Cenário: o botão "Sincronizar Agora" do painel admin puxa os eventos do Google
  Calendar para `Calendar_Events`, mas **não** chama
  `updateGlobalProgramacaoRegistryAction`, ou seja, **não reconstrói o
  `Datas_Center/Programacao_Registry`** — a lista denormalizada que os membros
  veem via `getProgramacaoForMemberAction` (usada em `SurveyEngine` e
  `OneToOneBookingModal`). Hoje essa lista só é reconstruída em ações de
  booking/pós-evento. Resultado: após um sync de agenda, a lista do membro pode
  ficar defasada até acontecer um agendamento — sensação de "precisa forçar um
  refresh". (A antiga rota `/api/trigger-sync` era um jeito manual de forçar isso;
  removida no BUG-024.)
- Melhoria proposta: ao final de `syncCalendarToFirestore`, chamar
  `updateGlobalProgramacaoRegistryAction()` para que a lista do membro reflita os
  eventos recém-sincronizados sem depender de um booking posterior. Toca módulo de
  calendário (avaliar impacto/área sensível antes de implementar).
- Status: Aberto (pendência de melhoria)
- Decisão de execução: Pendente — melhoria de usabilidade priorizada pela Gestora
  (2026-07-03); implementar quando a fila de segurança abrir. Precisa avaliação
  (toca `sync.ts` do módulo de calendário).
- Commit/PR: —

---

*Bugs já corrigidos em sessões anteriores a este processo formal (Timestamp em
`getMemberQuotasAction`, endpoint `db-reset`, cotas em `legal.ts`, status
mortos em `visao_geral`, variant em `NarrativeContent`) estão documentados na
memória de projeto do assistente, não neste arquivo.*
