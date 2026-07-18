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
- Status: **Corrigido** — PR #70. Os tickets passam a ser gravados na subcoleção **privada**
  do usuário (`User/{matricula}/Support_Tickets`; sem matrícula → `_SupportTickets/{uid}/
  tickets`), não mais na raiz. `firestore.rules` atualizado (fallback `_SupportTickets`; a
  subcoleção por matrícula já é coberta pela regra catch-all do bloco User). Script
  `scripts/migrate-support-tickets.js` move os antigos (sem backup — todos de teste).
  **Nota:** o acesso de cliente à raiz já era bloqueado (`if false`) — não era vazamento
  ativo, mas violação de governança de PII (agora corrigida).
- Decisão de execução: plano+aprovação da Gestora (área PII + firestore.rules). Pós-merge:
  deploy das rules (`firebase deploy --only firestore:rules`) + tratar a coleção raiz antiga.
- **Passos manuais CONCLUÍDOS (Gestora, 2026-07-11):** `firestore.rules` publicado no Console
  e a coleção raiz `Support_Tickets` de teste apagada. Fix 100% ativo em produção — **BUG-001
  totalmente fechado** (código + rules + higiene da base).
- Commit/PR: PR #70

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
- **[CONFIRMADO por leitura, 2026-07-11 / F2-04]:** o único gravador
  (`updateMemberQuotasAction`) fazia `type.toUpperCase()` em toda chave (gravava
  `1-TO-1`), enquanto o catálogo de produtos (`portfolio_parser.py`), a migração
  anterior (`archive/migrate-quotas-v3.js`) e o `OneToOneBookingModal` usam
  `1-to-1` (minúsculo). Leitores divididos: `getUserOneToOneQuotaAction`/
  `users-admin` liam `1-TO-1` (funcionavam); `OneToOneBookingModal`/
  `consumeQuotaAction` liam `1-to-1` (quebrados → saldo nulo). Amostra em
  `scripts/test-quota-match.js` confirma dados reais com cases misturados e até a
  MESMA cota duplicada em dois cases no mesmo mapa (`ANALISE-COMPORTAMENTAL`:8 +
  `analise-comportamental`:2).
- Status: **Corrigido** — 2026-07-11 (PR #71). Chave canônica = minúsculo
  `1-to-1`. Novo `src/lib/quota-keys.ts` (`normalizeQuotaKey` + `foldQuotaMap`,
  merge de duplicatas com **total=maior, used=soma, lastUpdated=mais recente**,
  política aprovada pela Gestora). `updateMemberQuotasAction` para de forçar
  UPPERCASE, auto-cura o drift a cada escrita e substitui o campo `quotas` inteiro
  via `update()` (não `set(merge:true)` — L16). Leitores dobram para `1-to-1` com
  fallback tolerante a `1-TO-1`. Migração `scripts/normalize-quota-keys.js`
  (LOCAL, dry-run + backup) normaliza as carteiras já gravadas — **a rodar pela
  Gestora pós-merge**. Não liga `consumeQuotaAction` ao booking (é o BUG-013, à
  parte). Validado: eslint 0 erros, test 52/52, type-check, build exit 0.
- Decisão de execução: Plano + política de merge apresentados e **aprovados pela
  Gestora** (2026-07-11, área financeiro/cotas). Corrigido via branch
  `fix/f2-04-bug008-quota-key-case`.
- Commit/PR: **mergeado** — PR #71 (`72b9985`, squash).
- Passo manual pendente (Gestora): `node scripts/normalize-quota-keys.js` (dry-run
  → conferir diff → `--apply` → dry-run de novo para confirmar 0 a normalizar).

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
- Status: **Corrigido** — PR #69. Auditoria confirmou que a versão de `post-event.ts` era
  **código morto**: o dispatcher `calendar.ts` sempre delega para `Booking.adminAddAttendeeAction`,
  e a de post-event não era importada/chamada em lugar nenhum (os 2 componentes admin importam
  de `@/actions/calendar`). Removida — fonte única passa a ser `booking.ts`.
- Decisão de execução: investigado (código morto confirmado por grep de todos os usos) e
  removido; sem risco de dado (nenhum caminho chamava a versão removida).
- Commit/PR: PR #69

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
- Status: **Corrigido** — 2026-07-11 (PR #77, F1-05). `getServiceDeliveryDataAction`
  passa a ler o `used` REAL da carteira do membro (`User/{matricula}/User_Permissions/
  quotas`), somando o `used` das chaves concedidas pelo produto — com normalização de
  chave (`foldQuotaMap`/`normalizeQuotaKey`, BUG-008). `total` segue de `grantedQuotas`.
- Decisão de execução: plano+aprovação da Gestora (cotas). Validado por eslint 0 erros,
  test 52/52, type-check, build exit 0. Conferência visual em produção (BUG-030).
- Commit/PR: PR #77

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
- Status: **Corrigido** — 2026-07-09 (PR #51, CT-2). Retroativo endurecido: (a) aviso
  de duplicidade no admin (contrato assinado exige confirmação de retificação); (b)
  vínculo à conta (token atado à matrícula; `resolve`/`process` exigem `requireMatricula`
  + matrícula do token === sessão — conta errada/deslogado bloqueados); (c) link único
  de uso único (`_ContractTokens/{sha256}`, expira 30d, consumido na assinatura). Rota
  `[slug]`→`[token]`; página reescrita. Bypasses aceitos como intencionais (documentados).
  **BREAKING intencional:** links genéricos antigos param de funcionar. Validado: eslint/
  test 52/52/tsc/build; página pública "deslogada" sem erro ao vivo. Fluxo logado em
  produção (BUG-030).
- Decisão de execução: **Aprovado pela Gestora** (2026-07-09). Corrigido via branch
  `feat/f1-02-ct2-retroactive-robust`.
- Commit/PR: **mergeado** — PR #51 (`0e1bc38`, squash).

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
- **[CONFIRMADO por leitura, 2026-07-11 / F1-05]:** ambos os pontos confirmados —
  `getNetworkingDataAction` enviava `contacts` inteiro + `cvUrl`/`portfolioUrl` ao client
  independente das flags (o `NetworkingCard` só escondia na UI → valores ocultos no payload);
  e o `journeyStageId` lia `d.User_JourneyMap?.current_stage` (campo/coleção mortos, BUG-018)
  → todos "onboarding", filtro de estágio quebrado.
- Status: **Corrigido** — 2026-07-11 (PR #77, F1-05). (a) **Privacidade:** o servidor só
  exporta o `value` de contatos e as URLs de CV/portfólio quando a flag `visible`/
  `cv_networking_visibility`/`portfolio_networking_visibility` for true (as flags seguem para a
  UI); valores ocultos não trafegam mais. (b) **Estágio:** o filtro por estágio foi **removido**
  (decisão da Gestora) — `journeyStageId` + a leitura morta de `User_JourneyMap` saíram da
  action, do `page.tsx` e do `NetworkingFilters` (o filtro contextual agora só aparece para
  Parceiros). Reintroduzível no futuro pela fonte v3 correta se desejado.
- Decisão de execução: plano+aprovação da Gestora (privacidade/PII + shape de dados). Validado
  por eslint 0 erros, test 52/52, type-check, build exit 0. Conferência visual em produção (BUG-030).
- Commit/PR: PR #77

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
- Status: **Corrigido** — 2026-07-17 (PR #118), **lote D da F1-06**. O `ProductItem` em
  `admin/products/page.tsx` passa a exibir uma linha de badges com os atributos do modelo de acesso
  (`escopo`, `concedeSelo`, `preRequisitos` com modo+etapas, `libera` com serviceCodes), **leitura
  apenas** — a fonte é a planilha via Sync, sem edição paralela. Só renderiza o que está configurado.
  Verificado read-only contra a base: **os 12 produtos** têm atributos e serão exibidos (ex.:
  `BPL-002: Escopo Membro | Concede Selo | Pré-req todos (BPL-000)`; `BPL-PAC-EB: ... | Libera:
  BPL-000..BPL-005`). Desbloqueia a Gestora validar a config de acesso pelo painel, sem abrir o
  Firestore.
- Decisão de execução: display-only, baixo risco; corrigido no lote D. Validação visual em produção.
- Commit/PR: **PR #118**

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
- **[CONFIRMADO em produção pela Gestora, 2026-07-09]:** `/contrato-retroativo/analise-comportamental`
  retornou "Ordem criada, mas falha ao gerar PDF: Produto não encontrado"; log Vercel
  `[Contract Generator] Erro: Produto não encontrado`. A order foi criada em `User_Orders`
  (BP-002), só o PDF falhou.
- Status: **Corrigido** — 2026-07-09 (PR #49, CT-0). `generateContractPdf` reescrito:
  resolve a matrícula via `_AuthMap/{uid}` (os docs de User são chaveados por matrícula,
  não uid — outra causa de falha), lê o produto de `products` (minúsculo), o contratante
  de `User/{matricula}.profile`, a order de `User_Orders`, e grava `Legal_Audits` sob a
  matrícula. **Escopo do CT-0 limitado a `generateContractPdf`**; o `getPendingContracts`/
  gate (BUG-055) não foi tocado (risco comportamental) — vai para a fase da entidade/gate.
  Validado: eslint (0 erros), test 52/52, tsc, build. **Validação funcional em produção
  pela Gestora** (BUG-030).
- Decisão de execução: Roadmap CT-0→CT-5 **aprovado pela Gestora** (2026-07-09).
  Corrigido via branch `fix/f1-02-ct0-contract-pdf`.
- Commit/PR: **mergeado** — PR #49 (`54e7a90`, squash).

### BUG-052 Documento do contrato não é visualizável dentro do HUB

- Severidade: Médio (item e da Gestora)
- Área/fase onde foi achado: F1-02 / contratos (2026-07-09)
- Arquivo(s) afetado(s): `src/app/hub/checkout/success` (tela de sucesso do checkout),
  `src/app/contrato-retroativo/[slug]/page.tsx`, `src/app/hub/membro/contratos/page.tsx`
- Cenário de falha: **[CONFIRMADO por leitura]** as telas de contrato citam o contrato
  e mandam "veja o PDF no seu Google Drive", mas **não exibem o texto do documento nem
  um link/botão direto** para visualizar/baixar. O `documentUrl` (Drive webViewLink)
  gravado em `Legal_Audits` não é surfado ao membro.
- Status: **Corrigido** — CT-3a (PR #55, avulso) e CT-3b.2 (PR #57, checkout) exibem as
  cláusulas na tela antes de assinar; e o **painel** `/hub/membro/contratos` (CT-4, PR #63)
  passa a **visualizar o documento dentro do HUB** via o proxy seguro `/api/docs` (novo
  `ContractDocButton`), em vez de "veja no Drive". Documento acessível no HUB em todas as
  superfícies de contrato.
- Decisão de execução: display de documento; baixo risco funcional.
- Commit/PR: PR #55 (avulso), PR #57 (checkout), PR #63 (painel/viewer in-app)

### BUG-053 Painel de contratos mostra status de pagamento, não de assinatura; sem documento/nota fiscal; link morto

- Severidade: Médio (item d da Gestora)
- Área/fase onde foi achado: F1-02 / contratos (2026-07-09)
- Arquivo(s) afetado(s): `src/app/hub/membro/contratos/page.tsx`
- Cenário de falha: **[CONFIRMADO por leitura]** o painel renderiza 1 card por order de
  `User_Orders` com badge de **status de pagamento** (`StatusBadge`), sem status de
  **assinatura** (pendente/retificação/assinado), sem link do documento, sem nota
  fiscal. O botão de aprovado aponta para `/hub/membro/dashboard` (**rota inexistente**
  — mesmo defeito do BUG-046); o ramo "Ver Fatura" é morto (cursor-not-allowed).
- Status: **Corrigido** — CT-4 (PR #63). Painel reescrito no padrão Gestão Funcional com
  **status real de assinatura**, documento visualizável no HUB, carimbo resumido, CTA por
  estado ("Assinar" reabre a tela de sucesso), nota fiscal, e a **rota morta** corrigida
  (`/hub/membro/dashboard` → `/hub/membro`). Nova action `getMemberContractsPanelAction`.
- Decisão de execução: área de contratos (gated) — plano + aprovação da Gestora (escopo:
  1 card por serviço + upload de nota fiscal no admin). Validação em produção (BUG-030).
- Commit/PR: PR #63 (painel) + PR #64 (upload nota fiscal admin)

### BUG-054 IP do cliente na assinatura é placeholder hardcoded (validade jurídica)

- Severidade: Médio (item f da Gestora — validade jurídica)
- Área/fase onde foi achado: F1-02 / contratos (2026-07-09)
- Arquivo(s) afetado(s): `src/actions/legal.ts:176`
- Cenário de falha: **[CONFIRMADO por leitura]** o registro em `Legal_Audits` grava
  `ipAddress: "Registrado pelo Gateway"` (string fixa), não o IP real do cliente no
  momento da assinatura. Para validade jurídica do aceite clickwrap, é preciso capturar
  o IP real (+ user-agent + timestamp confiável). A Gestora indicará ajustes adicionais.
- Status: **Corrigido (parte IP)** — 2026-07-09 (PR #50, CT-1). `generateContractPdf`
  captura o **IP real** + user-agent via `headers()` (x-forwarded-for/x-real-ip) e grava
  em `Contracts.signature` **e** no `Legal_Audits.ipAddress` (não mais o placeholder). Os
  **reforços jurídicos adicionais** (timestamp confiável, etc.) que a Gestora indicará
  ficam para o **CT-5**. Validado por eslint/test 52/52/tsc/build; funcional em produção
  (BUG-030).
- Decisão de execução: Corrigido via branch `feat/f1-02-ct1-contract-entity` (CT-1).
- Commit/PR: **mergeado** — PR #50 (`4ade038`, squash). Reforços extras → CT-5.

### BUG-055 Gate de contrato lê subcoleção legada `User/{uid}/Orders` sem escritor (inerte)

- Severidade: Médio
- Área/fase onde foi achado: F1-02 / contratos (2026-07-09)
- Arquivo(s) afetado(s): `src/actions/legal.ts:52` (`getPendingContracts`),
  `src/components/hub/ContractGateModal.tsx`
- Cenário de falha: **[CONFIRMADO por leitura]** `getPendingContracts` consulta
  `User/{uid}/Orders` (subcoleção legada, **sem escritor conhecido** — as orders reais
  estão em `User_Orders` raiz). Resultado: a lista de pendências é sempre vazia e o
  `ContractGateModal` provavelmente **nunca** apresenta contratos pendentes de fato.
- Status: **Corrigido (aposentado)** — PR #66. Decisão da Gestora: o requisito é travar o
  **acesso ao serviço** (não o HUB inteiro), e essa trava **por-serviço já existe** e ficou
  consistente com o gate de liberação (PR #60) — o entitlement (`services[serviceCode]` +
  quotas) só é concedido após pago E assinado, e as superfícies de entrega bloqueiam sem
  entitlement (`/hub/servicos/[slug]` via `getServiceDeliveryDataAction`: `if (!isAdmin &&
  !serviceEntitlement) throw`; `/hub/journey/[stepId]` via `getStageTelemetry.hasAccess` →
  redirect). Auditoria: nenhuma porta dos fundos nas superfícies de entrega. O portão morto
  (`ContractGateModal` + `getPendingContracts`) foi **removido** (era inerte e a abordagem
  errada). O membro navega o HUB, mas só abre o serviço quando pago+assinado.
- Decisão de execução: aposentar o gate morto + auditar cobertura (feito). Validação em
  produção (BUG-030).
- Commit/PR: PR #66
- Commit/PR: —

### BUG-056 Assinatura pós-checkout (CT-3b.2): grátis divergia do pago, CTAs antes da assinatura, sem herança de tema
- Severidade: Médio (UX/design + defeito funcional de paridade)
- Área/fase onde foi achado: F1-02 / contratos + F2-05 (design) — reportado pela Gestora (2026-07-10)
- Arquivo(s) afetado(s): `src/app/hub/checkout/success/page.tsx`,
  `src/components/contracts/CheckoutContractSigning.tsx`, `.../ContractDocumentView.tsx`,
  `.../ContractTermsCheckboxes.tsx`, `src/components/checkout/PaymentStatus.tsx`,
  `src/components/checkout/CheckoutFlow.tsx`, `src/app/contrato-avulso/[token]/page.tsx`
- Cenário de falha: **[CONFIRMADO em produção pela Gestora]** (a) o fluxo **grátis** não
  apresentava o contrato como o **pago** (aparência de "só checkbox") — telas divergentes
  em vez de um componente único; (b) os CTAs "Ir para o Dashboard"/"Ver Minha Jornada"
  (de `PaymentStatus` no pago e do bloco verde no grátis) apareciam **antes** da
  assinatura — deveriam surgir só **após** assinar; (c) as telas de contrato/checkout
  usavam cores **hardcoded** (não theme vars; avulso forçava `theme-dark`), tornando o
  texto ilegível em temas claros.
- Status: **Corrigido** — PR #58. Componente de assinatura unificado (grátis == pago),
  CTAs só no estado assinado (`PaymentStatus` ganhou `showActions`), migração para theme
  vars + header canônico Gestão Funcional (`FunctionalPageHeader`).
- Decisão de execução: área design system (gated) — plano + aprovação da Gestora antes de
  codar (escopo: uma PR coesa, só contrato + checkout). Ver `00-PLAN.md#f2-05`.
- Commit/PR: PR #58

### BUG-057 Admin: modal de contratos aparecia vazio (lê Legal_Audits pela chave uid, não matrícula)
- Severidade: Médio (admin não enxerga os contratos do cliente)
- Área/fase onde foi achado: F1-02 / contratos (2026-07-10) — reportado pela Gestora
- Arquivo(s) afetado(s): `src/app/admin/users/page.tsx`, `src/actions/legal.ts` (`getUserLegalAudits`)
- Cenário de falha: **[CONFIRMADO em produção pela Gestora]** a aba "Contratos & Aceites"
  mostrava "Nenhum contrato" mesmo para usuários com contratos assinados. O admin chamava
  `getUserLegalAudits(selectedUser.uid || selectedUser.matricula)` — **uid primeiro** —, mas
  os docs vivem em `User/{matrícula}/...` (chaveados por matrícula). Lia caminho vazio. Além
  disso, só olhava `Legal_Audits` (assinados), não a entidade `Contracts` (pendentes também).
- Status: **Corrigido** — PR #65. Nova action `getUserContractsAdminAction(matricula)`
  (`requireAdmin`) lê `User/{matricula}/Contracts` com todos os status; admin/users carrega
  pela matrícula e mostra badge de status real + documento (quando assinado) + nota fiscal.
- Decisão de execução: correção alinhada ao CT-4 (mesma entidade de contrato).
- Commit/PR: PR #65

### BUG-058 Painel de contratos não carrega — "Invalid time value" ao formatar data
- Severidade: Alto (a página inteira quebra)
- Área/fase onde foi achado: F1-02 / contratos (2026-07-11) — reportado pela Gestora (log Vercel)
- Arquivo(s) afetado(s): `src/actions/member-contracts.ts`, `src/app/hub/membro/contratos/page.tsx`
- Cenário de falha: **[CONFIRMADO em produção]** `/hub/membro/contratos` retornava
  `RangeError: Invalid time value` no `.map` dos cards e não renderizava. Causa: um contrato
  **sem pedido associado** (ex.: avulso pendente) caía no fallback `contract.createdAt`, que
  vem do Firestore como **Timestamp cru** (não serializado); `new Date(timestamp)` → Invalid
  Date → `date-fns` lança, derrubando o render de todos os cards.
- Status: **Corrigido** — PR #68. `member-contracts.ts` serializa `contract.createdAt` via
  `toIso`; o painel ganha `fmtDate` seguro (retorna null em data inválida, nunca lança).
- Decisão de execução: bugfix isolado (correção da raiz + blindagem do render).
- Commit/PR: PR #68

### BUG-059 Modal de onboarding bloqueado usava layout de upsell (com foto), não sendo serviço comprável

- Severidade: Baixo (UX/design)
- Área/fase onde foi achado: F1-03 / nav da jornada (2026-07-11) — reportado pela Gestora na validação
- Arquivo(s) afetado(s): `src/components/journey/JourneyNav.tsx`
- Cenário de falha: ao clicar na etapa `onboarding` bloqueada (não-membro), a nav abria o
  `UpsellServiceModal` (com foto de capa, como um serviço comprável). Onboarding não é
  comprável — é composição da jornada de membro — então o modal de upsell é enganoso.
- Status: **Corrigido** — PR #72. `handleStageClick` roteia `onboarding` bloqueado para um
  gate reutilizável (`JourneyGateModal`, extraído do antigo `NonMemberOffboardingModal`), com
  o **mesmo design do offboarding** (ícone + título + CTA, sem foto nem checkpoints). Título
  "Sua Jornada de Membro ainda não começou."; corpo "No Onboarding é onde a sua carreira
  profissional ganha potência! ... torne-se um Membro BPlen.".
- Decisão de execução: plano+aprovação da Gestora (sistema de design). Validado por eslint +
  test 52/52 + type-check + build. Conferência visual em produção (BUG-030).
- Commit/PR: PR #72

### BUG-060 Modal de upsell exibia nomes técnicos dos checkpoints (IDs de survey)

- Severidade: Baixo (UX/copy)
- Área/fase onde foi achado: F1-03 / nav da jornada (2026-07-11) — reportado pela Gestora
- Arquivo(s) afetado(s): `src/components/journey/UpsellServiceModal.tsx`
- Cenário de falha: o modal listava "benefícios" mapeando `product.capabilities.surveys`
  (IDs técnicos de survey, ex.: "welcome survey"), expondo nomenclatura interna ao usuário.
- Status: **Corrigido** — PR #72. Bloco de benefícios removido; o modal fica capa +
  descrição + CTA. `CheckCircle2` (import morto após a remoção) removido.
- Decisão de execução: plano+aprovação da Gestora. Validado por eslint + test + type-check + build.
- Commit/PR: PR #72

### BUG-061 Modal de detalhe do serviço fora do padrão global de modais + conteúdo em 2 caixas roláveis

- Severidade: Baixo (UX/design)
- Área/fase onde foi achado: F1-03 / nav da jornada (2026-07-11) — reportado pela Gestora
- Arquivo(s) afetado(s): `src/components/journey/JourneyNav.tsx`
- Cenário de falha: o modal de detalhe (botão "v" abaixo do ícone da etapa) era feito à mão
  (portal próprio) com overlay `branco 40%` fixo — destoando dos demais modais, que já usam o
  overlay adaptativo ao tema (`--modal-backdrop`, PR #47). Além disso o conteúdo ficava em
  duas caixas de texto empilhadas com barra de rolagem, dando sensação "travada".
- Status: **Corrigido** — PR #72. Convertido para o `GlassModal` canônico (overlay/tema/z
  coerentes). Conteúdo redesenhado em **grid de 2 colunas**: esquerda = descrição do serviço,
  direita = workflow de entrega (passos numerados), rolagem só onde necessário com o
  `custom-scrollbar` do padrão. **Fonte de conteúdo inalterada e única:** `stage.description`
  = `product.sheet.description` e `stage.workflow` = `product.workflow` (montados em
  `journey.ts`), o mesmo consumido no upsell e nas páginas de serviço/contrato.
- Decisão de execução: plano+aprovação da Gestora (sistema de design). Validado por eslint +
  test 52/52 + type-check + build. Conferência visual em produção (BUG-030).
- Commit/PR: PR #72

### BUG-062 Copy com acentos PT-BR removidos nas telas de Visão Geral e Gestão de Carreira (F1-04)

- Severidade: Baixo (UX/copy)
- Área/fase onde foi achado: F1-04 / validação por página (2026-07-11)
- Arquivo(s) afetado(s): `src/app/hub/visao_geral/page.tsx`, `src/app/hub/membro/gestao_carreira/page.tsx`
- Cenário de falha: dezenas de strings visíveis estavam sem acento ("Visao Geral", "Proximas",
  "Concluido", "Servico", "Reuniao", "Gestao", "Historico", "Progressao", "Disponivel", "Titulo",
  "Descricao", "Voce"...), violando a regra de copy PT-BR (L11/F0-06 — "Zero Emoji" não é "zero
  acento"; acento é copy correto em strings visíveis).
- Status: **Corrigido** — PR #73. Restaurados os acentos de todas as strings visíveis
  identificadas (~14 em `visao_geral`, ~18 em `gestao_carreira`). Comentários de código e
  identificadores permanecem ASCII (apropriado por L11). `contratos` já estava limpa; `agenda`
  tem a copy no componente compartilhado `AgendaManagementView` (fora do escopo deste PR de copy).
- Decisão de execução: ajuste de copy puro (texto visível), sem mudança de layout — Bloco 1
  (copy) da F1-04. Validado por eslint 0 erros + test 52/52 + type-check + build. Conferência
  visual em produção (BUG-030).
- Commit/PR: PR #73

### BUG-063 Headers das telas de Gestão Funcional (F1-04) fora do padrão canônico

- Severidade: Baixo (UX/design — consistência)
- Área/fase onde foi achado: F1-04 / F2-05 (2026-07-11)
- Arquivo(s) afetado(s): `src/app/hub/visao_geral/page.tsx`, `src/app/hub/membro/gestao_agenda/page.tsx`,
  `src/app/hub/membro/gestao_carreira/page.tsx`
- Cenário de falha: as 3 páginas usavam headers custom (back-link + título ad-hoc), enquanto o
  padrão Gestão Funcional (F2-05) tem um header canônico (`FunctionalPageHeader`: back + título
  cor-dupla + status-tag) já aplicado em contrato/checkout/`contratos`.
- Status: **Corrigido** — PR #74. As 3 migradas para `FunctionalPageHeader`. Na `gestao_carreira`
  o "X% concluído" da jornada foi para a **tag de status** (decisão da Gestora) e as métricas
  (objetivos/backlog/atas) seguem como faixa abaixo do header. Fecha parte do F2-05 (categorização
  Gestão Funcional) para estas 3 páginas.
- Decisão de execução: plano+aprovação da Gestora (sistema de design). Validado por eslint 0
  erros + test 52/52 + type-check + build. Conferência visual em produção (BUG-030).
- Commit/PR: PR #74

### BUG-064 Modal de detalhe da Visão Geral fora do padrão global de modais

- Severidade: Baixo (UX/design)
- Área/fase onde foi achado: F1-04 (2026-07-11)
- Arquivo(s) afetado(s): `src/app/hub/visao_geral/page.tsx`
- Cenário de falha: o modal de ata/feedback era feito à mão (`fixed inset-0 bg-black/60`), com
  overlay fixo que destoava dos demais modais (que usam o overlay adaptativo ao tema
  `--modal-backdrop` desde o PR #47) — mesma classe do BUG-061.
- Status: **Corrigido** — PR #74. Convertido para o `GlassModal` canônico (overlay/tema/z
  coerentes, portal/ESC próprios). Conteúdo (status, feedback, documento, ações) preservado.
- Decisão de execução: plano+aprovação da Gestora (sistema de design). Validado por eslint +
  test + type-check + build. Conferência visual em produção (BUG-030).
- Commit/PR: PR #74

### BUG-065 Responsividade geral das telas logadas precisa de varredura dedicada

- Severidade: Baixo (UX/responsivo) — **adiado (futuro)**
- Área/fase onde foi achado: F1-04 / validação da Gestora (2026-07-11)
- Arquivo(s) afetado(s): transversal (telas logadas do hub)
- Cenário de falha: na validação da F1-04 a Gestora observou que "há algumas coisas que não
  estão muito boas" no responsivo (mobile/tablet) de telas logadas — nada bloqueante, mas
  precisa de uma **passada dedicada de responsividade** com ajustes pontuais por tela.
- Status: **Aberto (adiado)** — registrado como pendência transversal a ser feita numa varredura
  própria de responsividade (candidata a track não-funcional / Fase 1 final), não bug de uma
  tela só. Telas logadas só validam em produção (BUG-030).
- Decisão de execução: fora do escopo dos PRs atuais (pedido explícito da Gestora de deixar
  "para o futuro"); quando priorizado, vira um esforço próprio página-a-página.
- Commit/PR: —

### BUG-066 E-mail Master (`legnp@bplen.com`) vazando na interface do cliente

- Severidade: **Alto** (confidencialidade / regra crítica do `CLAUDE.md` — o e-mail do Master nunca pode aparecer na UI)
- Área/fase onde foi achado: F1-04 / Gestão de Carreira (2026-07-12) — reportado pela Gestora
- Arquivo(s) afetado(s): `src/actions/career-module.ts` (fonte), `src/app/hub/membro/gestao_carreira/page.tsx` + `src/app/hub/visao_geral/page.tsx` (exibição)
- Cenário de falha: **[CONFIRMADO]** um feedback exibido em "Feedback Recebido" mostrava
  `legnp@bplen.com`. Fonte: `addCareerFeedbackAction` gravava `author: author || session.email
  || "Consultor BPlen"` — quando o Master criava o feedback sem `author`, o e-mail confidencial
  ia para o campo `author`, renderizado no card.
- Status: **Corrigido** — 2026-07-12 (PR #80). (1) **Fonte:** `addCareerFeedbackAction` nunca
  usa `session.email` (fallback → "Consultor BPlen"). (2) **Defesa de exibição (dados legados):**
  novo `src/lib/identity-mask.ts:maskInternalContact()` troca qualquer e-mail Master por um alias
  público ("Consultoria BPlen"), aplicado no autor/conteúdo do feedback (Gestão de Carreira +
  Visão Geral). (3) **Fonte única:** `src/config/identity.ts` centraliza os e-mails Master +
  alias; `auth-permissions.ts` passou a importar de lá (mesma lista para o guard e a máscara,
  sem divergir). Pendente (dado): ligar o feedback ao "Orientador" do evento exige o vínculo no
  modelo — por ora o autor mascarado usa o alias.
- Decisão de execução: plano+aprovação da Gestora (segurança/PII). Validado por eslint 0 erros,
  test 52/52, type-check, build exit 0.
- Commit/PR: PR #80

### BUG-067 Networking: contatos marcados como visíveis não aparecem (`isPublic` vs `visible`)

- Severidade: Médio (funcional)
- Área/fase onde foi achado: F1-05 / networking (2026-07-12) — reportado pela Gestora
- Arquivo(s) afetado(s): `src/actions/networking.ts`, `src/components/hub/NetworkingCard.tsx`
- Cenário de falha: **[CONFIRMADO]** o perfil salva cada contato como `{ value, isPublic }`
  (`profile-professional.ts`), mas o `getNetworkingDataAction` filtrava por `item.visible` (campo
  inexistente) → nenhum contato aparecia, mesmo marcado como público. Além disso o card só
  renderizava whatsapp/instagram/linkedin (não "telefone").
- Status: **Corrigido** — 2026-07-12 (PR #80). A action passa a ler `isPublic` (tolera `visible`
  legado) e exporta `{value, visible:true}` só dos públicos (preserva a privacidade do BUG-033);
  o card ganhou renderização de **telefone** (`tel:`). Renderização completa de todos os tipos de
  contato fica para o redesign do networking (pacote de design).
- Decisão de execução: bugfix funcional. Validado por eslint + test + type-check + build.
- Commit/PR: PR #80

### BUG-068 Networking: crash ao trocar de aba (Parceiros → Profissionais/Networking)

- Severidade: Médio (a seção quebra)
- Área/fase onde foi achado: F1-05 / networking (2026-07-12) — reportado pela Gestora (print DevTools)
- Arquivo(s) afetado(s): `src/app/hub/networking/page.tsx`, `src/components/hub/NetworkingCard.tsx`
- Cenário de falha: **[CONFIRMADO]** `TypeError: Cannot read properties of undefined (reading
  'slice')`. Ao trocar de aba, o `type` do card virava "member" imediatamente, mas o estado `data`
  ainda tinha objetos de **parceiro** (o load tem debounce de 400ms) → parceiro renderizado como
  membro → `member.hashtags` undefined → `tags.slice()` quebrava.
- Status: **Corrigido** — 2026-07-12 (PR #80). Na troca de aba o `data` é limpo (`setData([])` +
  `setIsLoading(true)`) para não renderizar shape divergente; e o card ganhou guard de precedência
  (`(isMember ? member.hashtags : partner.keywords) || []`).
- Decisão de execução: bugfix. Validado por eslint + test + type-check + build.
- Commit/PR: PR #80

### BUG-069 Networking: ícone de ação morto no card

- Severidade: Baixo (UX)
- Área/fase onde foi achado: F1-05 / networking (2026-07-12) — reportado pela Gestora
- Arquivo(s) afetado(s): `src/components/hub/NetworkingCard.tsx`
- Cenário de falha: um botão (ícone `ExternalLink`, quadradinho com seta) no rodapé do card não
  tinha `onClick` — clicar não fazia nada.
- Status: **Corrigido** — 2026-07-12 (PR #80). Botão removido (mantém o card limpo, decisão da
  Gestora "remover"). Import `ExternalLink` removido.
- Decisão de execução: bugfix/UX. Validado por eslint + test + type-check + build.
- Commit/PR: PR #80

### BUG-070 Perfil Profissional sincroniza com documento órfão (`results/check_in` vs `Surveys/check_in`)

- Severidade: Alto (fluxo de dados quebrado; identidade/perfil)
- Área/fase onde foi achado: F1-05 / profile_settings (2026-07-15) — reportado pela Gestora
  (editou remuneração no perfil, não refletiu na survey/admin/Firestore)
- Arquivo(s) afetado(s): `src/actions/profile-professional.ts`, `src/actions/get-user-results.ts`
- Cenário de falha: `getProfessionalProfileAction`/`updateProfessionalProfileAction`/
  `updateTalentBankParticipationAction` liam/gravavam `User/{matricula}/results/check_in`
  (minúsculo, **plano**), mas a survey de check-in real grava em `User/{matricula}/Surveys/check_in`
  no campo aninhado `data` (`submit-survey.ts`). Ninguém além do perfil usava `results/check_in` —
  documento **órfão**. Resultado: o bidirecional survey↔perfil nunca funcionou (perfil não lia as
  respostas reais; edições do perfil não chegavam à survey/admin). Pré-existente; o PR4 (prefill)
  herdou o mesmo caminho errado.
- Status: **Corrigido** — 2026-07-15 (PR #92). Perfil passa a ler/gravar `Surveys/check_in` sob
  `data.*` com merge; **nunca seta `status`** (não marca onboarding como concluído indevidamente —
  `checkSurveyCompletedAction` exige `status==="completed"`). Prefill do PR4 lê `Surveys/check_in.data`.
  Sem migração (o órfão só tinha dado de teste).
- Decisão de execução: plano+diagnóstico apresentados e aprovados pela Gestora (área identidade/
  dados). Validado por eslint + test 52/52 + type-check + build.
- Commit/PR: PR #92

### BUG-071 CV/Portfólio "Visível Network" não aparece na página de Networking (de enfeite)

- Severidade: Médio (funcional; feature anunciada não funciona)
- Área/fase onde foi achado: F1-05 / profile_settings + networking (2026-07-15) — reportado pela Gestora
- Arquivo(s) afetado(s): `src/actions/profile-professional.ts`, `src/actions/networking.ts`,
  `src/components/hub/NetworkingCard.tsx`
- Cenário de falha: (1) `networking.ts` lia a URL do documento de `profile.address.cv_url`/
  `portfolio_url` — campos que o save do perfil **nunca** gravava (o arquivo enviado vira
  `cv_upload`/`portfolio_upload`); (2) o `NetworkingCard` nem renderizava o CV (só o portfólio, via
  href cru — que não abre entre usuários). Toggle "Visível Network" era decorativo.
- Status: **Corrigido** — 2026-07-15 (PR #93). Save denormaliza `cv_doc_url`/`portfolio_doc_url`
  (+ nomes) no bloco `profile.networking`; `networking.ts` lê de lá respeitando as flags; o card
  ganhou ações reais "Ver CV"/"Ver Portfólio" que abrem via proxy `/api/docs/{fileId}?token=` com o
  token do visitante (a service account do proxy acessa o doc que o dono liberou). Sem mudança no proxy.
- Decisão de execução: aprovado pela Gestora (fluxo real de visualização cross-user com opt-in do dono).
  Validado por eslint + test 52/52 + type-check + build.
- Commit/PR: PR #93

### BUG-072 Admin devolutiva exibe `beneficios_pacote` como `[object Object]`

- Severidade: Baixo (exibição admin)
- Área/fase onde foi achado: F1-05 (2026-07-15) — reportado pela Gestora; **adiado para F1-06**
- Arquivo(s) afetado(s): `src/components/admin/DevolutivaComportamentalView.tsx:641` (`formatAnswerValue`)
- Cenário de falha: **[CONFIRMADO]** a linha `.map(([k, v]) => \`${k}: ${v}\`)` interpolava o valor
  cru; quando `v` era um objeto (o benefício `{enabled, value, currency, ...}`), `${v}` virava
  `[object Object]`. A função não recursava para o nível aninhado.
- Status: **Corrigido** — 2026-07-17 (PR #116), **lote B da F1-06**. `formatAnswerValue` passa a
  recursar no objeto aninhado, entre parênteses (para o separador não colidir com o nível de cima), e
  omite só campo **vazio** — `false` é preservado, senão um benefício desabilitado (`enabled:false`)
  apareceria como ativo. **Correção geral** (Lição 26): vale para qualquer resposta com objeto
  aninhado, não só benefícios. Verificado por simulação com o dado real de `beneficios_pacote`:
  "Salário (enabled: Sim | value: 5000 | currency: BRL) | ...". Casos de borda preservados (arquivo
  `url` → link; array → lista; null → "—").
- Decisão de execução: corrigido no lote B; validação visual em produção.
- **VALIDADO E APROVADO EM PRODUÇÃO pela Gestora (2026-07-17):** "funcionando corretamente" — os
  benefícios da devolutiva aparecem legíveis, sem `[object Object]`. Deploy `f8da309`, success.
- Commit/PR: **PR #116**

### BUG-073 Sessões de MentoCoach nunca aparecem para o membro (agenda sempre vazia)

- Severidade: **Alto** (funcional; serviço contratado não é entregável — o membro não consegue
  agendar nenhuma das 10 sessões de MentoCoach)
- Área/fase onde foi achado: F1-03 / jornada — reportado pela Gestora em 2026-07-16 (print de
  `/hub/journey/mentocoach` com "Nenhuma sessão disponível para esta data" em toda data)
- Arquivo(s) afetado(s): `src/components/journey/StepRenderer.tsx` (`getMeetingFilterKeyword`),
  extraída para `src/lib/journey/meeting-keyword.ts`
- Cenário de falha: **[CONFIRMADO]** por inventário read-only na base real (2026-07-16). O sync do
  admin está **correto** — há 25 eventos `summary="MentoCoach"` em `Calendar_Events`, com data
  futura, `totalCapacity=1` e `mentor="Lisandra Lencina"`. O defeito é no filtro de exibição:
  `getMeetingFilterKeyword` tem regra explícita para cada serviço (onboarding, análise
  comportamental, plano de carreira, grupo, individual, coaching, mentoria, offboarding) mas
  **nenhuma para mentocoach** — a regra `coaching` não pega `mentocoach` (a palavra termina em
  "coach", não "coaching"). Sem regra, cai no fallback do `referenceId`: `sessao-mentocoach` →
  `"sessao mentocoach"`. O filtro então exige que o nome do evento **contenha** essa frase, e
  `"MentoCoach"` não contém `"sessao mentocoach"` → **0 eventos em todas as 10 paradas**.
- Status: **Corrigido** — 2026-07-16 (PR #101). Regra `mentocoach` adicionada. Simulação da função
  real contra os 538 eventos da base: as 10 paradas passam de **0 para 25** eventos, sem alterar
  nenhuma parada que já funcionava.
- Decisão de execução: aprovado pela Gestora (opção "MentoCoach + as 2 paradas erradas").
  Validado por eslint dos arquivos tocados (baseline do `StepRenderer` idêntico ao da `main`:
  29 problemas legados), test 59/59 (7 novos, com mutação da regra central), type-check, build.
- Nota operacional (não é código): a política de **3 dias de antecedência** segue valendo — os
  eventos de 16 e 17/07 não aparecem; o primeiro visível é o de **21/07**.
- Commit/PR: PR #101

### BUG-074 Paradas da jornada listam sessões de OUTRO serviço (título sequestra o filtro)

- Severidade: **Alto** (funcional; o membro pode agendar a sessão errada — o card é clicável)
- Área/fase onde foi achado: F1-03 / jornada — achado colateral durante a investigação do
  `BUG-073` (2026-07-16), não estava no escopo do reporte da Gestora
- Arquivo(s) afetado(s): `src/lib/journey/meeting-keyword.ts` (extraída de `StepRenderer.tsx`)
- Cenário de falha: **[CONFIRMADO]** por simulação contra a base real. `getMeetingFilterKeyword`
  consultava `referenceId` **e** `title` na mesma regra, então uma parada cujo título apenas citava
  outro serviço herdava o filtro errado. Em `gestao-e-desenvolvimento`, todas as 10 paradas têm
  `referenceId="orientacao-em-grupo"`, mas 2 eram sequestradas pelo título:
  - "Gestão Comportamental e Emocional" (título tem "comportamental") → listava **111 sessões de
    Devolutiva Análise Comportamental**;
  - "Finanças para Carreira Profissional" (título tem "carreira") → listava **93 sessões de
    Consultoria Plano de Carreira**.
- Status: **Corrigido** — 2026-07-16 (PR #101). O `referenceId` (que identifica o tipo de sessão)
  passa a ser consultado **antes** do título (texto livre, editável no admin); o título segue como
  fallback para paradas cujo `referenceId` não identifica o tipo. As 2 paradas passam de 111/93
  eventos errados para **0** — estado correto até os `Tema:` serem preenchidos (ver nota abaixo).
- Decisão de execução: aprovado pela Gestora junto do BUG-073.
- Nota de dado (não é código, ação da Gestora): as demais 7 paradas de grupo mostram 0 porque os
  eventos "Orientação em Grupo" usam o mecanismo `Tema:` da descrição, que casa **exatamente** com
  o título da parada. Hoje **42 dos 43 eventos estão com `Tema: "A DEFINIR"`** e só 1 tem tema real
  ("Autoconhecimento e Aprendizagem" — a única parada de grupo que exibe evento). Preencher o
  `Tema:` no Google Calendar destrava as demais. Também registrado: não existe **nenhum** evento de
  Offboarding na agenda.
- **ESCLARECIMENTO DA GESTORA (2026-07-17) — `Tema: "A DEFINIR"` NÃO é bug nem dado faltante, é
  operação intencional.** O campo `Tema:` do evento no Google Calendar é o **mecanismo deliberado**
  que a Gestora usa para ligar cada evento à etapa correspondente do hub, preenchido de forma
  **contínua em produção** (faz parte da rotina operacional dela). "A DEFINIR" é o estado natural de
  um evento ainda não vinculado. **Sessões futuras: não tratar como defeito nem "corrigir" o dado** —
  é feature. O comportamento correto é: sem `Tema:` casado, a parada não exibe o evento (esperado).
- Commit/PR: PR #101

### BUG-075 Filtro de bloqueio de agenda não tolera erro de digitação ("Bloquado")

- Severidade: Baixo (sem impacto vivo hoje; latente)
- Área/fase onde foi achado: F1-03 / jornada — achado colateral da investigação do `BUG-073`
  (2026-07-16)
- Arquivo(s) afetado(s): `src/actions/calendar-module/sync.ts`, `src/actions/calendar-module/queries.ts`
- Cenário de falha: **[CONFIRMADO]** o sync e o `getSyncedEvents` escondem eventos por
  `summary.toLowerCase().includes("bloqueado")`. Há **5 eventos escritos "Bloquado"** (sem o "e") na
  base, que escapam do filtro e entram no HUB como eventos comuns. Hoje **sem impacto**: são todos de
  maio/2026 (passados) e nenhuma palavra-chave de parada casa com "bloquado". O risco é um bloqueio
  futuro com o mesmo typo virar horário agendável.
- Status: **Aberto** — reportado à Gestora. A correção mais rápida é de **dado** (renomear os 5
  eventos no Google Calendar); endurecer o filtro no código exige cuidado para não capturar títulos
  legítimos por engano.
- **Atualização (2026-07-16, F1-06):** a Gestora informou que esses eventos **já não existem no
  Google Calendar**, e a investigação confirmou — são fósseis de maio/2026. Isso **invalida as duas
  saídas cogitadas acima**: renomear no Google não remove nada (o sync não varre o passado —
  `BUG-085`), e endurecer o filtro do sync **não é mais o remédio certo**, porque a investigação
  mostrou que o sync **não deveria estar filtrando bloqueio nenhum** (`BUG-084`). O typo, aliás,
  fazia esses 5 eventos agirem como bloqueadores — ou seja, acidentalmente **certo**. Este bug perde
  o objeto próprio: resolve-se como efeito do `BUG-084` (parar de filtrar no sync) + `BUG-085`
  (limpar o passado). Manter aberto até os dois decidirem.
- Status final: **Corrigido no código** — 2026-07-16 (PR #110), como efeito do `BUG-084`. O novo
  `isBlockerSummary` casa o radical normalizado `bloqu`, então "Bloquado" passa a ser reconhecido
  como bloqueio; um typo futuro não reabre o buraco. Os 5 docs fósseis de maio/2026 seguem na base
  (`BUG-085`), agora inertes: são passados e o filtro os reconhece.
- Decisão de execução: absorvido pela correção do `BUG-084` (mesmo arquivo, `sync.ts`).
- Commit/PR: **PR #110**

### BUG-076 Política de agendamento não era executada pelo sistema (4 regras desalinhadas)

- Severidade: **Alto** (segurança + adequação funcional; regras de negócio anunciadas ao membro
  sem nenhuma trava real no servidor)
- Área/fase onde foi achado: F1-03/F1-04 / agendamento — achado ao auditar os 5 pontos de
  agendamento a pedido da Gestora (2026-07-16), antes de reescrever o texto da política
- Arquivo(s) afetado(s): `src/config/calendarConfig.ts`, `src/components/ui/Calendar.tsx`,
  `src/actions/calendar-module/booking.ts`, `src/components/ui/UserBookings.tsx`,
  `src/components/shared/OneToOneBookingModal.tsx`; novo `src/lib/booking/policy.ts`
- Cenário de falha: **[CONFIRMADO]** por leitura direta. O card "Política de Agendamento" anunciava
  regras que o sistema não cumpria:
  1. **Janela máxima de 20 dias só valia para eventos com "onboarding" no nome** — todos os outros
     apareciam com até 90 dias de antecedência (a janela do sync).
  2. **O limite semanal fazia o oposto do pretendido**: `isWeekLocked` comparava só semana/ano, então
     **qualquer** agendamento trancava a semana inteira. Um membro com devolutiva na segunda **não
     conseguia** marcar um 1 to 1 na mesma semana.
  3. **Nenhuma das regras era validada no servidor.** `bookEventAction` checava apenas vaga,
     duplicidade, rate-limit e sessão — o resto era só o cliente escondendo/desabilitando o botão.
     Requisição forjada agendava fora da política sem resistência.
  4. **A regra de 24h para cancelar/reagendar não existia em lugar nenhum** — o membro cancelava
     minutos antes da sessão, sem aviso e sem consequência.
- Status: **Corrigido** — 2026-07-16 (PR #103). Janela de 20 dias para todos; limite semanal por
  **tipo** de sessão (relaxa a regra para o que a política sempre quis dizer); as 3 regras validadas
  no servidor; prazo de 24h implementado com aviso antes da ação e rastro `lateCancellation` em
  `User_Booking_History`. Novo `src/lib/booking/policy.ts` é a **fonte única** chamada por cliente e
  servidor — as duas pontas não podem mais divergir, que foi como o desalinhamento nasceu.
- Decisão de execução: plano apresentado e **aprovado pela Gestora** (opção "Completo: tela +
  servidor"; cancelamento tardio = permite + marca crédito como perdido). Decisões registradas:
  - **O funil de lead público ficou de fora de propósito** — `bookEventAction` é compartilhado e o
    público roda com `PUBLIC_BOOKING_SETTINGS` (33 dias); aplicar 20 dias globalmente quebraria o
    funil (receita). As regras só incidem quando há matrícula.
  - **`eventSummary` passa a ser denormalizado no agendamento** (o `category` só distinguia
    "1to1"/"geral"); legados têm o tipo resolvido pelo evento, para a regra valer desde o dia 1.
  - **Fronteira da janela virou por DIA e simétrica** (3º e 20º dia cabem inteiros) — a regra legada
    cortava no início do 20º dia, o que excluiria o 20º dia e contradiria o texto publicado. Achado
    por um teste.
  - Validado: 20 testes novos, **mutação das 3 regras centrais quebra o teste correspondente**;
    eslint sem warning novo; test 79/79; type-check; build exit 0.
- Nota de dependência: a frase "preservam o crédito" é **operacional/manual hoje** — o débito de
  crédito ao agendar nunca foi ligado (`BUG-013`). Este PR deixa o rastro pronto, mas não liga.
- Commit/PR: PR #103

### BUG-077 Concluir uma parada marca todas as paradas irmãs como concluídas (id colapsado)

- Severidade: **Alto** (adequação funcional; o serviço fica inconcluível corretamente — a jornada
  do membro pula de 1/10 para 10/10 sozinha)
- Área/fase onde foi achado: F1-03 / jornada — achado colateral ao responder uma dúvida da Gestora
  sobre o nome dos cards da `visao_geral` (2026-07-16). Não estava no escopo da pergunta.
- Arquivo(s) afetado(s): `src/actions/journey.ts` (montagem dos substeps),
  `scripts/portfolio_parser.py` (geração do id), `portfolio/portfolio_payload.json` (dado)
- Cenário de falha: **[CONFIRMADO]** por simulação da cadeia real contra `products/mentocoach`.
  O `journey.ts` **descartava** o `deliverySteps[].id` do dado e recalculava
  `ss-{type}-{referenceId}`. Serviços que repetem o mesmo `referenceId` em várias paradas
  (MentoCoach: 10x `sessao-mentocoach`; GDC: 10x `orientacao-em-grupo`) recebiam **o mesmo id**.
  Como a conclusão é gravada por id (`completedSubSteps`), a simulação provou:
  - concluir **só** a 1ª Sessão de MentoCoach marcava **as 10** como concluídas;
  - clicar na 5ª Sessão abria a **1ª** (`substeps.find(ss => ss.id === ...)` devolve a 1ª ocorrência).
  Causa-raiz do remendo anterior: o parser já tentava resolver com um sufixo de ordem, mas **só para
  `BPL-004`** (hardcode) — e mesmo esse era **inócuo**, porque o `journey.ts` recalculava o id e
  descartava o sufixo. Ninguém tinha visto porque nenhum membro havia concluído uma 1ª sessão ainda.
- Status: **Corrigido** — 2026-07-16 (PR #104). `journey.ts` honra o `step.id` do dado (com fallback
  para produto legado sem id); parser aplica o sufixo de ordem sempre que `(serviço, tipo,
  referenceId)` se repete, em vez do hardcode do BPL-004; trava nova no parser falha alto se um id
  duplicado voltar. Payload regenerado.
- Decisão de execução: plano apresentado e **aprovado pela Gestora** ("dado + código, tudo agora" +
  "simular contra o dado real antes"). Verificações que embasaram a decisão:
  - **Zero migração necessária**: levantamento read-only mostrou 6 usuários, 4 com progresso e
    **nenhum** com conclusão gravada nos ids duplicados. A janela existia só porque ninguém tinha
    concluído uma sessão ainda.
  - **Só os ids duplicados mudam** (`ss-meeting-sessao-mentocoach` → `...-2..-11`); ids já em uso
    (`ss-survey-disc` etc.) permanecem estáveis, por isso o sufixo é condicionado à repetição.
  - **GDC não mudou no payload** — o hardcode antigo já produzia o mesmo id que a regra geral
    (nenhuma regressão nele); ele é corrigido só pelo lado do `journey.ts`.
  - Pré-voo do `sync_live_db.js` (que usa `set()` **sem merge**): payload x banco comparado produto
    a produto — nenhuma divergência real (só ordem de chaves no `preRequisitos`), confirmando que
    ninguém editou produtos pelo admin desde 2026-07-08 e que o sync não reverteria nada.
  - 5 testes de regressão + mutação da trava do parser (que falhou alto, como esperado).
- Commit/PR: PR #104

### BUG-078 Cards da Visão Geral repetiam o mesmo nome (descrição genérica no dado)

- Severidade: Baixo (usabilidade; impressão de tarefas repetidas)
- Área/fase onde foi achado: F1-04 / `visao_geral` — dúvida da Gestora (2026-07-16)
- Arquivo(s) afetado(s): `portfolio/portfolio_bplen.xlsx` (aba Checkpoints, coluna Description),
  `portfolio/portfolio_payload.json`
- Cenário de falha: **[CONFIRMADO]** a `visao_geral` monta o nome do card com
  `sub.description || sub.title` (`getActivityName`, comentário explícito: "Fonte única de verdade:
  descrição vinda do Excel/banco"). As 10 sessões de MentoCoach tinham a **mesma** descrição
  ("Sessão de MentoCoach"), então os 10 cards saíam idênticos.
- Status: **Corrigido** — 2026-07-16 (PR #104). Correção foi de **dado**, feita pela Gestora na
  planilha (Description agora é única por linha: "1ª Sessão de MentoCoach"...); payload regenerado
  e sincronizado.
- Decisão de execução: **não trocar o código para usar o `title`** — decisão consciente. As 5
  primeiras paradas do MentoCoach têm o **título** idêntico ("Análise Comportamental") e são as
  **descrições** que as distinguem ("Avaliação de Perfil Comportamental (DISC)", "Mapa de
  preferências..."). Usar o título quebraria essas 5. A precedência da descrição está correta; a
  duplicidade era do dado, corrigida na fonte.
- Commit/PR: PR #104

### BUG-079 Conclusão de etapa com chave legada nunca é reconhecida (leitura crua vs escrita normalizada)

- Severidade: **Alto** (adequação funcional; etapa concluída não destrava a seguinte — trava a
  jornada de forma permanente e silenciosa)
- Área/fase onde foi achado: F1-03 / motor de acesso — achado ao desenhar a regra de liberação
  do Posicionamento/MentoCoach pedida pela Gestora (2026-07-16). **Latente**: ninguém concluiu a
  etapa afetada ainda.
- Arquivo(s) afetado(s): `src/lib/access/journey-adapter.ts` (`conclusoesFromProgress`),
  `src/actions/journey.ts` (`updateJourneySubStepAction`)
- Cenário de falha: **[CONFIRMADO]** por levantamento read-only. A **escrita** normaliza a chave
  da etapa (`updateJourneySubStepAction` procura `matchedDbKey` por `normalizeString`), então
  grava na chave **legada** já existente no documento. A **leitura** não normaliza:
  `conclusoesFromProgress` faz `progress.steps[stage.id]` cru. Assimetria confirmada no dado real:
  - `BP-005-PF-260523` e `BP-011-PF-260526` têm a chave **`plano_de_Carreira`**, que não casa com o
    id da etapa `plano-de-carreira` (BPL-003);
  - `BP-002-PF-260331` tem `Primeiros Passos`, que não casa com nenhum id.
  Efeito: ao concluir o Plano de Carreira, **BPL-003 nunca entra em `conclusoes`** → a Gestão e
  Desenvolvimento (`preReq: todos [BPL-000, BPL-003]`) fica **permanentemente** em `SEQUENCE_LOCK`.
  Hoje não se manifestou porque os dois usuários estão com o plano em `current`, não `completed`.
- Status: **Corrigido** — 2026-07-16 (PR #105). Leitura tolerante em `conclusoesFromProgress`, com a
  **mesma normalização que a escrita já usa** (`normalizeString`); chave exata tem precedência sobre
  a legada. **Sem migração de dado** — as chaves legadas seguem funcionando; migrá-las é higiene
  opcional posterior.
- Decisão de execução: aprovado pela Gestora no plano da seção 10. Validado por 5 testes novos
  (incluindo os discriminantes "chave legada NÃO concluída não vira conclusão" e "chave exata vence
  a legada") + **mutação das 2 regras centrais**, test 88/88, type-check, build, eslint 0.
- Commit/PR: PR #105

### BUG-080 Rótulos do farol da jornada mentiam sobre o estado da etapa

- Severidade: Médio (usabilidade; o membro lê o oposto do estado real)
- Área/fase onde foi achado: F1-03 / jornada — achado ao investigar a dúvida da Gestora sobre o
  Posicionamento aparecer como "Não liberado" (2026-07-16)
- Arquivo(s) afetado(s): `src/components/journey/JourneyNav.tsx`; regra extraída para
  `src/lib/journey/stage-beacon.ts`
- Cenário de falha: **[CONFIRMADO]** por leitura da cadeia de rótulos. Dois defeitos, ambos de ORDEM:
  1. **Progresso mascarava a trava**: "Foco Atual" era decidido por `percentage > 0` **antes** do
     ramo de sequência. O MentoCoach tem 33% (as 5 paradas de Análise Comportamental que ele
     compartilha), então exibiria "Foco Atual" **mesmo travado** — anulando a Fase C na tela.
  2. **"Não Liberado" mentia**: era o *default* da cadeia, e caía nele a etapa **acessível que
     apenas não é a próxima da fila**. Era por isso que o Posicionamento, liberado e clicável,
     aparecia como "Não Liberado" para a Gestora.
- Status: **Corrigido** — 2026-07-16 (PR #106). Trava avaliada antes do progresso; caso novo
  "Disponível" para a etapa acessível fora da fila. Regra extraída para função pura (a ordem das
  regras **é** a regra, já errou duas vezes e estava inline no JSX, intestável). Cor de "Disponível"
  reaproveita o azul de "Próximo Passo" em variante discreta — sem cor nova na paleta.
- Decisão de execução: aprovado pela Gestora no plano da seção 10. Validado por 9 testes (incluindo
  o discriminante "travada SEM possuir o serviço não vira 'Aguardando Fase Anterior'") + mutação das
  2 regras centrais, test 97/97, type-check, build, eslint 0.
- Commit/PR: PR #106

### BUG-081 Clique na 1a etapa travada nao fazia nada (return mudo) + modal nomeava a etapa errada

- Severidade: Médio (usabilidade; o membro clica e nada acontece — sem modal, sem navegacao, sem erro)
- Área/fase onde foi achado: F1-03 / jornada — **reportado pela Gestora** ao validar a Fase C
  (2026-07-16): clicar no MentoCoach travado abria o modal, mas clicar no Posicionamento travado
  nao fazia absolutamente nada.
- Arquivo(s) afetado(s): `src/components/journey/JourneyNav.tsx` (`handleStageClick`),
  `src/components/journey/SequenceLockModal.tsx`, `src/hooks/useJourney.ts`; regra extraida para
  `src/lib/journey/pending-stages.ts`
- Cenário de falha: **[CONFIRMADO]** por leitura direta. Dois defeitos com a mesma raiz — a UI
  deduzia a pendencia pela POSICAO em vez de usar a resposta do motor:
  1. **Return mudo:** `if (isSequenceLocked) { const i = stages.findIndex(...); if (i > 0) { ...abre
     modal... } return; }`. O Posicionamento e' a etapa de indice **0**, entao a condicao era falsa e
     a funcao retornava sem fazer nada. O guard nasceu de uma premissa verdadeira ate a Fase C: "a
     1a etapa nunca pode estar travada por sequencia".
  2. **Modal mentia:** exibia `stages[indice - 1].title` — "a etapa anterior" por posicao. Mas os
     servicos paralelos nao esperam a etapa anterior: esperam `pendentes: [BPL-003, BPL-004]`. Para o
     MentoCoach o modal mostrava so o GDC, escondendo o Plano de Carreira.
  O motor **sempre** calculou `pendentes` (o proprio adaptador ja registrava "para UI futura: listar
  pendentes no modal") — a UI e' que descartava.
- Status: **Corrigido** — 2026-07-16 (PR #108). `pendentes` exposto na `StageTelemetry`; o modal
  abre **sempre** que a etapa esta travada; as pendencias vem do motor e sao resolvidas em
  `resolvePendingStageTitles` (funcao pura), com deducao posicional **apenas** no fallback legado
  (etapa sem atributos, em que `pendentes` vem vazio). Modal passou a receber uma **lista** e ficou
  plural-aware ("a etapa X precisa" / "as etapas X e Y precisam"); lista vazia usa texto generico em
  vez de nomear a etapa errada. `SubStepRail` (o outro consumidor do modal) atualizado.
- Decisão de execução: bugfix direto, reportado pela Gestora. Validado por 10 testes novos +
  mutação das 2 regras centrais (voltar a deduzir pela posição; ignorar o motor), test 122/122,
  type-check, build, eslint sem warning novo (`SubStepRail` mantém o baseline legado de 2/0,
  idêntico à `main`).
- Nota de processo: um teste meu falhou e **estava certo** — eu tinha deixado o fallback posicional
  ativo quando o motor respondia mas os códigos não mapeavam, o que **inventaria** uma etapa errada.
  Corrigido o código, não o teste (mesmo padrão da fronteira de 20 dias no `BUG-076`).
- Commit/PR: PR #108

### BUG-082 Gráfico da Tríade do Tempo plotava 0% e o diagnóstico saía invertido

- Severidade: **Alto** (adequação funcional + dano ao membro: além do gráfico errado, o sistema
  entregava um diagnóstico negativo a quem teve o melhor resultado)
- Área/fase onde foi achado: F1-04 / `hub/membro` — **reportado pela Gestora** (2026-07-16), com
  print do `BP-005-PF-260523`
- Arquivo(s) afetado(s): `src/components/hub/TriadVennChart.tsx`; regra extraída para
  `src/lib/charts/triad-category.ts`
- Cenário de falha: **[CONFIRMADO]** contra o dado real. O gráfico exibia **0% / 0% / 29%** para um
  membro com **41% / 29% / 29%** gravados. O dado no banco está **correto** e a action lê o doc
  certo (`User/{matricula}/results/gestao_tempo`) — o defeito era o casamento de rótulo:
  `data.find(item => item.label.toLowerCase().includes(keyPart))`. Os rótulos da tela do membro têm
  **acento**: `"importância"` **não** contém `"importan"` (o `â` quebra a substring) e `"urgência"`
  não contém `"urgen"`. Só `"circunstância"` casava, porque o acento dela vem **depois** do trecho
  buscado — exatamente o 0%/0%/29% do print. O `|| { percentage: 0 }` transformava a falha de busca
  num **zero silencioso**.
  **Por que ninguém tinha visto:** a tela do **admin** passa os rótulos **sem acento**
  (`"Importancia"`), e por isso sempre funcionou — a Gestora via o valor certo no admin e zero no
  membro.
  **2º defeito, na mesma função:** `getDiagnostic` caía no `else` para qualquer rótulo acentuado. O
  `BP-005` tem **"Importância" no topo (41%)** — o **melhor** resultado da tríade, cujo diagnóstico
  é "Alta Performance" — e recebia **"Atenção ao Desperdício: excesso de tempo em distrações ou
  tarefas irrelevantes"**. **3º:** no render grande, o hover passava o *label inteiro* como
  `keyPart`, que nunca casaria — outro 0% silencioso.
- Status: **Corrigido** — 2026-07-16 (PR #109). Casamento por **categoria**, tolerante a acento, em
  `resolveTriadCategory` (pura). Rótulo fora da tríade devolve `null` em vez de virar
  "circunstancial" por queda no `else`.
- Decisão de execução: **a correção é no casamento, não nos rótulos.** Tirar o acento dos rótulos do
  membro faria o gráfico funcionar e seria **regressão de copy** — eles aparecem na legenda
  (Lição 11). Validado por 10 testes + mutação (o casamento cru reproduz o bug e quebra 4 testes;
  o `else` do diagnóstico quebra o discriminante), test 140/140, type-check, build, eslint sem
  warning novo.
- Commit/PR: PR #109

### BUG-083 Card do DISC fora do padrão dos demais assessments

- Severidade: Baixo (usabilidade/design)
- Área/fase onde foi achado: F1-04 / `hub/membro` — reportado pela Gestora (2026-07-16)
- Arquivo(s) afetado(s): `src/components/hub/MemberDashboardView.tsx`
- Cenário de falha: o card do DISC tinha header próprio (kicker "Analise 01" na 1ª linha, título na
  2ª, sem ícone) e uma tag de status "Analisado"/"Ativo" que nenhum outro card tinha.
- Status: **Corrigido** — 2026-07-16 (PR #109). Convertido para o `MiniCard` usado pelos demais
  (ícone + título na 1ª linha + subtítulo na 2ª); tag removida. Textos ajustados no mesmo PR:
  "Análise 02 / Tríade"→"Análise 02", "Análise 03 / VACD"→"Análise 03", "Análise 04 /
  Premiações"→"Análise 04", "Aprendizado"→"Preferências de Aprendizado",
  "Reconhecimento"→"Preferências de Reconhecimento".
- Commit/PR: PR #109

### BUG-084 Sync descarta os eventos "Bloqueado" e a agenda pública oferece horário ocupado

- Severidade: **Médio** (funil de lead público; hoje gera atrito, não agendamento errado — ver
  "impacto medido". A via de agendamento direto é **latente**: mesma causa, 0 ocorrências hoje)
- Área/fase onde foi achado: F1-06 / lote C (agenda) — achado ao investigar o `BUG-075` a pedido da
  Gestora (2026-07-16), que levantou a hipótese "talvez esses eventos estejam aí justo para bloquear
  os espaços livres para propostas de 1 to 1". **A hipótese estava certa no mecanismo e invertida no
  diagnóstico**: os bloqueios não estão sujando a base — eles **não chegam** nela, e é a ausência
  que quebra a regra.
- Arquivo(s) afetado(s): `src/actions/calendar-module/sync.ts:35-38` (a causa);
  consumidores afetados: `src/actions/external-booking.ts:43` (`getPublicSlotsAction`) e
  `:172` (`getPublicAvailableDaysAction`), lidos por `src/components/ui/PublicBookingFlow.tsx:779`
- Cenário de falha: **[CONFIRMADO]** por inventário read-only na base real + no Google Calendar
  (2026-07-16). O sync filtra `summary.includes("bloqueado")` **antes de gravar**, então os eventos
  de bloqueio nunca entram em `Calendar_Events`. A agenda pública (`/agendar`) só considera ocupado
  o horário que tem um evento sobreposto **dentro de `Calendar_Events`** — logo, ela não enxerga
  nenhum bloqueio da Gestora.
  - **Impacto medido (janela pública real, 3..33 dias):** há **116 eventos "Bloqueado"** no Google
    Calendar nos próximos 90 dias. Na grade de proposta (06:00–21:00, passo 30min), **249 dos 756
    horários ofertados (32,9%) estão em cima de um bloqueio real**, em **23 dos 31 dias**. O lead
    propõe um horário que a Gestora tem ocupado.
  - **Mitigação que segura a severidade em Médio:** a proposta **não agenda** — cai em
    `Booking_Proposals` com `status:"pending"` e a equipe confirma manualmente. O dano é atrito e
    renegociação, não reunião em cima de compromisso.
  - **Latente (não vivo):** o agendamento **direto** (`bookPublicMeetingAction`) marca na hora. Ele
    só é imune hoje porque **nenhum dos 116 bloqueios sobrepõe nenhum dos 70 slots "1 to 1"
    ofertados** (verificado: 0 sobreposições) — a Gestora só cria slot onde está livre. É disciplina
    de curadoria, não trava de sistema: um bloqueio em cima de um slot "1 to 1" vira reunião marcada
    em horário ocupado, sem revisão humana.
- Causa-raiz (git): o filtro nasceu em **`fc00c6d` (2026-06-01)**, "adicionar filtro de eventos
  bloqueados e visualizacao dinamica de inscritos no admin" — o mesmo commit mexe em
  `ProgramacaoResumo.tsx`, ou seja, a intenção era **não poluir a tela do admin**. O filtro foi
  aplicado em dois lugares: na **leitura** (`queries.ts` — correto, atende à intenção) e no **sync**
  (colateral — tirou os bloqueios da base e, com eles, a única fonte de "ocupado" da agenda pública).
  **Fóssil que comprova:** os 8 docs de bloqueio que sobraram na base têm `lastSync` de
  **22–25/05/2026**, anterior ao commit — antes de 01/06 os bloqueios **eram** sincronizados.
- Nota de arquitetura: **todos** os leitores de coleção inteira já se defendem sozinhos de bloqueio
  na base (`queries.ts:85` no `getSyncedEvents`, `post-event.ts:318` no registro global) — o código
  já pressupõe que eles vivem lá. Os únicos que os querem são os dois da agenda pública, que tratam
  todo evento não-"1 to 1" como bloqueador. Isso torna o filtro do `sync.ts` o ponto fora da curva.
- Status: **Corrigido** — 2026-07-16 (PR #110). O sync grava todos os eventos e os classifica com o
  campo `isBlocker`; os leitores de exibição (admin/membro) filtram pelo campo, então a tela do admin
  segue limpa — a intenção original do `fc00c6d` é preservada. Fonte única em
  `src/lib/booking/blocker.ts` (radical normalizado, tolerante a acento e ao typo do `BUG-075`),
  substituindo as 3 cópias do casamento de texto. `bookEventAction` passa a recusar bloqueio
  (necessário: `totalCapacity: 0` significa **ilimitado** na checagem de vaga).
  **Decisão da Gestora:** o horário ocupado **desaparece** da grade de proposta, em vez de ficar
  esmaecido com o rótulo "OCUPADO".
- Verificação com a **função de produção** contra a agenda real (Lição 18): 116 bloqueios
  classificados, **0** sessões reais capturadas por engano, **0** dos 70 slots "1 to 1" ofertados
  invalidados (nenhum horário agendável é perdido). Grade de proposta: 756 → 507 horários, **nenhum
  dia fica vazio** (mínimo de 7 num dia). 8 testes novos, suíte 148/148, mutação do radical derruba 4.
- Decisão de execução: plano + impacto medido aprovados pela Gestora antes de codar (funil de lead
  público = receita, Lição 23).
- **VALIDADO EM PRODUÇÃO pela Gestora (2026-07-17):** após rodar o Sincronizar, ela confirmou no
  `/agendar` (proposta) que os horários bloqueados **somem** e que sábados/domingos seguem travados —
  "os efeitos de agenda bloqueada estão funcionais". O caso do print original (terça 17:30) fechou.
- Commit/PR: **PR #110**

### BUG-085 `Calendar_Events` acumula eventos passados para sempre (limpeza só varre o futuro)

- Severidade: Baixo (higiene de dados; sem impacto funcional vivo)
- Área/fase onde foi achado: F1-06 / lote C — achado no mesmo inventário do `BUG-084` (2026-07-16),
  respondendo à observação da Gestora de que "esses eventos estão apenas sujando a base"
- Arquivo(s) afetado(s): `src/actions/calendar-module/sync.ts:41-57`
- Cenário de falha: **[CONFIRMADO]** a limpeza de "fantasmas" do sync só considera o range
  `timeMin=agora .. timeMax=agora+90d`. Um doc cujo evento já passou está **fora da varredura** e
  nunca é removido, mesmo que o evento não exista mais no Google Calendar. Estado real: **340 dos
  538 docs** de `Calendar_Events` são de eventos passados (05/2026: 51, 06/2026: 165, 07/2026: 124);
  o mais antigo é de 25/05/2026. Cresce de forma monotônica.
- Relação com o `BUG-075`: **é esta a razão** de os 5 eventos "Bloquado" (com typo) ainda estarem na
  base, e não o typo em si. A Gestora informou que eles **já não existem no Google Calendar** — não
  existem mesmo; são fósseis de maio/2026 que a limpeza nunca alcança. Renomear no Google Calendar
  (a correção de dado cogitada no `BUG-075`) **não os removeria**, porque o sync não olha para trás.
- **ATENÇÃO — a correção óbvia é destrutiva.** "Estender a janela de limpeza para o passado" apagaria
  histórico real, **não lixo**: o doc do evento é o portador da ata, das métricas pós-evento e dos
  `attendees` (`post-event.ts`), e a `career-module.ts:161-172` lê os eventos passados **por id** para
  resolver o **título real** das sessões no histórico de carreira do membro. Apagar os 340 passados
  quebraria a Gestão de Carreira e as atas. Uma limpeza real teria de distinguir doc **com** histórico
  (preservar) de fóssil sem vínculo (ex.: os 8 bloqueios de maio) — e isso exige levantamento próprio.
- Status: **Aberto** — **fora** do plano do `BUG-084`, de propósito. O `BUG-084` não depende dele: os
  8 fósseis não têm impacto vivo, e o `BUG-086` é resolvido sem apagar nada.
- Decisão de execução: adiado — precisa de plano próprio, com inventário de quais docs passados têm
  vínculo (ata/attendees/booking) antes de qualquer remoção. Não fazer junto de outra coisa.
- Commit/PR: —

### BUG-086 Registro global de programação trunca em 500 antes de filtrar (já perde eventos hoje)

- Severidade: Baixo (visibilidade de histórico no admin; nenhum dado é perdido na origem)
- Área/fase onde foi achado: F1-06 / lote C — achado ao mapear os consumidores de `Calendar_Events`
  para a correção do `BUG-084` (2026-07-16). **Pré-existente, não é efeito da correção.**
- Arquivo(s) afetado(s): `src/actions/calendar-module/post-event.ts:310-320`
- Cenário de falha: **[CONFIRMADO]** `updateGlobalProgramacaoRegistryAction` lê
  `.orderBy("start","desc").limit(500)` e **só depois** descarta os bloqueados em memória. O
  `limit` é aplicado pelo Firestore antes de qualquer filtro, então o corte não distingue evento
  real de evento a descartar. Hoje `Calendar_Events` tem **538 docs** — ou seja, o registro
  (`Datas_Center/Programacao_Registry`, que alimenta o `ProgramacaoResumo` do admin) **já descarta
  os 38 eventos mais antigos** de forma silenciosa. Cresce junto com o `BUG-085`.
- Relação com o `BUG-084`: sincronizar os ~116 bloqueios (a correção aprovada) empurraria ~116
  eventos **reais** para fora do registro — um efeito colateral que só apareceu porque o mapa de
  consumidores foi feito antes de codar (Lição 23). Por isso os três se resolvem juntos.
- Nota: `where("isBlocker","==",false)` **não** serve como remédio isolado — o Firestore não casa
  documento sem o campo, então a query excluiria todos os docs legados (inclusive os 340 passados,
  que o sync não reescreve). Qualquer filtro por campo exige backfill antes.
- Status: **Corrigido** — 2026-07-16 (PR #110). Teto elevado para 2000 (folga sobre os ~654 reais) e,
  principalmente, **deixa de truncar calado**: emite aviso ao encostar no teto, apontando o `BUG-085`.
- Decisão de execução: corrigido junto do `BUG-084` (mesmo arquivo).
- Commit/PR: **PR #110**

### BUG-087 `getSyncedEvents` baixa a coleção inteira a cada chamada (causa do apagão de cota)

- Severidade: **Alto** — *reclassificação do `BUG-017` ("full scans sem paginação", registrado como
  Médio no mapeamento inicial). **Estava subestimado:** é o item que tira a produção do ar.*
- Área/fase onde foi achado: F1-06 / agenda — diagnosticado em 2026-07-16/17, durante o **apagão de
  cota do Firestore** (a Gestora confirmou por print do console: plano **Spark**, "Você ultrapassou
  seus limites diários de uso").
- Arquivo(s) afetado(s): `src/actions/calendar-module/queries.ts:79` (a causa); chamadores:
  `src/app/admin/page.tsx:27`, `src/app/admin/agenda/page.tsx:57,79`,
  `src/app/admin/gestao-agenda/page.tsx:34`, **`src/components/journey/StepRenderer.tsx:94`**
- Cenário de falha: **[CONFIRMADO]** `getSyncedEvents` faz `collection("Calendar_Events").get()` — a
  coleção **inteira (590 docs)** — e filtra em JavaScript. Cada chamada custa **590 leituras**. O
  Spark dá **50.000 leituras/dia**, ou seja **~85 aberturas de tela por dia para o produto inteiro**.
  O pior chamador é o `StepRenderer`: **todo membro que abre uma parada da jornada baixa os 590
  eventos** para exibir algumas sessões. O dashboard do admin faz o mesmo para exibir **um número**.
  Em 2026-07-16/17 a cota estourou e o Firestore passou a recusar **até leitura de 1 documento**,
  derrubando a produção.
- Nota de honestidade: os inventários read-only desta sessão leram a coleção inteira 3-4 vezes
  (~2.400 leituras) e **contribuíram** para estourar a cota naquele dia — mas não são a causa: o
  padrão torna qualquer dia de uso normal capaz de derrubar o sistema.
- **Refinamento na implementação (o multiplicador real):** o pior chamador não era o full scan
  direto, e sim `getUserBookingsAction` (`queries.ts`), que **baixava os 590 só para anexar detalhe**
  a uns poucos agendamentos — e é chamada por **8 telas do membro**, com o `MemberDashboardView`
  chamando **3×**. Abrir o dashboard custava **~1770** leituras; abrir uma parada, **~1180** (o
  `StepRenderer` chamava o full scan direto **e** via `getUserBookingsAction`).
- Status: **Corrigido** — 2026-07-17 (PR #112), Etapa 1 de `AGENDA-SYNC-DESIGN.md`. `getUserBookingsAction`
  busca os eventos **por ID** (`db.getAll`, mesmo padrão de `career-module.ts`), com saída idêntica;
  `getUpcomingEvents` (novo) atende a parada da jornada por janela de data. **Medido na base real:**
  BP-005 590→4, BP-011 590→2, BP-012 590→5; dashboard do membro ~1770→~15. A fronteira da query sai
  no formato da chave (`-03:00`) via `src/lib/calendar/window.ts`, com teste + mutação, para não
  repetir a armadilha de fuso do `BUG-093`.
- **Residual documentado (não é o apagão):** `admin/agenda`, `admin/gestao-agenda` e `admin/page`
  (dashboard) seguem em `getSyncedEvents` — 2-3 admins, baixa frequência. O dashboard sai no PR dele
  (`BUG-091/092`); o `ProgramacaoResumo` já lê o Registry (1 leitura). O apagão era volume de membro.
- Decisão de execução: plano + impacto medido aprovados pela Gestora. **VALIDADO EM PRODUÇÃO
  (2026-07-17):** ela navegou o hub sem erro e notou o carregamento **mais rápido** das agendas — o
  efeito esperado da queda de 590→~5 leituras por tela. No console do Firebase, ~22k leituras no dia
  (bem abaixo do teto de 50k, mesmo com teste pesado). O pico de ~15k foi ela testando as **telas de
  admin**, que ainda fazem full scan (o residual documentado) — não é tráfego de membro.
- Commit/PR: **PR #112**

### BUG-088 Sync lê 250 dos 795 eventos, sem paginação — e a limpeza apaga o que ele não leu

- Severidade: **Alto** (funcional; eventos reais nunca chegam à base e são removidos dela)
- Área/fase onde foi achado: F1-06 / agenda — achado em 2026-07-17 ao investigar por que só **39**
  bloqueios entraram na base quando a agenda tem **116** (após o PR #110)
- Arquivo(s) afetado(s): `src/actions/calendar-module/sync.ts:26-39`
- Cenário de falha: **[CONFIRMADO]** contra a agenda real, reproduzindo a chamada exata do sync. O
  `calendar.events.list` **não passa `maxResults`** (o padrão da API é **250**) e o código **nunca
  segue o `nextPageToken`**, que existe. Resultado: o sync enxerga **250 de 795** eventos da janela
  de 90 dias; o último é de **14/08/2026** — **nada depois disso jamais é sincronizado**. Pior: o
  cleanup monta `googleIds` só com os 250 lidos e **deleta** todo doc da janela fora desse conjunto,
  então o sync **remove ativamente** da base os eventos mais distantes.
- Impacto colateral no `BUG-084`: a correção dos bloqueios entrega **36**, não os 116 medidos — o
  resto está fora do teto. *(Correção de uma afirmação minha à Gestora, que prometia 116.)*
- Status: **Corrigido** — 2026-07-17 (PR #113), Etapa 2a de `AGENDA-SYNC-DESIGN.md`. Loop de
  paginação (`maxResults: 2500` + `nextPageToken`) com trava de 20 páginas que **falha alto** em vez
  de sincronizar pela metade. **Verificado contra a agenda real: 250 → 801** eventos, último de 15/10
  (antes ~14/08); 115 bloqueios capturados. **Dois efeitos acoplados tratados no mesmo PR (Lição 23):**
  (1) ~801 escritas numa rodada estouram o teto de **500 operações** por `db.batch()` — passa a
  comitar em blocos de 450 (o `BUG-086` era o sintoma inverso: truncar em silêncio); (2) com a base
  agora completa, `getUpcomingEvents` cresceria de 241 para ~801 leituras — recebeu **teto de janela
  agendável** (`agora .. +MAX_LEAD+1`, ~21 dias), medido em **190** leituras, preservando o ganho do
  `BUG-087`. O teto de 250 antigo já limitava por acidente a visão do membro a ~1 mês; o teto novo
  preserva isso de propósito.
- Decisão de execução: PROPOSTA + impacto medido aprovados pela Gestora. **VALIDADO EM PRODUÇÃO
  (2026-07-17):** após rodar o Sincronizar, o total foi a **1024** (passou de 250) e a lista mostra
  eventos **até 15/10** — ela confirmou os dois sinais. (1024 = ~590 antigos + os ~434 futuros que o
  teto de 250 escondia + passados.)
- Commit/PR: **PR #113**

### BUG-089 Falha muda na agenda pública: erro de cota vira "todos os horários livres"

- Severidade: Médio (o defeito é a **invisibilidade** da falha, que produz resposta errada plausível)
- Área/fase onde foi achado: F1-06 / agenda — observado **ao vivo** no apagão de 2026-07-17
- Arquivo(s) afetado(s): `src/actions/external-booking.ts:117-120`, `:246-249`;
  `src/actions/calendar-module/queries.ts:93-96`
- Cenário de falha: **[CONFIRMADO]** todo `catch` devolve `[]`. No apagão, o `getPublicSlotsAction`
  falhou por cota e devolveu `{slots: [], blockers: []}` — **zero bloqueadores** — e a grade de
  proposta do `/agendar` exibiu **todos os horários como livres**, inclusive os bloqueados (a Gestora
  reportou exatamente isso: terça 21/07 17:30, que está bloqueado no Google). Sem erro na tela, sem
  aviso. É a Lição 30 na forma mais cara: a falha se disfarça de resposta plausível, e o lead pode
  propor horário ocupado **por indisponibilidade do banco**.
- Status: **Aberto** — tratado junto das etapas de `AGENDA-SYNC-DESIGN.md` (transversal).
- Decisão de execução: a correção não é "logar o erro" — é **devolver o erro ao chamador** e a tela
  dizer "não foi possível carregar a agenda" em vez de inventar disponibilidade. Entra com a Etapa 1.
- Commit/PR: —

### BUG-090 Dashboard do admin: 2 dos 6 atalhos apontam para rotas inexistentes (404)

- Severidade: Médio (funcional; a porta de entrada do admin tem 33% dos atalhos quebrados)
- Área/fase onde foi achado: **F1-06 / lote A** — leitura de `src/app/admin/page.tsx` (2026-07-17)
- Arquivo(s) afetado(s): `src/app/admin/page.tsx:143,145`
- Cenário de falha: **[CONFIRMADO]** por checagem das rotas existentes:
  - **"Novo Portfólio"** → `/admin/portfolio` — **não existe**. A rota real é `/admin/products`
    ("Portfolio Command Center").
  - **"Ver Formulários"** → `/admin/forms` — **não existe**. A rota real é `/admin/fs/forms`.
  Os outros 4 atalhos (`/admin/social`, `/admin/partners`, `/admin/fs`, `/admin/agenda`) estão OK.
- Status: **Corrigido** — 2026-07-17 (PR #115). Na correção, descoberto que o bloco inteiro de
  atalhos era uma **cópia da sidebar** (que já leva a todos os destinos, e aponta certo) — a duplicata
  é que tinha apodrecido (Lição 21). **Bloco removido** em vez de consertar os 2 hrefs: elimina os
  404 sem perder acesso. Removido junto o card "LEADS" (não era métrica).
- Decisão de execução: proposta aprovada pela Gestora; validação visual em produção.
- Commit/PR: **PR #115**

### BUG-091 Dashboard do admin: card "AGENDA / sincronização ok" é hardcoded e mente

- Severidade: Médio (o indicador de saúde é decorativo — afirma um estado que nunca verificou)
- Área/fase onde foi achado: **F1-06 / lote A** (2026-07-17)
- Arquivo(s) afetado(s): `src/app/admin/page.tsx:55-62` (e o ponto verde pulsante do header, `:86`)
- Cenário de falha: **[CONFIRMADO]** o card exibe `value: "Ativa"` e `label: "sincronização ok"` como
  **strings fixas** — nenhuma verificação por trás. Ele diz "sincronização ok" **sempre**: com a
  cota do Firestore estourada (apagão de 2026-07-16/17), com o sync sem rodar há semanas, ou com o
  teto de 250 truncando (`BUG-088`). O mesmo vale para o ponto verde pulsante do cabeçalho, que
  sugere "sistema saudável" sem ler nada. **Um indicador que não pode dizer "não" não é indicador.**
  Família da Lição 20 (texto de regra é contrato — audite a execução antes de anunciar) e da 30
  (resposta plausível esconde a falha).
- Status: **Corrigido** — 2026-07-17 (PR #115), opção (a) escolhida pela Gestora. O card lê o
  `lastSync` mais recente (**1 leitura**) e mostra a idade do dado com cor por faixa (verde <24h,
  âmbar <7d, vermelho acima/nunca). `null`/data inválida caem em crítico — o indicador **pode dizer
  "não"** (`resolveSyncFreshness`, testado com mutação). O ponto verde pulsante do header foi removido.
- Decisão de execução: opção (a) aprovada pela Gestora; validação visual em produção.
- Commit/PR: **PR #115**

### BUG-092 Dashboard do admin: métrica "1:1 nesta semana" não é da semana — conta tudo, desde sempre

- Severidade: Médio (a métrica anunciada não é a métrica calculada; o número só cresce)
- Área/fase onde foi achado: **F1-06 / lote A** (2026-07-17)
- Arquivo(s) afetado(s): `src/app/admin/page.tsx:27-33,47`
- Cenário de falha: **[CONFIRMADO]** o rótulo diz **"cliques diretos nesta semana"**, mas o cálculo
  filtra `summary.includes("1 to 1") && registeredCount > 0` sobre **a coleção inteira** — sem
  nenhum filtro de data. Conta eventos de maio, de agosto, passados e futuros, indiscriminadamente.
  Como `Calendar_Events` acumula o passado para sempre (`BUG-085`), o número **só sobe** e nunca
  reflete "esta semana". A Gestora toma decisão olhando um número que não é o que o rótulo promete.
- Nota: é também o pior caso do `BUG-087` — **590 leituras para exibir 1 número**.
- Status: **Corrigido** — 2026-07-17 (PR #115). A métrica passa a contar a **semana ISO no fuso de
  Brasília** (`getWeekBounds`, testado com mutação), via consulta por intervalo em vez de full scan —
  medido na base real: **52 leituras** na janela da semana (era 590+), métrica real **0** nesta
  semana. O espaço liberado no dashboard virou a lista "Próximas sessões desta semana" (escolha da
  Gestora, opção a), com custo zero de leitura extra (mesma query).
- Decisão de execução: métrica = "agendamentos da semana" (decisão da Gestora); validação em produção.
- Commit/PR: **PR #115**

### BUG-093 Política de agendamento escorrega 3h em produção (janela calculada no fuso do servidor)

- Severidade: **Médio** (a política publicada ao membro não é cumprida nas bordas; permite agendar
  com **menos de 3 dias** de antecedência numa janela de 3h/dia)
- Área/fase onde foi achado: F1-06 / lote A — achado **por acidente** em 2026-07-17, ao rodar a
  suíte com `TZ=UTC` (o fuso da Vercel) enquanto se escrevia o teste do dashboard
- Arquivo(s) afetado(s): `src/lib/booking/policy.ts:42-46` (`getWindowBounds`); provável mesma
  família em `resolveEventWeek` (`getISOWeek` também usa o fuso local)
- Cenário de falha: **[CONFIRMADO]** por 2 testes que **já existem** (`booking-policy.test.ts:33,42`,
  escritos no PR #103) e que **falham sob `TZ=UTC`** — passam apenas porque a máquina de
  desenvolvimento está em `America/Sao_Paulo`. `getWindowBounds` faz `startOfDay(now)` no fuso do
  **servidor**; a Vercel roda em **UTC**, onde `startOfDay` = 00:00 UTC = **21:00 BRT do dia
  anterior**. As duas fronteiras escorregam 3 horas:
  - **Máximo:** sessão no 20º dia após as 21:00 BRT é **recusada**, embora o texto publicado prometa
    "de 20 a 3 dias" (o dia inteiro). Teste: `2026-08-05T23:59:00-03:00` deveria ser `true`, dá
    `false` em UTC.
  - **Mínimo (mais grave):** sessão no 2º dia após as 21:00 BRT é **aceita** — o sistema permite
    agendar com **menos de 3 dias** de antecedência. Teste: `2026-07-18T23:59:00-03:00` deveria ser
    `false`, dá `true` em UTC.
- **O teste estava certo; a produção é que está errada** (Lição 22). E a suíte **não podia** acusar:
  ela roda no fuso da máquina (BRT), não no da produção (UTC) — `vitest.config.ts` não fixa `TZ`.
  É a mesma falha de fundo do `BUG-045` (Lição 14): um portão que não exerce o ambiente real não é
  um portão.
- Relação com o `BUG-076`/PR #103: aquele PR corrigiu a **lógica** da política (e acertou); este é o
  **fuso** em que a lógica é avaliada. A promessa ao membro segue não sendo cumprida nas bordas.
- **3º defeito, achado pela mutação e pior que os outros dois:** entre **21:00 e 23:59 BRT** o
  servidor UTC já virou a data, então `startOfDay(now)` aponta para o dia seguinte e a janela inteira
  escorrega **um dia** — quem agenda à noite recebe uma regra diferente de quem agenda de manhã, no
  mesmo dia. A primeira versão dos testes **não pegava isto** (o relógio de teste era 10:00, quando
  servidor e Brasília concordam sobre "hoje"); só apareceu ao mutar `toZonedTime(now)` e ver que
  nenhum teste caía (Lição 15).
- **`resolveEventWeek` também estava errado** (mesma família): `getISOWeek` no fuso local fazia um
  evento de domingo 22:00 BRT (= segunda 01:00 UTC) cair na **semana seguinte**, deixando o membro
  furar o limite semanal.
- **A fonte única do PR #103 estava pela metade:** `booking.ts` — **o servidor, que é quem aplica a
  regra** — não usava `resolveEventWeek`; recalculava `getISOWeek`/`getYear` inline em **4 pontos**.
  Corrigir só o `policy.ts` teria consertado a tela e deixado a regra errada (Lição 21).
- Status: **Corrigido** — 2026-07-17 (PR #111). `getWindowBounds` e `resolveEventWeek` avaliam no fuso
  de Brasília (`toZonedTime`/`fromZonedTime`, mesmo `date-fns-tz` de `src/lib/timezone.ts`) e devolvem
  instantes reais; `booking.ts` passa a usar a fonte única; **`vitest.config.ts` fixa `TZ: 'UTC'`**,
  para a suíte exercer o ambiente de produção.
- Decisão de execução: plano + ressalvas aprovados pela Gestora antes do merge (regra de negócio
  publicada = área sensível). Validado: suíte **152/152** sob UTC (os 2 testes que falhavam são a
  prova do fix; +2 novos para as fronteiras que faltavam), **mutação de cada metade do fix derruba o
  teste correspondente**, eslint idêntico à `main`, type-check e build limpos.
- **Ressalva declarada à Gestora:** registros de `User_Bookings` já gravados guardam `week`/`year`
  calculados pelo modo antigo. Para sessões na fronteira do fuso (domingo à noite), a chave antiga
  diverge da nova e o limite semanal pode ficar inconsistente **para esses casos legados**, até
  saírem da janela. Impacto restrito; aceito conscientemente.
- **Achado deixado aberto de propósito (`BUG-094`):** `resolveEventWeek` devolve `year` via `getYear`
  e não `getISOWeekYear` — divergem na virada do ano (01/01/2027 pertence à semana ISO **53 de
  2026**), produzindo chave `week/year` inconsistente. Pré-existente, restrito ao réveillon, e mexer
  nisso muda a semântica de chaves já gravadas: merece decisão própria, não um fix silencioso.
- **VALIDADO EM PRODUÇÃO (2026-07-17):** a Gestora agendou uma sessão de 1 to 1 no **20º dia (06/08)
  às 22:00h** — depois das 21h, exatamente o horário em que a janela escorregava e recusava antes.
  Aceitou. Fecha o bug.
- Commit/PR: **PR #111**

### BUG-094 `resolveEventWeek` mistura semana ISO com ano civil (chave inconsistente na virada do ano)

- Severidade: Baixo (janela de alguns dias por ano; nenhum impacto fora da virada)
- Área/fase onde foi achado: F1-06 — achado ao corrigir o `BUG-093` (2026-07-17), **não corrigido de
  propósito**
- Arquivo(s) afetado(s): `src/lib/booking/policy.ts:33-36` (`resolveEventWeek`)
- Cenário de falha: **[CONFIRMADO]** por leitura. A função devolve `{ week: getISOWeek(d), year:
  getYear(d) }` — mistura **semana ISO** com **ano civil**. Eles divergem na virada: 01/01/2027 está
  na semana ISO **53 de 2026**, mas `getYear` devolve **2027**. A chave do limite semanal vira
  `{week: 53, year: 2027}`, que não casa com `{week: 53, year: 2026}` de um evento de 31/12/2026 —
  a mesma semana ISO conta como duas, e o membro pode agendar 2 sessões do mesmo tipo. O correto é
  `getISOWeekYear`.
- Status: **Aberto** — adiado conscientemente.
- Decisão de execução: **exige decisão própria.** Mudar isso altera a semântica de `week`/`year` já
  gravados em `User_Bookings`; a correção precisa considerar os registros existentes, não só o
  cálculo. Não fazer de carona em outro PR.
- Commit/PR: —

### BUG-095 O sync não reconstrói o `Programacao_Registry` — agenda do membro congela

- Severidade: **Alto** (o agendamento de 1 to 1 — serviço pago — fica inagendável para qualquer data
  além da última reconstrução do Registry; o membro vê uma agenda parada no tempo)
- Área/fase onde foi achado: F1-06 / agenda — achado ao investigar o item 5 da validação da Gestora
  (2026-07-17): ela não conseguiu agendar no 20º dia (06/08). **É código, não dado** (Lição 25).
- Arquivo(s) afetado(s): `src/actions/calendar-module/sync.ts` (não chama o rebuild);
  leitores do Registry: `hub/membro/gestao_agenda`, `HubHeader` ("Agendar 1 to 1"),
  `components/admin/ProgramacaoResumo`, `SurveyEngine`
- Cenário de falha: **[CONFIRMADO]** por inventário read-only na base real. O modal de 1 to 1 do
  membro lê `getProgramacaoForMemberAction` → `Datas_Center/Programacao_Registry`, que é um
  **snapshot** reconstruído **apenas** por `updateGlobalProgramacaoRegistryAction` (chamada em fluxos
  de booking/post-evento). **O sync NÃO reconstrói o Registry.** Estado real em 2026-07-17, após a
  Gestora sincronizar (Calendar_Events = 1024, eventos até 15/10):
  - `Calendar_Events` em 05-07/08: **13 eventos "1 to 1"** (o dado do 20º dia existe).
  - `Programacao_Registry`: `lastUpdated` de **03/07** (2 semanas atrás), evento mais recente
    **29/07**, **0 eventos** em 05-07/08. Congelado.
  Resultado: qualquer sessão depois de 29/07 é invisível para o membro no modal de 1 to 1 (e na
  `gestao_agenda`, no `ProgramacaoResumo` do admin, e no contexto do `SurveyEngine`).
- **Pré-existente, exposto pela paginação:** a defasagem do Registry sempre existiu (depende de
  alguém ter feito booking recentemente). Antes, o `Calendar_Events` também parava em ~14/08 (teto de
  250), então a diferença era menos visível; com o `BUG-088` levando o `Calendar_Events` a 15/10, o
  buraco 29/07→15/10 ficou evidente.
- Status: **Aberto** — investigação concluída; correção proposta à Gestora.
- Decisão de execução: **Precisa aprovação** (agenda/receita). Proposta: chamar
  `updateGlobalProgramacaoRegistryAction()` ao final de `syncCalendarToFirestore`, para o Registry
  refletir o que o sync acabou de gravar. A função já existe (tocada no `BUG-086`, lê Calendar_Events
  até 2000 e escreve o snapshot); custo = ~1 rebuild por sync (admin, baixa frequência). Correção de
  1 linha + import. Recomendo **não** deferir: destrava um serviço pago e a validação do `BUG-093`.
- Status: **Corrigido** — 2026-07-17 (PR #114). O sync chama `updateGlobalProgramacaoRegistryAction()`
  ao terminar; o rebuild filtra bloqueio (`post-event.ts:340`) e falha do rebuild não invalida o sync.
- **VALIDADO EM PRODUÇÃO (2026-07-17):** após rodar o Sincronizar, a Gestora viu as sessões de 1 to 1
  no **20º dia (06/08)** e **agendou** uma (22:00h) — antes o modal mostrava vazio para qualquer data
  depois de 29/07. Fecha o bug (e destravou a validação do `BUG-093` junto).
- Commit/PR: **PR #114**

### BUG-096 Analytics de Forms/Surveys do admin retornam zeros no erro (fallback mudo)

- Severidade: Baixo (admin-only; engana, mas não corrompe — o dado real está intacto)
- Área/fase onde foi achado: **F1-06 / lote B** — varredura transversal das páginas F&S (2026-07-17)
- Arquivo(s) afetado(s): `src/actions/admin-forms.ts:87-92`, `src/actions/admin-surveys.ts:87-93`
- Cenário de falha: **[CONFIRMADO]** por leitura. Ambos os `catch` devolvem
  `{ forms/surveys: [], stats: { total: 0, active: 0, last24h: 0 } }`. Num erro real (ex.: cota do
  Firestore estourada, como no apagão de 2026-07-16/17), o admin vê **"0 respostas / 0 ativos"** —
  indistinguível de "não há dados". É a Lição 30/família do `BUG-089`: a falha vira uma resposta
  plausível. (O `admin-fs.ts` faz **certo**: devolve `{ success:false, error }`.)
- Status: **Corrigido** — 2026-07-17 (PR #117), lote B. As duas actions ganham um campo `error?`
  (opcional, compatível com o consumidor) preenchido no `catch` via `getErrorMessage`; as páginas
  `admin/fs/forms` e `admin/fs/surveys` mostram um **banner vermelho** ("Não foi possível carregar as
  estatísticas... os números abaixo não refletem a base") quando `error` está presente — o admin
  distingue "sem dados" de "não consegui ler". O `admin-fs.ts` já fazia certo (não tocado).
- Decisão de execução: aprovado pela Gestora ("pode seguir com a correção do bug-096"). Validação
  visual em produção.
- **Nota — o padrão é SISTÊMICO, não só F&S:** o `catch → []`/`null` mudo existe em vários outros
  actions (`products.ts` — `getAdminProducts` devolve `[]` no erro, `delivery.ts`, `queries.ts`,
  `external-booking.ts`/`BUG-089`, etc.). Corrigidos aqui só os 2 de F&S (onde o achado apareceu).
  Um sweep sistêmico do padrão fica como débito registrado — endereçar cada um quando a tela/fluxo
  correspondente for tocado, elevando a `error?` explícito onde a UI se beneficiar. Não abrir bug por
  arquivo; esta nota é o marcador.
- **VALIDADO — deploy de produção confirmado (2026-07-17, `e4af5f3`, success).**
- Commit/PR: **PR #117**

---

*Bugs já corrigidos em sessões anteriores a este processo formal (Timestamp em
`getMemberQuotasAction`, endpoint `db-reset`, cotas em `legal.ts`, status
mortos em `visao_geral`, variant em `NarrativeContent`) estão documentados na
memória de projeto do assistente, não neste arquivo.*
