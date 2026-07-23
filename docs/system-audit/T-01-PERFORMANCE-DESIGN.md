# Design — T-01: Performance / Custo de Leitura (BPlen HUB)

Plano do track de performance da auditoria (`00-PLAN.md`), no padrão de
`AGENDA-SYNC-DESIGN.md` / `CONTRACTS-DESIGN.md` / `ACCESS-MODEL-DESIGN.md`.

**Autorizado pela Gestora (2026-07-22)** com a escala-alvo: **~10.000 usuários**.
Execução por lotes (branch + PR), cada um com medição antes de ligar (Lição 38).

---

## 0. Por que agora

- **Escala-alvo: ~10.000 usuários** (Gestora). Vários caminhos leem "a base inteira" por
  visita — custo **O(usuários)** por tela.
- **Plano Spark/Hobby:** cota gratuita de **~50.000 leituras/dia** no Firestore. O projeto
  **já teve 2 apagões de cota** neste processo (agenda, `BUG-087`).
- **Alvo do track:** trocar leituras **O(usuários)** por **O(1)** (snapshot pré-calculado) ou
  **O(tamanho da página)** (paginação) nos pontos quentes.

---

## 1. Inventário dos pontos quentes (medido por leitura de código, 2026-07-22)

Full scans / leituras sem limite (crescem com o nº de usuários):

| # | Local | O que lê | Frequência | Classe |
|---|---|---|---|---|
| A | `actions/networking.ts:84` | `collection("User").get()` + filtro **client-side** de visibilidade | **Membro** (aba Networking) | **CRÍTICO — member-facing** |
| B | `actions/admin-fs.ts:59/64/71/176` | `collectionGroup("Surveys"/"Forms")` + `collection("User")` | Admin (painel F&S) | Agregado admin |
| C | `actions/admin-surveys.ts:39` | `collectionGroup("Surveys").get()` | Admin | Agregado admin |
| D | `actions/admin-forms.ts:39` | `collectionGroup("Forms").get()` | Admin | Agregado admin |
| E | `actions/admin-social-feedback.ts:33/47` | `collectionGroup("Surveys"/"Forms").get()` | Admin (`/social`) | Agregado admin (débito já anotado no PR #147) |
| F | `actions/users-admin.ts:43/227` | `collectionGroup("User_Permissions")` | Admin (Gestão de Usuários) | Lista admin |

Nota: `admin-fs.ts:255` e `admin-fs.ts:198` já filtram por `formId`/config (`where`) — custo
proporcional ao instrumento, não à base; menos urgentes (só falta índice/paginação se um
instrumento tiver muitas respostas).

## 2. Custo projetado a 10k usuários (ordem de grandeza)

- **A (networking):** 10k leituras **por abertura** da aba. Se 100 membros abrem 3×/dia →
  **~30.000 leituras/dia só de networking** — ~60% da cota diária, jogando fora ~95% dos docs
  (só os visíveis interessam). É o maior risco e o mais fácil de estourar a cota.
- **B–E (agregados admin):** `collectionGroup("Surveys")` com 10k usuários × N surveys cada =
  **dezenas a centenas de milhares de leituras por visita** ao painel. **Uma única visita** ao
  painel de F&S/analytics pode estourar a cota diária.
- **F (lista de usuários admin):** 10k leituras por abertura da Gestão de Usuários.

**Conclusão:** a 10k, tanto o member-facing (A) quanto os agregados admin (B–E) são inviáveis
como estão. A e B–E têm remédios diferentes.

## 3. Estratégia por tipo (o remédio certo para cada classe)

- **Agregados que não precisam ser tempo-real (B, C, D, E):** **pré-calcular 1×/dia** e a tela
  ler o snapshot pronto. Custo por visita cai de **O(usuários)** para **1 leitura**. Reaproveita
  a coleção **`Admin_Metrics_Daily`** do EXP-01 (o mesmo job serve os dois). Um número de "ontem"
  é aceitável para analytics; onde a Gestora quiser "agora", há um botão "recalcular" manual.
- **Listas navegadas (A networking, F usuários admin):** **paginar** (cursor `startAfter` + `limit`)
  — carrega N por vez. Para **A (networking)**, além de paginar, **filtrar no banco** por
  visibilidade (`where("profile.networking.networking_visibility","==",true)`) + **índice** — hoje
  o código lê tudo e filtra no client de propósito ("evita índice"); a 10k esse trade-off inverte.
  Alternativa mais rápida (e mais peças): uma coleção **projetada `Networking_Directory`** só com os
  perfis visíveis, mantida em sync — decidir na Fase 1.
- **Queries já filtradas (`admin-fs.ts:255/198`):** garantir **índice composto** e paginar se um
  instrumento tiver volume alto. Baixa prioridade.

## 4. Restrições (verificar antes de codar)

- **Cron do Hobby — 1 slot já em uso.** `vercel.json` já tem **1 cron**
  (`/api/cron/sync-agenda`, `0 6 * * *`). O Hobby limita crons (e a 1×/dia). O snapshot de
  métricas **não pode** ser um 2º cron diário livremente — a saída é **compartilhar o slot**:
  o mesmo handler diário roda o sync **e** o snapshot (ou um `/api/cron/daily` que orquestra os
  dois). **Decisão da Gestora necessária.**
- **Fuso do cron é UTC** (Lição 39): `0 6 * * *` = **3h BRT**. Manter.
- **Medir antes de automatizar** (Lição 38): antes de ligar o snapshot no cron, medir o custo do
  job (leituras/escritas) e confirmar que cabe na cota somado ao sync (~1.947 leituras + 798
  escritas por sync).
- **Sem `firestore.indexes.json` no repo.** O índice do filtro de networking precisa ser criado
  (arquivo de índices commitado **ou** console) — **decisão**: preferir o arquivo commitado
  (versionado, reproduzível).
- **Idempotência + best-effort** (Lição 40): o snapshot é reconciliação (recalcula do zero) —
  sobrevive a execução duplicada; falha do snapshot não invalida o sync (try/catch isolado).

## 5. Fases (ordem por risco: member-facing primeiro)

| Fase | Escopo | Entrega |
|---|---|---|
| **T1-0** | Medição: rodar um diagnóstico read-only que conta docs de `User`, `Surveys`, `Forms`, perfis de networking visíveis — números reais da base hoje + projeção a 10k | script `scratch/` descartável + tabela de custo |
| **T1-1 (CRÍTICO)** | **Networking (A):** filtrar por visibilidade no banco + índice + paginação (ou `Networking_Directory` projetado, se a Gestora preferir). Member-facing, maior risco | branch+PR |
| **T1-2** | **Snapshot diário dos agregados admin (B–E):** `getAdminKpis`/analytics passam a ler `Admin_Metrics_Daily`; job de agregação **compartilha o cron** do sync; botão "recalcular" manual. Casado com EXP-01 Fase 2 | branch+PR + `vercel.json` |
| **T1-3** | **Paginação da lista de usuários admin (F)** + índices das queries filtradas (`admin-fs.ts`) | branch+PR |

## 6. Decisões pendentes da Gestora (destravam o plano)

1. **Networking (T1-1):** filtro+índice+paginação (mais simples, 1 coleção) **ou** coleção
   projetada `Networking_Directory` (leitura mais barata, mais peças a manter)? _Recomendo começar
   por filtro+índice+paginação; denormalizar depois só se ainda pesar._
2. **Cron (T1-2):** OK **compartilhar o slot** do cron diário (um handler faz sync + snapshot),
   dado o limite do Hobby? _Recomendo sim._
3. **Ordem:** confirmar começar pela **T1-1 (networking, member-facing)** — é o maior risco a 10k.
4. **Relação com EXP-01:** o snapshot `Admin_Metrics_Daily` é a mesma infra do EXP-01 (represado
   pós-auditoria). Fazer o snapshot no T1-2 **adianta** parte do EXP-01 — OK, ou manter separado?

## 7. Restrições e validação (regras da máquina)

- Área sensível (padrão de acesso a dado em produção) — **este documento é o plano**; cada fase
  vira branch+PR próprio, com plano de custo confirmado antes de ligar cron/índice.
- Branch+PR, squash, deploy de produção confirmado após o merge; depois `main` ff-only + deletar
  branch + atualizar `BUGS.md`/`00-PLAN.md`/`LOG.md`/`DASHBOARD.md`.
- Validar: eslint dos arquivos tocados + test + type-check + build. Zero emoji/any, acentos PT-BR.
- Medição sempre por diagnóstico read-only antes de mudar padrão de acesso (Lição 38).

## 8. Estado

| Etapa | Estado |
|---|---|
| Autorização + escala (10k) | **Concluída (Gestora, 2026-07-22)** |
| Inventário dos hotspots | **Concluído (2026-07-22)** — ver seção 1 |
| Plano + estratégia + fases | **Concluído (proposta acima)** |
| Decisões da Gestora (seção 6) | **Pendentes** |
| Execução (T1-0..T1-3) | **Não iniciada** — aguarda decisões |
