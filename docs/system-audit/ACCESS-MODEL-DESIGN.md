# Design — Modelo Modular de Acesso a Serviços e Escopos (BPlen HUB)

> Documento de design consolidado da reestruturação de acesso/entitlements,
> aprovada pela Gestora em 2026-07-07. Fonte de verdade do **desenho**; o status
> de execução vive no `00-PLAN.md`/`BUGS.md`/`LOG.md`. Origem: investigação do
> `BUG-035` (revogação de acesso de membro não surtia efeito) que revelou uma
> confusão estrutural de conceitos, resolvida pela clarificação do modelo pela
> Gestora.

## 0. Princípio-guia

**Tudo vira atributo de dados** (do serviço, do pacote, do usuário). O "motor" que
decide acesso é uma função pura que **nunca muda** quando um serviço/pacote novo é
criado — só se descrevem os atributos. É isso que dá escalabilidade e resiliência.

**Restrição de configuração (crítica):** nesta versão não há UI admin para
estruturar serviços/pacotes/cupons. Toda config comercial/operacional vem dos
**Google Docs/Sheets** (`anuncios_bplen`, `campanhas_bplen`, `portfolio_bplen`) +
codificação direta, e o sistema **transaciona com Word/Excel**. Logo, **todo campo
novo** exige, em conjunto: (1) definir onde entra nesses Docs/Sheets, (2) atualizar
o código de sync/parse, (3) revisar a geração de Word/Excel que consome dados do
serviço. Nenhuma alteração de modelo é "só o tipo TS".

## 1. As três sub-áreas da área logada

| Área | Quem acessa | Regras |
|---|---|---|
| **`/hub`** | qualquer pessoa **logada** | camada geral; **todo checkout acontece aqui** (exige login, não exige selo); pode entregar serviços de público geral (ex.: posicionamento/junior) |
| **`/hub/membro`** | só quem tem o **selo de membro** (`member_area_access`) | o "clube" exclusivo. Selo concedido por **qualquer item comprável com `concedeSelo`** (serviço avulso **ou** pacote) **ou** por atribuição manual do admin |
| **`/admin`** | só quem tem selo **admin** | admin **não é membro** (não herda a área de membro); pode também ser membro (selos coexistem). Guard server-side já feito (F0-05) |

**Revogação:** tirar o selo de membro (ou admin) → a pessoa cai para **`/hub`**
apenas (a menos que **banida** → nada). Esse é o comportamento-alvo do `BUG-035`.

## 2. Modelo de atributos

### 2.1 Item comprável (serviço avulso OU pacote)
- `concedeSelo: boolean` — comprar este item dá o selo de membro? (junior/posicionamento = **não**; pacotes de clube e serviços de clube = **sim**). **Não é exclusivo de pacote** — serviço avulso também pode conceder.
- `libera: string[]` — (pacotes) quais serviços/etapas o pacote entitla. **Configurável** — hoje os pacotes liberam posicionamento; um pacote futuro pode não liberar.
- `sku`/código fiscal — ver §5 (Trilha 2, fiscal).

### 2.2 Etapa/Serviço (a "coisa" acessada)
- `escopo: "public" | "member"` — entregue em `/hub` ou `/hub/membro`.
- `preRequisitos: { modo: "nenhum" | "todos" | "qualquer", etapas: string[] }` — condição de liberação (substitui o sequence-lock hardcoded).
- `exigeElegibilidade?: boolean` — se true, aciona o workflow de avaliação de elegibilidade (§6) como caminho de liberação.

### 2.3 Estado do usuário
- `entitlements` — serviços/etapas que a pessoa possui (de compra + pacote + admin). Hoje disperso em `services` (mistura slug de produto + selo + flags de capability) — a **normalizar** (Trilha 3b + Fase A).
- `selo` (`member_area_access`) — booleano.
- `conclusões` — etapas concluídas (já existe: `JourneyProgress`).
- `dispensaPreRequisito: string[]` — **novo**. Waiver por serviço, concedido pelo admin (manual) ou pelo workflow de elegibilidade (§6). O motor pula o pré-req quando presente.

### 2.4 Serviço ≠ Feature ≠ Gatilho (clarificação da Gestora, 2026-07-08)

Três conceitos que hoje estão **conflados** dentro do mesmo mapa `services` e que o
modelo deve separar de forma explícita (achado durante a Trilha 3b, ao investigar o
`career_planning`):

| Conceito | O que é | Exemplo | Onde vive hoje |
|---|---|---|---|
| **Serviço / etapa** | a "coisa" comprada/entregue (um `BPL-xxx`) | Plano de Carreira (BPL-003) | `products` + chave em `services[slug]` |
| **Feature / capability** | um recurso do HUB que um serviço **libera** | módulo Gestão de Carreira (`career_planning`) | flag booleana solta em `services` |
| **Gatilho** | **quando** a feature libera | "ao concluir um checkpoint do Plano de Carreira" | **não modelado** — hoje é toggle admin manual (`toggleCareerPlanningAccessAction`) |

**Caso concreto (`career_planning`):** é a feature "Gestão de Carreira", **condicionada
a um checkpoint do serviço Plano de Carreira** (BPL-003). Intenção da Gestora: quando o
membro conclui esse checkpoint, a feature abre sozinha. **Hoje** isso é um toggle admin
manual — o gatilho automático **não existe como dado**. Por isso, na Trilha 3b, só
`BP-005` tinha `career_planning=true` (é o único que chegou ao checkpoint); os demais
não. **Decisão: `career_planning` NÃO é apelido de `plano-de-carreira`** (o design
antigo assumia isso, erroneamente) — são um serviço e uma feature distintos, e foram
mantidos separados.

**Lacuna de modelo (candidata a fase futura):** dar à feature um atributo declarativo
do tipo `liberadaPor: { servico: "BPL-003", checkpoint: "<id>" }`, para o motor abrir a
capability por conclusão de checkpoint — em vez do toggle manual. Não implementado
agora (não bloqueia a reestruturação); registrado aqui para não se perder. Relaciona-se
com o workflow de elegibilidade (§6), que é o mesmo padrão "conclusão de etapa → grava
entitlement/waiver".

## 3. Regras canônicas da jornada (aprovadas)

Ordem corrigida (**posicionamento é a etapa 1, antes do onboarding**). Os produtos
`active` `BPL-000..006` já refletem esta ordem — são a **fonte de verdade** da
jornada (o `steps-registry.ts` legado é aposentado/reconciliado — `BUG-043`).

| # | Etapa (produto) | escopo | pré-requisito |
|---|---|---|---|
| 1 | Posicionamento de Carreira (`posicionamento-profissional`, BPL-001) | **público** | nenhum |
| 2 | Onboarding (BPL-000) | membro | nenhum |
| 3 | Análise Comportamental (BPL-002) | membro | **onboarding** *(rev. Gestora 2026-07-08)* |
| 4 | Plano de Carreira (BPL-003) | membro | **análise comportamental** |
| 5 | Gestão e Desenvolvimento de Carreira / GDC (`gestao-e-desenvolvimento`, BPL-004) | membro | **plano de carreira** |
| 6 | MentoCoach (BPL-005) | membro | **onboarding** *(rev. Gestora 2026-07-08)* |
| 7 | Offboarding (BPL-006) | membro | **qualquer: [GDC, mentocoach]** (conforme contratado) |

Notas:
- **Compra de serviço avulso** = acesso **direto** ao serviço, sem cadeia de
  pré-req — exceto os que têm pré-req próprio (plano, GDC, offboarding acima).
- **Nomenclatura:** parar de usar **"DISC"** como sinônimo de "análise
  comportamental" em qualquer string/rótulo de interface (Trilha 4). "DISC" só
  onde for o portal/link externo real.

## 3.1 Valores recomendados da aba `Atributos` (referência de preenchimento)

Colunas: `serviceCode | serviceName | escopo | concedeSelo | preReqModo | preReqEtapas
| libera | sku | nbs | naturezaOperacao | descricaoFiscal`. `serviceName` é só leitura
humana (parser ignora). Fiscais podem ficar em branco por ora (provisionados).

| serviceCode | escopo | concedeSelo | preReqModo | preReqEtapas | libera |
|---|---|---|---|---|---|
| BPL-001 (Posicionamento) | **public** | FALSE | nenhum | | |
| BPL-000 (Onboarding) | member | FALSE | nenhum | | |
| BPL-002 (Análise Comportamental) | member | TRUE | todos | BPL-000 | |
| BPL-003 (Plano de Carreira) | member | TRUE | todos | BPL-000,BPL-002 | |
| BPL-004 (GDC) | member | TRUE | todos | BPL-000,BPL-003 | |
| BPL-005 (MentoCoach) | member | TRUE | todos | BPL-000 | |
| BPL-006 (Offboarding) | member | FALSE | qualquer | BPL-004,BPL-005 | |
| BPL-PAC-JR (Junior) | **public** | **FALSE** | nenhum | | BPL-001 |
| BPL-PAC-PL (Pleno) | member | TRUE | nenhum | | BPL-000,BPL-001,BPL-002 |
| BPL-PAC-SR (Senior) | member | TRUE | nenhum | | BPL-000,BPL-001,BPL-002,BPL-003 |
| BPL-PAC-LD (Líder) | member | TRUE | nenhum | | BPL-000,BPL-001,BPL-002,BPL-003,BPL-004 |
| BPL-PAC-EB (Embaixador) | member | TRUE | nenhum | | BPL-000,BPL-001,BPL-002,BPL-003,BPL-004,BPL-005 |

**Correção da Gestora (2026-07-07):** o **Pacote Junior (BPL-PAC-JR) é `public`,
não `member`** — é o pacote de não-membro (entrega o posicionamento em `/hub`); e
**não concede selo** (`concedeSelo=FALSE`), coerente com "junior é serviço para
não-membros". (Valores acima a confirmar/ajustar pela Gestora ao preencher a aba.)

## 4. O motor de decisão (função pura)

```
resolverAcesso(usuario, servico):
  1. Escopo:   se servico.escopo == "member" e !usuario.selo  -> PREVIA/BLOQUEADO
  2. Entitlement: se servico nao esta em usuario.entitlements -> UPSELL
  3. PreReq:   se servico.preRequisitos == nenhum             -> LIBERADO
               senao se usuario.dispensaPreRequisito inclui servico -> LIBERADO
               senao avalia preRequisitos (todos/qualquer) vs usuario.conclusoes
                     -> LIBERADO | SEQUENCE_LOCK
```
Criar serviço/pacote novo = preencher atributos. O motor e as telas não mudam.

## 5. Camada visual (card da jornada)

- Card sempre mostra a **trilha completa**.
- **Não-membro**: título do card ganha a tag **"prévia"**; posicionamento aparece
  como a parte pública **acionável**, o resto como prévia/bloqueado. Sem
  ambiguidade — é estado visual derivado do motor.

## 6. Workflow de "Avaliação de Elegibilidade" (dispensa de pré-req) — FASE FUTURA

É a forma concreta do `dispensaPreRequisito`. **Provisiona-se o campo + botão admin
manual na Fase A; o workflow completo é fase dedicada (E), depois da reestruturação
+ higiene** — porque reusa fortemente booking 1-to-1 + presença + devolutiva admin +
Drive + Resend, que não devem ser tocados durante o restructure.

Fluxo (genérico por slug, `/avaliacao_de_elegibilidade/[slug]`):
1. Admin libera (2 pontos: aba "Assessments / Devolutivas" em `admin/users` **ou**
   `/admin/fs/devolutiva`) → surge uma **prévia** em `/hub` → "Suas atividades no HUB".
2. Página simples: 1 upload + 1 texto longo + enviar. Após enviar, **imutável**;
   gera **id único**, retorna `id + timestamp + status`.
3. Guarda: subcoleção do `User/{matricula}` + pasta no Drive; dispara e-mail
   (cliente + BPlen) via Resend.
4. Estados admin: `em_avaliacao → {pausado | recusado | retificacao(reabre edição) |
   aprovado}`. Comentário **interno** (admin) e **externo** (cliente vê na página).
5. Após aprovado: task na mesma página = **agendar 1-to-1 "Alinhamentos gerais"**
   (motivo auto-preenchido, sem edição do cliente: "Alinhamentos gerais da aprovação
   de elegibilidade de {serviço}"). Card de agenda + ata aparece normalmente.
6. **Só com a presença dada** o processo conclui 100% → **grava o entitlement/waiver
   no modelo** (ponto único de integração) → serviço liberado.

Reuso (por isso não quebra): devolutiva admin (estende), booking 1-to-1 + presença,
Drive por usuário, Resend, o card "Suas atividades no HUB" (nova prévia condicional).

## 7. Higiene da base (Trilha 3) — achados do inventário 2026-07-07

Inventário read-only (`scripts/inventory-base.js`). 75 coleções-raiz; catálogo
**ativo já limpo e alinhado ao modelo** (5 pacotes + 7 etapas BPL-000..006).

- **BUG-040 — ~50 coleções de backup na raiz.** `products_backup_<ts>` ×26 +
  `coupons_backup_<ts>` ×24. **Fonte:** `products.ts:329-363` (Sync de portfólio)
  cria uma coleção-raiz nova por sync. **Decisão da Gestora:** manter os **3
  últimos**, mudar a fonte para **namespace único** (não coleção-raiz), **apagar o
  resto**.
- **BUG-041 — ~13 produtos legados/duplicados `archived`** (mentoria, coaching,
  desenvolvimento-* variantes, junior/pleno/senior soltos, primeiros-passos, 1-to-1,
  preparacao-de-carreira [duplicata do posicionamento], plano-embaixadores-bplen).
  Excluir **após** a migração de clientes.
- **BUG-042 — chaves de entitlement inconsistentes** (só ~4 clientes). Migração:
  - `plano_de_Carreira` (caixa errada) e `career_planning` → **`plano-de-carreira`**
    (canônico). `career_planning` é **lida por `career-module.ts`** → renomear
    dado **+ código** juntos.
  - `vLYKPTLII8tTP2Wo5wpV` (ID órfão como chave) → remover.
  - `plano-embaixadores-bplen` (×3) / `1-to-1` → produtos arquivados; decidir remap.
  - `content_premium` / `hub_community` / `survey_welcome` → **flags inertes**
    (ninguém verifica; `survey_welcome`/`hub_community` só gravadas no convite).
    **São booleanas, não guardam dado** — o dado real está nas subcoleções
    `Surveys`/`Forms` (verificado: só `BP-002` as tem, e tem 13 surveys + 1 form
    íntegros). **Remover na migração, sem perda de dado** (condição da Gestora
    atendida).
- **BUG-043 — `steps-registry.ts` divergente dos produtos.** Jornada passa a ser
  dirigida pelos produtos (`journey=sim` + `order` + `preRequisitos`); registro
  legado aposentado. (Decisão da Gestora: produtos = fonte única.)
- Cupons: v1 `marketing_coupons`(3) + v2 `coupon_batches`(3)/`coupons_v2`(65)/
  `redemptions`(1)/`acceptances`(1) + `coupons`(1) solto (candidato a limpeza).

## 8. Roadmap (cada fase = 1 PR com aprovação; áreas sensíveis)

0. **Mapa da base (Trilha 3a)** — ✅ feito (`inventory-base.js`).
1. **Fase A — Modelo de dados.** `escopo` + `concedeSelo` + `preRequisitos` +
   `libera` + `dispensaPreRequisito` (+ botão admin manual) **+ SKU/fiscal
   (Trilha 2)**. Reconciliar jornada→produtos (`BUG-043`). `checkout` concede o
   selo **condicional** (`concedeSelo`, hoje é incondicional em `checkout.ts:125`).
   **Coordenado com Docs/Sheets + Word/Excel** (§0).
2. **Fase B — Motor único de acesso** (`resolverAcesso`, §4). Substitui sequence-lock
   hardcoded + `isAdmin ||`.
3. **Fase C — Reposicionar** checkout `/hub/membro/checkout/*` → `/hub/checkout/*`
   (~8 refs) e posicionamento/junior como serviço público em `/hub`.
4. **Fase D — Trancar `/hub/membro`** (`layout.tsx` exige selo; sem selo → `/hub`;
   remover bypass `isAdmin ||`). **→ BUG-035 resolvido.**
5. **Trilha 3 — Higiene** (fonte de backup → migração clientes → excluir legados →
   apagar backups antigos). Cada passo com script LOCAL dry-run + backup + OK.
6. **Fase E — Workflow de elegibilidade** (§6).
7. **Trilha 4 — Nomenclatura "análise comportamental"** (remover "DISC" conflado).

## 9. Fase A — detalhe (mapa de acoplamento confirmado 2026-07-07)

### 9.1 Pipeline de config (Docs → Firestore) — onde cada campo novo ENTRA
Confirmado por leitura. Cadeia de 5 camadas; **adicionar 1 campo toca todas**:
1. **`portfolio_bplen.xlsx`** (fonte da Gestora, fora do repo) — nova célula/coluna.
2. **`scripts/portfolio_parser.py`** — lê o xlsx por **coordenadas de célula
   hardcoded por serviço** (`services_coords`; ex. BPL-001 `price_row=41`) + o
   `anuncios_bplen.docx` (descrições) → emite `portfolio_payload.json`.
   **FRÁGIL — ver `BUG-044`** (coords fixas, paths obsoletos `v3`, "DISC" embutido).
3. **`src/lib/validations/portfolio.ts`** — `ProductSchema` (Zod);
   `PortfolioPayloadSchema = z.array(ProductSchema)` — add o campo aqui.
4. **`src/types/products.ts`** — `Product` type — add o campo.
5. **`src/actions/products.ts:syncPortfolioAction`** — grava em `products` (+ o
   backup diferencial que gera as coleções do `BUG-040`).
Campos novos a adicionar: `concedeSelo`, `escopo`, `preRequisitos`, `libera`
(item comprável) e `sku`/fiscais (Trilha 2). `dispensaPreRequisito` vai em
`src/types/users.ts` (não vem do portfólio — é estado do usuário).

### 9.2 Consumidores (saída) — quem LÊ os campos
- **Checkout:** `src/lib/checkout.ts:125` — hoje concede o selo **incondicional**;
  passa a condicionar a `concedeSelo`.
- **Contrato Word:** `src/actions/legal.ts` consome `product.title`/`price`/`sheet`/
  `workflow`/`grantedQuotas`. Se SKU/fiscais devem aparecer no contrato/NF → incluir
  aqui (hoje não há campo fiscal no contrato).
- **Jornada:** derivar etapas dos produtos (`journey=sim`+`order`+`preRequisitos`);
  aposentar `steps-registry.ts` (`BUG-043`).
- **Admin:** botão manual de `dispensaPreRequisito` (aba "Assessments / Devolutivas"
  e/ou `/admin/fs/devolutiva`).

### 9.3 Riscos e ordem interna sugerida da Fase A
- **Maior risco = o parser (`BUG-044`).** Recomendação: **primeiro** endurecer o
  parser (ler por **nome de coluna/aba**, não coordenada; corrigir paths), **depois**
  adicionar os campos. Sem isso, todo campo novo é mapeamento manual arriscado.
- Toca **financeiro** (checkout) e **motor de jornada** (god-file) → gated, PR com
  plano + aprovação. Validar tsc + build; telas logadas conferidas em produção
  (BUG-030). A config é editada em `.xlsx/.docx` — a Gestora precisa adicionar as
  colunas na fonte em coordenação com o ajuste do parser.

## 9.4 Fase A — plano executável (sub-PRs)

**Habilitador confirmado (2026-07-07):** os arquivos `portfolio/*.xlsx|.docx` +
payloads **estão versionados no git** e `openpyxl`/`python-docx` estão instalados →
o parser é **testável localmente por diff do `portfolio_payload.json`** (rodar antes/
depois; regressão zero = output idêntico). Estrutura real do parser:
`portfolio_bplen.xlsx` tem abas `Custo de Serviços` (preço por **coordenada fixa** —
frágil), `Pacotes de Serviço` (idem), `Jornada` (code→order, **lida por linha —
resiliente**), `Checkpoints` (**por linha — resiliente**); `anuncios_bplen.docx`
(copy por tabela); `campanhas_bplen.xlsx` (`Ofertas`/`Cupons`, **por linha**).

- **PR A0 — Endurecer o parser (sem mudar o output). ✅ FEITO (PR #28, `76bc05d`).**
  - Paths hardcoded `D:\BPlen HUB\v3\...` → relativos (`REPO_ROOT` via `__file__`);
    `coverImage` via `REPO_ROOT` em vez de `os.getcwd()`.
  - Mismatch `code_to_slug` BPL-003 `"plano-carreira"` → `"plano-de-carreira"`
    corrigido (cupom NATAL10 restrito a BPL-003 voltará a casar no próximo sync).
  - Travas `safe_float`/`safe_int` nas leituras de preço.
  - **Validado:** parser roda; diff dos payloads = **só** a correção do slug BPL-003
    (`portfolio_payload.json` byte-idêntico). Regressão zero. Firestore não tocado
    (a correção do cupom chega no próximo sync de portfólio).
- **PR A1 — Campos de modelo (nova aba resiliente + schema + tipo), sem consumidores.
  ✅ FEITO (PR #29, `c287b71`).**
  - Parser lê a aba **opcional `Atributos`** (por **nome de coluna**, keyed por
    `serviceCode`; colunas: `serviceCode`, `serviceName` [só humano], `escopo`,
    `concedeSelo`, `preReqModo`, `preReqEtapas`, `libera`, `sku`, `nbs`,
    `naturezaOperacao`, `descricaoFiscal`) → injeta `escopo`/`concedeSelo`/
    `preRequisitos`/`libera`/`sku`/`fiscal` no payload. Ausência da aba = catálogo
    idêntico. `ProductSchema` + `Product` ganham os campos (opcionais);
    `dispensaPreRequisito?: string[]` em `AdminUser`.
  - **Validado:** aba ausente → payload byte-idêntico (regressão zero); aba de teste
    → campos populam certo (Excel restaurado do backup, intocado); tsc + build limpos.
  - **Pendente da Gestora:** criar/preencher a aba `Atributos` no `portfolio_bplen.xlsx`
    e sincronizar o portfólio para os campos entrarem no Firestore.
- **PR A2 — Selo condicional no checkout. ✅ FEITO (PR #30).**
  - `src/lib/checkout.ts:grantServiceEntitlement` (ponto **único** que escreve
    `member_area_access` no código de produto — 2 callers: `actions/checkout.ts`
    resgate gratuito/cupom-100% e o webhook do Mercado Pago) passa a condicionar o
    selo ao `concedeSelo` do produto, reusando o `productData` **já pré-buscado**
    (nenhuma leitura nova, assinatura e transação intactas).
  - **Default seguro decidido pela Gestora (2026-07-08):** só `concedeSelo === false`
    deixa de conceder. Campo ausente (aba `Atributos` não preenchida/sincronizada)
    ou produto não resolvido → concede, como sempre. **O merge é behavior-neutral**:
    nenhum produto tem o campo no Firestore ainda.
  - **Nunca revoga:** `...currentServices` precede o spread — quem já tem o selo o
    mantém ao comprar um item `concedeSelo: false`.
  - **Sequenciamento decidido pela Gestora:** a **Sync do portfólio com a aba
    preenchida fica retida até a Fase C** estar mergeada. É a Sync — não o merge —
    que ativa o comportamento; rodá-la antes da C deixaria o comprador junior sem
    ponto de entrada navegável (perde `/hub/membro`, hero cai em "Prévia", e a rota
    `/hub/membro/journey/posicionamento-profissional` só é alcançável por link direto).
  - `role: "visitor" → "member"` (`checkout.ts:146`) fica **incondicional por
    decisão explícita** — `role` hoje só é lido para `=== "suspended"`/`=== "admin"`;
    dar-lhe semântica de selo é escopo da Fase D, não do A2.
- **PR A3 — Botão admin manual de `dispensaPreRequisito`. ✅ FEITO (PR #31).**
  - UI na aba **"Assessments / Devolutivas"** de `admin/users` (ponto único; a
    2ª opção `/admin/fs/devolutiva` foi dispensada — um só lugar é mais
    descobrível e evita duas telas escrevendo o mesmo campo).
  - Lista as **etapas da jornada derivadas dos produtos** (`isStepJourney` +
    `status: active`, ordenadas por `order`) — **não há lista hardcoded de
    etapas**, coerente com "produtos = fonte única" (`BUG-043`). Cada linha mostra
    o `serviceCode` e o pré-requisito declarado (ou "sem pré-requisito declarado",
    enquanto a aba `Atributos` não for sincronizada) + um botão Dispensar/Dispensado.
  - Servidor: `updateUserPermissions` aceita `dispensaPreRequisito?: string[]`,
    normaliza (trim/uppercase/dedup), aplica teto de 20 itens e **valida cada
    entrada contra um `serviceCode` real do catálogo** — impede reintroduzir
    chaves-lixo em `User_Permissions` (a classe de defeito do `BUG-042`).
    `getAdminUsersList` passa a devolver o campo.
  - Persiste em `User/{matricula}/User_Permissions/access.dispensaPreRequisito`.
    **Ainda sem consumidor** — quem lê é o motor `resolverAcesso` (Fase B).
    Array vazio limpa as dispensas.
- **(Fase B, não A):** derivar a jornada dos produtos + motor `resolverAcesso`.

## 9.5 Fase B — motor de acesso (dividida em B1/B2)

**Sequenciamento corrigido (decisão da Gestora, 2026-07-08).** A ordem original
`B → C → D` **não roda**: o motor precisa de `preRequisitos` no Firestore, logo
precisa da **Sync**, que o A2 reteve até a Fase C. Ordem real:

> **B1 (agora) → C → Sync → B2 + D**

- **PR B1 — motor puro, sem consumidor. ✅ FEITO (PR #32).**
  - `src/lib/access/resolve-access.ts`: `resolverAcesso(usuario, servico)` →
    `LIBERADO | PREVIA | UPSELL | SEQUENCE_LOCK` + `pendentes[]`. Função pura, sem
    I/O, sem Firebase, sem conceito de rota/UI. **Não conhece admin** — se um caller
    quiser auto-liberar para admin, a decisão é dele (o modelo diz que admin não
    herda a área de membro).
  - Ordem das regras (§4): escopo → entitlement → pré-requisito (com `dispensa`
    curto-circuitando o pré-req, mas **nunca** o selo nem o entitlement).
  - Defaults de transição: `escopo` ausente não bloqueia; `preRequisitos` ausente
    equivale a `modo: nenhum`; `etapas: []` não exige nada. `serviceCode` comparado
    com trim + uppercase.
  - **27 testes Vitest** (`__tests__/lib/resolve-access.test.ts`) sobre a jornada
    canônica real do §3.1. Validados por **mutação**: inverter escopo↔entitlement
    quebra a suíte (ver Lição 15 do `RETROSPECTIVE.md`).
- **PR B2 — adaptador + troca do lock hardcoded.** Depende da Sync.
  - `buildAccessContext`: normaliza `services` + quotas + progresso + produtos em
    `serviceCode`s. **Adaptador leniente** (decisão da Gestora): entitlement =
    união de `services` + quotas + `libera` expandido **em leitura**. Motivo: hoje
    o comprador de pacote acessa etapas via `grantedQuotas` + *fuzzy match*, não via
    `libera` (que ninguém lê e o checkout não expande). Um motor estrito de imediato
    **removeria acesso de compradores de pacote**. O estrito só depois da Trilha 3b
    (`BUG-042`, chaves-lixo dos 4 clientes).
  - Substitui as heurísticas de `useJourney.ts:231-252` (índice de array + exceções
    hardcoded de onboarding/mentocoach/offboarding) e o `hasAccess` por *fuzzy match*
    de quotas.

### 9.6 Achado sobre o `BUG-043` (leitura de 2026-07-08)

O `steps-registry.ts` **já não dirige a jornada**: `getJourneyStagesAction` deriva as
etapas dos produtos. O registry entra só em `journey.ts:175-178`, sobrescrevendo
`substeps` quando o id estático casa com o slug do produto **e tem substeps** — e
**só `onboarding` tem**. As outras 6 entradas (ids legados) nunca sobrescrevem nada.

Porém o registry está **vivo** em `NetworkingFilters.tsx` (filtro de estágio, com os
nomes legados) — que, somado ao `BUG-033` (`journeyStageId` sempre "onboarding"),
está duplamente quebrado.

Consequência: aposentar o registry exige **mover os substeps curados do onboarding
(vídeo, check-in, sessão) para dado** (`deliverySteps` / aba `Checkpoints`) e
consertar o filtro do networking. É mudança de **dado + 2 telas** → **PR próprio,
depois da Fase B** (decisão da Gestora, 2026-07-08), não dentro do motor.

Observação registrada: os arquivos de `portfolio/` (preços/config comercial) estão
**versionados no repo** — decisão deliberada da Gestora (o parser os trata como
"secure sources"); não é bug, mas fica anotado.

## 10. Fase C — liberação relativa ao pacote (Posicionamento e MentoCoach)

**Status: PLANO — aguarda aprovação da Gestora para implementar** (área sensível:
gating de jornada). Desenhado em 2026-07-16 a partir do pedido dela, com as 4
decisões de escopo já respondidas (deadlock, procedência, posicionamento, escopo).

### 10.1 A regra (como entendida e confirmada)

Posicionamento (BPL-001) e MentoCoach (BPL-005) hoje abrem cedo demais: o
primeiro tem `preReq: nenhum` e o segundo exige só o Onboarding. A regra pedida:

> Quando contratados **junto com outros serviços**, BPL-001 e BPL-005 só liberam
> **após a conclusão da última etapa contratada**. As etapas se fazem uma por vez.
> Comprados **diretamente/avulsos**, liberam de imediato. A exceção — realizar em
> paralelo — é **do admin**, caso a caso, nunca regra.

Decisões da Gestora (2026-07-16):
1. **Conjunto de espera = só a trilha principal** (Onboarding, Análise, Plano,
   GDC). BPL-001, BPL-005 e Offboarding **ficam fora do cálculo** — sem isso há
   deadlock (BPL-001 e BPL-005 esperariam um pelo outro; o Offboarding exige o
   BPL-005 e esperaria de volta).
2. **Procedência derivada, sem campo novo**: a regra é "espere as **outras**
   etapas que o membro tem". Quem só tem o serviço não tem o que esperar — a
   regra **se auto-satisfaz** e o acesso é imediato. **Ressalva aceita pela
   Gestora**: um membro que já está na jornada e compra o serviço avulso ficaria
   travado até concluir o resto; o desbloqueio nesse caso é **via admin**.
3. **Posicionamento segue a mesma regra do MentoCoach**, apesar de ser o ícone 1.
4. Após a última etapa da trilha, **os dois abrem juntos** (paralelos entre si).

### 10.2 Bloqueador — resolver ANTES (BUG-079)

`conclusoesFromProgress` lê `progress.steps[stage.id]` **cru**, enquanto a escrita
(`updateJourneySubStepAction`) **normaliza** e grava na chave legada. Confirmado no
dado real: `BP-005`/`BP-011` têm `plano_de_Carreira`, que não casa com
`plano-de-carreira` (BPL-003). Sob a regra nova, BPL-001/BPL-005 esperariam uma
conclusão que o sistema **nunca enxerga** → **nunca destravariam**.

Correção proposta: **leitura tolerante** em `conclusoesFromProgress`, com a mesma
normalização que a escrita já usa. Sem migração de dado (as chaves legadas seguem
funcionando). Migrar as chaves é higiene opcional, depois.

### 10.3 Design — modo novo, motor intacto

A Gestora observou, corretamente, que **a lista de pré-requisitos não pode ser
configurada no Excel** (varia por pacote). A saída é configurar o **modo**, não a
lista:

- **Dado (aba `Atributos`):** `preReqModo = apos_contratadas`, `preReqEtapas` vazio,
  para BPL-001 e BPL-005. Nada mais muda na planilha.
- **Adaptador (`journey-adapter.ts`):** expande `apos_contratadas` em
  `{ modo: "todos", etapas: [<trilha principal que o membro tem>] }` **antes** de
  chamar o motor. É trabalho de tradução — exatamente o papel do adaptador.
- **Motor (`resolve-access.ts`): NÃO muda.** Segue com 3 modos e permanece puro
  (§0: "criar um serviço/pacote novo = preencher atributos; o motor não muda").

**Derivação do conjunto de espera — sem nenhum serviceCode hardcoded** (Lição 26
do `RETROSPECTIVE.md`: remendo com nome de serviço fixo é bug mal diagnosticado):

> trilha principal = etapas que o membro tem (`entitlements`)
> — MENOS as que declaram `modo: apos_contratadas` (elas são as paralelas)
> — MENOS as que citam uma etapa `apos_contratadas` em `preReqEtapas`

A segunda exclusão remove o Offboarding **automaticamente** (ele cita BPL-005),
sem citá-lo pelo nome. Se amanhã um serviço novo for paralelo, basta o modo no
Excel — nenhum código muda.

**Conferência com o estado real do `BP-005-PF-260523`** (Embaixador): entitlements
da trilha = BPL-000 (completed), BPL-002 (completed), BPL-003 (current), BPL-004
(não iniciada) → BPL-001 e BPL-005 = `SEQUENCE_LOCK`, `pendentes: [BPL-003, BPL-004]`
— exatamente o "aguardando etapa anterior" que a Gestora espera.

### 10.4 Exceção do admin — já existe, nada a construir

`dispensaPreRequisito` está implementado ponta a ponta: o motor consome (regra 3),
`users-admin.ts` grava com guard, `auth-permissions.ts` lê e `admin/users` tem o
toggle (`handleToggleWaiver`). Liberar BPL-001/BPL-005 em paralelo para um membro
específico **já é possível hoje**. A validar na F1-06: se o toggle lista os dois
serviços e se o rótulo explica o efeito.

### 10.5 Rótulos da jornada — 2 bugs que anulariam a regra

Sem isto, a Gestora **não veria** a regra funcionando (`JourneyNav.tsx`):

1. **Progresso mascara a trava.** `"Foco Atual"` é decidido por `percentage > 0`
   **antes** do ramo de sequência. O MentoCoach tem 33% (as 5 paradas de Análise
   que ele compartilha), então continuaria exibindo "Foco Atual" mesmo travado.
   Correção: testar `isBlockedBySequence` **antes** do progresso.
2. **`"Não Liberado"` mente.** É o *default* da cadeia; cai nele a etapa
   **acessível mas que não é a próxima da fila** — é por isso que o Posicionamento,
   que está liberado e clicável hoje, aparece como "Não Liberado". Falta um caso
   para "acessível" (ex.: "Disponível").

### 10.6 Arquivos, risco e validação

| Arquivo | Mudança | Risco |
|---|---|---|
| `portfolio_bplen.xlsx` (aba Atributos) | `preReqModo` dos 2 serviços | Baixo (dado, reversível) |
| `portfolio_parser.py` | aceitar o modo novo | Baixo |
| `src/types/products.ts` | modo novo no tipo do dado | Baixo |
| `journey-adapter.ts` | expandir o modo + leitura tolerante (BUG-079) | **Médio — gating** |
| `resolve-access.ts` | **nenhuma** | — |
| `JourneyNav.tsx` | ordem dos rótulos + caso "Disponível" | Baixo |

- **Sem migração de dado de usuário** (a leitura tolerante cobre as chaves legadas).
- **Sync de produção** necessário (mesmo pipeline dos PRs #104), com backup.
- **Validação:** testes de unidade do adaptador (expansão do modo, deadlock,
  auto-satisfação do avulso, chave legada), **mutação das regras centrais** antes de
  confiar na suíte (Lição 15), e simulação contra o dado real dos 4 usuários com
  progresso antes/depois (Lição 18) — o comprovante de que ninguém trava sem querer.
- **Rollback:** reverter o `preReqModo` na planilha + sync desfaz a regra sem deploy.

### 10.7 Ordem de execução proposta

1. **PR 1 — BUG-079** (leitura tolerante) + testes. Independente e corrige um Alto
   já existente, mesmo que a Fase C não avance.
2. **PR 2 — rótulos** (10.5). Independente; conserta o que a Gestora vê hoje.
3. **PR 3 — modo `apos_contratadas`** (adaptador + tipo + parser) + planilha + sync.

## Registro de revisões

- 2026-07-16 — **seção 10 (Fase C — liberação relativa ao pacote)** adicionada: plano da
  regra pedida pela Gestora para BPL-001/BPL-005, com as 4 decisões de escopo dela
  respondidas. Registrado o bloqueador `BUG-079` (leitura crua x escrita normalizada da
  chave de progresso) e os 2 bugs de rótulo do `JourneyNav` que anulariam a regra na tela.
  Desenho preserva o motor puro: o modo novo é expandido no adaptador, e o conjunto de
  espera é derivado sem nenhum serviceCode hardcoded. **Aguarda aprovação para implementar.**
- 2026-07-08 — **Revisão da Gestora nos atributos (pós-B2, via planilha — zero
  código):** Onboarding (BPL-000) vira pré-requisito de análise/plano/GDC/mentocoach,
  e os pacotes pleno..embaixador passam a liberar BPL-000. Fecha a lacuna de o
  onboarding não ser liberado por nenhum pacote. Primeira mudança de regra feita
  puramente por dado, como o modelo prevê (§0). Vigora no próximo clique de Sync.
- 2026-07-07 — criação, a partir do desenho iterativo com a Gestora (BUG-035 →
  modelo modular). Decisões locked: 3 sub-áreas; `concedeSelo` por item; jornada
  reordenada + pré-req; produtos = fonte única; higiene da base (backups 3 últimos/
  namespace/apagar; migração mínima); workflow de elegibilidade em fase futura;
  "DISC" desacoplado de análise comportamental.
