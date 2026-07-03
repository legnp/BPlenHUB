# BPlen HUB — Plano Mestre de Homologação e Refinamento Fullstack

Este é o checklist mestre do processo de validação amplo do sistema (infra, banco,
design, arquitetura, lógicas de fluxo, regras de negócio, textos/tons). Ele é
**a fonte de verdade compartilhada entre chats**, junto de `BUGS.md` — todo chat
de execução lê este arquivo, o `LOG.md` e o `RETROSPECTIVE.md` antes de agir, e
atualiza o status aqui ao final. `DASHBOARD.md` é só um agregador visual (não é
fonte de verdade); `F0-DECISIONS.md` guarda o detalhe longo das decisões de Fase 0.

Populado pelo chat de planejamento a partir dos 5 mapas (`01` a `05`). **Status
de cobertura dos mapas**: os 5 mapas estão **completos**. **Status de execução**:
a **Fase 0 está completa** (6/6 itens decididos; ver `DASHBOARD.md` para o
progresso de implementação, que segue parcial em alguns itens) e a Track T-02
(Segurança sistemática) está em andamento. Uma lacuna estrutural residual e
conhecida nos mapas: contagem exata de quantas etapas da jornada usam
`SurveyEngine` (ver nota de fechamento em `01-map-features.md`) — não bloqueia
nenhuma fase. Ver `LOG.md` para o histórico completo de sessões.

**Refinamento desta versão** (chat de planejamento, ver entrada correspondente no
`LOG.md`): incorporadas as 5 melhorias sugeridas em
`RETROSPECTIVE.md#melhorias-sugeridas-para-o-plano` — separação decisão/execução
por item, índice explícito bug→item/track, tags de confiança
`[HIPÓTESE]`/`[CONFIRMADO]`, critério objetivo de fechamento de Track, e overlay
de triagem por severidade. Também reconciliados 2 bugs que estavam sem nenhum
item/track vinculado (`BUG-004`, `BUG-022`) e 4 referências de PR desatualizadas
em `BUGS.md` (confirmadas mergeadas via `git log`).

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
| BUG-032 | Crítico | T-02 | **Novo (2026-07-03)** — escalação de privilégio: `syncUserPermissionsOnLogin` concede admin a partir de e-mail não-verificado. Correção proposta (gated, identidade), aguardando aprovação; fura a fila por severidade |
| BUG-020 | Alto | T-02 | **Em Progresso** — 5 lotes mergeados: 1/booking (PR #8, 2 IDORs) + 2/CRUD admin (PR #9) + 3/analytics admin (PR #10) + 4/queries do calendário (PR #11, +2 IDORs) + 5/journey (PR #12, +2 IDORs); faltam 2 lotes (upload/portfólio, auth-permissions) para fechar |
| BUG-010 | Alto | T-03 | **[HIPÓTESE]** precisa confirmar se a implementação duplicada em `post-event.ts` é código morto antes de decidir remoção |
| BUG-008 | Alto | F2-04, T-03 | Requer plano+aprovação (toca fluxo financeiro/cotas) |
| BUG-004 | Alto | T-02 | Requer avaliação de exposição além do painel admin antes de corrigir |
| BUG-001 | Alto | T-06 | Requer plano+aprovação (dado sensível/PII, regra explícita do `CLAUDE.md`) |

Há **1 `Crítico` aberto**: `BUG-032` (escalação de privilégio via
`syncUserPermissionsOnLogin`), registrado em 2026-07-03 com correção proposta
aguardando aprovação (identidade/gated). O `BUG-003` (o outro Crítico já
registrado) foi corrigido e mergeado (PR #3).

---

## Checagem cruzada — ISO/IEC 25010

| Característica | Onde é endereçada no plano abaixo |
|---|---|
| Adequação funcional | Fase 1 (por página), Fase 2 (features transversais), Fase 3 (regras de negócio), Fase 4 (jornadas e2e) |
| Usabilidade | Fase 0 (padrão canônico de design/UX via Mapa 5; tom de voz/copy via F0-06), Fase 1 (critério de aceite de cada página inclui usabilidade e revisão de texto/títulos) |
| Eficiência de desempenho | Track adicional "Não-funcional / Performance" (full scans sem paginação já achados — `BUG-017`) |
| Confiabilidade | Track adicional "Concorrência/Transactions" + Fase 4 (regressão e2e); transações do Firestore em booking/quotas já usam `runTransaction` corretamente na maioria dos casos mapeados |
| Segurança | Track adicional "Segurança sistemática" (matriz de guards do Mapa 4) + bugs já corrigidos (`BUG-003/007/019/023/024`) e abertos (`BUG-004/005/006/020/021/025`) |
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
- Execução: Gated — aguarda plano+aprovação por lote (0/3 lotes feitos)
- Resultado: Plano de convergência dos 11 modais restantes em 3 lotes, começando
  por unificar a escala de z-index (6 valores não coordenados hoje — risco real
  de empilhamento errado `ContractGateModal` vs `UpsellServiceModal`). Detalhe em
  `F0-DECISIONS.md#f0-01`.
- Bug(s) vinculado(s): BUG-026 (Aberto, com plano de correção registrado), BUG-027 (Aberto, remoção segura)
- Log: [2026-07-02] decidido — ver `LOG.md`

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
- Execução: Parcial — `src/actions/entitlements.ts` (ação órfã) + tipos
  `UserEntitlement`/`EntitlementStatus` **removidos e mergeados** (PR #1).
  Parada de escrita de `User_JourneyMap` (em `welcome-survey.ts`/`survey-effects.ts`)
  segue **Gated** (toca god file/onboarding)
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
- Modo de validação: PENDENTE
- Decisão: —
- Execução: Não iniciada
- Resultado: —
- Bug(s) vinculado(s): BUG-014 (a confirmar/limpar durante esta validação)
- Log: —

### [F1-02] Fluxo de checkout público e contrato retroativo
- Categoria(s) de qualidade: Adequação funcional / Segurança
- Critério de aceite: ver critério comum + confirmar se `/checkout/[slug]`
  deve convergir para o fluxo oficial de membro ou se a duplicidade é
  intencional (decisão de negócio, não só técnica)
- Modo de validação: PENDENTE
- Decisão: Pendente — Gestora decide se `/checkout/[slug]` (resgate
  gratuito/cupom-100%) converge para o fluxo de membro ou permanece separado
  e documentado como tal
- Execução: Não iniciada
- Resultado: —
- Bug(s) vinculado(s): BUG-002
- Log: —

### [F1-03] Hub — dashboard e motor de jornada
- Categoria(s) de qualidade: Adequação funcional / Usabilidade
- Critério de aceite: ver critério comum + Sequence Lock e Upsell Gate se
  comportam conforme Mapa 3
- Modo de validação: PENDENTE
- Decisão: —
- Execução: Não iniciada
- Resultado: —
- Bug(s) vinculado(s): BUG-015
- Log: —

### [F1-04] Hub — carreira, agenda do membro, contratos, visão geral
- Categoria(s) de qualidade: Adequação funcional
- Critério de aceite: ver critério comum (estas 4 páginas já têm mapeamento
  detalhado no Mapa 2 — validação pode começar direto)
- Modo de validação: PENDENTE
- Decisão: —
- Execução: Não iniciada
- Resultado: —
- Bug(s) vinculado(s): —
- Log: —

### [F1-05] Hub — checkout de membro, networking, perfil, entrega de serviço
- Categoria(s) de qualidade: Adequação funcional / Segurança
- Critério de aceite: ver critério comum
- Modo de validação: PENDENTE
- Decisão: —
- Execução: Não iniciada
- Resultado: —
- Bug(s) vinculado(s): BUG-005, BUG-006, BUG-016
- Log: —

### [F1-06] Validar as 19 páginas de admin
- Categoria(s) de qualidade: Adequação funcional / Segurança
- Critério de aceite: ver critério comum (Mapa 2 já detalha entrega/componentes/
  actions de todas as 19 páginas — validação pode começar direto)
- Modo de validação: PENDENTE
- Decisão: —
- Execução: Não iniciada — nota: os 4 bugs de segurança vinculados abaixo já
  foram corrigidos (via T-02), mas a validação de UI/responsivo/copy das
  páginas em si ainda não começou; não confundir uma coisa com a outra
- Resultado: —
- Bug(s) vinculado(s): BUG-003 (Corrigido), BUG-007 (Corrigido), BUG-023 (Corrigido), BUG-024 (Corrigido)
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
- Modo de validação: PENDENTE
- Decisão: Pendente — unificar a chave "1-to-1" é técnico e direto; conectar
  `consumeQuotaAction` ao booking real é decisão de negócio (Gestora confirma
  se cota deve travar agendamento)
- Execução: Não iniciada
- Resultado: —
- Bug(s) vinculado(s): BUG-008, BUG-013
- Log: —

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
- Decisão: — (padrão de guard canônico já emergiu na prática —
  `requireAuth() + checagem dono-ou-admin` — formalizar como referência
  explícita quando o lote do BUG-020 for endereçado)
- Execução: Em andamento — **~6,9/11 (~63%)** (ver `DASHBOARD.md`). BUG-021
  **Corrigido** (PR #13, guard ad-hoc de upload unificado — conta como unidade
  inteira). BUG-020 é sistêmico e feito em lotes: **lotes 1 (booking, PR #8)**,
  **2 (CRUD admin, PR #9)**, **3 (analytics admin, PR #10)**, **4 (queries do
  calendário, PR #11)**, **5 (journey, PR #12)** e **6 (upload/portfólio, PR #13)**
  mergeados — contam fracionado no numerador (bug inteiro segue Em Progresso, mesma
  contabilidade do BUG-018/T-03). Falta 1 lote (`auth-permissions`) para o bug fechar.
- Resultado: ✓ Corrigidos/mergeados: BUG-003 (recover sem auth, PR #3), BUG-007
  (guard admin server-side = F0-05, PR #1), BUG-019 (IDOR de foto de perfil, PR
  #4), BUG-023 (rotas de debug órfãs, PR #3), BUG-024 (`trigger-sync` removido,
  PR #5), BUG-021 (guard ad-hoc de upload unificado, PR #13). ◐ Parcial: BUG-020 —
  lote 1/booking (PR #8): 2 IDORs fechados
  (`cancelBookingAction`/`submitEvaluationAction`) + `bookEventAction` com guard
  condicional que preserva o funil de lead; lote 2/CRUD admin (PR #9):
  `requireAdmin()` em `partners.ts` + `admin-assessments.ts`; lote 3/analytics
  admin (PR #10): `requireAdmin()` em `getAdminFormsAnalytics`/
  `getAdminSurveysAnalytics`; lote 4/queries do calendário (PR #11): +2 IDORs de
  leitura fechados (`getUserBookingsAction`/`getUserOneToOneQuotaAction`) +
  `requireAdmin()`/`requireAuth()` nas demais queries; lote 5/journey (PR #12):
  +2 IDORs por uid fechados (`getJourneyProgressAction`/`updateJourneySubStepAction`)
  + `requireAdmin()` nos `assignDynamicSubstep*` + `requireAuth()` nas leituras de
  catálogo; lote 6/upload+portfólio (PR #13): `requireAdmin()` em 5 actions admin
  (migração/sync/upload) + `requireAuth()`+dono-ou-admin em `uploadToUserDrive`
  (1 IDOR) — este lote também fechou o BUG-021. Lote restante (`auth-permissions`)
  aberto. ○ Restantes: BUG-004 (vazamento de path, precisa avaliação de
  exposição), BUG-005, BUG-006, BUG-025 (webhook HMAC).
- Bug(s) vinculado(s): BUG-003, BUG-004, BUG-005, BUG-006, BUG-007, BUG-019, BUG-020, BUG-021, BUG-023, BUG-024, BUG-025
- Log: entradas de 2026-07-02 e 2026-07-03 no `LOG.md`

### [T-03] Integridade e migração de dados
- Categoria(s) de qualidade: Manutenibilidade / Confiabilidade
- Critério de aceite: drifts de schema do Mapa 4 (timestamps mistos, chaves de
  cota, coleções órfãs, `AttendeeData` divergente do real) documentados com
  decisão de convergência ou aceite formal como legado
- Modo de validação: PENDENTE (executável via análise de código — profundidade
  igual às Fases 0-4)
- Decisão: —
- Execução: Em andamento (parcial) — **~0,5/4** (ver `DASHBOARD.md`) — estava
  registrado como "Não iniciado" neste plano, defasado em relação ao progresso
  real já refletido no `DASHBOARD.md`; reconciliado nesta sessão
- Resultado: ◐ Parcial: BUG-018 (`entitlements` removida via F0-04; `User_JourneyMap`
  pendente). ○ Abertos: BUG-008 (chave de cota), BUG-009 (**[HIPÓTESE]**
  `UserBooking.timestamp` sempre nulo, não confirmado em produção), BUG-010
  (**[HIPÓTESE]** `adminAddAttendeeAction` duplicado, código morto a confirmar).
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
- Execução: Em andamento — **1/2 mergeados (50%)** (ver `DASHBOARD.md`) —
  estava registrado como "Não iniciado", defasado; reconciliado nesta sessão
- Resultado: ✓ BUG-023 corrigido (PR #3). ○ BUG-001 aberto — requer
  plano+aprovação (dado sensível/PII).
- Bug(s) vinculado(s): BUG-001, BUG-023
- Log: —

---

## Índice — Bug → Item/Track

Fonte de verdade do **status** de cada bug é sempre `BUGS.md`; esta tabela só
resolve "onde esse bug se conecta no plano", que antes era inferido lendo cada
item. Construída/reconciliada nesta sessão — 2 bugs (`BUG-004`, `BUG-022`)
estavam sem nenhum vínculo e foram linkados agora.

| Bug | Severidade | Status (`BUGS.md`) | Item(s)/Track(s) |
|---|---|---|---|
| BUG-001 | Alto | Aberto | T-06 |
| BUG-002 | Médio | Aberto | F1-02 |
| BUG-003 | Crítico | Corrigido (PR #3) | F1-06, T-02 |
| BUG-004 | Alto | Aberto | T-02 *(recém-linkado)* |
| BUG-005 | Médio | Aberto | F1-05, T-02 |
| BUG-006 | Médio | Aberto | F1-05, T-02 |
| BUG-007 | Médio | Corrigido (PR #1) | F0-05, F1-06, T-02 |
| BUG-008 | Alto | Aberto | F2-04, T-03 |
| BUG-009 | Médio | Aberto | F0-02, T-03 — **[HIPÓTESE]** |
| BUG-010 | Alto | Aberto | T-03 — **[HIPÓTESE]** |
| BUG-011 | Médio | Aberto | F3-01 — **[HIPÓTESE]** |
| BUG-012 | Baixo | Aberto | F3-01 |
| BUG-013 | Médio | Aberto | F2-04 |
| BUG-014 | Baixo | Aberto | F1-01 |
| BUG-015 | Baixo | Aberto | F1-03, F2-01 |
| BUG-016 | Médio | Aberto | F1-05 |
| BUG-017 | Médio | Aberto | T-01 |
| BUG-018 | Baixo | Em Progresso (parcial) | F0-04, T-03 |
| BUG-019 | Alto | Corrigido (PR #4) | T-02 |
| BUG-020 | Alto | Em Progresso (6 lotes mergeados: PR #8/#9/#10/#11/#12/#13; falta só auth-permissions) | T-02 |
| BUG-021 | Baixo | Corrigido (PR #13) | T-02 |
| BUG-022 | Médio | Aberto | F3-03 *(recém-linkado)* — **[HIPÓTESE]** |
| BUG-023 | Alto | Corrigido (PR #3) | F1-06, T-02, T-06 |
| BUG-024 | Médio | Corrigido (PR #5) | F1-06, T-02 |
| BUG-025 | Médio | Aberto | T-02 |
| BUG-026 | Médio | Aberto | F0-01 |
| BUG-027 | Baixo | Aberto | F0-01 |
| BUG-028 | Baixo (rebaixado) | Aberto (adiado) | fora do escopo original — cluster de auth, ver `LOG.md` 2026-07-02 |
| BUG-029 | Baixo (rebaixado) | Aberto (adiado) | fora do escopo original — cluster de auth, ver `LOG.md` 2026-07-02 |
| BUG-030 | Baixo | Aceito | Riscos Aceitos (item 5, abaixo) |
| BUG-031 | Baixo | Aberto | fora do escopo original — melhoria de usabilidade, ainda sem track (candidato a T-05 ou item novo de Fase 2 quando priorizado) |
| BUG-032 | Crítico | Aberto | T-02 — escalação de privilégio (novo, achado no lote 7); correção proposta aguardando aprovação |

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
