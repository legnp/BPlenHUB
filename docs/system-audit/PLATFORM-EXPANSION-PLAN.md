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

> **Pendência de entrada:** a Gestora mencionou "vou deixar uma lista de métricas que eu gostaria
> de monitorar", mas **a lista não veio na mensagem**. Solicitar a lista antes de fechar o escopo
> final de métricas — as candidatas abaixo são a proposta inicial (minha análise do que o projeto
> já permite), a serem mescladas com as dela.

### Recomendação de TIMING: **após a auditoria** (junto das demais expansões)

Motivos: (1) é feature **nova** (expansão), não correção — a auditoria é a prioridade atual;
(2) exige backend real (actions de agregação, índices, filtro de período) e **atenção a custo de
leitura** — o projeto roda no plano **Spark/Hobby** e já teve um apagão de cota por full scan
(`BUG-087`/agenda); um dashboard que agrega muitas coleções por período é exatamente o tipo de
tela que precisa ser desenhada com cuidado de custo; (3) parte das métricas exige **coletar dado
que ainda não é coletado** (séries temporais, custo, erros) — instrumentação nova. Fazer agora,
no meio da auditoria, competiria por foco e arriscaria o custo. **Documentado agora, construído
como primeira grande expansão pós-auditoria.** _(Incrementos de baixo custo podem ser antecipados
— ver Fase 1 — se a Gestora quiser algo já.)_

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
| Lista de métricas da Gestora | **Pendente** — não veio na mensagem; solicitar |
| Análise de viabilidade + agrupamentos + timing | **Concluída (proposta inicial acima)** |
| Execução | **Não iniciada** — recomendado pós-auditoria (Fase 1 antecipável se a Gestora quiser) |
