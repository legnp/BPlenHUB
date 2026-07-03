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
> **Última atualização:** 2026-07-03 (chat de execução — BUG-020 lote 7/auth-permissions
> mergeado, PR #14, **fechando o BUG-020 inteiro** e o **BUG-032** Crítico de
> escalação de privilégio achado no processo; T-02 sobe para 8/12 — BUG-032 entra
> no denominador como corrigido; nenhum Crítico aberto).

---

## Fase 0 — Padrões canônicos

**Decisões: 6/6 (100%).** Implementações ainda pendentes: **F0-01** (convergência
de modais) e **F0-04** (parar escrita de `User_JourneyMap`).

| Item | Tema | Status |
|---|---|---|
| F0-01 | Modal canônico | Decidido · implementação pendente (gated) |
| F0-02 | Timestamp | ✓ Decidido (padrão pronto) |
| F0-03 | Identidade | ✓ Decidido (padrão + convergência gradual) |
| F0-04 | Coleções órfãs | Parcial — `entitlements` removida; `User_JourneyMap` pendente |
| F0-05 | Guard admin server-side | ✓ Mergeado (PR #1) |
| F0-06 | Tom de voz / copy | ✓ Ratificado (+ data legal em config, PR #1) |

---

## Tracks de execução associados

Onde a implementação sistemática dos temas da Fase 0 acontece. Progresso = bugs
mergeados na `main` sobre o total do track.

### T-02 — Segurança sistemática · **8 / 12 (~67%)**  `███████░░░`

- ✓ Mergeados: BUG-003 (recover, PR #3), BUG-007 (guard admin = F0-05, PR #1), BUG-019 (IDOR foto, PR #4), BUG-023 (rotas debug, PR #3), BUG-024 (trigger-sync removido, PR #5), BUG-021 (guard ad-hoc de upload unificado, PR #13), **BUG-020 (guards sistemáticos em Server Actions — 7 lotes, PRs #8–#14)**, **BUG-032 (escalação de privilégio no login, PR #14)**
- ✅ **BUG-020 fechado** — 7 lotes: booking (PR #8, 2 IDORs), CRUD admin (PR #9), analytics admin (PR #10), queries do calendário (PR #11, 2 IDORs), journey (PR #12, 2 IDORs), upload/portfólio (PR #13, 1 IDOR + BUG-021), auth-permissions (PR #14, 1 IDOR + BUG-032). Padrão canônico do track consolidado: `requireAuth()`/`requireAdmin()` + dono-ou-admin, sessão pelo cookie assinado.
- ○ Abertos: BUG-004 (vazamento de path em `admin-fs.ts`), BUG-005, BUG-006, BUG-025 (webhook HMAC)

### T-06 — Compliance técnico · **1 / 2 (50%)**  `█████░░░░░`

- ✓ Mergeados: BUG-023
- ○ Abertos: BUG-001 (`Support_Tickets` com PII em coleção raiz)

### T-03 — Integridade de dados · **~0,5 / 4 (~13%)**  `█░░░░░░░░░`

- ◐ Parcial: BUG-018 (`entitlements` removida; `User_JourneyMap` pendente)
- ○ Abertos: BUG-008 (chave de cota), BUG-009 (`UserBooking.timestamp`), BUG-010 (`adminAddAttendee` duplicado)

### Outros tracks (ainda não iniciados)

- **T-01** Performance/concorrência — BUG-017 (aberto)
- **T-04** Observabilidade — escopo reduzido (inventariar gap)
- **T-05** Integrações externas — escopo misto (sandbox)

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

---

## Legenda

`✓` mergeado · `◐` parcial · `○` aberto · `→` em PR · **gated** = decidido, aguarda plano+aprovação para implementar
