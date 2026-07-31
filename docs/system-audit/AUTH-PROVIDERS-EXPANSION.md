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
