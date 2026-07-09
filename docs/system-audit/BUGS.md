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
- **[CONFIRMADO por leitura, 2026-07-09 / F1-02]:** `grantServiceEntitlement`
  (`src/lib/checkout.ts`) concede o serviço (entitlement + cotas + selo condicional)
  **sem** verificar que o preço efetivo é zero. Como `processServicePurchaseAction` é
  `"use server"` (endpoint real), um chamador direto com o slug de um produto **pago**
  e sem cupom ganhava o serviço de graça; a página pública **órfã** `/checkout/[slug]`
  (nenhum `href`/`push` aponta para ela — todo roteamento vai para `/hub/checkout`)
  fazia o mesmo pela URL. O único gate era client-side no `CheckoutFlow`
  (`finalPrice===0`), que o servidor não pode assumir.
- Status: **Corrigido** — 2026-07-09 (PR #48). Decisões da Gestora: (1) **trava de
  preço server-side** na `processServicePurchaseAction` — recalcula `finalPrice =
  max(0, price − desconto de cupom válido)` e recusa se > 0 (não quebra o fluxo grátis
  legítimo: produto price 0 ou cupom-100% → finalPrice 0 → passa); (2) **remoção da
  página órfã** `/checkout/[slug]` (page + layout) — rota morta, a ativação grátis já
  acontece no fluxo de membro `/hub/checkout` via `CheckoutFlow`. Validado: eslint (0
  erros), test 52/52, tsc, build; `/checkout/[slug]` retorna 404 ao vivo. Conferência
  do fluxo logado em produção (BUG-030).
- Decisão de execução: Plano+decisão apresentados e **aprovados pela Gestora**
  (2026-07-09). Corrigido via branch `fix/f1-02-bug002-checkout-price-guard`.
- Commit/PR: **mergeado** — PR #48 (`c0f1459`, squash).

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

- Severidade: ~~Alto~~ **Baixo** (rebaixado 2026-07-04 após avaliação de
  exposição — ver abaixo: action guardada por `requireAdmin` e caller único
  admin, sem exposição além do painel; é bug funcional + disclosure mínimo de
  schema a admins autenticados, não vazamento a papel indevido)
- Área/fase onde foi achado: Mapeamento — Mapa 4 (Firestore, admin actions)
- Arquivo(s) afetado(s): `src/actions/admin-fs.ts:getFSItemDetails` (linha ~219)
- Cenário de falha: campo `nickname` da resposta é preenchido com
  `doc.ref.path` (comentário no código: `// TEMP: Expondo o path para debug`),
  vazando `User/{matricula}/Surveys/{docId}` para o client em vez do apelido
  real do usuário — parece código de debug esquecido em produção.
- Avaliação de exposição (2026-07-04, por leitura): a action tem `requireAdmin()`;
  caller **único** é `src/app/admin/fs/page.tsx` (página admin, sob o guard
  server-side do F0-05); **sem exposição além do painel admin**. O `matricula` do
  path já vinha no mesmo objeto — o extra vazado era só a estrutura interna de
  coleção + docId, a admins autenticados. Ramo de `form` do mesmo arquivo já usava
  o apelido correto (`uInfo.nickname`); só o ramo de `survey` tinha o path de debug.
- Status: **Corrigido** — 2026-07-04. Trocado `doc.ref.path` por `uInfo.nickname`
  (`User_Nickname`, fonte canônica de display name — F0-03), espelhando o ramo de
  form; restaura o apelido na lista de respondentes e na busca do painel. Não
  afeta telas de usuário (função exclusiva do painel admin de analytics).
  Aproveitou para remover a função morta `configId()` (nunca referenciada em todo
  o `src`) e um `prefer-const` pré-existente.
- Decisão de execução: Plano+avaliação de exposição apresentados e **aprovados
  pela Gestora** (2026-07-04, incluindo o rebaixamento de severidade e a remoção
  do `configId` morto). Corrigido via branch `security/admin-fs-path-leak`
  (validado por `tsc --noEmit` + `next build` + eslint do arquivo).
- Commit/PR: **mergeado** — PR #17 (`f1a69f1`, squash).

### BUG-005 Checkout de membro não exige `member_area_access` antes de criar preferência de pagamento

- Severidade: Médio
- Área/fase onde foi achado: Mapeamento — Mapa 2 (resumo hub/checkout)
- Arquivo(s) afetado(s): `createPreferenceAction`, `getCheckoutProductAction`
  (fluxo `/hub/membro/checkout/[slug]`)
- Cenário de falha: as actions usam apenas `requireAuth` — um usuário
  autenticado mas sem `member_area_access`/matrícula confirmada pode iniciar
  criação de preferência de pagamento no Mercado Pago.
- Análise (2026-07-04, por leitura): a premissa original (exigir
  `member_area_access`) é **[HIPÓTESE refutada]** — seria **circular**: o
  `member_area_access` é o entitlement que a compra **concede**, não pré-requisito
  (doc do `requireMemberAccess` confirma que nem admin herda; o `requireAuth`
  cita "ex: Checkout" como caso de uso). Gatear o checkout por ele quebraria o
  funil de entrada de novos membros. **O `requireAuth`-only é intencional**
  (mesma categoria do BUG-002). O único endurecimento defensável, sem quebrar o
  funil, é rastreabilidade: fechar o caso `"NAO_MAPEADA"`.
- Mapa do fluxo (confirma segurança do fix): a matrícula é gerada na **abertura
  do RegistrationStep** (`FormsEngine` → `resolveUserIdentity("dados_cadastrais")`
  no mount → `BP-{seq}-{tipo}-{AAMMDD}` via contador atômico), **antes** de
  `createPreferenceAction`/`processPaymentAction`. Os 3 fluxos de geração de
  matrícula: `welcome_survey` (1º acesso), `dados_cadastrais` (checkout) — ambos
  via `resolveUserIdentity` — e `claimInvitationTokenAction` (convite).
- Status: **Corrigido** — 2026-07-04. `createPreferenceAction` e
  `processPaymentAction` passaram de `requireAuth` para `requireMatricula` (toda
  ordem rastreável a uma matrícula, fim do `NAO_MAPEADA`); `getCheckoutProductAction`
  mantido em `requireAuth` (roda antes do RegistrationStep). Nenhum usuário
  legítimo barrado (matrícula já existe quando o guard entra).
- Decisão de execução: Mapeamento + plano apresentados e **aprovados pela Gestora**
  (2026-07-04, optou pela opção B — `requireMatricula` para rastreabilidade, em
  vez de aceitar como está). Corrigido via branch
  `security/member-checkout-require-matricula` (validado por `tsc --noEmit` +
  `next build` + eslint). Não é correção de vulnerabilidade, e sim de
  rastreabilidade fiscal — fecha o último item do T-02.
- Commit/PR: **mergeado** — PR #19 (`ba447df`, squash).

### BUG-006 `getNetworkingDataAction` importa `requireAuth` mas nunca o chama

- Severidade: Médio
- Área/fase onde foi achado: Mapeamento — Mapa 2 (resumo hub/networking)
- Arquivo(s) afetado(s): `src/actions/networking.ts`
- Cenário de falha: a Server Action que lista dados de networking (membros,
  profissionais, parceiros) não tem checagem própria de autenticação — o
  import de `requireAuth` está presente mas não é invocado no corpo da função.
- Avaliação de exposição (2026-07-04, por leitura): caller **único** é
  `src/app/hub/networking/page.tsx` (página do hub, já atrás do guard server-side
  do `hub/layout.tsx`); adicionar `requireAuth()` não afeta o membro logado, só
  fecha o acesso direto por rede. A feature de networking é, **por design**, um
  espaço de conexão entre usuários do sistema — dados de um membro (foto, perfil,
  contatos, CV, portfólio) devem ser consumíveis por outros membros, com o dono
  controlando via painel próprio o que aparece (opt-in `networking_visibility` +
  flags por campo). O guard preserva isso: exige apenas que o solicitante seja um
  usuário logado; não altera quem aparece nem os campos retornados.
- Status: **Corrigido** — 2026-07-04. `await requireAuth()` como 1ª linha do try
  (padrão canônico do T-02); chamador não autenticado cai no catch → retorno
  seguro `{success:false,data:[]}`, já tratado pela página. Removido também o
  import morto `resolveMatricula` (não usado no arquivo).
- Decisão de execução: Avaliação de exposição + plano apresentados e **aprovados
  pela Gestora** (2026-07-04, que confirmou a intenção de design da feature de
  networking). Corrigido via branch `security/networking-auth-guard` (validado por
  `tsc --noEmit` + `next build` + eslint do arquivo).
- Commit/PR: **mergeado** — PR #18 (`8f8d15d`, squash).
- Achado colateral (fora do escopo deste bug, a investigar): a action retorna
  `contacts` e URLs de CV/portfólio **inteiros**, incluindo itens que o dono
  marcou como não-visíveis (`visible:false`/flags), aparentemente filtrados só no
  client — **[HIPÓTESE]** de que valores ocultos trafegam para o browser de outros
  membros, contrariando o controle do dono. Não confirmado no componente de render;
  a investigar/registrar como bug próprio após o fechamento do T-02.

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
- Status: **Corrigido** — 2026-07-07 (F1-01). Import removido de
  `servicos/[audience]/page.tsx`. **Achado colateral:** com o import removido, a
  ação `src/actions/seed-comparison-products.ts` fica **totalmente órfã** (zero
  callers) — é uma server action que **grava produtos** no Firestore sem guard;
  a remoção do arquivo em si foi deixada para decisão da Gestora (financeiro-
  adjacente, fora do escopo do fix de import). Ver `BUG-039`.
- Decisão de execução: Ajuste pequeno e localizado (arquivo único, sem efeito
  colateral) — removido junto da leva F1-01. Validado por tsc + build + preview.
- Commit/PR: **mergeado** — PR #26 (`ecfc93d`, squash).

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
- Status: **Corrigido** — `entitlements` removida (PR #1) e `User_JourneyMap`
  consolidado no v3 e removido de todos os clientes (Ações 1a/2/1b). Resíduo único:
  a referência obsoleta do networking a um campo `User_JourneyMap` inexistente —
  rastreada à parte no **BUG-033** (Fase 1). Detalhe:
  **consolidação concluída** — duas subcoleções redundantes de
  jornada: `User_Journey/progress` (v3, canônico, motor em `journey.ts`) e
  `User_JourneyMap/progress` (legado, só escrito pelo welcome, só lido como fallback
  no `admin-devolutiva`). Plano de consolidar no v3 e apagar o legado (aprovado pela
  Gestora, 2026-07-04). **Ação 1a mergeada (PR #22)**: `welcome-survey.ts` parou de
  escrever o `User_JourneyMap`. **Double-check de preservação feito**: o antigo
  `capturedData` era desnormalização — `userType`/`nickname` têm fonte em
  `User_Type`/`User_Nickname` (doc do User) e `origin`/`demand`/`topics` na resposta
  crua do survey (`Surveys/welcome_survey.data`); nada se perde. **Ação 2 — script entregue (PR #23) e EXECUTADA (2026-07-04):**
  `scripts/migrate-journeymap-cleanup.js` (LOCAL, Admin SDK; flag `--include-sem-v3`
  add. no PR #24). Migração rodada com aprovação da Gestora, com dry-run antes:
  **5 clientes migrados** (`BP-005`/`011`/`012` "both" + `BP-013`/`015` só-legado,
  incluídos por decisão da Gestora — opção b), cada doc com **backup** em
  `scratch/journeymap-backups/` antes de apagar. Dry-run final confirma **0
  `User_JourneyMap` restante**. Sem perda de dados (capturedData preservado em
  `User_Type`/`User_Nickname` + `Surveys/welcome_survey.data`, e nos backups).
  **Ação 1b concluída (PR #25):** fallback morto do `User_JourneyMap` removido do
  `admin-devolutiva` (passa a usar só o v3). Consolidação completa no código; só
  resta a nomenclatura obsoleta do networking, que segue no **BUG-033** (exige
  desnormalizar o estágio no doc User).
- Decisão de execução: **[2026-07-02 / F0-04]** Avaliação de impacto feita e
  executada em parte. **REMOVIDO**: `src/actions/entitlements.ts` (ação órfã) +
  tipos `UserEntitlement`/`EntitlementStatus` (zero uso externo). Correção da
  suposição inicial: `src/types/entitlements.ts` NÃO era órfão (hospeda
  `MemberQuota`/`MemberQuotaWallet`, usados por `quotas.ts`/`useJourney.ts`) —
  mantido; remoção cirúrgica. Validado por type-check + build. **Pendente/gated**:
  parar escrita de `User_JourneyMap` em `welcome-survey.ts`/`survey-effects.ts`
  (god file) = PR próprio com plano+aprovação. Ver `F0-DECISIONS.md#f0-04`.
- Commit/PR: PR #1 (`entitlements`); **PR #22** (Ação 1a: parar de escrever);
  **PRs #23/#24** (Ação 2: script de migração + flag); **PR #25** (`adda6e9` — Ação
  1b: remover fallback). Migração executada em 2026-07-04. BUG-018 fechado.

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
- Status: **Corrigido** — 7 lotes mergeados (2026-07-03), padrão canônico do T-02
  aplicado em todos os módulos identificados no Mapa 4b.
  - **Lote 1 (booking)** em `src/actions/calendar-module/booking.ts`:
    `cancelBookingAction` e `submitEvaluationAction` ganharam `requireAuth()` +
    checagem dono-ou-admin (fecha 2 IDORs confirmados); `bookEventAction` ganhou
    guard condicional — fluxo de membro (com `matricula`) exige sessão própria/
    admin, funil de lead público (sem `matricula`, com `leadInfo`) permanece
    aberto. As 2 actions admin do arquivo (`adminAddAttendeeAction`,
    `rescheduleAttendeeAction`) já tinham `requireAdmin`.
  - **Lote 2 (CRUD admin)** — `requireAdmin()` em `src/actions/admin/partners.ts`
    (`getPartnersAction`/`upsertPartnerAction`/`deletePartnerAction`) e
    `src/actions/admin-assessments.ts` (`getUserAssessments`/
    `toggleAssessmentRelease`). Callers 100% admin; `getPartnersAction` não afeta
    a vitrine de parceiros do membro (via separada, `getNetworkingDataAction`).
  - **Lote 3 (analytics admin)** — `requireAdmin()` em
    `src/actions/admin-forms.ts:getAdminFormsAnalytics` e
    `src/actions/admin-surveys.ts:getAdminSurveysAnalytics` (leituras agregadas
    via `collectionGroup` que expunham contagem/timestamps de respostas de todos
    os usuários). Callers 100% admin (`admin/fs/forms`, `admin/fs/surveys`).
  - **Lote 4 (queries do calendário)** em `src/actions/calendar-module/queries.ts`:
    `getUserBookingsAction`/`getUserOneToOneQuotaAction` ganharam `requireAuth()` +
    dono-ou-admin (fecham 2 IDORs de leitura — bookings/cota de qualquer membro);
    `getEventAttendees`/`getEventNpsDetailsAction` ganharam `requireAdmin()`
    (a 2ª tinha guard condicional frágil `if (idToken)` que nunca disparava, e a
    1ª vazava PII de inscritos — telefone/foto); `getSyncedEvents`/
    `fetchCalendarEvents` ganharam `requireAuth()` (membro e admin listam eventos).
    A chamada aninhada `getUserBookingsAction`→`getSyncedEvents` roda no mesmo
    request autenticado, passa sem duplo-throw.
  - **Lote 5 (journey)** em `src/actions/journey.ts` (as 6 server actions do
    arquivo estavam sem guard): `getJourneyProgressAction`/`updateJourneySubStepAction`
    ganharam `requireAuth()` + dono-ou-admin (`session.uid !== uid`) — fecham
    IDOR de leitura+lazy-write / mutação de progresso de qualquer membro por uid;
    `assignDynamicSubstepAction`/`assignDynamicSubstepToPresentAttendeesAction`
    (as citadas originalmente aqui) ganharam `requireAdmin()`;
    `getJourneyStagesAction`/`getStandaloneStageAction` ganharam `requireAuth()`
    (catálogo, callers 100% autenticados). `useJourney` só chama com uid real
    (nunca "guest", confirmado por leitura). `applyCrossCompletionSweep` é helper
    interno não-exportado, sem guard.
  - **Lote 6 (upload/portfólio)** — `requireAdmin()` em
    `migration-welcome.ts:runWelcomeMigration`,
    `portfolio-commands.ts:syncPortfolioFromFilesAction`,
    `product-sync.ts:syncProductToDriveAction`/`uploadProductCoverAction`,
    `upload-to-drive.ts:uploadPostEventDocAction` (esta trocou o guard ad-hoc
    `verifyIdToken` pelo helper canônico → também fecha o BUG-021);
    `upload-to-drive.ts:uploadToUserDrive` ganhou `requireAuth(idToken)` +
    dono-ou-admin (fecha IDOR: token válido de qualquer membro permitia upload na
    pasta Drive de outra matrícula).
  - **Lote 7 (auth-permissions)** em `src/actions/auth-permissions.ts` +
    `src/lib/server-session.ts` + novo `src/lib/user-permissions.ts`:
    `fetchUserPermissionsStatus` virou wrapper guardado (`verifySignedSession()` +
    `caller.uid === uid`) delegando a `resolveUserPermissions` (resolvedor cru
    extraído para lib, usado por `getServerSession` sem recursão). Fecha o IDOR de
    leitura de permissões por uid. Este lote também fechou o **BUG-032** (escalação
    de privilégio em `syncUserPermissionsOnLogin`).
- Decisão de execução: Padronização em lotes por módulo (padrão canônico do T-02:
  `requireAuth()`/`requireAdmin()` + dono-ou-admin). Cada lote validado por eslint
  + `tsc --noEmit` + `next build`; assinaturas inalteradas (sessão pelo cookie
  assinado, como no BUG-019). Plano+aprovação da Gestora antes de cada lote.
- Commit/PR: **lote 1** — PR #8 (`6610167`, squash); **lote 2** — PR #9
  (`70d418e`, squash); **lote 3** — PR #10 (`34c3c21`, squash); **lote 4** — PR #11
  (`e4d7fb9`, squash); **lote 5** — PR #12 (`ddbcc49`, squash); **lote 6** — PR #13
  (`bfc15b8`, squash); **lote 7** — PR #14 (`fa79e49`, squash). **BUG-020 fechado.**

### BUG-021 Guard "ad-hoc" divergente do padrão em `upload-to-drive.ts`

- Severidade: Baixo
- Área/fase onde foi achado: Mapeamento — Mapa 4 (API/Server Actions, grupo B)
- Arquivo(s) afetado(s): `src/actions/upload-to-drive.ts`
- Cenário de falha: nenhum funcional — usa `getAdminAuth().verifyIdToken(idToken)`
  diretamente em vez de `requireAuth`/`requireMemberAccess` de
  `@/lib/auth-guards.ts`, criando um segundo padrão de verificação de token
  paralelo ao resto do projeto (débito técnico de consistência).
- Status: **Corrigido** — resolvido junto com o lote 6 do BUG-020 (2026-07-03).
  Em `upload-to-drive.ts`, `uploadToUserDrive` passou a usar `requireAuth(idToken)`
  + trava de dono e `uploadPostEventDocAction` passou a usar `requireAdmin(idToken)`,
  eliminando o `getAdminAuth().verifyIdToken(idToken)` ad-hoc (import `getAdminAuth`
  removido). O padrão de verificação agora é único (helper canônico de
  `@/lib/auth-guards.ts`), e a unificação ainda fechou um IDOR de upload real.
- Decisão de execução: Unificado no mesmo PR do lote 6 do BUG-020 (mexem no mesmo
  arquivo). Validado por eslint + `tsc --noEmit` + `next build`.
- Commit/PR: **mergeado** — PR #13 (`bfc15b8`, squash).

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
- **Decisão da Gestora (2026-07-09):** os bypasses são intencionais (contrato de
  serviço pago por fora), mas o fluxo retroativo deve ser **endurecido** — a Gestora
  expandiu o escopo para um redesenho do subsistema de contratos (itens a–f, ver
  `CONTRACTS-DESIGN.md`). Endurecimentos pedidos: (a) aviso de duplicidade no admin se
  já existe contrato do mesmo serviço p/ o cliente; (b) acesso ao contrato **vinculado
  à conta específica** liberada pelo admin (logado nela, não por outro e-mail nem
  deslogado); (c) link de geração **único e de uso único**. Vira a **fase CT-2** do
  `CONTRACTS-DESIGN.md`.
- Status: Aberto — endereçado na fase **CT-2** do subsistema de contratos
  (`CONTRACTS-DESIGN.md`), gated (plano+aprovação por fase).
- Decisão de execução: Precisa plano+aprovação (fluxo financeiro). Bypasses aceitos
  como intencionais; endurecimento do retroativo planejado em CT-2.
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
- Status: **Corrigido** — validação de assinatura HMAC-SHA256 adicionada ao
  handler (2026-07-04), seguindo o padrão documentado do MP (header `x-signature`
  `ts`/`v1` + `x-request-id`, manifest `id:<data.id>;request-id:<...>;ts:<...>;`,
  comparação timing-safe via `crypto.timingSafeEqual`). **Habilitação suave**: a
  validação só é exigida quando `MERCADOPAGO_WEBHOOK_SECRET` (novo env opcional)
  está configurado; sem o segredo, o handler mantém o comportamento anterior
  (re-fetch do pagamento no MP), desacoplando o merge da virada de chave em
  produção. Ativação em produção (execução humana): gerar o segredo no painel do
  MP, cadastrar `MERCADOPAGO_WEBHOOK_SECRET` na Vercel, confirmar com webhook real.
  **[CONFIRMADO ativo em produção — 2026-07-04]** via "Simular notificação" do
  painel MP (URL `/api/webhooks/mercadopago`, segredo cadastrado na Vercel): a
  notificação assinada **passou pela verificação HMAC** — o log da Vercel mostra
  o handler seguindo até o lookup do pagamento (404 esperado para o `data.id`
  fictício `123456`), **sem** o aviso de "modo suave" e **sem** 401 de assinatura
  inválida, provando que o segredo foi lido e a assinatura recalculada bateu.
- Decisão de execução: Plano+risco apresentados e **aprovados pela Gestora**
  (2026-07-04). Corrigido via branch `security/mercadopago-webhook-hmac` (validado
  por eslint dos arquivos tocados + `tsc --noEmit` + `next build`).
- Commit/PR: **mergeado** — PR #16 (`2417889`, squash).

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
- Status: **Em Progresso (parte GlassModal concluída)** — lotes **1** (z-index,
  PR #15), **A** (4 modais-card, PR #20) e **B** (PR #21) mergeados. Lote B:
  `NonMemberOffboardingModal` convertido para `GlassModal` (+`z-[50]` órfão
  corrigido) e z-index órfãos do `JourneyNav` coordenados (modal de detalhes
  `z-[200]`→`.z-overlay`; tooltip `z-50`→`.z-chrome-popover`). **Refino da decisão
  original** (que assumia "todos os 11 estendem GlassModal"): o `GlassModal` é a
  base dos **modais-card**; os **modais grandes "app-shell"** (`ThemeSuggestion`/
  `ContentEvaluation`/`DiscDevolutiva` — header/footer fixos + corpo rolável) não
  cabem nele e vão para um 2º componente-base próprio (**BUG-034**). **Exceções
  aceitas** (não convertidas): `ServiceSelection` (universo público, estilo
  intencional) e `ContractGate` (gate crítico não-dismissível, `z-critical`,
  tokens shadcn). Todos os modais-card do inventário estão convergidos.
  Conferência visual (telas logadas) pendente em produção (BUG-030).
  Nota: no PR #21 também foram restaurados acentos PT-BR removidos por engano nos
  4 modais do lote A (regressão de copy, corrigida).
- Decisão de execução: Precisa plano+aprovação (sistema de design — Fase 0). **[2026-07-02 / F0-01]** Decidido: `GlassModal` é o modal-base único oficial; converger os 11 modais divergentes em 3 lotes, começando por unificar a escala de z-index (correção prioritária: risco ContractGateModal vs UpsellServiceModal). Implementação gated por lote. **[2026-07-03 / lote 1]** Escala canônica de z-index implementada em `globals.css` (`.z-chrome`/`.z-chrome-popover`/`.z-overlay`/`.z-critical`/`.z-toast`/`.z-tour`), substituindo os 9 valores ad-hoc dos overlays; corrige inversões reais (modal sob header). Validado por tsc + build + preview. Ver `F0-DECISIONS.md#f0-01`.
- Commit/PR: **lote 1** — PR #15 (`7fc59f9`); **lote A** — PR #20 (`9120a88`);
  **lote B** — PR #21 (`c57c507`). Parte GlassModal concluída; resta o 2º base
  (BUG-034) para os modais grandes.

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

### BUG-032 `syncUserPermissionsOnLogin` concede admin a partir de e-mail não-verificado (escalação de privilégio)

- Severidade: **Crítico** (auto-promoção a admin; mesma classe do BUG-003 já
  corrigido — a Gestora pode reclassificar para Alto dado o pré-requisito de já
  ter uma matrícula, ver abaixo)
- Área/fase onde foi achado: T-02 / BUG-020 lote 7 (auth-permissions) — achado
  colateral por leitura de código (2026-07-03)
- Arquivo(s) afetado(s): `src/actions/auth-permissions.ts:syncUserPermissionsOnLogin`
- Cenário de falha: a server action recebe `(uid, email)` como **parâmetros não
  verificados**. Se `email` estiver na allowlist `MASTER_EMAILS`, o código resolve
  a matrícula a partir do `uid` e grava `admin: true` em
  `User/{matricula}/User_Permissions/access` (linhas 129-135). Como toda função
  `"use server"` é um endpoint de rede real, um usuário autenticado com matrícula
  pode chamar `syncUserPermissionsOnLogin(ownUid, "legnp@bplen.com")` diretamente
  e **auto-conceder admin** à própria conta. O `email` não é confrontado com a
  identidade verificada do chamador. **[CONFIRMADO por leitura de código]** —
  não reproduzido em runtime, mas o caminho é direto e determinístico.
  - Pré-requisito de exploração: ter uma matrícula (`User/{matricula}` + `_AuthMap`);
    sem matrícula resolvida a action retorna sem gravar (linhas 81-87). Ou seja,
    explorável por qualquer membro registrado, não por um visitante qualquer — por
    isso a nota de possível reclassificação Alto.
- Correção proposta (aguardando aprovação — identidade/sessão, gated): no login
  legítimo (`use-auth.ts`), `createSignedSessionCookie` roda **antes** de
  `syncUserPermissionsOnLogin`, então o cookie de sessão já existe. Verificar o
  chamador com `verifySignedSession()` (que retorna `{uid,email}` sem recursão),
  exigir `caller.uid === uid`, e usar o **e-mail verificado do cookie** (não o
  parâmetro) para o teste `MASTER_EMAILS`. Assim um atacante não consegue reivindicar
  um e-mail master que não possui.
- Status: **Corrigido** — 2026-07-03 (mesmo lote 7 do BUG-020). Plano aprovado pela
  Gestora. `syncUserPermissionsOnLogin` passou a verificar o chamador via
  `verifySignedSession()` (`caller.uid === uid`) e a usar o **e-mail verificado do
  cookie** para o teste `MASTER_EMAILS`, em vez do parâmetro não-confiável — um
  atacante não consegue mais reivindicar um e-mail master que não possui. O cookie
  de sessão já existe neste ponto do login (`createSignedSessionCookie` roda antes).
- Decisão de execução: Corrigido via branch `security/auth-permissions-guards`
  (validado por eslint + `tsc --noEmit` + `next build`).
- Commit/PR: **mergeado** — PR #14 (`fa79e49`, squash).

### BUG-033 Networking envia ao client contatos/URLs que o dono marcou como não-visíveis

- Severidade: Médio (privacidade — **[HIPÓTESE]**, não confirmado no render)
- Área/fase onde foi achado: achado colateral do BUG-006 (guard de networking),
  2026-07-04 — a resolver na **Fase 1 (F1-05, validação da página de networking)**
  conforme a diretriz de resolver bugs localizados na fase correspondente
  (Protocolo item 10)
- Arquivo(s) afetado(s): `src/actions/networking.ts:getNetworkingDataAction`
  (retorno de `contacts` e `cvUrl`/`portfolioUrl`), `src/app/hub/networking/page.tsx`
  + componente de card (render a confirmar)
- Cenário de falha: **[HIPÓTESE]** a action devolve o objeto `contacts` inteiro
  (cada item tem `{value, visible}`) e as URLs de CV/portfólio **independente das
  flags de visibilidade do dono** (`contacts[].visible`, `cv_networking_visibility`,
  `portfolio_networking_visibility`) — a ocultação parece ser só client-side. Se
  confirmado, valores que o dono escolheu **esconder** trafegam para o browser de
  outros membros, contrariando o controle do dono (que é o cerne da feature de
  networking). Não confirmado no componente de render ainda.
- Item relacionado (mesma action, tratar junto na F1-05): o `getNetworkingDataAction`
  lê `d.User_JourneyMap?.current_stage` para o `journeyStageId` — mas `User_JourneyMap`
  é (a) um campo inexistente no doc User e (b) uma coleção agora **deletada** (BUG-018).
  Logo o filtro de estágio cai **sempre** em "onboarding". Fix: desnormalizar o
  estágio do v3 (`User_Journey`) num campo do doc User (o networking é query em massa
  e não lê subcoleção) e apontar o read para ele.
- Status: Aberto — **[HIPÓTESE]**, verificar na Fase 1 (F1-05). Se confirmado, o
  fix provável é filtrar server-side no `getNetworkingDataAction` (não enviar
  `value`/URL quando `visible === false`), preservando as flags para o próprio dono.
- Decisão de execução: A investigar na fase correspondente; se confirmado e a
  correção tocar o shape de dados de networking, avaliar impacto antes.
- Commit/PR: —

### BUG-034 Falta base canônica para modais grandes "app-shell" (header/footer fixos + corpo rolável)

- Severidade: Baixo (débito de design system / manutenibilidade)
- Área/fase onde foi achado: F0-01 lote B (2026-07-04) — decisão da Gestora (opção iii)
- Arquivo(s) afetado(s): `ThemeSuggestionModal.tsx`, `ContentEvaluationModal.tsx`,
  `DiscDevolutivaModal.tsx` (candidatos); provável novo `src/components/ui/` base
- Cenário: o `GlassModal` é a base dos **modais-card** (centralizado, `p-8`,
  scroll único). Os 3 modais acima são **modais grandes "app-shell"** (header e
  footer fixos + corpo interno rolável, `max-h-*vh`, `max-w-2xl/4xl`) — estrutura
  que o `GlassModal` não comporta. Hoje já usam vars de tema e `z-overlay`, mas
  têm **backdrops divergentes** (`bg-black/60~90`) e cada um reimplementa portal/
  backdrop. Falta um 2º componente-base canônico que padronize portal/backdrop/
  z-index/estrutura header-body-footer, análogo ao GlassModal mas para modais grandes.
- Status: Aberto — esforço próprio futuro (opção iii aprovada pela Gestora); não
  bloqueia o fechamento da parte GlassModal do F0-01.
- Decisão de execução: Precisa plano+aprovação (sistema de design). Ao implementar,
  migrar os 3 modais grandes para a nova base + unificar o backdrop.
- Commit/PR: —

### BUG-035 Revogação de acesso de membro via admin não surte efeito

- Severidade: **Alto** (controle de acesso — um membro mantém acesso após a
  revogação) — **[CONFIRMADO por leitura de código]** (2026-07-07), causa-raiz
  identificada abaixo
- Área/fase onde foi achado: reportado pela Gestora (2026-07-04) ao tentar
  cancelar o acesso de membro de um cliente pelo painel admin — investigado na
  **Fase 1** (F1-06) por leitura de código em 2026-07-07
- Arquivo(s) afetado(s): `src/app/hub/layout.tsx` (gate de TODO o `/hub/*` — só
  autentica, não checa entitlement), `src/app/hub/membro/page.tsx:29` (único gate
  de rota que checa `member_area_access`, com bypass `isAdmin ||`),
  `src/actions/member-area.ts:validateMemberAreaAccess` +
  `src/lib/auth-guards.ts:requireMemberAccess` (guard real correto, porém **sem
  nenhum caller** em `src/` — código morto), `src/components/hub/MemberJourneyHero.tsx:54`
  (só troca de hero client-side, não é gate)
- Cenário de falha: admin revoga `member_area_access` de um cliente, mas o cliente
  **continua acessando** o hub. As 3 hipóteses originais foram **refutadas** por
  leitura: (a) a escrita **persiste** — `updateUserPermissions` grava
  `services.member_area_access:false` via `set(...,{merge:true})` no path soberano;
  (b) **não há cache no cookie** — o cookie assinado só carrega `{uid,email}`;
  `getServerSession` resolve `services`/`isAdmin` **ao vivo** do Firestore a cada
  request (`resolveUserPermissions`), e o `AuthContext` client escuta o mesmo doc
  em tempo real (`onSnapshot`), então `services` atualiza na hora; (c) **mesma
  fonte** — admin escreve e todo guard lê o mesmo path/campo.
- **Causa-raiz confirmada (falha de superfície de enforcement, não de dado):**
  `member_area_access` é enforçado em **um único ponto de rota** — `/hub/membro/
  page.tsx` — enquanto o `hub/layout.tsx` (gate de todo o `/hub/*`) só verifica
  autenticação, não o entitlement. Logo, revogar o acesso **não expulsa o membro
  do hub** — só bloqueia a dashboard `/hub/membro`; `/hub` (home) e as demais
  sub-páginas seguem abertas a qualquer autenticado. Somam-se dois agravantes:
  (i) mesmo em `/hub/membro`, o bypass `isAdmin ||` nunca bloqueia um alvo admin;
  (ii) o gate de servidor só reavalia numa navegação nova — um cliente com a aba
  já aberta não é ejetado em tempo real (nada consome a mudança de `services` do
  `onSnapshot` para forçar saída). O guard dedicado e correto (`requireMemberAccess`
  via `validateMemberAreaAccess`) existe mas está **desconectado** (zero callers).
- Impacto colateral no processo: **bloqueia a validação visual do
  `NonMemberOffboardingModal`** (BUG-026, em F1-03) — não dá para colocar um
  usuário no estado "não-membro" e ver o modal enquanto a revogação não expulsa
  do hub de fato.
- Status: **Corrigido** — 2026-07-08 (Fase D / PR #37, fecho da reestruturação
  A0→D do modelo de acesso; ver `ACCESS-MODEL-DESIGN.md`). Enforcement:
  `src/app/hub/membro/layout.tsx` (novo) exige `member_area_access` no servidor a
  cada request para TODA a subárvore `/hub/membro/*`; sem selo → `redirect("/hub")`.
  Bypass `isAdmin ||` removido do índice e do `MemberJourneyHero` (admin não herda
  o clube — se auto-libera pelo painel para testar). Pré-condições que tornaram o
  gate seguro: Fase C moveu checkout e journey para fora de `/hub/membro` (funil e
  onboarding não passam mais pelo cadeado); A2+Sync condicionaram o selo ao
  `concedeSelo`. Revogar o selo agora expulsa o cliente do clube na próxima
  navegação — ejeção em tempo real (aba já aberta) fica como follow-up opcional.
  Um não-membro com link antigo de checkout/journey (stubs sob a subárvore) cai em
  `/hub`, navegável até o destino novo — trade-off aceito pela Gestora.
- Validação: tsc + build + suíte 52/52. **[CONFIRMADO em produção pela Gestora,
  2026-07-08]:** revogação testada ao vivo — funcional (o usuário sem selo cai para
  `/hub`). O `NonMemberOffboardingModal` (F1-03) está desbloqueado para validação.
- **Refino da correção (2026-07-07, investigação da estrutura antes de codar —
  Lição 3):** a Gestora aprovou "enforçar no `hub/layout.tsx`", mas a leitura da
  estrutura da área logada mostrou que **nenhuma fronteira única serve** — o
  enforcement ingênuo quebraria fluxos de receita/onboarding:
  - Gatear `hub/layout.tsx` (todo o `/hub/*`) barra **onboarding**: o lead novo
    faz a welcome survey em `/hub` **sem** `member_area_access` ainda.
  - Gatear a subárvore `/hub/membro/*` (via layout) barra o **funil de aquisição**:
    o `MatriculaGuard` da página pública manda o 1º comprador para
    `/hub/membro/checkout/${slug}` **sem** `member_area_access` (o entitlement é
    **concedido pela compra**, `checkout.ts:125` — mesma circularidade do BUG-005);
    e o plano **junior (grátis)** vai direto para `/hub/membro/journey/
    posicionamento-profissional` também sem o entitlement.
  - Confirmado que `member_area_access` só é **escrito** em `checkout.ts:125` (compra
    paga). Free junior e 1ª compra passam por `/hub/membro/*` de propósito, sem ele.
  - Os subpáginas de membro (journey/carreira/agenda/contratos) hoje **não gateiam**
    `member_area_access` — só a página índice `/hub/membro` (com bypass `isAdmin ||`).
  Conclusão: **onde exatamente cravar a fronteira do "membro pago" é decisão de
  produto** (ex.: junior grátis conta como membro? conceder `member_area_access`
  na entrada do junior e então gatear a área de membro exceto checkout?). Codar às
  cegas quebraria funil/onboarding — parado antes de codar, aguardando a decisão da
  Gestora sobre a fronteira. (Exemplo do valor de validar antes de implementar,
  Lição 3.)
- Decisão de execução: a "decisão de produto sobre a fronteira" foi resolvida pela
  Gestora não como opção pontual, mas como a **reestruturação completa do modelo de
  acesso** (`ACCESS-MODEL-DESIGN.md`): a fronteira é o dado (`escopo`/`concedeSelo`),
  o funil saiu do clube (Fase C) e o cadeado ficou trivial (Fase D). Plano+aprovação
  de cada sub-PR registrados no `LOG.md`.
- Commit/PR: **mergeado** — PR #37 (Fase D). Cadeia completa: #28 (A0), #29 (A1),
  #30 (A2), #31 (A3), #32 (B1), #33 (C), #34/#36 (dados+Sync), #35 (B2), #37 (D).

### BUG-036 Erro de hidratação no `ComparisonTable` (whitespace dentro de `<colgroup>`)

- Severidade: Médio (erro de hidratação React em página pública de marketing —
  React descarta o HTML do servidor para a subárvore e re-renderiza no client;
  polui o console e pode causar flicker)
- Área/fase onde foi achado: Fase 1 — F1-01 (validação de `/servicos/[audience]`,
  2026-07-07, confirmado ao vivo via console do preview + logs do servidor)
- Arquivo(s) afetado(s): `src/components/services/ComparisonTable.tsx:101-108`
- Cenário de falha: **[CONFIRMADO ao vivo]** — cada `<col />` do `<colgroup>` tem
  um comentário JSX inline na mesma linha (`<col ... />  {/* Serviço */}`), o que
  gera nós de texto de whitespace (`"  "`) como filhos diretos de `<colgroup>`.
  HTML inválido → React emite "In HTML, whitespace text nodes cannot be a child
  of <colgroup>. This will cause a hydration error." repetidamente (visto no
  console do browser e nos logs do dev server em toda renderização de
  `/servicos/pessoas`). O preview marca "1 issue".
- Status: **Corrigido** — 2026-07-07 (F1-01). Removidos os comentários JSX inline
  entre os `<col>`; a legenda das colunas virou um único comentário acima do
  `<colgroup>`. Larguras preservadas. **Verificado ao vivo no preview:** o erro
  sumiu do console/logs e o badge de "1 issue" desapareceu; a tabela renderiza
  com as larguras corretas.
- Decisão de execução: Ajuste localizado a um único componente (bugfix isolado,
  sem tocar segurança/identidade/financeiro nem padrão de design) — feito direto
  (CLAUDE.md). Validado por tsc + build + preview.
- Commit/PR: **mergeado** — PR #26 (`ecfc93d`, squash).

### BUG-037 Erros de acento/crase em copy das páginas públicas de serviços

- Severidade: Baixo (copy de interface — acentuação PT-BR incorreta; Lição 11 do
  RETROSPECTIVE)
- Área/fase onde foi achado: Fase 1 — F1-01 (validação de `/servicos`, 2026-07-07,
  por leitura + preview)
- Arquivo(s) afetado(s): `src/components/services/ComparisonTable.tsx`,
  `src/app/servicos/[audience]/page.tsx`
- Cenário de falha: strings visíveis com acento/crase incorretos —
  `ComparisonTable.tsx`: `"% de desc. a vista"`/`"5% de desc. a vista"` (×7,
  linhas 36/48/49/60/61/72/73) devem ser `"à vista"`; `"Autoaplicavel"` (linha 37)
  → `"Autoaplicável"`; `duration: "1 mes"` (linha 55) → `"1 mês"`.
  `servicos/[audience]/page.tsx`: linha 239 `"...desconto a vista no PIX"` →
  `"à vista"`; linha 244 `"Preco especial a vista"` → `"Preço especial à vista"`.
  Nota: a página de detalhe do serviço (`[slug]/page.tsx:173`) já usa `"À vista"`
  corretamente — confirma a direção do fix. Nenhum é ASCII de rota/chave; são copy
  visível.
- Status: **Corrigido** — 2026-07-07 (F1-01). Todas as ocorrências acentuadas
  (`à vista` ×7 + `à vista` na página do audience, `Autoaplicável`, `1 mês`,
  `Preço especial à vista`). **Verificado ao vivo no preview:** `/servicos/pessoas`
  renderiza "À VISTA" e "1 MÊS" corretamente.
- Decisão de execução: Copy de texto puro sem afetar layout — feito direto
  (CLAUDE.md). Validado por tsc + build + preview.
- Commit/PR: **mergeado** — PR #26 (`ecfc93d`, squash).

### BUG-038 `<Image fill>` sem prop `sizes` na foto da fundadora (aviso de performance)

- Severidade: Baixo (aviso de performance do Next.js, não erro funcional;
  pré-existente)
- Área/fase onde foi achado: Fase 1 — F1-01 (logs do dev server ao validar a home,
  2026-07-07)
- Arquivo(s) afetado(s): componente da home que renderiza
  `/foto_perfil_fundadora.jpg` com `fill` (provável `AboutSection`)
- Cenário de falha: o dev server emite `Image with src "/foto_perfil_fundadora.jpg"
  has "fill" but is missing "sizes" prop` — sem `sizes`, o Next serve a imagem no
  maior tamanho possível, penalizando performance. Não afeta correção funcional.
- Status: Aberto — adiado (não bloqueia F1-01; fix é adicionar `sizes` ao
  `<Image>`, avaliar junto de uma varredura de performance — T-01 — ou quando
  tocar o componente).
- Decisão de execução: Ajuste pequeno e localizado; pode ser feito quando alguém
  tocar o componente ou numa varredura de performance (T-01).
- Commit/PR: —

### BUG-039 `seedComparisonProductsAction` — server action órfã que grava produtos sem guard

- Severidade: Baixo (código morto; latente — não há caller que a acione hoje)
- Área/fase onde foi achado: Fase 1 — F1-01, achado colateral ao remover o import
  morto do BUG-014 (2026-07-07)
- Arquivo(s) afetado(s): `src/actions/seed-comparison-products.ts`
- Cenário de falha: com a remoção do import (BUG-014), a ação fica com **zero
  callers** em todo o `src/`. É uma `"use server"` action que **grava/mescla
  produtos** (`batch.set` na coleção de produtos) com dados hardcoded e **sem
  guard** (`requireAdmin`). Como ninguém a importa/usa, o Next.js não a registra
  como endpoint acionável (risco prático baixo), mas é (a) código morto e (b) uma
  mutação de dados financeiro-adjacente sem guard — não deveria ficar no
  repositório. A remoção não foi feita junto do BUG-014 por ser
  financeiro-adjacente (produtos/preços) — decisão da Gestora.
- Status: **Corrigido** — 2026-07-07. Arquivo `src/actions/seed-comparison-products.ts`
  removido. Double-check pedido pela Gestora feito antes de apagar: `git grep` no
  repo inteiro (fora `docs/` e o próprio arquivo) confirmou **zero referências**
  (nenhum import do módulo, nenhuma chamada, nenhum uso em página/componente/API/
  script/config). Ausência do arquivo não impacta nada.
- Decisão de execução: OK da Gestora (financeiro-adjacente) após double-check.
  Removido + validado por tsc + build (ambos exit 0).
- Commit/PR: **mergeado** — PR #27 (`6681689`, squash).

### BUG-040 ~50 coleções de backup poluindo a raiz do Firestore (+ fonte que as gera)

- Severidade: Baixo (higiene/manutenibilidade; sem risco funcional, mas polui a raiz)
- Área/fase onde foi achado: Fase 1 — Trilha 3 (inventário read-only da base, 2026-07-07)
- Arquivo(s)/coleção(ões) afetado(s): raiz do Firestore — **26** coleções
  `products_backup_<timestamp>` (19-26 docs cada) + **24** coleções
  `coupons_backup_<timestamp>` (1 doc cada). **Fonte:** `src/actions/products.ts:329-363`
  (Sincronização de Portfólio) cria **uma nova coleção-raiz de backup a cada sync**,
  antes de sobrescrever produtos/cupons.
- Cenário de falha: de 75 coleções-raiz, ~50 são backups timestamp — a Sync gera
  mais a cada execução (desde 2026-06-21). Não quebra nada, mas suja a raiz e
  dificulta a leitura da base.
- Status: **Corrigido** — fonte (PR #38) + limpeza executada (2026-07-08).
  (1) **Fonte corrigida:** helper `src/lib/portfolio-backup.ts` — um doc por sync em
  `_portfolio_backups/{ts}` (subcoleções `products`/`coupons`) com **rotação de 3**
  (decisão da Gestora), compartilhado pelos DOIS caminhos de sync. **Achado no
  processo:** o sync "via repositório" (`syncPortfolioFromFilesAction`, o botão que
  a Gestora usou em 2026-07-08) **não fazia backup nenhum** — por isso os syncs
  daquele dia não geraram coleções novas; agora também faz.
  (2) **Limpeza do legado:** `scripts/cleanup-backup-collections.js` (LOCAL,
  dry-run por padrão, `--apply` explícito, `--keep=N`/`--limit=N`; exporta cada
  coleção em JSON para `scratch/portfolio-backup-export/` antes de apagar).
  **`--apply` executado (2026-07-08, OK da Gestora):** 47 coleções apagadas (24
  `products_backup_*` + 23 `coupons_backup_*`); mantidos os 3 mais recentes de cada;
  cada uma exportada em JSON para `scratch/portfolio-backup-export/` (47 arquivos,
  reversível) antes de apagar. Dry-run final confirma raiz com só 3+3. A raiz do
  Firestore caiu de ~75 para ~28 coleções.
- Decisão de execução: fonte via PR (código); exclusão via script LOCAL com
  dry-run + export + OK explícito (padrão migrate-journeymap). Ambos concluídos.
- Commit/PR: fonte — **PR #38**; limpeza — script `cleanup-backup-collections.js`
  (executado localmente, sem PR de dados — só apaga backups).

### BUG-041 Produtos legados/duplicados poluindo a coleção `products`

- Severidade: Baixo (higiene; alguns ainda referenciados por clientes — ver BUG-042)
- Área/fase onde foi achado: Fase 1 — Trilha 3 (inventário, 2026-07-07)
- Arquivo(s)/coleção(ões) afetado(s): coleção `products` (26 docs). **Conjunto ativo
  canônico está limpo** (5 pacotes `BPL-PAC-*` + 7 etapas de jornada `BPL-000..006`
  com `journey=sim` e `order` batendo com o modelo da Gestora). **Poluentes (status
  `archived`, slugs inconsistentes com espaço/caixa):** `mentoria`, `coaching`,
  `coaching-e-mentoria`, `desenvolvimento-de-carreira`(+`-em-grupo`/`-individual`),
  `junior`/`pleno`/`senior`/`lider` (nomes soltos), `primeiros-passos`, `1-to-1`,
  `preparacao-de-carreira` (duplicata do `posicionamento-profissional`),
  `plano-embaixadores-bplen`.
- Cenário de falha: catálogo poluído com ~13 duplicatas/legados arquivados. Alguns
  ainda referenciados por clientes (`plano-embaixadores-bplen` ×3, `1-to-1` ×1) →
  **migrar antes de excluir** (ver BUG-042).
- Status: **Corrigido** — 2026-07-08 (Trilha 3c). `scripts/cleanup-legacy-products.js`
  (LOCAL; critério conservador: só `status === 'archived'`; export JSON de cada doc
  antes de apagar). **Executado com OK da Gestora:** 14 produtos arquivados excluídos
  (1-to-1, coaching, coaching-e-mentoria, desenvolvimento-de-carreira ×3, junior,
  lider, mentoria, plano-embaixadores-bplen, pleno, preparacao-de-carreira,
  primeiros-passos, senior). Verificação final: `products` = 12 docs, todos ativos
  canônicos, **0 arquivados**. Nenhum ativo tocado. Isto também resolve a nota da
  Gestora sobre o painel admin listar os arquivados (o painel lista a coleção → some
  o legado). Backups em `scratch/legacy-products-export/` (14 arquivos, reversível).
- Nota (BUG-047): o painel admin ainda não **exibe os atributos novos** (escopo/
  concedeSelo/...) — isso é gap de exibição separado, segue aberto.
- Decisão de execução: Exclusão de dados de produto (financeiro-adjacente) → script
  LOCAL com dry-run + ok da Gestora, e só depois da migração dos clientes.
- Commit/PR: —

### BUG-042 Chaves de entitlement dos clientes inconsistentes (slugs antigos/órfãos)

- Severidade: Médio (afeta resolução de acesso — chave que não casa com produto pode
  não ser reconhecida pelo motor)
- Área/fase onde foi achado: Fase 1 — Trilha 3 (inventário, 2026-07-07)
- Arquivo(s)/coleção(ões) afetado(s): `User/{matricula}/User_Permissions/access.services`
  (4 clientes com entitlement). Chaves encontradas com problema: `plano_de_Carreira`
  (caixa/underscore — não casa com o produto `plano-de-carreira`);
  `vLYKPTLII8tTP2Wo5wpV` (ID aleatório de doc usado como chave de serviço — bug de
  dado); `plano-embaixadores-bplen`/`1-to-1` (produtos arquivados); `content_premium`/
  `hub_community`/`survey_welcome`/`career_planning` (chaves estilo "capability", a
  classificar: intencional vs legado).
- Cenário de falha: o motor de acesso (Fase B) precisa de chaves canônicas; hoje há
  divergência de formato (caixa/hífen), um ID órfão, e slugs arquivados. Como são só
  **4 clientes**, a migração é pequena.
- **Verificação (2026-07-07, condição da Gestora):** as flags `content_premium`/
  `hub_community`/`survey_welcome` são **booleanas, não guardam dado** — o dado real
  está nas subcoleções `Surveys`/`Forms`. Confirmado na base: só `BP-002` as tem, e
  ele tem 13 surveys + 1 form íntegros. Remover as flags **não perde dado**.
- **Mapa canônico decidido (Gestora, 2026-07-07):** `plano_de_Carreira` **e**
  `career_planning` → **`plano-de-carreira`** (esta última é lida por
  `career-module.ts` → renomear dado **+ código** juntos); `vLYKPTLII8tTP2Wo5wpV`
  (ID órfão) → **remover**; `content_premium`/`hub_community`/`survey_welcome` →
  **remover** (inertes, dado preservado nas subcoleções); `plano-embaixadores-bplen`/
  `1-to-1` → decidir remap (produtos arquivados). Migração minúscula (~4 clientes).
- **Levantamento READ-ONLY executado (2026-07-08, `scripts/inventory-entitlement-keys.js`):**
  confirmados **4 clientes** com `services` não-vazio. Achados por cliente:
  - **BP-002** (13 chaves): 3 flags inertes (`content_premium`/`hub_community`/
    `survey_welcome`) + ID órfão `vLYKPTLII8tTP2Wo5wpV` + `plano_de_Carreira`=true
    (caixa errada, dead) + 4 chaves de produto ativo (`gestao-e-desenvolvimento`=true;
    `posicionamento`/`analise`/`plano-de-carreira`=**false**) + 2 arquivados **=false**
    (`1-to-1`, `desenvolvimento-de-carreira-em-grupo`). **Conflito:** tem
    `plano_de_Carreira`=true (dead) E `plano-de-carreira`=false (canônico).
  - **BP-005**: `career_planning`=true (flag lida por `career-module.ts`),
    `analise-comportamental`=true, `plano-embaixadores-bplen`=true, selo.
  - **BP-011**: só selo + `plano-embaixadores-bplen`=true.
  - **BP-012**: selo + `plano-embaixadores-bplen`=true + `1-to-1`=true.
- **ACHADO NOVO:** `plano-embaixadores-bplen` (×3 clientes) mapeia para o produto
  **arquivado `SERV-EMB-001`** — existe um `pacote-embaixador` ativo (`BPL-PAC-EB`).
  **Decisão pendente da Gestora:** remapear `plano-embaixadores-bplen` → `pacote-embaixador`?
  (os 3 são Embaixadores). Idem `1-to-1`=true de BP-012 (produto arquivado sem
  equivalente ativo óbvio).
- **Nuance técnica (leniência do B2):** chave de **pacote** (`pacote-embaixador`) NÃO
  é chave de **etapa** — o adaptador leniente lê `services[stageId]`, não expande
  `libera`. Logo remapear para o pacote **não** libera as etapas por si; se o objetivo
  é dar acesso às etapas, a migração deve gravar as **etapas** que o pacote libera
  (BPL-000..005 para Embaixador). A decidir com a Gestora.
- **Migração EXECUTADA (2026-07-08, OK da Gestora, `scripts/migrate-entitlement-keys.js`).**
  Decisões aplicadas: (1) Embaixadores (BP-005/011/012) → acesso total às etapas do
  Pacote Embaixador (BPL-000..005 ligadas por slug); chave arquivada
  `plano-embaixadores-bplen` removida. (2) BP-002 (conta de teste) → lixo removido,
  `plano_de_Carreira`→`plano-de-carreira` (true honrado). **Correção ao design:**
  `career_planning` NÃO foi renomeado — é uma **capability viva** (módulo Gestão de
  Carreira, lida em 8 sites + toggle admin `toggleCareerPlanningAccessAction`), não
  apelido de `plano-de-carreira`. Preservada. Backup do doc `access` original de cada
  cliente em `scratch/entitlement-key-backups/` (reversível).
  **Bug de escrita pego e corrigido no processo:** `set(...,{merge:true})` faz merge
  profundo do mapa `services` e **nunca remove** chave ausente — a 1ª passada aplicou
  adições mas não remoções. Trocado para `update({services: target})` (substitui o
  campo inteiro). 2ª passada completou as remoções. Verificação final: as chaves dos
  4 clientes resolvem 100% para produto ATIVO / selo / `career_planning` — zero
  arquivado/órfão/inerte. (Lição 16 do `RETROSPECTIVE.md`.)
- Status: **Corrigido** — 2026-07-08. Trilha 3b concluída. Desbloqueia a 3c (BUG-041).
- Detalhe consolidado em `ACCESS-MODEL-DESIGN.md`.
- Decisão de execução: Migração de dados de permissão (identidade/acesso) → script
  LOCAL com dry-run + backup + ok da Gestora (padrão do migrate-journeymap).
- Commit/PR: —

### BUG-043 `steps-registry.ts` (jornada) fora de sincronia com os produtos canônicos

- Severidade: Médio (fonte de verdade dupla e divergente para as etapas da jornada)
- Área/fase onde foi achado: Fase 1 — Trilha 3 / desenho da Fase A (2026-07-07)
- Arquivo(s) afetado(s): `src/config/journey/steps-registry.ts` vs coleção `products`
  (`journey=sim`)
- Cenário de falha: o registro estático usa IDs de etapa **antigos**
  (`preparacao-de-carreira` order 2, `desenvolvimento-de-carreira`, `coaching-e-mentoria`)
  enquanto os **produtos canônicos** usam `posicionamento-profissional` (order 1),
  `onboarding` (order 2), `gestao-e-desenvolvimento` (GDC, order 5), `mentocoach`
  (order 6). Duas fontes divergentes para a mesma jornada — risco de a UI/motor
  lerem estágios que não batem com os produtos/entitlements.
- Status: Aberto — resolver na **Fase A** (modelo de dados): decidir a fonte única
  (jornada dirigida pelos produtos `journey=sim` + `order` + `preRequisitos`, com o
  `steps-registry` aposentado ou reconciliado). Alinha com o modelo modular pedido.
- Decisão de execução: Parte do desenho da Fase A (gated — motor de jornada).
- Commit/PR: —

### BUG-044 `portfolio_parser.py` frágil: coordenadas de célula hardcoded + paths obsoletos + "DISC" embutido

- Severidade: Médio (débito técnico que torna a Fase A mais arriscada — o parser é
  o gargalo para adicionar qualquer campo novo de serviço)
- Área/fase onde foi achado: mapeamento do acoplamento config→Firestore (Fase A prep, 2026-07-07)
- Arquivo(s) afetado(s): `scripts/portfolio_parser.py`
- Cenário de falha: o parser lê o `portfolio_bplen.xlsx` por **coordenadas de célula
  fixas por serviço** (`services_coords`: BPL-001 `price_row=41`, BPL-002 `72`,
  BPL-003 `102`, BPL-004 `133`, ...). Consequências: (a) adicionar um campo novo
  (escopo/concedeSelo/preRequisitos/libera/SKU) = mapear manualmente novas células
  por serviço; (b) inserir/remover linhas no Excel quebra os offsets; (c) os **paths
  são hardcoded e obsoletos** (`D:\BPlen HUB\v3\...` — pasta antiga "v3", não "Dev")
  → o parser não roda neste ambiente sem ajuste; (d) o título **"Análise
  Comportamental (DISC)"** está embutido no parser → entra na Trilha 4 (nomenclatura).
- Cenário de falha (impacto na Fase A): como toda coluna nova de serviço passa por
  aqui, a Fase A precisa endurecer/parametrizar o parser (ler por cabeçalho/coluna
  nomeada em vez de coordenada fixa) OU aceitar o mapeamento manual com muito
  cuidado. Risco de sync incorreto se as coordenadas não baterem.
- Status: **Parcialmente endereçado** (PR #28 — Fase A / A0): paths corrigidos
  (relativos à raiz; parser volta a rodar), mismatch de slug BPL-003 corrigido, e
  travas `safe_float`/`safe_int` adicionadas. **Restante:** as leituras de preço
  seguem por **coordenada de célula fixa** (mitigadas pelas travas, mas ainda
  frágeis a inserção de linha). Decisão de projeto: os **campos novos** (A1) entram
  por uma **aba resiliente `Atributos`** (lida por cabeçalho), sem depender das
  coordenadas — então não é preciso converter as leituras de preço agora. Validado:
  parser roda e diff dos payloads = só a correção do slug (regressão zero).
- Decisão de execução: A0 feito (PR #28). Conversão das leituras de preço p/ nome de
  coluna fica como melhoria futura opcional (as travas já evitam o crash).
- Commit/PR: **A0 mergeado** — PR #28 (`76bc05d`, squash).

### BUG-045 `npm run test` quebrado na baseline desde o PR #19 (mock desatualizado)

- Severidade: Médio (a suíte de testes — um dos 4 portões do `npm run check`, regra 5
  do `CLAUDE.md` — estava **vermelha na `main`** e ninguém percebeu; qualquer
  regressão que os testes existentes pegariam passaria despercebida)
- Área/fase onde foi achado: Fase B / B1 (2026-07-08), ao rodar a suíte completa
  antes de entregar o motor de acesso
- Arquivo(s) afetado(s): `__tests__/actions/mp-checkout.test.ts`
- Cenário de falha: **[CONFIRMADO por execução]** o **PR #19** (BUG-005) trocou o guard
  de `createPreferenceAction` de `requireAuth` para `requireMatricula`
  (`src/actions/mp-checkout.ts:98`), mas o `vi.mock("@/lib/auth-guards")` do teste só
  expunha `requireAuth`. Vitest então lança `No "requireMatricula" export is defined on
  the mock` dentro da action, que cai no próprio catch e retorna `{success:false}` —
  os 2 testes do arquivo falham. Confirmado por bissecção: falha já em `fd62ebc`
  (antes das Fases A2/A3), logo **não é regressão desta trilha**.
- Causa da invisibilidade: as sessões de execução vinham validando com
  `tsc --noEmit` + `next build` + `eslint` do arquivo tocado — **nunca** `npm run test`.
  O pre-commit (lint-staged) só roda eslint. Nada no fluxo executava a suíte.
- Status: **Corrigido** — 2026-07-08 (junto do PR B1). O mock passa a expor
  `requireMatricula` e os 2 testes mockam o guard que a action de fato usa (com
  `matricula` na sessão). **Só o arquivo de teste mudou** — zero alteração de código de
  produto. Suíte completa: **39/39 passando** (era 37/39). Aproveitou para eliminar os
  **4 `as any` pré-existentes** do arquivo (violação da regra "Zero Any" do `CLAUDE.md`,
  que o lint-staged expôs ao incluir o arquivo tocado): substituídos por um helper
  `mockSession(): Session` e um `mockQuerySnapshot()` tipado. Nenhum `--no-verify` foi
  necessário.
- Decisão de execução: bugfix isolado a um único arquivo de teste, sem tocar
  segurança/identidade/financeiro (`CLAUDE.md` permite direto). Corrigido no PR do B1
  para restaurar o `npm run check` verde antes de a Fase B avançar.
- Lição de processo: validar com `npm run check` (que inclui `test`), não só
  `tsc` + `build`. Registrada no `RETROSPECTIVE.md` (Lição 14).
- Commit/PR: **mergeado** — PR #32 (junto do B1).

### BUG-046 Links hardcoded para rota inexistente em e-mails de booking (`hub.bplen.com/hub/membro/dashboard`)

- Severidade: Baixo (links de e-mail quebrados — apontam para rota que não existe,
  possivelmente em domínio que não é o de produção)
- Área/fase onde foi achado: Fase C (2026-07-08), no mapeamento das refs de
  `/hub/membro/*` para o reposicionamento de rotas
- Arquivo(s) afetado(s): `src/actions/calendar-module/booking.ts:142/244/351/607`
- Cenário de falha: 4 ocorrências de `https://hub.bplen.com/hub/membro/dashboard`
  hardcoded em payloads de e-mail (cancelLink/platformLink/htmlLink). A rota
  `/hub/membro/dashboard` **não existe** (o dashboard é `/hub/membro`), e o host
  `hub.bplen.com` diverge do domínio de produção (`bplen.com`) — o link do e-mail
  leva o membro a um 404 (ou a host inexistente). Viola também o combate ao
  hardcoded (deveria derivar de `baseUrl`/env, como fazem os e-mails de checkout).
- Status: Aberto — **não corrigido na Fase C de propósito** (o reposicionamento de
  rotas não toca booking/e-mails; misturar os riscos violaria o escopo do PR).
- Decisão de execução: corrigir quando o módulo de booking/e-mails for tocado
  (candidato: T-05 integrações, ou fase de validação do calendário) — trocar para
  `baseUrl` + `/hub/membro`. Confirmar com a Gestora se `hub.bplen.com` algum dia
  foi um domínio válido.
- Commit/PR: —

### BUG-047 Painel admin de produtos não exibe os atributos do modelo de acesso

- Severidade: Baixo (gap de exibição na UI admin; o dado existe)
- Área/fase onde foi achado: reportado pela Gestora (2026-07-08) ao validar a Sync —
  os atributos (`escopo`/`concedeSelo`/`preRequisitos`/`libera`) só são conferíveis
  direto no Firestore, não no painel.
- Arquivo(s) afetado(s): UI de produtos do admin (tela que consome `getAdminProducts`)
- Cenário de falha: **[CONFIRMADO]** `getAdminProducts` + `safeSerialize` repassam
  todos os campos (verificado por leitura — a serialização não corta nada); a tela é
  que não renderiza os campos novos. Impacto: a Gestora não consegue validar a
  configuração de acesso pelo painel.
- Status: Aberto — corrigir na validação da tela admin de produtos (Fase 1/F1-06) ou
  quando o painel for tocado: exibir os atributos por produto (leitura apenas — a
  fonte é a planilha, via Sync; não criar edição paralela).
- Decisão de execução: display-only, baixo risco; aguarda a fase da tela.
- Commit/PR: —

### BUG-048 Nav pública: "Nossos serviços" mantém realce de ativo em páginas que não são a dele

- Severidade: Baixo (defeito de estado visual de navegação)
- Área/fase onde foi achado: F1-01 (anotações da Gestora, 2026-07-08) — cluster
  `F1-01-AJUSTES.md` #14
- Arquivo(s) afetado(s): `src/components/layout/FloatingCTAs.tsx`
- Cenário de falha: ao navegar nas páginas públicas, o botão de menu "Nossos serviços"
  fica com o efeito de "selecionado" mesmo fora da sua rota — o realce de ativo deve
  refletir só a página atual. A lógica de `active`/`pathname` da nav está incorreta.
- Status: **Corrigido** — PR #44. `FloatingCTAs.tsx`: realce dirigido por `pathname` (helper
  `navState`); "Nossos Serviços" (abre modal, sem página) neutralizado; "Agendar"/"Conteúdos"
  destacam só na rota própria. Screenshot: em /conteudo só "Explorar Conteúdos" destacado.
- Decisão de execução: ajuste de estado de nav; verificado ao vivo.
- Commit/PR: **mergeado** — PR #44.

### BUG-049 `/conteudo`: footer com tema escuro (design de home) em página pública clara

- Severidade: Baixo (inconsistência de tema — regra dos "dois universos visuais" do CLAUDE.md)
- Área/fase onde foi achado: F1-01 (anotações da Gestora, 2026-07-08) — `F1-01-AJUSTES.md` #18
- Arquivo(s) afetado(s): `src/components/layout/GlobalFooter.tsx` (adaptação de tema em `/conteudo`)
- Cenário de falha: o footer da `/conteudo` renderiza com o design escuro da home, quando a
  página pública é clara — o footer deve adaptar ao tema claro público. Provável dependência
  de contexto de tema não aplicada nessa rota.
- Status: **Corrigido** — PR #44. O `/conteudo` (página clara) embrulhava o `HomeFooter`
  (=`GlobalFooter`) num `<div bg-black text-white>`, forçando escuro. Wrapper removido → o footer
  herda o `:root` claro (o /conteudo não tem `theme-dark`). Medido: footer claro (oklab 0.975/0.3).
- Decisão de execução: remoção do wrapper; footer passa a usar as vars de tema.
- Commit/PR: **mergeado** — PR #44.

### BUG-050 FAQ "Envie sua pergunta": modal com overlay branco translúcido (deveria ser preto)

- Severidade: Baixo (não-conformidade de design system — backdrop divergente do padrão)
- Área/fase onde foi achado: F1-01 (anotações da Gestora, 2026-07-08) — `F1-01-AJUSTES.md` #19
- Arquivo(s) afetado(s): `src/components/products/FAQContactModal.tsx`
- Cenário de falha: o modal "Envie sua pergunta a BPlen" abre translúcido, criando um overlay
  branco estranho sobre a página pública, quando o padrão é backdrop preto. Diferente da
  exceção aceita do `ServiceSelectionModal` (F0-01) — este deve **convergir** para o backdrop
  padrão.
- Status: **Corrigido** — PR #44. `GlassModal` tinha backdrop `bg-white/40` fixo (overlay branco
  na página pública escura). Add prop opcional `backdropClassName` (**default inalterado**, zero
  impacto nos outros modais); `FAQContactModal` passa `bg-black/60`. Aditivo. Confirmação visual do
  modal (página de produto) fica p/ produção; código verificado.
- Decisão de execução: prop aditivo (default preservado). Backdrop escuro global = decisão à parte.
- Commit/PR: **mergeado** — PR #44.

### BUG-051 `generateContractPdf` lê coleção `Products` (maiúsculo) inexistente — geração de contrato quebrada

- Severidade: **Alto** (a geração do PDF do contrato provavelmente falha em produção)
- Área/fase onde foi achado: F1-02 / investigação do subsistema de contratos (2026-07-09)
- Arquivo(s) afetado(s): `src/actions/legal.ts:63` e `:100`
- Cenário de falha: **[CONFIRMADO por leitura, A VERIFICAR EM PRODUÇÃO]** o canônico é
  `products` (minúsculo, `PRODUCTS_COLLECTION`); todo o sistema (checkout, journey,
  portfolio) escreve/lê lá. Mas `legal.ts` usa `db.collection("Products")` (maiúsculo)
  em `getPendingContracts` (linha 63) e `generateContractPdf` (linha 100). Firestore é
  case-sensitive → `productDoc.exists` é falso → `throw "Produto não encontrado."`. A
  geração do PDF quebra tanto no retroativo (`retroactive-contract.ts:75`) quanto no
  `ContractGateModal:35`. A Gestora pode ter visto "Ordem criada, mas falha ao gerar
  PDF".
- Status: Aberto — fase **CT-0** do `CONTRACTS-DESIGN.md` (reconciliação estrutural).
- Decisão de execução: Precisa plano+aprovação (fluxo financeiro/jurídico). Verificar
  em produção se `Products` maiúsculo de fato não existe antes de corrigir.
- Commit/PR: —

### BUG-052 Documento do contrato não é visualizável dentro do HUB

- Severidade: Médio (item e da Gestora)
- Área/fase onde foi achado: F1-02 / contratos (2026-07-09)
- Arquivo(s) afetado(s): `src/app/hub/checkout/success` (tela de sucesso do checkout),
  `src/app/contrato-retroativo/[slug]/page.tsx`, `src/app/hub/membro/contratos/page.tsx`
- Cenário de falha: **[CONFIRMADO por leitura]** as telas de contrato citam o contrato
  e mandam "veja o PDF no seu Google Drive", mas **não exibem o texto do documento nem
  um link/botão direto** para visualizar/baixar. O `documentUrl` (Drive webViewLink)
  gravado em `Legal_Audits` não é surfado ao membro.
- Status: Aberto — fase **CT-3** do `CONTRACTS-DESIGN.md` (viewer in-app).
- Decisão de execução: display de documento; baixo risco funcional, aguarda a fase.
- Commit/PR: —

### BUG-053 Painel de contratos mostra status de pagamento, não de assinatura; sem documento/nota fiscal; link morto

- Severidade: Médio (item d da Gestora)
- Área/fase onde foi achado: F1-02 / contratos (2026-07-09)
- Arquivo(s) afetado(s): `src/app/hub/membro/contratos/page.tsx`
- Cenário de falha: **[CONFIRMADO por leitura]** o painel renderiza 1 card por order de
  `User_Orders` com badge de **status de pagamento** (`StatusBadge`), sem status de
  **assinatura** (pendente/retificação/assinado), sem link do documento, sem nota
  fiscal. O botão de aprovado aponta para `/hub/membro/dashboard` (**rota inexistente**
  — mesmo defeito do BUG-046); o ramo "Ver Fatura" é morto (cursor-not-allowed).
- Status: Aberto — fase **CT-4** do `CONTRACTS-DESIGN.md` (painel reescrito).
- Decisão de execução: Precisa plano+aprovação (área de contratos). Aguarda a fase.
- Commit/PR: —

### BUG-054 IP do cliente na assinatura é placeholder hardcoded (validade jurídica)

- Severidade: Médio (item f da Gestora — validade jurídica)
- Área/fase onde foi achado: F1-02 / contratos (2026-07-09)
- Arquivo(s) afetado(s): `src/actions/legal.ts:176`
- Cenário de falha: **[CONFIRMADO por leitura]** o registro em `Legal_Audits` grava
  `ipAddress: "Registrado pelo Gateway"` (string fixa), não o IP real do cliente no
  momento da assinatura. Para validade jurídica do aceite clickwrap, é preciso capturar
  o IP real (+ user-agent + timestamp confiável). A Gestora indicará ajustes adicionais.
- Status: Aberto — fase **CT-1** (assinatura grava IP real) + **CT-5** (reforços) do
  `CONTRACTS-DESIGN.md`.
- Decisão de execução: Precisa plano+aprovação (jurídico/identidade). Aguarda a fase.
- Commit/PR: —

### BUG-055 Gate de contrato lê subcoleção legada `User/{uid}/Orders` sem escritor (inerte)

- Severidade: Médio
- Área/fase onde foi achado: F1-02 / contratos (2026-07-09)
- Arquivo(s) afetado(s): `src/actions/legal.ts:52` (`getPendingContracts`),
  `src/components/hub/ContractGateModal.tsx`
- Cenário de falha: **[CONFIRMADO por leitura]** `getPendingContracts` consulta
  `User/{uid}/Orders` (subcoleção legada, **sem escritor conhecido** — as orders reais
  estão em `User_Orders` raiz). Resultado: a lista de pendências é sempre vazia e o
  `ContractGateModal` provavelmente **nunca** apresenta contratos pendentes de fato.
- Status: Aberto — fase **CT-0** do `CONTRACTS-DESIGN.md` (reconciliação de loja).
- Decisão de execução: Precisa plano+aprovação (área de contratos). Aguarda a fase.
- Commit/PR: —

---

*Bugs já corrigidos em sessões anteriores a este processo formal (Timestamp em
`getMemberQuotasAction`, endpoint `db-reset`, cotas em `legal.ts`, status
mortos em `visao_geral`, variant em `NarrativeContent`) estão documentados na
memória de projeto do assistente, não neste arquivo.*
