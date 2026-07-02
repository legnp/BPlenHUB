# Mapa 3 — Regras de Negócio

Status: **completo** para os 6 blocos pedidos (jornada/checkin, não-membro, agendamento,
cotas/entitlements, carreira/status, outras regras). Cada regra cita `arquivo:função`
real — nada foi assumido por nome de arquivo.

---

## 1. Jornada / Checkins — dependências e flexibilização

| Regra | Onde | Condição → Efeito | Flexibilização |
|---|---|---|---|
| **Upsell Gate** | `src/hooks/useJourney.ts:getStageTelemetry` | Sem cota e sem `services[stepId]===true` → `hasAccess=false`, clique abre `UpsellServiceModal` | Etapa `order===0` sempre livre; `onboarding`/`offboarding` liberados com **qualquer** cota; override manual do admin em `services` tem prioridade máxima (inclusive para *revogar* acesso mesmo com cota positiva) |
| **Sequence Lock** | `useJourney.ts:getStageTelemetry` + `JourneyNav.tsx` + `SequenceLockModal.tsx` | Etapa N exige etapa N-1 `completed`, senão `isSequenceLocked=true` → modal de bloqueio | `onboarding` e qualquer etapa com `mentocoach` no id são isentas; `offboarding` libera se `desenvolvimento-de-carreira` OU `coaching-e-mentoria` estiver completo. Sem bypass manual de admin para a sequência em si. |
| **Cross-Service Completion Sweep** | `src/actions/journey.ts:applyCrossCompletionSweep` | Substep `type:referenceId` completo em uma etapa propaga conclusão para o mesmo par em outras etapas (e remove em cascata se desmarcado) | Nenhuma — aplicado incondicionalmente |
| **Chain Unlocking** | `journey.ts:applyCrossCompletionSweep` (passo 3) | Etapa completa → próxima etapa promovida automaticamente de `locked` para `current` | Nenhuma — automático |
| **Atribuição Dinâmica de Subcheckpoint** | `journey.ts:assignDynamicSubstepAction` / `assignDynamicSubstepToPresentAttendeesAction` | Admin/automação pós-evento adiciona subcheckpoint extra a uma etapa; versão em lote só considera `attendanceStatus==="present"` | É, em si, o mecanismo de flexibilização manual do admin |
| **Sync retroativo de nomenclatura** | `journey.ts` (`normalizeString` em várias funções) | Casa `stepId` salvo com `id` atual da config de estágios, tolerando renomeações de slug | Mecanismo de resiliência, não regra de negócio em si |

---

## 2. Comportamento para não-membros

| Cenário | Onde | Efeito |
|---|---|---|
| Não-membro clica em etapa da jornada (qualquer, exceto offboarding) | `JourneyNav.tsx:handleStageClick` | Abre `UpsellServiceModal` com o produto correspondente (`getProductBySlug`); ícone de cadeado + grayscale + "beacon" pulsante na próxima etapa |
| Não-membro clica em **Offboarding** especificamente | `JourneyNav.tsx` + `NonMemberOffboardingModal` | Modal dedicado ("Offboarding é a etapa master...") com CTA para `/servicos/pessoas` — **não** é o upsell genérico |
| Não-membro pleno navega para `/hub` (home) | `src/components/hub/MemberJourneyHero.tsx` | `showPreview=true`: rótulo muda para "Prévia da Jornada...", mas a navegação continua sujeita às mesmas travas de acesso/sequência acima — é só cosmético |

`FloatingHubActions.tsx` **não** tem relação com onboarding — é exclusivamente suporte/bug report + WhatsApp.

---

## 3. Regras de agendamento (Calendar/Booking)

| Regra | Onde | Detalhe |
|---|---|---|
| Limite de vagas | `calendar-module/booking.ts:bookEventAction`, `rescheduleAttendeeAction` | Bloqueia se `registeredCount >= totalCapacity`. **`adminAddAttendeeAction` ignora esse limite.** |
| Inscrição duplicada | `booking.ts:bookEventAction` | Bloqueia se já existe doc do usuário em `attendees` |
| Rate limit | `booking.ts:bookEventAction` | `checkRateLimit` com `RATE_LIMITS.BOOKING` por `uid` |
| Antecedência mínima (público) | `external-booking.ts:getPublicSlotsAction/getPublicAvailableDaysAction`; `calendarConfig.ts:PUBLIC_BOOKING_SETTINGS.minDaysInFuture=3` | Só afeta a **listagem** de slots públicos. ⚠️ **`bookEventAction` não revalida essa antecedência na gravação** — regra é só de UI, não é enforced no server (ver `BUGS.md`) |
| Limite de 1 booking/semana | `calendarConfig.ts:MAX_BOOKINGS_PER_WEEK=1` | ⚠️ **Constante declarada mas nunca usada em nenhum server action** — regra não implementada |
| Conflito de horário (slots públicos) | `external-booking.ts` | Invalida slot "1 to 1" que sobrepõe evento "bloqueador" no mesmo intervalo |
| Cancelamento | `booking.ts:cancelBookingAction` | Sem checagem de janela mínima — cancelamento livre a qualquer momento; penalidade de reembolso é só textual no contrato PDF, não enforced pelo sistema |
| Reagendamento | `booking.ts:rescheduleAttendeeAction` | **Exclusivo admin** (`requireAdmin`) — não existe self-service de reagendamento para o membro |
| Inclusão administrativa | `booking.ts:adminAddAttendeeAction` | Admin inclui participante direto como `"present"`, pulando `pending`, sem checar capacidade nem rate limit |
| Cota de sessões 1-to-1 | `calendar-module/queries.ts:getUserOneToOneQuotaAction` | Prioriza `mentoCoachSessionsLimit`; fallback `quotas["1-TO-1"].total`. ⚠️ **Não é chamada dentro de `bookEventAction`** — cota é só exibida (telemetria/UI), não bloqueia agendamento de fato |

---

## 4. Cotas / Entitlements

| Regra | Onde | Detalhe |
|---|---|---|
| Concessão de cota | `src/actions/quotas.ts:updateMemberQuotasAction` | Soma (`total += amount`) dentro de transação; normaliza `mentoria_1to1` → `1-TO-1` (uppercase) |
| Consumo de cota | `quotas.ts:consumeQuotaAction` | Bloqueia se `used >= total` ("Saldo insuficiente"); incrementa `used`. ⚠️ **Não é chamada pelo fluxo de booking** (ver seção 3) |
| Normalização de chave legada | `quotas.ts` (ambas funções acima) | Migra `mentoria_1to1` → `1-to-1`/`1-TO-1` — mas as duas funções usam **capitalização diferente** (bug real, ver `BUGS.md`) |
| Entitlement binário (sistema paralelo) | `src/actions/entitlements.ts:grantAccessAction/checkUserAccess` | Cria doc em coleção raiz `entitlements` com `status:'active'`. ⚠️ **Órfão — nenhum caller fora do próprio arquivo.** Controle de acesso real é via `User_Permissions/access.services` + `quotas`, não esta coleção |

---

## 5. Carreira / Status

| Regra | Onde | Detalhe |
|---|---|---|
| Liberação do módulo (toggle binário) | `career-module.ts:toggleCareerPlanningAccessAction` | Grava `services.career_planning` em `User_Permissions/access`; `checkAuthAndGetDb` exige `matricula` própria + flag ativa, ou `isAdmin` |
| Sync retroativo de dados legados (v3) | `career-module.ts:getCareerPlanningDataAction` | Roda uma única vez por matrícula (`legacySynced_v3` flag); converte `User_Bookings` antigos em `Feedbacks`/`Career_Backlog`/`Shared_Documents`/`Atas` |
| Resgate on-the-fly de devolutiva DISC | `career-module.ts:getCareerPlanningDataAction` | Copia `results/disc.file` para `Shared_Documents` automaticamente se `isReleased !== false` |
| Status de Objetivo derivado de metas | `career-module.ts:updateCareerGoalProgressAction` | `"Alcançado"` se todas as metas completas; `"Em Andamento"` se ≥1 completa ou `currentValue>0`; senão `"Não Iniciado"` — cálculo automático, mas `saveCareerObjectiveAction` também aceita status livre da UI sem essa validação cruzada |
| Status de tarefa do backlog | `career-module.ts:updateCareerTaskStatusAction` | Nenhuma máquina de estados — qualquer transição é permitida, só registra `statusHistory` |

*Nota: os bugs de "comparações de status mortas" em `visao_geral` e o de `grantedQuotas` na Cláusula 3 do contrato já foram corrigidos em commits anteriores (`6db6581`, `ea95b6b`) — não reabertos aqui, lógica documentada reflete o estado atual pós-correção.*

---

## 6. Outras regras de negócio encontradas

| Regra | Onde | Detalhe |
|---|---|---|
| Cupom V2 (batch, CPF-locked) | `coupon-v2.ts:applyCouponV2Action` | Expiração conta do **resgate** (`redeemedAt + expiresAfterDays`), não da criação; 1 cupom por CPF por `batchId`; exige aceite explícito de termos antes de vincular (fluxo em 2 chamadas) |
| Pendência de contrato | `legal.ts:getPendingContracts` | Pedido pago (`paid/active/completed`) sem assinatura em `Legal_Audits` **e** produto com `price!==0` → pendente. Produtos gratuitos são isentos |
| Cláusula de reembolso (7 dias) | `legal.ts:createContractBuffer` (Cláusula 5) | **Apenas texto no PDF** — nenhum server action automatiza o cálculo/execução do reembolso proporcional |
| Convite de uso único | `invitations.ts:validateInvitationTokenAction/claimInvitationTokenAction` | Token deve estar `status==="unused"` e pertencer ao `eventSlug` correto; claim roda em transação atômica que revalida tudo (proteção contra corrida) |

---

## Débito técnico identificado nesta rodada (regras declaradas mas não aplicadas)

- `MAX_BOOKINGS_PER_WEEK` definida, nunca usada.
- `MIN_LEAD_TIME_DAYS`/`minDaysInFuture` só valem para listagem, não para gravação do booking.
- `consumeQuotaAction` nunca é chamada a partir do fluxo de agendamento — cota de 1-to-1 não trava o agendamento de fato.

Ver `BUGS.md` para os itens acima já registrados como bugs formais.
