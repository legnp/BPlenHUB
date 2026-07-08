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

## 3. Regras canônicas da jornada (aprovadas)

Ordem corrigida (**posicionamento é a etapa 1, antes do onboarding**). Os produtos
`active` `BPL-000..006` já refletem esta ordem — são a **fonte de verdade** da
jornada (o `steps-registry.ts` legado é aposentado/reconciliado — `BUG-043`).

| # | Etapa (produto) | escopo | pré-requisito |
|---|---|---|---|
| 1 | Posicionamento de Carreira (`posicionamento-profissional`, BPL-001) | **público** | nenhum |
| 2 | Onboarding (BPL-000) | membro | nenhum |
| 3 | Análise Comportamental (BPL-002) | membro | **nenhum** |
| 4 | Plano de Carreira (BPL-003) | membro | **análise comportamental** |
| 5 | Gestão e Desenvolvimento de Carreira / GDC (`gestao-e-desenvolvimento`, BPL-004) | membro | **plano de carreira** |
| 6 | MentoCoach (BPL-005) | membro | nenhum |
| 7 | Offboarding (BPL-006) | membro | **qualquer: [GDC, mentocoach]** (conforme contratado) |

Notas:
- **Compra de serviço avulso** = acesso **direto** ao serviço, sem cadeia de
  pré-req — exceto os que têm pré-req próprio (plano, GDC, offboarding acima).
- **Nomenclatura:** parar de usar **"DISC"** como sinônimo de "análise
  comportamental" em qualquer string/rótulo de interface (Trilha 4). "DISC" só
  onde for o portal/link externo real.

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

- **PR A0 — Endurecer o parser (sem mudar o output).**
  - Paths hardcoded `D:\BPlen HUB\v3\...` → relativos (`__file__/../portfolio`).
  - Corrigir mismatch `code_to_slug` BPL-003 `"plano-carreira"` → `"plano-de-carreira"`
    (hoje não casa com o slug do produto → restrição de cupom de BPL-003 falha).
  - Guardas defensivas nas leituras de preço por coordenada (validar plausibilidade).
  - **Validação: rodar o parser e diffar o `portfolio_payload.json` — deve sair
    idêntico** (exceto a correção do slug BPL-003). Sem tocar Firestore.
- **PR A1 — Campos de modelo (nova aba resiliente + schema + tipo), sem consumidores.**
  - Nova aba **`Atributos`** no `portfolio_bplen.xlsx` (lida **por cabeçalho/linha**,
    keyed por `serviceCode` — resiliente), com: `escopo`, `concedeSelo`,
    `preRequisitos`, `libera`, `sku`, campos fiscais. A Gestora preenche.
  - Parser injeta os campos no payload; `ProductSchema` (`portfolio.ts`) + `Product`
    (`types/products.ts`) ganham os campos (opcionais). `dispensaPreRequisito` em
    `types/users.ts`.
  - Nada consome ainda → **zero mudança de comportamento**. Validação: parser+diff
    (agora com os campos novos) + tsc + build. Sync grava o payload.
- **PR A2 — Selo condicional no checkout.** `checkout.ts:125` concede
  `member_area_access` só se `concedeSelo === true`. Financeiro → gated. Definir o
  default quando ausente (recomendação: a aba `Atributos` define para todos, então
  não há ausência; fallback seguro = não conceder para serviços de escopo público).
- **PR A3 — Botão admin manual de `dispensaPreRequisito`** (aba "Assessments/
  Devolutivas" e/ou `/admin/fs/devolutiva`).
- **(Fase B, não A):** derivar a jornada dos produtos + motor `resolverAcesso`.

Observação registrada: os arquivos de `portfolio/` (preços/config comercial) estão
**versionados no repo** — decisão deliberada da Gestora (o parser os trata como
"secure sources"); não é bug, mas fica anotado.

## Registro de revisões
- 2026-07-07 — criação, a partir do desenho iterativo com a Gestora (BUG-035 →
  modelo modular). Decisões locked: 3 sub-áreas; `concedeSelo` por item; jornada
  reordenada + pré-req; produtos = fonte única; higiene da base (backups 3 últimos/
  namespace/apagar; migração mínima); workflow de elegibilidade em fase futura;
  "DISC" desacoplado de análise comportamental.
