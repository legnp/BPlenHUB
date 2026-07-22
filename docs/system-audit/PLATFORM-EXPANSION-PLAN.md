# Plano de Expansão da Plataforma — BPlen HUB

Documento vivo das expansões pedidas pela Gestora que vão **além** do escopo de
homologação/refino da auditoria (`00-PLAN.md`). Cada expansão é analisada quanto a
viabilidade, dado disponível, esforço e melhor momento de execução.

---

## EXP-01 — Dashboard de KPIs do `/admin` (Painel)

**Pedido da Gestora (2026-07-22):** refazer o `/admin` como um verdadeiro painel/dashboard,
com vários cards pequenos de KPIs estratégicos, **agrupados por seções de similaridade**
(comercial, operacional, jornada, marketing...), com **filtro de período** (últimos 5/7/15/30
dias + personalizado), **métricas reais** (dado real do sistema); onde ainda não houver base,
deixar o card **provisionado com a tag "Aguardando base de dados"**. Sempre que possível, cada
card tem um **ícone que redireciona para a página da métrica**. O painel deve cobrir tanto o
estado **comercial** quanto a **operação**. Referência visual: resumo do Mercado Livre (muitos
cards compactos por seção). Analisar backend, banco, servidor e coleta de dados — não só estética.

> **Entrada recebida (2026-07-22):** a Gestora enviou a lista de métricas dela e **confirmou o
> timing: pós-auditoria** (não antecipar a Fase 1 agora). A lista está transcrita e classificada
> na seção **"Lista final de métricas (Gestora) + classificação"** abaixo; as candidatas do plano
> (mais adiante) foram mantidas como referência e mescladas ali. **Fase 0 (escopo) concluída** —
> execução (build) fica para depois da auditoria.

### Recomendação de TIMING: **após a auditoria** (junto das demais expansões) — **CONFIRMADO pela Gestora (2026-07-22)**

Motivos: (1) é feature **nova** (expansão), não correção — a auditoria é a prioridade atual;
(2) exige backend real (actions de agregação, índices, filtro de período) e **atenção a custo de
leitura** — o projeto roda no plano **Spark/Hobby** e já teve um apagão de cota por full scan
(`BUG-087`/agenda); um dashboard que agrega muitas coleções por período é exatamente o tipo de
tela que precisa ser desenhada com cuidado de custo; (3) parte das métricas exige **coletar dado
que ainda não é coletado** (séries temporais, custo, erros) — instrumentação nova. Fazer agora,
no meio da auditoria, competiria por foco e arriscaria o custo. **Documentado agora, construído
como primeira grande expansão pós-auditoria.** _(Incrementos de baixo custo podem ser antecipados
— ver Fase 1 — se a Gestora quiser algo já.)_

### Lista final de métricas (Gestora, 2026-07-22) + classificação

Lista enviada pela Gestora, transcrita **verbatim** e classificada por disponibilidade de dado
(mesma legenda: **[REAL]** já existe / **[PARCIAL]** existe em parte / **[COLETAR]** não coletado
hoje). A classificação foi feita por **leitura de código real** (não suposição). Onde o
comportamento em runtime ainda não foi confirmado, o item leva **[HIPÓTESE]** e vira uma checagem
da Fase 0/pré-build.

**Filtros pedidos:**
- Últimos 7 dias / últimos 15 dias / desde o começo do mês atual / período personalizado. **[REAL]**
  (controle client-side; passa `{from,to}` às actions — não é dado, é UI).
- **Comparação entre 2 períodos (período A vs período B).** **[NOVO — requisito arquitetural]** —
  além do filtro de período único previsto no plano. Dobra a superfície de consulta: **barato sobre
  snapshots** (ler duas faixas de `Admin_Metrics_Daily`), **2× custo** se agregado ao vivo. Reforça
  a decisão de fazer a Fase 2 (snapshots) o coração do EXP-01.

**Métricas (18):**

| # | Métrica (verbatim) | Classe | Fonte / observação |
|---|---|---|---|
| 1 | Número de visitantes geral no domínio | **[COLETAR]** | **Sem instrumentação de tráfego** no projeto (nenhuma dep de analytics; sem pageview logging). Subsistema novo (provider ou log próprio). Casável com T-04 (observabilidade). Provisionado no lançamento. |
| 2 | Páginas mais clicadas | **[COLETAR]** | idem #1 — precisa de tracking de navegação. |
| 3 | Serviços mais clicados | **[COLETAR]** | idem #1 — tracking de clique por serviço/CTA. |
| 4 | Número de autenticados | **[REAL]** | contagem da coleção `users` (todos com conta). |
| 5 | Autenticados por tipo de público (clientes gerais / membros / parceiros) | **[PARCIAL]** | `UserRole = visitor\|member\|admin\|suspended` — **não há papel "parceiro"** (parceiros vivem em coleção separada `partners`) nem "cliente geral" explícito. Precisa **decisão de taxonomia** (mapear role↔rótulo) antes do groupBy. |
| 6 | Autenticados por tipo de indicação/fonte | **[PARCIAL]/[COLETAR]** | **[HIPÓTESE]** o `origin` pode existir em `Surveys/welcome_survey.data` (desnormalizado, não estruturado) — exige `collectionGroup` scan; **não há campo de fonte estruturado** no signup. Se a Gestora quiser fonte confiável, é instrumentação nova no cadastro. |
| 7 | 1:1 da área de visitantes — agendados / realizados / cancelados | **[PARCIAL]** | fluxo público em `external-booking.ts` (slots de `Calendar_Events` com "1 to 1"); status mapeia a `EventLifecycleStatus` (`scheduled\|completed\|cancelled\|postponed\|baixado`). Precisa separar **público vs membro** e carimbo de tempo por transição de status. |
| 8 | Propostas de novos horários para 1:1 público | **[PARCIAL]** | existe o fluxo de proposta da equipe (`getTeamProposalNotificationEmail` em `external-booking.ts`); precisa persistir/contar as propostas por período. |
| 9 | Motivos de solicitação de 1:1 público | **[PARCIAL]** | **[HIPÓTESE]** de que o "motivo" é capturado no payload do agendamento público — confirmar o campo antes de prometer. Se não for, é coleta nova. |
| 10 | 1:1 ativos (área de membro) — agendados / realizados / cancelados | **[PARCIAL]** | `bookEventAction`/`User_Bookings` + `EventLifecycleStatus`; mesma questão de carimbo por status do #7. |
| 11 | 1:1 ativos por público (clientes PF / clientes PJ / parceiros) | **[PARCIAL]** | PF/PJ vem de `User_Type` (não do role); "parceiros" de coleção separada — mesma decisão de taxonomia do #5. |
| 12 | Membros por etapa (esperando liberação de etapa / etapa concluída) | **[REAL]** | progresso da jornada (`User_Journey/progress`, `StepStatus = locked\|available\|current\|completed`) — distribuição por etapa é agregável. |
| 13 | NPS geral médio | **[PARCIAL]** | **Atenção de nomenclatura:** o sistema coleta **nota 1-5** (rating de avaliação), **não NPS clássico 0-10** (promotores/detratores). "NPS médio" hoje = média das notas 1-5. Confirmar com a Gestora se quer manter o nome "NPS" ou "Nota média". |
| 14 | NPS geral médio por título de avaliação | **[REAL]/[PARCIAL]** | agrupar as avaliações por título/instrumento; o PR #147 já agrega `content_evaluation_*` (rating 1-5). Estender a demais avaliações = agregação a mais. Mesmo caveat de nome do #13. |
| 15 | Total de vendas realizadas | **[PARCIAL]** | `User_Orders` pagos; depende de **timestamp de pagamento confiável** por período (auditar antes — ver Riscos). |
| 16 | Valor total faturado | **[PARCIAL]** | soma do valor dos pedidos pagos no período; mesmo caveat de timestamp do #15. |
| 17 | Total de cupons de desconto resgatados e aplicados | **[REAL]/[PARCIAL]** | contagem de resgates já existe (coupon-v2, exposto em `/admin/marketing`); "aplicados" (efetivamente usados num pedido) exige ligação cupom↔pedido. |
| 18 | Valor total de cupons de desconto resgatados e aplicados | **[PARCIAL]** | soma do desconto efetivamente aplicado — precisa do vínculo cupom↔pedido (o desconto por pedido). |

**Leitura do escopo dela:** predominam **[PARCIAL]** — não por falta de dado bruto, mas por
**faltar carimbo de tempo confiável** (vendas/faturamento/status de 1:1) e **decisão de taxonomia**
(público PF/PJ/parceiro vs role). Três itens de **tráfego (#1-#3)** e um de **fonte/indicação (#6)**
são **[COLETAR]** puros — instrumentação nova, não agregação. **Nenhum** desses quatro nasce real
no lançamento: entram provisionados com "Aguardando base de dados", como o pedido dela já previa.

**Diferença vs. as candidatas do plano (abaixo):** a lista da Gestora é mais **comercial/tráfego**
e menos "saúde de sistema". As candidatas do plano que ela **não** pediu (produtos ativos, notas
fiscais, cotas concedidas vs consumidas, atividade F&S 24h, saúde/erros) ficam como **oferta
opcional** — proponho na Fase 0 de build, ela inclui se quiser. Os agrupamentos por similaridade
(Comercial / Operacional / Jornada / Marketing / Voz do usuário) seguem valendo como seções.

**Pendências de confirmação com a Gestora antes do build (curtas):**
1. Nome "NPS" vs "Nota média" (o dado é 1-5, não 0-10) — #13/#14.
2. Taxonomia de público (como mapear "clientes gerais / membros / parceiros" e "PF/PJ") — #5/#11.
3. Aceite de que #1-#3 e #6 nascem **provisionados** (tráfego/fonte exigem instrumentação nova).
4. Prioridade da **comparação A vs B** (é o principal driver para começar pela Fase 2/snapshots).

### Viabilidade geral

O projeto **já tem** a maior parte do dado bruto necessário (é questão de **agregar**, não de
criar do zero). O que **falta** é: (a) uma camada de agregação por período com custo controlado;
(b) coleta/instrumentação para as métricas de **série temporal**, **custo de infra** e **erros**.

### Agrupamentos propostos + métricas candidatas

Legenda de disponibilidade do dado:
- **[REAL]** dado já existe, é só agregar.
- **[PARCIAL]** existe em parte / precisa de campo de tempo confiável ou índice.
- **[COLETAR]** não coletado hoje — card entra provisionado com "Aguardando base de dados".

**1. Comercial / Vendas**
- Receita bruta no período — `User_Orders`/pedidos pagos. **[PARCIAL]** (depende de timestamp de pagamento confiável)
- Nº de vendas / pedidos no período. **[PARCIAL]**
- Ticket médio. **[PARCIAL]** (derivado dos dois acima)
- Contratos assinados no período / pendentes de assinatura — `User/{mat}/Contracts`. **[REAL]**
- Notas fiscais emitidas / pendentes. **[REAL]**
- Cupons V2 resgatados / lotes ativos — coupon-v2. **[REAL]** (já exposto em `/admin/marketing`)
- Produtos ativos / arquivados — `products`. **[REAL]** (já no `/admin/products`)

**2. Operacional / Agenda**
- Sessões agendadas no período — `User_Bookings`/`Calendar_Events`. **[REAL]**
- Agendamentos 1:1 da semana. **[REAL]** (já no painel via `getAdminDashboardData`)
- Taxa de ocupação (vagas preenchidas / ofertadas). **[PARCIAL]**
- Cancelamentos / cancelamentos tardios — `User_Booking_History.lateCancellation`. **[REAL]**
- Status/última sincronização da agenda. **[REAL]** (já no painel)
- Atas pendentes / eventos por fechar. **[PARCIAL]**

**3. Jornada / Membros**
- Membros ativos (role=member) / total de usuários por papel — `users`. **[REAL]**
- Novos membros no período. **[PARCIAL]** (precisa timestamp de criação confiável)
- Distribuição por etapa da jornada (quantos em cada BPL-00X) — progress/journey. **[REAL]**
- Conclusões de etapa no período. **[PARCIAL]**
- Selos concedidos / entitlements ativos. **[REAL]**
- Cotas: concedidas vs consumidas — carteira de cotas. **[REAL]** (consumo real depende de `BUG-013`)

**4. Marketing / Conteúdo**
- Cupons V1 ativos. **[REAL]**
- Nota média do conteúdo (1-5) + nº de avaliações. **[REAL]** (feito no PR #147)
- Sugestões de tema recebidas. **[REAL]** (feito no PR #147)
- Posts ativos / em destaque — `SocialPost`. **[REAL]** (já no `/admin/social`)
- QR codes gerados / sincronizados. **[REAL]** (já no `/admin/qrcodes`)

**5. Voz do usuário / Instrumentos (F&S)**
- Respostas totais de surveys/forms no período — `collectionGroup`. **[REAL]** (cuidado de custo)
- Atividade nas últimas 24h. **[REAL]** (já no `/admin/fs`)
- Taxa de conclusão de instrumentos. **[PARCIAL]**

**6. Sistema / Saúde da operação**
- Uso da cota do banco (leituras/escritas). **[COLETAR]** — não instrumentado (relacionado ao T-01)
- Erros em produção. **[COLETAR]** — sem observabilidade hoje (T-04, gap já registrado)
- Última execução de jobs (sync, backups). **[PARCIAL]**

**Minhas adições/ajustes ao pedido:** incluí "Voz do usuário" e "Sistema/Saúde" como seções;
sugiro **não** prometer métricas de custo/erro como reais no lançamento (entram provisionadas até
haver coleta). Sugiro começar pelas **[REAL]** (a maioria) e deixar **[PARCIAL]**/**[COLETAR]**
como cards provisionados — assim o painel nasce útil e honesto.

### Arquitetura proposta (backend + frontend)

- **Filtro de período (client):** controle com presets 5/7/15/30 dias + intervalo personalizado;
  passa um `{ from, to }` para as actions.
- **Backend de agregação:** uma (ou poucas) server action(s) `getAdminKpis(range)` com `requireAdmin`.
  **Ponto crítico de custo:** evitar full `collectionGroup().get()` por card (padrão que já causou
  apagão de cota). Estratégias, em ordem de preferência: (a) **snapshots diários agregados** gravados
  por um job idempotente (cron 1×/dia no limite do plano Hobby — ver Lições 38-40 do `RETROSPECTIVE`)
  numa coleção `Admin_Metrics_Daily`, e o dashboard **lê os snapshots** (barato, rápido, histórico
  pronto para série temporal); (b) queries filtradas por data com **índices** onde o volume for alto;
  (c) full scan só para coleções comprovadamente pequenas. **A opção (a) é a recomendada** — resolve
  custo e habilita gráficos de tendência de brinde.
- **`StatTile` ganha props novas:** `href?` (ícone-link para a página da métrica) e um estado
  `pending?` (renderiza a tag "Aguardando base de dados", tom neutro). Reaproveita o componente atual.
- **Provisionamento:** cada card declara sua fonte; se a fonte não está pronta, renderiza provisionado.

### Esforço / fases

- **Fase 0 — Decisão de escopo:** receber a lista de métricas da Gestora, cruzar com as candidatas,
  fechar os agrupamentos e a lista final. (curto)
- **Fase 1 — Painel + cards [REAL] sem histórico:** filtro de período, `StatTile` com `href`/`pending`,
  seções, e os KPIs que só precisam de agregação simples de coleção pequena. (médio)
- **Fase 2 — Snapshots diários (`Admin_Metrics_Daily`) + cron:** job de agregação idempotente; migra
  os cards [PARCIAL]/pesados para ler snapshot; habilita séries temporais. (médio/grande — é o coração)
- **Fase 3 — Instrumentação dos [COLETAR]:** logging de custo/erros (casável com o T-04 de
  observabilidade) para destravar os cards provisionados. (grande, opcional/faseável)

### Riscos / dependências

- **Custo de leitura no plano Spark/Hobby** (o maior) — mitigado pela abordagem de snapshots.
- **Timestamps confiáveis** em pedidos/criação de usuário para as métricas [PARCIAL] — auditar antes.
- `BUG-013` (consumo de cota ligado ao booking) afeta a precisão da métrica de cotas consumidas.
- Cron do plano Hobby: no máximo 1×/dia (Lição 39) — compatível com snapshot diário.

### Estado

| Etapa | Estado |
|---|---|
| Pedido registrado | **Concluído (2026-07-22)** |
| Lista de métricas da Gestora | **Recebida e classificada (2026-07-22)** — 18 métricas + filtros, ver seção "Lista final de métricas" |
| Análise de viabilidade + agrupamentos + timing | **Concluída** |
| Timing (Fase 1 antecipada vs pós-auditoria) | **Decidido: pós-auditoria (Gestora, 2026-07-22)** |
| **Fase 0 — escopo** | **Concluída (2026-07-22)** — lista mesclada e classificada; restam 4 confirmações curtas com a Gestora (nome "NPS", taxonomia de público, aceite de provisionados, prioridade do A vs B) |
| Execução (Fases 1-3 / build) | **Não iniciada — represada por decisão de timing (pós-auditoria).** Retomar após o fim da auditoria. |
