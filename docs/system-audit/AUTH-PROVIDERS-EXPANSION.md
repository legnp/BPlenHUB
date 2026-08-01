# Design — Expansão dos Meios de Autenticação + Página de Login

Plano de uma mudança **estrutural de identidade/sessão = área sensível** do
`CLAUDE.md`. Este doc é o **portão de aprovação**; aprovado, cada fase entra por
branch + PR, forward-only, com suíte de não-regressão antes do merge. Preserva os
resultados da auditoria (esp. T-02 / BUG-032 / BUG-106).

## 1. Escopo e decisões da Gestora (2026-07-30)

- **Provedores:** manter **Google** (já existe), adicionar **Microsoft** e um
  **fluxo próprio via magic link** (login sem senha). **Sem Apple** (custo US$99/ano
  + relay de e-mail) e **sem Discord** (não-nativo, e-mail não garantido).
- **Magic link, não senha:** decisão da Gestora — sem senha significa **sem
  "esqueci minha senha"** e **zero carga de suporte** nesse ponto. (Sem obrigação
  LGPD/legal que exija senha; ver seção 7. Não é aconselhamento jurídico —
  confirmar com o jurídico da BPlen se houver obrigação setorial específica.)
- **Unicidade de conta em duas camadas:** (a) por **e-mail**, via linking do
  Firebase; (b) por **pessoa**, via **trava de CPF** no cadastro.
- **Página de login dedicada** (`/entrar`) substituindo o modal atual, com
  **retorno à origem** unificado (`returnTo`).
- **Caixas de consentimento** (termos/privacidade, cookies, maior de 18) — LGPD.
- Tudo **nativo do Firebase Auth, e-mail verificado, custo zero**.

## 2. Modelo atual (o que a expansão precisa respeitar)

- Firebase Auth, provedor único = Google (`use-auth.ts`). Sessão = cookie
  assinado (`createSignedSessionCookie`), **agnóstico de provedor**.
- Identidade **e-mail-cêntrica**: matrícula ligada por e-mail através de uids
  (`_AuthMap/{uid}→matricula`, healing em `find-matricula.ts` e
  `syncUserPermissionsOnLogin`).
- **Invariante da auditoria (BUG-032/106):** o e-mail SEMPRE vem da sessão/token
  verificado, nunca de parâmetro do cliente. Provedores nativos do Firebase
  entregam e-mail verificado → invariante preservada de graça.

## 3. Camada 1 — unicidade por e-mail (linking do Firebase)

Ligar no console a opção **"vincular contas que usam o mesmo e-mail"** (uma conta
por e-mail). Fluxo de vínculo (obrigatório, senão o 2º provedor falha o login):

1. Usuário já entrou com Google (`maria@x.com`).
2. Clica "Entrar com Microsoft" com o mesmo e-mail.
3. Firebase devolve `auth/account-exists-with-different-credential` (não cria 2ª
   conta).
4. App: `fetchSignInMethodsForEmail(email)` → orienta "entre com Google para
   vincular" → após o login, `linkWithCredential(pendingCredential)`.
5. Resultado: **um uid, uma matrícula, dois jeitos de entrar**.

**Limite:** isso só deduplica quando o e-mail é o mesmo. E-mails diferentes da
mesma pessoa → camada 2 (CPF).

## 4. Provedores

- **Google** — mantido. Refatorar `signInWithGoogle` → `signInWith(provider)`
  genérico.
- **Microsoft** — `new OAuthProvider('microsoft.com')` + `signInWithPopup`.
  Requer registrar um app no Azure AD (grátis). E-mail verificado. Grátis.
- **Magic link (fluxo próprio)** — passwordless nativo do Firebase
  (`sendSignInLinkToEmail` / `signInWithEmailLink`), OU gerar o link via Admin SDK
  (`generateSignInWithEmailLink`) e **enviar pelo Resend com o template V01**
  (recomendado — mantém a marca e a entregabilidade que já usamos). Fluxo:
  1. Usuário digita o e-mail, clica "Entrar".
  2. Recebe um link único e temporário por e-mail.
  3. Clica → logado. **Sem senha, sem reset, sem suporte.**
  - Estado intermediário na UI: "Enviamos um link para seu e-mail." (precisa de um
    campo de input + estado — outra razão para página dedicada, seção 6.)
  - Persistência de sessão evita reenvio a cada visita (só 1º login / re-auth).

Todos entram no MESMO plumbing (`createSignedSessionCookie` +
`syncUserPermissionsOnLogin`), então o funil de Recepção e a resolução de
matrícula continuam iguais. Capturar `origin/provider` junto (casa com o
follow-up já registrado).

## 5. Camada 2 — trava de CPF no cadastro (unicidade por pessoa)

No passo de dados cadastrais, **no servidor**, antes de concluir:

- Verificar se o CPF já pertence a **outra** conta (uid/e-mail diferente do da
  sessão). Se sim → **bloquear** e mostrar: *"Este CPF já está vinculado a uma
  conta BPlen. Para acessar com este e-mail, fale com a BPlen para transferirmos
  sua conta."* + botão de contato. **Nunca mesclar automaticamente.**
- **Privacidade (regra 4):** CPF é PII sensível → checar por **hash** num índice
  dedicado (`_CpfIndex/{cpfHash} → matricula`), sem varredura e sem expor o CPF.
  Precedente: `cpfHash` já usado no fluxo de cupom
  (`syncCouponAcceptanceToDrive`). A mensagem não revela qual e-mail é dono.
- Refinos: validar formato + dígito verificador antes da checagem; se o CPF é da
  **mesma** pessoa (mesmo uid) → liberar (é ela reeditando); feedback no blur do
  campo **e** trava no submit server-side (defesa em profundidade); nunca CPF em
  URL/log.
- **Transferência manual** (o "fale com a BPlen") implica, no futuro, uma
  **ferramenta de admin** para reassociar/mesclar conta — fase posterior; por ora,
  bloqueio + contato basta.
- **Valor desde já:** essa trava vale mesmo antes do multi-provedor (impede 2
  contas Google com 2 e-mails da mesma pessoa) — pode ser um item próprio, menor.

## 6. Página de login dedicada (`/entrar`) + retorno à origem unificado

**Recomendação de UX: página dedicada, não modal.** Com magic link (input +
estado "cheque seu e-mail"), múltiplos provedores e caixas de consentimento, o
modal fica apertado; página dedicada é linkável, bookmarkável, acessível e é o
padrão da indústria quando a auth passa de um botão só.

**Estado atual (a unificar):**
- Login hoje é um botão em `/` e `/hub` (`GoogleLoginButton`) e em
  `/contrato-avulso/[token]`.
- Já existe um embrião de `returnTo`: `MatriculaGuard` faz
  `router.push('/?auth=required&returnTo=<path>')`.
- **Lacuna real:** rotas protegidas server-side (`hub/layout`, `membro/layout`,
  `admin/layout`, `contratos`, `HubShell`, etc.) fazem `redirect("/")` **sem**
  `returnTo` → quem tem uma página protegida favoritada e está deslogado cai em
  `/` e **perde o destino**. É exatamente o caso "favoritou gestão de agenda mas
  deslogou".

**Desenho unificado:**
- Criar `/entrar` (PT-BR; `/login` também serve — escolha da execução) como a
  **superfície canônica** de auth (todos os provedores + magic link + consentimento).
- **Convenção única `returnTo`**: todo ponto de entrada manda para
  `/entrar?returnTo=<path-atual>`:
  - Checkout (`MatriculaGuard`) → `returnTo` do checkout do produto.
  - Convite (`/contrato-avulso/[token]`, `/convites/...`) → `returnTo` da página do
    convite.
  - **Rotas protegidas** (proxy/`src/proxy.ts` + os `redirect("/")` dos layouts) →
    passar a redirecionar para `/entrar?returnTo=<rota-pedida>` em vez de `/` seco.
- Após autenticar, `/entrar` lê `returnTo` e navega para lá; fallback `/hub`.
- **Segurança (open-redirect):** validar que `returnTo` é caminho **interno
  same-origin** (começa com `/`, não `//` nem `http`) antes de redirecionar —
  senão vira vetor de phishing. Controle obrigatório (mantém a postura de
  segurança da auditoria).

## 7. Consentimento (LGPD) — arquitetura recomendada

Separar dois conceitos que costumam ser confundidos (não é aconselhamento
jurídico; textos e versões vêm do jurídico da BPlen):

- **Banner de cookies (global, não é do login):** componente site-wide, padrão
  **privacy-first** (rejeitar não-essenciais por default, opt-in explícito para os
  demais). É concern global, não deve ser acoplado à tela de login.
- **Consentimento de conta — SEMPRE no PRIMEIRO ACESSO, logo após o primeiro
  login (tela de "Boas-vindas"):** aceite explícito de **Termos de Uso +
  Política de Privacidade** e **declaração de maior de 18** — com **registro
  versionado** (uid/matrícula, timestamp, versão do documento aceito), armazenado
  em subcoleção privada. É um **gate**: sem o aceite, o usuário não avança do
  primeiro acesso. Precedente: `actions/legal.ts` + fluxo de aceite de cupom.
  - **Terminologia (decisão da Gestora):** chamar esta etapa de **"Boas-vindas"**,
    **nunca "onboarding"** — "onboarding" é reservado para uma etapa da **jornada
    de membro** (mesmo espírito da renomeação Onboarding→Recepção no funil de auth).
  - Reprompt: se a versão dos termos mudar, reexibir o gate no próximo acesso.
- **Regras LGPD a respeitar:** consentimento livre, informado, inequívoco e
  **específico**; **sem caixas pré-marcadas** (opt-in real); links para os
  documentos reais; permitir revogação; **guardar registro**. A **tela de login**
  leva só um aviso informativo ("Ao continuar, você aceita os Termos e a Política
  de Privacidade", com links); os **checkboxes explícitos** ficam na tela de
  Boas-vindas (primeiro acesso), não no clique de login.

## 8. Invariantes da auditoria a preservar

- E-mail sempre da sessão/token verificado (BUG-032/106) — preservado (provedores
  nativos = e-mail verificado).
- Uma matrícula por pessoa — linking (camada 1) + CPF (camada 2).
- Sem mudança em `firestore.rules` nem no cookie de sessão (agnósticos).
- `returnTo` validado same-origin (novo controle, não regride segurança).
- Funil de Recepção segue funcionando; `origin/provider` capturado junto.

## 9. Fases (forward-only; cada uma com plano+aprovação e testes de não-regressão)

- **Fase 0 — fundação (sem mudança visível de comportamento):**
  configurar "uma conta por e-mail"; implementar o fluxo
  `account-exists-with-different-credential`; refatorar `signInWith(provider)`
  genérico; criar `/entrar` + unificar `returnTo` (incl. rotas protegidas do
  proxy/layouts); **suíte de testes de identidade** garantindo BUG-032/106.
- **Fase 1 — provedores (grátis, audit-safe):** Microsoft + magic link (via
  Admin SDK + Resend/template V01) + captura de `origin/provider`.
- **Fase 1b — trava de CPF** (pode ir junto ou como item próprio; vale desde já).
- **Fase 2 — consentimento:** banner de cookies global + **gate de Boas-vindas**
  (primeiro acesso, logo após o primeiro login) com registros versionados de
  termos/privacidade/18+. Pode correr em paralelo (concern separado).
- **Fase 3 (posterior) — ferramenta de admin** de transferência/merge de conta
  (o "fale com a BPlen" manual vira operável).

## 10. Riscos → mitigação

| Risco | Mitigação |
|---|---|
| 2 matrículas p/ a mesma pessoa | linking por e-mail + trava de CPF |
| `account-exists-with-different-credential` derruba login | fluxo de vínculo na Fase 0 (pré-requisito) |
| Open-redirect via `returnTo` | validar caminho interno same-origin |
| Regressão nos invariantes de identidade | suíte de testes antes do merge |
| Consentimento LGPD inválido (pré-marcado / sem registro) | opt-in real + registro versionado |
| Entregabilidade do magic link | enviar via Resend (já usado) com template V01 |

## 11. Custo

Zero de plataforma: Google, Microsoft, magic link e e-mail/senha são Firebase
Auth clássico (grátis). Nada força Blaze nem Identity Platform (só seriam
necessários para Discord/OIDC, que ficou fora). Azure AD app = grátis.

## 12. Itens que dependem de terceiros/decisão

- Textos e versões de Termos/Privacidade e a regra de idade — **jurídico da BPlen**.
- Registro do app no **Azure AD** (Microsoft) — credencial de projeto.
- Configuração do console do Firebase (linking, magic link, domínio autorizado) —
  operação de proprietário do projeto (Gestora), como o deploy de índices.

## 13. Design aprovado das telas (2026-07-31)

**Aprovado pela Gestora.** Protótipos de referência (HTML self-contained) em
`scratch/` (gitignored): `bplen-login-prototype.html` e
`bplen-boas-vindas-prototype.html`. A execução implementa o equivalente em
React/Next dentro da área pública/de entrada.

**Universo visual:** área pública, **tema dark do home** (`theme-dark`): fundo
`#000`, texto `#fff`, muted `#9CA3AF`, acento magenta `--accent-start #ff2c8d` →
`--accent-end #ff006e`, roxo de apoio `#9677D9`. Fonte **Inter**. Vidro escuro
(`rgba(255,255,255,.035)` + borda `rgba(255,255,255,.08)` + blur). Cantos 10–18px.

**Fundo:** portar o `ParticleNexus` do home (partículas pink/roxo/violeta, drift
lento + revelação por mouse, `mix-blend:screen`, opacidade ~.6) — no protótipo há
uma leve visibilidade ambiente (~.09) além da revelação; + glow magenta suave +
grade sutil mascarada. Reusar o componente real `ParticleNexus` na implementação.

**Logo:** usar o asset **branco oficial** `public/logo_bplen/BPlen - Logomarca -
Estatico - Branco.png` (adicionado pela Gestora, preserva o círculo do ícone) —
**sem filtro CSS**. Recomendação p/ execução: **renomear para nome URL-safe**
(ex.: `logo-branco.png`), evitando espaços no caminho servido. Altura ~24px.
**Sem a palavra "HUB" no header** (só o logo).

**Topbar:** logo à esquerda; à direita **"Suporte"** com ícone de WhatsApp →
`https://wa.me/5511945152088` (mesmo do home). **Sem seletor de idioma.**

**Tela de login (`/entrar`)** — layout split (hero à esquerda, card compacto à
direita, ~334px):
- Hero: eyebrow "BPLEN HUB"; título "Te damos as boas-vindas à BPlen HUB." (com
  "boas-vindas" em gradiente); subtítulo "Sua jornada de desenvolvimento de
  carreira começa aqui."
- Card "Acesse sua conta" / "Escolha como deseja entrar.": botão **Entrar com
  Google** (G multicolor), **Entrar com Microsoft**, divisor "ou", campo de
  **e-mail** + botão primário **"Enviar link de acesso"** (magic link, habilita só
  com e-mail válido) → estado **"Verifique seu e-mail"** (Reenviar / Usar outro
  e-mail). Aviso "sem senha". Fine print informativo: "Ao continuar, você aceita
  os Termos de Uso e a Política de Privacidade" (links) — **sem checkbox aqui**.

**Tela de Boas-vindas** (primeiro acesso, gate — herda o mesmo layout):
- Hero: eyebrow "PRIMEIRO ACESSO"; "Que bom ter você por aqui."; subtítulo curto.
- Card "Boas-vindas à BPlen HUB": 3 aceites **opt-in (nada pré-marcado)** —
  (1) Termos + Privacidade **[obrigatório]**, (2) maior de 18 **[obrigatório]**,
  (3) novidades **[opcional]**; botão **"Continuar"** habilita só com 1 e 2
  marcados. Registro **versionado** no aceite (seção 7).

**Responsividade (pedido da Gestora):** priorizar **redimensionar** (tipografia
fluida `clamp()`) para manter na horizontal em vez de quebrar; **não** partir
palavras-chave no meio (`white-space:nowrap` em "boas-vindas" e "BPlen HUB");
`text-wrap: balance/pretty`; empilhar (hero em cima, card embaixo) só em telas
estreitas (≤880px). Se a Gestora quiser garantia de "linha única" que auto-reduz
a fonte até caber, adicionar um pequeno "fit-to-width" em JS (opcional, registrado).

**Componentes delicados/minimalistas** (ajuste explícito da Gestora): ícones
15–16px, botões ~38–42px de altura, bordas finas, sem elementos largos/grosseiros.

**Detalhes que a execução deve trocar do protótipo:** Inter via `next/font` (não
`<link>` do Google Fonts); `ParticleNexus` real (não a cópia inline); logo via
`next/image` ou `<img>` do asset branco renomeado; magic link real via Admin SDK
(`generateSignInWithEmailLink`) + envio pelo Resend com o template V01.

## 14. Nota de execução — Fase 0 + Fase 1 (2026-07-31)

Implementado em branch + PR (forward-only). O desenho da seção 13 não mudou; a
execução seguiu o spec. Mapa do que foi entregue:

- **Guards puros de identidade + testes:** `src/lib/auth/identity-guards.ts`
  (`sanitizeReturnTo`, `verifiedEmailForHealing`, `callerOwnsUid`,
  `buildEntrarPath`, `normalizeEmail/Provider`) e a suíte
  `src/__tests__/auth-identity.test.ts` (não-regressão de BUG-032/106 + open-redirect).
- **Provedores:** `signInWith(provider)` genérico em `src/hooks/use-auth.ts`
  (Google + Microsoft) + fluxo de vínculo `account-exists-with-different-credential`;
  finalização unificada em `src/lib/auth/finalize-session.ts`.
- **Magic link:** `src/actions/auth-magic-link.ts` (Admin SDK + Resend V01) e a
  conclusão em `src/app/entrar/verificar/page.tsx` (`signInWithEmailLink`).
- **Telas:** `src/app/entrar/page.tsx` + `EntrarClient.tsx` + `entrar.module.css`
  (CSS Module escopado, tema dark do protótipo, `ParticleNexus` real, Inter via
  `--font-inter`). Logo: `public/logo_bplen/logo-branco.png` (renomeado URL-safe).
- **Retorno à origem unificado:** `src/proxy.ts` (redireciona protegidas para
  `/entrar?returnTo=` e expõe `x-bplen-pathname`); layouts protegidos +
  `MatriculaGuard` via `buildEntrarPath`/`entrarRedirectTarget`.
- **Captura origin/provider:** `src/actions/auth-login-metadata.ts` — provider do
  claim verificado; só anota `_AuthMap` existente (não cria, para não sombrear o
  auto-heal-por-e-mail).

**Pré-requisitos de console (Gestora), fora do código:** habilitar "uma conta por
e-mail" (linking); habilitar "Email link (passwordless)"; registrar app no Azure
AD (Microsoft); incluir o domínio de produção nos domínios autorizados (para o
continue-URL do magic link). Enquanto não configurados, Microsoft e magic link
renderizam mas não completam.

**Fase 1b — trava de CPF: ENTREGUE em producao (2026-08-01).** Indice
`_CpfIndex/{cpfHash}` (`src/lib/identity/cpf-index.ts`), trava nos dois pontos que
gravam `profile.cpf` (perfil do hub + cadastro do checkout), feedback de blur, e
backfill `scripts/backfill-cpf-index.js`. Nunca mescla automaticamente: CPF de
outra conta = bloqueio + contato. Duplicatas legadas resolvidas manualmente
(governanca: baldes A/B/C, regra de sobrevivencia, arquivar, auditar).

**Fase 2 — gate de Boas-vindas: ENTREGUE em producao (2026-08-01).** Gate de
consentimento no primeiro acesso (Termos + Privacidade + 18), com data de
nascimento validada (menor de 18 nao avanca) e registro versionado com prova (IP,
geo aproximada por IP, tipo de dispositivo) em `User/{matricula}/User_Consent`.
Trava em `HubShell` (bloqueia todo o /hub). `CONSENT_VERSION` permite reprompt ao
revisar os textos. Banner de cookies (`CookieConsent`) ja existente atende o outro
item. Codigo: `src/lib/consent/consent.ts`, `src/actions/consent.ts`,
`src/components/hub/WelcomeConsentGate.tsx`.

**Ainda pendente:** admin de transferência/merge de conta (Fase 3).
