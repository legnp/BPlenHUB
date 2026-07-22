# Design — Redesign do Admin (BPlen HUB)

Documento de design da reforma visual/organizacional do painel `/admin`, no padrão
de `CONTRACTS-DESIGN.md` / `AGENDA-SYNC-DESIGN.md` / `ACCESS-MODEL-DESIGN.md`.

**Origem:** pendência de design da `F1-06` (a fase validou o admin **funcionalmente**;
o redesign ficou para uma passada separada, "com PROPOSTA por tela"). Levantamento +
pré-proposta feitos em 2026-07-21; **categorias e escopo APROVADOS pela Gestora** na
mesma data.

**Aprovação (2026-07-21):** as **7 categorias** abaixo aprovadas como estão; escopo
**completo (camadas 1+2+3)**, a executar **por lotes**.

---

## 0. Princípio-guia

**Reuso, não invenção.** O grosso do redesign é **estender ao admin o padrão que a
área logada já tem** — não criar um padrão novo. Isso reduz risco e esforço:

- **Header canônico já existe:** `src/components/layout/FunctionalPageHeader.tsx`
  (props: `eyebrow`, `title`, `titleAccent`, `backHref`, `backLabel`, `icon`,
  `action`). O hub inteiro migrou para ele na `F2-05`; o admin é o **único bloco da
  área logada que não usa**.
- **Padrão de título já ratificado:** `F0-06` fixou "caixa alta + tracking largo"
  como o título oficial da área logada. O admin já usa isso **de forma inconsistente**
  — a correção é *seguir* o padrão, não redefinir.
- **Cor/tema já OK:** o admin já consome as variáveis de tema e o seletor do
  `HubHeader` (claro/escuro/7 temas funcionam). **A paleta não é o problema** — o
  problema é estrutura de header, tipografia e tom. Não mexer na paleta.

---

## 1. Diagnóstico (medido por leitura de código, 2026-07-21)

### 1.1 Design
- **0 das 19 telas** usam o `FunctionalPageHeader`. Cada tela reimplementa o header.
- **~4 tratamentos de título** diferentes: `font-bold` vs `font-black`; `text-2xl` /
  `text-3xl` / `text-4xl`; caixa alta vs. frase. Ex.: `marketing` usa
  `text-3xl font-bold`; `products` usa `text-3xl font-black`; `partners` usa
  `text-2xl font-black tracking-tighter` **em frase** (destoa de todos).
- **Tiles de métrica** (números no topo) variam de tamanho tela a tela (`text-2xl` /
  `text-3xl` / `text-4xl`) — não há componente único.
- **Tique estilístico irregular:** "primeira parte + *segunda em itálico colorido*"
  (`CUPONS E `*`OFERTAS`*`, `PORTFOLIO `*`Command Center`*) — aplicado sem critério.

### 1.2 Tom de voz
- **Caixa alta vs. frase misturadas** (o padrão é caixa alta — `F0-06`).
- **Inglês solto:** "Control Center" (sidebar), "Command Center" (Portfólio),
  "Welcome Survey" (migração), "Hub" como enfeite.
- **Jargão / nomes de banco na tela:** "F&S", "MÁQUINA DE QR CODES", "PROGRAMAÇÃO
  HUB", "Registradas em SURVEY_REGISTRY", "Registrados em FORMS_REGISTRY".
- **Erros de escrita:** "Ecosistema" (Parceiros, falta um "s"), "PORTFOLIO" sem
  acento (a nav escreve "PORTFÓLIO" — a palavra aparece de dois jeitos), "MEDIA"
  (PT = "Mídia").

### 1.3 O que NÃO tocar
- A paleta / variáveis de tema. O seletor de tema do `HubHeader` (deve permanecer
  sempre acionável — regra do `CLAUDE.md`). As lógicas funcionais (a `F1-06` já as
  validou; este redesign é de superfície).

---

## 2. As 7 categorias (APROVADAS) — mapa rota → categoria

Reorganização da navegação (`src/app/admin/AdminLayoutClient.tsx`). Hoje: 3 grupos
("Operação", "Conteúdo & Vendas", "Dados & Usuários"). Proposta: **7 escopos de
negócio.**

| # | Categoria | Rotas (telas atuais) |
|---|---|---|
| 1 | **Visão Geral** | `/admin` (Painel) |
| 2 | **Comercial** | `/admin/products` (Portfólio), `/admin/partners` (Gestão de Parceiros) |
| 3 | **Marketing** | `/admin/marketing` (Cupons e Ofertas), `/admin/social` (Mídia e Editorial), `/admin/qrcodes` (QR Codes) |
| 4 | **Jornada e Agenda** | `/admin/agenda` (Sincronizar Agenda), `/admin/gestao-agenda` (Programação da Jornada) |
| 5 | **Pessoas** | `/admin/users` (Gestão de Usuários); _futuro:_ Consultores (escopo C do `BUG-112`) |
| 6 | **Instrumentos e Devolutivas** | `/admin/fs` (Formulários e Surveys), `/admin/fs/devolutiva` (Devolutiva Comportamental), + sub-rotas `fs/forms`, `fs/surveys`, `fs/*/preview/[id]` |
| 7 | **Sistema e Ferramentas** | `/admin/sandbox` (Sandbox), `/admin/migrate-welcome` (Migrar Onboarding) |

Sub-rotas sem entrada de nav própria (herdam o header/tom da sua categoria):
`products/new`, `products/[id]`, `fs/forms`, `fs/surveys`, `fs/forms/preview/[id]`,
`fs/surveys/preview/[id]`.

**Decisão registrada:** QR Codes fica em **Marketing** (serve convites/campanhas) —
a Gestora aprovou; se um dia pesar mais como utilidade, migra para Ferramentas.

---

## 3. Mapa de renomeação (rótulos + tom)

**Rótulos da navegação** (sidebar) — manter CAIXA ALTA (padrão `F0-06`), palavras em PT:

| Atual | Proposto |
|---|---|
| DASHBOARD | **PAINEL** |
| SINCRONIZAR AGENDA | SINCRONIZAR AGENDA (mantém) |
| PROGRAMAÇÃO HUB | **PROGRAMAÇÃO DA JORNADA** |
| PORTFÓLIO | PORTFÓLIO (mantém) |
| GESTÃO DE PARCEIROS | GESTÃO DE PARCEIROS (mantém) |
| CUPONS E OFERTAS | CUPONS E OFERTAS (mantém) |
| MEDIA E EDITORIAL | **MÍDIA E EDITORIAL** |
| MÁQUINA DE QR CODES | **QR CODES** |
| GESTÃO DE USUÁRIOS | GESTÃO DE USUÁRIOS (mantém) |
| F&S | **F&S** _(mantido — decisão da Gestora 2026-07-21: a abreviação ajuda a assimilar a diferença entre survey e forms; supera a proposta "FORMULÁRIOS E SURVEYS")_ |
| SANDBOX | **SANDBOX** _(mantido — decisão da Gestora 2026-07-21: mais enxuto)_ |

**Correções de copy dentro das telas** (tom, `F0-06`):
- "Control Center" (sidebar subtítulo) → PT ("Central de Controle") ou remover.
- "PORTFOLIO **Command Center**" → "PORTFÓLIO" (com acento; remover "Command Center").
- "Migração: **Welcome Survey**" → "Migração: Onboarding".
- Eyebrow de Parceiros "Ecosistema Estratégico BPlen" → "**Ecossistema** Estratégico BPlen".
- Tiles com nome de banco: "Registradas em SURVEY_REGISTRY" / "FORMS_REGISTRY" →
  rótulo humano ("Surveys ativas" / "Formulários ativos").
- Revisar o tique "*itálico colorido*": manter só onde faz sentido (o `titleAccent`
  do `FunctionalPageHeader` já dá a 2ª cor de forma padronizada).

---

## 4. As 3 camadas (escopo completo aprovado)

1. **Camada 1 — Navegação + rótulos.** Reorganiza a sidebar nas 7 categorias, aplica
   o mapa de renomeação, corrige erros ("Ecosistema", "PORTFOLIO", "MEDIA", inglês→PT).
   Só `AdminLayoutClient.tsx` + poucos rótulos. **Barato, alto ganho de clareza, baixo risco.**
2. **Camada 2 — Header canônico + tiles.** Adota o `FunctionalPageHeader` nas 19 telas
   (eyebrow/título/2ª cor/voltar/ícone/ação) e **cria um componente único de tile de
   métrica** (ex.: `src/components/admin/StatTile.tsx`) usado por dashboard/fs/agenda/
   marketing/social/products. Unifica o admin com o hub.
3. **Camada 3 — Copy/tom tela a tela.** Passada de texto contra o guia `F0-06`
   (títulos, subtítulos, botões, estados vazios, mensagens) em cada tela.

---

## 5. Plano de lotes (sugestão para o próximo chat)

Cada lote = branch + PR próprio, com deploy confirmado antes do próximo (regras da
máquina). Ordem sugerida (a camada 1 primeiro, depois camadas 2+3 juntas por categoria):

| Lote | Escopo | Telas |
|---|---|---|
| **R0** | Camada 1 — nav + rótulos + erros | `AdminLayoutClient.tsx` |
| **R1** | Visão Geral + Comercial (cam. 2+3) | `/admin`, `products` (+ `new`/`[id]`), `partners` |
| **R2** | Marketing (cam. 2+3) | `marketing`, `social`, `qrcodes` |
| **R3** | Jornada e Agenda (cam. 2+3) | `agenda`, `gestao-agenda` |
| **R4** | Pessoas + Instrumentos (cam. 2+3) | `users`, `fs` (+ `devolutiva`/`forms`/`surveys`/previews) |
| **R5** | Sistema e Ferramentas (cam. 2+3) | `sandbox`, `migrate-welcome` |

O `StatTile` compartilhado (camada 2) deve nascer no R0 ou R1 e ser reusado nos demais.

---

## 6. Padrões a reusar (não inventar)

- **Header:** `src/components/layout/FunctionalPageHeader.tsx` (já usado pelo hub;
  ver `networking/page.tsx` como exemplo de uso — eyebrow/title/titleAccent/backHref/
  icon). O admin tem sidebar própria: avaliar se usa `backHref` (talvez não precise —
  a navegação é a sidebar) e o slot `action` para o botão principal de cada tela.
- **Título:** caixa alta + tracking largo (`F0-06`).
- **Tema:** variáveis CSS + seletor do `HubHeader` — **não** remover/contornar o
  seletor (regra do `CLAUDE.md`).
- **Tile de métrica:** criar um `StatTile` único e substituir os `text-2xl/3xl/4xl`
  ad-hoc.

## 7. Restrições e validação (regras da máquina)

- Área sensível (sistema de design) — **este documento é a proposta aprovada**;
  a execução por lotes pode prosseguir, cada lote com PR próprio.
- Branch + PR (nunca commit direto de código na `main`); squash; deploy de produção
  confirmado após o merge (L31); depois `main` ff-only + deletar branch + atualizar
  `BUGS.md`/`00-PLAN.md`/`LOG.md`/`DASHBOARD.md`.
- Validar: eslint **dos arquivos tocados** vs `main` (baseline ~190 legados não é seu)
  + test + type-check + build (`rm -rf .next` antes; se OOM na fase TS, é artefato de
  builds consecutivos — `NODE_OPTIONS=--max-old-space-size=3072 npm run build` passa).
- **Validação visual é da Gestora em produção** (BUG-030 — telas logadas não
  autenticam no preview). Entregar cada lote com PROPOSTA/print quando útil.
- Zero emoji/any. Acentos PT-BR preservados.

---

## 8. Estado

| Etapa | Estado |
|---|---|
| Levantamento + diagnóstico | **Concluído (2026-07-21)** |
| 7 categorias | **Aprovadas (2026-07-21)** |
| Escopo (camadas 1+2+3, por lotes) | **Aprovado (2026-07-21)** |
| Decisões de rótulo pendentes | **Resolvidas (2026-07-21)** — F&S e Sandbox mantidos (ver seção 3) |
| Execução — **R0** (camada 1: nav + rótulos) | **Concluído — PR #138, deploy de produção confirmado (2026-07-21)** |
| Execução — **R1** (Visão Geral + Comercial, cam. 2+3) | **Concluído — PR #139, deploy de produção confirmado (2026-07-21)** |
| Execução — **R2** (Marketing, cam. 2+3) | **Concluído — PR #140, deploy de produção confirmado (2026-07-21)** |
| Execução — **R3** (Jornada e Agenda, cam. 2+3) | **Concluído — PR #141, deploy de produção confirmado (2026-07-21)** |
| Execução — **R4a** (Pessoas: `users`, cam. 2+3) | **Concluído — PR #142, deploy de produção confirmado (2026-07-21)** |
| Execução — **R4b** (Instrumentos F&S, cam. 2+3) | **Concluído — PR #143, deploy de produção confirmado (2026-07-21)** |
| Execução — **R5** (Sistema e Ferramentas, cam. 2+3) + **BUG-113** | **Concluído — PR #144, deploy de produção confirmado (2026-07-21)** |
| **REDESIGN DO ADMIN** | **COMPLETO (R0..R5) — 19 telas. Aguarda validação visual da Gestora (BUG-030)** |

**R0 entregue (PR #138):** sidebar reorganizada de 3 grupos para os 7 escopos; renomeações
aplicadas (DASHBOARD→PAINEL, PROGRAMAÇÃO HUB→PROGRAMAÇÃO DA JORNADA, MEDIA→MÍDIA E EDITORIAL com
acento, MÁQUINA DE QR CODES→QR CODES, "Control Center"→"Central de Controle"); F&S/SANDBOX mantidos
por decisão da Gestora; **MIGRAR ONBOARDING** (`/admin/migrate-welcome`) adicionada à nav (a página
existia sem entrada — sinalizada para veto na PR). Higiene: `NavGroup` extraído, 3 imports mortos
removidos. Não tocou paleta/tema.

**R1 entregue (PR #139):** camadas 2+3 em Visão Geral + Comercial. **Nasceu o `StatTile`**
(`src/components/admin/StatTile.tsx`) — tile de métrica único, reusado por dashboard e portfólio.
`FunctionalPageHeader` adotado em 5 telas (`/admin`, `products`, `products/new`, `products/[id]`,
`partners`), com os headers reimplementados removidos. Copy/tom: "PORTFOLIO Command Center"→"Portfólio",
jargão removido, ~25 acentos restaurados no `products`; "Ecosistema"→"Ecossistema" e emojis de
comentário removidos no `partners`. Achado adiado: `BUG-113` (cores hardcoded brancas em partners,
ilegíveis em tema claro — recolor focado num lote de camada 2 futuro). Convenção de título dos headers
= a do hub (Title Case; o peso vem do header, não de caixa alta — a caixa alta é só da sidebar/R0).

**R2 entregue (PR #140):** camadas 2+3 em Marketing (`marketing`, `social`, `qrcodes`).
`FunctionalPageHeader` + `StatTile` (o mesmo do R1) nas 3 telas — os `MetricCard`/cartões `text-4xl`
locais viraram `StatTile`. Copy/tom: acentos restaurados no `marketing` (~15 strings); "MEDIA E
EDITORIAL"→"Mídia e Editorial" e "MÁQUINA DE QR CODES"→"QR Codes" pelos headers; "Google Drive
corporativo" removido da descrição do qrcodes. Higiene: imports mortos removidos (os 3 arquivos de
17→4 problemas de eslint). Sem bugs novos.

**R3 entregue (PR #141):** camadas 2+3 em Jornada e Agenda (`agenda`, `gestao-agenda`).
`FunctionalPageHeader` + `StatTile` nas 2 telas — no `agenda` os botões vão no slot `action` e os 2
stat cards simples viraram `StatTile` (o card "Top 5 tipos" segue como widget próprio); no
`gestao-agenda` a nav de abas vai no slot `action`. Copy/tom: "PROGRAMAÇÃO Hub"→"Programação da
Jornada", "SINCRONIZAR AGENDA" pelo header, "Google" removido da descrição, "Dashboard"→"Painel",
acentos no modal de tipos de evento. Não tocou a lógica de sync (AGENDA-SYNC-DESIGN). **Sem
`--no-verify`** (eslint dos tocados sem erro). Sem bugs novos.

**R4 entregue em 2 PRs** (dividido para isolar a área de survey/form, que tem design global próprio):
- **R4a — Pessoas (PR #142):** `FunctionalPageHeader` no `users` (badge/botão no statusTag+action; a tela
  não tem tiles); copy "Governance Engine Active"→"Governança Ativa", "(Cleanup)"/"(Role)" removidos,
  1 emoji de comentário removido.
- **R4b — Instrumentos F&S (PR #143):** header + `StatTile` no **chrome admin** de `fs`, `fs/forms`,
  `fs/surveys` (server components) e `fs/devolutiva` (header só). **Nomes de banco na tela humanizados**
  ("FORMS_REGISTRY"/"SURVEY_REGISTRY"/"CollectionGroup" → rótulos humanos). **Design próprio das
  surveys/forms NÃO tocado** (a pedido da Gestora): nos previews (`SurveyEngine`/`FormsEngine`) a pegada
  foi mínima — só 1 emoji e o nome-de-banco no erro; engines e frame de preview intactos.

**R5 entregue + BUG-113 (PR #144) — REDESIGN COMPLETO:** último lote (Sistema e Ferramentas).
`sandbox` (header + copy "Member/Onboarding Tour"→PT + recolor do badge) e `migrate-welcome`
(convertido do layout centralizado ao padrão de conteúdo com header; "Migração: Welcome Survey"→
"Migrar Onboarding"; nomes de banco removidos; recolor). **BUG-113 corrigido junto**: cores brancas
hardcoded em `partners` → vars de tema (cards ilegíveis em tema claro resolvidos; scrims preservados).
Com isto **as 19 telas usam o `FunctionalPageHeader` + `StatTile`**, inglês/nomes-de-banco limpos, e o
design próprio das surveys/forms preservado. Débitos separados remanescentes: modal cru de `partners`
(não-`GlassModal`); loading screens de admin não padronizadas no `AtmosphericLoading` (fora do escopo
do redesign de superfície).

---

## 9. Fila de ajustes pós-validação (feedback da Gestora, 2026-07-22)

A Gestora validou o checklist R0..R5 inteiro (tudo aprovado) e pediu 9 ajustes/dúvidas:

| # | Item | Status |
|---|---|---|
| 1 | Título da sidebar só "Admin" (sem "Central de Controle") | **Feito (PR #148)** — no #8 |
| 2 | Alinhar o título "Admin" à esquerda | **Feito (PR #148)** — no #8 |
| 3 | "Migrar Onboarding": o que é / removível? | **Feito (PR #146)** — removido do projeto (migração one-shot legada, sem serventia; não afeta dados) |
| 4 | Desmembrar `fs/devolutiva` → rota própria + renomear (jornada do cliente) | **Feito (PR #146)** — `/admin/jornada-cliente` ("Jornada do Cliente"), em Pessoas; cresce depois p/ contratos, serviços, atalho de usuário, jornada inteira |
| 5 | 2 cards reais na `/social`: nota média das avaliações de conteúdo + total de sugestões de tema | **Feito (PR #147)** — action `getSocialFeedbackStats` (agrega `content_evaluation_*` rating 1-5 + forms `theme_suggestion`); 2 StatTiles novos |
| 6 | Modal de tipos de evento (`/agenda`) muito estreito | **Feito (PR #145)** — `maxWidth="max-w-2xl"` |
| 7 | Cards de eventos sincronizados (`/agenda`) muito largos → lista compacta | **Feito (PR #145)** — lista estilo tabela |
| 8 | Sidebar recolhível/expansível (flyout no hover, tooltip, toggle, logo quadrado/completo) | **Feito (PR #148)** — toggle persistido, rail de ícones, flyout `fixed` no hover, tooltip nativo, ativo por rota |
| 9 | Densidade geral do admin (cartões/botões/cards menores, menos scroll) | **Feito — passo 1 (PR #149)** — `StatTile` horizontal compacto (global, ~9 telas) + shell mais enxuto (#8). Densidade fina por tela (cards de prévia, botões) = varredura sob demanda |

**Todos os 9 itens resolvidos.** Validação visual das telas logadas é da Gestora em produção (BUG-030) —
com atenção especial à área superior esquerda da sidebar (logo flutuante + "Admin" + toggle) e ao
flyout da barra recolhida, que não puderam ser pré-visualizados. Débitos remanescentes conhecidos:
modal cru de `partners` (não-`GlassModal`); loadings de admin fora do `AtmosphericLoading`; densidade
fina por tela; otimização das leituras full-scan do `getSocialFeedbackStats` (T-01).
