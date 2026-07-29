# Fase 4 — Mapa de regressão das 3 jornadas end-to-end

Entregável da Fase 4 (`00-PLAN.md`): mapear cada jornada e2e por **leitura de
código** (rotas → actions → gates → transições de estado → terminal), e sinalizar
**pontos não documentados / armadilhas**. Mapeamento em 2026-07-28.

**Modo de validação:** o *mapa* é **Automatizado** (leitura de código, control-flow
conclusivo). Uma corrida e2e *ao vivo* (login real, pagamento real, evento real) é
**Requer execução humana** (Gestora) — fora do que o agente pode disparar sem efeito.

---

## F4-01 — Lead → Cliente → Membro pleno → Offboarding

| Etapa | Onde (rota/action) | Gate / transição |
|---|---|---|
| 1. Descoberta | `/servicos`, `/servicos/[audience]`, `/servicos/[audience]/[slug]` (público) | `MatriculaGuard` na rota de detalhe: sem matrícula → fluxo de captura/login. |
| 2. Aquisição | `/hub/checkout/[slug]` (`CheckoutFlow`) | Cria `order`; grátis/cupom-100% ou pago (MP). Ver F4-03. |
| 3. Contrato | tela de sucesso `/hub/checkout/success` (`CheckoutContractSigning`) | Assinatura → `status:"assinado"`. |
| 4. Liberação | `maybeReleaseService` (`checkout.ts:236`) | **Gate duplo (CT-3b.2):** pagamento aprovado **E** contrato assinado → `grantServiceEntitlement` (idempotente). |
| 5. Membro | `/hub/membro` (`MemberDashboardView`) | Gate server-side: `member_area_access === true` (senão redireciona a `/hub`). |
| 6. Jornada | `/hub/journey/[stepId]` (`SubStepRail`+`StepRenderer`) | `resolverAcesso` (via `resolveStageAccess`): `LIBERADO` / `SEQUENCE_LOCK` (tem, mas trava de ordem) / `PREVIA`/`UPSELL` (não adquirido → modal de upsell). Selo + entitlements + conclusões + dispensas. |
| 7. Offboarding | etapa `offboarding` (stage 7, `JourneyNav`) | Gated como as demais; se sem acesso, abre "offboarding locked modal". `stage-entitlement.ts:79` trata `isOffboarding`. |

**Observações/lacunas (F4-01):**
- **Ponto de virada "Membro pleno" = `member_area_access`.** Um convidado (F4-02) recebe
  `role:member` mas NÃO `member_area_access` — a área plena `/hub/membro` só abre quando esse
  serviço é concedido (via `grantServiceEntitlement`/toggle "Portaria" no admin). Confirmar que
  todo caminho de "cliente pagante" concede `member_area_access` quando esperado (não vi um ponto
  único garantindo isso — vem do produto adquirido).
- Progressão de etapas depende de `conclusoes` (etapas concluídas) — a leitura de conclusão já foi
  fonte de bug antes (`BUG-079`, chave legada). Fora do escopo deste mapa confirmar cada chave.

## F4-02 — Convidado de evento exclusivo → Membro

| Etapa | Onde | Gate / transição |
|---|---|---|
| 1. Entrada | `/convites/[slug]` | `getInvitationEventAction(slug)` carrega o evento. |
| 2. Token | `validateInvitationTokenAction(token, slug)` | Token `unused` + pertence ao evento. |
| 3. Login | Google (uid, email, authName) | — |
| 4. Claim + matrícula | `claimInvitationTokenAction` (`invitations.ts:144`) — **transação atômica** | Re-verifica token; resolve/cria matrícula (AuthMap → User por email → nova sequencial `BP-xxx-PF-AAMMDD` via contador atômico `_internal/counters`); cria `User` + `User_Permissions/access` (`role:member`, `services:{hub_community:false, survey_welcome:true}`); marca token `claimed`. |
| 5. Survey + e-mails | `submitInvitationSurveyAction` | **Identidade da SESSÃO VERIFICADA** (BUG-108), não de parâmetro. Grava respostas + e-mails transacionais. |
| 6. 1º acesso | `/hub` | Convidado entra no onboarding (`survey_welcome`), NÃO na área plena (sem `member_area_access`). |

**Observações/lacunas (F4-02):**
- **Segurança sólida:** token re-verificado dentro da transação (não confia no client); identidade
  do submit vem da sessão verificada (BUG-108/032/106 endereçados). Matrícula sequencial atômica
  (sem corrida). Anti-duplicado por email.
- **Terminal do convite = onboarding, não membro pleno.** O convidado precisa completar o welcome /
  adquirir para virar membro pleno — é a costura com a F4-01. Confirmar que o welcome de fato leva
  ao próximo passo (não trava sem saída para o convidado que não compra).

## F4-03 — Financeira: Compra → Contrato → Cancelamento

| Etapa | Onde | Gate / transição |
|---|---|---|
| 1. Checkout | `/hub/checkout/[slug]` (`CheckoutFlow`) | Cria `order` (`USER_ORDERS`). |
| 2a. Pago | `mp-checkout.ts` → MP preference → webhook `api/webhooks/mercadopago` | Webhook valida HMAC + re-fetch do pagamento; `status:"approved"` → `maybeReleaseService`. |
| 2b. Grátis/cupom-100% | fluxo direto | Sem MP; segue para contrato. |
| 3. Contrato | `CheckoutContractSigning` | Estados `pendente_assinatura`→`em_retificacao`→`assinado`→`cancelado` (`types/contracts.ts`). |
| 4. Liberação | `maybeReleaseService` | Pagamento aprovado **E** contrato assinado → entitlement. |
| 5. Cancelamento | (a) agendamento: `cancelBookingAction` (grace 24h preserva crédito); (b) contrato: status `cancelado` (admin, `contract-invoice.ts`). |

**Observações/lacunas (F4-03):**
- **[LACUNA — premissa do critério desatualizada]** O critério do F4-03 fala em "**ambas as
  variações de checkout (pública e de membro)**". A rota de **checkout público órfã** foi
  **REMOVIDA** (F1-02 / `BUG-002` / PR #48); a compra hoje passa pelo checkout logado
  (`/hub/checkout`). A "variação pública" a validar deixou de existir — a compra é uma só
  (logada). **Confirmar com a Gestora** que o critério deve ser atualizado para uma única
  superfície de checkout.
- **Cancelamento:** há cancelamento de **agendamento** (member-facing, com política de crédito) e
  de **contrato** (status `cancelado`, admin). **Não há** um fluxo de "cancelar a compra + estornar
  pagamento" self-service — o estorno financeiro (MP) não é automatizado. Confirmar se isso é o
  desejado (provavelmente sim — estorno é operação manual/administrativa).
- Webhook MP: hoje em **credencial de TESTE** por decisão da Gestora (produção pós-auditoria) — a
  corrida e2e de pagamento real fica para a virada da credencial (ver `T-05-INTEGRATIONS-FINDINGS.md`).

---

## Resumo de lacunas para decisão da Gestora

1. **F4-03 — critério desatualizado:** "checkout público e de membro" → só existe o logado (o
   público foi removido no `BUG-002`). Atualizar o critério.
2. **Corrida e2e AO VIVO** (login/pagamento/evento reais) é execução humana da Gestora — o mapa
   por código está feito; a corrida real do fluxo financeiro depende da virada MP para produção.
3. **Sem gaps de correção urgente encontrados no mapa** — os gates centrais (liberação por gate
   duplo, atomicidade do convite, identidade verificada, política de agendamento enforçada) estão
   sólidos e já cobertos por trabalho anterior (CONTRACTS/ACCESS-MODEL/AGENDA-SYNC, BUG-011/108).

## Estado

Mapeamento das 3 jornadas concluído por leitura de código. Nenhuma armadilha de código nova
encontrada; 1 premissa de critério desatualizada (F4-03) a ratificar com a Gestora. A validação
e2e **ao vivo** é passo de execução humana (Gestora), casada com a virada da credencial MP para
produção (pós-auditoria).
