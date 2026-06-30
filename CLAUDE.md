# BPlen HUB — Diretrizes do Projeto

## Stack
Next.js 16 (App Router) + React 19 + TypeScript strict + Firebase (client/admin) +
Mercado Pago + Google Workspace (Drive/Sheets) + Resend + Zustand + Tailwind v4.

## Regras inegociáveis
1. **Zero Any**: proibido `any` explícito. Use `unknown` + type guards. A regra é
   enforced via ESLint (`@typescript-eslint/no-explicit-any: error`) e (a partir da
   implantação do CI) bloqueada no pipeline.
2. **Zero Emoji**: nunca usar emoji em código, comentários, logs, console.error,
   throw new Error, commits, e-mails ou strings de interface.
3. **Combate ao hardcoded**: priorizar Firestore/config/env sobre strings fixas.
   Código legado hardcoded existente é preservado por segurança — alterar só com
   avaliação de impacto explícita.
4. **Dados sensíveis**: residem em subcoleções privadas `User/{matricula}/...`,
   nunca em coleções raiz soltas. Nunca commitar `.env*`, `*.pem`, ou credenciais
   de service account — ver `.gitignore`.
5. **Build limpo obrigatório antes de considerar algo pronto**: `npm run check`
   (lint + test + type-check + build) precisa passar.

## Estrutura de pastas
- `src/components/ui/` — componentes atômicos puros
- `src/components/layout/` — estrutura global (grid, navegação)
- `src/components/forms/` — lógica de formulários/surveys
- `src/hooks/` — lógica de negócio fora das páginas
- `src/types/` — schemas Zod e interfaces
- `src/lib/` — clientes de SDK (Firebase, Google, Resend)
- `src/app/` — páginas como orquestradoras; evitar lógica de negócio pesada aqui
- `scripts/` — scripts reutilizáveis e nomeados de forma estável (não descartáveis)
- `scratch/` — investigação ad-hoc, descartável, ignorado pelo git

## Identidade e segurança
- Matrícula BPlen (`BP-xxx-PF-AAMMDD`) é a chave primária de usuário.
- Resolução de identidade: AuthMap → UID → Email (auto-healing).
- Sessão via Firebase Session Cookie assinado (`createSessionCookie`), nunca UID
  em plaintext.
- E-mail do "Master" (dono da conta) nunca aparece na interface — usar aliases.

## Sistema de design
- Existem dois universos visuais: área pública e área logada (hub). Dentro de cada
  um, modais, cores, fontes, tamanhos e títulos devem seguir um padrão único —
  não introduzir variações novas ad-hoc.
- A área logada tem um flow de alternância de temas que deve permanecer sempre
  acionável; nenhuma mudança pode remover ou contornar esse mecanismo.
- Há código legado que já viola esse padrão (parte por exceção aprovada
  pontualmente, parte por desvio não autorizado). Não usar esse código legado
  como referência para decidir o padrão correto — em caso de dúvida, perguntar.

## Antes de mudanças não-triviais
Apresentar um plano (arquivos afetados, abordagem, riscos) e aguardar aprovação
explícita antes de implementar, sempre que a mudança tocar em:
- Fluxos financeiros (checkout, cupons, cotas) ou de identidade/sessão.
- `firestore.rules` ou regras de gating de jornada.
- Arquivos de infraestrutura compartilhada: `src/lib/firebase-admin.ts`,
  `src/lib/firebase.ts`, `src/env.ts`, `src/middleware.ts`, root `layout.tsx`,
  `AuthProvider`.
- Documentos de governança (este arquivo, `GOVERNANCE.md`, `.agents/AGENTS.md`).
- God files muito importados: `calendar.ts`, `survey-effects.ts`,
  `SurveyEngine.tsx`.
- `next.config.ts`, CI/workflows, `.gitignore`.
- Sistema de design: qualquer mudança que introduza ou altere um padrão visual
  (cor, componente de modal, tipografia, lógica de tema). Reaproveitar um padrão
  já existente do jeito que já é usado em outra página não precisa de aprovação.

Para ajustes pequenos e localizados (copy de texto puro sem afetar layout,
bugfix isolado a um único arquivo, scripts em `scratch/`) pode prosseguir direto.

## Classificação de coleta de dados
Toda nova demanda de coleta de dados (survey/form) deve ser classificada conforme
`SURVEY_GLOBAL.md` / `FORMS_GLOBAL.md` antes da implementação.

## Migração de governança
Este arquivo consolida e substitui o conteúdo anterior de `.agent/rules/*`
(Antigravity). Ver histórico do git para o conteúdo original.
