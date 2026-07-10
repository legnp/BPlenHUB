# Design — Subsistema de Contratos (BPlen HUB)

> Documento de design da reconstrução do subsistema de contratos, originado do
> BUG-022 (contrato retroativo) expandido pela Gestora em 2026-07-09 para um
> "universo completo de contratos" (itens a–f abaixo). Fonte de verdade do
> **desenho**; o status de execução vive em `00-PLAN.md`/`BUGS.md`/`LOG.md`.
> Mesmo método do `ACCESS-MODEL-DESIGN.md`: desenho → aprovação → PRs por fase.
> **Área sensível** (financeiro + identidade + jurídico) — cada fase é gated.

## 0. Princípio-guia

Um **contrato** deixa de ser um efeito colateral do checkout (um PDF jogado no Drive
+ um flag booleano) e passa a ser uma **entidade de primeira classe com ciclo de vida
de assinatura** (`pendente_assinatura → em_retificacao → assinado`), vinculada a uma
matrícula + serviço/pacote, com documento visualizável **dentro do HUB**, rastreada
para validade jurídica (IP + timestamp + hash), e administrável (liberar, retificar,
anexar nota fiscal, evitar duplicidade).

## 1. Estado atual (levantado por leitura de código, 2026-07-09)

O fluxo de contrato hoje está **fragmentado e parcialmente quebrado**. Mapa real:

### 1.1 Lojas de dados (fragmentadas)
| Store | Escrito por | Lido por | Observação |
|---|---|---|---|
| `User_Orders` (raiz) | checkout (`bplen_free_bypass`), webhook MP, retroativo (`retroactive_bypass`) | painel `/hub/membro/contratos` (`getUserOrdersAction`) | **loja real** de pedidos |
| `User/{uid}/Orders` (subcoleção, legada) | **nenhum escritor conhecido** | `legal.ts:getPendingContracts` + lookup de order no `generateContractPdf` | **morta** — o gate de contrato lê daqui |
| `User/{uid}/Legal_Audits` | `generateContractPdf` (URL do Drive + hash + IP) | `admin/users` (via `getUserLegalAudits`) | **não** exibida no painel do membro |

### 1.2 Bugs estruturais confirmados por leitura
- **[CRÍTICO latente] `generateContractPdf` lê a coleção errada:** `legal.ts:63/100`
  usa `collection("Products")` (maiúsculo), mas o canônico é `products` (minúsculo,
  `PRODUCTS_COLLECTION`). Firestore é case-sensitive → `productDoc.exists` é falso →
  `throw "Produto não encontrado"`. A **geração de PDF do contrato quebra** tanto no
  retroativo (`retroactive-contract.ts:75`) quanto no `ContractGateModal:35`.
  **[A VERIFICAR EM PRODUÇÃO]** — a Gestora pode ter visto "Ordem criada, mas falha ao
  gerar PDF". → `BUG-051`.
- **Gate de contrato inerte:** `ContractGateModal` lê `getPendingContracts`, que
  consulta a subcoleção legada `User/{uid}/Orders` (sem escritor) → sempre vazia → o
  gate provavelmente **nunca** apresenta pendências. → `BUG-055`.
- **Documento não visualizável no HUB (item e):** tanto a tela de checkout
  (`/hub/checkout/success` / sucesso) quanto a de retroativo dizem "o PDF está no seu
  Google Drive" e citam o contrato, mas **não exibem o texto do documento nem um link
  direto** para vê-lo/baixá-lo. → `BUG-052`.
- **Painel básico (item d):** `/hub/membro/contratos` mostra **status de pagamento**
  (`StatusBadge`: "Aguardando Pagamento"/"Liberado no HUB"/...), não de **assinatura**;
  sem link do documento, sem nota fiscal; botão de aprovado aponta para
  `/hub/membro/dashboard` (**rota inexistente**, mesmo defeito do BUG-046). → `BUG-053`.
- **IP hardcoded (item f):** `legal.ts:176` grava `ipAddress: "Registrado pelo Gateway"`
  — placeholder, sem o IP real do cliente na assinatura. → `BUG-054`.

### 1.3 Retroativo (BUG-022, endurecer — itens a/b/c)
`/contrato-retroativo/[slug]` + `processRetroactiveContractAction` (`requireAuth`):
o admin **copia o link** em `admin/users` e envia ao cliente; o cliente logado gera
uma order `status:"approved"` `gateway:"retroactive_bypass"` + PDF + `Legal_Audits`.
Fragilidades: (a) sem checagem de **duplicidade** (gera 2º contrato do mesmo serviço
sem avisar); (b) **não vinculado à conta** — qualquer logado (qualquer e-mail) com a
URL gera para si; (c) link **não é único nem de uso único** — reutilizável/adivinhável.

### 1.4 O que já existe e serve de base (reusar)
- `createContractBuffer` (`legal.ts`): PDF completo de 9 cláusulas (partes, escopo,
  regras, valor, cancelamento, metodologia, obrigação de meio, trava de versão, aceite
  clickwrap MP 2.200-2/2001). **Bom** — só precisa da fonte de produto certa + IP real.
- Upload ao Drive por matrícula (`2.2.B2C`/`2.3.B2B` → matrícula → `2.Documentos`).
- Hash SHA-256 do documento.
- Aceite clickwrap (checkbox de termos) nas duas telas.

## 2. Modelo-alvo (itens a–f da Gestora)

| Item | Requisito | Vira |
|---|---|---|
| a | Ao consultar no admin, avisar se **já existe contrato** do mesmo serviço p/ o cliente (evita duplicidade); seguir só se for **retificação** | checagem de duplicidade + estado `em_retificacao` |
| b | Contrato só acessível pela **conta específica** liberada pelo admin (logado nela; não por outro e-mail nem deslogado) | vínculo `matricula`+token; guard de dono no acesso ao documento |
| c | Link de geração **único e de uso único** por cliente | token de convite de contrato (1 uso, expira, atado à matrícula) |
| d | Painel: **1 card por serviço/pacote** com status real (pendente_assinatura / em_retificacao / assinado), resumo, timestamp, botões (página do serviço, ver documento, assinar, termos assinados) + **nota fiscal** anexável (admin/automação) | painel de contratos reescrito sobre a entidade nova |
| e | **Visualizar o documento do contrato** dentro do HUB (não só "veja no Drive") | viewer in-app (PDF embed/stream) + download |
| f | **Validade jurídica**: capturar **IP** na assinatura (+ ajustes que a Gestora indicará) | IP real + timestamp + hash no registro de assinatura |

### 2.1 Entidade de contrato (proposta)
Subcoleção soberana `User/{matricula}/Contracts/{contractId}` (dado sensível fora de
raiz, conforme `CLAUDE.md`). Campos (proposta a validar):
- `contractId`, `matricula`, `serviceCode`/`productSlug`, `productTitle`
- `status`: `pendente_assinatura | em_retificacao | assinado | cancelado`
- `origin`: `checkout | retroativo`
- `orderId` (→ `User_Orders`)
- `documentUrl` (Drive) + `documentHash` + `documentVersion`
- `signature`: `{ signedAt, ip, userAgent, consentText }` (preenchido só na assinatura)
- `invoice`: `{ url, uploadedAt, uploadedByAdmin }` (opcional)
- `accessToken` (retroativo): hash do token de uso único, `consumedAt`, `expiresAt`
- timestamps (`createdAt`/`updatedAt`) via `serverTimestamp` (F0-02)

O `Legal_Audits` atual é absorvido por este modelo (migração leve; poucos registros).

## 3. Roadmap por fases (cada fase = 1 PR gated, com plano + aprovação)

Ordenado por **risco decrescente de "quebrado hoje"** e dependência.

- **CT-0 — Correção da geração do PDF. ✅ FEITO (PR #49).** `generateContractPdf`
  reescrito: resolve a matrícula via `_AuthMap/{uid}` (docs de User são chaveados por
  matrícula, não uid), lê o produto de `products` (minúsculo, antes `Products`), o
  contratante de `User/{matricula}.profile`, a order de `User_Orders`, e grava
  `Legal_Audits` sob a matrícula. Fecha `BUG-051`. **BUG-051 confirmado em produção**
  antes do fix (erro "Produto não encontrado" no retroativo). **Escopo narrado:** o
  `getPendingContracts`/gate (`BUG-055`) **não** foi tocado — mudar a fonte de dados do
  gate tem risco comportamental (poderia passar a bloquear membros); movido para a fase
  da entidade/gate (CT-1/CT-4). Validação funcional em produção (BUG-030).
- **CT-1 — Entidade de contrato + status + IP real. ✅ FEITO (PR #50).** Novo tipo
  `Contract` (`src/types/contracts.ts`) com ciclo `pendente_assinatura → em_retificacao
  → assinado → cancelado`. `generateContractPdf` captura o **IP real** + user-agent via
  `headers()` (fecha `BUG-054`, item f) e grava `User/{matricula}/Contracts/{contractId}`
  com status `assinado` (id determinístico por serviceCode/slug — base do aviso de
  duplicidade do CT-2; re-assinatura atualiza o mesmo doc, preserva createdAt). `origin`
  (checkout/retroativo) registrado. `Legal_Audits` mantido transitório (consolidado no
  CT-4). **Escopo:** criação de `pendente_assinatura` no checkout e transição
  `em_retificacao` pelo admin ficam para CT-2/CT-4.
- **CT-2 — Retroativo robusto (itens a/b/c).** Token de convite de uso único atado à
  matrícula (gerado pelo admin em `admin/users`), guard de dono, aviso de duplicidade
  no admin (item a). `/contrato-retroativo/[slug]` passa a exigir token válido +
  sessão da conta certa. Fecha/endurece `BUG-022`.
- **CT-3 — Visualização do documento no HUB (item e).** Viewer in-app (stream/embed do
  PDF) + download nas telas de contrato (checkout, retroativo) e no painel. Fecha
  `BUG-052`.
- **CT-4 — Painel de contratos reescrito (item d).** 1 card por serviço/pacote com
  status de assinatura, resumo, timestamp, botões (serviço, documento, assinar,
  termos), atalho de assinatura para pendentes, e **anexo de nota fiscal** (upload via
  admin + consulta/download pelo cliente). Corrige o link morto `/hub/membro/dashboard`.
  Fecha `BUG-053`.
- **CT-5 — Reforços jurídicos adicionais (item f, sob demanda).** Ajustes técnicos que
  a Gestora indicará (além do IP): ex. carimbo de tempo confiável, versionamento de
  cláusulas, trilha de auditoria consultável.

## 4. Riscos e princípios
- **Financeiro/identidade/jurídico** — cada fase com plano + aprovação; validação de
  telas logadas em **produção** (BUG-030 — preview não autentica).
- **Sem migração destrutiva:** poucos registros de contrato hoje; migração de
  `Legal_Audits` → `Contracts` é aditiva, com backup (padrão dos scripts locais).
- **Reusar** o `createContractBuffer` (9 cláusulas) e o pipeline de Drive/hash — não
  reescrever o documento jurídico, só corrigir a fonte de dados e o registro.
- **Verificar em produção antes de codar o CT-0:** confirmar se `Products` (maiúsculo)
  de fato não existe (por isso a geração falha) — é a hipótese de leitura.

## Registro de revisões
- 2026-07-09 — criação, a partir da investigação read-only do universo de contratos
  (checkout público/membro, retroativo, `legal.ts`, painel `/hub/membro/contratos`,
  `ContractGateModal`, `admin/users`) e da expansão do BUG-022 pela Gestora (itens a–f).
