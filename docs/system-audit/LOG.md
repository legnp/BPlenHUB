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
