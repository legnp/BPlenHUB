# Painel de Progresso — Auditoria BPlen (Fase 0 + Tracks associados)

> **Visão de uma olhada** do progresso. **Fonte de verdade:** `BUGS.md` (status de
> cada bug) + `00-PLAN.md` (itens de fase e tracks). Este arquivo apenas **agrega**
> — se divergir da fonte, a fonte vence.
>
> **Manutenção:** atualizado **manualmente a cada PR mergeada** (mesmo checkpoint
> da entrada no `LOG.md`). Bugs novos que aparecerem entram no track certo e a
> contagem se recalcula aqui.
>
> **"Resolvido" = mergeado na `main` OU formalmente aceito como risco/adiado**
> (critério de fechamento de Track definido em `00-PLAN.md`). Correções em PR
> aberta ou bugs simplesmente "Aberto"/"Em Progresso" não contam na %.
>
> **Última atualização:** 2026-07-08 (chat de execução — **Fase B / B1 mergeada**
> (PR #32): motor puro `resolverAcesso` + 27 testes Vitest, sem consumidor. Achado e
> corrigido no mesmo PR o **BUG-045**: `npm run test` estava **vermelho na `main`**
> desde o PR #19 (mock sem `requireMatricula`) — a suíte volta a **39/39**.
> Sequenciamento da Fase B corrigido para **B1 → C → Sync → B2 + D**.
>
> _(entrada anterior)_ 2026-07-08 (chat de execução — **Fase A / A3 mergeada**
> (PR #31): botão admin de dispensa de pré-requisito na aba "Assessments /
> Devolutivas" de `admin/users`; etapas derivadas dos produtos (sem hardcode) e
> cada `serviceCode` validado contra o catálogo no servidor. Campo gravado sem
> consumidor — quem lê é o motor da Fase B. **Fase A concluída (A0→A3).**
>
> _(entrada anterior)_ 2026-07-08 (chat de execução — **Fase A / A2 mergeada**
> (PR #30): `grantServiceEntitlement` concede `member_area_access` só se o produto
> não declarar `concedeSelo: false`. **Merge behavior-neutral** — nenhum produto tem
> o campo no Firestore ainda; o comportamento vira na **Sync do portfólio**, retida
> até a Fase C por decisão da Gestora. Nenhuma contagem de track muda (A2 é
> reestruturação do modelo de acesso, não fechamento de bug; `BUG-035` fecha na
> Fase D).
>
> _(entrada anterior)_ 2026-07-07 (chat de execução — **Fase 1 iniciada**:
> BUG-035 (F1-06) promovido a **[CONFIRMADO]** por leitura (causa-raiz: enforcement
> de `member_area_access` só em `/hub/membro`; correção gated). **F1-01** (páginas
> públicas): PR #26 mergeada corrigindo **BUG-036** (hidratação no `ComparisonTable`),
> **BUG-037** (acentos/crase) e **BUG-014** (import morto); registrados **BUG-038**
> (perf, adiado) e **BUG-039** (ação órfã sem guard, remoção gated).
>
> _(entrada anterior)_ 2026-07-07 (chat de planejamento — reconciliação
> geral: corrigida a % do **T-03** (BUG-018 fechado conta como unidade inteira
> no critério de fechamento de Track, não fração — de `~1,5/4 (~38%)`,
> incorreto, para **1/4 (25%)**, exato); **F0-04** atualizado de "Parcial" para
> **Concluído** (as duas partes — `entitlements` e `User_JourneyMap` — estão
> mergeadas). Nenhuma mudança de código.
>
> _(entrada anterior)_ 2026-07-04 (chat de execução — **BUG-018 FECHADO**:
> consolidação de jornada completa — parar de escrever (PR #22), migração dos 5
> clientes atuais executada (scripts PRs #23/#24) e fallback removido (PR #25).
> Sem perda de dados. Resíduo networking no BUG-033).

---

## Fase 0 — Padrões canônicos

**Decisões: 6/6 (100%).** Implementação ainda pendente: **F0-01** — parte
GlassModal concluída (lotes 1/A/B); resta o 2º base p/ modais grandes (BUG-034,
futuro). **F0-04 concluído** (entitlements + consolidação de `User_JourneyMap`,
PRs #1/#22/#23/#24/#25).

| Item | Tema | Status |
|---|---|---|
| F0-01 | Modal canônico | Decidido · **parte GlassModal concluída** — lotes 1 (z-index, PR #15), A (4 modais-card, PR #20), B (offboarding + z-index JourneyNav, PR #21). Todos os modais-card convergidos; exceções aceitas (`ServiceSelection` público, `ContractGate` crítico); resta o 2º base p/ modais grandes app-shell (**BUG-034**, futuro). Conferência visual pendente em produção (BUG-030) |
| F0-02 | Timestamp | ✓ Decidido (padrão pronto) |
| F0-03 | Identidade | ✓ Decidido (padrão + convergência gradual) |
| F0-04 | Coleções órfãs | ✓ Concluída — `entitlements` removida (PR #1) + `User_JourneyMap` consolidado no v3 e removido de todos os clientes (PRs #22/#23/#24/#25); resíduo de nomenclatura obsoleta no networking tratado à parte (BUG-033, Fase 1) |
| F0-05 | Guard admin server-side | ✓ Mergeado (PR #1) |
| F0-06 | Tom de voz / copy | ✓ Ratificado (+ data legal em config, PR #1) |

---

## Tracks de execução associados

Onde a implementação sistemática dos temas da Fase 0 acontece. Progresso = bugs
mergeados na `main` sobre o total do track.

### T-02 — Segurança sistemática · **12 / 12 (100%)** ✅ FECHADO  `██████████`

- ✓ Mergeados: BUG-003 (recover, PR #3), BUG-007 (guard admin = F0-05, PR #1), BUG-019 (IDOR foto, PR #4), BUG-023 (rotas debug, PR #3), BUG-024 (trigger-sync removido, PR #5), BUG-021 (guard ad-hoc de upload unificado, PR #13), **BUG-020 (guards sistemáticos em Server Actions — 7 lotes, PRs #8–#14)**, **BUG-032 (escalação de privilégio no login, PR #14)**, **BUG-025 (webhook MP com assinatura HMAC, PR #16)**, **BUG-004 (path de debug no lugar do apelido no painel admin, PR #17)**, **BUG-006 (guard `requireAuth` no networking, PR #18)**, **BUG-005 (`requireMatricula` no pagamento do checkout de membro, PR #19)**
- ✅ **BUG-020 fechado** — 7 lotes: booking (PR #8, 2 IDORs), CRUD admin (PR #9), analytics admin (PR #10), queries do calendário (PR #11, 2 IDORs), journey (PR #12, 2 IDORs), upload/portfólio (PR #13, 1 IDOR + BUG-021), auth-permissions (PR #14, 1 IDOR + BUG-032). Padrão canônico do track consolidado: `requireAuth()`/`requireAdmin()` + dono-ou-admin, sessão pelo cookie assinado.
- ✅ **Track completo:** todos os 12 bugs vinculados corrigidos e mergeados. Nenhum aceite formal/adiamento foi necessário.

### T-06 — Compliance técnico · **1 / 2 (50%)**  `█████░░░░░`

- ✓ Mergeados: BUG-023
- ○ Abertos: BUG-001 (`Support_Tickets` com PII em coleção raiz)

### T-03 — Integridade de dados · **1 / 4 (25%)**  `███░░░░░░░`

- ✓ BUG-018 **Corrigido** — `entitlements` removida (F0-04) + consolidação de jornada completa: `User_Journey`(v3) mantido, `User_JourneyMap`(legado) parou de ser escrito (PR #22), migrado dos 5 clientes atuais (script PRs #23/#24, executado) e fallback removido (PR #25). Conta como unidade inteira no numerador (critério de fechamento de Track) — resíduo de nomenclatura no networking segue à parte no BUG-033 (Fase 1).
- ○ Abertos: BUG-008 (chave de cota), BUG-009 (`UserBooking.timestamp`), BUG-010 (`adminAddAttendee` duplicado)

### Outros tracks (ainda não iniciados)

- **T-01** Performance/concorrência — BUG-017 (aberto)
- **T-04** Observabilidade — escopo reduzido (inventariar gap)
- **T-05** Integrações externas — escopo misto (sandbox)

---

## Reestruturação do modelo de acesso (origem: `BUG-035`)

Desenho em `ACCESS-MODEL-DESIGN.md`. Fecha o `BUG-035` na **Fase D**, não antes.

| Etapa | Escopo | Status |
|---|---|---|
| A0 | Endurecer `portfolio_parser.py` (paths, slug BPL-003, travas) | ✓ PR #28 |
| A1 | Campos do modelo (aba `Atributos` + `ProductSchema` + `Product` + `dispensaPreRequisito`), sem consumidores | ✓ PR #29 |
| A2 | Selo condicional no checkout (`concedeSelo`) | ✓ PR #30 — **inerte até a Sync** |
| A3 | Botão admin de `dispensaPreRequisito` | ✓ PR #31 — **sem consumidor até a Fase B** |
| B1 | Motor puro `resolverAcesso` + 27 testes | ✓ PR #32 — **sem consumidor** |
| C | Reposicionar checkout/junior → `/hub` | ○ próximo — **destrava a Sync** |
| — | **Sync do portfólio** (ativa o A2) | ○ depois da C |
| B2 | Adaptador + troca do lock hardcoded | ○ depende da Sync |
| D | Trancar `/hub/membro` (exige selo) | ○ **→ BUG-035 resolvido** |

**Sequenciamento corrigido (2026-07-08):** a ordem `B → C → D` do design não roda —
o motor precisa de `preRequisitos` no Firestore, que só chegam pela Sync, retida até
a C. Ordem real: **B1 → C → Sync → B2 + D**.

**Aba `Atributos` preenchida** (2026-07-08) e conferida contra o §3.1: as 12 linhas
batem, `BPL-PAC-JR` = `public` + `concedeSelo FALSE` (a Gestora corrigiu uma
divergência apontada na conferência). Parser validado por diff — regressão zero.
**Payload não commitado e portfólio não sincronizado** de propósito: a Sync espera a C.

---

## Em andamento (PRs abertas)

_Nenhuma no momento._

---

## Bugs novos registrados nesta trilha (fora do plano original)

- **BUG-028** (Baixo, adiado) — login sem fallback popup→redirect (produção OK)
- **BUG-029** (Baixo, adiado) — override de `authDomain` anula proxy (produção OK)
- **BUG-030** (Baixo, **aceito**) — auth não funciona em preview Vercel (limitação conhecida)
- **BUG-031** (Baixo, pendente) — "Sincronizar Agora" não reconstrói lista dos membros (usabilidade)
- **BUG-032** (Crítico, **corrigido** PR #14) — escalação de privilégio: `syncUserPermissionsOnLogin` concedia admin a partir de e-mail não-verificado (achado no lote 7 do BUG-020)
- **BUG-033** (Médio, **[HIPÓTESE]**, aberto) — networking envia contatos/URLs não-visíveis ao client (a verificar na Fase 1 / F1-05)
- **BUG-034** (Baixo, aberto/futuro) — falta 2º componente-base para modais grandes "app-shell" (F0-01, opção iii)
- **BUG-035** (Alto, **[CONFIRMADO]**, aberto) — revogação de acesso de membro via admin não surte efeito; causa-raiz confirmada (F1-06). **Correção parada antes de codar** (Lição 3): gate ingênuo quebraria funil de aquisição (1ª compra passa por `/hub/membro/checkout` sem `member_area_access`) e onboarding (welcome survey em `/hub`) e junior grátis (journey sem o entitlement). Fronteira do "membro pago" = **decisão de produto** aguardando a Gestora. Bloqueia validação visual do offboarding modal (F1-03)
- **BUG-036** (Médio, **corrigido** PR #26) — erro de hidratação no `ComparisonTable` (whitespace em `<colgroup>`) em `/servicos/[audience]`; F1-01
- **BUG-037** (Baixo, **corrigido** PR #26) — acentos/crase em copy pública de serviços; F1-01
- **BUG-038** (Baixo, aberto/adiado) — `<Image fill>` sem `sizes` na foto da fundadora (perf); F1-01/T-01
- **BUG-039** (Baixo, **corrigido** PR #27) — `seedComparisonProductsAction` órfã removida (double-check: zero refs no repo); F1-01
- **BUG-045** (Médio, **corrigido** PR #32) — `npm run test` quebrado na `main` desde o PR #19 (mock de `@/lib/auth-guards` sem `requireMatricula`); suíte estava 37/39 e ninguém via, porque as sessões validavam só com `tsc` + `build`

---

## Legenda

`✓` mergeado · `◐` parcial · `○` aberto · `→` em PR · **gated** = decidido, aguarda plano+aprovação para implementar
