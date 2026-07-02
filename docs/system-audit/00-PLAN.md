# BPlen HUB — Plano Mestre de Homologação e Refinamento Fullstack

Este é o checklist mestre do processo de validação amplo do sistema (infra, banco,
design, arquitetura, lógicas de fluxo, regras de negócio, textos/tons). Ele é
**a fonte de verdade compartilhada entre chats** — todo chat de execução lê este
arquivo (e o `LOG.md`) antes de agir, e atualiza o status aqui ao final.

Populado pelo chat de planejamento a partir dos 5 mapas (`01` a `05`). **Status
de cobertura dos mapas**: os 5 mapas estão **completos** (públicas, hub, admin,
regras de negócio, Firestore, API routes/Server Actions, design system). Uma
lacuna estrutural residual e conhecida: contagem exata de quantas etapas da
jornada usam `SurveyEngine` (ver nota de fechamento em `01-map-features.md`) —
não bloqueia o início de nenhuma fase abaixo. Ver `LOG.md` para o histórico
completo de como os mapas foram fechados em 2 sessões.

---

## Protocolo entre chats

1. Todo chat de execução deve ler este arquivo + as últimas entradas do `LOG.md`
   antes de agir, e deve terminar registrando uma entrada no `LOG.md` (data,
   escopo trabalhado, achados, decisões, mudanças de status neste plano).
2. Ao tentar um item do checklist, o chat de execução decide o **Modo de
   validação** na hora, não antes:
   - Se conseguir validar sozinho (código + preview) → marca `Automatizado`,
     executa, registra `Resultado`/`Status`, e abre bug em `BUGS.md` se achar algo.
   - Se não conseguir (bloqueado por login, exige dispositivo real, exige
     julgamento humano, exige carga real, etc.) → marca `Requer execução humana`
     e escreve ali mesmo um protocolo guiado passo a passo para a Gestora
     (Victor) executar e reportar o resultado, que então é registrado de volta
     no item.
3. Bugs encontrados durante qualquer fase são registrados em `BUGS.md` antes de
   decidir corrigir inline ou adiar (ver regras de área sensível no `CLAUDE.md`
   da raiz do projeto).
4. Se um mapa (`01`-`05`) ainda tiver lacuna relevante para o item que se está
   tentando validar, o chat de execução deve **completar a lacuna do mapa
   primeiro** (mesma metodologia de inspeção real de código dos mapas
   existentes) antes de validar o item — não validar às cegas.

---

## Template de item de checklist

```
### [ID] Nome do item
- Categoria(s) de qualidade: [ex: Usabilidade / Segurança / Performance]
- Critério de aceite: [o que define "passou" de forma objetiva e verificável]
- Modo de validação: PENDENTE
- Status: Não iniciado
- Resultado: —
- Bug(s) vinculado(s): —
- Log: —
```

---

## Checagem cruzada — ISO/IEC 25010

| Característica | Onde é endereçada no plano abaixo |
|---|---|
| Adequação funcional | Fase 1 (por página), Fase 2 (features transversais), Fase 3 (regras de negócio), Fase 4 (jornadas e2e) |
| Usabilidade | Fase 0 (padrão canônico de design/UX via Mapa 5; tom de voz/copy via F0-06), Fase 1 (critério de aceite de cada página inclui usabilidade e revisão de texto/títulos) |
| Eficiência de desempenho | Track adicional "Não-funcional / Performance" (full scans sem paginação já achados — `BUG-017`) |
| Confiabilidade | Track adicional "Concorrência/Transactions" + Fase 4 (regressão e2e); transações do Firestore em booking/quotas já usam `runTransaction` corretamente na maioria dos casos mapeados |
| Segurança | Track adicional "Segurança sistemática" (matriz de guards do Mapa 4) + `BUG-003/005/006/007` já achados |
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

### [F0-01] Padrão canônico de Modal
- Categoria(s) de qualidade: Usabilidade / Manutenibilidade
- Critério de aceite: decidido se `GlassModal` continua como modal-base oficial
  e um plano de convergência dos 11 modais que hoje reimplementam o padrão
  (Mapa 5 já levantou o inventário completo com veredito: só 2 de 13 modais
  de fato estendem `GlassModal`) — decisão de negócio/design pendente, não
  mais de pesquisa
- Modo de validação: Automatizado (decisão de padrão embasada por Mapa 5; implementação da convergência é gated — sistema de design)
- Status: Decidido — padrão + plano de convergência registrados; implementação pendente de plano+aprovação por lote
- Resultado: `GlassModal` confirmado como modal-base único oficial (já é o mais completo: portal, motion, ESC, variantes; 2 de 13 modais já o estendem). Plano de convergência dos 11 restantes em 3 lotes, começando por unificar a escala de z-index (6 valores não coordenados hoje — risco real de empilhamento errado ContractGateModal vs UpsellServiceModal). Detalhe em `F0-DECISIONS.md#f0-01`.
- Bug(s) vinculado(s): BUG-026 (Aberto, agora com plano), BUG-027 (remoção segura)
- Log: [2026-07-02] decidido nesta sessão — ver `LOG.md`

### [F0-02] Padrão canônico de Timestamp no Firestore
- Categoria(s) de qualidade: Manutenibilidade / Confiabilidade
- Critério de aceite: decidido se o padrão daqui pra frente é sempre
  `FieldValue.serverTimestamp()` (recomendado) vs. string ISO; documentado como
  débito técnico intencional os pontos já mistos (achados no Mapa 4: `products`,
  `marketing_coupons`, `SocialPost`, `Invitation_Events/Tokens`, `_AuthMap`)
- Modo de validação: Automatizado (decisão de melhor prática técnica)
- Status: Decidido
- Resultado: Padrão daqui pra frente = `FieldValue.serverTimestamp()` (Admin SDK) na escrita + serialização (`serializeTimestamp`/`serializeDoc`) na leitura; proibido gravar `Date` nativo ou string ISO manual em campos novos. Tipo TS reflete a forma serializada, não `Timestamp` do SDK client. Pontos mistos existentes (`products`, `marketing_coupons`, `User.lastPhotoUpdate`, `Booking_Proposals`, `Invitation_Events`, `_AuthMap`) aceitos como legado documentado (não migrar à força). BUG-009 (`UserBooking.timestamp`) é defeito de nome de campo, não questão de tipo — segue rastreado. Detalhe em `F0-DECISIONS.md#f0-02`.
- Bug(s) vinculado(s): BUG-009 (único defeito ativo relacionado)
- Log: [2026-07-02] decidido nesta sessão — ver `LOG.md`

### [F0-03] Padrão canônico de identidade/nome de usuário
- Categoria(s) de qualidade: Manutenibilidade / Adequação funcional
- Critério de aceite: decidida uma única fonte de verdade para nome/nickname/
  email do usuário (hoje até 7 campos concorrentes: `profile.fullName`,
  `Authentication_Name`, `User_Nickname`, `nickname`, `User_Welcome.User_Nickname`,
  `User_Name`, `User_Email`) — documentado plano de convergência gradual (não
  migração forçada, dado que é dado legado)
- Modo de validação: Automatizado (decisão técnica de fonte de verdade)
- Status: Decidido — padrão + plano de convergência gradual registrados
- Resultado: Precedência canônica definida. Display name: `User_Nickname` → `Authentication_Name` → `profile.fullName` → `"Membro"`. Nome legal (contrato/cobrança): `profile.fullName` → `Authentication_Name` → `User_Nickname`. E-mail: `User_Email` → `email`. Campos `nickname` solto / `User_Name` / `User_Welcome.User_Nickname` = legado somente-leitura, nunca escrever em código novo. Já existe resolver parcial (`src/lib/user-identity.ts:resolveUserNickname`) a ser promovido a helper canônico único; convergência é de leitura (todos leem pela mesma precedência) e de escrita nova (todos escrevem nos mesmos 3 campos), sem migração de dados em massa. Detalhe em `F0-DECISIONS.md#f0-03`.
- Bug(s) vinculado(s): —
- Log: [2026-07-02] decidido nesta sessão — ver `LOG.md`

### [F0-04] Destino das coleções órfãs (`entitlements`, `User_JourneyMap`)
- Categoria(s) de qualidade: Manutenibilidade
- Critério de aceite: decidido se são removidas, arquivadas como legado
  documentado, ou reativadas com propósito claro
- Modo de validação: Automatizado (decisão documental; parada de escrita de `User_JourneyMap` toca onboarding/god file — implementação gated)
- Status: Decidido — arquivar ambas como legado; execução da limpeza gated onde toca onboarding
- Resultado: Nenhuma tem consumidor real. `entitlements` (+ `entitlements.ts`/`types`) = 100% órfã (sem callers, Mapa 4c); remoção de baixo risco como limpeza oportunística, após confirmar que nenhum export/relatório externo lê a coleção em produção. `User_JourneyMap/progress` (escrito só por `welcome-survey.ts`, sem leitor) = modelagem de jornada abandonada; decisão de parar a escrita em onboarding novo exige plano+aprovação (`welcome-survey.ts`/`survey-effects.ts` = efeito de onboarding + god file do CLAUDE.md). Detalhe em `F0-DECISIONS.md#f0-04`.
- Bug(s) vinculado(s): BUG-018 (Aberto, agora com decisão de destino)
- Log: [2026-07-02] decidido nesta sessão — ver `LOG.md`

### [F0-05] Paridade de guard servidor entre `/hub` e `/admin`
- Categoria(s) de qualidade: Segurança
- Critério de aceite: decidido se `/admin` deve ganhar verificação server-side
  equivalente à de `src/app/hub/layout.tsx` (hoje é só client-side)
- Modo de validação: Automatizado para a análise/recomendação (código confirmado); implementação gated — segurança/identidade → plano + aprovação antes de codar
- Status: **Implementado** na branch `fix/admin-server-side-guard` (aprovado pela Gestora em 2026-07-02), aguardando review/merge do PR
- Resultado: Confirmado por leitura direta: `src/app/hub/layout.tsx` (Server Component) chama `verifySignedSession()` antes de renderizar; `src/app/admin/layout.tsx` era Server Component mas NÃO verificava nada — só renderizava `<AdminLayoutClient>` (guard 100% client via `useAuthContext`). **Implementado**: `admin/layout.tsx` agora é async e chama `getServerSession()` (traz `isAdmin`, diferente de `verifySignedSession()` que só traz `uid/email`), com `redirect("/")` no servidor se sessão ausente / `role==="suspended"` / `!isAdmin` — espelhando `requireAdmin`. Guard client mantido como 2ª camada. `type-check` e `next build` limpos (o lint pré-existente da `main` tem 192 erros não relacionados — ver LOG). Nota: isto protege o RENDER da página; guards de Server Action (BUG-020/T-02) são esforço separado e igualmente necessário. Detalhe em `F0-DECISIONS.md#f0-05`.
- Bug(s) vinculado(s): BUG-007 (Em Progresso — corrigido na branch `fix/admin-server-side-guard`)
- Log: [2026-07-02] decidido e implementado nesta sessão — ver `LOG.md`

### [F0-06] Padrão canônico de tom de voz e nomenclatura (textos, títulos, subtítulos)
- Categoria(s) de qualidade: Usabilidade / Manutenibilidade
- Critério de aceite: guia de estilo definido (tom institucional, padrão de
  título/subtítulo, o que pode permanecer hardcoded vs. o que deve vir de
  config) e usado como referência objetiva para a revisão de copy da Fase 1;
  achados pontuais de copy hardcoded já mapeados (preço/garantia fixos em
  `/servicos/[audience]/[slug]`, texto "Resgate via Faturamento Interno" no
  checkout, data de última atualização em `/privacidade`) avaliados contra
  esse guia
- Modo de validação: Requer execução humana (ratificação) — rascunho de guia embasado por análise de copy (feito); tom institucional é decisão de marca da Gestora
- Status: **Ratificado pela Gestora (2026-07-02)** — guia canônico. Tom formal-acolhedor ("membro"/"você"); títulos em caixa alta + tracking; data de vigência de `/privacidade` a extrair para config (única ação de código). Ver ratificação em `F0-DECISIONS.md#f0-06`
- Resultado: Rascunho de guia de estilo redigido (idioma, títulos/subtítulos, CTAs consistentes, termos canônicos de marca, fronteira "pode ficar hardcoded" vs "deve vir de config") — ver protocolo de ratificação em `F0-DECISIONS.md#f0-06`. Achados de copy reavaliados: "Resgate via Faturamento Interno"/"Garantia BPlen" (`/checkout/[slug]:228/238`) = rótulo de marca, pode ficar hardcoded; `lastUpdated="21 de junho de 2026"` (`/privacidade:20`) = data de vigência legal, DEVE sair para config (risco compliance/T-06). CORREÇÃO DE MAPA: o achado "preço/garantia fixos em /servicos/[audience]/[slug]" é impreciso — verificado que o preço vem de `product.price` (config, não hardcoded) e não há texto de garantia nessa rota; a copy hardcoded está em `/checkout/[slug]`.
- Bug(s) vinculado(s): — (achado da data de vigência será tratado na revisão de copy da Fase 1 / T-06)
- Log: [2026-07-02] decidido/rascunhado nesta sessão — ver `LOG.md`

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
- Status: Não iniciado
- Resultado: —
- Bug(s) vinculado(s): BUG-014 (a confirmar/limpar durante esta validação)
- Log: —

### [F1-02] Fluxo de checkout público e contrato retroativo
- Categoria(s) de qualidade: Adequação funcional / Segurança
- Critério de aceite: ver critério comum + confirmar se `/checkout/[slug]`
  deve convergir para o fluxo oficial de membro ou se a duplicidade é
  intencional (decisão de negócio, não só técnica)
- Modo de validação: PENDENTE
- Status: Não iniciado
- Resultado: —
- Bug(s) vinculado(s): BUG-002
- Log: —

### [F1-03] Hub — dashboard e motor de jornada
- Categoria(s) de qualidade: Adequação funcional / Usabilidade
- Critério de aceite: ver critério comum + Sequence Lock e Upsell Gate se
  comportam conforme Mapa 3
- Modo de validação: PENDENTE
- Status: Não iniciado
- Resultado: —
- Bug(s) vinculado(s): BUG-015
- Log: —

### [F1-04] Hub — carreira, agenda do membro, contratos, visão geral
- Categoria(s) de qualidade: Adequação funcional
- Critério de aceite: ver critério comum (estas 4 páginas já têm mapeamento
  detalhado no Mapa 2 — validação pode começar direto)
- Modo de validação: PENDENTE
- Status: Não iniciado
- Resultado: —
- Bug(s) vinculado(s): —
- Log: —

### [F1-05] Hub — checkout de membro, networking, perfil, entrega de serviço
- Categoria(s) de qualidade: Adequação funcional / Segurança
- Critério de aceite: ver critério comum
- Modo de validação: PENDENTE
- Status: Não iniciado
- Resultado: —
- Bug(s) vinculado(s): BUG-005, BUG-006, BUG-016
- Log: —

### [F1-06] Validar as 19 páginas de admin
- Categoria(s) de qualidade: Adequação funcional / Segurança
- Critério de aceite: ver critério comum (Mapa 2 já detalha entrega/componentes/
  actions de todas as 19 páginas — validação pode começar direto)
- Modo de validação: PENDENTE
- Status: Não iniciado
- Resultado: —
- Bug(s) vinculado(s): BUG-003, BUG-007, BUG-023, BUG-024
- Log: —

---

### Fase 2 — Features transversais (Mapa 1)

### [F2-01] Consistência do motor de Jornada entre variações
- Categoria(s) de qualidade: Adequação funcional / Manutenibilidade
- Critério de aceite: decidido o destino de `/hub/step-journey` (remover,
  redirecionar, ou justificar como alternativa válida)
- Modo de validação: PENDENTE
- Status: Não iniciado
- Resultado: —
- Bug(s) vinculado(s): BUG-015
- Log: —

### [F2-02] Consistência do Gate de Contrato em todas as páginas do hub
- Categoria(s) de qualidade: Adequação funcional / Segurança
- Critério de aceite: `ContractGateModal` bloqueia consistentemente em todas as
  páginas do hub quando há pendência, sem exceção não documentada
- Modo de validação: PENDENTE
- Status: Não iniciado
- Resultado: —
- Bug(s) vinculado(s): —
- Log: —

### [F2-03] Consistência do seletor de tema entre hub e admin
- Categoria(s) de qualidade: Usabilidade
- Critério de aceite: as 7 opções de tema funcionam identicamente nas duas áreas,
  sem página que "esqueça" de herdar o `HubHeader`
- Modo de validação: PENDENTE
- Status: Não iniciado
- Resultado: —
- Bug(s) vinculado(s): —
- Log: —

### [F2-04] Consistência de Cotas/Entitlements
- Categoria(s) de qualidade: Adequação funcional / Confiabilidade
- Critério de aceite: chave de cota 1-to-1 unificada (uppercase vs lowercase),
  e decisão tomada sobre conectar `consumeQuotaAction` ao fluxo real de booking
- Modo de validação: PENDENTE
- Status: Não iniciado
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
- Status: Não iniciado
- Resultado: —
- Bug(s) vinculado(s): BUG-011, BUG-012
- Log: —

### [F3-02] Exceções do Sequence Lock ainda fazem sentido de negócio?
- Categoria(s) de qualidade: Adequação funcional
- Critério de aceite: confirmado com a Gestora se as exceções atuais
  (`onboarding`, `mentocoach`, regra especial de `offboarding`) ainda refletem
  a intenção de produto
- Modo de validação: Requer execução humana (julgamento de negócio)
- Status: Não iniciado
- Resultado: —
- Bug(s) vinculado(s): —
- Log: —

### [F3-03] Regras financeiras: Cupom V2, pendência de contrato, reembolso
- Categoria(s) de qualidade: Adequação funcional / Segurança
- Critério de aceite: confirmado que a cláusula de reembolso (7 dias, textual
  no PDF) tem processo manual real por trás, e que a pendência de contrato
  cobre todos os fluxos de compra existentes (incluindo o checkout duplicado
  de `BUG-002`)
- Modo de validação: PENDENTE
- Status: Não iniciado
- Resultado: —
- Bug(s) vinculado(s): —
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
- Status: Não iniciado
- Resultado: —
- Bug(s) vinculado(s): —
- Log: —

### [F4-02] Jornada: Convidado de evento exclusivo → Membro
- Categoria(s) de qualidade: Adequação funcional
- Critério de aceite: fluxo completo de `/convites/[slug]` até criação de
  matrícula e primeiro acesso ao `/hub`
- Modo de validação: PENDENTE
- Status: Não iniciado
- Resultado: —
- Bug(s) vinculado(s): —
- Log: —

### [F4-03] Jornada financeira: Compra → Contrato → Cancelamento
- Categoria(s) de qualidade: Adequação funcional / Segurança
- Critério de aceite: fluxo completo testado em ambas as variações de checkout
  (pública e de membro) até geração de contrato e um cenário de cancelamento
- Modo de validação: PENDENTE
- Status: Não iniciado
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
- Status: Não iniciado
- Resultado: —
- Bug(s) vinculado(s): BUG-017
- Log: —

### [T-02] Segurança sistemática (matriz de guards)
- Categoria(s) de qualidade: Segurança
- Critério de aceite: toda Server Action e API route do Mapa 4b/c (já
  classificada por completo — ver tabela "Server Actions — visão por padrão
  de guard" em `04-map-data-apis-permissions.md`) tem guard justificado ou
  corrigido; em especial o padrão sistêmico de dezenas de actions sem guard
  próprio (`BUG-020`) e o caso de IDOR confirmado (`BUG-019`) resolvidos ou
  aceitos formalmente com justificativa registrada
- Modo de validação: PENDENTE (executável via análise de código — profundidade
  igual às Fases 0-4; dados completos já disponíveis, não mais bloqueado)
- Status: Não iniciado
- Resultado: —
- Bug(s) vinculado(s): BUG-003, BUG-005, BUG-006, BUG-007, BUG-019, BUG-020, BUG-021, BUG-023, BUG-024, BUG-025
- Log: —

### [T-03] Integridade e migração de dados
- Categoria(s) de qualidade: Manutenibilidade / Confiabilidade
- Critério de aceite: drifts de schema do Mapa 4 (timestamps mistos, chaves de
  cota, coleções órfãs, `AttendeeData` divergente do real) documentados com
  decisão de convergência ou aceite formal como legado
- Modo de validação: PENDENTE (executável via análise de código — profundidade
  igual às Fases 0-4)
- Status: Não iniciado
- Resultado: —
- Bug(s) vinculado(s): BUG-008, BUG-009, BUG-010, BUG-018
- Log: —

### [T-04] Observabilidade (alertas de erro em produção)
- Categoria(s) de qualidade: Confiabilidade
- Critério de aceite: inventariado se existe alguma ferramenta de
  monitoramento/alerta de erro em produção hoje; se não, documentado o gap e
  recomendado próximo passo (ex.: Sentry, log-based alerting)
- Modo de validação: Requer execução humana / ferramenta externa — **escopo
  reduzido**: inventariar e documentar gap, não implementar
- Status: Não iniciado
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
- Status: Não iniciado
- Resultado: —
- Bug(s) vinculado(s): —
- Log: —

### [T-06] Compliance / LGPD (parte técnica)
- Categoria(s) de qualidade: Segurança / Compatibilidade
- Critério de aceite: violações técnicas já identificadas (`BUG-001`
  `Support_Tickets`, dado financeiro em `User_Orders` solto, `BUG-023` rotas
  de debug vazando dado de identidade/survey) resolvidas ou formalmente
  aceitas como risco; certificação jurídica formal continua fora de escopo
  (ver Riscos Aceitos)
- Modo de validação: PENDENTE (parte técnica executável via análise de código;
  parte jurídica é escopo reduzido/fora de escopo)
- Status: Não iniciado
- Resultado: —
- Bug(s) vinculado(s): BUG-001, BUG-023
- Log: —

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

Esses pontos ficam registrados como risco aceito e conhecido, não como pendência
esquecida.
