# Design — Aba de Autenticações (Funil de Onboarding) no Admin

Documento de design de uma feature de observabilidade operacional do admin,
originada da investigação do fluxo de autenticação (ver `LOG.md`, entrada de
2026-07-29). **Não é código ainda** — é o plano a aprovar antes da execução.

## 1. Contexto e decisão (não-bug)

Durante a auditoria, reportou-se que "novos usuários fizeram login, passaram
pela welcome survey, mas nenhum dado ficou salvo em User/Drive/admin". A
varredura read-only do fluxo (ver `LOG.md`) encontrou o mecanismo real:

- Ao **abrir** a welcome survey, o `SurveyEngine` chama `resolveOwnIdentityAction`
  na montagem (`src/components/forms/SurveyEngine.tsx`), que **cunha a matrícula
  na hora** e grava `_AuthMap/{uid}` + incrementa o contador
  `_internal/counters/user/global` — antes de qualquer resposta.
- O documento raiz `User/{matricula}` (e a sincronização Drive) só nasce no
  **submit**, dentro de `handleWelcomeSurveyEffect`
  (`src/actions/effects/welcome-survey.ts`).

Logo, um usuário que **autentica e abre a welcome, mas não conclui**, fica com
`_AuthMap/{uid}` sem `User/{matricula}` — exatamente o estado dos uids
`g6KowzH8s8X6OoJitOltHgQwcgd2` e `jWpK2s4gqsdtGHJFJfvKtGIygLI3`, ambos
confirmados pela Gestora como usuários que **não concluíram** a welcome.

**Decisão da Gestora (2026-07-29): isto é comportamento por design, não bug.**
Não há perda de dado — não há dado a perder porque o usuário não enviou. As
hipóteses H1 (balde anônimo `BP-ANON`) e H2 (falha silenciosa do efeito) da
varredura permanecem válidas para um sintoma **diferente** (dado gravado na
coleção errada, com respostas reais); nenhuma delas se aplica aos casos acima.

Ressalva de design conhecida (não bloqueante): como a matrícula é cunhada na
abertura, cada abandono **queima um número sequencial** do contador e deixa um
`_AuthMap` órfão. Refino opcional futuro: **adiar a cunhagem para o submit** —
aí abandono não gera matrícula nem `_AuthMap`. Fora do escopo desta feature.

## 2. Objetivo

Dar ao admin **visibilidade das autenticações** e de onde cada pessoa parou no
funil de onboarding — sem a qual usuários "autenticaram e não completaram"
ficam invisíveis (só aparecem hoje se alguém inspecionar o `_AuthMap` no
console). Substitui inspeção manual do Firestore por uma tela.

## 3. Fonte de dados (sem novo write, retroativo)

Join em tempo de leitura de três fontes já existentes:

1. **Firebase Auth** (`getAdminAuth().listUsers()`) — a verdade sobre quem
   autenticou. Metadados úteis: `uid`, `email`, `displayName`, `providerData`
   (provedor), `metadata.creationTime`, `metadata.lastSignInTime`, `disabled`.
2. **`_AuthMap/{uid}`** — se existe e tem `matricula`, a identidade foi gerada
   (abriu welcome/cadastro, foi convidado, ou auto-healing). Campo `recoveredAt`
   distingue auto-healing.
3. **`User/{matricula}`** — se existe com `hasCompletedWelcome: true`, o
   onboarding foi concluído.

Vantagens: **zero mudança de schema, zero write novo, funciona retroativamente**
(pega os usuários já existentes). Mesma estratégia de leitura que
`getAdminUsersList` já usa (`collection("User").get()` +
`collectionGroup("User_Permissions")`) — aqui apenas somamos o `listUsers()`.

## 4. Modelo do funil (3 estágios)

Classificação por usuário (do Firebase Auth como base, join à esquerda):

| Estágio | Condição | Significado |
|---|---|---|
| **Autenticado (só)** | tem conta Auth, **sem** `_AuthMap` ou `_AuthMap` sem matrícula | logou, nunca abriu welcome/cadastro |
| **Identidade gerada** | tem `_AuthMap.matricula`, mas `User/{mat}` inexistente **ou** `hasCompletedWelcome != true` | abriu, não concluiu ← os dois casos reportados |
| **Onboarding completo** | `User/{mat}` existe com `hasCompletedWelcome: true` | usuário pleno |

Casos de borda a tratar explicitamente:
- **`_AuthMap` órfão sem conta Auth** (uid revogado/apagado no Auth mas AuthMap
  ficou): listar numa linha "identidade órfã" para higiene, não sumir com ela.
- **`User` sem conta Auth** (dado legado/import): idem, marcar "sem login Auth".
- **Convidados** (`_AuthMap` criado no claim, `User` já existe sem
  `hasCompletedWelcome`): caem em "Identidade gerada" corretamente.

## 5. UX e encaixe na navegação

Espelha o padrão de sub-abas já existente (`src/components/admin/FSTabs.tsx`),
que é a convenção do projeto para navegação interna de uma seção.

- Novo componente `UsersTabs` (rota-based, igual ao `FSTabs`): duas abas —
  **"Membros"** → `/admin/users` (a tela atual) e **"Autenticações"** →
  `/admin/users/autenticacoes`.
- Nova rota `src/app/admin/users/autenticacoes/page.tsx` renderizando a view.
- Topo: `FunctionalPageHeader` + linha de `StatTile` (total autenticado /
  identidade gerada sem concluir / onboarding completo / taxa de conversão).
- Tabela por usuário: nome, email (mascarado — ver 6), provedor, criado em,
  último login, uid, matrícula (se houver), **status do funil** (badge).
- Filtros: por estágio do funil e busca por email/nome/uid (client-side, como a
  tela de Usuários já faz).
- Loading: `AtmosphericLoading` com "Carregando Autenticações" (regra 8 do
  `CLAUDE.md`).

Alternativa considerada e descartada: novo item na sidebar (grupo "Pessoas").
Descartada porque a Gestora pediu explicitamente "aba paralela à de usuários" —
sub-aba dentro de `/admin/users` casa melhor e mantém as duas visões juntas.

## 6. Segurança e governança

- Action `requireAdmin()` no topo (paridade com `getAdminUsersList`).
- **Máscara de identidade interna**: aplicar `maskInternalContact`
  (`src/lib/identity-mask.ts`) sobre email/nome exibidos, para o e-mail do
  Master/equipe interna (`src/config/identity.ts`) não aparecer — admin é
  exceção da regra 6, mas a regra 7 (identidade interna) continua valendo.
- **Rótulos neutros na UI**: "Autenticações", nunca "Firebase Auth" (regra 6).
- Sem exibir o session cookie nem tokens; só metadados do `listUsers`.
- É uma tela **read-only** — nenhuma escrita, nenhuma ação destrutiva nesta v1.

## 7. Performance

- `listUsers()` pagina de 1000 em 1000 — implementar o loop de `pageToken` para
  não truncar (base pequena hoje, mas o loop evita o teto silencioso; casa com a
  mentalidade do Momento 2 do T-01, sem depender dele).
- `_AuthMap` e `User` lidos por varredura completa, como `getAdminUsersList` já
  faz — mesmo custo/ordem de grandeza. Montar `Map` por uid/matrícula para join
  O(1).
- Sem índices novos no Firestore (não há `where` composto novo).

## 8. Arquivos afetados (estimativa)

- **Novo** `src/actions/auth-tracking.ts` — `getAuthFunnelAction()` (requireAdmin,
  listUsers + join, classificação, máscara). Tipos do retorno em `src/types/`.
- **Novo** `src/app/admin/users/autenticacoes/page.tsx` — a página (orquestra).
- **Novo** `src/components/admin/AuthFunnelView.tsx` — a view client (tabela,
  StatTiles, filtros).
- **Novo** `src/components/admin/UsersTabs.tsx` — sub-abas Membros/Autenticações.
- **Editar** `src/app/admin/users/page.tsx` — montar `<UsersTabs />` no topo
  (mudança mínima, não mexe na lógica atual da tela de Membros).
- Sem alteração em `firestore.rules` (tudo via Admin SDK server-side).

### 8.1 Como ficou na execução (2026-07-29, branch `feat/admin-auth-funnel`)

Três refinos sobre o desenho acima, todos consistentes com ele:

- **Camada pura separada** `src/lib/auth-funnel.ts` (`classifyFunnelStage` +
  `buildAuthFunnel`) — sem `"use server"` e sem SDK. A action só lê/normaliza as
  três fontes e delega o join/classificação/máscara/agregados para essa função
  pura, que é a exercida pelo teste (Lição 18: testar a função de produção, não
  uma cópia). Tipos e entradas cruas do builder em `src/types/auth-funnel.ts`.
- **Resolução de matrícula com fallback por `User.uid`**: quando o `_AuthMap/{uid}`
  falta, o builder ainda resolve a matrícula pelo campo `uid` do doc `User`,
  espelhando o auto-healing por uid de `lib/identity/find-matricula.ts`. Evita
  marcar como "Autenticado (só)" quem já tem `User` mas cujo `_AuthMap` ainda não
  foi curado.
- **Máscara dentro do builder**: `maskInternalContact` é aplicada em `email` e
  `displayName` dentro de `buildAuthFunnel` (não só na view), fechando o risco 3
  (vazamento de identidade interna em campo derivado) e ficando coberta por teste.

Read-only confirmado: nenhuma escrita, nenhum índice novo, nenhuma mudança de
schema, nenhum toque em `firestore.rules`. Fase 2 (seção 9) não implementada.

## 9. Fora de escopo (fase 2, se a Gestora quiser)

- **Histórico de login por evento** (série temporal): gravar um doc a cada
  `createSignedSessionCookie` (`Auth_Events` ou similar) para tendências ao
  longo do tempo. Exige write novo em todo login, só vale daqui pra frente, e
  amplia superfície — casa com a recomendação de observabilidade do T-04
  (Sentry / eventos), guardada para pós-auditoria. A v1 acima entrega o
  **snapshot do funil**, que responde "quem autenticou e não concluiu" sem
  nada disso.
- Ações sobre usuários órfãos (reenviar convite, apagar `_AuthMap` órfão,
  reconciliar identidade) — só depois de ver os dados na v1.

## 10. Riscos

- **Volume do `listUsers`**: se a base crescer muito, a varredura completa fica
  cara; mitigar com paginação server-side/virtualização de tabela na v2 (não
  necessário hoje).
- **Divergência de contagem** vs. a tela de Membros (que conta docs `User`):
  esperado e correto — são recortes diferentes (Auth vs. onboarding completo);
  documentar na própria tela para não parecer inconsistência.
- **Máscara de identidade**: garantir que o join não vaze o email interno em
  nenhum campo derivado (nome, provedor). Cobrir com o helper existente.

## 11. Plano de execução (sessão de execução, branch + PR)

1. Tipos + `getAuthFunnelAction()` (com teste de classificação dos 3 estágios +
   casos de borda).
2. `AuthFunnelView` (tabela/StatTiles/filtros) reusando os componentes do
   redesign do admin.
3. `UsersTabs` + rota `/admin/users/autenticacoes` + montagem no
   `/admin/users`.
4. `npm run check` limpo; validação visual em produção pela Gestora (telas
   logadas não autenticam no preview — BUG-030).
