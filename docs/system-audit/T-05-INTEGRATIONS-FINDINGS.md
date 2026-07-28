# T-05 — Integrações externas em condição real: inventário e verificação

Track de escopo **misto** (`00-PLAN.md`): testar em **sandbox / condição real** o que for
seguro; onde exigir **credencial/custo real** ou **efeito colateral** (pagamento real,
envio de e-mail, escrita no Drive), **documentar o gap + protocolo para a Gestora**.
Verificação read-only, 2026-07-23. Nenhuma operação com efeito foi disparada.

---

## 1. Inventário dos pontos de integração

| Integração | SDK | Onde | Papel |
|---|---|---|---|
| **Mercado Pago** | `mercadopago` (server) + `@mercadopago/sdk-js` (client) | `lib/mercadopago.ts`, `actions/mp-checkout.ts`, `api/webhooks/mercadopago/route.ts` | Checkout + webhook de pagamento |
| **Resend** | `resend` | `lib/checkout-emails.ts`, `attendance-emails.ts`, `actions/{booking,external-booking,invitations,products}.ts`, cron | E-mails transacionais + alerta do cron |
| **Google Calendar/Drive/Sheets** | `googleapis` | `lib/google-auth.ts` (JWT service account), `calendar-module/{queries,sync}.ts`, `lib/drive-utils.ts` | Agenda + backup soberano (Drive/Sheets) |

Config (`.env.local`): **todas as chaves presentes** — MP (token/public/webhook), Resend,
Google (SA + IDs de Calendar/Drive), Firebase Admin.

## 2. Verificação read-only (condição real, sem efeito)

| Integração | Resultado |
|---|---|
| **Google Calendar** | ✅ **Verificado.** `events.list` na agenda principal autenticou e retornou eventos (SA JWT, escopo `calendar.readonly`). |
| **Google Drive** | ✅ **Verificado.** `files.get` na pasta raiz autenticou e retornou metadados. Sheets usa a mesma SA/auth (não exercido isoladamente, mas a mesma credencial cobre os 3 escopos). |
| **Mercado Pago** | ✅ **Token válido** (`GET /v1/payment_methods` → 18 métodos). **Webhook HMAC ATIVO** (`MERCADOPAGO_WEBHOOK_SECRET` presente; o handler valida assinatura timing-safe e faz re-fetch do pagamento — não confia no body). Código do webhook sólido (idempotente, disparos assíncronos não bloqueiam a resposta). |
| **Resend** | ⚠️ **Inconclusivo por read-only.** `GET /domains` → HTTP 401. Isto **não prova falha**: chave "sending-only" (mais segura) dá 401 em `/domains` e envia normalmente. Não existe check read-only de chave sending-only sem **enviar** (efeito). Evidência empírica de que funciona: o produto envia e-mails de booking/convite/checkout em produção. |

## 3. Achados e recomendações

1. **MP — ambiente de produção: ESCLARECIDO pela Gestora (2026-07-28).** O token **local** é
   `TEST-` (sandbox). **A produção TAMBÉM está em credencial de TESTE por ora, de forma
   deliberada** — a troca para a credencial de produção (`APP_USR-`) será feita **após a
   conclusão da auditoria**. Portanto NÃO é um risco em aberto: é um estado intencional. Item
   fechado; nota de transição: ao ligar a produção pós-auditoria, confirmar `APP_USR-` na Vercel
   e refazer o teste E2E de pagamento (seção 4) com a credencial real.
2. **Resend — esclarecer o escopo da chave local.** O 401 em `/domains` sugere chave
   sending-only. Se o **teste local** de e-mail um dia falhar, é por aqui. Sem ação
   necessária se os envios de produção estão saindo (estão).
3. **Integrações confirmadas vivas:** Google (Calendar/Drive) e Mercado Pago (token +
   webhook). Sem sinal de credencial expirada/quebrada.

## 4. Escopo reduzido — E2E que exige custo/efeito real (protocolo para a Gestora)

Estes **não** foram executados por terem efeito colateral (dinheiro, e-mail, escrita) —
ficam como validação humana quando/se desejado:

- **Pagamento E2E (MP):** um checkout real (ou com usuário/cartão de teste do sandbox MP)
  → confirmar que o webhook aprova, libera o serviço (`maybeReleaseService`) e dispara
  e-mail + extrato no Drive. Toca fluxo financeiro (gated no `CLAUDE.md`).
- **Envio de e-mail E2E (Resend):** disparar um e-mail transacional real e confirmar
  entrega + template. Efeito colateral (envio) — decisão/execução da Gestora.
- **Escrita no Drive/Sheets E2E:** confirmar que o backup soberano grava (ex.: extrato de
  compra, planilha de survey). Efeito colateral (escrita).

## 5. Estado do track

**T-05 concluído no escopo misto definido:** parte de **condição real verificada**
(read-only) — Google e Mercado Pago confirmados vivos, Resend presumido-ok com ambiguidade
documentada; parte **E2E com custo/efeito** documentada como protocolo de execução humana
(seção 4) + 2 recomendações de confirmação (seção 3). Nenhum código alterado. Bug pré-
existente já rastreado no track: `BUG-046` (links de e-mail para rota inexistente
`/hub/membro/dashboard`, Baixo).
