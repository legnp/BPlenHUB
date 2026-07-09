# F1-01 — Ajustes das páginas públicas (anotações da Gestora, 2026-07-08)

Cluster de 19 ajustes reportados pela Gestora para as páginas públicas de marketing.
**Todos pertencem à F1-01** — a única fatia da Fase 1 validável ponta-a-ponta no
preview (público, sem login). Fechar este cluster **completa a F1-01**, sem competir
com as fases logadas (F1-03/04/05/06), que dependem de sessão em produção (BUG-030).

Fonte de verdade do status: esta tabela. Os itens que são **defeitos** (não só copy)
também têm entrada própria em `BUGS.md`.

## Categorias
- **C** — Copy pura (texto visível). CLAUDE.md permite direto.
- **L** — Layout/CSS pontual em página pública. Direto + verificação ao vivo.
- **G** — Footer/Header **global** (compartilhado com área logada). A Gestora autorizou
  explicitamente o ajuste global dos logos (#1, #5). Verificar público ao vivo + confirmar
  aparência logada na sessão de produção.
- **D** — Design/comportamento (normalização de padrão ou defeito). Lente de design +
  verificação ao vivo; os defeitos reais estão em `BUGS.md`.

## Componentes localizados
- Footer: `src/components/layout/GlobalFooter.tsx`
- Header de páginas legais: `src/app/termos/page.tsx`, `src/app/privacidade/page.tsx`
- Seletor de jornada: `src/components/layout/ServiceSelectionModal.tsx` (exceção pública aceita no F0-01)
- Serviços por público: `src/app/servicos/[audience]/page.tsx`
- FAQ: `src/components/products/FAQContactModal.tsx`
- Nav pública: `src/components/layout/FloatingCTAs.tsx`
- Agendar público: `src/app/agendar/page.tsx` + `src/components/ui/PublicBookingFlow.tsx`
- Conteúdo/feedback: `src/components/hub/FeedbackSection.tsx`, `ContentEvaluationModal.tsx`,
  `ThemeSuggestionModal.tsx` (+ config em `src/config/surveys/content-evaluation.ts`,
  `src/config/forms/theme-suggestion.ts`)

## Tabela de ajustes

| # | Cat | O que | Onde | Status |
|---|---|---|---|---|
| 1 | G | Logo do footer +50% **sem alterar a altura** do footer | `GlobalFooter.tsx` | ✓ PR-B |
| 2 | C | "Sua **plataforma** de gestão..." → "Sua **parceira** de gestão..." | `GlobalFooter.tsx` (confirmar) | ✓ PR-A |
| 3 | G | Link "Área de Membro" → `/hub/membro` | `GlobalFooter.tsx` | ✓ PR-B |
| 4 | G | Remover link "Governança" (não aponta p/ lugar nenhum) | `GlobalFooter.tsx` | ✓ PR-B |
| 5 | G | Logo do header +50% **sem alterar a altura**, em `/termos`, `/privacidade` e páginas de mesmo padrão | header legal | ✓ PR-B |
| 6 | C | "Explorar soluções" → "Conhecer serviços" (seletor de jornada) | `ServiceSelectionModal.tsx` | ✓ PR-A |
| 7 | C | `/servicos/empresas`: "Explore nossas soluções..." → "Conheça nossos serviços desenhados especificamente para empresas." | `servicos/[audience]/page.tsx:41` | ✓ PR-A |
| 8 | L | `/servicos/empresas`: justificar o texto do card "proposta de valor em desenvolvimento" | `servicos/[audience]/page.tsx` | ✓ PR-C |
| 9 | C | `/servicos/empresas`: "Explorar as soluções dos Nossos Parceiros" → "Conhecer os Nossos Parceiros" | `servicos/[audience]/page.tsx:146` | ✓ PR-A |
| 10 | C | `/servicos/parceiros`: novo texto (ortografia PT corrigida: "transformar", "conjunto") | `servicos/[audience]/page.tsx:48` | ✓ PR-A |
| 11 | L/D | `/agendar`: normalizar header/título conforme `/servicos` + **card de agendamento em 1 página sem scroll** | `agendar/page.tsx` + `PublicBookingFlow.tsx` | ✓ PR-C2 (#45) + **refino #46** |
| 12 | C | "Calculando Slots..." → "Buscando horários" (+ mesmos textos em outros componentes de agendamento, se houver) | `PublicBookingFlow.tsx:744` (+ hub) | ✓ PR-A |
| 13 | D | `/conteudo`: normalizar header/título conforme `/servicos` (preservar text-center + frases dinâmicas; **sem ícone** antes do título; só igualar tamanho/tipo de fonte; não mexer na cor) | página `/conteudo` | ✓ PR-C |
| 14 | D-bug | Nav pública: "Nossos serviços" fica com efeito de "selecionado" em páginas que não são a dele — o realce deve ficar só na página ativa | `FloatingCTAs.tsx` (**BUG-048**) | ✓ PR-C |
| 15 | C | `/conteudo`: "...evoluindo nosso ecossistema de conteúdo..." → "...melhorando a qualidade de nosso conteúdo..." | `FeedbackSection.tsx:36` | ✓ PR-A |
| 16 | C | Modal avaliar conteúdo: "moldar o editorial" → "melhorar o editorial"; "© BPlen Feedback Cycle" → "© BPlen Feedback Practice"; botão → "Registrar" | `ContentEvaluationModal.tsx` + `content-evaluation.ts` | ✓ PR-A |
| 17 | C | Modal sugerir temas: "Qual próximo **passo**..." → "Qual próximo **tema**..."; "© BPlen Lab Ideation" → "© BPlen co-creation" | `ThemeSuggestionModal.tsx` + `theme-suggestion.ts` | ✓ PR-A |
| 18 | D-bug | `/conteudo`: footer está com design de home (tema escuro) numa página pública clara — adaptar o footer ao tema claro | `GlobalFooter.tsx` / `/conteudo` (**BUG-049**) | ✓ PR-C |
| 19 | D-bug | FAQ "Envie sua pergunta a BPlen": modal translúcido com overlay branco estranho; deveria ter overlay preto (padrão) | `FAQContactModal.tsx` (**BUG-050**) | ✓ PR-C + **reaberto/resolvido de fato no PR #47** (causa-raiz era o painel, não o backdrop — ver item 20) |
| 20 | D | **Regra global:** overlay/cor dos modais adapta ao tema da tela que os chama (dark->dark, claro->claro; `/hub` `/admin` seguem o tema do usuário) | `GlassModal.tsx` + `globals.css` + `ServiceSelectionModal.tsx` + `FAQContactModal.tsx` | ✓ **PR #47** |

## Sequenciamento recomendado (ver LOG da sessão)
Fechar como **passada de acabamento da F1-01, agora** (independe das fases logadas):
- **PR-A — Copy pública** (2,6,7,9,10,12,15,16,17): ✓ **MERGEADA (PR #42)** — verificada ao vivo (SSR + snapshot) e por grep.
- **PR-B — Footer & header globais** (1,3,4,5): ✓ **MERGEADA (PR #43)** — logos +50% via scale/size sem alterar altura (medido ao vivo: footer logo caixa 28px→render 42px; header h-16 fixo, logo 26→39); Governança removido; "Área de Membro" roteia p/ `/hub/membro`. Aparência logada (footer) na sessão de produção.
- **PR-C** (8,13,14,18,19): ✓ MERGEADA (PR #44) — justify, header /conteudo normalizado (cor preservada), nav realce por rota (BUG-048), footer /conteudo claro (BUG-049), backdrop do GlassModal configurável + FAQ escuro (BUG-050).
- **PR-C2 — /agendar** (item 11): ✓ **MERGEADA (PR #45)** — `PublicBookingFlow` ganhou `variant="page"` (home intocada); header normalizado (kicker + tokens /servicos); card com `max-h-[calc(100svh-220px)]` + scroll interno → cabe no viewport nos 3 dispositivos (medido: mobile bottom 804/812, desktop 930/964, tablet 977/1024).
- **Refino do item 11 — /agendar** (reaberto pela Gestora 2026-07-09): ✓ **MERGEADA (PR #46)** — 3 ajustes espelhando `/servicos`: (a) **caixa de ícone** (`CalendarIcon`) antes do título, idêntica às páginas de produto; (b) header **alinhado ao topo** (`pt-12`) no lugar da centralização vertical (`min-h-[100svh] justify-center`) — ícone inicia em `top:48px`, mesma altura do título das páginas de produto (medido ao vivo); (c) **removida a barra de rolagem própria do card** (`max-h`+`overflow-y-auto custom-scrollbar` — a classe nem está definida no CSS, caía na barra padrão feia do browser). Card cresce conforme o conteúdo; lista de horários mantém sub-scroll interno; conteúdo cabe sem clipping (desktop 1280 + mobile 375 medidos). Trade-off aceito pela Gestora: desktop cabe em 1 viewport; mobile a **página** rola para revelar o card, mas o card não tem barra própria. Validado: eslint (0 erros), test 52/52, tsc, build. **Aprovado no preview pela Gestora.**
- **PR #47 — Regra global de tema dos modais** (itens 19 + 20, reabertos/expandidos pela Gestora 2026-07-09): ✓ **MERGEADA**. Causa-raiz do item 19: o `GlassModal` portaliza para `document.body` e escapa do `theme-dark` (que fica no `<main>` das páginas públicas) → vars caíam no `:root` claro → painel branco no fundo preto (o backdrop já era escuro desde o PR-C). Correção: `GlassModal` **detecta o tema da tela** (âncora invisível no lugar, subindo a árvore e parando antes do `body` para ignorar o tema stale do usuário salvo pelo `ThemeContext`) e reaplica a classe ao portal; sem ancestral temático (`/conteudo`) → `:root` claro. Nova var `--modal-backdrop` (claro no `:root`, escuro em `theme-dark`/`daltonico`). `ServiceSelectionModal` (não-portalizado) convertido de cores dark hardcoded para vars → adapta dark/claro por página. `FAQContactModal` perde o override de backdrop (usa o default ciente do tema). Vale para **todos** os modais via `GlassModal` (público + hub + admin). Validado ao vivo: ServiceSelection dark em `/`, claro em `/conteudo`; FAQ aplica `theme-dark` ao portal, painel dark. Aprovado no preview pela Gestora. Telas logadas (hub/admin) a conferir em produção (BUG-030) — preservadas por construção.
- **F1-01: 19/19 ajustes aplicados — cluster COMPLETO** (+ refino do item 11 no PR #46 e regra global de modais no PR #47, reaberturas da Gestora).

Notas de cuidado: #11 (caber em 1 página) e #13 (normalizar header) são layout — verificar
em mobile/tablet/desktop; #19 (overlay do FAQ) deve convergir para o backdrop padrão
(diferente da exceção aceita do `ServiceSelectionModal`); #12 e os modais de conteúdo
(#16/#17) também aparecem/são usados em contexto logado — a mudança de código é feita
agora, a conferência visual logada fica para a sessão de produção.
