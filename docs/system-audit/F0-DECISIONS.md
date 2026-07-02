# Fase 0 — Decisões de Padrão Canônico

Documento de detalhe das decisões dos itens `F0-01` a `F0-06` do `00-PLAN.md`.
O `00-PLAN.md` guarda o status/veredito curto de cada item e aponta para as
seções abaixo. Nenhuma decisão aqui altera código — são padrões de referência
para as Fases 1-4. Onde a decisão exige implementação que toca área sensível
(design system, identidade/sessão, financeiro), a implementação segue o
protocolo do `CLAUDE.md` (plano + aprovação da Gestora antes de codar).

Sessão de execução: 2026-07-02 (primeiro chat de execução, após fechamento dos
5 mapas).

---

## F0-01 — Padrão canônico de Modal

**Modo de validação:** Automatizado (a decisão de padrão é embasável por análise
de código — Mapa 5 já traz o inventário completo). A **implementação** da
convergência é gated (sistema de design → plano + aprovação).

**Decisão proposta:** `GlassModal` (`src/components/ui/GlassModal.tsx`)
**permanece o modal-base oficial e único** da área logada. Justificativa objetiva
(não por preferência): já é o componente mais completo e mais bem posicionado —
tem `createPortal`, animação via `motion`, fechamento por ESC, backdrop
padronizado (`bg-white/40` blur 8px, `rounded-[40px]`) e props de variante
(`title`, `subtitle`, `maxWidth`, `className`). Dois modais já o estendem
corretamente (`FAQContactModal`, `OneToOneBookingModal`), provando que a extensão
é viável sem perda de flexibilidade.

**Estado atual (Mapa 5 / BUG-026):** apenas 2 de 13 modais usam `GlassModal`. Os
outros 11 reimplementam backdrop/portal/z-index do zero, com **6 valores de
z-index não coordenados** (`50`, `300`, `500`, `1000`, `9999`, `99999`). Três
deles (`SequenceLockModal`, `UpsellServiceModal`, `WelcomeRedirectModal`/
`CouponTermsModal` via classe `glass-modal-open`) **clonam visualmente** a receita
do `GlassModal` sem reaproveitá-lo — o pior caso de manutenção (um ajuste no base
não se propaga).

**Plano de convergência (a ser executado nas Fases 1-2, cada lote sob aprovação):**

1. **Antes de tudo — unificar a escala de z-index.** Definir uma constante única
   (ex.: `src/config/zIndex.ts` ou tokens CSS) com camadas nomeadas: base de
   conteúdo < header < modal padrão < modal crítico/gate < toast. Hoje o risco
   concreto é `ContractGateModal` (gate global, `z-[9999]`) empilhar de forma
   errada com `UpsellServiceModal` (jornada) — priorizar essa correção mesmo
   antes da convergência completa.
2. **Lote A (baixo risco) — modais que já clonam o visual do GlassModal**:
   `SequenceLockModal`, `UpsellServiceModal`, `WelcomeRedirectModal`,
   `CouponTermsModal`. Trocar a reimplementação pela extensão de `GlassModal`
   (variante dark quando aplicável). Risco visual mínimo porque já imitam a
   mesma receita.
3. **Lote B — modais com backdrop/estilo próprio divergente**:
   `ContractGateModal`, `ServiceSelectionModal`, `DiscDevolutivaModal`,
   `ContentEvaluationModal`, `ThemeSuggestionModal`,
   `NonMemberOffboardingModal` (extrair de dentro de `JourneyNav.tsx` para
   arquivo próprio no processo). Cada um exige validação visual (screenshot
   antes/depois) porque muda backdrop/raio.
4. **Requisito para não regredir:** adicionar as variantes que faltarem ao
   `GlassModal` (ex.: variante `tone: "light" | "dark"`, `critical` para o gate)
   ao invés de deixar cada modal improvisar — senão a fragmentação volta.

**Bugs vinculados:** BUG-026 (fragmentação — permanece Aberto, agora com plano),
BUG-027 (`ThemeSelector.tsx` órfão — remoção segura, não é o seletor real).

**Status:** Decidido (padrão + plano de convergência registrados). Implementação
**pendente de plano+aprovação** por lote (sistema de design).

---

## F0-02 — Padrão canônico de Timestamp no Firestore

**Modo de validação:** Automatizado (decisão de melhor prática técnica,
embasável por Mapa 4).

**Decisão:** daqui pra frente, **todo campo de timestamp de servidor
(`createdAt`, `updatedAt`, `lastUpdated`, `*At` de auditoria) deve usar
`FieldValue.serverTimestamp()` (Admin SDK) na escrita**, e ser serializado para
o client via o helper de serialização já existente (`serializeTimestamp` /
`serializeDoc`) na leitura. Proibido, para campos novos: gravar `Date` nativo do
runtime da server action ou string ISO manual — ambos abrem drift de fuso/formato
e quebram ordenação/consulta por intervalo no Firestore.

**Regra de tipagem:** o tipo TS do campo deve refletir o que sai da leitura já
serializada (string ISO ou `number` de epoch, conforme o serializer), **não**
`Timestamp` do SDK client (import de SDK client em tipo gravado por Admin SDK é a
inconsistência de `SocialPost` — ver Mapa 4). Um único tipo utilitário
compartilhado (ex.: `type ServerTimestampSerialized = string`) evita a divergência.

**Débito técnico aceito como legado (não migrar à força — regra do CLAUDE.md
sobre código legado preservado):**

- `products.createdAt/updatedAt` e `marketing_coupons.createdAt/updatedAt` —
  strings ISO manuais (vêm do spread de JSON externo). Aceito como legado; ao
  reescrever a rotina de sync desses, converter para `serverTimestamp()`.
- `User.lastPhotoUpdate` — string ISO. Aceito como legado.
- `Booking_Proposals.createdAt`, `Invitation_Events.createdAt` (tipo declara
  `string`, código grava `serverTimestamp()`) — inconsistência tipo↔escrita,
  mitigada por `serializeDoc()` na maioria das leituras; corrigir o **tipo** (não
  a escrita) quando o arquivo for tocado.
- `_AuthMap` — usa nomes de campo de timestamp diferentes por branch de escrita
  (`recoveredAt`/`linkedAt`/`createdAt`/`healedAt`). Aceito como legado de
  auto-cura; padronizar só se/quando o resolver de identidade for refatorado
  (ver F0-03).

**Instâncias que são defeito e não só estilo (permanecem como bug, fora do
"aceite como legado"):** `UserBooking.timestamp` lido mas nunca gravado
(BUG-009) — o fluxo grava `bookedAt`. Isso é um mismatch de nome de campo, não
uma questão de tipo de timestamp; segue rastreado em `BUGS.md`.

**Bugs vinculados:** nenhum novo. BUG-009 permanece o único defeito ativo
relacionado.

**Status:** Decidido.

---

## F0-03 — Padrão canônico de identidade / nome de usuário

**Modo de validação:** Automatizado (decisão técnica de fonte de verdade,
embasável por Mapa 4 + leitura de `src/lib/user-identity.ts`).

**Contexto:** hoje nome/nickname/e-mail são lidos de até 7 campos concorrentes no
doc `User/{matricula}`: `profile.fullName`, `Authentication_Name`,
`User_Nickname`, `nickname`, `User_Welcome.User_Nickname`, `User_Name`,
`User_Email`. Já existe um resolver parcial server-side —
`resolveUserNickname(uid)` em `src/lib/user-identity.ts` — mas ele só cobre 2 dos
7 campos (`User_Nickname` → `Authentication_Name` → `"Membro"`) e não é usado
universalmente; muitos callers repetem a cadeia de fallback à mão.

**Decisão — fonte única de verdade e ordem de precedência canônica:**

- **Nome de exibição (nickname):** `User_Nickname` → `Authentication_Name` →
  `profile.fullName` → `"Membro"`.
- **Nome completo/legal (documentos, contrato, cobrança):** `profile.fullName` →
  `Authentication_Name` → `User_Nickname`.
- **E-mail:** `User_Email` → `email` (campos são sinônimos históricos; convergir
  leitura, não exigir migração).
- Campos `nickname` (solto), `User_Name`, `User_Welcome.User_Nickname` são
  tratados como **legado somente-leitura**: nunca escrever neles em código novo;
  podem entrar apenas como último fallback de leitura se algum dado antigo
  depender deles (a confirmar caso a caso — não incluídos na precedência acima
  por padrão).

**Convergência gradual (não migração forçada — dado legado preservado):**

1. Promover `src/lib/user-identity.ts` a **helper canônico único** com duas
   funções puras que recebem o `userData` já lido:
   `resolveDisplayName(userData)` e `resolveLegalName(userData)` e `resolveEmail(userData)`,
   implementando exatamente a precedência acima. Manter `resolveUserNickname(uid)`
   como wrapper que busca no Firestore e delega.
2. Nas Fases 1-2, substituir cada cadeia de fallback ad-hoc encontrada nas
   páginas/actions por chamada a esse helper (mudança localizada por arquivo,
   sem tocar dado).
3. **Escrita:** código novo que grava identidade escreve em `User_Nickname` +
   `Authentication_Name` + `profile.fullName` de forma consistente; não criar
   campos novos de nome.
4. Não há migração de dados em massa nesta fase — a convergência é de **leitura**
   (todos leem pela mesma precedência) e de **escrita nova** (todos escrevem nos
   mesmos 3 campos). O dado legado permanece.

**Bugs vinculados:** nenhum novo (fragmentação já documentada no Mapa 4).

**Status:** Decidido (padrão + plano de convergência gradual registrados).

---

## F0-04 — Destino das coleções órfãs (`entitlements`, `User_JourneyMap`)

**Modo de validação:** Automatizado (decisão documental; a **parada de escrita**
de `User_JourneyMap` toca `survey-effects`/`welcome-survey`, que são efeitos de
onboarding — implementação gated).

**Decisão:** ambas são **arquivadas como legado documentado**, não reativadas.
Nenhuma tem consumidor real (Mapa 4 — BUG-018):

- **`entitlements` (raiz)** + `src/actions/entitlements.ts` + tipo
  `UserEntitlement`: sistema de acesso paralelo nunca conectado. O acesso real do
  produto é feito por `User/{matricula}/User_Permissions/access.services` +
  `grantServiceEntitlement` (`@/lib/checkout`). **REMOVIDO (2026-07-02)**:
  `src/actions/entitlements.ts` (ação órfã, zero callers) e os tipos
  `UserEntitlement`/`EntitlementStatus` (zero uso externo) foram removidos.
  **Correção de impacto vs. a suposição inicial**: `src/types/entitlements.ts`
  **NÃO** é órfão e foi **mantido** — ele hospeda `MemberQuota`/`MemberQuotaWallet`,
  usados por `quotas.ts` e `useJourney.ts`. A remoção foi cirúrgica (só a ação +
  os 2 tipos mortos), não o arquivo inteiro. Documentos `entitlements` que já
  existam em produção ficam órfãos no banco (nenhum leitor) — sem impacto de
  runtime; limpeza de dados no Firestore, se desejada, é passo separado manual.
- **`User_JourneyMap/progress`** (escrita só por
  `src/actions/effects/welcome-survey.ts`, sem leitor confirmado): é uma segunda
  modelagem de jornada (funil atracao/qualificacao/venda/pos_venda) abandonada.
  A jornada real vive em `User/{matricula}/User_Journey/progress`. Decisão:
  **parar de escrever `User_JourneyMap` em onboarding novo** e documentar como
  legado. A parada da escrita **exige plano+aprovação** porque `welcome-survey.ts`
  é efeito de onboarding (fluxo de identidade/jornada) e `survey-effects.ts` é
  god file listado no `CLAUDE.md` — não remover inline.

**Ordem recomendada:** documentar agora (feito aqui); remover `entitlements.ts`
como limpeza oportunística; tratar a parada de escrita de `User_JourneyMap` num
PR próprio de baixo escopo com aprovação.

**Bugs vinculados:** BUG-018 (permanece Aberto, agora com decisão de destino).

**Status:** Decidido (arquivar como legado; execução da limpeza gated onde toca
onboarding).

---

## F0-05 — Paridade de guard servidor entre `/hub` e `/admin`

**Modo de validação:** Automatizado para a **análise/recomendação** (código já
lido e confirmado). A **implementação** é gated: toca identidade/sessão e é
explicitamente um item de segurança → plano + aprovação da Gestora antes de codar.

**Achado confirmado (leitura direta nesta sessão):**

- `src/app/hub/layout.tsx` é Server Component e chama
  `verifySignedSession()` **antes** de renderizar; sessão ausente/forjada →
  `redirect("/")` no servidor, antes de qualquer JS chegar ao client.
- `src/app/admin/layout.tsx` **é** um Server Component, **mas não faz nenhuma
  verificação** — apenas renderiza `<AdminLayoutClient>`. Todo o guard de admin
  está em `AdminLayoutClient.tsx` (`"use client"`), via
  `useAuthContext()` → `if (!user || !isAdmin) redirect("/")`. Ou seja: o HTML/JS
  inicial do painel admin é servido antes de qualquer decisão de autorização
  server-side. É exatamente o `BUG-007`.

**Decisão:** **Sim — `/admin` deve ganhar verificação server-side equivalente à
do hub.** O ponto de correção é natural e já existe: `src/app/admin/layout.tsx`
(Server Component) deve chamar `verifySignedSession()` e, além de exigir sessão
válida, exigir **papel de admin** (`session.isAdmin === true`), redirecionando no
servidor caso contrário — mantendo o guard client-side atual como segunda camada
(defense-in-depth), não removendo-o. O helper de sessão já expõe `isAdmin`
(usado por `requireAdmin` em `auth-guards.ts`), então não há infraestrutura nova
a construir.

**Escopo da correção (para o plano futuro):**

- Adicionar o check server-side em `admin/layout.tsx` (arquivo de infra de rota).
- **Não** confundir com o guard de cada Server Action: mesmo com o layout
  protegido, as actions administrativas precisam de `requireAdmin` próprio (Server
  Actions são endpoints de rede independentes da página — ver `BUG-020`/Track
  T-02). Guard de layout protege o **render** da página; guard de action protege
  a **mutação**. Os dois são necessários; este item (F0-05) resolve só o primeiro.

**Bugs vinculados:** BUG-007 (permanece Aberto — decisão tomada: corrigir;
implementação aguarda plano+aprovação).

**Status:** Decidido (recomendação: adicionar guard server-side + papel admin em
`admin/layout.tsx`). Implementação **pendente de plano+aprovação** (segurança/
identidade).

---

## F0-06 — Padrão canônico de tom de voz e nomenclatura

**Modo de validação:** Requer execução humana (ratificação). O **rascunho do guia
de estilo** abaixo é embasável por análise de copy existente (feito aqui), mas a
identidade de tom institucional é decisão de marca da Gestora — o guia só vira
"canônico" após ela ratificar/ajustar. Os achados objetivos de copy hardcoded são
verificáveis por código (feitos aqui).

### Rascunho de guia de estilo (para ratificação de Victor)

Derivado do padrão já observado na interface (títulos em caixa alta com
`tracking` largo, subtítulos curtos, tom premium/institucional, português do
Brasil, sem emoji conforme regra 2 do `CLAUDE.md`):

- **Idioma:** português do Brasil, formal-acolhedor (trata o usuário como
  "membro"/"você"). Sem gíria, sem emoji em qualquer string de interface.
- **Títulos de seção:** substantivos/nominais curtos, podem usar caixa alta +
  `tracking` largo (padrão visual atual do hub/admin). Evitar frase completa como
  título.
- **Subtítulos:** uma linha, explicam o "para quê" da seção, tom institucional.
- **CTAs:** verbo no infinitivo ou imperativo direto ("Agendar", "Continuar",
  "Resgatar acesso"). Consistência de rótulo para a mesma ação em telas
  diferentes (não alternar "Agendar"/"Marcar"/"Reservar" para o mesmo fluxo).
- **Nomenclatura de produto:** "BPlen HUB" / "membro" / "jornada" / "matrícula"
  como termos canônicos — não introduzir sinônimos novos ad-hoc.
- **O que PODE permanecer hardcoded:** microcopy estrutural e institucional
  estável (rótulos de navegação, nomes de seção fixos, termos de marca). Não faz
  sentido mover para config texto que nunca muda por dado.
- **O que DEVE vir de config/Firestore (não hardcoded):** qualquer valor que
  represente **dado de negócio variável** — preço, desconto, prazo de garantia/
  reembolso, data de vigência de documento legal, nome/rótulo de produto/serviço
  específico. Regra 3 do `CLAUDE.md` (combate ao hardcoded).

### Achados de copy hardcoded avaliados contra o guia

Verificados por leitura direta nesta sessão (correção de precisão em relação ao
que o plano original listou):

1. **`/checkout/[slug]/page.tsx:228` — `"Resgate via Faturamento Interno"`** e
   **`:238` — `"Garantia BPlen"`**: copy institucional estável do fluxo de
   resgate gratuito. Pelo guia, **pode permanecer hardcoded** (é rótulo de marca,
   não dado variável). Sem ação obrigatória — só padronizar se o mesmo rótulo
   aparecer divergente em outra tela.
2. **`/privacidade/page.tsx:20` — `lastUpdated="21 de junho de 2026"`**: é **data
   de vigência de documento legal** → pelo guia, é dado que **não deveria ser
   string solta no JSX** — deve vir de config/constante única, para não ficar
   dessincronizada do texto da política se este mudar (risco de "última
   atualização" mentir juridicamente). Ação recomendada: extrair para uma
   constante/config de página legal. Baixa severidade, mas legítimo (LGPD/
   compliance textual — ver Track T-06).
3. **Correção do mapa:** o plano listava "preço/garantia fixos em
   `/servicos/[audience]/[slug]`". **Verificado que é impreciso** — nessa página o
   preço vem de `product.price` (config/Firestore, linhas 66-181), **não é
   hardcoded**, e **não há texto de garantia** nessa rota. A copy de "Garantia
   BPlen" hardcoded está no `/checkout/[slug]` (item 1), não em `/servicos`. Essa
   correção de localização fica registrada para não caçar um problema inexistente
   na Fase 1.

**Bugs vinculados:** nenhum novo registrado (o item 2 é copy hardcoded de baixo
risco já previsto no escopo de F0-06; será tratado na revisão de copy da Fase 1 /
Track T-06, não precisa de linha própria em `BUGS.md`).

**Status:** **RATIFICADO pela Gestora (Victor) em 2026-07-02.** O guia acima é a
referência canônica de copy para a Fase 1.

### Ratificação (2026-07-02)

Decisões confirmadas por Victor:

1. **Tom/tratamento:** **Formal-acolhedor — trata por "membro"/"você"**, tom
   institucional porém caloroso. Confirma o padrão já predominante na interface
   (menor retrabalho). Descartadas as opções "informal" e "corporativo formal".
2. **Títulos:** **Caixa alta + `tracking` largo é o padrão oficial de título** da
   área logada (canoniza o que já existe no hub/admin). Telas novas devem seguir;
   telas atuais não precisam mudar por causa desta decisão.
3. **Data de vigência de `/privacidade`:** **Extrair para config** (não deixar a
   string `"21 de junho de 2026"` solta no JSX). **FEITO (2026-07-02)**: criado
   `src/config/legal-pages.ts` (`LEGAL_PAGES_LAST_UPDATED`) como fonte única;
   `/privacidade` e `/termos` (que tinham a mesma data hardcoded) passam a
   consumir de lá. Validado por type-check + build (ambas as páginas seguem
   estáticas).

Itens não alterados na ratificação (aceitos como rascunhados): idioma pt-BR sem
emoji, CTAs com rótulo consistente por ação, termos canônicos de marca
("BPlen HUB"/"membro"/"jornada"/"matrícula"), e a fronteira "pode ficar
hardcoded" (rótulo de marca) vs "deve vir de config" (dado de negócio variável).
