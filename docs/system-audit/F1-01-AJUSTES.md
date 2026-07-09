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
| 1 | G | Logo do footer +50% **sem alterar a altura** do footer | `GlobalFooter.tsx` | ○ |
| 2 | C | "Sua **plataforma** de gestão..." → "Sua **parceira** de gestão..." | `GlobalFooter.tsx` (confirmar) | ○ |
| 3 | G | Link "Área de Membro" → `/hub/membro` | `GlobalFooter.tsx` | ○ |
| 4 | G | Remover link "Governança" (não aponta p/ lugar nenhum) | `GlobalFooter.tsx` | ○ |
| 5 | G | Logo do header +50% **sem alterar a altura**, em `/termos`, `/privacidade` e páginas de mesmo padrão | header legal | ○ |
| 6 | C | "Explorar soluções" → "Conhecer serviços" (seletor de jornada) | `ServiceSelectionModal.tsx` | ○ |
| 7 | C | `/servicos/empresas`: "Explore nossas soluções..." → "Conheça nossos serviços desenhados especificamente para empresas." | `servicos/[audience]/page.tsx:41` | ○ |
| 8 | L | `/servicos/empresas`: justificar o texto do card "proposta de valor em desenvolvimento" | `servicos/[audience]/page.tsx` | ○ |
| 9 | C | `/servicos/empresas`: "Explorar as soluções dos Nossos Parceiros" → "Conhecer os Nossos Parceiros" | `servicos/[audience]/page.tsx:146` | ○ |
| 10 | C | `/servicos/parceiros`: novo texto (ortografia PT corrigida: "transformar", "conjunto") | `servicos/[audience]/page.tsx:48` | ○ |
| 11 | L/D | `/agendar`: normalizar header/título conforme `/servicos` + **card de agendamento em 1 página sem scroll** | `agendar/page.tsx` | ○ |
| 12 | C | "Calculando Slots..." → "Buscando horários" (+ mesmos textos em outros componentes de agendamento, se houver) | `PublicBookingFlow.tsx:744` (+ hub) | ○ |
| 13 | D | `/conteudo`: normalizar header/título conforme `/servicos` (preservar text-center + frases dinâmicas; **sem ícone** antes do título; só igualar tamanho/tipo de fonte; não mexer na cor) | página `/conteudo` | ○ |
| 14 | D-bug | Nav pública: "Nossos serviços" fica com efeito de "selecionado" em páginas que não são a dele — o realce deve ficar só na página ativa | `FloatingCTAs.tsx` (**BUG-048**) | ○ |
| 15 | C | `/conteudo`: "...evoluindo nosso ecossistema de conteúdo..." → "...melhorando a qualidade de nosso conteúdo..." | `FeedbackSection.tsx:36` | ○ |
| 16 | C | Modal avaliar conteúdo: "moldar o editorial" → "melhorar o editorial"; "© BPlen Feedback Cycle" → "© BPlen Feedback Practice"; botão → "Registrar" | `ContentEvaluationModal.tsx` + `content-evaluation.ts` | ○ |
| 17 | C | Modal sugerir temas: "Qual próximo **passo**..." → "Qual próximo **tema**..."; "© BPlen Lab Ideation" → "© BPlen co-creation" | `ThemeSuggestionModal.tsx` + `theme-suggestion.ts` | ○ |
| 18 | D-bug | `/conteudo`: footer está com design de home (tema escuro) numa página pública clara — adaptar o footer ao tema claro | `GlobalFooter.tsx` / `/conteudo` (**BUG-049**) | ○ |
| 19 | D-bug | FAQ "Envie sua pergunta a BPlen": modal translúcido com overlay branco estranho; deveria ter overlay preto (padrão) | `FAQContactModal.tsx` (**BUG-050**) | ○ |

## Sequenciamento recomendado (ver LOG da sessão)
Fechar como **passada de acabamento da F1-01, agora** (independe das fases logadas):
- **PR-A — Copy pública** (2,6,7,9,10,12,15,16,17): risco ~zero, verificação ao vivo.
- **PR-B — Footer & header globais** (1,3,4,5): global autorizado; público ao vivo + hub na sessão de produção.
- **PR-C — Conformidade de design pública** (8,11,13,14,18,19): lente de design + ao vivo; inclui os 3 defeitos (BUG-048/049/050).

Notas de cuidado: #11 (caber em 1 página) e #13 (normalizar header) são layout — verificar
em mobile/tablet/desktop; #19 (overlay do FAQ) deve convergir para o backdrop padrão
(diferente da exceção aceita do `ServiceSelectionModal`); #12 e os modais de conteúdo
(#16/#17) também aparecem/são usados em contexto logado — a mudança de código é feita
agora, a conferência visual logada fica para a sessão de produção.
