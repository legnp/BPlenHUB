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
