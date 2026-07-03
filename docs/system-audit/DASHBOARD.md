# Painel de Progresso — Auditoria BPlen (Fase 0 + Tracks associados)

> **Visão de uma olhada** do progresso. **Fonte de verdade:** `BUGS.md` (status de
> cada bug) + `00-PLAN.md` (itens de fase e tracks). Este arquivo apenas **agrega**
> — se divergir da fonte, a fonte vence.
>
> **Manutenção:** atualizado **manualmente a cada PR mergeada** (mesmo checkpoint
> da entrada no `LOG.md`). Bugs novos que aparecerem entram no track certo e a
> contagem se recalcula aqui.
>
> **"Resolvido" = mergeado na `main`.** Correções em PR aberta aparecem em
> "Em andamento", não contam na %.
>
> **Última atualização:** 2026-07-03 (após PR #5 mergeado).

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

### T-02 — Segurança sistemática · **5 / 10 (50%)**  `█████░░░░░`

- ✓ Mergeados: BUG-003 (recover), BUG-007 (guard admin = F0-05), BUG-019 (IDOR foto), BUG-023 (rotas debug), BUG-024 (trigger-sync removido)
- ○ Abertos: BUG-005, BUG-006, BUG-020 (sistêmico, em lotes), BUG-021, BUG-025 (webhook HMAC)

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

---

## Legenda

`✓` mergeado · `◐` parcial · `○` aberto · `→` em PR · **gated** = decidido, aguarda plano+aprovação para implementar
