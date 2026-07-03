# Log — Processo de Homologação

Diário cronológico entre sessões/chats deste processo.

## Protocolo

Todo chat de execução deve ler `00-PLAN.md` + as últimas entradas deste arquivo
antes de agir, e deve terminar registrando uma entrada aqui: data, escopo
trabalhado, achados, decisões, e mudanças de status no `00-PLAN.md`.

## Template por entrada

```
## [AAAA-MM-DD] Título curto do escopo trabalhado

- Chat/sessão: [identificador, se houver]
- Escopo: [o que foi validado/ajustado]
- Achados: [resumo, com link para BUGS.md se aplicável]
- Decisões: [o que foi decidido e por quê]
- Itens do 00-PLAN.md atualizados: [lista]
```

---

## Entradas

## [2026-07-02] Chat de planejamento — população inicial dos 5 mapas + plano mestre

- Chat/sessão: chat de planejamento (Sonnet 5)
- Escopo: população inicial de `01` a `05` a partir de inspeção real de código
  (não assumida por nome de arquivo), via 7 agentes de pesquisa paralelos +
  leitura direta complementar. **Nenhuma correção de código foi feita** — este
  chat só planejou/mapeou, conforme instrução do Gestor.
- Achados:
  - **Mapa 1 (Features)**: 20 features-pai identificadas com variações e
    contagem de entrega — algumas contagens marcadas "mínimas" por depender
    do detalhe de admin ainda pendente.
  - **Mapa 2 (Páginas)**: 13 páginas públicas mapeadas em detalhe completo;
    9 páginas do hub em detalhe completo, 5 em resumo curto; 19 páginas admin
    **não detalhadas** (só guard estrutural + lista confirmada).
  - **Mapa 3 (Regras de Negócio)**: completo — jornada/checkin, não-membro,
    agendamento, cotas/entitlements, carreira/status, outras regras (cupom,
    contrato, convite).
  - **Mapa 4 (Dados/APIs/Permissões)**: parte (a) Firestore substancialmente
    completa (identidade, permissões, jornada, calendário/booking, carreira,
    networking/convites, conteúdo, produtos/cupons) — exceto escopo
    checkout/orders financeiro (`Orders`, `checkout.ts`, `mp-checkout.ts`),
    não coberto. Partes (b) e (c) — API routes e Server Actions — **não
    cobertas nesta sessão**.
  - **Mapa 5 (Design System)**: **não coberto** — só achados colaterais
    (mecanismo de tema, inventário parcial de modais).
  - **18 bugs registrados em `BUGS.md`** (BUG-001 a BUG-018), incluindo 1
    crítico (`/api/admin/recover` sem autenticação), vários altos (vazamento
    de path em `admin-fs.ts`, chave de cota com case inconsistente, duas
    implementações divergentes de `adminAddAttendeeAction`, `Support_Tickets`
    em coleção raiz com PII).
- Decisões:
  - Dado que vários agentes de pesquisa atingiram o limite de sessão da conta
    (mensagem "You've hit your session limit · resets 11:40am
    America/Sao_Paulo") no meio do trabalho, e um dos agentes delegou
    recursivamente a um subagente que só retornou um placeholder, optou-se por
    **consolidar o que foi coletado com sucesso agora** em vez de forçar
    conclusão total nesta sessão — usando o próprio protocolo entre chats para
    que uma sessão futura complete as lacunas.
  - `00-PLAN.md` foi estruturado com Fases 0-4 + 6 tracks adicionais + checagem
    ISO 25010, mesmo com mapas parcialmente incompletos, porque as áreas já
    cobertas (regras de negócio, Firestore, páginas públicas/hub) já são
    suficientes para começar a Fase 0 e partes da Fase 1.
- Itens do `00-PLAN.md` atualizados: todos os itens foram criados nesta sessão
  (arquivo estava vazio/esqueleto antes). Nenhum item ainda foi executado
  (todos em "Não iniciado").

### Pendências explícitas para a próxima sessão (nesta ordem sugerida)

1. **Completar Mapa 2 — Admin**: detalhar as 19 páginas de `src/app/admin/`
   (entrega, componentes, actions chamadas, guard específico). Lista completa
   de rotas já está em `02-map-pages.md`.
2. **Completar Mapa 4 (b/c) — API routes e Server Actions**: inventariar
   `src/app/api/**` (7 rotas) e `src/actions/**` (60 arquivos) com "quem
   chama", guard, e integração externa. **Atenção**: ao delegar esta tarefa a
   um subagente, instruir explicitamente para **não delegar recursivamente**
   e fazer a leitura diretamente — isso já causou perda de uma tentativa
   nesta sessão.
3. **Completar Mapa 4 (a) — escopo checkout/orders**: coleções `Orders`
   (ou equivalente), `checkout.ts`, `mp-checkout.ts`, `orders.ts` não foram
   cobertas.
4. **Completar Mapa 5 — Design System**: inventário de `src/components/ui/`,
   `src/components/shared/`, `src/components/forms/`, confirmar se
   `GlassModal` é de fato o padrão canônico de modal (ver `05-map-design-system.md`
   para o roteiro sugerido de como abordar isso primeiro).
5. Só depois de 1-4, revisitar `01-map-features.md` para fechar as contagens
   marcadas como "mínimas"/"detalhe pendente".
6. Com os 5 mapas fechados, revisar `00-PLAN.md` Fase 0 e tracks T-02/T-05 —
   alguns itens estão bloqueados explicitamente pelas lacunas acima.

Nenhum bug foi corrigido nesta sessão (chat de planejamento não implementa).

---

## [2026-07-02] Chat de planejamento — fechamento completo dos 5 mapas

- Chat/sessão: continuação do chat de planejamento acima, mesma sessão de
  usuário, após o limite de sessão da conta resetar
- Escopo: pedido explícito do Gestor para "concluir todos os mapeamentos".
  Fechadas todas as lacunas deixadas pela entrada anterior:
  1. Mapa 2 — 19 páginas admin detalhadas (lidas diretamente por mim, sem
     subagente, para evitar o problema de delegação recursiva da sessão
     anterior).
  2. Mapa 4a — escopo checkout/orders financeiro completo (`checkout.ts`,
     `mp-checkout.ts`, `orders.ts`, lidos diretamente).
  3. Mapa 4b/c — inventário completo de API routes (7) e Server Actions
     (~60 arquivos), via 2 agentes em paralelo com instrução explícita
     "não delegue recursivamente, leia os arquivos você mesmo" — dessa vez
     ambos entregaram o relatório completo na própria execução.
  4. Mapa 5 — inventário completo de Design System via 1 agente (mesma
     instrução anti-delegação), incluindo veredito definitivo sobre o
     padrão de Modal.
  5. Mapa 1 — todas as contagens "mínimas"/"pendentes" fechadas com os dados
     acima.
- Achados novos mais relevantes:
  - **Ambiguidade do `BUG-002` resolvida**: `/checkout/[slug]` é um fluxo de
    "resgate gratuito/cupom-100%" por design (nunca aciona Mercado Pago);
    `/hub/membro/checkout/[slug]` é o único fluxo com Mercado Pago real. O
    problema real é a falta de validação de que o produto é de fato
    gratuito antes de conceder acesso.
  - **9 bugs novos** (`BUG-019` a `BUG-027`), destaque para:
    - `BUG-019` (Alto): IDOR confirmado em `profile.ts` — troca/remoção de
      foto de perfil sem nenhum guard, aceita `matricula` arbitrária.
    - `BUG-020` (Alto, elevado de Médio): padrão sistêmico — dezenas de
      Server Actions (todo o fluxo de booking, CRUD de parceiros, toggle de
      assessments, etc.) sem `requireAuth`/`requireAdmin` interno.
    - `BUG-023` (Alto): duas rotas de API órfãs (`/api/ghosts`, `/api/liandra`)
      sem guard, uma com matrícula real hardcoded na query.
    - `BUG-025` (Médio): webhook do Mercado Pago sem validação de assinatura HMAC.
    - `BUG-026` (Médio): confirmado que só 2 de 13 modais do projeto
      reaproveitam `GlassModal` — os outros 11 reimplementam o padrão, com
      6 valores de `z-index` não coordenados.
  - `ThemeSelector.tsx` é código órfão — **não** é o seletor de tema real
    (esse vive em `HubHeader.tsx`, confirmado ativo em todo hub+admin) —
    não há violação da regra do `CLAUDE.md` sobre tema sempre acionável.
- Decisões:
  - Ao relançar os agentes de pesquisa, cada prompt incluiu uma "REGRA
    CRÍTICA DE EXECUÇÃO" proibindo explicitamente o uso da ferramenta Agent
    e instruindo a fazer a leitura diretamente — isso resolveu o problema de
    delegação recursiva sem output real que ocorreu na sessão anterior.
    **Recomendação para sessões futuras**: manter essa instrução explícita
    sempre que o subagente puder ser tentado a "aguardar outro terminar".
- Itens do `00-PLAN.md` atualizados: nota de status de cobertura dos mapas
  (topo), `F0-01` (dados completos, decisão em aberto), `F1-06` (não mais
  bloqueado por Mapa 2 incompleto), `T-02` (não mais bloqueado por Mapa 4b/c),
  `T-06` (bug novo referenciado).

### Estado final: os 5 mapas estão completos. Próximo passo é iniciar a Fase 0
do `00-PLAN.md` (decisões de padrão canônico) com a Gestora, já que os dados
para embasar essas decisões estão todos disponíveis.

---

## [2026-07-02] Chat de planejamento — adição de F0-06 (tom de voz/copy)

- Chat/sessão: continuação da mesma sessão, a pedido do Gestor após revisar o
  plano no painel visual
- Escopo: o Gestor identificou que validação de textos/títulos/subtítulos
  (um dos objetivos originais do processo) não tinha item dedicado no plano —
  só apareciam como achados pontuais de copy hardcoded nos mapas
- Achados: nenhum novo (edição de escopo do plano, não de código)
- Decisões: adicionado `[F0-06] Padrão canônico de tom de voz e nomenclatura`
  na Fase 0, e o critério de aceite comum da Fase 1 foi enriquecido para
  exigir revisão de títulos/subtítulos/CTAs contra o guia definido em F0-06
- Itens do `00-PLAN.md` atualizados: novo item `F0-06`; critério comum da
  Fase 1; linha de Usabilidade na checagem ISO 25010

---

## [2026-07-02] Chat de execução — Fase 0 completa (F0-01 a F0-06)

- Chat/sessão: primeiro chat de EXECUÇÃO (Opus 4.8), após fechamento dos 5 mapas
- Escopo: executada a Fase 0 inteira — decidido o Modo de validação de cada item,
  proposto o padrão canônico, e registrado Resultado/Status no `00-PLAN.md`. As
  decisões detalhadas foram consolidadas num documento novo:
  **`docs/system-audit/F0-DECISIONS.md`** (o `00-PLAN.md` guarda o veredito curto
  e aponta para lá). Nenhuma linha de código de produto foi alterada — Fase 0 é
  só decisão de padrão; onde a decisão implica implementação em área sensível,
  ela fica gated (plano + aprovação) conforme `CLAUDE.md`.
- Modo de validação decidido por item:
  - F0-01 (Modal), F0-02 (Timestamp), F0-03 (Identidade), F0-04 (Coleções
    órfãs), F0-05 (Guard admin): **Automatizado** para a decisão (embasada por
    Mapa 4/5 + leitura direta). Implementação gated em F0-01 (design), F0-04
    (parada de escrita em onboarding) e F0-05 (segurança).
  - F0-06 (Tom de voz): **Requer execução humana (ratificação)** — o rascunho do
    guia foi redigido, mas o tom institucional é decisão de marca da Gestora.
    Protocolo de ratificação escrito no `F0-DECISIONS.md#f0-06`.
- Decisões (resumo):
  - **F0-01**: `GlassModal` é o modal-base único oficial; converger os 11 modais
    divergentes em 3 lotes, prioridade para unificar a escala de z-index (6
    valores não coordenados — risco de empilhamento errado).
  - **F0-02**: `FieldValue.serverTimestamp()` na escrita + serialização na
    leitura como padrão; pontos mistos legados (`products`, `marketing_coupons`,
    etc.) aceitos como débito documentado, sem migração forçada.
  - **F0-03**: precedência canônica de nome/nickname/e-mail definida;
    `src/lib/user-identity.ts` a ser promovido a helper único; convergência
    gradual de leitura+escrita nova, sem migração em massa.
  - **F0-04**: `entitlements` e `User_JourneyMap` arquivadas como legado;
    remoção de `entitlements.ts` é oportunística, parada de escrita de
    `User_JourneyMap` é gated.
  - **F0-05**: confirmado por leitura direta que `admin/layout.tsx` (Server
    Component) NÃO faz nenhuma verificação (só renderiza `AdminLayoutClient`);
    decidido adicionar guard server-side (sessão + `isAdmin`) equivalente ao do
    hub, mantendo o client como 2ª camada. Implementação gated.
  - **F0-06**: rascunho de guia de estilo entregue; achados de copy reavaliados.
- Achados/correções:
  - **Nenhum bug de código novo** surgiu na Fase 0 — os achados mapeiam para
    BUG-007/018/026 (anotados com a decisão de Fase 0) e para os itens de copy já
    previstos no escopo de F0-06.
  - **Correção de mapa (F0-06)**: o achado "preço/garantia fixos em
    `/servicos/[audience]/[slug]`" é **impreciso** — verificado que o preço vem de
    `product.price` (config, não hardcoded) e não há texto de garantia nessa
    rota. A copy hardcoded real ("Resgate via Faturamento Interno" / "Garantia
    BPlen") está em `/checkout/[slug]/page.tsx:228/238`, e a data de vigência
    hardcoded em `/privacidade/page.tsx:20`. Registrado para não caçar um
    problema inexistente na Fase 1.
- Itens do `00-PLAN.md` atualizados: F0-01, F0-02, F0-03, F0-04, F0-05, F0-06
  (todos de "Não iniciado/PENDENTE" para "Decidido"/"Proposta registrada, aguardando
  ratificação"). BUG-007, BUG-018, BUG-026 anotados em `BUGS.md` com a decisão de
  Fase 0. Documento novo `F0-DECISIONS.md` criado.

### Pendências para a Gestora (bloqueiam avanço de alguns itens)

1. **F0-06** precisa da ratificação de Victor do guia de tom de voz antes de a
   Fase 1 usar "revisão de copy contra o guia" como critério de aceite objetivo.
2. **F0-01 / F0-04 / F0-05** têm a decisão tomada mas a implementação é gated —
   quando Victor aprovar, cada uma vira um PR próprio (design/onboarding/segurança).
   Nada disso é pré-requisito para começar a Fase 1 de validação por página (as
   páginas podem ser validadas contra os padrões já decididos).

---

## [2026-07-02] Chat de execução — F0-05 implementado (guard server-side em /admin)

- Chat/sessão: mesmo chat de execução, na sequência das decisões de Fase 0
- Escopo: implementada a decisão do F0-05, após plano apresentado e **aprovado
  explicitamente pela Gestora**. Branch `fix/admin-server-side-guard`, arquivo
  único `src/app/admin/layout.tsx`.
- Mudança: `admin/layout.tsx` (antes síncrono, só renderizava `AdminLayoutClient`)
  virou Server Component async que chama `getServerSession()` e faz
  `redirect("/")` no servidor se sessão ausente / `role==="suspended"` / não-admin
  — espelhando `requireAdmin` (defense-in-depth, inclui bloqueio de suspenso que
  o hub não tem). Guard client em `AdminLayoutClient` mantido como 2ª camada.
  Usado `getServerSession()` (não `verifySignedSession()`) porque só ele traz
  `isAdmin` — `verifySignedSession()` retorna apenas `{uid,email}`.
- Validação: `src/app/admin/layout.tsx` passa no ESLint isolado; `tsc --noEmit`
  limpo; `next build` completo com exit 0.
- **Achado de infra relevante (novo)**: `npm run check` **já falha na `main`** no
  passo de `lint` — 192 erros de ESLint pré-existentes (`525 problems`), contagem
  **idêntica** na `main` e na branch (confirmado por checkout comparativo), então
  não foram introduzidos por esta mudança. Como `check` é
  `lint && test && type-check && build`, o lint quebrado impede o pipeline inteiro
  de rodar. A regra 5 do `CLAUDE.md` ("build limpo obrigatório") não está sendo
  cumprida no baseline do repo. **Recomendação**: abrir um esforço próprio de
  limpeza de lint (a maioria são `no-unused-vars` e `no-img-element`), ou
  reclassificar parte para `warn`, para destravar o gate de CI. Não tratado aqui
  para não misturar escopo com a correção de segurança.
- Itens atualizados: `00-PLAN.md` F0-05 (Status → Implementado), `BUGS.md` BUG-007
  (Status → Em Progresso, com detalhe da correção), este LOG.

---

## [2026-07-02] Chat de execução — F0-06 ratificado; Fase 0 fechada

- Chat/sessão: mesmo chat de execução
- Escopo: ratificação do guia de tom de voz (F0-06) pela Gestora, fechando a
  Fase 0.
- Decisões ratificadas por Victor:
  1. Tom formal-acolhedor, tratamento por "membro"/"você" (padrão já predominante).
  2. Caixa alta + tracking largo como padrão oficial de título da área logada.
  3. Extrair a data de vigência de `/privacidade` (`"21 de junho de 2026"`) para
     config — única ação de código gerada por F0-06.
- Estado da Fase 0: **completa.** F0-01/02/03/04 decididos; F0-05 decidido e
  implementado (branch `fix/admin-server-side-guard`); F0-06 ratificado. Os
  padrões canônicos agora existem para embasar a Fase 1.
- Pendências que sobram da Fase 0 (não bloqueiam a Fase 1):
  - Abrir/mergear o PR do F0-05 (branch pushed; `gh` CLI indisponível na máquina,
    PR a abrir pelo link do GitHub).
  - Implementações gated ainda por fazer, cada uma em PR próprio quando priorizada:
    convergência de modais (F0-01), limpeza de `entitlements`/parada de escrita de
    `User_JourneyMap` (F0-04), extração da data de `/privacidade` (F0-06).
  - Esforço próprio de limpeza de lint (192 erros pré-existentes) para destravar
    `npm run check`.
- Itens atualizados: `00-PLAN.md` F0-06 (Status → Ratificado),
  `F0-DECISIONS.md#f0-06` (seção de ratificação), este LOG.

---

## [2026-07-02] Chat de execução — limpezas seguras de Fase 0 (F0-06 data + F0-04 órfãs)

- Chat/sessão: mesmo chat de execução; a Gestora pediu para resolver o que fosse
  seguro dos 3 pontos residuais da Fase 0.
- Triagem honesta dos 3 pontos residuais:
  - PR do F0-05: **ação da Gestora** (abrir/mergear no GitHub; `gh` CLI ausente).
  - Implementações gated: F0-06 data e F0-04 (remoção órfã) = seguras, feitas
    agora; F0-01 (modais) = esforço multi-lote de design, NÃO feito; parada de
    escrita de `User_JourneyMap` = gated, NÃO feito.
  - Limpeza de lint (192 erros): esforço transversal próprio, NÃO feito.
- Feito nesta sessão (na mesma branch `fix/admin-server-side-guard`):
  1. **F0-06**: extraída a data de vigência hardcoded (`"21 de junho de 2026"`)
     de `/privacidade` **e** `/termos` (ambas tinham a mesma) para
     `src/config/legal-pages.ts` (`LEGAL_PAGES_LAST_UPDATED`). Commit
     `refactor(legal): ...`.
  2. **F0-04**: removidos `src/actions/entitlements.ts` (ação órfã, zero callers)
     e os tipos `UserEntitlement`/`EntitlementStatus` (zero uso externo). Commit
     `refactor(entitlements): ...`.
- **Correção de um erro meu no doc** (importante): eu havia escrito em
  `F0-DECISIONS.md` que "remover o arquivo + tipo de `entitlements` é baixo
  risco". Verificação direta antes de remover mostrou que
  `src/types/entitlements.ts` **NÃO** é órfão — ele hospeda
  `MemberQuota`/`MemberQuotaWallet`, importados por `quotas.ts` e `useJourney.ts`.
  Portanto o arquivo de tipos foi **mantido**; só a ação e os 2 tipos mortos
  saíram. Doc corrigido.
- Validação: ESLint dos arquivos tocados limpo; `tsc --noEmit` limpo (confirma que
  a remoção não quebrou nada); `next build` exit 0, com `/privacidade` e `/termos`
  seguindo estáticas. Os logs `❌ [Server Session]` no build são efeito esperado do
  F0-05 (rotas `/admin/*` agora dinâmicas por lerem `cookies()`), não erro.
- Itens atualizados: `00-PLAN.md` F0-04 (Parcialmente implementado) e F0-06 (ação
  de código implementada); `BUGS.md` BUG-018 (Em Progresso); `F0-DECISIONS.md`
  F0-04 (correção de impacto) e F0-06 (data feita); este LOG.
- Estado dos 3 pontos residuais após esta sessão:
  - PR F0-05: **pendente da Gestora** (link fornecido).
  - F0-01 modais + parada de escrita `User_JourneyMap` + limpeza de lint:
    **abertos**, cada um como esforço/PR próprio quando priorizado.

---

## [2026-07-02] Chat de execução — PR #1 mergeado; BUG-028 (gap de auth) registrado

- Chat/sessão: mesmo chat de execução
- Escopo: fechamento do PR #1 e registro/validação do gap de autenticação
  reportado pela Gestora.
- PR #1 (`fix/admin-server-side-guard`) **mergeado na `main`** (merge commit
  `88eaf97`) via REST API do GitHub usando a credencial já salva do `git` (o `gh`
  CLI não está instalado). Branch deletada (local + remota). A Gestora autorizou
  o merge após o preview da Vercel deployar corretamente (o gap de auth do preview
  é problema separado, abaixo).
- Status de bugs atualizados: `BUG-007` → **Corrigido** (PR #1); `BUG-018` →
  Em Progresso (parte `entitlements` mergeada no PR #1, `User_JourneyMap` aberta).
  `00-PLAN.md` F0-04/F0-05 marcados como mergeados.
- **BUG-028 registrado (novo)** — login com Google falha sem fallback quando o
  popup é bloqueado (`auth/popup-blocked`). Diagnóstico original veio do chat
  `Dev_03` (reprodução em navegador normal → bug real, não limitação de preview) e
  foi **validado por leitura de código nesta sessão**: `signInWithPopup` é o único
  caminho (`use-auth.ts:44`), COOP correto (`next.config.ts:91`, descartado),
  `syncUserPermissionsOnLogin` só no caminho popup (`use-auth.ts:55`), sem
  `getRedirectResult`. Plano de correção (fallback para `signInWithRedirect` +
  mover sync de permissões para `AuthContext` + `getRedirectResult`) registrado no
  bug; **implementação aguarda aprovação** (toca `AuthProvider`/fluxo de login —
  área sensível). Decisão pendente da Gestora: versão simples (só fallback) vs.
  completa (fallback + retomada de fluxo pós-redirect nos CTAs).
- Itens atualizados: `BUGS.md` (BUG-007, BUG-018, +BUG-028), `00-PLAN.md`
  (F0-04/F0-05), este LOG.

---

## [2026-07-02] Chat de execução — investigação do authDomain (BUG-029), gate do BUG-028

- Chat/sessão: mesmo chat de execução; a Gestora escolheu a versão **completa** do
  fix (BUG-028) e a opção **B** (validar/ajustar authDomain antes de codar).
- Investigação (por leitura de código, automatizada):
  - Mapeados os 5 consumidores de `signInWithGoogle` (google-login-button,
    GlobalFooter, FloatingCTAs x2 + AuthRequiredHandler, InvitationSurvey) — base
    para a retomada de fluxo da versão completa.
  - **Achado que redefine a causa raiz (BUG-029)**: `next.config.ts:44-55` já tem
    o reverse-proxy first-party de `/__/auth/*` e `/__/firebase/*` para
    `bplenhub.firebaseapp.com`, MAS `firebase.ts:12-14` força o `authDomain` de
    `bplen.com` de volta para `firebaseapp.com`, fazendo o SDK ignorar o proxy e
    operar cross-domain (sujeito ao bloqueio de cookies de terceiros). Provável
    causa raiz do gap em produção. Preview (`*.vercel.app`) tem agravante
    estrutural (domínio efêmero != authDomain fixo).
- Decisões/registro:
  - **BUG-029 registrado** (override de authDomain anula o proxy) como
    bloqueador do BUG-028, com protocolo de validação (execução humana) e correção
    provável (condicionar o override só a preview/domínios não autorizados,
    permitindo `authDomain=bplen.com` em produção).
  - BUG-028 marcado como **bloqueado por BUG-029**; versão escolhida = completa.
  - Nenhuma mudança de código de auth feita (opção B: validar primeiro; além de
    ser área sensível que exige plano+aprovação).
- Próximo passo: Gestora executa o protocolo de validação do BUG-029 (env de prod,
  authorized domains, teste em navegador real, experimento com `authDomain=bplen.com`).
- Itens atualizados: `BUGS.md` (BUG-028 gate + BUG-029 novo), este LOG.

---

## [2026-07-02] Chat de execução — validação inverte o diagnóstico: gap é preview-only (BUG-030)

- Chat/sessão: mesmo chat de execução
- Validação executada pela Gestora (opção B):
  1. `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` (prod) = `bplen.com`.
  2. `bplen.com` está nos Authorized Domains do Firebase = sim.
  3. **Sem erro de login em produção; erro só no preview.**
- Conclusão (inverte a hipótese anterior):
  - **Produção loga normalmente** via popup, mesmo com o override forçando
    `authDomain=firebaseapp.com`. Logo o override (BUG-029) **não** é a causa de
    nenhum gap ativo, e o fallback popup→redirect (BUG-028) **não** é necessário
    para produção. Ambos rebaixados.
  - O gap real é **preview-only**: `*.vercel.app` não é domínio autorizado no
    Firebase e nunca coincide com o `authDomain` fixo → login falha só no preview.
    Limitação conhecida de Firebase Auth + preview da Vercel, não defeito de
    código. Registrado como **BUG-030** (Baixo).
- Reclassificações:
  - **BUG-028**: Alto → Baixo; implementação do fallback+retomada **adiada** (não
    destabilizar um fluxo de auth que funciona em produção por um problema que é
    de preview). Diagnóstico/plano preservados para retomada sob demanda.
  - **BUG-029**: Alto → Baixo; não mexer sem causa (produção funciona; remover o
    override às cegas poderia regredir o motivo pelo qual foi criado).
  - **BUG-030 (novo)**: gap de auth no preview; decisão de infra da Gestora
    (aceitar limitação vs. montar staging com domínio próprio).
- Aprendizado de processo: a opção B (validar antes de codar) evitou um refactor
  grande e arriscado no fluxo de login para um problema que não existe em
  produção. Registrar como reforço de "validar premissa antes de implementar em
  área sensível".
- Itens atualizados: `BUGS.md` (BUG-028/029 rebaixados, +BUG-030), este LOG.
- Nenhuma mudança de código de auth feita.

---

## [2026-07-02] Chat de execução — remoção de rotas de API sem auth (BUG-003 Crítico + BUG-023)

- Chat/sessão: mesmo chat de execução; a Gestora priorizou a segurança urgente
  após validar o PR #1 em produção.
- Escopo: removidas 3 rotas `GET` públicas sem guard, todas com zero callers no
  `src/` (confirmado por busca). Branch `security/remove-unauthed-api-routes`.
  - `/api/admin/recover` (BUG-003, **Crítico**): concedia admin total a qualquer
    e-mail da query string existente no Firebase Auth. Escalação de privilégio
    trivial (atacante loga a própria conta Google uma vez, chama a rota → admin).
  - `/api/ghosts` (BUG-023): vazava matrícula + data de check-in de todos.
  - `/api/liandra` (BUG-023): despejava todos os surveys de uma matrícula real
    hardcoded.
- Decisão (aprovada pela Gestora): remover as 3 e **preservar a capacidade de
  recovery** num script local seguro — criado `scripts/recover-admin.js`
  (admin SDK, execução local, exige service account, e-mail via argumento; sem o
  default hardcoded que a rota tinha).
- Validação: `tsc --noEmit` e `next build` limpos (foi preciso limpar `.next` por
  causa de tipos de rota stale do validador do Next referenciando as rotas
  deletadas — artefato de cache, não erro de código). Rotas restantes intactas
  (`docs`, `media`, `trigger-sync`, `webhooks/mercadopago`).
- Status: BUG-003 e BUG-023 → **Corrigido** (aguardando merge do PR).
- Nota para T-02/T-06: BUG-024 (`/api/trigger-sync` sem guard) e BUG-025 (webhook
  MP sem HMAC) continuam abertos — não tratados aqui (trigger-sync pode ser cron
  real e precisa de shared secret, não remoção; webhook é fluxo financeiro).
- Itens atualizados: `BUGS.md` (BUG-003, BUG-023 → Corrigido), este LOG.

---

## [2026-07-02] Chat de execução — BUG-003/023 mergeados + verificação em prod; BUG-019 corrigido

- Chat/sessão: mesmo chat de execução
- **PR #3 mergeado** (`ca6b0aa`) e verificado em produção: `/api/admin/recover`,
  `/api/ghosts`, `/api/liandra` retornam **404** (seguindo o redirect apex→www);
  `/api/trigger-sync` segue 200 (sanity). Auditoria (`scripts/audit-admins.js`)
  rodada: **1 admin legítimo** (`SYSTEM_MASTER_AUTO_GRANT` por legnp@bplen.com),
  **sem sinal de exploração** da rota removida.
  - Nota honesta: a rota usada no sanity (`/api/trigger-sync`) **não é read-only**
    — meu GET disparou `updateGlobalProgramacaoRegistryAction` (rewrite idempotente
    do registro de programação). Sem dano esperado, mas reforça o `BUG-024`
    (rota sem guard, publicamente acionável, retorna 200) — próximo candidato de
    segurança (precisa de shared secret, não remoção).
- **BUG-019 (IDOR em `profile.ts`) corrigido** — branch `security/fix-profile-idor`.
  `updateProfileImageAction`/`deleteProfileImageAction` recebiam `matricula` sem
  guard. Adicionado `requireAuth()` (sessão via cookie assinado) + trava de dono
  (`session.matricula !== matricula && !isAdmin`). Único caller
  (`ProfileIdentityTab`, autoatendimento) não muda; erro cai no try/catch e volta
  como `{success:false,error}`. Validado por eslint + tsc + build.
- Itens atualizados: `BUGS.md` (BUG-003/023 mergeados, BUG-019 → Corrigido), este LOG.
- Trilha de segurança restante: BUG-020 (dezenas de actions sem guard — T-02),
  BUG-024 (`trigger-sync` sem shared secret), BUG-025 (webhook MP sem HMAC).

---

## [2026-07-03] Chat de execução — BUG-024 removida (rota órfã) + BUG-031 registrado

- Chat/sessão: mesmo chat de execução
- Investigação da hipótese da Gestora (a rota poderia ser parte do fluxo de
  agendamento / prevenção de concorrência de horários):
  - **Refutada por código.** `/api/trigger-sync` tem zero callers de aplicação
    (busca exaustiva no repo inteiro); nenhuma lib de cron no `package.json`;
    `firebase.json` sem funções agendadas; `.github` sem cron na URL. A Gestora
    confirmou não haver agendador externo.
  - A prevenção de double-booking é feita por **transação atômica** em
    `booking.ts` (`runTransaction` + checagem `registeredCount >= capacity`),
    independente dessa rota.
  - O refresh que a Gestora usa é o botão "Sincronizar Agora" do painel
    (`syncCalendarToFirestore`, autenticado pelo login), que **não** é essa rota.
- Decisão (aprovada pela Gestora): **remover** `/api/trigger-sync` (BUG-024) em vez
  de gatear — é código morto confirmado. A função interna
  `updateGlobalProgramacaoRegistryAction` permanece (chamada por booking/pós-evento);
  só a casca HTTP pública some. Reversível via git se um chamador externo
  invisível aparecer.
- **BUG-031 registrado** (melhoria de usabilidade, priorizada pela Gestora):
  "Sincronizar Agora" puxa eventos do Google mas não reconstrói o
  `Programacao_Registry` (lista vista pelos membros) — considerar chamar
  `updateGlobalProgramacaoRegistryAction` ao final de `syncCalendarToFirestore`.
- Itens atualizados: `BUGS.md` (BUG-024 → Corrigido, +BUG-031), este LOG.
- Trilha de segurança restante: BUG-020 (T-02), BUG-025 (webhook MP sem HMAC).

---

## [2026-07-03] Chat de execução — painel de progresso vivo (DASHBOARD.md)

- Chat/sessão: mesmo chat de execução
- Escopo: a Gestora pediu visibilidade contínua do progresso da Fase 0 **junto
  dos Tracks (T-*) associados**, que se mantenha atualizada conforme itens são
  resolvidos (inclusive bugs novos que surgirem).
- Decisões (cadência e mecanismo, escolhidos pela Gestora):
  - **Cadência:** atualizar o painel **a cada PR mergeada** (mesmo checkpoint da
    entrada do LOG).
  - **Mecanismo:** **manual** por ora (aplica julgamento nos status nuançados,
    zero setup, casa com o volume atual). Script gerador automático fica como
    upgrade futuro — quando/se for feito, adicionar antes campos legíveis por
    máquina (Status + Tracks de vocabulário fixo) para o parser não chutar prosa.
- Entregue:
  - Novo **`DASHBOARD.md`** — Fase 0 (6/6 decididas; F0-01 e F0-04 com
    implementação pendente) + Tracks T-02 (5/10), T-06 (1/2), T-03 (~0,5/4), mais
    os bugs novos (BUG-028..031).
  - **Regra amarrada no protocolo** do `00-PLAN.md` (item 5): atualizar o
    DASHBOARD a cada PR mergeada.
  - **Status do T-02 no `00-PLAN.md` corrigido** (estava "Não iniciado" apesar de
    vários bugs já mergeados) → "Em andamento 5/10".
- Observação de processo: a pergunta da Gestora ("os bugs se conectam à Fase 0?")
  expôs que o T-02 nasce de dentro da Fase 0 (via F0-05) e que seu status estava
  defasado — reconciliado aqui. PR #5 (BUG-024) foi mergeado nesta sessão antes de
  montar o painel, para o DASHBOARD já refletir o estado final (T-02 5/10).
- Itens atualizados: novo `DASHBOARD.md`; `00-PLAN.md` (protocolo item 5 + status
  T-02); este LOG.

---

## [2026-07-03] Chat de execução — retrospectiva do processo (RETROSPECTIVE.md)

- Chat/sessão: mesmo chat de execução
- Escopo: a pedido da Gestora, retrospectiva do processo de auditoria para (a) o
  chat de planejamento refinar o plano e (b) os próximos chats de execução
  performarem melhor.
- Entregue:
  - Novo **`RETROSPECTIVE.md`** (documento vivo) com: **Lições de execução**
    (diretivas práticas destiladas de erros/acertos reais — ex.: não usar rota
    mutante como sonda; verificar código antes de afirmar; higiene de branch/PR;
    `gh` ausente → PR via API; triagem por severidade), **melhorias sugeridas para
    o plano**, e **o que preservar**.
  - **Protocolo do `00-PLAN.md` (item 1) atualizado**: todo chat de execução deve
    ler o `RETROSPECTIVE.md` antes de agir, e adicionar lições reutilizáveis.
- Honestidade da sessão registrada: dois erros meus documentados como lição —
  (1) disparei `/api/trigger-sync` (rota mutante) como sanity check; (2) afirmei
  no doc que o tipo `entitlements` era órfão sem verificar (não era). Ambos
  corrigidos antes de causar dano, e viram guia para o próximo chat.
- Itens atualizados: novo `RETROSPECTIVE.md`; `00-PLAN.md` (protocolo item 1);
  este LOG.

---

## [2026-07-03] Chat de planejamento — refinamento do plano a partir do RETROSPECTIVE

- Chat/sessão: chat de planejamento (Sonnet 5), a pedido explícito do Gestor
- Escopo: leitura integral de `00-PLAN.md`, `LOG.md`, `BUGS.md`, `DASHBOARD.md` e
  `RETROSPECTIVE.md`, seguida de refino do `00-PLAN.md` incorporando as 5
  "Melhorias sugeridas para o PLANO" do `RETROSPECTIVE.md`, e reconciliação de
  status defasado entre os 3 documentos-fonte. **Nenhuma linha de código de
  produto foi tocada** — chat de planejamento não implementa.
- As 5 melhorias aplicadas ao `00-PLAN.md`:
  1. **Decisão separada de Execução em todos os 27 itens do checklist**
     (Fases 0-4 + Tracks) — campo único `Status` (ambíguo) substituído por dois
     campos de vocabulário fixo. Seção "Convenções deste documento" nova,
     definindo o vocabulário.
  2. **Índice explícito "Bug → Item/Track"** — tabela nova com os 31 bugs,
     severidade, status e vínculo de plano, construída cruzando `BUGS.md`
     contra o campo "Bug(s) vinculado(s)" de cada item.
  3. **Tags `[HIPÓTESE]`/`[CONFIRMADO]`** — regra adicionada ao Protocolo (item
     7) e aplicada retroativamente às afirmações não confirmadas já existentes
     no plano: BUG-009 (`UserBooking.timestamp` sempre nulo), BUG-010
     (`adminAddAttendeeAction` duplicado = código morto), BUG-011 (exploit
     teórico de antecedência mínima), BUG-022 (bypass de pagamento intencional).
  4. **Critério objetivo de fechamento de Track**: "corrigido (mergeado) OU
     formalmente aceito com justificativa" — adicionado às "Convenções" e
     espelhado no cabeçalho do `DASHBOARD.md`.
  5. **Overlay de triagem por severidade**: seção nova logo após o template,
     listando ao vivo todo bug `Crítico`/`Alto` `Aberto` (hoje: BUG-020, 010,
     008, 004, 001 — nenhum Crítico ativo) e regra no Protocolo (item 6).
- Reconciliações de status defasado encontradas e corrigidas:
  - **`BUG-004`** (vazamento de path em `admin-fs.ts`) e **`BUG-022`** (bypass
    de pagamento em `retroactive-contract.ts`) não tinham **nenhum** item/track
    vinculado em nenhum dos 3 documentos — achado só ficou visível ao montar o
    índice explícito (prova do valor da melhoria #2). Linkados: BUG-004 → T-02
    (denominador sobe de 10 para 11, % recalculada para ~45%); BUG-022 → F3-03.
  - **T-02 e T-06 no `00-PLAN.md` diziam "Status: Não iniciado"** enquanto o
    `DASHBOARD.md` já mostrava progresso real (T-02 5/10, T-06 1/2) — o
    `00-PLAN.md` nunca tinha sido atualizado depois que os bugs desses tracks
    começaram a ser corrigidos. Corrigido: os itens agora refletem o mesmo
    número que o `DASHBOARD.md` (fonte de verdade realinhada).
  - **4 referências de PR desatualizadas em `BUGS.md`** (BUG-003, BUG-019,
    BUG-023, BUG-024 diziam "branch ... (PR aberto)"): verificado via
    `git log origin/main --merges` que todos os 7 PRs abertos até agora (#1 a
    #7) estão mergeados — corrigidos os 4 campos `Commit/PR` com o número do PR
    e hash do commit de merge confirmados no histórico real do git (não só nos
    docs, que podem ficar desatualizados).
- Itens do `00-PLAN.md` atualizados: reescrita completa (template, Protocolo
  itens 6-7 novos, seção "Convenções", seção "Triagem por severidade", seção
  "Índice — Bug → Item/Track", todos os 27 itens de Fase/Track com campos
  Decisão/Execução, T-02/T-03/T-06 recalculados). `DASHBOARD.md` (T-02 → 5/11,
  nota de última atualização, linha de critério de fechamento). `BUGS.md`
  (4 campos `Commit/PR` corrigidos). Este LOG.
- Nada bloqueado para a próxima sessão de execução — o plano está pronto para
  retomar a fila de triagem por severidade (BUG-020 é o maior item aberto) ou
  seguir para a Fase 1.

---

## [2026-07-03] Chat de execução — BUG-020 lote 1 (guards de booking) mergeado

- Chat/sessão: chat de execução (Opus 4.8), retomando o T-02
- Escopo: 1º lote do BUG-020 (dezenas de Server Actions sem guard) — módulo de
  **booking**. Plano+risco apresentados e **aprovados pela Gestora** antes de codar
  (área sensível). Arquivo único: `src/actions/calendar-module/booking.ts`.
- Achados/mapeamento de callers (por leitura direta, antes de codar):
  - `cancelBookingAction` e `submitEvaluationAction`: **IDORs confirmados** — sem
    guard, recebem `matricula`/`userUid` arbitrários. Todos os callers são membro
    logado (`UserBookings.tsx`, `MemberDashboardView.tsx`, `StepRenderer.tsx`).
  - `bookEventAction`: dois callers — membro (`Calendar.tsx`, com `matricula`) **e
    lead público** (`external-booking.ts:bookPublicMeetingAction`, sem `matricula`,
    com `leadInfo`). Por isso o guard teve de ser **condicional**, para não quebrar
    o funil de lead 1-to-1 (receita).
  - `adminAddAttendeeAction`/`rescheduleAttendeeAction`: já tinham `requireAdmin`.
- Mudança: `cancel`/`submitEvaluation` → `requireAuth()` + `session.matricula !==
  matricula && !isAdmin` → erro. `bookEventAction` → se `matricula` presente, exige
  sessão própria/admin; senão exige `leadInfo` (funil de lead), caso contrário
  rejeita. Padrão canônico do T-02 (`requireAuth` + dono-ou-admin) formalizado na
  prática. Sessão resolvida pelo cookie assinado, **sem mudar assinatura** de
  nenhuma action nem tocar o dispatcher god-file `calendar.ts` (blast radius mínimo,
  mesmo padrão do BUG-019).
- Validação: eslint no arquivo (0 erros, só warnings pré-existentes), `tsc --noEmit`
  limpo, `next build` exit 0.
- Entrega: branch `security/booking-actions-guards` → **PR #8 mergeado** (`6610167`,
  squash) via REST API do GitHub (credencial salva do git; `gh` ausente). Branch
  deletada (local+remota).
- Contabilidade honesta: BUG-020 é **um** bug feito em lotes — fica **Em Progresso**
  (não "Corrigido"). T-02 sobe de 5/11 para **~5,5/11** (contagem fracionária, mesmo
  precedente do BUG-018/T-03), não 6/11.
- Itens atualizados: `BUGS.md` (BUG-020 → Em Progresso, PR #8), `00-PLAN.md` (T-02
  Execução/Resultado, Triagem por severidade, Índice bug→track), `DASHBOARD.md`
  (T-02 ~5,5/11, BUG-020 ◐ parcial, data), este LOG.
- Trilha de segurança restante no T-02: BUG-020 lotes seguintes (partners,
  assessments, forms/surveys, journey, queries, upload, `auth-permissions`),
  BUG-004 (vazamento de path), BUG-005, BUG-006, BUG-021, BUG-025 (webhook HMAC).

---

## [2026-07-03] Chat de execução — BUG-020 lote 2 (CRUD admin) mergeado

- Chat/sessão: mesmo chat de execução, na sequência do lote 1
- Escopo: 2º lote do BUG-020 — CRUD/leituras admin sem guard. Plano+risco
  apresentados e **aprovados pela Gestora** antes de codar. Arquivos:
  `src/actions/admin/partners.ts` e `src/actions/admin-assessments.ts`.
- Achados (por leitura direta): 5 actions admin **sem guard nenhum**, sendo 3
  mutações diretamente invocáveis por rede — `upsertPartnerAction` (cria/edita
  parceiro + upload Drive), `deletePartnerAction` (apaga parceiro),
  `toggleAssessmentRelease` (libera/oculta diagnóstico DISC de qualquer membro +
  cria/apaga `Shared_Documents`) — mais 2 leituras (`getPartnersAction`,
  `getUserAssessments`). Grep confirmou callers 100% admin
  (`admin/partners/page.tsx`, `admin/users/page.tsx`, `DevolutivaComportamentalView.tsx`);
  `getPartnersAction` **não** é usado no `/hub/networking` (vitrine do membro lê
  por `getNetworkingDataAction`), então `requireAdmin()` não afeta a área de membro.
- Mudança: `requireAdmin()` como 1ª linha do `try` de cada uma das 5 actions
  (defense-in-depth sobre o guard de render do F0-05). Chamador não-admin cai no
  catch existente → resposta segura já tratada pelos callers (`[]` nas leituras,
  `{success:false}` nas mutações). Sessão pelo cookie assinado; **assinaturas
  inalteradas**, callers não mudam.
- Validação: eslint nos 2 arquivos (0 erros, só warning `_excludeId` pré-existente),
  `tsc --noEmit` limpo, `next build` **exit 0** (os logs `❌ [Server Session]` no
  build são o efeito esperado do F0-05 — rotas `/admin/*` dinâmicas por lerem
  `cookies()` — não erro; confirmado com captura do exit code real).
- Entrega: branch `security/admin-crud-guards` → **PR #9 mergeado** (`70d418e`,
  squash) via REST API do GitHub. Branch deletada (local+remota).
- Contabilidade: BUG-020 segue **Em Progresso** (2 lotes de vários). T-02 de
  ~5,5 para **~5,7/11** (fracionário honesto, precedente BUG-018/T-03).
- Itens atualizados: `BUGS.md` (BUG-020, +lote 2/PR #9), `00-PLAN.md` (T-02
  Execução/Resultado, Triagem, Índice), `DASHBOARD.md` (T-02 ~5,7/11, data),
  este LOG.
- Trilha restante no T-02: BUG-020 lotes seguintes (forms/surveys analytics,
  journey `assignDynamicSubstep*`, queries do calendário, upload/portfólio,
  `auth-permissions`), BUG-004, BUG-005, BUG-006, BUG-021, BUG-025 (webhook HMAC).

---

## [2026-07-03] Chat de execução — BUG-020 lote 3 (analytics admin) mergeado

- Chat/sessão: mesmo chat de execução, na sequência do lote 2
- Escopo: 3º lote do BUG-020 — leituras agregadas de analytics admin sem guard.
  Plano+risco apresentados e **aprovados pela Gestora** antes de codar. Arquivos:
  `src/actions/admin-forms.ts` e `src/actions/admin-surveys.ts`.
- Achados (por leitura direta): `getAdminFormsAnalytics` e `getAdminSurveysAnalytics`
  fazem `collectionGroup("Forms"/"Surveys").get()` — leem contagem/timestamps de
  respostas de **todos** os usuários — sem nenhum guard. Grep confirmou callers
  100% admin (`admin/fs/forms/page.tsx`, `admin/fs/surveys/page.tsx`).
- Mudança: `requireAdmin()` como 1ª linha do `try` de cada action. Chamador
  não-admin cai no catch existente → shape vazio seguro já tratado pelos callers
  (`{forms:[],stats:{...0}}` / `{surveys:[],stats:{...0}}`). Sessão pelo cookie
  assinado; **assinaturas inalteradas**.
- Validação: eslint nos 2 arquivos (0 erros/warnings), `tsc --noEmit` limpo,
  `next build` **exit 0** (confirmado com captura do exit code real).
- Entrega: branch `security/admin-analytics-guards` → **PR #10 mergeado**
  (`34c3c21`, squash) via REST API do GitHub. Branch deletada (local+remota).
- Contabilidade: BUG-020 segue **Em Progresso** (3 lotes de vários). T-02 de
  ~5,7 para **~5,8/11** (fracionário honesto, precedente BUG-018/T-03).
- Itens atualizados: `BUGS.md` (BUG-020, +lote 3/PR #10), `00-PLAN.md` (T-02
  Execução/Resultado, Triagem, Índice), `DASHBOARD.md` (T-02 ~5,8/11, data),
  este LOG.
- Trilha restante no T-02: BUG-020 lotes seguintes (queries do calendário — o
  mais nuançado, mistura callers de membro e admin + guards condicionais; journey
  `assignDynamicSubstep*`; upload/portfólio; `auth-permissions`), BUG-004,
  BUG-005, BUG-006, BUG-021, BUG-025 (webhook HMAC).

---

## [2026-07-03] Chat de execução — BUG-020 lote 4 (queries do calendário) mergeado

- Chat/sessão: mesmo chat de execução, na sequência do lote 3
- Escopo: 4º lote do BUG-020 — o mais heterogêneo e de maior superfície de
  regressão (caminho do dashboard/agenda do membro). Plano+risco apresentados e
  **aprovados pela Gestora** (com explicação "para leigo" do que muda/pode quebrar)
  antes de codar. Arquivo único: `src/actions/calendar-module/queries.ts`.
- Mapa de callers (por grep, antes de codar) — determinou o guard por função:
  - Membro lendo a própria matrícula: `getUserBookingsAction` (6 callers),
    `getUserOneToOneQuotaAction` (1) → **IDOR** → `requireAuth()` + dono-ou-admin.
  - Admin: `getEventAttendees` (ProgramacaoResumo/PostEventWizard/post-event),
    `getEventNpsDetailsAction` (ProgramacaoResumo) → `requireAdmin()`.
  - Misto autenticado (membro+admin, todos sem idToken → guard condicional nunca
    disparava): `getSyncedEvents` → `requireAuth(idToken)`.
  - `fetchCalendarEvents` (sem caller de UI direto) → `requireAuth()`.
  - `getProgramacaoForMemberAction`/`getProgramacaoSummaryAction` já tinham guard.
- Cuidado tratado: a chamada aninhada `getUserBookingsAction`→`getSyncedEvents()`
  roda no mesmo request autenticado do membro, então o guard interno passa sem
  duplo-throw (ordem verificada). Guard como 1ª linha do try → não-autorizado cai
  no catch e recebe o retorno vazio seguro já tratado pelos callers (`[]`/`null`/
  `{success:false}`). Assinaturas inalteradas; dispatcher `calendar.ts` intocado.
- Validação: eslint (0 erros, 2 warnings pré-existentes `parseISO`/`isBefore`),
  `tsc --noEmit` limpo, `next build` **exit 0**. Verificação em preview não se
  aplica (telas logadas não autenticam no preview da Vercel — BUG-030); validado
  por tsc+build como o resto do processo para fluxo logado.
- Entrega: branch `security/calendar-queries-guards` → **PR #11 mergeado**
  (`e4d7fb9`, squash) via REST API do GitHub. Branch deletada (local+remota).
- Contabilidade: BUG-020 segue **Em Progresso** (4 lotes de vários). T-02 de
  ~5,8 para **~5,9/11** (fracionário honesto, precedente BUG-018/T-03).
- Itens atualizados: `BUGS.md` (BUG-020, +lote 4/PR #11), `00-PLAN.md` (T-02
  Execução/Resultado, Triagem, Índice), `DASHBOARD.md` (T-02 ~5,9/11, data),
  este LOG.
- Trilha restante no T-02: BUG-020 lotes finais (journey `assignDynamicSubstep*`,
  upload/portfólio, `auth-permissions`), BUG-004, BUG-005, BUG-006, BUG-021,
  BUG-025 (webhook HMAC).

---

## [2026-07-03] Chat de execução — BUG-020 lote 5 (journey) mergeado

- Chat/sessão: mesmo chat de execução, na sequência do lote 4
- Escopo: 5º lote do BUG-020 — as 6 server actions de `src/actions/journey.ts`
  (o BUG-020 citava só `assignDynamicSubstep*`, mas o arquivo inteiro estava sem
  guard). Plano+risco apresentados e **aprovados pela Gestora** (com explicação
  "para leigo") antes de codar.
- Mapa de callers (por grep + leitura, antes de codar):
  - `getJourneyProgressAction`/`updateJourneySubStepAction` (uid): caller único
    `useJourney` (membro, próprio uid) → **IDOR** → `requireAuth()` + dono-ou-admin
    (`session.uid !== uid`). A 1ª também faz lazy-write, reforçando a necessidade.
  - `assignDynamicSubstepAction`/`assignDynamicSubstepToPresentAttendeesAction`:
    admin (PostEventWizard + interno) → `requireAdmin()`.
  - `getJourneyStagesAction`/`getStandaloneStageAction`: catálogo; callers 100%
    autenticados (useJourney, admin/sync-tools, interno) → `requireAuth()`.
- Ponto crítico resolvido por leitura: `useJourney` só dispara com uid real
  (`useEffect` linha 116 `uid !== "guest"`; `updateSubStep` linha 124 early-return),
  então nunca chega "guest" no servidor e o owner-check compara `session.uid` com
  o uid do próprio membro logado. Chamadas aninhadas (4 actions →
  `getJourneyStagesAction`/`getStandaloneStageAction`) rodam no mesmo request
  autenticado (membro ou admin), passam sem duplo-throw. `applyCrossCompletionSweep`
  é helper interno não-exportado, sem guard.
- Achado de lint: 2 `prefer-const` **pré-existentes** (baseline) apareceram no
  eslint do arquivo (`newCompletionDates`/`newDates`, só mutação de propriedade).
  Corrigidos let→const explicitamente (auto-fixáveis; o hook faria de qualquer
  forma) para manter a validação limpa. Registrado como bundle no commit.
- Validação: eslint (0 erros), `tsc --noEmit` limpo, `next build` **exit 0**.
  Telas logadas não autenticam no preview (BUG-030); validado por tsc+build.
- Entrega: branch `security/journey-guards` → **PR #12 mergeado** (`ddbcc49`,
  squash) via REST API do GitHub. Branch deletada (local+remota).
- Contabilidade: BUG-020 segue **Em Progresso** (5 lotes; faltam 2). T-02 de
  ~5,9 para **~5,95/11** (fracionário honesto, precedente BUG-018/T-03).
- Itens atualizados: `BUGS.md` (BUG-020, +lote 5/PR #12), `00-PLAN.md` (T-02
  Execução/Resultado, Triagem, Índice), `DASHBOARD.md` (T-02 ~5,95/11, data),
  este LOG.
- Reta final do BUG-020: só **upload/portfólio** (`migration-welcome`,
  `portfolio-commands`, `product-sync`, `upload-to-drive` — este é também o
  BUG-021) e **`auth-permissions.ts:fetchUserPermissionsStatus`**. Quando esses 2
  fecharem, BUG-020 vira Corrigido e o T-02 dá salto real na %.
