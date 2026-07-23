# Design — T-01: Performance / Custo de Leitura (BPlen HUB)

Plano do track de performance da auditoria (`00-PLAN.md`), no padrão de
`AGENDA-SYNC-DESIGN.md` / `CONTRACTS-DESIGN.md` / `ACCESS-MODEL-DESIGN.md`.

**Autorizado pela Gestora (2026-07-22)** com a escala-alvo: **~10.000 usuários**.
**Revisado (2026-07-23):** incorporados os **contadores nativos** do Firestore e a
estrutura de **dois momentos** (otimizar na infra atual agora; afinar a infra no
futuro com o plano Blaze + possíveis provedores externos).

---

## 0. Por que agora + os dois momentos

- **Escala-alvo: ~10.000 usuários** (Gestora). Vários caminhos leem "a base inteira" por
  visita — custo **O(usuários)** por tela.
- **Plano Spark/Hobby:** cota gratuita de **~50.000 leituras/dia**. O projeto **já teve 2 apagões
  de cota** (agenda, `BUG-087`). No gratuito, estourar a cota **derruba** a funcionalidade.
- **Decisão de negócio (Gestora, 2026-07-23):** o **plano Blaze** (pago, paga-por-uso) **será
  adquirido no futuro**. A auditoria **deixa o terreno preparado** para ele — não implementa o
  Blaze agora, mas estrutura o código/dados de forma que a migração seja suave e o custo, controlado.

**Estrutura em dois momentos (registrada por decisão da Gestora):**

- **MOMENTO 1 — otimizar as leituras na infra ATUAL (agora, dentro da auditoria).**
  Objetivo: **sobreviver à cota gratuita** e **preparar o terreno** para o Blaze. Sem serviço novo,
  sem custo novo. Usa o que o Firebase já oferece: **contadores nativos**, **paginação**,
  **filtro + índice** e **snapshot diário** só onde for necessário.
- **MOMENTO 2 — afinar a INFRA no futuro (pós-auditoria, quando o Blaze for adquirido).**
  Objetivo: **escala e conforto de custo**. Ativar o **Blaze** (remove o risco de apagão; leituras
  passam a custar, não derrubar) e, **se a escala exigir**, **provedores externos** de busca/analytics
  (ex.: Algolia/Meilisearch para o diretório; BigQuery para relatórios pesados). O trabalho do
  Momento 1 torna isso incremental, não uma reescrita.

> **Princípio:** o Momento 1 controla custo **tanto no gratuito quanto no pago** — nada dele é
> jogado fora quando o Blaze chegar. O Blaze relaxa o teto; o Momento 1 evita o desperdício.

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
proporcional ao instrumento, não à base; menos urgentes.

## 2. Custo projetado a 10k usuários (ordem de grandeza)

- **A (networking):** 10k leituras **por abertura** da aba, jogando fora ~95% (só os visíveis
  importam). Se 100 membros abrem 3×/dia → ~30.000 leituras/dia — ~60% da cota gratuita.
- **B–E (agregados admin):** `collectionGroup("Surveys")` × 10k usuários × N surveys = **dezenas a
  centenas de milhares de leituras por visita**. **Uma única visita** pode estourar a cota.
- **F (lista de usuários admin):** 10k leituras por abertura.

---

## 3. MOMENTO 1 — otimizar na infra atual (estratégia por tipo)

O remédio certo depende do que a tela precisa. Três padrões, do mais barato ao mais pesado:

### 3.1 Contadores nativos do Firestore (`count` / `sum` / `average`) — PRIMEIRA escolha para números

O Firestore tem **agregações no servidor**: em vez de ler os N documentos, devolve **só o
resultado**, cobrando **~1 leitura a cada 1.000** documentos casados (mínimo 1). Contar 10.000
respostas ≈ **10 leituras**, **em tempo real**, sem cron nem snapshot.

- **Onde aplica (a maioria dos agregados B–E):** "quantas surveys respondidas", "quantos forms",
  "quantos usuários por papel", "nota média (`average`) das avaliações", "total (`sum`) de X".
  Troca `collectionGroup(...).get()` (lê tudo) por `collectionGroup(...).count()/.aggregate(...)`.
- **Prós:** barato (~1000× menos), **tempo real** (não é "de ontem"), menos código, sem cron.
- **Limite:** só expressa contagem/soma/média sobre uma query indexável. Cruzamentos e distribuições
  arbitrárias (lógica por documento em código) **não** cabem — esses caem no snapshot (3.3).
- **Requer:** índice para a query agregada (single-field costuma bastar; composto se houver `where`).

### 3.2 Paginação + filtro no banco (para LISTAS navegadas: A networking, F usuários)

Carregar **N por vez** (`limit` + cursor `startAfter`), não a base inteira. Para o **networking**,
além de paginar, **filtrar a visibilidade no banco** (`where("profile.networking.networking_visibility",
"==", true)`) + índice — hoje lê tudo e filtra no client de propósito ("evita índice"); a 10k esse
trade-off inverte. (Denormalizar num `Networking_Directory` fica para o Momento 2, se a busca/escala
exigir.)

### 3.3 Snapshot diário (`Admin_Metrics_Daily`) — só para o que 3.1 não expressa

Para **agregados complexos** (distribuições, cruzamentos) **e** para a **série histórica** (tendência
ao longo do tempo, que o EXP-01 vai querer): **pré-calcular 1×/dia** e a tela ler o snapshot. Mesma
coleção/infra do **EXP-01** (o job serve os dois). Onde a Gestora quiser "agora", um botão "recalcular".

> **Resumo do Momento 1:** número simples → **contador nativo** (3.1); lista → **paginação + filtro**
> (3.2); agregado complexo / série histórica → **snapshot diário** (3.3). O snapshot deixa de ser o
> padrão (como estava na 1ª versão) e vira exceção — o grosso vira contador nativo, mais barato e real.

---

## 4. MOMENTO 2 — afinar a infra no futuro (pós-Blaze)

Não se implementa agora — **fica documentado como terreno preparado** para quando a Gestora adquirir o
Blaze e/ou a escala exigir.

- **Plano Blaze (paga-por-uso):** remove o teto que **derruba** o sistema — leituras passam a **custar**,
  não a causar apagão. Habilita: cron mais frequente que 1×/dia (o snapshot poderia rodar de hora em
  hora se desejado), mais funções, sem o medo do apagão. **Os ajustes do Momento 1 continuam valendo**
  (controlam a conta) — o Blaze só troca "sobrevivência" por "custo gerenciável".
- **Provedores externos (se a escala exigir):**
  - **Busca do diretório em escala** (networking com muitos perfis, busca por texto/filtros ricos):
    **Algolia / Meilisearch / Typesense** — índice de busca externo, sincronizado a partir do Firestore.
  - **Relatórios/analytics pesados:** **BigQuery** (extensão de export do Firebase) — tira a analytics
    do Firestore e roda em um motor feito para isso.
  - **Cache** (Redis/Upstash) para leituras quentes repetidas.
- **Gatilho:** só migrar para cada provedor externo **quando o número real** (medido) mostrar que o
  padrão do Momento 1 não basta — evita custo/complexidade prematuros.

---

## 5. Restrições (verificar antes de codar)

- **Cron do Hobby — 1 slot já em uso.** `vercel.json` tem 1 cron (`/api/cron/sync-agenda`, `0 6 * * *`
  = 3h BRT, fuso UTC — Lição 39). O snapshot (3.3) **compartilha esse slot** (o mesmo handler faz sync
  + snapshot) enquanto for Hobby. **No Momento 2 (Blaze)** essa restrição cai. **Decisão da Gestora.**
- **Contadores nativos precisam de índice** (single-field costuma ser automático; composto se houver
  `where`). **Sem `firestore.indexes.json` no repo** → criar os índices necessários (preferir arquivo
  commitado, versionado).
- **Medir antes de automatizar** (Lição 38): diagnóstico read-only da base real antes de mudar padrão.
- **Idempotência + best-effort** (Lição 40): snapshot é reconciliação (recalcula do zero); falha do
  snapshot não invalida o sync (try/catch isolado).

## 6. Fases (Momento 1; ordem por risco — member-facing primeiro)

| Fase | Escopo | Entrega |
|---|---|---|
| **T1-0** | Medição: diagnóstico read-only contando `User`, `Surveys`, `Forms`, perfis de networking visíveis — números reais hoje + projeção a 10k | script `scratch/` descartável + tabela de custo |
| **T1-1 (CRÍTICO)** | **Networking (A):** filtrar visibilidade no banco + índice + paginação | branch+PR (+ índice) |
| **T1-2** | **Agregados admin (B–E) → contadores nativos** (`count`/`sum`/`average`) onde couber; **snapshot diário** só para os complexos + série histórica (compartilha o cron; casado com EXP-01 Fase 2) | branch+PR (+ `vercel.json` se snapshot) |
| **T1-3** | **Paginação da lista de usuários admin (F)** + índices das queries filtradas (`admin-fs.ts`) | branch+PR |

## 7. Decisões da Gestora

- **Estrutura em 2 momentos + Blaze futuro + provedores externos na escala:** **DECIDIDO
  (2026-07-23)** — documentado acima. Blaze será adquirido no futuro; a auditoria prepara o terreno.
- **Decisões para iniciar o Momento 1 — TODAS APROVADAS pela Gestora (2026-07-23):**
  1. **Networking (T1-1):** filtro+índice+paginação agora (denormalização/`Networking_Directory` só no
     Momento 2 se a busca exigir). **APROVADO.** _Forma da paginação decidida na execução (2026-07-23):
     filtro+índice+teto agora; o controle "carregar mais" (padrão visual member-facing novo) fica casado
     ao `Networking_Directory` do Momento 2 — a busca substring só pagina de verdade com o diretório._
  2. **Cron (T1-2):** OK o snapshot compartilhar o slot do cron diário enquanto Hobby. **APROVADO.**
  3. **Ordem:** começar pela **T1-1 (networking, member-facing)**. **APROVADO.**
  4. **EXP-01:** OK adiantar a camada de snapshot/contadores da infra do EXP-01 (não a tela do
     dashboard). **APROVADO.**

## 8. Restrições e validação (regras da máquina)

- Área sensível (padrão de acesso a dado em produção) — **este documento é o plano**; cada fase vira
  branch+PR próprio, com medição de custo confirmada antes de ligar cron/índice.
- Branch+PR, squash, deploy confirmado; depois `main` ff-only + deletar branch + atualizar
  `BUGS.md`/`00-PLAN.md`/`LOG.md`/`DASHBOARD.md`. eslint dos tocados + test + type-check + build.
  Zero emoji/any, acentos PT-BR.

## 9. Estado

| Etapa | Estado |
|---|---|
| Autorização + escala (10k) | **Concluída (Gestora, 2026-07-22)** |
| Inventário dos hotspots | **Concluído (2026-07-22)** |
| Estrutura 2 momentos + Blaze futuro + externos | **Decidida e documentada (2026-07-23)** |
| Plano do Momento 1 (contadores nativos + paginação + snapshot) | **Concluído (proposta acima)** |
| Decisões da Gestora para iniciar (seção 7, itens 1-4) | **APROVADAS (2026-07-23)** |
| **T1-0 — medição** | **Concluída (2026-07-23)** — diagnóstico read-only descartável (apagado). Base viva: 6 `User` (2 visíveis, `boolean:true`, **sem drift**), 1 `Partner` ativo, 49 `Surveys`, 5 `Forms`, 9 `User_Permissions`. Confirmado: `where(visibility==true)` casa o mesmo conjunto que o filtro truthy anterior (Licao 34); as queries da T1-1 (equality + `limit`, incl. composta vis&pro) **não exigem índice composto** — sem `firestore.indexes.json` necessário. |
| **T1-1 — networking (hotspot A, CRÍTICO)** | **Concluída — PR #158 (`45cf291`), deploy de produção confirmado (2026-07-23).** `getNetworkingDataAction` filtra visibilidade/profissional/`isActive` **no banco** (antes: full scan `User`/`Partners` + filtro client-side) + teto de leitura anti-runaway (`NETWORKING_READ_CAP=500`, com log). Contrato do client inalterado. O load-more real fica para o Momento 2 (com o `Networking_Directory`). |
| T1-2 — agregados admin (B–E) → contadores nativos + snapshot | **Não iniciada** (próxima). |
| T1-3 — paginação lista de usuários admin (F) + índices `admin-fs.ts` | **Não iniciada.** |
