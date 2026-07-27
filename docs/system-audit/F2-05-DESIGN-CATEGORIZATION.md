# F2-05 — Categorização formal das páginas logadas nos 4 conceitos de design

Formaliza o item `F2-05` do `00-PLAN.md`. Os 4 conceitos foram definidos pela
Gestora (2026-07-10); este doc **categoriza todas as rotas logadas** (hub + admin,
escopo confirmado pela Gestora em 2026-07-24) e registra o **padrão canônico por
conceito** com páginas de referência. Inventário por leitura de código, 2026-07-24.

---

## 1. Os 4 conceitos e seu padrão canônico

| Conceito | Definição | Padrão de design | Página de referência |
|---|---|---|---|
| **a) Fullscreen** | Só interação — nada além dos textos/interações na tela. | Superfície cheia (`min-h-screen`), sem header canônico nem nav. | preview de survey/form; tourguide; `welcome_survey`. |
| **b) BPlen Journey** | Entrega dos serviços da jornada, com checkpoints (paradas) e o nav da jornada sempre presente. | `SubStepRail` + `StepRenderer` (motor de paradas) / `ServiceDeliveryView`; nav da jornada presente. | `hub/journey/[stepId]`. |
| **c) Gestão Funcional** | Telas de gestão/consulta (dashboards, listas, configurações, checkout). | `FunctionalPageHeader` (eyebrow + título + backHref + status-tag), corpo funcional. | `gestao_carreira`; header canônico em `src/components/layout/FunctionalPageHeader.tsx`. |
| **d) Autênticas** | Características próprias — landing com identidade única. | Sem header canônico; layout próprio. | `hub/page.tsx` (`/hub`); `hub/membro` (dashboard). |

---

## 2. Categorização — HUB (`/hub`)

**c) Gestão Funcional (8 — todas com `FunctionalPageHeader`):**
`checkout/[slug]`, `checkout/success` (header no `CheckoutContractSigning`),
`membro/contratos`, `membro/gestao_agenda`, `membro/gestao_carreira`, `networking`,
`profile_settings`, `visao_geral`.

**b) BPlen Journey (3):** `journey/[stepId]` (`SubStepRail`+`StepRenderer`),
`servicos/[slug]` (`ServiceDeliveryView` — entrega de serviço), `journey/page.tsx`
(índice → redireciona à parada ativa).

**d) Autênticas (2):** `hub/page.tsx` (`/hub`), `hub/membro/page.tsx`
(`MemberDashboardView`).

**a) Fullscreen:** nível de componente (tourguide overlay, `welcome_survey`) — sem rota
`page.tsx` própria.

**Redirects legados (sem categorização — renderizam nada):** `membro/journey/page.tsx`
e `membro/journey/[stepId]` → `journey/*`; `membro/checkout/[slug]` e
`membro/checkout/success` → `checkout/*`.

## 3. Categorização — ADMIN (`/admin`)

O `/admin` recebeu redesenho próprio (`ADMIN-REDESIGN-DESIGN.md`, R0–R5) e **cabe nos 4
conceitos — não exigiu um 5º**:

**c) Gestão Funcional (16 — todas com `FunctionalPageHeader`):** `admin/page` (dashboard),
`agenda`, `fs`, `fs/forms`, `fs/surveys`, `gestao-agenda`, `jornada-cliente`, `marketing`,
`partners`, `products`, `products/[id]`, `products/new`, `qrcodes`, `sandbox`, `social`,
`users`.

**a) Fullscreen (2):** `fs/forms/preview/[id]`, `fs/surveys/preview/[id]` (preview do
instrumento em tela cheia, só interação — corretamente sem header canônico).

> O admin é, por natureza, **Gestão Funcional** (gestão/consulta), com as 2 previews como
> Fullscreen. Nenhuma tela admin ficou fora dos 4 conceitos.

## 4. Verificação de conformância (2026-07-24)

- **Header:** conforme. Todas as GF do hub e as 16 GF do admin usam `FunctionalPageHeader`;
  as exceções (previews) são Fullscreen, corretamente sem header.
- **Loading (regra 8 — `AtmosphericLoading`/"Carregando {página}", sem variações):**
  3 telas usavam palavras proibidas — **corrigidas no PR #161** (`eb46ef7`):
  `ContentEvaluationModal` ("Sincronizando…" → "Carregando conteúdo"), `admin/users`
  ("Mapeando…" → "Carregando pesquisas"), `admin/products` ("Processando Arquivos" →
  "Carregando arquivos"). Aguarda validação visual da Gestora em produção (BUG-030).
- **Fora de escopo (decisão da Gestora, 2026-07-24 — só as violações claras):**
  - Spinners inline de botão ("Salvando…", "Processando…" no botão *Simular*) — **não** são
    tela de carregamento; ficam como estão.
  - Loads de **seção** com `Loader2` custom (`networking` grid + várias telas admin) — são
    loads de seção, não de página inteira; forçar `AtmosphericLoading` seria inadequado
    (Lição 12). Mantidos.
  - `...` residual em rótulos de `AtmosphericLoading` (journey/gestao_carreira/visao_geral) —
    micro-nit (componente e palavra corretos); mantido.

## 5. Estado

**F2-05 concluído.** Categorização formal de todas as rotas logadas (hub + admin) nos 4
conceitos, com padrão canônico + página de referência por conceito, e verificação de
conformância (header OK; 3 violações de loading corrigidas no PR #161). O admin coube nos
4 conceitos — nenhum 5º conceito foi necessário. Pendência: validação visual da Gestora em
produção das 3 mudanças de copy de loading (BUG-030). Sem outros ajustes de código
pendentes — as demais telas já conformam ao padrão do seu conceito.
