# Painel de Progresso — Auditoria BPlen (Fase 0 + Fase 1 + Tracks associados)

> **Visão de uma olhada** do progresso. **Fonte de verdade:** `BUGS.md` (status de
> cada bug) + `00-PLAN.md` (itens de fase e tracks, incluindo a seção "Estado da
> auditoria e próximos itens de execução"). Este arquivo apenas **agrega** — se
> divergir da fonte, a fonte vence.
>
> **Manutenção:** atualizado **manualmente a cada PR mergeada** (mesmo checkpoint
> da entrada no `LOG.md`). Bugs novos que aparecerem entram no track certo e a
> contagem se recalcula aqui.
>
> **"Resolvido" = mergeado na `main` OU formalmente aceito como risco/adiado**
> (critério de fechamento de Track definido em `00-PLAN.md`). Correções em PR
> aberta ou bugs simplesmente "Aberto"/"Em Progresso" não contam na %. **Um bug
> `Corrigido` conta sempre como unidade inteira, nunca fração** (Lição 13 do
> `RETROSPECTIVE.md`).
>
> **Nota desta reconciliação (2026-07-22):** o histórico narrativo deste arquivo
> tinha crescido para ~540 linhas de "Última atualização" empilhadas desde
> 2026-07-04, sem que as tabelas agregadas abaixo fossem atualizadas — elas
> mostravam T-02 em "12/12", T-03 em "3/4" e a Fase 1 com F1-04/05 "código
> completo, pendente validação" e F1-06 "não iniciada", todas defasadas (a Fase
> 1 inteira já foi validada em produção e o admin recebeu um redesign completo
> desde então). **Histórico trimado para as entradas mais recentes** — o
> registro permanente e completo de toda sessão está em `LOG.md`, que nunca foi
> editado e continua a fonte primária de história.
>
> **Última atualização:** 2026-07-22 (chat de planejamento — **reconciliação
> geral completa**, primeira desde 2026-07-07. Corrigidos: 26 bugs ausentes do
> índice bug→track do `00-PLAN.md`; 7 status defasados (`BUG-010/040/041/042/
> 052/053/055`, todos já `Corrigido` há dias/semanas mas ainda "Aberto" nos
> agregadores); **T-02 recalculado de "12/12" para 17/17** (reflete a reabertura/
> refechamento de 2026-07-19/20 via `BUG-102/103/106/107/108`); **T-03
> recalculado de "3/4" para 6/7** (faltavam `BUG-040/041/042`, corrigidos desde
> 2026-07-08 mas nunca linkados); Triagem por severidade atualizada — `BUG-110`
> (Alto) nunca tinha entrado na fila. Tabela da Fase 1 reescrita para refletir
> que **F1-01 a F1-06 estão todas validadas em produção**, incluindo o redesign
> completo do admin (R0–R5) + feedback pós-validação (9/9). Adicionadas seções
> novas: Redesign do Admin e EXP-01. Nenhuma mudança de código.
>
> _(entrada anterior)_ 2026-07-22 (chat de execução — **Feedback do admin: 9/9
> itens concluídos**. PRs #145–#149: agenda (modal + lista compacta), "Jornada do
> Cliente" (rename + rota própria) + remoção do "Migrar Onboarding", 2 cards reais
> em `/social` (PR #147), sidebar recolhível/expansível + título "Admin" alinhado
> (PR #148), `StatTile` horizontal compacto + shell enxuto (PR #149). Todos deploy
> `success`, suíte 280/280. Pendente só validação visual da Gestora (BUG-030),
> atenção à área topo-esquerda da sidebar e ao flyout. Débitos: densidade fina por
> tela, full-scan do `getSocialFeedbackStats` (T-01), modal cru de `partners`).
>
> _(entrada anterior)_ 2026-07-21 (chat de execução — **REDESIGN DO ADMIN R0–R5 +
> BUG-113 — COMPLETO** (PRs #138–#144), todos deploy de produção confirmado. As 19
> telas usam `FunctionalPageHeader` + `StatTile`; sidebar reorganizada em 7
> escopos; inglês/nomes de banco limpos; design próprio de surveys/forms
> preservado. `BUG-113` (cores brancas hardcoded em `partners`) corrigido junto.
> Ver `ADMIN-REDESIGN-DESIGN.md` para o detalhe completo dos 6 lotes).
>
> _(entrada anterior)_ 2026-07-20 (chat de execução — **T-02 RE-FECHADO** (PR
> #135, `BUG-108` — último bloqueador). Track reaberto em 2026-07-19 pela
> varredura sistemática do `BUG-103` (57 actions sem guard, incluindo
> `post-event.ts` que escapara dos 7 lotes originais do `BUG-020`); achou o
> `BUG-106` (Crítico — sequestro de conta por e-mail digitado, mesmo padrão do
> `BUG-032`, contido em <24h) e o `BUG-107`. 5 lotes, PRs #122–#129, invariante
> executável `server-action-surface.test.ts` instituída).
>
> Ver `LOG.md` para o histórico completo e cronológico de todas as sessões
> (execução e planejamento) desde o início do processo em 2026-07-02.

---

## Fase 0 — Padrões canônicos

**Decisões: 6/6 (100%).** Implementação pendente: **F0-01** — parte GlassModal
concluída (lotes 1/A/B); resta o 2º base p/ modais grandes (BUG-034, futuro).

| Item | Tema | Status |
|---|---|---|
| F0-01 | Modal canônico | Decidido · parte GlassModal concluída (lotes 1/A/B, PRs #15/#20/#21). Todos os modais-card convergidos; exceções aceitas (`ServiceSelection` público, `ContractGate` crítico); resta o 2º base p/ modais grandes app-shell (**BUG-034**, futuro) |
| F0-02 | Timestamp | ✓ Decidido (padrão pronto) |
| F0-03 | Identidade | ✓ Decidido (padrão + convergência gradual) |
| F0-04 | Coleções órfãs | ✓ Concluída — `entitlements` removida (PR #1) + `User_JourneyMap` consolidado no v3 (PRs #22/#23/#24/#25) |
| F0-05 | Guard admin server-side | ✓ Mergeado (PR #1) |
| F0-06 | Tom de voz / copy | ✓ Ratificado (+ data legal em config, PR #1) |

---

## Tracks de execução associados

Progresso = bugs mergeados na `main` (ou formalmente aceitos) sobre o total do track vinculado.

### T-02 — Segurança sistemática · **17 / 17 (100%)** ✅ FECHADO (2ª vez)  `██████████`

- **Fechado 1ª vez em 2026-07-04, 12/12:** `BUG-003/004/005/006/007/019/020/021/023/024/025/032`
  (`BUG-020` em 7 lotes, PRs #8–#14; `BUG-032` Crítico achado no lote 7).
- **Reaberto em 2026-07-19** (`BUG-103`): varredura por arquivo achou 57 das 177 server actions
  expostas sem guard — inclusive `post-event.ts`, que estava listado no próprio `BUG-020` mas
  escapara dos 7 lotes.
- **Corrigido em 5 lotes (PRs #122–#129):** **1** cotas, **2a** PII, **2b** identidade/anônimos
  (achou `BUG-106` **Crítico** — sequestro de conta por e-mail digitado, mesmo padrão do `BUG-032`,
  contido em <24h — e `BUG-107`), **3** pós-evento (`BUG-102`), **5** efeitos fora da rede + a
  invariante executável `server-action-surface.test.ts` (achou `BUG-108`, **último bloqueador**,
  PR #135).
- ✅ **Re-fechado em 2026-07-20: 17/17, conferido por PADRÃO (não bug a bug).** Nenhum bug de
  segurança aberto.

### T-06 — Compliance técnico · **2 / 2 (100%)** ✅ FECHADO  `██████████`

- ✓ Mergeados: BUG-023 (rotas debug removidas, PR #3), BUG-001 (`Support_Tickets` PII em
  subcoleção privada, PR #70 — rules publicadas + coleção raiz apagada pela Gestora, 2026-07-11)

### T-03 — Integridade de dados · **6 / 7 (~86%)**  `████████░░`

- ✓ BUG-018 — consolidação de jornada completa (`User_Journey` v3 mantido, `User_JourneyMap`
  legado removido de todos os clientes, PRs #22/#23/#24/#25).
- ✓ BUG-010 (PR #69) — `adminAddAttendeeAction` morta removida.
- ✓ BUG-008 (PR #71) — chave de cota `1-to-1` unificada em minúsculo canônico.
- ✓ BUG-040/041/042 (Trilha 3, scripts locais, 2026-07-08) — ~50 coleções de backup removidas,
  14 produtos legados excluídos, chaves de entitlement de 4 clientes normalizadas.
- ○ Aberto: BUG-009 (`UserBooking.timestamp` provavelmente sempre nulo — **[HIPÓTESE]**, a
  confirmar em produção).

### Outros tracks (ainda não iniciados)

- **T-01** Performance/concorrência — BUG-017 (full scan em `admin-fs.ts`) e BUG-038 (`<Image>`
  sem `sizes`) abertos; reforçado pelo histórico de 2 apagões de cota reais no processo
  (BUG-087/088, ambos já corrigidos, mas fora do escopo formal deste track)
- **T-04** Observabilidade — escopo reduzido (inventariar gap de alertas de erro em produção)
- **T-05** Integrações externas — escopo misto (sandbox); BUG-046 (links de e-mail quebrados) aberto

---

## Reestruturação do modelo de acesso (origem: `BUG-035`)

Desenho em `ACCESS-MODEL-DESIGN.md`. **Completa — BUG-035 resolvido (Fase D).**

| Etapa | Escopo | Status |
|---|---|---|
| A0 | Endurecer `portfolio_parser.py` (paths, slug BPL-003, travas) | ✓ PR #28 |
| A1 | Campos do modelo (`Atributos`/`ProductSchema`/`dispensaPreRequisito`) | ✓ PR #29 |
| A2 | Selo condicional no checkout (`concedeSelo`) | ✓ PR #30 |
| A3 | Botão admin de `dispensaPreRequisito` | ✓ PR #31 |
| B1 | Motor puro `resolverAcesso` + 27 testes | ✓ PR #32 |
| C | Checkout → `/hub/checkout`; journey → `/hub/journey` (stubs de redirect) | ✓ PR #33 |
| — | Sync do portfólio (ativa o A2) | ✓ executada pela Gestora (2026-07-08) |
| B2 | Adaptador leniente + motor assume o lock da jornada | ✓ PR #35 |
| D | Trancar `/hub/membro` (exige selo) | ✓ PR #37 — **BUG-035 RESOLVIDO** |

---

## Trilha 3 — Higiene da base

| Passo | Bug | Status |
|---|---|---|
| 3d-fonte | BUG-040 | ✓ PR #38 — namespace `_portfolio_backups` + rotação 3 |
| 3d-limpeza | BUG-040 | ✓ executada — 47 coleções de backup apagadas (export prévio) |
| 3b | BUG-042 | ✓ migração executada — 4 clientes normalizados |
| 3c | BUG-041 | ✓ executada — 14 produtos arquivados excluídos; `products` = 12 ativos |

---

## Redesign do Admin (origem: pendência de design da `F1-06`)

Desenho completo em `ADMIN-REDESIGN-DESIGN.md`. **Completo — R0 a R5 + feedback
pós-validação 9/9.**

| Lote | Escopo | Status |
|---|---|---|
| R0 | Camada 1 — sidebar em 7 escopos + mapa de renomeação | ✓ PR #138 |
| R1 | Visão Geral + Comercial (header + `StatTile`, nasce o componente) | ✓ PR #139 |
| R2 | Marketing (`marketing`/`social`/`qrcodes`) | ✓ PR #140 |
| R3 | Jornada e Agenda (`agenda`/`gestao-agenda`) | ✓ PR #141 |
| R4a | Pessoas (`users`) | ✓ PR #142 |
| R4b | Instrumentos F&S (`fs`/devolutiva) — design de surveys/forms preservado | ✓ PR #143 |
| R5 | Sistema e Ferramentas (`sandbox`/`migrate-welcome`) + BUG-113 | ✓ PR #144 |
| Feedback #1/#2/#8 | Título "Admin" + sidebar recolhível/expansível | ✓ PR #148 |
| Feedback #3/#4 | "Migrar Onboarding" removido; devolutiva → "Jornada do Cliente" | ✓ PR #146 |
| Feedback #5 | 2 cards reais de NPS/temas em `/social` | ✓ PR #147 |
| Feedback #6/#7 | Modal de agenda alargado + lista compacta de eventos | ✓ PR #145 |
| Feedback #9 | Densidade — `StatTile` compacto + shell enxuto (passo 1) | ✓ PR #149 |

**Pendente:** validação visual da Gestora em produção da área topo-esquerda da
sidebar e do flyout (não pré-visualizáveis — BUG-030). Débitos conhecidos, fora
do escopo do redesign de superfície: modal cru de `partners` (não-`GlassModal`),
loadings de admin fora do `AtmosphericLoading`, densidade fina por tela.

---

## EXP-01 — Dashboard de KPIs do `/admin` (expansão, fora do checklist)

Desenho completo em `PLATFORM-EXPANSION-PLAN.md`. **Não conta em nenhuma % da
auditoria acima** — é expansão de plataforma, não item de homologação.

| Etapa | Status |
|---|---|
| Pedido registrado + lista de métricas da Gestora | ✓ Concluído/recebida e classificada (2026-07-22) |
| Análise de viabilidade + agrupamentos + timing | ✓ Concluída |
| Fase 0 — escopo | ✓ Concluída — restam 4 confirmações curtas (nome "NPS", taxonomia de público, aceite de provisionados, prioridade do A/B) |
| Fases 1–3 (build) | ○ **Represada por decisão da Gestora — retomar após o fim da auditoria** |

---

## Fase 1 — Validação por página · **CONCLUÍDA (F1-01 a F1-06 validadas em produção)**

| Item | Página(s) | Estado |
|---|---|---|
| **F1-01** | Públicas de marketing | ✓ **Validada em produção (2026-07-21).** Cluster de 19 ajustes completo (copy, footer/header, design, `/agendar`) |
| **F1-02** | Checkout + subsistema de contratos | ◐ **Sem bloqueadores de código** (CT-0 a CT-4, PRs #48–#66). Pendente **só validação manual** da Gestora dos 3 fluxos (grátis/pago/avulso), programada para após a limpeza da base de teste |
| **F1-03** | Hub dashboard + motor de jornada | ✓ **Fechada** — motor por dado, Sequence Lock/Upsell Gate e modais da nav aprovados (2026-07-11); reaberta pontualmente 2026-07-16 (BUG-073/074/077/079/080/081, agenda/jornada) e refechada no mesmo dia |
| **F1-04** | Carreira, agenda, contratos, visão geral | ✓ **Validada em produção (2026-07-21).** Header canônico nas 3 páginas + feedback por pacotes (agenda, carreira, contratos) |
| **F1-05** | Checkout membro, networking, perfil, entrega | ✓ **Validada em produção (2026-07-21).** Privacidade do networking + cota real na entrega + feedback por pacotes (networking redesenhado) |
| **F1-06** | 19 páginas de admin | ✓ **Validada em produção (2026-07-21) + REDESIGN COMPLETO (R0–R5) + feedback 9/9.** Ver seção "Redesign do Admin" acima |

**Triagem por severidade (Fase 1 e geral): 1 único `Alto` aberto — `BUG-110`**
(planilha do Drive de survey apaga avaliação anterior em vez de anexar — precisa
plano+aprovação da Gestora). Nenhum `Crítico` aberto.

---

## Em andamento (PRs abertas)

_Nenhuma no momento._

---

## Bugs registrados (resumo)

113 bugs registrados até `BUG-113`. Ver `BUGS.md` para o registro completo e
`00-PLAN.md#índice--bug--itemtrack` para a associação bug→item/track de todos
eles. Destaques que não se encaixam num único item de fase:

- **BUG-030** (Baixo, **aceito**) — auth não funciona em preview Vercel (limitação conhecida de Firebase Auth + domínio efêmero)
- **BUG-034** (Baixo, aberto/futuro) — falta 2º componente-base para modais grandes "app-shell"
- **BUG-045** (Médio, corrigido PR #32) — `npm run test` estava quebrado na `main` desde o PR #19, sem ninguém ver (sessões validavam só com `tsc`+`build`, não `npm run check`)
- **BUG-085** (Baixo, aberto/adiado) — ~340 docs de eventos passados nunca removidos; correção óbvia é destrutiva (apagaria atas/histórico de carreira)
- **BUG-097/BUG-098/BUG-105** (aberto, decisão de produto/arquitetura pendente da Gestora)
- **BUG-110** (Alto, aberto) — ver Triagem por severidade acima

---

## Legenda

`✓` mergeado · `◐` parcial · `○` aberto · `→` em PR · **gated** = decidido, aguarda plano+aprovação para implementar
