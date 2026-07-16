# BPlen HUB — Plano Mestre de Homologação e Refinamento Fullstack

Este é o checklist mestre do processo de validação amplo do sistema (infra, banco,
design, arquitetura, lógicas de fluxo, regras de negócio, textos/tons). Ele é
**a fonte de verdade compartilhada entre chats**, junto de `BUGS.md` — todo chat
de execução lê este arquivo, o `LOG.md` e o `RETROSPECTIVE.md` antes de agir, e
atualiza o status aqui ao final. `DASHBOARD.md` é só um agregador visual (não é
fonte de verdade); `F0-DECISIONS.md` guarda o detalhe longo das decisões de Fase 0.

Populado pelo chat de planejamento a partir dos 5 mapas (`01` a `05`). **Status
de cobertura dos mapas**: os 5 mapas estão **completos**. **Status de execução**:
a **Fase 0 está completa** (6/6 itens decididos; `F0-01` com a **parte GlassModal
concluída** — lotes 1/A/B mergeados, PRs #15/#20/#21; resta só um 2º componente-base
para modais grandes app-shell, `BUG-034`, futuro; e `F0-04` **concluído**
— entitlements removida + `User_JourneyMap` consolidado no v3, PRs
#1/#22/#23/#24/#25; resíduo de nomenclatura tratado à parte no `BUG-033`,
Fase 1; ver `DASHBOARD.md`) e a Track **T-02 (Segurança sistemática) está FECHADA — 12/12 (100%)**
— o item sistêmico `BUG-020` foi fechado em 7 lotes (PRs #8–#14), junto de
`BUG-021` e de um Crítico novo achado no processo (`BUG-032`, escalação de
privilégio), ambos corrigidos; `BUG-025` (webhook Mercado Pago com assinatura
HMAC, PR #16), `BUG-004` (path de debug no painel admin, PR #17, rebaixado
Alto→Baixo após avaliação de exposição), `BUG-006` (guard `requireAuth` no
networking, PR #18) e `BUG-005` (`requireMatricula` no pagamento do checkout de
membro, PR #19 — rastreabilidade) foram corrigidos. Todos os 12 bugs do track
estão corrigidos e mergeados (nenhum aceite formal foi necessário). **Nenhum bug
Crítico está aberto no momento.**
Uma lacuna estrutural residual e conhecida nos mapas: contagem exata de quantas
etapas da jornada usam `SurveyEngine` (ver nota de fechamento em
`01-map-features.md`) — não bloqueia nenhuma fase. Ver `LOG.md` para o
histórico completo de sessões.

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
  para cima, nunca contar "decidido mas gated" como fechado.

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
| _(vazia)_ | — | — | Nenhum `Crítico`/`Alto` com Status `Aberto` |

**Fila vazia (2026-07-16):** dois `Alto` novos entraram e saíram no mesmo dia —
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
| Segurança | Track adicional "Segurança sistemática" (matriz de guards do Mapa 4) — **T-02 FECHADA, 12/12 (100%)**: corrigidos `BUG-003/004/005/006/007/019/020/021/023/024/025/032` (inclui o item sistêmico `BUG-020`, fechado em 7 lotes, o Crítico `BUG-032`, o webhook MP com HMAC `BUG-025`, o path de debug `BUG-004`, o guard de networking `BUG-006`, e a matrícula no pagamento `BUG-005`). Nenhum bug de segurança aberto |
| Compatibilidade | Fase 1 — critério de aceite de cada página inclui responsivo (mobile/tablet/desktop) e navegador via preview; integrações externas (Mercado Pago/Google/Resend) verificadas quanto à coexistência sem conflito no track de "Integrações externas" |
| Manutenibilidade | Track adicional "Integridade e migração de dados" (schema drift, timestamps inconsistentes, coleções órfãs — `BUG-008/009/010/018`), reforçado pela regra "Zero Any" já enforced via ESLint |
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
  Resta a conferência visual/responsivo/fluxos em produção.
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
- Modo de validação: PENDENTE
- Decisão: —
- Execução: Não iniciada — nota: os 4 bugs de segurança vinculados abaixo já
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
- Resultado: —
- Bug(s) vinculado(s): BUG-003 (Corrigido), BUG-007 (Corrigido), BUG-023 (Corrigido), BUG-024 (Corrigido), BUG-035 (**Corrigido, PR #37** — via reestruturação do modelo de acesso, ver `ACCESS-MODEL-DESIGN.md`)
- Log: —

---

### Fase 2 — Features transversais (Mapa 1)

### [F2-01] Consistência do motor de Jornada entre variações
- Categoria(s) de qualidade: Adequação funcional / Manutenibilidade
- Critério de aceite: decidido o destino de `/hub/step-journey` (remover,
  redirecionar, ou justificar como alternativa válida)
- Modo de validação: PENDENTE
- Decisão: Pendente — destino de `/hub/step-journey`
- Execução: Não iniciada
- Resultado: —
- Bug(s) vinculado(s): BUG-015
- Log: —

### [F2-02] Consistência do Gate de Contrato em todas as páginas do hub
- Categoria(s) de qualidade: Adequação funcional / Segurança
- Critério de aceite: `ContractGateModal` bloqueia consistentemente em todas as
  páginas do hub quando há pendência, sem exceção não documentada
- Modo de validação: PENDENTE
- Decisão: —
- Execução: Não iniciada
- Resultado: —
- Bug(s) vinculado(s): —
- Log: —

### [F2-03] Consistência do seletor de tema entre hub e admin
- Categoria(s) de qualidade: Usabilidade
- Critério de aceite: as 7 opções de tema funcionam identicamente nas duas áreas,
  sem página que "esqueça" de herdar o `HubHeader`
- Modo de validação: PENDENTE
- Decisão: —
- Execução: Não iniciada
- Resultado: —
- Bug(s) vinculado(s): —
- Log: —

### [F2-04] Consistência de Cotas/Entitlements
- Categoria(s) de qualidade: Adequação funcional / Confiabilidade
- Critério de aceite: chave de cota 1-to-1 unificada (uppercase vs lowercase),
  e decisão tomada sobre conectar `consumeQuotaAction` ao fluxo real de booking
- Modo de validação: Automatizado (unificação de chave — decisão técnica embasada por leitura)
- Decisão: **Parcial (2026-07-11)** — chave "1-to-1" unificada em minúsculo
  canônico (aprovada pela Gestora, PR #71). A 2ª parte — conectar
  `consumeQuotaAction` ao booking real — segue **Pendente** (decisão de negócio,
  Gestora confirma se cota deve travar agendamento; é o BUG-013).
- Execução: **Parcial** — BUG-008 corrigido (PR #71): chave canônica minúscula,
  helper `src/lib/quota-keys.ts`, gravador auto-cura o drift, leitores tolerantes,
  migração `scripts/normalize-quota-keys.js` (a rodar pela Gestora). BUG-013
  (ligar consumo ao booking) não iniciado.
- Resultado: ✓ BUG-008 (chave 1-to-1 unificada, PR #71). ○ BUG-013 (consumo não
  conectado ao booking — aguarda decisão de negócio). **[2026-07-16]** O `BUG-013`
  ganhou **dependente**: a política de agendamento agora publicada (PR #103) diz que
  cancelar com menos de 24h faz o membro perder o crédito da sessão. A regra está
  implementada e **deixa o rastro pronto** (`lateCancellation` em
  `User_Booking_History`), mas **o débito em si continua manual/operacional** enquanto
  o `consumeQuotaAction` não for ligado ao booking. Enquanto isso, a frase "preservam
  o crédito" é verdadeira apenas como regra de conduta, não como automação.
- Bug(s) vinculado(s): BUG-008 (Corrigido, PR #71), BUG-013 (Aberto — agora com a
  política de 24h dependendo dele para virar automática), BUG-076 (Corrigido, PR #103)
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
- Execução: **Avançada** — o padrão Gestão Funcional (`FunctionalPageHeader`) já está aplicado a:
  contrato + checkout (PR #58), `contratos` (CT-4), `visao_geral`/`gestao_agenda`/`gestao_carreira`
  (PR #74) e `profile_settings`/`networking` (PR #78 — categorizados como Gestão Funcional pela
  Gestora). Restam de Gestão Funcional só as telas de **contrato/checkout** já cobertas; a
  categorização formal dos conceitos **a/b/d** (Fullscreen/Journey/Autênticas) das demais páginas
  logadas segue pendente.
- Resultado: 8 páginas de Gestão Funcional já no header canônico. Conferência visual em produção.
- Bug(s) vinculado(s): BUG-056 (Corrigido, PR #58); BUG-063 (Corrigido, PR #74); + PR #78 (perfil/networking)
- Log: [2026-07-10] conceitos definidos + contrato/checkout (PR #58); [2026-07-11] visao_geral/
  gestao_agenda/gestao_carreira (PR #74) + profile_settings/networking (PR #78)

---

### Fase 3 — Auditoria de regras de negócio (Mapa 3)

### [F3-01] Regras de agendamento declaradas mas não aplicadas
- Categoria(s) de qualidade: Adequação funcional / Confiabilidade
- Critério de aceite: decisão tomada (implementar enforcement ou remover a
  configuração morta) para `MAX_BOOKINGS_PER_WEEK` e antecedência mínima na
  gravação (não só na listagem)
- Modo de validação: PENDENTE
- Decisão: Pendente — enforcement vs. remoção
- Execução: Não iniciada
- Resultado: —
- Bug(s) vinculado(s): BUG-011 (**[HIPÓTESE]** — exploit teórico via chamada
  direta da action, não reproduzido em execução real), BUG-012
- Log: —

### [F3-02] Exceções do Sequence Lock ainda fazem sentido de negócio?
- Categoria(s) de qualidade: Adequação funcional
- Critério de aceite: confirmado com a Gestora se as exceções atuais
  (`onboarding`, `mentocoach`, regra especial de `offboarding`) ainda refletem
  a intenção de produto
- Modo de validação: Requer execução humana (julgamento de negócio)
- Decisão: Pendente — requer julgamento de negócio da Gestora
- Execução: N/A — item é puramente decisório; só gera execução se a decisão
  implicar mudança de código
- Resultado: —
- Bug(s) vinculado(s): —
- Log: —

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

### [F4-01] Jornada: Lead → Cliente → Membro pleno → Offboarding
- Categoria(s) de qualidade: Adequação funcional / Confiabilidade
- Critério de aceite: usuário fictício percorre desde `/servicos` até
  conclusão de todas as etapas da jornada sem travar em nenhum ponto não
  documentado
- Modo de validação: PENDENTE
- Decisão: —
- Execução: Não iniciada
- Resultado: —
- Bug(s) vinculado(s): —
- Log: —

### [F4-02] Jornada: Convidado de evento exclusivo → Membro
- Categoria(s) de qualidade: Adequação funcional
- Critério de aceite: fluxo completo de `/convites/[slug]` até criação de
  matrícula e primeiro acesso ao `/hub`
- Modo de validação: PENDENTE
- Decisão: —
- Execução: Não iniciada
- Resultado: —
- Bug(s) vinculado(s): —
- Log: —

### [F4-03] Jornada financeira: Compra → Contrato → Cancelamento
- Categoria(s) de qualidade: Adequação funcional / Segurança
- Critério de aceite: fluxo completo testado em ambas as variações de checkout
  (pública e de membro) até geração de contrato e um cenário de cancelamento
- Modo de validação: PENDENTE
- Decisão: —
- Execução: Não iniciada
- Resultado: —
- Bug(s) vinculado(s): —
- Log: —

---

## Tracks adicionais (não-funcional, segurança, dados, observabilidade, integrações, compliance)

### [T-01] Performance / concorrência
- Categoria(s) de qualidade: Eficiência de desempenho / Confiabilidade
- Critério de aceite: full collection scans identificados (`BUG-017`) avaliados
  quanto a paginação/índice; transações críticas (booking capacity, cotas,
  contador de matrícula) confirmadas como atômicas de fato
- Modo de validação: PENDENTE (executável via análise de código — profundidade
  igual às Fases 0-4)
- Decisão: —
- Execução: Não iniciada
- Resultado: —
- Bug(s) vinculado(s): BUG-017
- Log: —

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
- Execução: **Concluída — 12/12 (100%), Track FECHADO** (ver `DASHBOARD.md`). **BUG-020 Corrigido**
  (7 lotes, PRs #8–#14 — todos os módulos do Mapa 4b padronizados com o guard
  canônico). **BUG-021 Corrigido** (PR #13). **BUG-032 Corrigido** (PR #14, novo
  Crítico de escalação de privilégio achado no lote 7; entra no denominador do track,
  que sobe de 11 para 12). **BUG-025 Corrigido** (PR #16, webhook MP com assinatura
  HMAC em habilitação suave — fecha o item financeiro do track). **BUG-004 Corrigido**
  (PR #17, path de debug no lugar do apelido no painel admin; rebaixado Alto→Baixo
  após avaliação de exposição — admin-only). **BUG-006 Corrigido** (PR #18, guard
  `requireAuth` em `getNetworkingDataAction`, preservando a lógica da feature de
  networking). **BUG-005 Corrigido** (PR #19, `requireMatricula` nas ações de
  pagamento do checkout — rastreabilidade fiscal, fecha o `NAO_MAPEADA`). **Track
  T-02 FECHADO: 12/12, todos corrigidos e mergeados.** Nenhum Crítico aberto.
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
  membro, PR #19). ○ Restantes: nenhum — **track fechado**.
- Bug(s) vinculado(s): BUG-003, BUG-004, BUG-005, BUG-006, BUG-007, BUG-019, BUG-020, BUG-021, BUG-023, BUG-024, BUG-025, BUG-032
- Log: entradas de 2026-07-02, 2026-07-03 e 2026-07-04 no `LOG.md`

### [T-03] Integridade e migração de dados
- Categoria(s) de qualidade: Manutenibilidade / Confiabilidade
- Critério de aceite: drifts de schema do Mapa 4 (timestamps mistos, chaves de
  cota, coleções órfãs, `AttendeeData` divergente do real) documentados com
  decisão de convergência ou aceite formal como legado
- Modo de validação: PENDENTE (executável via análise de código — profundidade
  igual às Fases 0-4)
- Decisão: —
- Execução: Em andamento — **3/4 (75%)** (ver `DASHBOARD.md`) — `BUG-018` (F0-04),
  `BUG-010` (código morto removido, PR #69) e `BUG-008` (chave de cota unificada,
  PR #71) fechados; cada um conta como **unidade inteira** no numerador (critério
  de fechamento de Track). Só `BUG-009` segue `Aberto`.
- Resultado: ✓ Corrigido: BUG-018 (`entitlements` removida via F0-04 +
  consolidação completa de `User_JourneyMap` no v3 — Ações 1a/2/1b, PRs
  #22/#23/#24/#25; ver `BUGS.md#bug-018`); BUG-010 (`adminAddAttendeeAction`
  morta removida, PR #69); BUG-008 (chave de cota 1-to-1 unificada em minúsculo
  canônico + migração, PR #71). ○ Aberto: BUG-009 (**[HIPÓTESE]**
  `UserBooking.timestamp` sempre nulo, não confirmado em produção).
- Bug(s) vinculado(s): BUG-008, BUG-009, BUG-010, BUG-018
- Log: —

### [T-04] Observabilidade (alertas de erro em produção)
- Categoria(s) de qualidade: Confiabilidade
- Critério de aceite: inventariado se existe alguma ferramenta de
  monitoramento/alerta de erro em produção hoje; se não, documentado o gap e
  recomendado próximo passo (ex.: Sentry, log-based alerting)
- Modo de validação: Requer execução humana / ferramenta externa — **escopo
  reduzido**: inventariar e documentar gap, não implementar
- Decisão: —
- Execução: Não iniciada
- Resultado: —
- Bug(s) vinculado(s): —
- Log: —

### [T-05] Integrações externas em condição real
- Categoria(s) de qualidade: Compatibilidade / Confiabilidade
- Critério de aceite: cada ponto de acionamento identificado no Mapa 4
  (Mercado Pago, Resend, Google Drive/Sheets) testado em ambiente de sandbox
  quando disponível; quando exigir credenciais/custo real, documentar gap e
  recomendar próximo passo
- Modo de validação: misto — parte automatizável em sandbox, parte **escopo
  reduzido** (exige credencial/ambiente de teste dedicado)
- Decisão: —
- Execução: Não iniciada
- Resultado: —
- Bug(s) vinculado(s): —
- Log: —

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
| BUG-009 | Médio | Aberto | F0-02, T-03 — **[HIPÓTESE]** |
| BUG-010 | Alto | Aberto | T-03 — **[HIPÓTESE]** |
| BUG-011 | Médio | Aberto | F3-01 — **[HIPÓTESE]** |
| BUG-012 | Baixo | Aberto | F3-01 |
| BUG-013 | Médio | Aberto | F2-04 |
| BUG-014 | Baixo | Corrigido (PR #26) | F1-01 — import morto removido |
| BUG-015 | Baixo | Aberto | F1-03, F2-01 |
| BUG-016 | Médio | Corrigido (PR #77) | F1-05 — cota `used` real na entrega |
| BUG-017 | Médio | Aberto | T-01 |
| BUG-018 | Baixo | Corrigido (PRs #1/#22/#23/#24/#25) | F0-04, T-03 — consolidação de jornada concluída |
| BUG-019 | Alto | Corrigido (PR #4) | T-02 |
| BUG-020 | Alto | Corrigido (7 lotes: PR #8/#9/#10/#11/#12/#13/#14) | T-02 |
| BUG-021 | Baixo | Corrigido (PR #13) | T-02 |
| BUG-022 | Médio | Corrigido (PR #51) | F1-02/CT-2 — retroativo robusto (link único de uso único + vínculo à conta + aviso de duplicidade); bypasses aceitos |
| BUG-023 | Alto | Corrigido (PR #3) | F1-06, T-02, T-06 |
| BUG-024 | Médio | Corrigido (PR #5) | F1-06, T-02 |
| BUG-025 | Médio | Corrigido (PR #16) | T-02 |
| BUG-026 | Médio | Em Progresso | F0-01 — parte GlassModal concluída, resta BUG-034 *(corrigido nesta sessão — estava "Aberto")* |
| BUG-027 | Baixo | Aberto | F0-01 |
| BUG-028 | Baixo (rebaixado) | Aberto (adiado) | fora do escopo original — cluster de auth, ver `LOG.md` 2026-07-02 |
| BUG-029 | Baixo (rebaixado) | Aberto (adiado) | fora do escopo original — cluster de auth, ver `LOG.md` 2026-07-02 |
| BUG-030 | Baixo | Aceito | Riscos Aceitos (item 5, abaixo) |
| BUG-031 | Baixo | Aberto | fora do escopo original — melhoria de usabilidade, ainda sem track (candidato a T-05 ou item novo de Fase 2 quando priorizado) |
| BUG-032 | Crítico | Corrigido (PR #14) | T-02 — escalação de privilégio (novo, achado no lote 7) |
| BUG-033 | Médio | Corrigido (PR #77) | F1-05 — privacidade networking + filtro de estágio morto removido |
| BUG-034 | Baixo | Aberto (futuro) | F0-01 — 2º componente-base p/ modais grandes app-shell (opção iii) |
| BUG-035 | Alto | **Corrigido (PR #37 — Fase D)** | F1-06 — resolvido pela reestruturação do modelo de acesso (A0→D, `ACCESS-MODEL-DESIGN.md`): cadeado server-side em `hub/membro/layout.tsx`, bypass `isAdmin \|\|` removido. Desbloqueia a validação do offboarding modal (F1-03) |
| BUG-036 | Médio | Corrigido (PR #26) | F1-01 — erro de hidratação no `ComparisonTable` (whitespace em `<colgroup>`), verificado ao vivo |
| BUG-037 | Baixo | Corrigido (PR #26) | F1-01 — acentos/crase em copy de serviços |
| BUG-038 | Baixo | Aberto (adiado) | F1-01/T-01 — `<Image fill>` sem `sizes` na foto da fundadora (perf) |
| BUG-039 | Baixo | Corrigido (PR #27) | F1-01 — `seedComparisonProductsAction` órfã removida (double-check: zero refs) |
| BUG-040 | Baixo | Aberto | T-03 — ~50 coleções de backup na raiz (+ fonte na Sync de portfólio); Trilha 3d |
| BUG-041 | Baixo | Aberto | T-03 — produtos legados/duplicados arquivados poluindo `products`; Trilha 3c (após migração) |
| BUG-042 | Médio | Aberto | T-03 — chaves de entitlement de cliente inconsistentes (slugs antigos/órfãos); Trilha 3b |
| BUG-043 | Médio | Aberto | F2-01/Fase A — `steps-registry.ts` fora de sync com os produtos canônicos da jornada |
| BUG-044 | Médio | Parcial (PR #28) | Fase A/A0 — parser: paths + slug BPL-003 + travas feitos; leituras de preço por coordenada seguem (mitigadas); campos novos via aba resiliente (A1) |
| BUG-045 | Médio | Corrigido (PR #32) | Fase B — suíte de testes vermelha na baseline desde PR #19 (mock sem `requireMatricula`) |
| BUG-046 | Baixo | Aberto | T-05/booking — links de e-mail p/ rota inexistente `/hub/membro/dashboard` |
| BUG-047 | Baixo | Aberto | F1-06 — painel admin não exibe atributos do modelo de acesso |
| BUG-048 | Baixo | Corrigido (PR #44) | F1-01 — realce de nav pública por rota |
| BUG-049 | Baixo | Corrigido (PR #44) | F1-01 — footer /conteudo adaptado ao tema claro |
| BUG-050 | Baixo | Corrigido (PR #44/#47) | F1-01 — backdrop do FAQ; resolvido de fato na regra global de tema dos modais (PR #47) |
| BUG-051 | Alto | Corrigido (PR #49) | F1-02 — geração do PDF lê `products`/matrícula/`User_Orders` corretos; CT-0 (`CONTRACTS-DESIGN.md`) — confirmado em produção antes do fix |
| BUG-052 | Médio | Aberto | F1-02 — documento do contrato não visualizável no HUB; CT-3 |
| BUG-053 | Médio | Aberto | F1-02 — painel de contratos básico (status pagamento, sem assinatura/doc/NF, link morto); CT-4 |
| BUG-054 | Médio | Corrigido parte IP (PR #50) | F1-02 — IP real capturado na assinatura (CT-1); reforços jurídicos extras → CT-5 |
| BUG-055 | Médio | Aberto | F1-02 — gate lê subcoleção morta `User/{uid}/Orders`; CT-0 |

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
