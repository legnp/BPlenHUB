# Design — Padrão de E-mail BPlen V01

Plano de implementação do novo padrão visual dos e-mails transacionais. **É o
portão de aprovação** de uma mudança de design system compartilhado (regra do
`CLAUDE.md`) — aprovado, uma sessão de execução implementa em branch + PR, com
envio de e-mail de teste real antes do merge.

Origem: redesenho feito no canvas de Design do Claude (prototipagem, sem acesso
ao repo). O código-fonte de referência está no diretório de trabalho adicional
`Novo padrão email bplen/code/` (`soberana-layout.ts`, `cron-alert-email-patch.ts`)
+ `assets/` (logo.png, favicon.png — já presentes no repo em `public/logo_bplen/`).

## 1. Conceito e nomenclatura

Este é o **modelo padrão da primeira versão oficial = V01**. O termo "Soberana/
soberano" (sensacionalista, fora do tom de voz da BPlen) sai do módulo de e-mail.
O lineage interno "v3.1/3.2/3.3" colapsa em **V01** (baseline único).

| Item | Hoje | V01 |
|---|---|---|
| Conceito/doc | "Soberana v3.3" | Padrão de E-mail BPlen — V01 |
| Arquivo | `src/lib/emails/soberana-layout.ts` | `src/lib/emails/email-layout.ts` |
| Função | `buildSoberanaEmail(...)` | `buildEmailLayout(...)` |
| Tokens | `EMAIL_STYLES` | `EMAIL_STYLES` (mantém — já neutro) |

Renomear o arquivo e a função exige atualizar **todos os importadores** — o que
já vamos tocar de qualquer modo (ver seção 4, eyebrow por caller). Usar rename +
ajuste de import no mesmo PR.

## 2. O que muda visualmente (V01)

Mesma base (cabeçalho, cartão, rodapé, tipografia, cores #044159/#9677D9/#9558A6),
acabamento premium:

- **Fita de acento** em gradiente no topo do cartão (`accentBar`:
  `90deg, #9558A6, #9677D9, #044159, #0D0D0D`).
- **Sombra suave** no cartão em vez de borda seca (`box-shadow` no wrapper).
- **Logo real** (`public/logo_bplen/logo.png`) no cabeçalho, substituindo o
  wordmark de texto; **ícone da marca** (`favicon.png`) no rodapé.
- **Rótulo eyebrow** por categoria acima do título (ex.: "AGENDA").
- **Botão primário sólido** `#044159`, formato pílula (`border-radius: 999px`)
  com sombra — decisão final da Gestora (degradê no botão foi descartado).
- **Rodapé** com divisor + ícone + texto + domínio `bplen.com`.

## 3. Correções obrigatórias sobre o código de referência

O `soberana-layout.ts` do canvas tem defeitos que **precisam** ser corrigidos ao
portar para `email-layout.ts`:

1. **`EMAIL_STYLES.footer` não existe mais, mas é referenciado** (no
   `buildSoberanaEmail`, no wrapper do rodapé) → renderiza `style="undefined"` e
   o rodapé perde centralização/tamanho/cor. **Reintroduzir o token `footer`**
   (`margin-top:40px; text-align:center; font-size:11px; color:#9CA3AF;
   text-transform:uppercase; letter-spacing:0.1em;`) ou inline equivalente.
2. **Degradê some no Outlook.** `accentBar`, `accentBarDanger` e `buttonDanger`
   usam `linear-gradient` sem fallback. Adicionar **`background-color` sólido
   antes do `background`** (ex.: `background-color:#044159` na `accentBar`;
   `#ef4444` nas danger). O botão primário já é sólido (ok). (Opcional, robustez
   máxima no Outlook desktop: VML na fita — registrar como refino, não bloqueia.)
3. **Verificar `NEXT_PUBLIC_APP_URL` em produção.** O logo carrega de
   `${clientEnv.NEXT_PUBLIC_APP_URL}/logo_bplen/logo.png`. A env existe
   (`env.ts:19`), mas precisa apontar para o app que serve o `public/` (o hub);
   se apontar para o site institucional sem esse asset, o logo dá 404 no e-mail.
   Conferir o valor antes do merge (fallback do código é `https://bplen.com`).
   **[Execução 2026-07-30] Resolvido:** `https://bplen.com` serve
   `/logo_bplen/logo.png` e `/logo_bplen/favicon.png` (HTTP 200) **e** `/hub/membro`
   (200) — ou seja, `bplen.com` é o próprio hub que serve o `public/`, e é o
   fallback do código. Logo não dá 404. (`hub.bplen.com` não resolveu do ambiente
   de execução, mas não é o domínio dos assets.)
4. Os assets já estão no repo (`public/logo_bplen/logo.png` e `favicon.png`) —
   **não copiar** da pasta de Downloads; só confirmar que estão versionados.

## 4. Eyebrow por e-mail (scope A — todos os callers)

`buildEmailLayout(content, footerText, { eyebrow, danger })`. Sem `eyebrow` o
cartão renderiza sem fita/rótulo — então **cada builder passa seu eyebrow**.
Vocabulário de categorias (enum sóbrio): `AGENDA`, `PAGAMENTO`, `ACESSO`,
`CONTRATO`, `CUPOM`, `PRESENÇA`, `CONVITE`, `SUPORTE`, `EQUIPE`, `SISTEMA`.
`danger: true` só em cancelamento/falha real (barra e rótulo em vermelho).

**`src/lib/email-templates.ts`** (agenda + notificações de equipe):
- `getBookingConfirmationEmail` → `AGENDA`
- `getAdminInclusionEmail` → `AGENDA`
- `getCancellationEmail` → `AGENDA`, `danger`
- `getRescheduleEmail` → `AGENDA`
- `getTeamBookingNotificationEmail` → `EQUIPE`
- `getTeamCancellationNotificationEmail` → `EQUIPE`, `danger`
- `getTeamInclusionNotificationEmail` → `EQUIPE`
- `getTeamRescheduleNotificationEmail` → `EQUIPE`
- `getTeamProposalNotificationEmail` → `EQUIPE`

**`src/lib/checkout-emails.ts`:**
- "Solicitação de compra recebida" → `PAGAMENTO`
- "Confirmação de Pagamento" → `PAGAMENTO`
- "Acesso Liberado" → `ACESSO`
- "sua contratação foi confirmada" → `CONTRATO`
- "cupom resgatado" → `CUPOM`
- "cupom expirou" → `CUPOM` (neutro — é aviso, não erro; sem `danger`)

**`src/lib/attendance-emails.ts`:**
- "Presença confirmada" → `PRESENÇA`
- "Registro de ausência" → `PRESENÇA` (neutro — sem `danger`)

**`src/actions/invitations.ts`:**
- e-mail do convidado → `CONVITE`
- e-mail da equipe → `EQUIPE`

**`src/actions/external-booking.ts`:**
- proposta do convidado → `AGENDA`
- notificação da equipe → `EQUIPE`

**`src/actions/products.ts`** (FAQ):
- confirmação ao usuário → `SUPORTE`
- notificação ao admin → `EQUIPE`

**`src/app/api/cron/sync-agenda/route.ts`** (patch — hoje é o **único** e-mail
com HTML inline fora do motor): rotear por `buildEmailLayout` com
`{ eyebrow: "SISTEMA", danger: true }` (ver `cron-alert-email-patch.ts`).

## 5. Arquivos afetados (bucket 1)

- **Renomear** `src/lib/emails/soberana-layout.ts` → `email-layout.ts`; portar o
  V01 com as correções da seção 3; exportar `buildEmailLayout` + `EMAIL_STYLES`.
- **Editar importadores/callers** (rename + eyebrow): `email-templates.ts`,
  `checkout-emails.ts`, `attendance-emails.ts`, `invitations.ts`,
  `external-booking.ts`, `products.ts`, e o caller de booking
  (`calendar-module/booking.ts` importa de `email-templates.ts` — só o import
  do nome muda se necessário).
- **Editar** `src/app/api/cron/sync-agenda/route.ts` (padronizar via patch).
- Sem mudança de schema, índice, `firestore.rules`, nem env nova.

## 6. Validação

- `npm run check` limpo (`NODE_OPTIONS=--max-old-space-size=8192` — quirk de
  memória do ambiente, não é erro de código).
- **Envio de teste real via Resend** para o e-mail da Gestora, cobrindo pelo
  menos: 1 agenda (com eyebrow), 1 cancelamento (`danger`), 1 pagamento, 1
  convite. Conferir no Gmail e, se possível, no Outlook (fallback de degradê).
- Validação visual final em produção pela Gestora após o deploy da Vercel.

## 7. Follow-ups registrados (fora deste PR)

- **Bucket 2 — copy visível com "Soberania":** `SequenceLockModal.tsx:45`
  ("Soberania Metodológica", título de modal do membro) e
  `ServiceDeliveryView.tsx:155` ("Soberania de Dados Google Drive" — **também
  vaza "Google Drive"**, viola a regra infra-invisível). Fix curto próprio; o do
  `ServiceDeliveryView` é praticamente bug. Prioridade sobre o bucket 3.
- **Bucket 3 — comentários/logs internos com "soberan\*":** ~100 ocorrências em
  ~48 arquivos ("Soberania de Dados/Acesso/Permissões", "Escrita Soberana").
  Sem efeito funcional; passada de limpeza de terminologia dedicada (branch/PR
  próprio), fora do PR de e-mail para não misturar design com refactor de
  comentários.
