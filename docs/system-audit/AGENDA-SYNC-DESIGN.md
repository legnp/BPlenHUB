# Design — Agenda, Sync e Custo de Leitura (BPlen HUB)

Documento de design da reforma do subsistema de agenda, no padrão de
`CONTRACTS-DESIGN.md` / `ACCESS-MODEL-DESIGN.md`. Escrito depois do **apagão de
cota do Firestore de 2026-07-16/17**, que tirou a produção do ar.

**Aprovação:** etapas 1, 2 e 3 aprovadas pela Gestora em 2026-07-17, com a
projeção explícita de **migrar para o Blaze num futuro próximo** (não agora).

---

## 0. Princípio-guia

**O formato da arquitetura está certo; o encanamento é que está errado.**

O fluxo que a Gestora desenhou — (1) ela configura os eventos no Google
Calendar, (2) o Firestore consome, (3) o usuário consulta o Firestore — é um
padrão legítimo e comum (*read model* / cache de uma fonte externa). Ele entrega
de graça o que seria caro reconstruir: interface que ela já domina, links do
Meet, notas do Gemini, app no celular, lembretes, recorrência.

**Não reescrever a agenda dentro do HUB.** Nenhuma das etapas abaixo muda o
formato: todas trocam o encanamento, preservando o fluxo original.

O que virou "monstro" foram 4 decisões de implementação que, somadas, causaram o
apagão. Este documento trata as 3 primeiras; a 4ª (falha muda) é transversal e
entra junto de cada etapa.

---

## 1. Diagnóstico (medido, não estimado)

Levantado em 2026-07-16/17 por leitura de código + inventário read-only.

### 1.1 O que causou o apagão — `getSyncedEvents` não consulta, BAIXA

`src/actions/calendar-module/queries.ts:79` faz
`db.collection("Calendar_Events").get()` — **a coleção inteira (590 docs)** — e
filtra em JavaScript. Cada chamada custa **590 leituras**.

| Quem chama | Arquivo | O que a tela realmente precisa |
|---|---|---|
| Dashboard admin | `src/app/admin/page.tsx:27` | **1 número** (contagem de "1 to 1" com participantes) |
| Admin agenda | `src/app/admin/agenda/page.tsx:57,79` | eventos da janela visível (2 chamadas: abrir + pós-sync) |
| Admin gestão de agenda | `src/app/admin/gestao-agenda/page.tsx:34` | eventos da janela visível |
| **Jornada do membro** | `src/components/journey/StepRenderer.tsx:94` | as sessões **de uma parada**, numa janela de dias |

**A conta do Spark:** 50.000 leituras/dia ÷ 590 = **~85 aberturas de tela por dia
para o produto inteiro**. O caso mais grave é o `StepRenderer`: **todo membro que
abre uma parada da jornada baixa os 590 eventos** para exibir algumas sessões.

Isto já estava registrado como **`BUG-017`** ("full scans sem paginação"),
classificado como **Médio** no mapeamento inicial. **Estava subestimado** — é o
item que tira o produto do ar. Reclassificado como **Alto** (`BUG-087`).

### 1.2 O sync é uma reimportação total, manual e truncada

`src/actions/calendar-module/sync.ts`:
- **Sem `maxResults` e sem paginação.** O padrão da API do Google é **250**, e
  existe `nextPageToken` — que o sync **nunca lê**. Confirmado contra a agenda
  real: a chamada devolve **250 de 795** eventos, e o último é de **14/08/2026**.
  **Nada depois de 14/08 jamais é sincronizado** (`BUG-088`).
- **A limpeza apaga o que ele não leu.** `googleIds` só contém os 250 lidos, e o
  cleanup deleta todo doc da janela fora desse conjunto — ou seja, o sync
  **remove ativamente** eventos reais mais distantes.
- **Manual.** Não há cron (`vercel.json` não existe; a `/api/trigger-sync` foi
  removida no `BUG-024`). O dado só atualiza quando alguém clica no botão.
- **Janela fixa de 90 dias** para trás/frente a cada execução, sem incremento.

### 1.3 Regra de negócio em texto livre

`Vagas:`, `Orientador:` e `Tema:` são extraídos por **regex da descrição** do
evento (`sync.ts:66-68`). Consequências reais já pagas:
- **42 dos 43** eventos de "Orientação em Grupo" estão em `Tema: "A DEFINIR"`,
  o que mantém 7 paradas sem sessão (nota de dado do `BUG-074`).
- O casamento parada↔evento por palavra do título gerou `BUG-073` e `BUG-074`
  (Alto), e a família toda das Lições 19/30.

### 1.4 Falha muda (transversal)

Todo `catch` devolve `[]` (`external-booking.ts:117-120`, `queries.ts:93-96`).
No apagão isso apareceu no pior formato possível: a cota estourou, o
`getPublicSlotsAction` devolveu `{slots: [], blockers: []}`, e o `/agendar`
exibiu **todos os horários como livres** — inclusive os bloqueados. Sem erro,
sem log visível, sem aviso ao usuário. Lição 30.

---

## 2. Spark vs. Blaze — por que o plano não muda

Decisão da Gestora: **migrar para o Blaze num futuro próximo, não agora.**

O plano abaixo é o mesmo nos dois cenários. O que muda é **a natureza da dor**:

| | Spark (hoje) | Blaze (futuro) |
|---|---|---|
| Full scan de 590 leituras | **derruba a produção** ao bater 50k/dia | **vira conta no fim do mês** |
| Etapa 1 | evita o próximo apagão | evita pagar pelo desperdício |

**Corolário importante:** migrar para o Blaze **sem** a Etapa 1 é levar o
desperdício junto e passar a pagar por ele. A Etapa 1 é o que torna a migração
barata — não o contrário. Nenhuma etapa deve ser adiada "porque o Blaze
resolve", porque o Blaze **não resolve** — só troca indisponibilidade por custo.

---

## 3. Etapa 1 — Parar de baixar a coleção (aprovada)

**Objetivo:** cortar ~95% das leituras. É o que impede o próximo apagão e o que
torna o Blaze barato. Não muda o formato da arquitetura nem a UI.

**Princípio:** cada tela lê **o que precisa**, não a coleção. Duas ferramentas,
ambas **já existentes no projeto**:

1. **Consulta por intervalo** — `where("start", ">=", X).where("start", "<=", Y)`.
   O padrão já é usado em `external-booking.ts:52` e `sync.ts:42`; é só levá-lo
   aos 4 chamadores do `getSyncedEvents`.
2. **Snapshot agregado** — `Datas_Center/Programacao_Registry` **já existe**
   (`post-event.ts:updateGlobalProgramacaoRegistryAction`) e contém a lista
   pronta dos eventos. Ler esse doc = **1 leitura** em vez de 590.

**Mudança por chamador:**

| Chamador | Hoje | Proposta | Leituras |
|---|---|---|---|
| `admin/page.tsx` (dashboard) | 590 | lê o `Programacao_Registry` (só quer 1 número) | 590 → **1** |
| `admin/agenda` | 590 ×2 | consulta por intervalo da janela visível | 590 → ~30-60 |
| `admin/gestao-agenda` | 590 | idem | 590 → ~30-60 |
| `StepRenderer` (membro) | 590 | consulta por intervalo + filtro da parada | 590 → ~30-60 |

**Riscos e travas:**
- `getSyncedEvents` é assinatura compartilhada por 4 telas — mudar a assinatura
  exige mapear os 4 chamadores (Lição 23). A proposta é **adicionar** uma variante
  com intervalo (`getEventsInRange`) e migrar chamador a chamador, mantendo a
  função antiga viva até o último migrar, em vez de trocar tudo num PR.
- O `Programacao_Registry` é escrito por `updateGlobalProgramacaoRegistryAction`,
  chamada no fluxo de booking/post-evento. **Verificar a frescura antes de
  confiar nele** para o dashboard — se estiver defasado, o número mente.
- **Nenhum full scan novo.** O `healProgramacaoMasterAction`
  (`post-event.ts:482`) também lê a coleção inteira, mas é ação **manual e rara**
  de admin — aceitável, documentar em vez de otimizar.

**Critério de aceite:** nenhuma tela de agenda faz leitura proporcional ao
tamanho da coleção; o custo passa a ser proporcional à **janela exibida**.
Medição antes/depois registrada no `LOG.md`.

---

## 4. Etapa 2 — Sync incremental e completo (aprovada)

**Objetivo:** acabar com o teto de 250, com a janela fixa e com o botão manual.

1. **Paginação** — seguir o `nextPageToken` até o fim. Corrige o `BUG-088`
   (nada depois de 14/08 sincroniza) e a limpeza que apaga o que não foi lido.
   *É a correção mínima e independente; pode ir sozinha se as demais demorarem.*
2. **`syncToken` (incremental)** — a API do Google devolve um token que, na
   chamada seguinte, traz **apenas o que mudou** (incluindo cancelamentos, via
   `status: "cancelled"`). Troca "reimportar 795 eventos" por "aplicar 3
   mudanças". Requer guardar o token (ex.: `Datas_Center/Calendar_SyncState`) e
   tratar o caso de token expirado (`410 Gone` → refazer o full sync uma vez).
3. **Automação** — duas opções, a decidir com a Gestora:
   - **(a) Cron** (`vercel.json`), ex. de hora em hora. Simples; o dado fica
     defasado no máximo 1h.
   - **(b) Push notification do Google Calendar** (webhook): o Google avisa o
     sistema quando algo muda; o sync roda em segundos. Mais fiel, mas exige
     endpoint público, renovação periódica do canal e guard de autenticidade —
     e o projeto **já teve um incidente** com rota de sync exposta (`BUG-024`,
     Lição 1). Se for por aqui, o endpoint nasce com validação de token.
   - **Recomendação:** (a) primeiro — resolve 90% da dor com uma fração do risco;
     (b) depois, se a defasagem de 1h incomodar.

**Trava obrigatória:** o `syncToken` só é válido para os **mesmos parâmetros** da
consulta original. Mudar `timeMin`/`timeMax` invalida o token — por isso o sync
incremental normalmente abandona a janela móvel de 90 dias. **Decidir a janela
antes de implementar**, senão o token expira a cada execução e o incremental vira
full sync disfarçado.

---

## 5. Etapa 3 — Metadado estruturado no lugar do regex (aprovada)

**Objetivo:** matar a classe de bug "casar texto livre" (Lições 19, 25, 30).

O Google Calendar tem **`extendedProperties.private`**: pares chave/valor
gravados no próprio evento, **invisíveis na interface** de quem olha o
calendário, e devolvidos pela API. É o lugar correto para:

```
extendedProperties.private = {
  serviceCode: "BPL-004",     // identificador, nao rotulo
  vagas: "5",
  orientador: "Lisandra Lencina",
  tema: "Autoconhecimento e Aprendizagem"
}
```

Com isso, o filtro da jornada casa por **`serviceCode`** — identificador — em vez
de palavra-chave no título, que é o coração do `BUG-073`/`BUG-074` e do
`meeting-keyword.ts`.

**O problema real desta etapa é de operação, não de código:** a Gestora cria os
eventos **na interface do Google Calendar**, que **não expõe**
`extendedProperties`. Ou seja, ela não tem como preencher isso ao criar um evento
recorrente. Opções, a decidir:

- **(a) Manter a descrição como fonte de escrita** e o parser como *tradutor*: o
  sync lê `Tema:` da descrição e grava em `extendedProperties` + no Firestore. Não
  resolve a fragilidade da digitação, mas centraliza o parsing num ponto só.
- **(b) Criar os eventos pelo HUB** (admin cria → o HUB grava no Google com as
  propriedades). Robusto, mas tira dela a interface que ela domina — **contraria
  o Princípio-guia** e provavelmente não vale.
- **(c) Híbrido:** ela segue criando no Google; uma tela de admin "enriquece" o
  evento (escolhe o serviço num select, o sistema grava a propriedade). Preserva
  o fluxo dela e elimina a digitação livre no que é decisão de negócio.
- **Recomendação:** **(c)**, e só depois das etapas 1 e 2 — é a de maior esforço e
  a de menor urgência. **Não implementar antes de decidir isto com a Gestora.**

**Nota:** enquanto a Etapa 3 não existir, os 42 eventos com `Tema: "A DEFINIR"`
seguem sendo ação **de dado** dela, não de código.

**Esclarecimento da Gestora (2026-07-17) — o `Tema:` é intencional, não débito.** O
campo `Tema:` do evento no Google Calendar é o **mecanismo deliberado** com que a
Gestora liga cada evento à etapa correspondente do hub, preenchido de forma
**contínua em produção** (rotina operacional). `"A DEFINIR"` é o estado natural de
um evento ainda não vinculado — não é dado faltante. **Consequência para a Etapa
3:** o redesenho **não pode remover** esse fluxo de autoria no Google Calendar; a
opção (c) híbrida (ela cria no Google, uma tela de admin enriquece com metadado)
é a única compatível com o Princípio-guia. Substituir o `Tema:` por
`extendedProperties` só faz sentido se **preservar** a capacidade dela de
vincular etapa↔evento pela interface do Google que ela já usa.

---

## 6. Ordem, dependências e estado

| Etapa | Estado | Depende de | Paga o quê |
|---|---|---|---|
| 1 — parar o full scan | **Concluída — PR #112** | — | evita o próximo apagão; barateia o Blaze |
| 2a — paginação | **Concluída — PR #113** | — | eventos depois de 14/08 passam a existir |
| 2b — automação (cron diário) | **Concluída — PR #119** | 2a | a agenda deixa de depender do clique manual |
| 2b — `syncToken` (incremental) | **Adiada — sem necessidade no Hobby** | 2a | só valeria para frequência > 1×/dia |
| 3 — metadado estruturado | **Aprovada, a desenhar** | decisão (a/b/c) | mata os bugs de texto livre |

**Etapa 2b concluída (2026-07-17, PR #119) — e o `syncToken` foi ADIADO por dado novo.**
Ao dimensionar a automação, a conta mudou a decisão: o plano da Vercel é **Hobby**, que
limita cron a **1× por dia** (expressões mais frequentes **falham no deploy** — confirmado
na doc oficial). A 1×/dia o custo é **1.947 leituras + 798 escritas = 4% da cota** do Spark;
de hora em hora seria **93%/96%** — outro apagão. Ou seja: **no Hobby o incremental não é
pré-requisito**, é otimização sem problema para resolver. Recomendação anterior ("incremental
primeiro") **revista com base no dado**; o `syncToken` só volta à pauta se houver gatilho
externo (GitHub Actions) ou Vercel Pro.

Entregue: cron `"0 6 * * *"` — **UTC sempre** (doc oficial), logo **03:00 BRT**; escrever
`"0 3"` dispararia meia-noite no Brasil (mesma armadilha do `BUG-093`, pega antes de subir).
Rota `/api/cron/sync-agenda` com `CRON_SECRET` (padrão da Vercel) e **falha fechada**;
alerta por e-mail em falha, porque **a Vercel não repete cron que falhou**. Separado o
resolvedor cru (`runCalendarSync`) do action guarded (Protocolo item 8 — o cron não tem
sessão). **Trava anti-apagão** só no caminho não assistido: aborta antes de escrever se a
deleção passar de 50% da janela. Idempotência verificada (a doc avisa que a entrega pode
duplicar). **Passo manual pendente da Gestora: criar o `CRON_SECRET` na Vercel** — sem ele a
rota recusa (503) e o cron não roda.

**Progresso (2026-07-17):** Etapas 1 e 2a entregues e em produção. A Etapa 1 (PR #112) achou que o
multiplicador real do apagão era `getUserBookingsAction` (8 telas do membro, dashboard 3×), não o
full scan direto; corrigido para leitura por ID (medido: 590→2-5 por membro). A Etapa 2a (PR #113)
paginou o sync (250→801) e, no mesmo PR, tratou os dois acoplamentos que a paginação expôs: o teto
de 500 do `db.batch()` (blocos de 450) e o crescimento da leitura da parada (teto de janela
agendável, 801→190). Falta a Etapa 2b (automação — hoje o sync é manual) e a Etapa 3 (metadado
estruturado, que é o reducer real da leitura da parada e mata os bugs de texto livre).

**Cada etapa entra em PR próprio**, com PROPOSTA antes de codar (área sensível:
agenda/booking toca receita — Lição 23). O `BUG-085` (docs passados acumulados)
**não** entra em nenhuma delas: a correção óbvia é destrutiva (o doc do evento
carrega ata, métricas e `attendees`, e a carreira lê eventos passados por id).

---

## 7. Bugs vinculados

| Bug | Severidade | O quê |
|---|---|---|
| `BUG-017` → `BUG-087` | Médio → **Alto** | full scan em `getSyncedEvents`; 4 chamadores; causa do apagão |
| `BUG-088` | **Alto** | sync lê 250 de 795 eventos, sem paginação; nada depois de 14/08 sincroniza, e a limpeza apaga o que não leu |
| `BUG-089` | Médio | falha muda: `catch → []` faz erro de cota virar "tudo livre" no `/agendar` |
| `BUG-085` | Baixo | docs passados acumulados — **fora** deste plano (correção óbvia é destrutiva) |

---

## 8. Etapa 3 REDESENHADA — slot genérico + significado no HUB

**Origem:** proposta da **Gestora** (2026-07-18). **Substitui** a Etapa 3 original
(seção 5, `extendedProperties`), que foi descartada: ela exigia enriquecer evento
a evento e não resolvia a fragilidade das recorrências. Decisões dela registradas
ao longo desta seção.

### 8.1 Princípio

**Separar o SLOT (quando) do SIGNIFICADO (o quê).**

| Dono | O que ele decide |
|---|---|
| **Google Calendar** | existência do horário, data/hora, duração, cancelamento, recorrência |
| **HUB (admin/Firestore)** | consultor, vagas, temas, quais serviços aquele slot atende |

No Google passam a existir apenas eventos com **títulos genéricos**. Lista fechada
aprovada pela Gestora: **`1 to 1`**, **`Consultoria em Grupo`**, **`Consultoria
Individual`**. O que o membro vê ("Devolutiva de Análise Comportamental") é
resolvido pelo HUB, não digitado no Google.

**Consequência direta:** acaba o parsing de `Vagas:` / `Orientador:` / `Tema:` da
descrição — a classe de bug das Lições 19/30 morre na origem. E a Gestora deixa de
editar eventos recorrentes no Google só para preencher campo, que é o efeito
cascata que ela queria evitar (e que o `BUG-097` comprova ser real).

### 8.2 Regra de atribuição: padrão no TIPO, exceção na OCORRÊNCIA

Decisão da Gestora (confirmada): **atribui-se ao tipo**, não a cada evento.

- **Padrão do tipo** — "Consultoria Individual → Consultor Y, 1 vaga, atende
  [Devolutiva Comportamental, Devolutiva Plano de Carreira]". Toda ocorrência
  herda, **inclusive as futuras**, sem trabalho manual.
- **Exceção por ocorrência** — só onde varia de fato: o **tema** da Consultoria em
  Grupo (cada data tem assunto próprio) e, eventualmente, um **consultor
  substituto** numa data específica.

Por que isso e não por instância: o `BUG-097` provou que **id de instância de
recorrente muda** quando a série é editada. Atribuição por instância evaporaria
junto; atribuição por tipo é imune.

### 8.3 Modelo de dados

**`Calendar_Event_Types`** (coleção nova — a configuração):
```
{
  id: "consultoria-individual",
  googleTitle: "Consultoria Individual",   // casa com o titulo generico no Google
  consultorPadrao: string,                  // Fase 1: texto livre | Fase 2: matricula
  vagasPadrao: number,
  atende: string[]                          // serviceCodes que este slot pode servir
}
```

**`Calendar_Events`** (existente — ganha overrides e o marcador de órfão):
```
  tipoId?: string          // resolvido no sync pelo googleTitle
  overrideConsultor?: string
  overrideVagas?: number
  overrideTema?: string    // o "Tema:" de hoje, agora preenchido no admin
  sourceDeleted?: boolean  // sumiu do Google mas tem inscrito (ver 8.4)
```

**`User_Bookings`** (existente — passa a carregar o rótulo visível):
```
  serviceCode: string      // de qual trilha o membro agendou
  serviceLabel: string     // "Devolutiva de Analise Comportamental"
```

**Por que o rótulo vive no AGENDAMENTO e não no evento:** um slot de grupo tem
mais de uma vaga; dois membros podem agendar por trilhas diferentes, e o evento não
pode ter dois nomes. O nome é uma propriedade da sessão **daquele membro**.

### 8.4 Cenários de falha (as perguntas da Gestora, respondidas)

| Cenário | Hoje | No modelo novo |
|---|---|---|
| **Evento apagado no Google, SEM inscrito** | doc apagado pela limpeza | igual — apaga (correto) |
| **Evento apagado no Google, COM inscrito** | doc apagado; **o agendamento do membro vira fantasma** (`BUG-097`, já ocorreu com o `BP-012`) | **não apaga**: marca `sourceDeleted: true`, preserva o vínculo, e o admin mostra "sumiu do Google" para a Gestora decidir (remarcar / cancelar / avisar) |
| **Série recorrente editada** | ids de instância mudam → antigas somem → cleanup apaga → fantasmas | atribuição vive no **tipo**, não na instância: nada se perde. Instâncias com inscrito caem na regra acima |
| **Data/hora do evento muda** | já funciona: o sync atualiza, e o agendamento aponta por **id**, então acompanha sozinho | igual, **+ e-mail para quem já está inscrito** (decisão da Gestora) |
| **Título genérico não casa com nenhum tipo** | — | evento entra sem `tipoId`; admin lista como "sem tipo atribuído" (fila de trabalho, não silêncio) |

### 8.5 Fases

| Fase | Escopo | Depende de |
|---|---|---|
| **3.1** | `Calendar_Event_Types` + tela de admin (CRUD dos 3 tipos) + `tipoId` resolvido no sync | — |
| **3.2** | Overrides por ocorrência (tema/consultor) na tela de admin | 3.1 |
| **3.3** | Booking passa a gravar `serviceCode`/`serviceLabel`; filtros da jornada param de casar texto | 3.1 |
| **3.4** | `sourceDeleted` + painel de órfãos (fecha o `BUG-097`) + e-mail de mudança de horário | 3.1 |
| **3.5** | Rótulo visível "Orientador" → **"Consultor"** (17 ocorrências, camada visual) | — (independente) |

**Transição:** o mecanismo atual (`meeting-keyword` + `Tema:` parseado) **continua
vivo como fallback** até a 3.3 estar validada em produção. Nenhuma virada de chave
única — os 683 eventos atuais seguem funcionando durante toda a migração.

### 8.6 Pendências registradas (decisões da Gestora)

1. **`BUG-098` — renomear o campo de dado `mentor` → `consultor` + migração.**
   Só o **rótulo visível** vira "Consultor" agora (baixo risco); o campo gravado
   fica, porque renomear exige migrar produção e o histórico de carreira lê
   `mentor`. A Gestora pediu que ficasse **explicitamente no radar da auditoria**.
2. **Fase 2 do Consultor — exige usuário autenticado.** Decisão da Gestora: o
   Consultor **será um usuário da plataforma como os demais** (login/matrícula), e o
   papel é **concedido via admin**. Hoje **não existe** área de consultor — é
   expansão futura do sistema; por ora, **poder atribuir pelo admin basta**.
   Implicação técnica: `UserRole` hoje é `visitor | member | admin | suspended` e o
   único selo é `isProfessional` — o papel "consultor" **não existe** e precisa ser
   criado antes da lista suspensa. Na **Fase 1 o consultor é texto livre**.
3. **`BUG-097`** (agendamento fantasma) é **pré-requisito conceitual** da 3.4 — a
   resposta certa depende deste modelo, por isso ficou aberto aguardando.
