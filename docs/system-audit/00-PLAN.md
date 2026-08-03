# BPlen HUB — Plano Mestre de Homologação e Refinamento Fullstack

Este é o checklist mestre do processo de validação amplo do sistema (infra, banco,
design, arquitetura, lógicas de fluxo, regras de negócio, textos/tons). Ele é
**a fonte de verdade compartilhada entre chats**, junto de `BUGS.md` — todo chat
de execução lê este arquivo, o `LOG.md` e o `RETROSPECTIVE.md` antes de agir, e
atualiza o status aqui ao final. `DASHBOARD.md` é só um agregador visual (não é
fonte de verdade); `F0-DECISIONS.md` guarda o detalhe longo das decisões de Fase 0.

Populado pelo chat de planejamento a partir dos 5 mapas (`01` a `05`). **Status
de cobertura dos mapas**: os 5 mapas estão **completos**.

**Status de execução (atualizado 2026-07-23):**
- **Fase 0 — completa** (6/6 decididos). `F0-01`: parte GlassModal concluída
  (lotes 1/A/B); resta só o 2º componente-base para modais grandes app-shell
  (`BUG-034`, futuro). `F0-04` concluído.
- **Fase 1 — as 6 páginas/clusters (`F1-01` a `F1-06`) foram VALIDADAS EM
  PRODUÇÃO pela Gestora** (2026-07-11 a 2026-07-21). `F1-06` foi além do
  funcional: recebeu um **redesign completo do admin** (`ADMIN-REDESIGN-DESIGN.md`,
  lotes R0–R5, PRs #138–#144) + **9/9 itens de feedback pós-validação** (PRs
  #145–#149) — as 19 telas usam `FunctionalPageHeader`/`StatTile`, sidebar em
  7 escopos, inglês/nomes de banco limpos. **Sidebar recolhida/flyout já
  validada pela Gestora (2026-07-22).** Resta só a validação manual dos 3
  fluxos de contrato (F1-02), programada para depois da limpeza da base de
  teste, e débitos de design menores (modal cru de `partners`, loadings fora
  do `AtmosphericLoading`).
- **Fase 2 — COMPLETA** (`F2-01` a `F2-05`). `F2-01`: `/hub/step-journey` removida
  (PR #152). `F2-02`: auditada — a trava de contrato virou estrutural por-serviço
  (entitlement), sem código. `F2-03`: validada por código (motor de tema global +
  mesmo `HubHeader` no shell das duas áreas). `F2-04`: trava real da cota 1:1 ligada
  ao booking (PR #153). **`F2-05`: concluído (2026-07-24)** — categorização formal de
  todas as rotas logadas (hub + admin) nos 4 conceitos (`F2-05-DESIGN-CATEGORIZATION.md`);
  admin coube nos 4 (nenhum 5º); 3 violações de loading corrigidas (PR #161).
- **Fase 3 — `F3-01` e `F3-02` concluídos.** `F3-02`: Gestora ratificou as 3
  exceções do Sequence Lock. `F3-01`: `BUG-012` (limite semanal) e `BUG-011`
  (antecedência mínima) ambos enforçados na gravação — BUG-011 investigado e o
  resíduo do funil público corrigido (PR #162, 2026-07-28). `F3-03` não iniciado
  formalmente (achado principal `BUG-022` já corrigido desde a Fase 1).
- **Fase 4 — as 3 jornadas MAPEADAS** (2026-07-28, `F4-JOURNEYS-MAP.md`): F4-01
  (lead→membro→offboarding), F4-02 (convite→membro), F4-03 (financeira). Sem armadilha de
  código nova; e2e ao vivo = execução humana da Gestora. F4-03 tem 1 premissa de critério a
  ratificar (checkout público removido).
- **Todos os 6 tracks (T-01 a T-06) concluídos:** T-02 fechado/reaberto/
  refechado (17/17, ver histórico abaixo); T-03 fechado (7/7 — `BUG-009`
  corrigido PR #157); T-06 fechado (2/2); **T-01 (Performance) — Momento 1
  concluído** (2026-07-23, PRs #158/#159/#160; paginação da lista de usuários
  admin → Momento 2 futuro); **T-04 (Observabilidade) — concluído no escopo
  reduzido** (inventário + gap + recomendação, Sentry sugerido,
  `T-04-OBSERVABILITY-FINDINGS.md`); **T-05 (Integrações externas) —
  concluído no escopo misto** (Google/MP verificados vivos read-only, Resend
  presumido-ok, E2E com custo → protocolo humano,
  `T-05-INTEGRATIONS-FINDINGS.md`).
- **Triagem por severidade: fila vazia — 0 Alto, 0 Crítico aberto**, confirmado
  por checagem cruzada dos 115 bugs registrados.
- **2 bugs novos pré-existentes expostos pela medição do T-01** (`BUG-114`/
  `BUG-115`, Médio) — índice já versionado no `firestore.indexes.json`, fecham
  **após o deploy manual** (`firebase deploy --only firestore:indexes`).
- **EXP-01 (dashboard de KPIs do `/admin`)** é uma **expansão de plataforma**
  (`PLATFORM-EXPANSION-PLAN.md`), fora do escopo/checklist da auditoria — não
  entra em nenhuma % acima. Fase 0 (escopo) concluída; build represado por
  decisão da Gestora até o fim da auditoria.

Ver a seção **"Estado da auditoria e próximos itens de execução"** ao final
deste documento para a lista priorizada do que resta. Uma lacuna estrutural
residual e conhecida nos mapas: contagem exata de quantas etapas da jornada
usam `SurveyEngine` (ver nota de fechamento em `01-map-features.md`) — não
bloqueia nenhuma fase. Ver `LOG.md` para o histórico completo de sessões.

**Refinamento desta versão** (chat de planejamento, ver entrada correspondente no
`LOG.md`): incorporadas as 5 melhorias sugeridas em
`RETROSPECTIVE.md#melhorias-sugeridas-para-o-plano` — separação decisão/execução
por item, índice explícito bug→item/track, tags de confiança
`[HIPÓTESE]`/`[CONFIRMADO]`, critério objetivo de fechamento de Track, e overlay
de triagem por severidade. Também reconciliados 2 bugs que estavam sem nenhum
item/track vinculado (`BUG-004`, `BUG-022`) e 4 referências de PR desatualizadas
em `BUGS.md` (confirmadas mergeadas via `git log`).

**Reconciliação desta versão** (chat de planejamento, ver entrada correspondente
no `LOG.md`): checada a consistência cruzada entre `DASHBOARD.md`/`00-PLAN.md`/
`BUGS.md`/índice bug→track para os 32 bugs registrados, após a sessão de
execução que fechou `BUG-020` (7 lotes, PRs #8–#14), `BUG-021` e o Crítico novo
`BUG-032`, e entregou o lote 1/3 do `F0-01` (PR #15). A disciplina de atualizar
os 4 documentos a cada PR (estabelecida na reconciliação anterior) funcionou —
a maior parte já estava consistente. Corrigidos apenas: a linha "Segurança" da
checagem ISO 25010 (ainda citava `BUG-020`/`021` como abertos) e o campo
Decisão do T-02 (linguagem "emergindo" desatualizada — o padrão de guard está
consolidado, não mais em formação). Incorporadas as Lições 9 e 10 do
`RETROSPECTIVE.md` (primitivo de infraestrutura/recursão; lote trivial pode
esconder Crítico) como novos itens 8-9 do Protocolo.

**Reconciliação desta sessão** (chat de planejamento, 2026-07-07, ver entrada
correspondente no `LOG.md`): checagem cruzada bug a bug (todos os 35
registrados) entre `00-PLAN.md`/`BUGS.md`/`DASHBOARD.md`/índice bug→track, mais
verificação de que a Triagem por severidade não escondia nenhum Crítico/Alto
vivo (confirmado: só os 4 Altos já listados — `BUG-001/008/010/035` — seguem
abertos, nenhum Crítico). Achados corrigidos:
1. **% do T-03 estava errada nos dois agregadores**, em direções opostas —
   `~0,5/4` aqui, `~1,5/4 (~38%)` no `DASHBOARD.md`. O `BUG-018` fechou por
   completo (Ações 1a+2+1b), e o critério de fechamento de Track conta um bug
   `Corrigido` como **unidade inteira**, nunca fração — a contagem fracionária
   só vale enquanto o bug está `Em Progresso` (uso correto foi o `BUG-020`/T-02
   antes de fechar). Corrigido para o valor exato: **1/4 (25%)**.
2. **`F0-04` estava com Execução desatualizada** ("Parcial") em ambos os
   documentos — as duas partes do item (`entitlements` removida + consolidação/
   parada de escrita do `User_JourneyMap`) estão concluídas desde o fechamento
   do `BUG-018`; o resíduo de nomenclatura no networking (`BUG-033`) é achado
   colateral separado, rastreado na Fase 1, não parte pendente do F0-04.
   Atualizado para "Concluída".
3. **Linha do `BUG-026` no índice bug→track** dizia "Aberto"; `BUGS.md` (fonte
   de verdade) já registrava "Em Progresso" desde o lote B do F0-01. Corrigida.
4. **2 lições novas do `RETROSPECTIVE.md`** (11 — nunca remover acentos PT-BR
   de copy; 12 — verificar encaixe estrutural antes de generalizar um
   componente-base) incorporadas como itens 11-12 do Protocolo.
5. **Entrada da Fase 1 deixada crisp por página** (pedido explícito do Gestor,
   mesma sessão): confirmado por leitura direta (`grep` de cada componente de
   modal + seu importador) onde os 5 modais-card do F0-01 (lotes A/B)
   realmente renderizam — nenhum é página admin, ao contrário do que o `F1-06`
   registrava. Redistribuído: `WelcomeRedirectModal` → `F1-01` (via
   `MatriculaGuard` em `/servicos/[audience]/[slug]`); `SequenceLockModal`/
   `UpsellServiceModal`/`NonMemberOffboardingModal` → `F1-03` (via
   `JourneyNav`/`SubStepRail`); `CouponTermsModal` → `F1-05` (via
   `CouponInput`/`CheckoutFlow` em `/hub/membro/checkout/[slug]`). `F1-06`
   mantém só a pendência que é de fato dele — causa-raiz do `BUG-035` — com
   nota cruzada de que ela bloqueia a validação do offboarding modal em
   `F1-03`. Também achado e corrigido: **`BUG-033` estava vinculado a `F1-05`
   no índice bug→track, mas ausente do campo "Bug(s) vinculado(s)" do próprio
   item `F1-05`** — checagem cruzada anterior tinha auditado o índice, não o
   campo de cada item da Fase 1 contra ele.

**Reconciliação geral desta sessão** (chat de planejamento, 2026-07-22, ver
entrada correspondente no `LOG.md`): a última reconciliação cruzada completa
foi em 2026-07-07 (35 bugs); desde então houve uma sessão de execução muito
longa (F1-01 a F1-06 validadas, subsistema de contratos, modelo de acesso,
sync de agenda, T-02 reaberto/refechado, redesign completo do admin, EXP-01
Fase 0) sem nova reconciliação geral. Checagem cruzada bug a bug de todos os
113 bugs registrados entre `00-PLAN.md`/`BUGS.md`/`DASHBOARD.md`/índice
bug→track. Achados corrigidos:
1. **26 bugs (`BUG-056` a `071`, `073`/`074`, `076` a `083`) estavam
   completamente ausentes do índice bug→track**, apesar de já registrados e
   corrigidos em `BUGS.md` — a tabela pulava direto de `BUG-055` para `072`, e
   de `075` para `084`. Todos adicionados.
2. **7 status estavam defasados no índice** (diziam "Aberto", `BUGS.md` já
   dizia "Corrigido" há dias/semanas): `BUG-010` (desde 2026-07-11), `BUG-040`/
   `041`/`042` (desde 2026-07-08) e `BUG-052`/`053`/`055` (desde 2026-07-10).
   Corrigidos.
3. **`BUG-106`/`BUG-107`** (contidos no `BUGS.md`, mas com o campo `Commit/PR`
   vazio apesar de já constarem Corrigidos no índice) — preenchidos com as PRs
   corretas (#124+#125/#126 e #125).
4. **Triagem por severidade não refletia o `BUG-110`** (Alto, reportado
   2026-07-20) — nunca tinha entrado na fila porque o achado é do mesmo dia da
   última atualização da tabela. É hoje o **único** Crítico/Alto aberto.
5. **Track T-02 estava travado em "12/12"** no item de fase — não refletia a
   reabertura/refechamento de 2026-07-19/20 (mais 5 bugs: `BUG-102/103/106/
   107/108`). Recalculado para **17/17 (100%)**.
6. **Track T-03 estava em "3/4"** — faltavam `BUG-040/041/042` (Trilha 3 de
   higiene, corrigidos desde 2026-07-08 mas nunca linkados a este item).
   Recalculado para **6/7 (~86%)**.
7. **`F2-01` e `F2-04`** tinham bugs vinculados no índice mas ausentes do
   próprio campo do item (`BUG-043` em F2-01; `BUG-093/094/104` em F2-04).
   Corrigidos.
8. **2 lições novas do `RETROSPECTIVE.md`** (31 — merge não é deploy, confirmar
   produção; 44 — "tem guard?" é só metade da pergunta de segurança)
   incorporadas como itens 13-14 do Protocolo; a Lição 13 (contagem
   fracionária) ganhou uma frase explícita nas Convenções (já era seguida na
   prática, mas não estava escrita ali).
9. Confirmado que `ADMIN-REDESIGN-DESIGN.md` (R0–R5 + feedback 9/9) e
   `PLATFORM-EXPANSION-PLAN.md` (EXP-01 Fase 0 concluída, build represado) já
   estão com o estado correto em seus próprios documentos — sem defasagem
   interna a corrigir; o que faltava era refleti-los no `00-PLAN.md`/
   `DASHBOARD.md` (feito nesta sessão).
10. **`DASHBOARD.md` tinha uma defasagem estrutural**: a nota "Última
    atualização" vinha sendo narrada a cada PR (541 linhas de histórico
    empilhado), mas as **tabelas agregadas** (Fase 0, Tracks, Fase 1) nunca
    foram atualizadas desde ~2026-07-11 — mostravam T-02 "12/12", T-03 "3/4",
    e F1-04/05 "código completo, pendente validação"/F1-06 "não iniciada",
    todas defasadas em relação à realidade (Fase 1 inteira validada,
    redesign do admin completo). Corrigido nesta sessão; histórico extenso
    trimado (LOG.md já é o registro permanente completo).

**Reconciliação desta sessão** (chat de planejamento, 2026-07-23, ver entrada
correspondente no `LOG.md`): entre esta reconciliação e a anterior (2026-07-22),
uma sessão de execução muito produtiva fechou os 3 tracks restantes (T-01/T-04/
T-05), concluiu `F2-01`/`F2-02`/`F2-03`/`F2-04`/`F3-02`, e — de forma notável —
**a própria sessão de execução já pegou e corrigiu, em tempo real, um erro
factual da reconciliação de 2026-07-22** (o `BUG-110` fora listado como único
Alto aberto sem checagem contra o git; já estava corrigido desde o PR #131,
2 dias antes). Esta sessão confirma esse trabalho e fecha o que sobrou:
1. **Autocrítica registrada:** a reconciliação de 2026-07-22 (minha, deste chat)
   cometeu exatamente o erro que a Lição 2/31 do `RETROSPECTIVE.md` alerta —
   tratou o texto do `BUGS.md` como fato sem cruzar com o `git log`. O `BUG-110`
   tinha sido corrigido no PR #131 (2026-07-20), **antes** do commit da minha
   reconciliação (2026-07-22). Verificado agora com `git merge-base
   --is-ancestor` para confirmar a ordem cronológica real. Nova Lição 45
   registrada no `RETROSPECTIVE.md` sobre esse padrão específico (status numa
   fila de prioridade é hipótese herdada, não fato — e recorreu **6 vezes** na
   mesma sessão de execução: `BUG-012/027/031/038/089/104/110`).
2. **Índice bug→track**: 10 status corrigidos (`BUG-009/012/013/015/017/027/
   031/038/089/104/105/110`, todos já `Corrigido`/fechados em `BUGS.md` mas
   ainda "Aberto" no índice) + 2 linhas novas (`BUG-114`/`BUG-115`, aguardando
   deploy manual do índice).
3. **Triagem por severidade**: a tabela em si (não só a nota textual acima
   dela) ainda listava o `BUG-110` como aberto — corrigida para vazia.
4. **Item `[T-01]` nunca tinha saído do template original** ("Execução: Não
   iniciada") apesar do Momento 1 estar concluído — reescrito por completo.
5. **Item `[T-03]`** dizia "6/7", defasado desde o fechamento do `BUG-009` —
   recalculado para **7/7 (100%), fechado**.
6. **Item `[F3-01]`** — `BUG-012` foi resolvido de carona (efeito colateral do
   `BUG-076`) mas o item nunca registrou isso; atualizado para "Parcial".
7. Nova Lição 45 (status de fila é hipótese, confirme contra git) incorporada
   como item 15 do Protocolo.
8. Seção **"Estado da auditoria e próximos itens de execução"** reescrita por
   completo — quase tudo que era "próximo passo" na versão anterior já foi
   feito; a lista priorizada agora reflete o que realmente resta (F2-05,
   F3-01/03, Fase 4, deploy dos índices, validação de contratos, EXP-01).

**Reconciliação desta sessão** (chat de planejamento, 2026-07-29, ver entrada
correspondente no `LOG.md`): entre esta reconciliação e a anterior
(2026-07-23), a execução fechou a **última pendência operacional do T-01**
(`BUG-114`/`BUG-115`, índices criados pela Gestora), concluiu **`F2-05`**
(fechando a **Fase 2 por completo**), concluiu **`F3-01`** (`BUG-011`
investigado e corrigido), e **mapeou a Fase 4 inteira** por código
(`F4-JOURNEYS-MAP.md`) — a Gestora decidiu diferir a corrida e2e ao vivo
("Caminho B"). O checklist original está agora **funcionalmente completo por
código em todas as 5 fases**, restando só `F3-03` como item de auditoria
nunca iniciado. Achados desta reconciliação:
1. **Índice bug→track**: 2 linhas (`BUG-114`/`BUG-115`) ainda diziam "Aguarda
   deploy manual" — corrigidas para `Corrigido`.
2. **Item `[T-01]`** e o próprio `T-01-PERFORMANCE-DESIGN.md` ainda listavam o
   deploy dos índices como pendência — ambos atualizados, sem nenhum resíduo
   restante no track.
3. **Seção "Estado da auditoria"** estava só parcialmente atualizada pelas
   sessões de execução — os itens 1/2/3 da lista priorizada tinham sido
   riscados/corrigidos, mas o resumo "Onde a auditoria está" e os itens
   5/6 (que já pediam coisas concluídas — `F2-05` e o `BUG-011`/F3-01) não
   tinham sido revisitados. Reescrita por completo, com a **lista de
   validação humana pendente (Caminho B) consolidada numa seção própria** —
   pedido explícito da Gestora, incluindo a pergunta em aberto sobre se a
   auditoria fecha formalmente antes ou depois dessa rodada.
4. **`DASHBOARD.md`**: linha do resumo de bugs ainda dizia `BUG-114`/`115`
   pendentes; nova seção "Fases 2-4" adicionada (o painel nunca teve uma
   tabela para essas fases, só Fase 0/1, apesar do progresso real).
5. **2 lições novas** (49 — deploy de índice é sempre manual da Gestora,
   generalizado para qualquer operação que exija credencial de proprietário
   do projeto; 50 — um critério de aceite pode ficar obsoleto quando a
   superfície que ele cita é removida, caso do `F4-03`) + item 16 do
   Protocolo (releia o critério de aceite, não só o status de bug, ao
   revisitar um item antigo).

**Reconciliação desta sessão** (chat de planejamento, 2026-07-30, ver entrada
correspondente no `LOG.md`): entre esta e a anterior (2026-07-29), (a) a
investigação read-only do fluxo de auth concluiu que o caso "abre-sem-concluir
welcome" é **por design, não bug** (decisão da Gestora — `_AuthMap` órfão sem
`User` = abandono da welcome), e (b) uma sessão de execução entregou em
produção a **aba "Autenticações" (funil de Recepção) do admin** (PRs #163
`5545320` e #164 `29f5a1c`, deploy de produção confirmado, validada pela
Gestora) — feature read-only de observabilidade, `AUTH-TRACKING-DESIGN.md`.
Reconciliado contra git (Lição 45): HEAD em `29f5a1c`, ambos PRs ancestrais,
`main == origin/main`. Achados: **nenhuma defasagem em `BUGS.md`** (não é bug,
nenhuma entrada criada). A aba é **feature fora da grade de fases/tracks/bugs**
(como `EXP-01`) — decisão desta reconciliação: **não entra como item graduado**,
mas é reconhecida na seção "Estado da auditoria" (entregas fora-de-grade) e na
nota do `DASHBOARD.md`, para a fonte de verdade refletir a realidade. Novo
follow-up **guardado** (não agendado): captura de `origin` na fonte (write
novo, forward-only, toca fluxo de identidade = área sensível; a Gestora diferiu
para outra sessão) — registrado no grupo 4 da lista priorizada, ao lado do
`T-04`/`EXP-01`. Nenhuma lição nova reutilizável (a execução já registrou o
que aprendeu).

---

## Protocolo entre chats

1. Todo chat de execução deve ler este arquivo + as últimas entradas do `LOG.md`
   **+ o `RETROSPECTIVE.md`** (lições de execução destiladas de sessões
   anteriores) antes de agir, e deve terminar registrando uma entrada no `LOG.md`
   (data, escopo trabalhado, achados, decisões, mudanças de status neste plano).
   Se aprender algo reutilizável, adicionar/editar o `RETROSPECTIVE.md`.
2. Ao tentar um item do checklist, o chat de execução decide o **Modo de
   validação** na hora, não antes:
   - Se conseguir validar sozinho (código + preview) → marca `Automatizado`,
     executa, registra `Execução`/`Resultado`, e abre bug em `BUGS.md` se achar algo.
   - Se não conseguir (bloqueado por login, exige dispositivo real, exige
     julgamento humano, exige carga real, etc.) → marca `Requer execução humana`
     e escreve ali mesmo um protocolo guiado passo a passo para a Gestora
     (Victor) executar e reportar o resultado, que então é registrado de volta
     no item.
3. Bugs encontrados durante qualquer fase são registrados em `BUGS.md` antes de
   decidir corrigir inline ou adiar (ver regras de área sensível no `CLAUDE.md`
   da raiz do projeto). **Ao registrar, já vincule o bug a um item/track existente
   no "Índice — Bug → Item/Track" abaixo** (ou crie a entrada se for um achado
   novo fora do escopo original) — não deixe a associação implícita.
4. Se um mapa (`01`-`05`) ainda tiver lacuna relevante para o item que se está
   tentando validar, o chat de execução deve **completar a lacuna do mapa
   primeiro** (mesma metodologia de inspeção real de código dos mapas
   existentes) antes de validar o item — não validar às cegas.
5. **A cada PR mergeada** que resolva um item/bug, atualizar `DASHBOARD.md`
   (painel de progresso Fase 0 + Tracks): mover o item para "resolvido",
   recalcular as % dos tracks afetados (usando o **critério de fechamento**
   definido abaixo, não por impressão), e atualizar a data de "Última
   atualização". O `DASHBOARD.md` só agrega — a fonte de verdade continua sendo
   `BUGS.md` + este plano.
6. **Triagem por severidade fura a ordem nominal das fases** — antes de seguir
   Fase 0→1→2→3→4 ao pé da letra, checar a seção "Triagem por severidade"
   abaixo. Um bug `Crítico` ou `Alto` com Status `Aberto` deve ser priorizado
   mesmo que pertença a uma fase ainda não alcançada (respeitando o gating de
   área sensível do `CLAUDE.md`).
7. **Toda recomendação/achado ainda não validado por execução real** (leitura de
   código conta como validação; suposição sobre comportamento em runtime não
   verificada não conta) deve ser marcada **[HIPÓTESE]** no texto. Quando uma
   sessão futura confirmar (ou refutar) por execução/teste real, atualiza para
   **[CONFIRMADO]** (ou corrige o item, como já aconteceu com `BUG-002`,
   `BUG-024` e o cluster `BUG-028/029/030`).
8. **Antes de guardar um primitivo de infraestrutura, cheque se ele é chamado de
   dentro de outro guard.** Se a função é usada por `getServerSession` (ou
   equivalente), colocar `requireAuth`/`requireAdmin` nela causa recursão
   infinita — separe o **resolvedor cru** (lib sem guard, para a infra que já
   verificou identidade) do **action exposto na rede** (wrapper com trava de
   dono, via `verifySignedSession`, que só lê o cookie e não recursa). Caso
   real: `BUG-020` lote 7 / PR #14 (Lição 9 do `RETROSPECTIVE.md`).
9. **Ao endereçar um bug/lote, leia o arquivo inteiro afetado — não só a função
   citada no bug.** Um "último lote trivial" já escondeu o bug mais grave do
   processo até agora (`BUG-032`, Crítico, achado dentro do mesmo arquivo do
   lote 7 do `BUG-020`, sem estar no escopo original). Server actions confiam
   em parâmetros do cliente: todo `uid`/`email`/`matricula` recebido tem que
   ser confrontado com a identidade **verificada** (cookie/token), nunca usado
   direto. Registre o achado novo em `BUGS.md` antes de decidir, mesmo no meio
   de outro lote (Lição 10 do `RETROSPECTIVE.md`).
10. **Bug/pendência/hipótese localizado resolve-se na fase correspondente, não
    oportunisticamente.** Se o problema é específico de uma tela/fluxo (não é
    sistêmico/cascateado por todo o projeto), ele é verificado e corrigido quando
    a fase associada chegar — a Fase 1 (página-a-página) é a oportunidade natural
    para as questões específicas de cada tela; a Fase 2/3 para as transversais de
    feature/regra. Só um achado **sistêmico** (padrão repetido em N arquivos, como
    o `BUG-020` foi) justifica um track transversal furando a ordem das fases
    (isso é diferente da triagem por severidade do item 6, que fura a ordem por
    urgência de um Crítico/Alto, não por escopo). Todo achado, mesmo adiado para
    sua fase, é registrado em `BUGS.md` já vinculado ao item/fase (Diretriz da
    Gestora, 2026-07-04).
11. **Nunca remova acentos PT-BR de texto de interface ao editar/reescrever
    copy.** A regra do `CLAUDE.md` é "Zero Emoji", não "zero acento" — acentos
    (ã, ç, é, ...) são copy correto e esperado em português; removê-los é
    regressão, não limpeza. ASCII só é apropriado em comentários de código,
    rotas/slugs e chaves/identificadores — nunca em strings visíveis. Caso
    real: `F0-01` lote A removeu acentos de 4 modais por engano ao reescrevê-
    los, corrigido no lote B (Lição 11 do `RETROSPECTIVE.md`).
12. **Antes de generalizar um componente-base único para todos os casos,
    verifique se a estrutura de cada candidato realmente cabe.** Nem todo caso
    que "parece" similar serve ao mesmo padrão — universo diferente (público
    vs. logado), criticidade especial (gate não-dismissível), ou estrutura
    física diferente (modal-card vs. app-shell com header/footer fixos) podem
    exigir exceções documentadas ou um 2º padrão-base, em vez de forçar tudo
    num só. Caso real: `F0-01` — a decisão "GlassModal único" precisou virar
    "GlassModal (card) + 2º base (app-shell, `BUG-034`) + exceções aceitas"
    (Lição 12 do `RETROSPECTIVE.md`).
13. **Merge na `main` não é entrega — confirme o deploy de produção do commit
    certo antes de dizer "está em produção".** Este projeto mergeia PRs pela API
    REST do GitHub (`gh` não instalado); uma instabilidade pode fazer o merge
    suceder e o evento de deploy da Vercel se perder, e o `git log` sozinho não
    denuncia isso. Dois detalhes operacionais: o "Redeploy" da Vercel reconstrói
    o **mesmo commit** do deployment escolhido (não puxa o topo da `main` — para
    publicar código novo é preciso um push novo, ex. commit vazio); e quando o
    fix depende de um job manual (sync/migração/registro), a cadeia real é
    **merge → deploy → execução do job → efeito** — a verificação read-only do
    efeito é a única prova do último elo. Caso real: PR #109/#110 (Lição 31 do
    `RETROSPECTIVE.md`).
14. **Em toda revisão de segurança, "tem guard?" é só metade da pergunta — a
    outra é "de onde vem a identidade que essa função acredita?".** Um guard
    correto (`requireAuth`/dono-ou-admin) pode conviver com uma brecha na linha
    seguinte se algum identificador que a função usa para decidir (`uid`,
    `email`, `matricula`) vier de parâmetro do cliente em vez da sessão
    verificada — foi assim que o `BUG-032` (corrigido) sobreviveu como `BUG-106`
    (Crítico) em duas outras cópias da mesma lógica. Checklist mínimo por action
    sensível: (1) tem guard? (2) todo identificador que decide vem da sessão
    verificada ou de parâmetro? (3) ela **escreve** identidade (`uid`,
    `_AuthMap`, papel) a partir de algum parâmetro? Ao corrigir, consolide numa
    fonte única antes de endurecer — endurecer cópias em paralelo é como elas
    divergiram (Lição 44 do `RETROSPECTIVE.md`).
15. **O status de um item numa fila de prioridade (Triagem por severidade,
    "Estado da auditoria", ou qualquer lista herdada de uma sessão anterior) é
    HIPÓTESE, não fato — confirme contra `git log`/código antes de agir, mesmo
    que seja o item 1 recomendado.** Um bug pode ter sido corrigido entre a
    sessão que escreveu a fila e a sessão que vai lê-la; o texto do `BUGS.md`
    em si também pode estar defasado. Antes de começar a trabalhar num item da
    fila, busque por commits/PRs que o mencionem (`git log --grep`) e, se
    houver um candidato, confirme com `git merge-base --is-ancestor` se ele já
    está na `main` atual. Caso real: a reconciliação de 2026-07-22 listou o
    `BUG-110` como único Alto aberto sem checar o git — o PR #131 já o tinha
    corrigido 2 dias antes. O mesmo padrão recorreu **6 vezes na mesma sessão**
    de execução seguinte (`BUG-012/027/031/038/089/104` também estavam
    "abertos" na fila por engano) — o volume mostra que isto não é acidente
    raro, é o modo padrão de degradação de uma lista de status entre sessões
    (Lição 45 do `RETROSPECTIVE.md`).
16. **Ao revisitar um item de checklist antigo, releia o próprio "Critério de
    aceite" contra o estado atual do sistema — não só o status dos bugs
    vinculados.** Um critério é um enunciado sobre o sistema, e o sistema
    muda: uma rota citada no critério pode ter sido removida, uma regra pode
    ter sido substituída por outra. O `F4-03` pedia validar "checkout público
    e de membro"; o checkout público tinha sido removido sessões antes
    (`BUG-002`) e o critério nunca foi atualizado para refletir isso — só
    apareceu ao remapear a jornada por código. Verificar só o campo "Bug(s)
    vinculado(s)" não pega esse tipo de defasagem (Lição 50 do
    `RETROSPECTIVE.md`).

---

## Convenções deste documento (leia antes de editar um item)

Cada item do checklist agora separa **Decisão** de **Execução** — um item
"decidido" não é o mesmo que "implementado" (lição da Fase 0: F0-01/04/05
foram decididos na mesma sessão, mas a implementação de cada um seguiu
calendários bem diferentes).

- **Decisão** — vocabulário fixo: `—` (item não exige decisão além da própria
  validação) / `Pendente` (decisão de negócio ou técnica ainda em aberto,
  quem decide está anotado) / `Decidida` (padrão/critério fechado) /
  `Ratificada` (decisão que exigia aval formal da marca/negócio, ex. F0-06).
- **Execução** — vocabulário fixo: `N/A` (item é só decisão/documentação, não
  gera artefato de código) / `Não iniciada` / `Gated — aguarda plano+aprovação`
  (área sensível do `CLAUDE.md`) / `Em andamento — X/Y` / `Parcial` (com
  detalhe) / `Concluída — mergeada em <PR/branch>`.
- **Tags de confiança**: prefixe **[HIPÓTESE]** qualquer afirmação ainda não
  confirmada por execução real (ex.: "provavelmente sempre nulo", "poderia
  teoricamente"); troque para **[CONFIRMADO]** quando uma sessão validar.
- **Critério de fechamento de um Track (100%)**: cada bug vinculado deve estar
  em um de dois estados — **Corrigido** (mergeado na `main`) **OU**
  **formalmente aceito como risco/adiado** (status com justificativa registrada
  em `BUGS.md` E aprovação explícita da Gestora, como o `BUG-030`). Um bug
  simplesmente `Aberto` ou `Em Progresso` mantém o Track aberto. A % no
  `DASHBOARD.md` só conta esses dois estados no numerador — nunca arredondar
  para cima, nunca contar "decidido mas gated" como fechado. **Um bug
  `Corrigido` conta sempre como unidade inteira, nunca fração** — contagem
  fracionária (ex. `~5,5/11`) só é válida enquanto o bug está genuinamente
  `Em Progresso` (lotes parciais de um mesmo bug, como o `BUG-020` antes de
  fechar); não existe "meio ponto" para um bug já fechado (Lição 13 do
  `RETROSPECTIVE.md` — erro real cometido e corrigido na reconciliação de
  2026-07-07).

---

## Template de item de checklist

```
### [ID] Nome do item
- Categoria(s) de qualidade: [ex: Usabilidade / Segurança / Performance]
- Critério de aceite: [o que define "passou" de forma objetiva e verificável]
- Modo de validação: PENDENTE
- Decisão: —
- Execução: Não iniciada
- Resultado: —
- Bug(s) vinculado(s): —
- Log: —
```

---

## Triagem por severidade (overlay sobre a ordem das fases)

Fila viva de bugs `Crítico`/`Alto` com Status `Aberto` — atualizar a cada sessão
que corrigir ou rebaixar um destes (fonte: `BUGS.md`). Vazia = nenhuma urgência
ativa furando a ordem das fases.

| Bug | Severidade | Onde se conecta | Por que ainda não fechou |
|---|---|---|---|
| _(vazia)_ | — | — | nenhum `Crítico`/`Alto` aberto |

**Reconciliação de 2026-08-03:** o `BUG-118` (**Alto**, conclusão cruzada da
jornada) surgiu e foi **corrigido no mesmo dia** — a correção de código está na
`main` (`src/lib/journey/cross-completion.ts`, regra de chave repetida), então
pelo critério de fechamento (Corrigido = mergeado) **a fila permanece vazia**. O
que resta é o **reparo do dado** (`scripts/fix-cross-completed-sessions.js
--apply`), operacional e restrito à **conta de teste `BP-002`** — nenhum membro
real afetado (mesma janela do `BUG-077`). `BUG-116`/`BUG-117` (Médios) também
corrigidos; `BUG-117` tem dados legados pendentes de script. Nenhum `Crítico`
aberto.

**Reconciliação de 2026-07-23:** confirmado por checagem cruzada de todos os
115 bugs registrados (`BUG-001` a `BUG-115`) que a fila está **genuinamente
vazia** — 0 Crítico, 0 Alto abertos. A entrada anterior (2026-07-22) tinha
colocado o `BUG-110` aqui por engano (o PR #131 já o havia corrigido dois dias
antes, 2026-07-20) — a própria sessão de execução seguinte pegou o erro por
leitura de git antes de agir (ver Lição 45 do `RETROSPECTIVE.md`) e já tinha
esvaziado a tabela; esta reconciliação apenas confirma que nenhum novo
Crítico/Alto surgiu desde então (T-01/T-04/T-05 concluídos, F2-01..04
concluídos, F3-02 concluído — nenhum achado de severidade alta nesse trabalho).

_(histórico)_ **Fila esvaziada em 2026-07-20 — T-02 re-fechado.** Os dois `Alto` da varredura de guards saíram:
`BUG-102` (pós-evento, PR #127) e `BUG-103` (os 5 lotes concluídos, PRs #122–#129); e o `BUG-108`
(Alto) — o **último bloqueador do T-02** — foi corrigido no PR #135 (submit do convite deriva a
identidade da sessão verificada, não de parâmetro do cliente). Nenhum `Crítico`/`Alto` aberto.

_(histórico)_ **Fila reaberta em 2026-07-19 com um `Crítico`; o `Crítico` foi contido em 2026-07-20.**
O que a reabriu não foi um bug novo do produto, e sim a **varredura de guards** (`BUG-103`) que a
Gestora pediu depois que o `BUG-102` mostrou que o `post-event.ts` escapara dos 7 lotes do
`BUG-020`. Investigando o lote 2b dessa varredura, apareceu o `BUG-106` (**Crítico**): sequestro de
conta por e-mail digitado — o mesmo padrão de identidade do `BUG-032`, corrigido num arquivo e
sobrevivente em outros dois. **Entrou e saiu em menos de 24h** (PR #124, deploy de produção
confirmado). O dado que orientou a correção: `_AuthMap` tem **0 docs com `recoveredAt`**, ou seja,
o auto-healing por e-mail **nunca disparou** em produção — endurecê-lo não quebrou recuperação
legítima de conta. Restam na fila os dois `Alto` do próprio esforço de varredura (`BUG-102` e
`BUG-103`), que são lotes de trabalho já planejados, não urgências novas.

**Fila esvaziada de novo (2026-07-17):** os 2 `Alto` do subsistema de agenda foram corrigidos e
mergeados no mesmo dia — `BUG-087` (full scan, causa do apagão, PR #112) e `BUG-088` (sync truncando
em 250, PR #113), ambos deploy de produção confirmado. Restam abertos apenas `Médio`/`Baixo` do
`AGENDA-SYNC-DESIGN.md` (`BUG-089` falha muda; `BUG-085` docs passados; Etapas 2b/3) e do dashboard
do admin (`BUG-090/091/092`), nenhum furando a ordem das fases.

_(anterior, reaberta 2026-07-17):_ os mesmos 2 `Alto` entraram pela manhã, com plano aprovado
(`AGENDA-SYNC-DESIGN.md`), e saíram à tarde.

_(anterior, fila vazia em 2026-07-16):_ dois `Alto` novos entraram e saíram no mesmo dia —
`BUG-073` (sessões de MentoCoach invisíveis para o membro) e `BUG-074` (paradas
listando sessões de outro serviço, agendáveis), ambos corrigidos no PR #101. O
`BUG-075` (typo "Bloquado" escapando do filtro de bloqueio) fica `Aberto` mas é
`Baixo` — sem impacto vivo (eventos passados) — e não entra nesta fila.

_(anterior, 2026-07-11):_ o último Alto aberto — `BUG-008` (chave de cota
1-to-1) — foi corrigido (PR #71). Nenhum `Crítico`/`Alto` aberto no momento.
Nenhum `Crítico` aberto no momento. Os dois Críticos registrados no processo
(`BUG-003` recover sem auth, PR #3; `BUG-032` escalação de privilégio no login,
PR #14) foram corrigidos e mergeados. `BUG-020` (Alto, sistêmico) também foi
fechado (7 lotes, PRs #8–#14) e saiu desta fila.

---

## Checagem cruzada — ISO/IEC 25010

| Característica | Onde é endereçada no plano abaixo |
|---|---|
| Adequação funcional | Fase 1 (por página), Fase 2 (features transversais), Fase 3 (regras de negócio), Fase 4 (jornadas e2e) |
| Usabilidade | Fase 0 (padrão canônico de design/UX via Mapa 5; tom de voz/copy via F0-06), Fase 1 (critério de aceite de cada página inclui usabilidade e revisão de texto/títulos) |
| Eficiência de desempenho | Track adicional "Não-funcional / Performance" (full scans sem paginação já achados — `BUG-017`) |
| Confiabilidade | Track adicional "Concorrência/Transactions" + Fase 4 (regressão e2e); transações do Firestore em booking/quotas já usam `runTransaction` corretamente na maioria dos casos mapeados |
| Segurança | Track adicional "Segurança sistemática" — **T-02 RE-FECHADO em 2026-07-20, conferido por PADRÃO (não bug a bug).** Reaberto em 2026-07-19 (`BUG-103`) quando a varredura por arquivo achou 57 server actions sensíveis sem guard que os 7 lotes do `BUG-020` nunca tocaram (`post-event.ts` estava na lista do próprio bug). Corrigido em 5 lotes (PRs #122–#129), que também acharam o `BUG-106` (**Crítico** — sequestro de conta por e-mail digitado, mesmo padrão do `BUG-032`, corrigido em <24h), o `BUG-107` e o `BUG-108` (último bloqueador, convite aceitando matrícula sem vínculo ao token). O lote 5 instituiu a invariante executável `server-action-surface.test.ts`. **Track fechado: 17/17 (100%)** — os 12 originais (`BUG-003/004/005/006/007/019/020/021/023/024/025/032`) + os 5 da reabertura (`BUG-102/103/106/107/108`), todos corrigidos e mergeados. Nenhum bug de segurança aberto |
| Compatibilidade | Fase 1 — critério de aceite de cada página inclui responsivo (mobile/tablet/desktop) e navegador via preview; integrações externas (Mercado Pago/Google/Resend) verificadas quanto à coexistência sem conflito no track de "Integrações externas" |
| Manutenibilidade | Track adicional "Integridade e migração de dados" (schema drift, timestamps inconsistentes, coleções órfãs, higiene da base — `BUG-008/009/010/018/040/041/042`, 6 de 7 corrigidos), reforçado pela regra "Zero Any" já enforced via ESLint |
| Portabilidade | Relevância baixa para este tipo de sistema (SaaS web único, deploy Vercel, sem exigência de múltiplas plataformas/instalação). Verificação mínima: configuração via `src/env.ts`/variáveis de ambiente (já é padrão do projeto, não hardcoded) — sem track dedicado além disso |

Nenhuma característica ficou inteiramente fora do escopo — Portabilidade tem
verificação mínima justificada pela natureza do produto (documentado acima em
vez de omitido).

---

## Fases

### Fase 0 — Fundamentos (pré-requisito para as Fases 1-4)

Decide os padrões canônicos antes de validar qualquer coisa contra eles —
evita "consertar" uma página para um padrão que será mudado depois.
**Estado: completa** (6/6 decididos; F0-01 e F0-04 seguem com execução parcial/gated).

### [F0-01] Padrão canônico de Modal
- Categoria(s) de qualidade: Usabilidade / Manutenibilidade
- Critério de aceite: decidido se `GlassModal` continua como modal-base oficial
  e um plano de convergência dos 11 modais que hoje reimplementam o padrão
  (Mapa 5 já levantou o inventário completo: só 2 de 13 modais de fato estendem
  `GlassModal`)
- Modo de validação: Automatizado (decisão embasada por Mapa 5; implementação da convergência é gated — sistema de design)
- Decisão: Decidida — `GlassModal` é o modal-base único oficial (já é o mais completo: portal, motion, ESC, variantes)
- Execução: **Parte GlassModal concluída** — lotes 1 (z-index, PR #15), A (4
  modais-card, PR #20) e B (PR #21) mergeados. Todos os modais-**card** do
  inventário estão convergidos no `GlassModal`. **Refino da decisão**: o GlassModal
  é a base dos modais-card; os modais grandes "app-shell" (`ThemeSuggestion`/
  `ContentEvaluation`/`DiscDevolutiva`) vão para um 2º componente-base próprio
  (**BUG-034**, esforço futuro). Exceções aceitas: `ServiceSelection` (público),
  `ContractGate` (gate crítico).
- Resultado: Lote 1 — escala canônica de z-index em `globals.css`. **Lote A** — 4
  modais-card no `GlassModal` (backdrop claro único, recolor para vars, `z-[1000]`
  órfão corrigido, corte eliminado via portal+scroll) + limpeza de código morto.
  **Lote B** — `NonMemberOffboardingModal` no GlassModal (+`z-[50]` órfão) e z-index
  órfãos do `JourneyNav` coordenados (`z-[200]`→`.z-overlay`, tooltip `z-50`→
  `.z-chrome-popover`); +restaurados acentos PT-BR removidos por engano no lote A.
  Validado por tsc+build+eslint; conferência visual pendente em produção (BUG-030).
  Detalhe em `F0-DECISIONS.md#f0-01`.
- Bug(s) vinculado(s): BUG-026 (parte GlassModal concluída; 2º base = BUG-034), BUG-034 (2º base p/ modais grandes, futuro), BUG-027 (Aberto, remoção segura)
- Log: [2026-07-02] decidido; [2026-07-03] lote 1; [2026-07-04] lotes A e B — ver `LOG.md`

### [F0-02] Padrão canônico de Timestamp no Firestore
- Categoria(s) de qualidade: Manutenibilidade / Confiabilidade
- Critério de aceite: decidido se o padrão daqui pra frente é sempre
  `FieldValue.serverTimestamp()` (recomendado) vs. string ISO; documentado como
  débito técnico intencional os pontos já mistos (achados no Mapa 4: `products`,
  `marketing_coupons`, `SocialPost`, `Invitation_Events/Tokens`, `_AuthMap`)
- Modo de validação: Automatizado (decisão de melhor prática técnica)
- Decisão: Decidida — `FieldValue.serverTimestamp()` (Admin SDK) na escrita +
  serialização (`serializeTimestamp`/`serializeDoc`) na leitura; proibido gravar
  `Date` nativo ou string ISO manual em campos novos
- Execução: N/A — é uma regra para código novo; pontos mistos legados aceitos
  como débito documentado, sem migração forçada de dados
- Resultado: Tipo TS deve refletir a forma serializada, não `Timestamp` do SDK
  client. Detalhe em `F0-DECISIONS.md#f0-02`.
- Bug(s) vinculado(s): BUG-009 (único defeito ativo relacionado — é de nome de
  campo, não de tipo de timestamp; **[HIPÓTESE]** que o valor lido é sempre nulo,
  ainda não confirmado por leitura direta no Firestore de produção)
- Log: [2026-07-02] decidido nesta sessão — ver `LOG.md`

### [F0-03] Padrão canônico de identidade/nome de usuário
- Categoria(s) de qualidade: Manutenibilidade / Adequação funcional
- Critério de aceite: decidida uma única fonte de verdade para nome/nickname/
  email do usuário (hoje até 7 campos concorrentes: `profile.fullName`,
  `Authentication_Name`, `User_Nickname`, `nickname`, `User_Welcome.User_Nickname`,
  `User_Name`, `User_Email`) — documentado plano de convergência gradual (não
  migração forçada, dado que é dado legado)
- Modo de validação: Automatizado (decisão técnica de fonte de verdade)
- Decisão: Decidida — precedência canônica definida (display name:
  `User_Nickname` → `Authentication_Name` → `profile.fullName` → `"Membro"`;
  nome legal: `profile.fullName` → `Authentication_Name` → `User_Nickname`;
  e-mail: `User_Email` → `email`). Campos `nickname` solto/`User_Name`/
  `User_Welcome.User_Nickname` = legado somente-leitura, nunca escrever em
  código novo
- Execução: Não iniciada — `src/lib/user-identity.ts:resolveUserNickname` (já
  existe parcialmente) ainda não foi promovido a helper canônico único;
  convergência é de leitura (todo código novo lê pela mesma precedência) e de
  escrita (todo código novo escreve nos mesmos 3 campos), sem migração de dados
  em massa
- Resultado: Detalhe em `F0-DECISIONS.md#f0-03`.
- Bug(s) vinculado(s): —
- Log: [2026-07-02] decidido nesta sessão — ver `LOG.md`

### [F0-04] Destino das coleções órfãs (`entitlements`, `User_JourneyMap`)
- Categoria(s) de qualidade: Manutenibilidade
- Critério de aceite: decidido se são removidas, arquivadas como legado
  documentado, ou reativadas com propósito claro
- Modo de validação: Automatizado (decisão documental; parada de escrita de `User_JourneyMap` toca onboarding/god file — implementação gated)
- Decisão: Decidida — ambas são legado sem propósito ativo; `entitlements`
  removida, `User_JourneyMap` deixa de ser escrita quando o PR gated for feito
- Execução: **Concluída** — mergeada em PR #1 (`entitlements`) + PRs #22/#23/#24/#25
  (`User_JourneyMap`). *(Corrigido nesta sessão de reconciliação — estava "Parcial",
  defasado desde o fechamento do BUG-018.)* A parte `User_JourneyMap`
  foi **reclassificada e absorvida pela consolidação do BUG-018** (T-03): descoberto
  que `User_Journey` (v3, canônico) e `User_JourneyMap` (legado) são redundantes; o
  plano passou de "só parar de escrever" para "consolidar no v3 + migrar clientes
  antigos + apagar o legado". **Concluído (BUG-018):** Ação 1a (parar de escrever,
  PR #22) + Ação 2 (migração dos 5 clientes atuais — script PRs #23/#24, executada)
  + Ação 1b (remover fallback do `admin-devolutiva`, PR #25). Consolidação completa
  no código; só resta a nomenclatura obsoleta do networking (`BUG-033`, Fase 1 —
  achado colateral separado, não pendência deste item). Ver `BUGS.md#bug-018`.
- Resultado: Correção de uma suposição inicial registrada no processo:
  `src/types/entitlements.ts` **não** era órfão (hospeda `MemberQuota`/
  `MemberQuotaWallet`, usados por `quotas.ts`/`useJourney.ts`) — foi mantido; a
  remoção foi cirúrgica (só ação + 2 tipos mortos). Validado por type-check +
  build. Detalhe em `F0-DECISIONS.md#f0-04`.
- Bug(s) vinculado(s): BUG-018 (Em Progresso — parte `entitlements` mergeada, `User_JourneyMap` pendente)
- Log: [2026-07-02] decidido e parcialmente implementado — ver `LOG.md`

### [F0-05] Paridade de guard servidor entre `/hub` e `/admin`
- Categoria(s) de qualidade: Segurança
- Critério de aceite: decidido se `/admin` deve ganhar verificação server-side
  equivalente à de `src/app/hub/layout.tsx` (hoje é só client-side)
- Modo de validação: Automatizado para a análise (código confirmado); implementação gated — segurança/identidade → plano + aprovação antes de codar
- Decisão: Decidida — admin ganha guard server-side equivalente ao hub
- Execução: Concluída — mergeada (PR #1, `88eaf97`)
- Resultado: **[CONFIRMADO]** por leitura direta: `src/app/hub/layout.tsx`
  chamava `verifySignedSession()`; `src/app/admin/layout.tsx` não verificava
  nada (só renderizava `<AdminLayoutClient>`, guard 100% client). Implementado:
  `admin/layout.tsx` agora é async e chama `getServerSession()` (traz
  `isAdmin`), com `redirect("/")` no servidor se sessão ausente /
  `role==="suspended"` / `!isAdmin` — espelhando `requireAdmin`. Guard client
  mantido como 2ª camada. `type-check` e `next build` limpos. Nota: isto
  protege o RENDER da página; guards de Server Action (BUG-020/T-02) são
  esforço separado e igualmente necessário. Detalhe em `F0-DECISIONS.md#f0-05`.
- Bug(s) vinculado(s): BUG-007 (Corrigido — PR #1)
- Log: [2026-07-02] decidido e implementado — ver `LOG.md`

### [F0-06] Padrão canônico de tom de voz e nomenclatura (textos, títulos, subtítulos)
- Categoria(s) de qualidade: Usabilidade / Manutenibilidade
- Critério de aceite: guia de estilo definido (tom institucional, padrão de
  título/subtítulo, o que pode permanecer hardcoded vs. o que deve vir de
  config) e usado como referência objetiva para a revisão de copy da Fase 1;
  achados pontuais de copy hardcoded já mapeados avaliados contra esse guia
- Modo de validação: Requer execução humana (ratificação) — rascunho de guia embasado por análise de copy (feito); tom institucional é decisão de marca da Gestora
- Decisão: Ratificada — pela Gestora em 2026-07-02 (tom formal-acolhedor,
  tratamento "membro"/"você"; caixa alta + tracking largo como padrão oficial
  de título da área logada)
- Execução: Parcial — extração da data de vigência hardcoded (`/privacidade` e
  `/termos`) para `src/config/legal-pages.ts` **concluída e mergeada** (PR #1);
  revisão de copy página-a-página contra o guia ainda não feita (entra como
  critério de aceite da Fase 1)
- Resultado: **Correção de mapa registrada**: o achado original "preço/garantia
  fixos em `/servicos/[audience]/[slug]`" era **[HIPÓTESE] refutada** —
  verificado que o preço vem de `product.price` (config) e não há texto de
  garantia nessa rota. A copy hardcoded real **[CONFIRMADO]** está em
  `/checkout/[slug]/page.tsx:228/238` ("Resgate via Faturamento Interno"/
  "Garantia BPlen" — rótulo de marca, pode ficar hardcoded) e a data de
  vigência em `/privacidade:20` (já corrigida). Detalhe em
  `F0-DECISIONS.md#f0-06`.
- Bug(s) vinculado(s): — (revisão de copy por página entra no critério comum da Fase 1)
- Log: [2026-07-02] ratificado e parcialmente implementado — ver `LOG.md`

---

### Fase 1 — Validação por página (Mapa 2)

Critério de aceite comum a todo item desta fase, salvo exceção anotada:
página renderiza sem erro no console/preview, guard de acesso funciona como
documentado no Mapa 2, responsivo em mobile/tablet/desktop, nenhum dado
sensível vaza para um papel que não deveria vê-lo, e títulos/subtítulos/CTAs
revisados contra o guia de tom de voz definido no F0-06 (sem erro de texto,
sem copy hardcoded fora do que o guia permitir).

### [F1-01] Páginas públicas de marketing (home, /servicos, /profissionais, /conteudo)
- Categoria(s) de qualidade: Adequação funcional / Usabilidade / Compatibilidade
- Critério de aceite: ver critério comum acima
- Modo de validação: **Automatizado** (páginas públicas — validáveis no preview)
- Decisão: —
- Execução: **Em andamento** — 2 PRs mergeados (PR #26 correções + PR #27 limpeza
  BUG-039). Validadas ao vivo no preview: `/` (home, incl. mobile), `/servicos`,
  `/servicos/pessoas` (com `ComparisonTable`), `/conteudo`. Validadas por leitura de
  código (build confirma render): `/servicos/[audience]/[slug]` (detalhe +
  `MatriculaGuard`), `/profissionais/[slug]` (SSG), `/conteudo/artigo/[id]` — sem
  achados novos. Pendente (bloqueado pela instabilidade do preview local, não por
  defeito): reconferência ao vivo de `/profissionais/[slug]` e `/conteudo/artigo/[id]`
  + responsivo tablet das internas — de baixo risco, pode fechar numa passada final.
  **[2026-07-21] VALIDADA em produção pela Gestora:** correu as páginas, folheou, tudo funcional,
  nada quebrou. **F1-01 concluída.**
- Resultado: renderização sem erro nas páginas validadas (após o fix do BUG-036,
  console limpo do erro de hidratação). Achados corrigidos: **BUG-036** (hidratação
  no `ComparisonTable`), **BUG-037** (acentos/crase), **BUG-014** (import morto) —
  todos PR #26. Novos achados adiados/gated: **BUG-038** (`<Image>` sem `sizes`,
  perf, adiado), **BUG-039** (ação `seedComparisonProductsAction` órfã sem guard,
  remoção gated). Copy geral das páginas conferida contra o guia F0-06 (tom
  formal-acolhedor, títulos em caixa alta) — conforme.
- Bug(s) vinculado(s): BUG-014 (Corrigido, PR #26), BUG-036 (Corrigido, PR #26),
  BUG-037 (Corrigido, PR #26), BUG-038 (Aberto/adiado), BUG-039 (Corrigido, PR #27),
  BUG-048/049/050 (Abertos — defeitos do cluster de acabamento, ver `F1-01-AJUSTES.md`)
- Pendência de validação acumulada: `WelcomeRedirectModal` (F0-01 lote A, via
  `MatriculaGuard` em `/servicos/[audience]/[slug]`) foi recolorido de branco
  fixo para vars de tema — conferência visual nos temas claros pendente em
  produção (o modal só aparece na tentativa de compra sem matrícula; confirmar
  no fluxo real, não só por leitura de código). Wiring do `MatriculaGuard`
  confirmado por leitura nesta sessão.
- Log: [2026-07-07] validação iniciada + PR #26 (BUG-014/036/037) — ver `LOG.md`

### [F1-02] Fluxo de checkout público e contrato retroativo
- Categoria(s) de qualidade: Adequação funcional / Segurança
- Critério de aceite: ver critério comum + confirmar se `/checkout/[slug]`
  deve convergir para o fluxo oficial de membro ou se a duplicidade é
  intencional (decisão de negócio, não só técnica)
- Modo de validação: PENDENTE
- Decisão: **Decidida (2026-07-09)** — `/checkout/[slug]` (página órfã, resgate
  gratuito/cupom-100%) **removida**; a ativação grátis já vive no fluxo de membro
  `/hub/checkout` (`CheckoutFlow`). O contrato retroativo (BUG-022) foi **expandido pela
  Gestora** para um redesenho do subsistema de contratos (ver `CONTRACTS-DESIGN.md`).
- Execução: **Em andamento (avançado)** — BUG-002 corrigido (PR #48: trava de preço
  server-side + remoção da rota órfã). O subsistema de contratos (`CONTRACTS-DESIGN.md`)
  avançou de **CT-0 a CT-3b.2**: geração de PDF corrigida (CT-0, PR #49), entidade de
  contrato + IP real (CT-1, PR #50), avulso robusto por token único (CT-2, PR #51),
  contrato visível antes de assinar via fonte única (CT-3a, PR #55), rename avulso +
  checkboxes configuráveis (CT-3b.1, PR #56), assinatura pós-checkout grátis+pago (CT-3b.2,
  PR #57), padrão Gestão Funcional + herança de tema (PR #58), carimbo + código único no PDF
  (PR #59), gate de liberação "pagamento aprovado E contrato assinado" + fluxo grátis direto
  + avulso libera ao assinar (PR #60), status real na tela de sucesso (PR #61), geo por IP
  no carimbo (PR #62) e **CT-4 — painel `/hub/membro/contratos` reescrito (1 card por serviço,
  status real de assinatura, documento in-app via `/api/docs`, rota morta corrigida) + nota
  fiscal (exibição + upload admin), PRs #63/#64**, e **BUG-055 aposentado — portão de HUB
  morto removido + trava de acesso por-serviço auditada (pago+assinado via entitlement),
  PR #66**. **Sem bloqueadores de código.** Pendente = **apenas a validação MANUAL da Gestora
  em produção** dos 3 fluxos (grátis/pago/avulso), **programada para APÓS a limpeza da base do
  usuário de teste** (BUG-030 impede validar telas logadas no preview; nenhum bloqueador de
  código) — e, fora do caminho crítico, CT-3c (área `/hub/legal` + audiências
  empresas/parceiros) e CT-5 (reforços jurídicos sob demanda).
- **Fila de validação pós-limpeza da base (acumulada — executar junto, quando a base do usuário de
  teste for limpa):**
  1. Os 3 fluxos de contrato (grátis / pago / avulso) — item original deste F1-02.
  2. **[2026-07-19] Concessão de cota após compra (T-02 lote 1, PR #122).** Ativar um serviço
     **grátis** (preço 0 ou cupom de 100%) e conferir se a cota cai na carteira. Exercita o mesmo
     `grantServiceEntitlement` do webhook do Mercado Pago — o único caminho que a sessão de
     execução **não consegue** testar sozinha (não há como disparar pagamento real). Motivo do
     adiamento: o usuário de teste já está cheio de cotas e serviços, o que mascara o resultado.
- Resultado: BUG-002 **[CONFIRMADO]** e corrigido — brecha de concessão gratuita de
  produto pago fechada. A investigação do subsistema revelou fragmentação/quebra
  estrutural, endereçada nas fases CT-*: geração de PDF na coleção errada (`BUG-051`,
  corrigido), IP placeholder (`BUG-054`, corrigido — IP real + geo), documento não
  visualizável (`BUG-052`, em progresso — cláusulas na tela + link do documento; viewer/
  painel restam no CT-4), painel por pagamento e não assinatura (`BUG-053`, CT-4), gate lê
  subcoleção morta (`BUG-055`, redesenho no CT-4). Defeitos de UX da CT-3b.2 (`BUG-056`)
  corrigidos (PR #58). Consolidado em `CONTRACTS-DESIGN.md`.
- Bug(s) vinculado(s): BUG-002 (Corrigido, PR #48), BUG-022 (Corrigido via CT-2, PR #51),
  BUG-051 (Corrigido, CT-0/PR #49), BUG-054 (Corrigido — IP real CT-1/PR #50 + geo PR #62),
  BUG-056 (Corrigido, PR #58), BUG-052 (Corrigido — documento in-app, CT-4/PR #63),
  BUG-053 (Corrigido — painel reescrito, CT-4/PR #63), BUG-055 (Corrigido — portão morto
  aposentado + trava de acesso por-serviço auditada, PR #66), BUG-057 (Corrigido — admin
  lista contratos pela matrícula, PR #65)
- Log: [2026-07-09] BUG-002 corrigido + investigação e design do subsistema de contratos;
  [2026-07-10] contratos CT-0..CT-2 (PRs #49/#50/#51), CT-3a (PR #55), CT-3b.1 (PR #56),
  **CT-3b.2 — assinatura pós-checkout grátis+pago (PR #57)**, correção UX/design + padrão
  Gestão Funcional (PR #58, BUG-056), carimbo + código único no PDF (PR #59), **gate de
  liberação — serviço só com pagamento aprovado E contrato assinado + fluxo grátis direto
  + avulso libera ao assinar (PR #60)**, status real na tela de sucesso (PR #61), geo por
  IP no carimbo (PR #62) e **CT-4 — painel reescrito + documento in-app + nota fiscal (PRs
  #63/#64, fecha BUG-052/053)** — ver `LOG.md` e `CONTRACTS-DESIGN.md`

### [F1-03] Hub — dashboard e motor de jornada
- Categoria(s) de qualidade: Adequação funcional / Usabilidade
- Critério de aceite: ver critério comum + Sequence Lock e Upsell Gate se
  comportam conforme Mapa 3
- Modo de validação: Automatizado (código) + Requer execução humana (conferência visual em produção)
- Decisão: —
- Execução: **Concluída — validada em produção pela Gestora (2026-07-11).** Dashboard da
  jornada, nav, Sequence Lock e Upsell Gate **aprovados** (itens 1-4); modal de offboarding
  **aprovado**. Achados de UI corrigidos (PR #72) e **os 3 reconferidos e aprovados** pela
  Gestora: **BUG-059** (onboarding bloqueado usava layout de upsell com foto → passou ao gate
  reutilizável no padrão do offboarding), **BUG-060** (upsell exibia nomes técnicos dos
  checkpoints → removidos), **BUG-061** (modal de detalhe do serviço fora do padrão global →
  convertido ao `GlassModal` + conteúdo em grid de 2 colunas descrição|workflow).
- Resultado: motor de jornada por dado (`resolverAcesso`, B2) + trava de sequência + modais da
  nav (upsell/onboarding/offboarding/detalhe) **validados e aprovados** em produção. F1-03
  fechada. (BUG-015 — `/hub/step-journey` órfã/duplicada — segue à parte no F2-01, destino do
  `step-journey`, não bloqueia esta página.)
- Bug(s) vinculado(s): BUG-015 (Aberto — tratado no F2-01), BUG-059 (Corrigido, PR #72),
  BUG-060 (Corrigido, PR #72), BUG-061 (Corrigido, PR #72), **BUG-073 (Corrigido, PR #101)**,
  **BUG-074 (Corrigido, PR #101)**, **BUG-075 (Aberto — dado/typo "Bloquado", Baixo)**,
  **BUG-077 (Corrigido, PR #104 — ids de parada colapsados; concluir uma marcava todas as irmas)**,
  **BUG-078 (Corrigido, PR #104 — cards repetidos na visao_geral; corrigido no dado)**
- Log: [2026-07-11] validação da Gestora (itens 1-4 + os 3 ajustes aprovados); modais
  BUG-059/060/061 (PR #72) — **F1-03 fechada** — ver `LOG.md`
  [2026-07-16] **F1-03 reaberta pontualmente e refechada no mesmo dia** — a Gestora reportou que as
  sessões de **MentoCoach** nunca apareciam na agenda do membro (`BUG-073`, Alto). Causa confirmada
  por inventário read-only na base real: **não era o sync** (25 eventos já sincronizados), e sim o
  filtro `getMeetingFilterKeyword`, sem regra para mentocoach. A investigação achou um 2º Alto fora
  do escopo (`BUG-074`): o título sequestrava o filtro e 2 paradas de grupo listavam sessões de
  **outro serviço**, agendáveis. Ambos corrigidos no **PR #101** (0→25 no MentoCoach; 111→0 e 93→0
  nas 2 paradas erradas; zero regressão nas demais, verificado contra os 538 eventos reais).
  Lacuna de processo registrada: a validação de 2026-07-11 aprovou o motor de jornada **sem exercer
  o agendamento de cada parada com dado real** — ver Lição 17 do `RETROSPECTIVE.md`. Conferência do
  fix em produção pendente.

### [F1-04] Hub — carreira, agenda do membro, contratos, visão geral
- Categoria(s) de qualidade: Adequação funcional
- Critério de aceite: ver critério comum (estas 4 páginas já têm mapeamento
  detalhado no Mapa 2 — validação pode começar direto)
- Modo de validação: Automatizado (código: copy/guard/modal/header) + Requer execução humana (validação visual em produção)
- Decisão: **Guard da `visao_geral` mantido (só login), por decisão da Gestora
  (2026-07-11):** a página serve a **todos os clientes** (membro ou não), com a
  lógica de exibir tarefas conforme o serviço ativo — por isso fica em `/hub`, não
  sob o cadeado de selo de `/hub/membro`. Requisito novo da Gestora: incluir um
  **link para a Visão Geral no menu sanduíche do header do hub**. Empacotamento em
  **2 PRs** (copy | design).
- Execução: **Código completo** — pendente só a validação visual da Gestora em produção
  (BUG-030). As 4 páginas: `contratos` já compliant (herança CT-4). **PR1 (copy, PR #73,
  BUG-062):** acentos PT-BR restaurados em `visao_geral`/`gestao_carreira`. **PR2 (design,
  PR #74, BUG-063/064):** headers de `visao_geral`/`gestao_agenda`/`gestao_carreira` migrados
  para o `FunctionalPageHeader` (Gestão Funcional / F2-05; na carreira o "X% concluído" foi p/
  a status-tag e as métricas seguem abaixo); modal de detalhe da `visao_geral` padronizado no
  `GlassModal`; link "Visão Geral" adicionado ao menu sanduíche do `HubHeader`.
- Resultado: as 4 páginas com header canônico, copy com acentos, modais no padrão, guards
  auditados (`visao_geral` só login por decisão da Gestora; as outras 3 sob o cadeado Fase D).
  **[2026-07-21] VALIDADA em produção pela Gestora:** passada nas 3 páginas, tudo perfeito, nada
  quebrou, links corretos. **F1-04 concluída.** Pedido de melhoria registrado na `visao_geral`:
  data prevista + ordenação por data (`BUG-111`, custo avaliado — aguarda decisão de escopo).
- Bug(s) vinculado(s): BUG-062 (Corrigido, PR #73 — copy), BUG-063 (Corrigido, PR #74 — headers),
  BUG-064 (Corrigido, PR #74 — modal)
- Log: [2026-07-11] revisão das 4 páginas + PR1 copy (PR #73) + PR2 design (PR #74) — código
  completo, aguarda validação em produção — ver `LOG.md`
  [2026-07-12/14] **Lote de feedback da Gestora por PACOTES** (design + funcionais + regras
  globais): Pacote 1 (segurança+bugs, PR #80 — BUG-066..069), Pacote 2 (regras globais
  CLAUDE.md 6/7/8, PR #81), Pacote 3 (refino cards de Contratos, PR #82), **Pacote 4 —
  redesign da Gestão de Agenda (PR #83)**: header sem título duplicado, botão "Agendar 1 to 1"
  no header da página via novo slot `action` do `FunctionalPageHeader`, box-in-box achatado, e
  modo `embedded` no `AgendaManagementView` que mantém o admin idêntico. **Pacote 5 — redesign da
  Gestão de Carreira (PRs #85/#86)**: 5A design (4 seções discretas, checkpoints recolhíveis,
  histórico de 1-to-1 à direita do indicador, Backlog/Metas com larguras iguais, 3 históricos
  lado a lado ao final, copy 5.7); 5B funcionais — **item 8.2** (feedback com o Orientador do
  evento + migração `migrate-feedback-authors.js`) e **item 9** (`completedAt` dos objetivos).
  **Lote de feedback F1-04/F1-05 concluído (pacotes 1–6).** Ver `LOG.md`.

### [F1-05] Hub — checkout de membro, networking, perfil, entrega de serviço
- Categoria(s) de qualidade: Adequação funcional / Segurança
- Critério de aceite: ver critério comum
- Modo de validação: Automatizado (código) + Requer execução humana (validação visual em produção)
- Decisão: **Filtro de estágio do networking removido** (Gestora, 2026-07-11) — lia campo morto;
  reintroduzível pela fonte v3 se desejado no futuro.
- Execução: **Em andamento (avançado).** Revisão de código das 4 páginas feita.
  **PR #77 (gated) mergeado:** **BUG-033** (privacidade do networking — servidor só envia
  contatos/CV/portfólio visíveis; + remoção do filtro de estágio que lia `User_JourneyMap`
  morto) e **BUG-016** (entrega lê o `used` real da carteira de cotas, não mais 0). Back-buttons
  de `profile_settings` e da tela de erro da entrega normalizados para "Voltar". Segurança das
  actions já vinha do T-02 (BUG-005/006). Copy das 4 páginas conferida — limpa. **PR #78:**
  headers de `profile_settings` e `networking` migrados para o `FunctionalPageHeader` (a Gestora
  definiu que seguem o padrão **Gestão Funcional** — F2-05). **Código completo — pendente só a
  validação visual da Gestora em produção.**
- Resultado: privacidade de networking fechada (valores ocultos não trafegam mais), cota de
  entrega correta, filtro morto removido, headers no padrão canônico. Resta conferência de
  fluxos/responsivo/temas em produção (checkout membro + `CouponTermsModal`, networking, perfil, entrega).
  **[2026-07-21] VALIDADA em produção pela Gestora:** telas conferidas, tudo funcional. **F1-05
  concluída.** Pedido de melhoria no networking: renomear selo "Profissional" → "Consultor"
  (`BUG-112`, custo avaliado por escopo — aguarda decisão).
- Bug(s) vinculado(s): BUG-005 (Corrigido, PR #19), BUG-006 (Corrigido, PR #18),
  BUG-016 (Corrigido, PR #77), BUG-033 (Corrigido, PR #77); + headers Gestão Funcional (PR #78, F2-05)
- Pendência de validação acumulada: `CouponTermsModal` (F0-01 lote A, via
  `CouponInput`/`CheckoutFlow` em `/hub/checkout/[slug]`) recolorido para vars de tema —
  conferência visual nos temas claros pendente em produção (BUG-030).
- Log: [2026-07-11] revisão das 4 páginas + PR #77 (BUG-033/016) — ver `LOG.md`
  [2026-07-12/14] **Lote de feedback da Gestora por PACOTES:** Pacote 1 (segurança+bugs do
  networking, PR #80 — BUG-067/068/069), **Pacote 6 — redesign do Networking (PR #84)**: abas ao
  lado da barra de busca (funde abas + caixa de filtros numa barra única), aviso de rodapé
  discreto, copy 6.1–6.4 e abas "Membros/Profissionais/Parceiros" (opção A). Próximo: Pacote 5
  (Gestão de Carreira, com item 8.2 + item 9). Ver `LOG.md`.

### [F1-06] Validar as 19 páginas de admin
- Categoria(s) de qualidade: Adequação funcional / Segurança
- Critério de aceite: ver critério comum (Mapa 2 já detalha entrega/componentes/
  actions de todas as 19 páginas — validação pode começar direto)
- Modo de validação: **Automatizado** (leitura de código + inventário read-only na base real) +
  **Requer execução humana** (validação visual em produção — admin é 100% logado, BUG-030)
- Decisão: **Escopo definido pela Gestora (2026-07-16)** — **funcional primeiro, design depois**: a
  fase valida render/guard/dado/copy e registra o que destoar; o redesign do admin vira uma passada
  separada, com PROPOSTA por tela. **Ordem dos lotes:** A (`users` + dashboard) → B (F&S/devolutiva)
  → C (agenda) → D (produtos) → E (CRUDs) → F (ferramentas).
- Execução: **Substancialmente concluída** — as 19 páginas de admin varridas nos 6 lotes:
  - **Lote A (`/admin` dashboard) — PR #115:** BUG-090 (atalhos 404/duplicados removidos), BUG-091
    (status de sync real), BUG-092 (métrica da semana); leitura bounded ~53 vs 590. **Validado em
    produção pela Gestora.**
  - **Lote B (F&S/devolutiva) — PRs #116/#117:** BUG-072 (`[object Object]` dos benefícios, **validado
    e aprovado**) + BUG-096 (analytics F&S mostravam zeros no erro → banner). Previews de forms/surveys
    tratam id inválido — sem bug.
  - **Lote C (agenda) — antecipado por severidade:** a investigação do `BUG-075` destravou o
    subsistema de agenda inteiro (Etapas 1/2a do `AGENDA-SYNC-DESIGN.md`: `BUG-084` PR #110, `BUG-087`
    PR #112, `BUG-088` PR #113, `BUG-095` PR #114) + o fuso da política (`BUG-093`, PR #111). Todos
    **validados em produção**.
  - **Lote D (produtos) — PR #118:** BUG-047 (painel exibe os atributos do modelo de acesso,
    display-only). Scan: `products/[id]` lê Firestore direto do client mas produto é público (não é
    escalação); sem serviceCode hardcoded.
  - **Lote E (CRUDs: partners/marketing/social/qrcodes) — LIMPO, nenhum bug novo.** Guards de mutação
    confirmados dentro de cada action (T-02); sem rotas mortas, sem render de objeto cru, sem includes
    acentuado; default do gerador de cupons (`posicionamento-profissional`) é slug válido.
  - **Lote F (sandbox/migrate-welcome) — LIMPO.** Sandbox só navega (query params); `migrate-welcome`
    é `requireAdmin` + idempotente (`merge` + ids fixos, pula quem não tem legado), one-shot controlado.
  - **Pendente:** validação visual da Gestora em produção dos lotes B(devolutiva)/D (produtos) — a do
    dashboard e da agenda já foi feita.
  - **[2026-07-21] VALIDADA em produção pela Gestora:** passada OK, funcional. **Parte funcional da
    F1-06 concluída.** Fica pendente **só a passada de DESIGN geral do admin** (que a Gestora quer
    revisar à parte — não é bug, é redesign).
  - **[2026-07-21] Passada de design: levantamento feito + PLANO APROVADO** — as 19 telas
    inventariadas (design + tom); reorganização em **7 escopos** e escopo **completo por lotes**
    aprovados pela Gestora. Plano formalizado em **`ADMIN-REDESIGN-DESIGN.md`** (lotes R0..R5).
  - **[2026-07-21] R0 concluído (PR #138, deploy de produção confirmado):** camada 1 do redesign —
    sidebar reorganizada nos 7 escopos + mapa de renomeação + correção de erros (MÍDIA com acento,
    QR CODES, PROGRAMAÇÃO DA JORNADA, PAINEL, "Central de Controle"). 2 decisões de rótulo resolvidas
    pela Gestora antes de executar (F&S e Sandbox mantidos). `MIGRAR ONBOARDING` adicionada à nav
    (página órfã de nav, sinalizada para veto). **R0 validado pela Gestora.**
  - **[2026-07-21] R1 concluído (PR #139, deploy de produção confirmado):** camadas 2+3 em Visão Geral
    + Comercial (`/admin`, `products` + `new`/`[id]`, `partners`). Nasceu o componente compartilhado
    `StatTile`; `FunctionalPageHeader` adotado nas 5 telas; passada de copy/tom (acentos restaurados,
    jargão removido, "Ecosistema"→"Ecossistema", emojis de comentário removidos). Achado adiado:
    `BUG-113`. **R1 validado pela Gestora.**
  - **[2026-07-21] R2 concluído (PR #140, deploy de produção confirmado):** camadas 2+3 em Marketing
    (`marketing`, `social`, `qrcodes`). `FunctionalPageHeader` + `StatTile` nas 3 telas (MetricCard/
    cartões `text-4xl` locais → `StatTile`); passada de copy/tom (acentos no `marketing`, "MEDIA E
    EDITORIAL"→"Mídia e Editorial", "MÁQUINA DE QR CODES"→"QR Codes", "Google Drive corporativo"
    removido). Imports mortos removidos (17→4 problemas de eslint nos 3 arquivos). Sem bugs novos.
    **R2 validado pela Gestora.**
  - **[2026-07-21] R3 concluído (PR #141, deploy de produção confirmado):** camadas 2+3 em Jornada e
    Agenda (`agenda`, `gestao-agenda`). `FunctionalPageHeader` + `StatTile` (agenda: botões e Top-5
    preservados; gestao-agenda: abas no slot action); copy/tom ("PROGRAMAÇÃO Hub"→"Programação da
    Jornada", "Dashboard"→"Painel", acentos). Não tocou a lógica de sync. Sem `--no-verify` (eslint
    sem erro). Sem bugs novos. **R3 validado pela Gestora.**
  - **[2026-07-21] R4 concluído em 2 PRs (deploy de produção confirmado):** dividido para isolar a área
    de survey/form (design global próprio). **R4a — Pessoas (PR #142):** `FunctionalPageHeader` no
    `users` (sem tiles); copy ("Governance Engine"→"Governança Ativa", "(Cleanup)"/"(Role)"), 1 emoji
    removido. **R4b — Instrumentos F&S (PR #143):** header + `StatTile` no chrome admin de `fs`/`fs/forms`/
    `fs/surveys`/`fs/devolutiva`; **nomes de banco humanizados** ("FORMS_REGISTRY"/"SURVEY_REGISTRY"/
    "CollectionGroup"). **Design próprio das surveys/forms preservado** (previews: só emoji + nome-de-banco
    no erro; engines intactos). **R4 validado pela Gestora.**
  - **[2026-07-21] R5 concluído + BUG-113 (PR #144, deploy de produção confirmado) — REDESIGN COMPLETO:**
    último lote (Sistema e Ferramentas): `sandbox` (header + copy + recolor do badge) e `migrate-welcome`
    (convertido ao layout padrão com header; "Migração: Welcome Survey"→"Migrar Onboarding"; nomes de
    banco removidos; recolor). **BUG-113 corrigido junto** (recolor das brancas hardcoded em `partners`).
    **As 19 telas do admin agora usam o `FunctionalPageHeader` e o `StatTile`; nomes de banco/inglês
    limpos da UI; design próprio das surveys/forms preservado.** Falta só a validação visual da Gestora
    em produção, ponto a ponto por lote (BUG-030) — checklist entregue.
  Nota: os 4 bugs de segurança vinculados abaixo já
  foram corrigidos (via T-02), mas a validação de UI/responsivo/copy das
  páginas em si ainda não começou; não confundir uma coisa com a outra.
  **Pendência acumulada para esta fase (Gestora, 2026-07-04):** investigar a
  causa-raiz do `BUG-035` — revogação de `member_area_access` via admin não
  surte efeito. Isso também **bloqueia**, transversalmente, a validação visual
  do `NonMemberOffboardingModal` registrada em `F1-03` (não dá para criar o
  estado "não-membro" sem a revogação funcionar). *(Nota: a conferência visual
  dos 5 modais-card do F0-01 lotes A/B em temas claros foi redistribuída para
  as páginas onde cada um de fato renderiza — `F1-01` (`WelcomeRedirect`),
  `F1-03` (`SequenceLock`/`Upsell`/`NonMemberOffboarding`) e `F1-05`
  (`CouponTerms`) — nenhum deles é uma página admin; corrigido nesta
  reconciliação, estavam todos bundlados aqui por engano.)*
- Resultado: **1ª entrega da fase — PR #110** (lote C, antecipado por severidade). O sync voltou a
  gravar os eventos de bloqueio, que ele descartava desde `fc00c6d` (2026-06-01): a agenda pública
  oferecia ao lead **249 dos 756 horários (32,9%)**, em 23 de 31 dias, em cima de um bloqueio real
  da Gestora. Nenhum horário agendável dela foi perdido (0 dos 70 slots "1 to 1" afetados —
  verificado com a função de produção contra a agenda real). Fonte única de "o que é bloqueio"
  extraída (`src/lib/booking/blocker.ts`), fechando junto o `BUG-075` e 2 colaterais do mapa de
  consumidores (`BUG-086`; e o guard de bloqueio no `bookEventAction`, onde `totalCapacity: 0`
  significava ilimitado). Validação visual em produção pendente (BUG-030).
- Bug(s) vinculado(s): BUG-003 (Corrigido), BUG-007 (Corrigido), BUG-023 (Corrigido), BUG-024 (Corrigido),
  BUG-035 (**Corrigido, PR #37** — via reestruturação do modelo de acesso, ver `ACCESS-MODEL-DESIGN.md`),
  **BUG-084 (Corrigido, PR #110)**, **BUG-086 (Corrigido, PR #110)**, **BUG-075 (Corrigido, PR #110 —
  como efeito do BUG-084)**, **BUG-085 (Aberto — adiado, correção óbvia é destrutiva)**,
  BUG-072 (Aberto — na fila do lote B), BUG-047 (Aberto — na fila do lote D)
- Log: [2026-07-16] plano da F1-06 aprovado (funcional primeiro; lotes A→F) + PR #110 (BUG-084/086/075)
  — ver `LOG.md`

---

### Fase 2 — Features transversais (Mapa 1)

### [F2-01] Consistência do motor de Jornada entre variações
- Categoria(s) de qualidade: Adequação funcional / Manutenibilidade
- Critério de aceite: decidido o destino de `/hub/step-journey` (remover,
  redirecionar, ou justificar como alternativa válida)
- Modo de validação: Automatizado (remoção de rota órfã — confirmada 0 refs no `src/`)
- Decisão: **Decidida (Gestora, 2026-07-22) — REMOVER `/hub/step-journey`.** Órfã
  confirmada por leitura (nenhum `href`/`push`/link aponta para ela; é dashboard de
  jornada duplicado da `/hub/journey`). BUG-043 (`steps-registry.ts` fora de sync) a
  tratar junto por ser a mesma fonte de dado.
- Execução: **Concluída — mergeada em PR #152** (`5ab0c79`, deploy de produção confirmado).
  `/hub/step-journey` (page + layout) removida.
- Resultado: rota órfã eliminada; nenhum arquivo compartilhado afetado. **BUG-043 segue
  em aberto e independente** (`steps-registry.ts` é importado por `actions/journey.ts`, não
  pela rota removida) — a tratar à parte, não é pendência desta remoção.
- Bug(s) vinculado(s): BUG-015 (**Corrigido**, PR #152), BUG-043 (**[HIPÓTESE]**/Aberto,
  `steps-registry.ts` fora de sincronia — independente da rota removida)
- Log: [2026-07-22] decidido remover + removido (PR #152) — ver `LOG.md`

### [F2-02] Consistência do Gate de Contrato em todas as páginas do hub
- Categoria(s) de qualidade: Adequação funcional / Segurança
- Critério de aceite: `ContractGateModal` bloqueia consistentemente em todas as
  páginas do hub quando há pendência, sem exceção não documentada
- Modo de validação: Automatizado (auditoria de código, read-only)
- Decisão: **Premissa atualizada (auditoria 2026-07-22)** — o `ContractGateModal` (modal hub-wide)
  **não existe mais**. O gating de contrato foi redesenhado (CONTRACTS-DESIGN CT-*, ACCESS-MODEL) para
  um modelo **por-serviço via entitlement**, não um modal bloqueando o hub inteiro.
- Execução: **Auditada — PASSA (2026-07-22), sem código.** O contrato é enforced **estruturalmente na
  camada de entitlement**, em 3 pontos:
  1. **Concessão** (`lib/checkout.ts:maybeReleaseService`, l.263-285): só concede o serviço com
     **pagamento aprovado E contrato `status:"assinado"`** (a "Condição 2"). Sem assinatura, não há grant.
  2. **Entrega** (`actions/delivery.ts:57`): recusa (`"Você não possui acesso a este serviço"`) se o
     membro não tem `User_Permissions/access.services[serviceCode]`.
  3. **Navegação/jornada** (`lib/access/resolve-access.ts:resolverAcesso`, engine PURO único, consumido
     via `journey-adapter` → `useJourney`): sem o entitlement → `UPSELL`/`PREVIA` (bloqueia a entrada).
- Resultado: sem entitlement não há acesso; sem contrato assinado não há entitlement. **Nenhuma "fresta"
  encontrada** nos 3 pontos principais (grant/entrega/navegação). O gate deixou de ser "um modal que
  uma página pode esquecer" e virou uma **trava estrutural** (engine único + check no grant e na
  entrega). Parte disto já fora auditado no `BUG-055` (PR #66, "trava de acesso por-serviço:
  pago+assinado via entitlement"). **Nota de escopo:** o hub em si (dashboard/visao_geral/networking/
  perfil) é acessível a todo membro com selo (`member_area_access`) por design — o gate é por-SERVIÇO,
  não hub-wide; não foi feito um grep exaustivo de TODA action que lê conteúdo de serviço, mas a
  arquitetura (entitlement único) torna um bypass estruturalmente improvável.
- Bug(s) vinculado(s): BUG-002 (Corrigido, PR #48 — trava de preço), BUG-055 (Corrigido, PR #66 — trava
  por-serviço auditada)
- Log: [2026-07-22] auditada por código — PASSA, premissa (modal) obsoleta — ver `LOG.md`

### [F2-03] Consistência do seletor de tema entre hub e admin
- Categoria(s) de qualidade: Usabilidade
- Critério de aceite: as 7 opções de tema funcionam identicamente nas duas áreas,
  sem página que "esqueça" de herdar o `HubHeader`
- Modo de validação: Automatizado (código) + Requer execução humana (conferência visual em produção)
- Decisão: —
- Execução: **Validada por código (2026-07-22) — sem mudança necessária.** Confirmado por leitura:
  (1) o **motor** de tema aplica a classe globalmente no `document.body` (`ThemeContext.applyTheme`),
  então hub, admin e público recebem o tema de forma idêntica; (2) o **seletor real** é o mesmo
  componente `HubHeader`, renderizado no hub via `HubShell` (dentro de `hub/layout.tsx`, que envolve
  **todas** as páginas do hub) e no admin via `AdminLayoutClient` — nenhuma página "esquece" o header
  porque ele vive no shell/layout, não por página; (3) os **7 temas** (`light`/`dark`/`rosa-pitaya`/
  `lavanda-azulado`/`amarelo-sol`/`cinza-nublado`/`daltonico`) são definidos uma vez em `BPlenTheme` e
  compartilhados. **Nenhum código tocado** (regra da máquina: não mexer no seletor/paleta).
- Resultado: consistência estrutural garantida por construção (motor global + header no shell das duas
  áreas + 7 temas únicos). Observação menor (não é defeito): o `HubShell` reaplica a classe de tema na
  própria `div` além do `body` — redundante e inócuo; o admin confia só no `body`. Conferência visual
  dos 7 temas nas duas áreas fica com a Gestora (BUG-030); o redesign do admin (R0–R5) já exercitou os
  temas no admin, validado.
- Bug(s) vinculado(s): —
- Log: [2026-07-22] validada por código — ver `LOG.md`

### [F2-04] Consistência de Cotas/Entitlements
- Categoria(s) de qualidade: Adequação funcional / Confiabilidade
- Critério de aceite: chave de cota 1-to-1 unificada (uppercase vs lowercase),
  e decisão tomada sobre conectar `consumeQuotaAction` ao fluxo real de booking
- Modo de validação: Automatizado (unificação de chave — decisão técnica embasada por leitura)
- Decisão: **Decidida (2026-07-22)** — chave "1-to-1" unificada em minúsculo canônico
  (Gestora, PR #71). A 2ª parte — conectar `consumeQuotaAction` ao booking real —
  **decidida pela Gestora (2026-07-22): SIM, trava real** (ao esgotar a cota contratada,
  o agendamento 1:1 bloqueia). Como é **área financeira**, a implementação exige
  **plano+aprovação** antes de codar (a próxima entrega do BUG-013 é esse plano, não o
  código). É o BUG-013.
- Execução: **Concluída** — BUG-008 corrigido (PR #71): chave canônica minúscula,
  helper `src/lib/quota-keys.ts`, gravador auto-cura o drift, leitores tolerantes,
  migração `scripts/normalize-quota-keys.js` (executada 2026-07-19, reconfirmada limpa
  2026-07-22). **BUG-013 corrigido (PR #153, 2026-07-22, deploy confirmado):** trava real
  da cota 1:1 ligada ao booking — consome ao agendar (atômico), estorna ao cancelar em
  tempo hábil, escopo só no tipo `1-to-1` (validação das 5 categorias com a Gestora).
- Resultado: ✓ BUG-008 (chave 1-to-1 unificada, PR #71). ✓ BUG-013 (trava real, PR #153).
  **[2026-07-16]** O `BUG-013`
  ganhou **dependente**: a política de agendamento agora publicada (PR #103) diz que
  cancelar com menos de 24h faz o membro perder o crédito da sessão. A regra está
  implementada e **deixa o rastro pronto** (`lateCancellation` em
  `User_Booking_History`), mas **o débito em si continua manual/operacional** enquanto
  o `consumeQuotaAction` não for ligado ao booking. Enquanto isso, a frase "preservam
  o crédito" é verdadeira apenas como regra de conduta, não como automação.
- Bug(s) vinculado(s): BUG-008 (Corrigido, PR #71), BUG-013 (**Corrigido, PR #153** — a
  política de 24h de perda de crédito agora é automática: cancelamento tardio de 1:1 não
  estorna), BUG-076 (Corrigido, PR #103),
  BUG-093 (Corrigido, PR #111 — fuso do servidor na política de agendamento), BUG-094
  (Aberto/adiado — `resolveEventWeek` mistura semana ISO com ano civil), BUG-104 (Aberto —
  editar cota no painel soma em vez de definir) *(3 adicionados nesta reconciliação —
  já constavam no índice bug→track vinculados a F2-04, mas ausentes deste campo)*
- Log: [2026-07-11] BUG-008 corrigido — ver `LOG.md`
  [2026-07-16] **BUG-076 corrigido (PR #103)** — política de agendamento única, alinhada
  e validada no servidor (janela de 20 dias para todos, limite semanal por tipo de sessão,
  prazo de 24h). Fonte única em `src/lib/booking/policy.ts`, chamada por cliente e servidor.
  Ver `LOG.md`

### [F2-05] Categorização das páginas logadas nos 4 conceitos + padrão de design por conceito
- Categoria(s) de qualidade: Usabilidade / Manutenibilidade (sistema de design)
- Critério de aceite: os 4 conceitos de página da área logada estão **formalmente
  definidos e documentados**, e cada página logada está **categorizada** em um deles;
  cada conceito tem um **padrão de design canônico** (header, título, tema) com
  páginas de referência. Conceitos (Gestora, 2026-07-10):
  - **a) Fullscreen** — só interação, nada além dos textos/interações na tela
    (ex.: tourguide, `welcome_survey`).
  - **b) BPlen Journey** — entrega dos serviços da jornada, com checkpoints (paradas)
    e o nav da jornada do membro sempre presente.
  - **c) Gestão Funcional** — `gestao_agenda`, `gestao_carreira`, `profile_settings`,
    `contratos`, `visao_geral` (e as telas de **contrato** e **checkout**). Padrão de
    referência: `gestao_carreira` (posicionamento do título, botão de retorno, linha
    de cabeçalho, status-tag) + `/conteudo` (título cor dupla, tamanho de fonte).
  - **d) Autênticas** — características próprias (ex.: `bplen.com`, `/hub`, `/hub/membro`).
- Modo de validação: Requer execução humana (decisão de design da Gestora) + passada
  página-a-página (gated — sistema de design)
- Decisão: **Parcial (2026-07-10)** — conceitos definidos pela Gestora; padrão Gestão
  Funcional destilado num header canônico reutilizável
  (`src/components/layout/FunctionalPageHeader.tsx`, PR #58) e aplicado às telas de
  contrato (avulso + checkout) e checkout. Categorização formal das demais páginas e
  aplicação do padrão a elas: pendente.
- Execução: **Concluída — 2026-07-24.** Categorização formal de **todas as rotas logadas (hub +
  admin**, escopo ampliado pela Gestora) nos 4 conceitos, documentada em
  `F2-05-DESIGN-CATEGORIZATION.md` com padrão canônico + página de referência por conceito. **O admin
  coube nos 4 conceitos — nenhum 5º necessário** (16 Gestão Funcional + 2 Fullscreen/preview).
  Verificação de conformância: header OK (todas as GF com `FunctionalPageHeader`); 3 violações de
  loading da regra 8 corrigidas (**PR #161**, `eb46ef7`: "Sincronizando/Mapeando/Processando" →
  "Carregando"). Demais telas já conformam (Journey tem o nav; Autênticas são únicas por desenho;
  loads de seção e `...` mantidos por decisão da Gestora — só violações claras).
- Resultado: hub — 8 Gestão Funcional, 3 BPlen Journey, 2 Autênticas, Fullscreen a nível de
  componente, + redirects legados; admin — 16 Gestão Funcional, 2 Fullscreen. Pendência: validação
  visual da Gestora em produção das 3 copies de loading (BUG-030). Detalhe em `F2-05-DESIGN-CATEGORIZATION.md`.
- Bug(s) vinculado(s): BUG-056 (Corrigido, PR #58); BUG-063 (Corrigido, PR #74); + PR #78 (perfil/networking); + PR #161 (copy de loading)
- Log: [2026-07-10] conceitos definidos + contrato/checkout (PR #58); [2026-07-11] visao_geral/
  gestao_agenda/gestao_carreira (PR #74) + profile_settings/networking (PR #78); [2026-07-24]
  categorização formal hub+admin + conformância de loading (PR #161) — **F2-05 concluído**

---

### Fase 3 — Auditoria de regras de negócio (Mapa 3)

### [F3-01] Regras de agendamento declaradas mas não aplicadas
- Categoria(s) de qualidade: Adequação funcional / Confiabilidade
- Critério de aceite: decisão tomada (implementar enforcement ou remover a
  configuração morta) para `MAX_BOOKINGS_PER_WEEK` e antecedência mínima na
  gravação (não só na listagem)
- Modo de validação: **Automatizado** (investigação read-only de control-flow, conclusiva)
- Decisão: **Concluída** — `MAX_BOOKINGS_PER_WEEK` (BUG-012) e antecedência mínima
  (BUG-011) ambos enforçados na gravação. A investigação do BUG-011 (2026-07-28)
  confirmou que a parte do membro já era enforçada e o resíduo do funil público foi
  corrigido (decisão da Gestora: fechar + corrigir).
- Execução: **Concluída** — BUG-012 corrigido de carona (`BUG-076`/PR #103); BUG-011:
  membro já coberto (PRs #102/#103/#111), resíduo público corrigido (**PR #162**).
- Resultado: ✓ BUG-012 — `hasReachedWeeklyLimit` (`policy.ts:126`) chamado por
  `bookEventAction`, por tipo de sessão. ✓ BUG-011 — `bookEventAction` chama
  `getBookingWindowError` na transação (membro); `bookPublicMeetingAction` revalida a
  janela pública de 3 dias no write (PR #162). **F3-01 concluído.**
- Bug(s) vinculado(s): BUG-011 (**Corrigido** — investigado + resíduo público via PR #162),
  BUG-012 (**Corrigido**, via BUG-076/PR #103)
- Log: [2026-07-22] BUG-012 confirmado por leitura; [2026-07-28] BUG-011 investigado +
  resíduo público corrigido (PR #162) — ver `LOG.md`

### [F3-02] Exceções do Sequence Lock ainda fazem sentido de negócio?
- Categoria(s) de qualidade: Adequação funcional
- Critério de aceite: confirmado com a Gestora se as exceções atuais
  (`onboarding`, `mentocoach`, regra especial de `offboarding`) ainda refletem
  a intenção de produto
- Modo de validação: Requer execução humana (julgamento de negócio)
- Decisão: **Decidida (Gestora, 2026-07-22) — mantêm-se as 3 exceções** (`onboarding`,
  `mentocoach`, `offboarding` podem ser feitos fora da ordem sequencial). Confirmadas
  como intenção de produto corrente; nenhuma alteração pedida.
- Execução: **N/A — fechado.** Item puramente decisório; a decisão foi "manter", logo
  não gera mudança de código.
- Resultado: **F3-02 concluído** — exceções do Sequence Lock ratificadas como estão.
- Bug(s) vinculado(s): —
- Log: [2026-07-22] decidido pela Gestora (mantêm-se as 3) — ver `LOG.md`

### [F3-03] Regras financeiras: Cupom V2, pendência de contrato, reembolso
- Categoria(s) de qualidade: Adequação funcional / Segurança
- Critério de aceite: confirmado que a cláusula de reembolso (7 dias, textual
  no PDF) tem processo manual real por trás, e que a pendência de contrato
  cobre todos os fluxos de compra existentes (incluindo o checkout duplicado
  de `BUG-002`); confirmado se os 2 bypasses de pagamento (`bplen_free_bypass`
  em `checkout.ts`, `retroactive_bypass` em `retroactive-contract.ts`) são
  comportamento de negócio intencional
- Modo de validação: PENDENTE
- Decisão: —
- Execução: Não iniciada
- Resultado: —
- Bug(s) vinculado(s): BUG-022 (**[HIPÓTESE]** — bypass de pagamento parece
  intencional para contrato de serviço já pago por fora, mas isso não está
  confirmado/documentado como regra de negócio aprovada; *reconciliação desta
  sessão: bug não tinha item vinculado antes*)
- Log: —

---

### Fase 4 — Regressão end-to-end de jornadas completas

O mapeamento das jornadas abaixo é entregável desta fase (não pré-existente).

**Estado (2026-07-28, decisão da Gestora — "Caminho B"):** as 3 jornadas foram **mapeadas e
verificadas por código** (`F4-JOURNEYS-MAP.md`) — gates centrais sólidos, sem armadilha nova. A
**corrida e2e AO VIVO** (login/pagamento/evento reais) fica **diferida**: será feita **após a limpeza
da base do usuário de teste + mais correções/implementações**, seja pós-auditoria, seja como uma
**etapa adicional antes de fechar a auditoria**. O mapa não é bloqueante; a corrida ao vivo é o passo
de execução humana que resta. A parte de pagamento depende também da virada da credencial MP para
produção (ver `T-05-INTEGRATIONS-FINDINGS.md`).

### [F4-01] Jornada: Lead → Cliente → Membro pleno → Offboarding
- Categoria(s) de qualidade: Adequação funcional / Confiabilidade
- Critério de aceite: usuário fictício percorre desde `/servicos` até
  conclusão de todas as etapas da jornada sem travar em nenhum ponto não
  documentado
- Modo de validação: **Mapa Automatizado (leitura de código); e2e ao vivo = execução humana**
- Decisão: —
- Execução: **Mapeada — 2026-07-28** (`F4-JOURNEYS-MAP.md`). Traçada rota→gate→terminal:
  `/servicos`→`MatriculaGuard`→`/hub/checkout`→`maybeReleaseService` (gate duplo)→`/hub/membro`
  (`member_area_access`)→jornada (`resolverAcesso`)→offboarding (stage 7). Sem armadilha de código nova.
- Resultado: gates centrais sólidos. Observação: virada "membro pleno" = concessão de `member_area_access`.
- Bug(s) vinculado(s): —
- Log: [2026-07-28] mapeada — ver `LOG.md` e `F4-JOURNEYS-MAP.md`

### [F4-02] Jornada: Convidado de evento exclusivo → Membro
- Categoria(s) de qualidade: Adequação funcional
- Critério de aceite: fluxo completo de `/convites/[slug]` até criação de
  matrícula e primeiro acesso ao `/hub`
- Modo de validação: **Mapa Automatizado; e2e ao vivo = execução humana**
- Decisão: —
- Execução: **Mapeada — 2026-07-28** (`F4-JOURNEYS-MAP.md`). `/convites/[slug]`→validar token→login→
  `claimInvitationTokenAction` (transação atômica: matrícula sequencial + perfil + permissões)→
  `submitInvitationSurveyAction` (identidade da sessão verificada, BUG-108)→`/hub` (onboarding).
- Resultado: fluxo atômico e seguro. Terminal = onboarding (não membro pleno) — costura com F4-01.
- Bug(s) vinculado(s): —
- Log: [2026-07-28] mapeada — ver `LOG.md` e `F4-JOURNEYS-MAP.md`

### [F4-03] Jornada financeira: Compra → Contrato → Cancelamento
- Categoria(s) de qualidade: Adequação funcional / Segurança
- Critério de aceite: fluxo completo na **superfície única de checkout logada** (`/hub/checkout`),
  cobrindo grátis/cupom-100% e pago (MP), até geração de contrato e um cenário de cancelamento.
  _(Atualizado 2026-07-28: o critério original citava um checkout "público" que foi removido no
  `BUG-002`/PR #48 — a compra hoje é uma só, logada. Ratificado pela Gestora.)_
- Modo de validação: **Mapa Automatizado; e2e de pagamento ao vivo = execução humana (pós-virada MP)**
- Decisão: **Critério atualizado (superfície única logada), ratificado pela Gestora (2026-07-28).**
- Execução: **Mapeada — 2026-07-28** (`F4-JOURNEYS-MAP.md`). `/hub/checkout`→MP (webhook HMAC + re-fetch)
  ou grátis→contrato (`assinado`)→`maybeReleaseService`→entitlement. Cancelamento: agendamento
  (`cancelBookingAction`, grace 24h) + contrato (status `cancelado`).
- Resultado: gate duplo sólido. **Lacuna:** checkout público órfão removido (BUG-002); sem estorno MP
  self-service (manual/admin). Pagamento em credencial de TESTE (produção pós-auditoria, T-05).
- Bug(s) vinculado(s): —
- Log: [2026-07-28] mapeada — ver `LOG.md` e `F4-JOURNEYS-MAP.md`

---

## Tracks adicionais (não-funcional, segurança, dados, observabilidade, integrações, compliance)

### [T-01] Performance / concorrência
- Categoria(s) de qualidade: Eficiência de desempenho / Confiabilidade
- Critério de aceite: full collection scans identificados (`BUG-017`) avaliados
  quanto a paginação/índice; transações críticas (booking capacity, cotas,
  contador de matrícula) confirmadas como atômicas de fato
- Modo de validação: Automatizado (análise de código + medição read-only na base real)
- Decisão: **Decidida (Gestora, 2026-07-22/23)** — autorizado com escala-alvo
  **~10.000 usuários**; estrutura em **2 momentos** (Momento 1 = otimizar na infra
  atual, dentro da auditoria; Momento 2 = Blaze futuro + provedores externos,
  pós-auditoria). Plano completo em `T-01-PERFORMANCE-DESIGN.md`. 4 decisões de
  execução do Momento 1 (networking primeiro, cron compartilhado, ordem das
  fases, EXP-01 pode reusar a infra) todas aprovadas.
- Execução: **Momento 1 CONCLUÍDO (2026-07-23)** — 3 de 3 fases entregues, todas
  com deploy de produção confirmado. **T1-1 (networking, hotspot A CRÍTICO
  member-facing) — PR #158:** filtro de visibilidade no banco + teto de leitura
  anti-runaway, em vez de full scan + filtro client-side. **T1-2 (agregados
  admin B–E) — PR #159:** contadores nativos exigiriam índices de collection
  group inexistentes sem pipeline de deploy — adotado **snapshot diário**
  `Admin_Metrics_Daily` (cron compartilhado, isolado/best-effort, paridade
  validada; adianta a infra do EXP-01). **T1-3 (índices) — PR #160:**
  `firestore.indexes.json` versionado (enumerado o estado real antes de
  escrever — 0 compostos preexistentes). **Paginação da lista de usuários admin
  remetida ao Momento 2** (busca substring client-side sobre a base inteira,
  sem filtro para reduzir no banco — paginar sem índice de busca externo
  regrediria a busca do admin).
- Resultado: ✓ `BUG-017` corrigido no que o Momento 1 cobre (networking +
  agregados admin + índices). ✓ **Índices deployados pela Gestora (2026-07-24)**
  — os 3 índices (`Surveys(surveyId,status)`, `Forms.formId`,
  `User_Permissions.admin`) criados no console do Firebase; verificado por
  sonda read-only que as 3 queries voltaram a funcionar. Fecha `BUG-114`/
  `BUG-115` — **última pendência operacional do Momento 1 resolvida**. ✓
  Snapshot do T1-2 confirmado rodando em produção (cron gerando
  `Admin_Metrics_Daily` diariamente) e validado visualmente pela Gestora nas 4
  telas de analytics (2026-07-28). **T-01 Momento 1 sem nenhum resíduo.**
  **Momento 2** (futuro, pós-Blaze/na escala, fora do escopo desta auditoria):
  `Networking_Directory` + paginação da lista de usuários com busca
  server-side; adoção do plano Blaze; provedores externos (Algolia/BigQuery) se
  a escala exigir.
- Bug(s) vinculado(s): BUG-017 (Corrigido — Momento 1), BUG-038 (Corrigido, PR
  #155 — achado colateral, perf da home pública), BUG-114 (Corrigido,
  2026-07-24), BUG-115 (Corrigido, 2026-07-24)
- Log: [2026-07-23] plano escrito + revisado (2 momentos) + T1-0/1/2/3 (PRs
  #158/#159/#160); [2026-07-24] índices deployados pela Gestora, BUG-114/115
  fechados; [2026-07-28] snapshot T1-2 validado em produção — ver `LOG.md` e
  `T-01-PERFORMANCE-DESIGN.md`

### [T-02] Segurança sistemática (matriz de guards)
- Categoria(s) de qualidade: Segurança
- Critério de aceite: toda Server Action e API route do Mapa 4b/c (já
  classificada por completo — ver tabela "Server Actions — visão por padrão
  de guard" em `04-map-data-apis-permissions.md`) tem guard justificado ou
  corrigido; em especial o padrão sistêmico de dezenas de actions sem guard
  próprio (`BUG-020`) e o caso de IDOR confirmado (`BUG-019`, já corrigido)
  resolvidos ou aceitos formalmente com justificativa registrada
- Modo de validação: Automatizado (execução via análise de código, em andamento)
- Decisão: Decidida — padrão canônico de guard consolidado na prática ao longo
  dos 7 lotes do `BUG-020`: `requireAuth()`/`requireAdmin()` + checagem
  dono-ou-admin, sessão resolvida pelo cookie assinado (`verifySignedSession`/
  `getServerSession`), sem alterar assinatura de action nem dispatcher.
  Para primitivos de infraestrutura (funções chamadas de dentro de
  `getServerSession`), o padrão é separar o resolvedor cru (sem guard) do
  wrapper exposto (com guard) — ver Protocolo item 8 e Lição 9 do
  `RETROSPECTIVE.md`
- **REABERTO em 2026-07-19 (`BUG-103`) e RE-FECHADO em 2026-07-20.** A varredura por arquivo (177
  server actions expostas, 57 sem guard) mostrou que o critério de fechamento fora aplicado **bug a
  bug**, mas a lista de arquivos **dentro** do `BUG-020` também era checklist e não fora reconferida
  (`post-event.ts` escapara — `BUG-102`). A varredura correu em **5 lotes**, todos concluídos e com
  deploy confirmado: **1** cotas (PR #122), **2a** PII (PR #123), **2b** identidade/anônimos +
  `BUG-106` (Crítico)/`BUG-107` (PRs #124/#125/#126), **3** pós-evento/`BUG-102` (PR #127), **4**
  seeds fora da rede (PR #128), **5** efeitos fora da rede + **superfície conferida por padrão**
  (PR #129). O lote 5 institui a invariante executável `server-action-surface.test.ts` (toda action
  exposta tem guard OU está declarada pública-por-design com motivo) e foi nele que apareceu o
  **`BUG-108`** (Alto) — convite aceitando matrícula do cliente sem vínculo ao token — o **último
  bloqueador**, corrigido no **PR #135** (identidade pela sessão verificada). **Track T-02 fechado de
  novo, agora conferido por PADRÃO (não bug a bug):** os 12 originais + os itens da reabertura
  (`BUG-102/103/106/107/108`) estão todos Corrigidos. _(texto anterior mantido abaixo como histórico)_
- Execução: **Concluída — 17/17 (100%), Track FECHADO** (ver `DASHBOARD.md`). *(Reconciliado
  2026-07-22: campo estava travado em "12/12" desde 2026-07-04, sem refletir a reabertura/
  refechamento de 2026-07-19/20 — os 5 bugs da reabertura entram no denominador.)* **BUG-020
  Corrigido** (7 lotes, PRs #8–#14 — todos os módulos do Mapa 4b padronizados com o guard
  canônico). **BUG-021 Corrigido** (PR #13). **BUG-032 Corrigido** (PR #14, novo
  Crítico de escalação de privilégio achado no lote 7). **BUG-025 Corrigido** (PR #16, webhook MP com assinatura
  HMAC em habilitação suave). **BUG-004 Corrigido**
  (PR #17, path de debug no lugar do apelido no painel admin; rebaixado Alto→Baixo
  após avaliação de exposição — admin-only). **BUG-006 Corrigido** (PR #18, guard
  `requireAuth` em `getNetworkingDataAction`, preservando a lógica da feature de
  networking). **BUG-005 Corrigido** (PR #19, `requireMatricula` nas ações de
  pagamento do checkout — rastreabilidade fiscal). **Track T-02 fechado pela 1ª vez em
  2026-07-04 (12/12)** — depois **REABERTO em 2026-07-19** quando a varredura por arquivo
  do `BUG-103` achou 57 server actions sensíveis sem guard, incluindo `post-event.ts`
  (listado no próprio `BUG-020` mas nunca tocado pelos 7 lotes). Corrigido em **5 lotes**
  (PRs #122–#129): **1** cotas (`BUG-020` residual), **2a** PII, **2b** identidade/anônimos
  (achou o `BUG-106` **Crítico** — sequestro de conta por e-mail digitado, mesmo padrão do
  `BUG-032`, corrigido em <24h — e o `BUG-107`), **3** pós-evento (`BUG-102`), **5** efeitos
  fora da rede + invariante executável `server-action-surface.test.ts` (achou o `BUG-108`,
  **último bloqueador**, PR #135). **Track T-02 RE-FECHADO em 2026-07-20: 17/17, todos
  corrigidos e mergeados, agora conferido por PADRÃO (não bug a bug).** Nenhum Crítico aberto.
- Resultado: ✓ Corrigidos/mergeados: BUG-003 (recover sem auth, PR #3), BUG-007
  (guard admin server-side = F0-05, PR #1), BUG-019 (IDOR de foto de perfil, PR
  #4), BUG-023 (rotas de debug órfãs, PR #3), BUG-024 (`trigger-sync` removido,
  PR #5), BUG-021 (guard ad-hoc de upload unificado, PR #13), **BUG-020** (guards
  sistemáticos em Server Actions — 7 lotes, PRs #8–#14: booking/CRUD admin/
  analytics/queries/journey/upload/auth-permissions; 8 IDORs + priv-esc fechados),
  **BUG-032** (escalação de privilégio no login, PR #14), **BUG-025** (webhook
  Mercado Pago com validação de assinatura HMAC, PR #16), **BUG-004** (path de
  debug exposto no painel admin, PR #17), **BUG-006** (guard `requireAuth` no
  networking, PR #18), **BUG-005** (`requireMatricula` no pagamento do checkout de
  membro, PR #19), **BUG-102** (pós-evento sem guard, PR #127), **BUG-103** (varredura
  sistemática de 177 actions em 5 lotes, PRs #122–#129), **BUG-106** (Crítico —
  sequestro de conta por e-mail, PR #124 + PRs #125/#126), **BUG-107** (feedback de
  visitante lançando erro, PR #125), **BUG-108** (convite sem vínculo ao token — último
  bloqueador, PR #135). ○ Restantes: nenhum — **track fechado**.
- Bug(s) vinculado(s): BUG-003, BUG-004, BUG-005, BUG-006, BUG-007, BUG-019, BUG-020, BUG-021, BUG-023, BUG-024, BUG-025, BUG-032, BUG-102, BUG-103, BUG-106, BUG-107, BUG-108
- Log: entradas de 2026-07-02, 2026-07-03, 2026-07-04, 2026-07-19 e 2026-07-20 no `LOG.md`

### [T-03] Integridade e migração de dados
- Categoria(s) de qualidade: Manutenibilidade / Confiabilidade
- Critério de aceite: drifts de schema do Mapa 4 (timestamps mistos, chaves de
  cota, coleções órfãs, `AttendeeData` divergente do real) documentados com
  decisão de convergência ou aceite formal como legado
- Modo de validação: PENDENTE (executável via análise de código — profundidade
  igual às Fases 0-4)
- Decisão: —
- Execução: **Concluída — 7/7 (100%), Track FECHADO** (ver `DASHBOARD.md`).
  *(Reconciliado 2026-07-23: campo dizia "6/7", defasado desde o fechamento do
  `BUG-009` em 2026-07-22/PR #157 — o último bug do track já tinha sido
  corrigido, mas o item não foi atualizado para refletir o fechamento total.)*
  `BUG-018` (F0-04), `BUG-010` (código morto removido, PR #69), `BUG-008`
  (chave de cota unificada, PR #71), `BUG-040`/`041`/`042` (Trilha 3 de higiene)
  e `BUG-009` (timestamp corrigido, PR #157) fechados; cada um conta como
  **unidade inteira** no numerador.
- Resultado: ✓ Corrigido: BUG-018 (`entitlements` removida via F0-04 +
  consolidação completa de `User_JourneyMap` no v3 — Ações 1a/2/1b, PRs
  #22/#23/#24/#25; ver `BUGS.md#bug-018`); BUG-010 (`adminAddAttendeeAction`
  morta removida, PR #69); BUG-008 (chave de cota 1-to-1 unificada em minúsculo
  canônico + migração, PR #71); BUG-040 (~50 coleções de backup removidas da
  raiz, PR #38 + limpeza executada); BUG-041 (14 produtos legados/arquivados
  excluídos de `products`); BUG-042 (chaves de entitlement de 4 clientes
  normalizadas); BUG-009 (**[CONFIRMADO]** na base real — 0/12 `User_Bookings`
  tinham `timestamp`, 12/12 tinham `bookedAt`; `getUserBookingsAction` corrigido
  para ler o campo certo, PR #157). ○ Restantes: nenhum — **track fechado**.
- Bug(s) vinculado(s): BUG-008, BUG-009, BUG-010, BUG-018, BUG-040, BUG-041, BUG-042
- Log: [2026-07-22] BUG-009 corrigido (PR #157) — ver `LOG.md`

### [T-04] Observabilidade (alertas de erro em produção)
- Categoria(s) de qualidade: Confiabilidade
- Critério de aceite: inventariado se existe alguma ferramenta de
  monitoramento/alerta de erro em produção hoje; se não, documentado o gap e
  recomendado próximo passo (ex.: Sentry, log-based alerting)
- Modo de validação: Requer execução humana / ferramenta externa — **escopo
  reduzido**: inventariar e documentar gap, não implementar
- Decisão: —
- Execução: **Concluída (escopo reduzido) — 2026-07-23.** Inventário read-only por
  leitura de código; achados em `T-04-OBSERVABILITY-FINDINGS.md`. Sem código.
- Resultado: **Gap confirmado.** Não há error tracker (Sentry/etc.), `instrumentation.ts`
  nem `global-error.tsx`; os `error.tsx` de rota são só UX (não reportam). O "log" são
  336 `console.error` + 34 `console.warn` → log efêmero da Vercel, sem drain/alerta. O
  **único** alerta proativo de erro é o e-mail do cron `sync-agenda` (`alertarFalha`); os
  demais `notificacao@bplen.com` são transacionais. **Erro de runtime é invisível à equipe
  sem um usuário reportar** — a mesma classe reativa que mordeu o processo (`BUG-087`
  apagão de cota, `BUG-089` `catch→[]`, Lição 31 merge-sem-deploy). **Recomendado:** Sentry
  (`@sentry/nextjs`, free tier), com scrub obrigatório de PII (LGPD / `CLAUDE.md` 4 e 7).
  Implementação fica fora do escopo da auditoria (decisão da Gestora, pós-auditoria).
- Bug(s) vinculado(s): — (gap sistêmico documentado; não gera bug pontual)
- Log: [2026-07-23] inventário concluído — ver `LOG.md` e `T-04-OBSERVABILITY-FINDINGS.md`

### [T-05] Integrações externas em condição real
- Categoria(s) de qualidade: Compatibilidade / Confiabilidade
- Critério de aceite: cada ponto de acionamento identificado no Mapa 4
  (Mercado Pago, Resend, Google Drive/Sheets) testado em ambiente de sandbox
  quando disponível; quando exigir credenciais/custo real, documentar gap e
  recomendar próximo passo
- Modo de validação: misto — parte automatizável em sandbox, parte **escopo
  reduzido** (exige credencial/ambiente de teste dedicado)
- Decisão: —
- Execução: **Concluída (escopo misto) — 2026-07-23.** Verificação read-only (condição
  real, sem efeito); achados em `T-05-INTEGRATIONS-FINDINGS.md`. Sem código.
- Resultado: **Google (Calendar/Drive) e Mercado Pago confirmados vivos** por check
  read-only (Calendar `events.list` e Drive `files.get` autenticam; MP token válido +
  webhook HMAC ATIVO + código sólido — re-fetch do pagamento, idempotente). **Resend
  inconclusivo por read-only** (401 em `/domains` = provável chave sending-only, não
  falha; produto envia e-mails em produção). **2 recomendações à Gestora:** (1) confirmar
  que o token MP de PRODUÇÃO na Vercel é `APP_USR-` (o local é `TEST-`/sandbox, correto p/
  dev); (2) escopo da chave Resend local. **E2E com custo/efeito** (pagamento real, envio
  real, escrita no Drive) documentado como protocolo de execução humana (seção 4 do doc).
- Bug(s) vinculado(s): BUG-046 (Aberto, Baixo — links de e-mail p/ rota inexistente
  `/hub/membro/dashboard`; candidato a fix rápido quando tocar os templates de e-mail)
- Log: [2026-07-23] verificação concluída — ver `LOG.md` e `T-05-INTEGRATIONS-FINDINGS.md`

### [T-06] Compliance / LGPD (parte técnica)
- Categoria(s) de qualidade: Segurança / Compatibilidade
- Critério de aceite: violações técnicas já identificadas (`BUG-001`
  `Support_Tickets`, `BUG-023` rotas de debug vazando dado de identidade/survey)
  resolvidas ou formalmente aceitas como risco; certificação jurídica formal
  continua fora de escopo (ver Riscos Aceitos)
- Modo de validação: PENDENTE (parte técnica executável via análise de código;
  parte jurídica é escopo reduzido/fora de escopo)
- Decisão: —
- Execução: **Concluída — 2/2 (100%)** (ver `DASHBOARD.md`). Track fechado.
- Resultado: ✓ BUG-023 corrigido (PR #3). ✓ BUG-001 corrigido (PR #70 — tickets
  em subcoleção privada; rules publicadas e coleção raiz de teste apagada pela
  Gestora em 2026-07-11, fix 100% ativo). Certificação jurídica formal segue fora
  de escopo (Riscos Aceitos), como previsto.
- Bug(s) vinculado(s): BUG-001 (Corrigido, PR #70), BUG-023 (Corrigido, PR #3)
- Log: —

---

## Índice — Bug → Item/Track

Fonte de verdade do **status** de cada bug é sempre `BUGS.md`; esta tabela só
resolve "onde esse bug se conecta no plano", que antes era inferido lendo cada
item. Construída/reconciliada nesta sessão — 2 bugs (`BUG-004`, `BUG-022`)
estavam sem nenhum vínculo e foram linkados agora.

**Reconciliação de 2026-07-22 (checagem cruzada bug a bug, `BUG-001` a `BUG-113`):**
26 bugs estavam **completamente ausentes** desta tabela (`BUG-056` a `BUG-071`,
`BUG-073`/`074`, `BUG-076` a `BUG-083`) — todos já registrados e corrigidos em
`BUGS.md`, mas nunca linkados aqui (a tabela pulava direto de `BUG-055` para
`BUG-072`, e de `BUG-075` para `BUG-084`). Além disso, **7 status estavam
defasados** (diziam "Aberto" quando `BUGS.md` já registrava "Corrigido" há
sessões): `BUG-010` (PR #69, desde 2026-07-11), `BUG-040`/`041`/`042` (Trilha
3b/3c/3d, desde 2026-07-08) e `BUG-052`/`053`/`055` (CT-4/PR #66, desde
2026-07-10). Todos corrigidos agora — ver marcações inline na tabela.

| Bug | Severidade | Status (`BUGS.md`) | Item(s)/Track(s) |
|---|---|---|---|
| BUG-001 | Alto | Corrigido (PR #70) | T-06 — tickets em subcoleção privada (rules+base OK) |
| BUG-002 | Médio | Corrigido (PR #48) | F1-02 — trava de preço + rota órfã removida |
| BUG-003 | Crítico | Corrigido (PR #3) | F1-06, T-02 |
| BUG-004 | ~~Alto~~ Baixo | Corrigido (PR #17) | T-02 |
| BUG-005 | Médio | Corrigido (PR #19) | F1-05, T-02 |
| BUG-006 | Médio | Corrigido (PR #18) | F1-05, T-02 |
| BUG-007 | Médio | Corrigido (PR #1) | F0-05, F1-06, T-02 |
| BUG-008 | Alto | Corrigido (PR #71) | F2-04, T-03 — chave de cota 1-to-1 unificada |
| BUG-009 | Médio | **Corrigido (PR #157)** | F0-02, T-03 — `[CONFIRMADO]` timestamp lido era `timestamp`, gravado é `bookedAt` *(corrigido nesta sessão — estava "Aberto", defasado desde 2026-07-22)* |
| BUG-010 | Alto | **Corrigido (PR #69)** | T-03 — `adminAddAttendeeAction` morta removida *(corrigido nesta sessão — estava "Aberto", defasado desde 2026-07-11)* |
| BUG-011 | Médio | Corrigido (PR #162) | F3-01 — membro já enforçado; resíduo público corrigido |
| BUG-012 | Baixo | **Corrigido (via BUG-076, PR #103)** | F3-01 — limite semanal passou a ser enforced por tipo de sessão em `policy.ts` *(corrigido nesta sessão — estava "Aberto")* |
| BUG-013 | Médio | **Corrigido (PR #153)** | F2-04 — trava real da cota 1:1 no booking (consome ao agendar, estorna se cancelado em tempo hábil) *(corrigido nesta sessão — estava "Aberto")* |
| BUG-014 | Baixo | Corrigido (PR #26) | F1-01 — import morto removido |
| BUG-015 | Baixo | **Corrigido (PR #152)** | F1-03, F2-01 — rota órfã `/hub/step-journey` removida *(corrigido nesta sessão — estava "Aberto")* |
| BUG-016 | Médio | Corrigido (PR #77) | F1-05 — cota `used` real na entrega |
| BUG-017 | Médio | **Corrigido — Momento 1 (PRs #158/#159/#160)** | T-01 — networking/agregados admin/índices; paginação da lista de usuários → Momento 2 *(corrigido nesta sessão — estava "Aberto")* |
| BUG-018 | Baixo | Corrigido (PRs #1/#22/#23/#24/#25) | F0-04, T-03 — consolidação de jornada concluída |
| BUG-019 | Alto | Corrigido (PR #4) | T-02 |
| BUG-020 | Alto | Corrigido (7 lotes: PR #8/#9/#10/#11/#12/#13/#14) | T-02 |
| BUG-021 | Baixo | Corrigido (PR #13) | T-02 |
| BUG-022 | Médio | Corrigido (PR #51) | F1-02/CT-2 — retroativo robusto (link único de uso único + vínculo à conta + aviso de duplicidade); bypasses aceitos |
| BUG-023 | Alto | Corrigido (PR #3) | F1-06, T-02, T-06 |
| BUG-024 | Médio | Corrigido (PR #5) | F1-06, T-02 |
| BUG-025 | Médio | Corrigido (PR #16) | T-02 |
| BUG-026 | Médio | Em Progresso | F0-01 — parte GlassModal concluída, resta BUG-034 |
| BUG-027 | Baixo | **Corrigido (PR #156)** | F0-01 — `ThemeSelector` + playground `_docs/labs/` removidos (Gestora aprovou) *(corrigido nesta sessão — estava "Aberto")* |
| BUG-028 | Baixo (rebaixado) | Aberto (adiado) | fora do escopo original — cluster de auth, ver `LOG.md` 2026-07-02 |
| BUG-029 | Baixo (rebaixado) | Aberto (adiado) | fora do escopo original — cluster de auth, ver `LOG.md` 2026-07-02 |
| BUG-030 | Baixo | Aceito | Riscos Aceitos (item 5, abaixo) |
| BUG-031 | Baixo | **Corrigido (duplicata do BUG-095, PR #114)** | T-05/agenda — o sync já reconstrói o `Programacao_Registry` *(corrigido nesta sessão — estava "Aberto")* |
| BUG-032 | Crítico | Corrigido (PR #14) | T-02 — escalação de privilégio (novo, achado no lote 7) |
| BUG-033 | Médio | Corrigido (PR #77) | F1-05 — privacidade networking + filtro de estágio morto removido |
| BUG-034 | Baixo | Aberto (futuro) | F0-01 — 2º componente-base p/ modais grandes app-shell (opção iii) |
| BUG-035 | Alto | **Corrigido (PR #37 — Fase D)** | F1-06 — resolvido pela reestruturação do modelo de acesso (A0→D, `ACCESS-MODEL-DESIGN.md`): cadeado server-side em `hub/membro/layout.tsx`, bypass `isAdmin \|\|` removido. Desbloqueia a validação do offboarding modal (F1-03) |
| BUG-036 | Médio | Corrigido (PR #26) | F1-01 — erro de hidratação no `ComparisonTable` (whitespace em `<colgroup>`), verificado ao vivo |
| BUG-037 | Baixo | Corrigido (PR #26) | F1-01 — acentos/crase em copy de serviços |
| BUG-038 | Baixo | **Corrigido (PR #155)** | F1-01/T-01 — `sizes="192px"` adicionado ao `<Image fill>` da foto da fundadora *(corrigido nesta sessão — estava "Aberto")* |
| BUG-039 | Baixo | Corrigido (PR #27) | F1-01 — `seedComparisonProductsAction` órfã removida (double-check: zero refs) |
| BUG-040 | Baixo | **Corrigido (PR #38 + limpeza executada)** | T-03 — ~50 coleções de backup na raiz removidas; Trilha 3d *(corrigido nesta sessão — estava "Aberto", defasado desde 2026-07-08)* |
| BUG-041 | Baixo | **Corrigido (Trilha 3c, script local)** | T-03 — produtos legados/duplicados excluídos de `products` (12 ativos, 0 arquivados) *(corrigido nesta sessão — estava "Aberto")* |
| BUG-042 | Médio | **Corrigido (Trilha 3b, script local)** | T-03 — chaves de entitlement de cliente normalizadas (4 clientes) *(corrigido nesta sessão — estava "Aberto")* |
| BUG-043 | Médio | Aberto | F2-01/Fase A — `steps-registry.ts` fora de sync com os produtos canônicos da jornada |
| BUG-044 | Médio | Parcial (PR #28) | Fase A/A0 — parser: paths + slug BPL-003 + travas feitos; leituras de preço por coordenada seguem (mitigadas); campos novos via aba resiliente (A1) |
| BUG-045 | Médio | Corrigido (PR #32) | Fase B — suíte de testes vermelha na baseline desde PR #19 (mock sem `requireMatricula`) |
| BUG-046 | Baixo | Aberto | T-05/booking — links de e-mail p/ rota inexistente `/hub/membro/dashboard` |
| BUG-047 | Baixo | Corrigido (PR #118) | F1-06 lote D — painel admin exibe os atributos do modelo de acesso (display-only) |
| BUG-048 | Baixo | Corrigido (PR #44) | F1-01 — realce de nav pública por rota |
| BUG-049 | Baixo | Corrigido (PR #44) | F1-01 — footer /conteudo adaptado ao tema claro |
| BUG-050 | Baixo | Corrigido (PR #44/#47) | F1-01 — backdrop do FAQ; resolvido de fato na regra global de tema dos modais (PR #47) |
| BUG-051 | Alto | Corrigido (PR #49) | F1-02 — geração do PDF lê `products`/matrícula/`User_Orders` corretos; CT-0 (`CONTRACTS-DESIGN.md`) — confirmado em produção antes do fix |
| BUG-052 | Médio | **Corrigido (PRs #55/#57/#63)** | F1-02 — documento do contrato visível in-app; CT-3a/CT-3b.2/CT-4 *(corrigido nesta sessão — estava "Aberto", defasado desde 2026-07-10)* |
| BUG-053 | Médio | **Corrigido (PRs #63/#64)** | F1-02 — painel de contratos reescrito (status de assinatura real, doc in-app, nota fiscal); CT-4 *(corrigido nesta sessão — estava "Aberto")* |
| BUG-054 | Médio | Corrigido parte IP (PR #50) | F1-02 — IP real capturado na assinatura (CT-1); reforços jurídicos extras → CT-5 |
| BUG-055 | Médio | **Corrigido (aposentado, PR #66)** | F1-02 — portão morto removido + trava de acesso por-serviço auditada (pago+assinado via entitlement) *(corrigido nesta sessão — estava "Aberto", defasado desde 2026-07-10)* |
| BUG-056 | Médio | Corrigido (PR #58) | F1-02, F2-05 — assinatura pós-checkout unificada (grátis==pago) + herança de tema *(bug ausente do índice — adicionado nesta sessão de reconciliação)* |
| BUG-057 | Médio | Corrigido (PR #65) | F1-02 — admin lista contratos do cliente pela matrícula *(idem)* |
| BUG-058 | Alto | Corrigido (PR #68) | F1-02 — painel de contratos: serialização de data corrigida ("Invalid time value") *(idem)* |
| BUG-059 | Baixo | Corrigido (PR #72) | F1-03 — modal de onboarding travado roteado ao gate reutilizável *(idem)* |
| BUG-060 | Baixo | Corrigido (PR #72) | F1-03 — modal de upsell sem nomes técnicos de checkpoint *(idem)* |
| BUG-061 | Baixo | Corrigido (PR #72) | F1-03 — modal de detalhe do serviço convertido ao `GlassModal` *(idem)* |
| BUG-062 | Baixo | Corrigido (PR #73) | F1-04 — acentos PT-BR restaurados (Visão Geral/Gestão de Carreira) *(idem)* |
| BUG-063 | Baixo | Corrigido (PR #74) | F1-04, F2-05 — headers migrados ao `FunctionalPageHeader` *(idem)* |
| BUG-064 | Baixo | Corrigido (PR #74) | F1-04 — modal de detalhe da Visão Geral no `GlassModal` *(idem)* |
| BUG-065 | Baixo | Aberto (adiado) | F1-04 — responsividade geral das telas logadas; varredura futura *(idem)* |
| BUG-066 | Alto | Corrigido (PR #80) | F1-04, T-06 — e-mail Master vazando na interface do cliente *(idem)* |
| BUG-067 | Médio | Corrigido (PR #80) | F1-05 — networking: `isPublic` vs `visible` *(idem)* |
| BUG-068 | Médio | Corrigido (PR #80) | F1-05 — networking: crash ao trocar de aba *(idem)* |
| BUG-069 | Baixo | Corrigido (PR #80) | F1-05 — networking: ícone de ação morto *(idem)* |
| BUG-070 | Alto | Corrigido (PR #92) | F1-05 — perfil sincronizava com doc órfão (`results/check_in`) *(idem)* |
| BUG-071 | Médio | Corrigido (PR #93) | F1-05 — CV/Portfólio "Visível Network" não aparecia *(idem)* |
| BUG-072 | Baixo | Corrigido (PR #116) | F1-06 lote B — benefícios legíveis na devolutiva; validado em produção |
| BUG-073 | Alto | Corrigido (PR #101) | F1-03 — MentoCoach nunca aparecia na agenda do membro *(bug ausente do índice — adicionado nesta sessão de reconciliação)* |
| BUG-074 | Alto | Corrigido (PR #101) | F1-03 — paradas listavam sessão de outro serviço, agendáveis *(idem)* |
| BUG-075 | Baixo | Corrigido (PR #110) | F1-06 — typo "Bloquado"; resolvido como efeito do BUG-084 (radical normalizado) |
| BUG-076 | Alto | Corrigido (PR #103) | F1-03, F1-04, F2-04 — política de agendamento anunciada não era executada pelo sistema *(bug ausente do índice — adicionado nesta sessão)* |
| BUG-077 | Alto | Corrigido (PR #104) | F1-03 — concluir parada marcava todas as irmãs como concluídas (id colapsado) *(idem)* |
| BUG-078 | Baixo | Corrigido (PR #104) | F1-04 — cards da Visão Geral com nome repetido (corrigido no dado, não no código) *(idem)* |
| BUG-079 | Alto | Corrigido (PR #105) | F1-03 — conclusão de etapa com chave legada nunca reconhecida *(idem)* |
| BUG-080 | Médio | Corrigido (PR #106) | F1-03 — rótulos do farol da jornada mentiam sobre o estado da etapa *(idem)* |
| BUG-081 | Médio | Corrigido (PR #108) | F1-03 — clique mudo na 1ª etapa travada + modal nomeava a etapa errada *(idem)* |
| BUG-082 | Alto | Corrigido (PR #109) | F1-04 — gráfico da Tríade plotava 0% (acento quebrava o casamento de rótulo) *(idem)* |
| BUG-083 | Baixo | Corrigido (PR #109) | F1-04 — card do DISC fora do padrão dos demais assessments *(idem)* |
| BUG-084 | Médio | Corrigido (PR #110) | F1-06 — sync descartava os bloqueios e a agenda pública oferecia horário ocupado (249 de 756) |
| BUG-085 | Baixo | Aberto (adiado) | F1-06/T-03 — 340 docs de eventos passados nunca removidos; **a correção óbvia é destrutiva** (ata/attendees/histórico de carreira) |
| BUG-086 | Baixo | Corrigido (PR #110) | F1-06 — registro global truncava em 500 antes de filtrar |
| BUG-087 | ~~Médio~~ **Alto** | Corrigido (PR #112) | F1-06/T-01 — full scan (o multiplicador real era `getUserBookingsAction`, 8 telas); **causa do apagão**; Etapa 1 do `AGENDA-SYNC-DESIGN.md` |
| BUG-088 | **Alto** | Corrigido (PR #113) | F1-06 — sync paginado (250→801) + batch em blocos + teto de janela na leitura; Etapa 2a |
| BUG-089 | Médio | **Corrigido (PR #154)** | F1-06 — `/agendar` público mostra "não foi possível carregar a agenda" em vez de "tudo livre" *(corrigido nesta sessão — estava "Aberto")* |
| BUG-095 | **Alto** | Corrigido (PR #114) | F1-06 — sync não reconstruía o `Programacao_Registry`; agenda do membro (1 to 1) congelava. **Validado em produção** |
| BUG-096 | Baixo | Corrigido (PR #117) | F1-06 lote B — analytics de F&S mostravam zeros no erro (fallback mudo); banner de erro. Padrão sistêmico anotado |
| BUG-090 | Médio | Corrigido (PR #115) | F1-06 lote A — bloco de atalhos (cópia da sidebar, 2×404) removido |
| BUG-091 | Médio | Corrigido (PR #115) | F1-06 lote A — card de agenda agora lê o `lastSync` real (1 leitura) |
| BUG-092 | Médio | Corrigido (PR #115) | F1-06 lote A — métrica da semana ISO (fuso BR), 52 leituras vs 590 |
| BUG-093 | Médio | Corrigido (PR #111) | F1-06/F2-04 — política de agendamento avaliada no fuso do servidor; suíte agora roda em `TZ=UTC` |
| BUG-094 | Baixo | Aberto (adiado) | F2-04 — `resolveEventWeek` mistura semana ISO com ano civil; muda semântica de chave já gravada |
| BUG-097 | Médio | Aberto | agenda/Etapa 3.4 — agendamento fantasma quando o evento some do Google |
| BUG-098 | Baixo | Aberto | agenda/Etapa 3 — campo `mentor` com nomenclatura antiga (rótulo já é "Consultor") |
| BUG-099 | **Alto** | **Corrigido (PR #121)** | F1-03/agenda — bloco "Seu Agendamento Confirmado" **sempre** vazio: `StepRenderer` e `UserBookings` casavam a mesma sessão com regras diferentes (8 de 8 pares reais falhando). Fonte única extraída. **Diagnóstico anterior corrigido**: não era a janela de 21 dias nem regressão do PR #112 |
| BUG-100 | Médio | Corrigido (PR #134) | F1-03 — `StepRenderer` chamava todos os hooks depois do early return de `locked`; crash latente. Return movido p/ depois dos hooks + efeitos de leitura guardados por `status !== "locked"` (parada travada segue com 0 leitura) |
| BUG-101 | Médio | Corrigido (PR #133) | F1-06/agenda — Ata some do agendamento se enviada depois de fechar o participante (1 de 7 afetado); `closeEventAction` espelha a Ata no `User_Bookings` + BP-005 reconciliado |
| BUG-102 | **Alto** | Corrigido (PR #127) | **T-02** — `post-event.ts` guardado (pós-evento) + registro global fora da rede; lote 3 |
| BUG-103 | **Alto** | Corrigido (PRs #122–#129) | **T-02** — varredura de guards em 5 lotes; superfície agora conferida por padrão (`server-action-surface.test.ts`) |
| BUG-104 | Médio | **Corrigido (PR #132)** | F2-04 — `setMemberQuotas` (define) separado de `addMemberQuotas` (soma) *(corrigido nesta sessão — estava "Aberto")* |
| BUG-105 | Baixo | **Fechado — não é bug (decisão de produto, 2026-07-22)** | produto — Pré-Análise é collect-only por desenho (insumo do consultor); já aparece em `/admin/jornada-cliente` *(corrigido nesta sessão — estava "Aberto")* |
| BUG-106 | **CRÍTICO** | **Corrigido (PR #124)** | T-02 lote 2b / identidade — sequestro de conta por e-mail digitado; 2 cópias do padrão (`survey-effects.ts`, `lib/user-matricula.ts`); mesmo padrão do `BUG-032` |
| BUG-107 | Médio | Corrigido (PR #125) | T-02 lote 2b — feedback de conteúdo de visitante não logado lançava erro; corrigido junto da fonte única de identidade |
| BUG-108 | **Alto** | **Corrigido (PR #135)** | **T-02 lote 5** / convite (F4-02) — `submitInvitationSurveyAction` aceitava matrícula do cliente sem vínculo ao token; agora deriva a identidade da **sessão verificada** (`getServerSession`) e exige `claimedBy === matrícula`; e-mail action fora da rede. **Último bloqueador do T-02** |
| BUG-109 | Médio | Corrigido | efeito de feedback de conteúdo gravava `N/A` na planilha do Drive (desencontro de nome de campo); dado íntegro no Firestore |
| BUG-110 | **Alto** | **Corrigido (PR #131)** | Drive/backup — TODOS os surveys passam a acumular histórico (`appendDataToSheet`), além do plano mínimo *(corrigido nesta sessão — estava "Aberto"; fix já era anterior à reconciliação de 2026-07-22, que reintroduziu o bug por engano sem checar o git — ver Lição 45)* |
| BUG-111 | Melhoria | Corrigido (PR #137) | F1-04 — `visao_geral`: data prevista (real onde há; estimativa pelo ritmo do membro, rotulada) + ordenação por data em Próximas/Em Foco |
| BUG-112 | Melhoria | Escopo A Corrigido (PR #136); C adiado | F1-05 — networking: rótulo "Profissional" → "Consultor" (escopo A, label-only). Escopo C (papel real + migração) programado p/ após a auditoria |
| BUG-113 | Baixo | Corrigido (PR #144) | F1-06/redesign — cores hardcoded brancas em `partners` recoloridas para vars de tema (legível em temas claros); scrims preservados |
| BUG-114 | Médio | **Corrigido (2026-07-24)** | T-01 — detalhe de respondentes do admin (F&S); índices criados pela Gestora no console do Firebase, verificado por sonda read-only (query voltou a funcionar) *(corrigido nesta sessão — estava "Aguarda deploy manual")* |
| BUG-115 | Médio | **Corrigido (2026-07-24)** | T-01 — anti-lockout de admin (rebaixar outro admin); field override criado pela Gestora, verificado por sonda read-only *(corrigido nesta sessão — estava "Aguarda deploy manual")* |
| BUG-116 | Médio | **Corrigido (2026-08-02, validado em produção 2026-08-03)** | Hub/Recepção — welcome survey renderizava com chrome (header/ações flutuantes) por cima; virou 3º gate no `HubShell` (`1f70e7b`) *(adicionado nesta reconciliação)* |
| BUG-117 | Médio | **Corrigido no código (2026-08-03)** | Jornada (modularização de instrumentos) — subcheckpoint dinâmico com `order` não-numérico; ordem passa a ser decimal da parada do pai. **Dados legados pendentes** (`scripts/fix-dynamic-substep-order.js --apply`) *(adicionado nesta reconciliação)* |
| BUG-118 | **Alto** | **Corrigido no código na `main` (2026-08-03)** | Jornada — conclusão cruzada marcava as 10 sessões ao concluir 1 (chave `type:referenceId` repetida); regra de chave repetida corrige. Mesmo sintoma do BUG-077 por outro caminho. Alcance: **1 conta de teste (`BP-002`)**, nenhum membro real. **Reparo do dado pendente** (`scripts/fix-cross-completed-sessions.js --apply`, aguarda Gestora) *(adicionado nesta reconciliação)* |

---

## Riscos Aceitos / Fora de Escopo

Pontos que este processo **não cobre por limite estrutural**, não por omissão:

1. **Auditoria de segurança independente** (pentest formal por terceiro) — o
   processo encontra e corrige o que análise de código e teste revelam, não
   simula um atacante real com ferramentas dedicadas.
2. **Teste de carga real** — exigiria infraestrutura de load-test dedicada, fora
   do alcance de análise de código + preview.
3. **Certificação jurídica formal de LGPD** — o processo documenta boas práticas
   técnicas já aplicadas, mas conformidade legal com força jurídica exige
   avaliação de advogado especializado.
4. **Sign-off multi-stakeholder** — aqui a aprovação é feita pela Gestora única
   (Victor), o que é adequado ao porte do projeto, mas não equivale a um
   processo corporativo com múltiplos aprovadores formais de diferentes áreas.
5. **Autenticação Google nos previews da Vercel** (`BUG-030`) — os deploys de
   preview rodam em domínios efêmeros `*.vercel.app`, que não são domínios
   autorizados no Firebase Auth e nunca coincidem com o `authDomain` fixo, então o
   login com Google não funciona no preview. Produção (`bplen.com`) não é afetada.
   Limitação estrutural conhecida de Firebase Auth + preview da Vercel; aceita
   pela Gestora (2026-07-02) — fluxos logados são validados em produção. Reabrir
   só se QA de telas logadas em preview virar necessidade recorrente (aí avaliar
   staging com domínio próprio).

Esses pontos ficam registrados como risco aceito e conhecido, não como pendência
esquecida.

---

## Estado da auditoria e próximos itens de execução

*(Seção viva — atualizar a cada reconciliação geral. Última: 2026-08-03.)*

### Onde a auditoria está

O checklist original (Fases 0-4 + Tracks T-01 a T-06) está **funcionalmente
completo por código/leitura**, restando só: **1** item de auditoria formal não
iniciado (`F3-03`), **1** rodada de validação humana **diferida** pela Gestora
(Caminho B — ver seção dedicada abaixo), e um punhado de bugs Médios/Baixos
sem decisão pendente ou adiados de propósito.

- **Fase 0 (fundamentos):** completa, 6/6. Só resta o `BUG-034` (2º componente-
  base para modais grandes, esforço futuro, não bloqueante).
- **Fase 1 (validação por página):** as 6 páginas/clusters **validadas em
  produção pela Gestora**, incluindo o redesign completo do admin (R0–R5) + 9/9
  itens de feedback. Resta só a validação manual dos 3 fluxos de contrato
  (F1-02) — **diferida** (Caminho B, ver abaixo).
- **Fase 2: COMPLETA — `F2-01` a `F2-05` concluídos.** `F2-05` (categorização
  formal de design hub+admin, `F2-05-DESIGN-CATEGORIZATION.md`) fechou em
  2026-07-24 e foi validada em produção em 2026-07-28 (3 copies de loading).
- **Fase 3: `F3-01` e `F3-02` concluídos.** `F3-03` (regras financeiras —
  cláusula de reembolso, 2 bypasses de pagamento) **segue não iniciado como
  auditoria formal** — é o único item do checklist original ainda sem
  nenhum trabalho, embora o achado prático que o motivou (`BUG-022`) já
  esteja corrigido desde a Fase 1.
- **Fase 4 (jornadas e2e): as 3 MAPEADAS por código** (2026-07-28,
  `F4-JOURNEYS-MAP.md`) — gates centrais sólidos, nenhuma armadilha nova. A
  **corrida ao vivo** (login/pagamento/evento reais) está **diferida** (Caminho
  B, ver abaixo). `F4-03` teve o critério atualizado (checkout público removido
  no `BUG-002` — superfície única logada), ratificado pela Gestora.
- **Todos os 6 tracks concluídos, sem resíduo:** `T-02` (17/17), `T-03` (7/7),
  `T-06` (2/2), `T-01` (Momento 1 — índices deployados pela Gestora em
  2026-07-24, snapshot validado em produção em 2026-07-28; Momento 2 é
  trabalho futuro fora desta auditoria), `T-04` (escopo reduzido), `T-05`
  (escopo misto).
- **Severidade: fila vazia — 0 `Alto`, 0 `Crítico` aberto**, confirmado por
  checagem cruzada dos 115 bugs registrados nesta reconciliação.
- **`BUG-114`/`BUG-115` corrigidos** (2026-07-24) — índices criados pela
  Gestora no console do Firebase, efeito confirmado por sonda read-only.
- **EXP-01:** fora do checklist da auditoria; represado por decisão da
  Gestora até o fim desta.
- **Aba "Autenticações" (funil de Recepção) do admin — ENTREGUE EM PRODUÇÃO**
  (2026-07-29/30, PRs #163/#164, `AUTH-TRACKING-DESIGN.md`). Feature read-only
  de observabilidade **fora da grade** de fases/tracks/bugs (como `EXP-01`):
  não entra em nenhuma % nem abre item graduado; registrada aqui só para a
  fonte de verdade refletir a entrega. Originou-se da investigação que
  declarou o caso "abre-sem-concluir welcome" **não-bug** (abandono da welcome,
  decisão da Gestora). Fase 2 (histórico de login por evento) e a captura de
  `origin` na fonte ficaram para depois (ver grupo 4 abaixo).
- **Padrão de E-mail BPlen V01 — ENTREGUE EM PRODUÇÃO** (2026-07-30, PRs #165/#166,
  `EMAIL-DESIGN-V01.md`). Redesign do template global transacional: motor
  renomeado (`soberana-layout.ts`/`buildSoberanaEmail` → `email-layout.ts`/
  `buildEmailLayout`, depreciando "soberano"), fita de acento por categoria em
  23 callers, logo real, rodapé V01. **Fora da grade** de fases/tracks/bugs
  (refino de design system, como a aba de Recepção). O PR #166 corrigiu um
  **vazamento de "Google Drive"** em copy de cliente (`checkout-emails.ts`, cupom
  resgatado) — conformidade com a regra infra-invisível (rule 6). Ajuste
  pós-validação: rótulo textual da categoria removido, mantida só a fita.
  **Follow-ups (buckets 2 e 3, PRs próprios):** 2 strings de UI com "Soberania"
  (uma, `ServiceDeliveryView.tsx:155`, também vaza "Google Drive") e ~100
  comentários/logs internos com "soberan*".
- **Expansão de autenticação — ENTREGUE E VALIDADA EM PRODUÇÃO** (2026-08-01,
  Fases 0/1/1b/2/3, `AUTH-PROVIDERS-EXPANSION.md`). Página `/entrar` (Google +
  Microsoft + magic link real via Admin SDK + Resend), `returnTo` unificado
  (proxy `x-bplen-pathname` + layouts) com sanitização same-origin, `signInWith`
  genérico + fluxo de vínculo `account-exists-with-different-credential`, suíte
  de não-regressão de identidade (BUG-032/106). **Fase 1b:** trava de CPF
  (`_CpfIndex/{cpfHash}`, backfill feito). **Fase 2:** gate de Boas-vindas
  (consentimento LGPD Termos+Privacidade+18, `User/{matricula}/User_Consent`
  versionado com IP/geo/dispositivo, trava no `HubShell`). **Fase 3:** ferramenta
  admin de transferência de conta (aba Autenticações, sem sobrescrever conta com
  dados; fusão de contas ativas segue manual). Config de console feita pela
  Gestora (Firebase linking, Microsoft/Azure, magic link, domínios). **Fora da
  grade** de fases/tracks/bugs (mesma natureza da aba de Recepção e do e-mail
  V01). **Pendências operacionais** (não-código) no grupo 4b da lista priorizada.

### Lista de validação humana pendente (Caminho B — decisão da Gestora, 2026-07-28)

A Gestora optou por **diferir** toda validação que depende de dado/ambiente
real, agrupando-a numa rodada só, a fazer **após a limpeza da base do usuário
de teste** (+ possíveis correções/implementações adicionais que surgirem até
lá). Itens que compõem a rodada:

1. **Corrida e2e AO VIVO das 3 jornadas** (Fase 4) — login real, pagamento
   real (depende também da virada da credencial MP para produção — item 3
   abaixo), evento real de convite/agenda.
2. **Validação manual dos 3 fluxos de contrato** grátis/pago/avulso (F1-02) —
   sem bloqueador de código, só precisa de um usuário de teste limpo.
3. **Virada da credencial Mercado Pago para produção** (`APP_USR-`) —
   deliberadamente adiada pela Gestora (2026-07-28); sem ela, nenhum pagamento
   real pode ser exercitado (item 1 depende disto).
4. O que mais a limpeza da base revelar precisar de validação (não
   antecipável — registrar aqui quando surgir).

**Decisão da Gestora (2026-07-29): a auditoria PERMANECE FORMALMENTE ABERTA**
até esta rodada de validação humana acontecer — não fecha com `F3-03` +
código completo sozinhos. O critério de fechamento formal da auditoria passa
a ser: `F3-03` concluído **E** os 3 itens desta rodada validados. Isso não
muda o trabalho de código a fazer, só o que conta como "auditoria concluída"
nos relatórios/DASHBOARD — enquanto esta seção tiver itens sem `~~riscado~~`,
a auditoria segue aberta.

### Lista priorizada do que resta (para o chat de execução retomar)

**1. `F3-03` — único item do checklist original de auditoria ainda não
   iniciado.** Confirmar que a cláusula de reembolso (7 dias, textual no PDF
   do contrato) tem processo manual real por trás (pergunta à Gestora — não é
   algo que o código revele sozinho), e documentar se os 2 bypasses de
   pagamento (`bplen_free_bypass` em `checkout.ts`, `retroactive_bypass` em
   `retroactive-contract.ts`) são comportamento de negócio intencional e
   aprovado (não é preciso investigar de novo — o padrão já apareceu no
   `BUG-022`, corrigido; falta só a ratificação formal como regra de negócio
   documentada, não um achado de código novo).

**2. Bugs Médios/Baixos abertos, sem decisão de negócio pendente (candidatos
   a "carona" quando o chat de execução tocar os arquivos vizinhos, ou a uma
   sessão de limpeza dedicada):**
   - `BUG-043` (F2-01/Fase A) — `steps-registry.ts` fora de sincronia com os
     produtos canônicos da jornada. Independente da remoção do
     `/hub/step-journey` (já feita); é a mesma fonte de dado importada por
     `actions/journey.ts`.
   - `BUG-046` (T-05) — links de e-mail de booking apontam para
     `/hub/membro/dashboard`, rota inexistente. Baixo risco, candidato a fix
     rápido quando alguém tocar os templates de e-mail.
   - `BUG-097` (agenda) — agendamento fantasma quando o evento some do
     Google. **Decisão de modelo já tomada** (Gestora, 2026-07-22): não
     apagar evento com inscritos, marcar "Agenda alterada" + nova fila de
     trabalho no admin. Falta o **plano de implementação** (toca `sync.ts` +
     tela nova) — é trabalho de execução, não decisão pendente.

**3. Adiados de propósito — não mexer sem sinal da Gestora:**
   - `BUG-085` (T-03/F1-06) — ~340 docs de eventos passados nunca removidos;
     a correção óbvia (apagar) é destrutiva (perde atas/histórico de
     carreira).
   - `BUG-094` (F2-04) — `resolveEventWeek` mistura semana ISO com ano civil;
     mudaria a semântica de uma chave já gravada.
   - `BUG-098` (agenda) — campo `mentor` com nomenclatura antiga (rótulo já é
     "Consultor"). Pendência registrada de propósito, a pedido da Gestora.
   - `BUG-112` escopo C (networking: papel real de "Consultor" + migração) —
     programado para depois da auditoria, por decisão explícita da Gestora.

**4. Trabalho que exige plano+aprovação de área sensível, fora do escopo
   desta auditoria (decisão da Gestora, pós-auditoria):**
   - Implementação de observabilidade (`T-04`, Sentry recomendado) — custo +
     escolha de ferramenta + scrub de PII.
   - `EXP-01` (dashboard de KPIs do `/admin`) — represado até o fim da
     auditoria.
   - Momento 2 do `T-01` (Blaze, `Networking_Directory`, paginação com busca
     externa, provedores externos).
   - ~~Captura de `origin` na fonte da autenticação~~ e ~~Expansão dos meios de
     autenticação + página de login + consentimento~~ — **CONCLUÍDAS E VALIDADAS
     EM PRODUÇÃO (2026-08-01)**, ver o bloco de entregas fora-de-grade em "Onde a
     auditoria está" e as **Pendências operacionais** logo abaixo. A captura de
     `origin/provider` foi absorvida pela Fase 0/1 (anota `_AuthMap` existente,
     best-effort, nunca cria mapeamento).

**4b. Pendências OPERACIONAIS da expansão de autenticação (não-código; radar
   da Gestora, fora da grade):**
   - **Revisar os textos legais** de Termos/Privacidade e **bumpar
     `CONSENT_VERSION`** (hoje `"2026-06-21"`, retroativa em `config/legal-pages.ts`)
     — ao mudar a versão, o gate de Boas-vindas reaparece no próximo acesso.
   - **Limpar a conta de teste `BP-002`** (`BP-002-PF-260331`) — é a duplicata de
     CPF marcada em `duplicateMatriculas` no backfill (dona real = `BP-005`).
   - **Renovar o segredo do app Azure AD** antes de expirar — se expirar, o login
     com **Microsoft para de funcionar**.
   - **Melhorar a entregabilidade do Resend** (SPF/DKIM/domínio) — no teste o
     e-mail do **magic link caiu em spam**.
   - **Fusão de dados entre 2 contas ativas** permanece **manual/caso-a-caso** por
     segurança (só a **transferência** — trocar quem loga, sem migrar dado — é
     automática, via a ferramenta de admin da Fase 3).

### Recomendação de por onde começar

Com a fila de severidade **vazia**, todos os 6 tracks fechados e as Fases 0-2
completas, o que resta do checklist formal é pequeno: **(a) `F3-03`** é o
único item de auditoria nunca tocado — é majoritariamente uma pergunta à
Gestora (reembolso, bypasses), não investigação de código, e fechá-lo deixa a
auditoria **completa por código e leitura em todas as 5 fases**; **(b)** os
bugs do grupo 2 (sem decisão pendente) podem ser resolvidos em paralelo,
individualmente ou como sessão de limpeza; **(c)** depois disso, o único
trabalho que resta é a **rodada de validação humana diferida** (Fase 4 ao
vivo + contratos + credencial MP), que depende da limpeza da base de teste e
da resposta da Gestora à pergunta de fechamento formal feita acima — não é
trabalho do chat de execução até que ela sinalize que a base está pronta.
**Antes de tratar qualquer item acima como "aberto e pronto para atacar",
confirme contra `git log`** — o Protocolo item 15 (Lição 45) existe
exatamente porque essa lista já se mostrou propensa a carregar status
defasado de uma sessão para outra.
