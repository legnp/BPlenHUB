# Painel de Progresso — Auditoria BPlen (Fases 0-4 + Tracks associados)

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
> **Última atualização:** 2026-07-29 (chat de planejamento — **reconciliação geral**,
> a 3ª desde 2026-07-07. Checklist original **funcionalmente completo por código**,
> restando só `F3-03` (nunca iniciado) e a rodada de validação humana diferida
> (Caminho B — Fase 4 ao vivo + 3 fluxos de contrato + virada MP, ver `00-PLAN.md`).
> Corrigido: linha do resumo de bugs ainda dizia `BUG-114`/`BUG-115` "aguardando
> deploy manual" (já `Corrigido` desde 2026-07-24); item `[T-01]` do `00-PLAN.md`
> e o próprio `T-01-PERFORMANCE-DESIGN.md` idem; seção "Estado da auditoria" do
> `00-PLAN.md` ainda listava `F2-05`/`BUG-011` como pendentes (concluídos em
> 2026-07-24/28) — reescrita. Nova seção **"Fases 2-4"** abaixo (este painel nunca
> tinha uma tabela para elas, só para 0/1). Lições 49-50 no `RETROSPECTIVE.md`
> (deploy de índice é sempre manual da Gestora; critério de aceite pode ficar
> obsoleto quando a superfície que ele cita é removida). Nenhuma mudança de código.
>
> _(entrada anterior)_ 2026-07-28 (chat de execução — **BUG-011 CORRIGIDO → F3-01 concluído** (PR #162).
> Investigado por leitura: a antecedência mínima de 3 dias já era enforçada na gravação para o membro
> (`bookEventAction`; estava stale como o BUG-012); o resíduo do funil público (write não revalidava a
> janela, só a listagem) foi corrigido. Também nesta sessão: **BUG-114/115 fechados** (índices criados
> pela Gestora, queries confirmadas); **F2-05 e snapshot T1-2 validados** em produção; credencial MP
> esclarecida (teste até pós-auditoria). Deploy de todos confirmado.)
>
> _(entrada anterior)_ 2026-07-24 (chat de execução — **BUG-114 e BUG-115 CORRIGIDOS**. A Gestora
> criou os 3 índices no Firebase Console (composto `Surveys(surveyId,status)` via link + isenções
> `Forms.formId` e `User_Permissions.admin`), todos READY. Sonda read-only confirmou o EFEITO (Lição 31):
> as 3 queries que davam FAILED_PRECONDITION funcionam (4/1/2 docs). Fecha a última pendência operacional
> do T-01 Momento 1. Detalhe/respondentes do admin e rebaixar admin voltam a funcionar.)
>
> _(entrada anterior)_ 2026-07-24 (chat de execução — **F2-05 concluído → Fase 2 COMPLETA**.
> Categorização formal de todas as rotas logadas (hub + admin) nos 4 conceitos de design
> (`F2-05-DESIGN-CATEGORIZATION.md`); o admin coube nos 4 (16 Gestão Funcional + 2 Fullscreen,
> nenhum 5º). Verificação de conformância: header OK; 3 violações de loading da regra 8 corrigidas
> (**PR #161**, deploy confirmado — "Sincronizando/Mapeando/Processando" → "Carregando"). **ITEM 1
> (deploy dos índices, BUG-114/115) bloqueado:** o agente não tem credencial com permissão de índice
> (SA do Admin SDK só lê; login CLI expirado) — devolvido à Gestora (`firebase login` + deploy, ou os
> 3 links do console). Pendente: validação visual das 3 copies (BUG-030).)
>
> _(entrada anterior)_ 2026-07-23 (chat de planejamento — **reconciliação geral**,
> a 2ª desde 2026-07-07. Entre esta e a anterior (2026-07-22), a execução fechou os 3
> tracks restantes (T-01 Momento 1, T-04, T-05) e concluiu F2-01/02/03/04 + F3-02 — e
> já se autocorrigiu ao vivo sobre um erro da reconciliação anterior (`BUG-110`
> reintroduzido sem checar o git; corrigido pela própria sessão de execução seguinte
> em minutos). Esta reconciliação confirma esse trabalho e corrige o que sobrou:
> **10 status do índice bug→track** ainda defasados (`BUG-009/012/013/015/017/027/
> 031/038/089/104/105/110`, todos já corrigidos/fechados mas listados "Aberto"); a
> **tabela de Triagem por severidade** (não só a nota textual) ainda listava o
> `BUG-110`; o **item `[T-01]`** nunca tinha saído do template original; o **item
> `[T-03]`** dizia "6/7" (defasado desde o fechamento do `BUG-009`); **2 linhas
> novas** para `BUG-114`/`BUG-115`. Nova **Lição 45** no `RETROSPECTIVE.md` (status
> numa fila de prioridade é hipótese herdada — confirme contra `git log` antes de
> agir; o padrão recorreu 6× na mesma sessão de execução) + item 15 do Protocolo.
> Seção "Estado da auditoria" do `00-PLAN.md` reescrita — quase tudo que era
> "próximo passo" já foi feito. Nenhuma mudança de código.
>
> _(entrada anterior)_ 2026-07-23 (chat de execução — **T-01 Momento 1 CONCLUÍDO:
> T1-3 (índices) — PR #160**, deploy Vercel confirmado (config-only). Medição: a paginação
> da lista de usuários admin (~25k leituras/abertura a 10k) não cabe no Momento 1 (busca
> substring client-side sobre a base inteira, sem filtro para reduzir; paginar regrediria a
> busca do admin) → **Momento 2**. A parte de índices foi entregue: `firestore.indexes.json`
> versionado (enumerado o estado real antes — 0 compostos, só `Surveys.status` customizado,
> preservado) + `firebase.json`, fechando **BUG-114** e **BUG-115** (novo — anti-lockout de
> admin quebrado por índice) **após o deploy manual dos índices**. **Momento 1 do T-01
> completo:** T1-1/T1-2/T1-3. Pendências operacionais: deploy dos índices; validação de amanhã
> dos 2 itens do snapshot do T1-2.)
>
> _(entrada anterior)_ 2026-07-23 (chat de execução — **T-01 Momento 1: T1-2
> (agregados admin) concluída — PR #159**, deploy confirmado. A medição mostrou que
> contadores nativos exigiriam ~6-10 índices de collection group inexistentes (sem
> pipeline de deploy → quebrariam o painel), então as 4 telas de analytics do admin
> passam a ler um **snapshot diário** `Admin_Metrics_Daily` (cron faz a varredura sem
> filtro 1×/dia, isolado/best-effort — Lição 40; telas leem 1 doc; fallback ao vivo antes
> do 1º cron). Série histórica adianta a infra do EXP-01. Paridade validada (números
> idênticos). Achado colateral: detalhe de respondentes já quebrado por índice = **BUG-114**.
> eslint/tsc/test 292/292/build limpos. Próximo: T1-3 (paginação lista de usuários admin).)
>
> _(entrada anterior)_ 2026-07-23 (chat de execução — **T-01 (performance)
> Momento 1 iniciado**. 4 decisões da Gestora aprovadas. **T1-0 (medição read-only) +
> T1-1 (networking, hotspot A CRÍTICO member-facing) concluídas — PR #158**, deploy de
> produção confirmado: `getNetworkingDataAction` filtra visibilidade/profissional/
> `isActive` no banco + teto de leitura anti-runaway (antes: full scan + filtro
> client-side). Medido: base viva sem drift; `where`+`limit` não exigiu índice composto
> (sem `firestore.indexes.json`). Contrato do client inalterado. eslint/tsc/test
> 292/292/build limpos. Ver `T-01-PERFORMANCE-DESIGN.md` seção 9.)
>
> _(entrada anterior)_ 2026-07-22 (chat de planejamento — **reconciliação
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
> **Correção (chat de execução, 2026-07-22, logo após a reconciliação):** a
> reconciliação acima colocou o `BUG-110` (Alto) na fila de triagem, mas ele **já
> estava corrigido** (PR #131, 2026-07-20) — a verificação de status não conferiu o
> git. Reclassificado para `Corrigido`; a fila de `Alto`/`Crítico` agora está
> **vazia**. Docs corrigidos: `BUGS.md`, `00-PLAN.md`, este `DASHBOARD.md`. Sem
> mudança de código (o fix já estava na `main`).
>
> **Execução (2026-07-22, mesma sessão):** decisões de negócio do grupo 4 resolvidas
> pela Gestora (F2-01 remover step-journey; F2-04/BUG-013 cota 1:1 com trava real —
> aguarda plano; F3-02 mantém as 3 exceções — fechado; BUG-105 não é bug — fechado).
> **PR #152** (deploy confirmado) removeu a rota órfã `/hub/step-journey` — **BUG-015
> Corrigido, F2-01 concluído**. **PR #153** (deploy confirmado) — **BUG-013 Corrigido,
> F2-04 concluído**: trava real da cota 1:1 no agendamento (consome ao agendar/estorna ao
> cancelar em tempo hábil; só o tipo `1-to-1`, validadas as 5 categorias com a Gestora).
> Sidebar recolhida do admin validada/aprovada; `normalize-quota-keys` reconfirmado limpo.
> **PR #154** (deploy confirmado) — **BUG-089 Corrigido**: falha muda no `/agendar` público (erro de
> backend virava "tudo livre") agora mostra "não foi possível carregar a agenda". **BUG-104** e
> **BUG-110** reclassificados para Corrigido (já estavam, PRs #132/#131 — resíduos da reconciliação).
> **Varredura grupo 3:** **PR #155** (deploy confirmado) — **BUG-038 Corrigido** (`sizes` na foto).
> **BUG-012** já estava corrigido (limite semanal enforced via BUG-076/#103). **BUG-027 Corrigido** (PR #156):
> playground `_docs/labs/` + `ThemeSelector` removidos (Gestora aprovou; não afeta a troca de tema).
> **BUG-031** já estava corrigido (duplicata do BUG-095, PR #114 — o sync já reconstrói o registro).
> **5 status desatualizados** achados nesta sessão (BUG-110/104/012/031 + normalize-quota-keys) — a
> reconciliação de 2026-07-22 não conferiu status contra git; recomendada re-verificação dos abertos.
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

### T-03 — Integridade de dados · **7 / 7 (100%)** · fechado  `██████████`

- ✓ BUG-018 — consolidação de jornada completa (`User_Journey` v3 mantido, `User_JourneyMap`
  legado removido de todos os clientes, PRs #22/#23/#24/#25).
- ✓ BUG-010 (PR #69) — `adminAddAttendeeAction` morta removida.
- ✓ BUG-008 (PR #71) — chave de cota `1-to-1` unificada em minúsculo canônico.
- ✓ BUG-040/041/042 (Trilha 3, scripts locais, 2026-07-08) — ~50 coleções de backup removidas,
  14 produtos legados excluídos, chaves de entitlement de 4 clientes normalizadas.
- ✓ BUG-009 (PR #157, 2026-07-22) — **[CONFIRMADO]** na base real (0/12 tinham `timestamp`, 12/12
  `bookedAt`); `getUserBookingsAction` passa a ler `bookedAt`. _(Recálculo 2026-07-23: o agregador
  ainda marcava 6/7 com BUG-009 "aberto"; BUGS.md já o registrava Corrigido — Track fechado.)_

### Outros tracks

- **T-01** Performance — **Momento 1 CONCLUÍDO (2026-07-23).** Plano: `T-01-PERFORMANCE-DESIGN.md`
  (2 momentos, Blaze futuro). **T1-1 (networking, hotspot A CRÍTICO) — PR #158:** filtro no banco + teto.
  **T1-2 (agregados admin B–E) — PR #159:** **snapshot diário** `Admin_Metrics_Daily` (cron compartilhado;
  telas leem 1 doc; paridade validada; adianta a série do EXP-01). **T1-3 (índices) — PR #160:**
  `firestore.indexes.json` versionado + **índices criados no console pela Gestora (2026-07-24), READY —
  BUG-114 e BUG-115 CORRIGIDOS** (queries confirmadas por sonda, Lição 31). Paginação da lista de usuários
  admin → **Momento 2** (busca substring não pagina sem índice externo). Todos deploy confirmado.
  **Pendência operacional restante:** follow-ups de UI do T1-2 (botão "Recalcular" + selo "atualizado em").
  **Momento 2** (futuro):
  `Networking_Directory` + paginação da lista de usuários; Blaze; provedores externos. BUG-038 já corrigido
  (PR #155).
- **T-04** Observabilidade — **CONCLUÍDO no escopo reduzido** (2026-07-23) — inventário read-only:
  **gap confirmado** (sem error tracker/`instrumentation.ts`/`global-error.tsx`; `error.tsx` só UX;
  336 `console.error` em log efêmero sem alerta; único alerta proativo = e-mail do cron). Recomendado
  Sentry (`@sentry/nextjs`, free tier) + scrub de PII. Implementação = decisão da Gestora pós-auditoria.
  Ver `T-04-OBSERVABILITY-FINDINGS.md`.
- **T-05** Integrações externas — **CONCLUÍDO no escopo misto** (2026-07-23) — verificação read-only
  (condição real, sem efeito): **Google (Calendar/Drive) e Mercado Pago confirmados vivos** (auth ok;
  MP token válido + webhook HMAC ativo + código sólido); **Resend inconclusivo por read-only** (401 em
  `/domains` = provável chave sending-only, não falha; produto envia em prod). Recomendações: confirmar
  token MP de prod na Vercel (`APP_USR-`; local é `TEST-`/sandbox); E2E com custo → protocolo humano.
  BUG-046 (links de e-mail p/ rota inexistente) segue Aberto (Baixo). Ver `T-05-INTEGRATIONS-FINDINGS.md`.

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

**Triagem por severidade (Fase 1 e geral): fila VAZIA — 0 `Alto`, 0 `Crítico` aberto.**
O `BUG-110` (planilha do Drive apagava avaliação anterior) **já estava corrigido** (PR
#131, 2026-07-20) quando a reconciliação de 2026-07-22 o listou por engano como único
`Alto` aberto; reclassificado para `Corrigido` na sessão de execução de 2026-07-22
(leitura de código/git). Ver `BUGS.md#bug-110`.

---

## Fases 2-4 · progresso

| Fase | Item | Estado |
|---|---|---|
| **Fase 2** | F2-01 destino do step-journey | ✓ Removida (PR #152) |
| | F2-02 gate de contrato | ✓ Auditada — PASSA (trava estrutural por-serviço, sem código) |
| | F2-03 seletor de tema hub/admin | ✓ Validado por código (motor global + mesmo header nas 2 áreas) |
| | F2-04 cotas/entitlements | ✓ Trava real da cota 1:1 no booking (PR #153) |
| | F2-05 categorização de design | ✓ Hub+admin categorizados nos 4 conceitos (PR #161); validado em produção (2026-07-28) |
| | **Fase 2** | **COMPLETA — 5/5** |
| **Fase 3** | F3-01 regras de agendamento | ✓ `BUG-012`+`BUG-011` enforçados (PR #162) |
| | F3-02 exceções do Sequence Lock | ✓ Ratificadas pela Gestora (mantêm-se as 3) |
| | F3-03 regras financeiras | ○ **Não iniciado** — único item do checklist original ainda sem trabalho |
| | **Fase 3** | **2/3** |
| **Fase 4** | F4-01/02/03 jornadas e2e | ✓ **Mapeadas por código** (`F4-JOURNEYS-MAP.md`, 2026-07-28) — gates sólidos, sem armadilha nova |
| | Corrida e2e AO VIVO | ○ **Diferida (Caminho B)** — pós-limpeza da base de teste; **auditoria permanece formalmente aberta até esta rodada concluir** (decisão da Gestora, 2026-07-29) |

---

## Em andamento (PRs abertas)

_Nenhuma no momento._

---

## Bugs registrados (resumo)

115 bugs registrados até `BUG-115`. Ver `BUGS.md` para o registro completo e
`00-PLAN.md#índice--bug--itemtrack` para a associação bug→item/track de todos
eles. Destaques que não se encaixam num único item de fase:

- **BUG-011** (Médio) — **CORRIGIDO (PR #162, 2026-07-28).** Investigado: a parte do membro já era enforçada (`bookEventAction`, estava stale como o BUG-012); resíduo do funil público (write não revalidava a janela de 3 dias) corrigido. F3-01 concluído.
- **BUG-030** (Baixo, **aceito**) — auth não funciona em preview Vercel (limitação conhecida de Firebase Auth + domínio efêmero)
- **BUG-034** (Baixo, aberto/futuro) — falta 2º componente-base para modais grandes "app-shell"
- **BUG-043** (Médio, aberto) — `steps-registry.ts` fora de sincronia com os produtos canônicos da jornada
- **BUG-045** (Médio, corrigido PR #32) — `npm run test` estava quebrado na `main` desde o PR #19, sem ninguém ver (sessões validavam só com `tsc`+`build`, não `npm run check`)
- **BUG-046** (Baixo, aberto) — links de e-mail de booking para rota inexistente
- **BUG-085** (Baixo, aberto/adiado) — ~340 docs de eventos passados nunca removidos; correção óbvia é destrutiva (apagaria atas/histórico de carreira)
- **BUG-094** (Baixo, aberto/adiado) — `resolveEventWeek` mistura semana ISO com ano civil
- **BUG-097** (Médio, aberto) — agendamento fantasma quando o evento some do Google; decisão de modelo tomada ("Agenda alterada"), falta o plano de implementação
- **BUG-098** (Baixo, aberto de propósito) — campo `mentor` com nomenclatura antiga; pendência a pedido da Gestora
- **BUG-105** (**fechado 2026-07-22 — não é bug**) — Pré-Análise Comportamental é collect-only por desenho (insumo do consultor para a devolutiva de Preparação de Carreira); já aparece no quadro "Formulários & Surveys Preenchidos" de `/admin/jornada-cliente`. Sem código.
- **BUG-110** (Alto → **Corrigido**, PR #131) — reconciliação de 2026-07-22 o marcou aberto por engano (Lição 45); ver Triagem por severidade acima
- **BUG-112 escopo C** (Melhoria, adiado) — papel real de "Consultor" + migração, programado para depois da auditoria
- **BUG-114/BUG-115** (Médio, **Corrigido**, 2026-07-24) — índices criados pela Gestora no console do Firebase; efeito confirmado por sonda read-only

---

## Legenda

`✓` mergeado · `◐` parcial · `○` aberto · `→` em PR · **gated** = decidido, aguarda plano+aprovação para implementar
