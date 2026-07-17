# Painel de Progresso — Auditoria BPlen (Fase 0 + Tracks associados)

> **Visão de uma olhada** do progresso. **Fonte de verdade:** `BUGS.md` (status de
> cada bug) + `00-PLAN.md` (itens de fase e tracks). Este arquivo apenas **agrega**
> — se divergir da fonte, a fonte vence.
>
> **Manutenção:** atualizado **manualmente a cada PR mergeada** (mesmo checkpoint
> da entrada no `LOG.md`). Bugs novos que aparecerem entram no track certo e a
> contagem se recalcula aqui.
>
> **"Resolvido" = mergeado na `main` OU formalmente aceito como risco/adiado**
> (critério de fechamento de Track definido em `00-PLAN.md`). Correções em PR
> aberta ou bugs simplesmente "Aberto"/"Em Progresso" não contam na %.
>
> **Última atualização:** 2026-07-17 (chat de execução — **apagão de cota + o fuso da política
> (PR #111)**. **O Firestore recusou leituras e a produção ficou degradada**: plano **Spark**, limite
> diário estourado (confirmado pela Gestora no console). Causa medida: **`getSyncedEvents` baixa a
> coleção inteira (590 docs) a cada chamada**, em 4 telas — incluindo a jornada do membro, onde
> **cada parada aberta custa 590 leituras**. São ~85 aberturas de tela por dia para o produto
> inteiro. Registrado como **BUG-087** (reclassificação do BUG-017, que estava como Médio e era a
> causa). Também: **BUG-088** (o sync lê **250 de 795** eventos, sem paginação — nada depois de 14/08
> sincroniza, e a limpeza apaga o que ele não leu; **corrige uma afirmação minha**: o PR #110 entrega
> 36 bloqueios, não 116) e **BUG-089** (o `catch → []` fez o erro de cota virar "todos os horários
> livres" — foi o que a Gestora viu no print das 17:30; o PR #110 está correto, verificado na base).
> **`AGENDA-SYNC-DESIGN.md`** criado com as **etapas 1/2/3 aprovadas**: o formato da arquitetura
> (Calendar como autoria + Firestore como read model) **está certo e não deve ser reescrito** — e
> **migrar para o Blaze sem a Etapa 1 é levar o desperdício junto e pagar por ele**.
> **F1-06 lote A** começou pelo dashboard: **BUG-090** (2 dos 6 atalhos são 404 — o bloco inteiro
> duplica a sidebar, e a duplicata é que apodreceu), **BUG-091** (card "sincronização ok" é string
> fixa: dizia "ok" durante o apagão) e **BUG-092** (métrica "desta semana" conta tudo, sem filtro de
> data). **BUG-093 (PR #111, mergeado e no ar)** — achado por acidente: a suíte rodava no fuso da
> máquina (BRT) e nunca no da produção (UTC), então **2 testes do PR #103 falhavam em produção havia
> semanas**, verdes aqui. A política publicada não era cumprida nas bordas, e das **21:00 às 23:59 a
> janela escorregava um dia inteiro**. Corrigido + **`TZ: 'UTC'` fixado na suíte**; a fonte única do
> PR #103 estava pela metade (o servidor tinha a própria cópia). Suíte **152/152**, mutação de cada
> metade do fix derruba o teste respectivo. **BUG-094** registrado e adiado de propósito.
>
> _(entrada anterior)_ 2026-07-16 (chat de execução — **F1-06 INICIADA: bloqueios de agenda não
> sincronizados (PR #110)**. Plano da fase aprovado pela Gestora: **funcional primeiro, design
> depois**; lotes **A** (users+dashboard) → B (F&S) → C (agenda) → D (produtos) → E (CRUDs) → F
> (ferramentas). O lote C foi **antecipado em parte** por severidade: ela pediu para verificar se os
> eventos "Bloqueado" precisavam ser sincronizados ("se a falta de sincronização não afetar nada, nem
> precisam"). **A hipótese dela estava certa no mecanismo e invertida no diagnóstico** — eles não
> estavam sujando a base, **não chegavam nela**, e a ausência quebrava a agenda pública.
> **BUG-084** (Médio): o sync descartava os bloqueios antes de gravar, e a agenda pública só marca
> ocupado o horário com evento sobreposto em `Calendar_Events`. Medido contra a agenda real: **116
> bloqueios** descartados; **249 dos 756 horários** ofertados na grade de proposta (**32,9%**), em
> **23 de 31 dias**, estavam em cima de um bloqueio. Contido em Médio porque a proposta **não
> agenda** (confirmação manual). Causa-raiz no `fc00c6d` (2026-06-01), que quis limpar a tela do
> admin e aplicou o filtro na leitura (correto) **e no sync** (colateral) — fóssil: os 8 docs de
> bloqueio na base têm `lastSync` **anterior** ao commit. Fix: fonte única
> `src/lib/booking/blocker.ts` (radical normalizado — **fecha o BUG-075**, o typo "Bloquado"),
> campo `isBlocker` gravado no sync, leitores filtrando por campo. **0 dos 70 slots "1 to 1" dela
> são perdidos.** Horário ocupado agora **desaparece** da grade (decisão dela); nenhum dia fica
> vazio (756→507, mínimo 7/dia). **2 colaterais do mapa de consumidores** (Lição 23): **BUG-086**
> (registro global truncava em 500 **antes** de filtrar, com 538 docs) corrigido, e guard no
> `bookEventAction` (`totalCapacity: 0` significava **ilimitado**). **BUG-085** (340 docs passados)
> **adiado com aviso**: a limpeza óbvia é destrutiva — apagaria atas e o título real das sessões no
> histórico de carreira. Validado: **148/148** testes (8 novos; mutação derruba 4), verificação com
> a **função de produção** contra a agenda real, eslint idêntico à `main`, type-check, build.
> Conferência em produção (BUG-030).
>
> _(entrada anterior)_ 2026-07-16 (chat de execução — **Card Perfil & Assessments: Tríade 0%,
> headers e documentos (PR #109)**. PR #108 **validado em produção**. A Gestora reportou que o
> gráfico de Gestão do Tempo do BP-005 plotava **0%** em círculos com valor maior registrado.
> **BUG-082** (Alto): o dado está **correto** (41/29/29) e a action lê o doc certo — o defeito era
> `label.toLowerCase().includes("importan")` contra o rótulo **"Importância"**: o `â` cai dentro do
> trecho buscado e quebra a substring. `"urgência"` idem; só `"circunstância"` casava (acento depois
> do trecho) — exatamente o **0%/0%/29%** do print. O `|| {percentage: 0}` virava zero mudo. **A
> tela do admin passa rótulos sem acento e sempre funcionou**, o que manteve o bug invisível.
> **2º defeito, pior:** o diagnóstico caía no `else` e dizia **"Atenção ao Desperdício"** a quem tem
> "Importância" no topo — o **melhor** resultado. Correção no **casamento**, não nos rótulos (tirar
> o acento seria regressão de copy — Lição 11). Também: card do DISC normalizado no `MiniCard` dos
> demais + tag "Analisado" removida (**BUG-083**), textos ajustados, e **ícone de documentos da
> devolutiva** no topo do card (ata + anexos do agendamento, via `/api/docs`). Validado: **140/140**
> testes (18 novos; mutação reproduz o bug), type-check, build, eslint sem warning novo.
> Conferência em produção (BUG-030).
>
> _(entrada anterior)_ 2026-07-16 (chat de execução — **Clique mudo na 1ª etapa travada
> (PR #108)**. **Fase C validada em produção pela Gestora** — status dos dois paralelos corretos,
> inclusive o MentoCoach com barra de progresso exibindo "Aguardando Fase Anterior". Ela reportou:
> clicar no MentoCoach travado abre o modal, no Posicionamento **não faz nada**. **BUG-081**, dois
> defeitos com a mesma raiz (a UI deduzia a pendência pela POSIÇÃO em vez de usar o motor): (1)
> `if (stageIndex > 0)` antes de abrir o modal — o Posicionamento é índice **0** → return mudo. O
> guard era correto até a Fase C tornar a 1ª etapa travável: a regra nova não quebrou o código,
> quebrou a **premissa** dele. (2) O modal mostrava "a etapa anterior" por posição, escondendo o
> Plano de Carreira nas pendências do MentoCoach. O motor **sempre** calculou `pendentes` — a UI
> descartava. Fix: `pendentes` na telemetria, modal **abre sempre**, resolução em função pura,
> modal plural-aware. Validado: test **122/122**, type-check, build, eslint sem warning novo.
> Conferência em produção (BUG-030).
>
> _(entrada anterior)_ 2026-07-16 (chat de execução — **Fase C: liberação relativa ao pacote
> (PRs #105/#106/#107 + sync)**. Regra da Gestora: Posicionamento (BPL-001) e MentoCoach (BPL-005)
> só liberam após a última etapa da trilha que o membro contratou; comprados avulsos, liberam de
> imediato; a exceção é do admin. **A lista de pré-requisitos não cabia na planilha** (varia por
> pacote), então o dado declara o **MODO** (`apos_contratadas`) e o **adaptador** resolve a lista em
> runtime — o **motor não muda** (segue puro, 3 modos; a fronteira é enforced pelo compilador).
> Conjunto de espera derivado **sem nenhum serviceCode hardcoded**; a exclusão "etapa que cita um
> paralelo" remove o Offboarding automaticamente, evitando deadlock. **PR #105 — BUG-079** (Alto): a
> escrita do progresso normalizava a chave e a leitura não; BP-005/BP-011 têm `plano_de_Carreira` e
> **nunca teriam a conclusão reconhecida** — travaria o GDC para sempre e mataria a Fase C em
> silêncio. **PR #106 — BUG-080**: rótulos mentiam (progresso mascarava a trava; "Não Liberado" no
> Posicionamento liberado) — sem isso a regra seria invisível na tela. **Sync de produção**
> (backup `products_backup_20260716191318`). **BP-002** estava com 10 paradas feitas no
> Posicionamento e seria expulso: levado à Gestora ANTES do merge, ela manteve a regra e concedeu a
> **dispensa de BPL-001** (verificado pós-sync: LIBERADO). Verificação final contra a produção com o
> adaptador compilado: BP-005/BP-011 → `SEQUENCE_LOCK` pendentes `[BPL-003, BPL-004]`. Validado:
> test **112/112**, type-check, build, eslint 0. Conferência visual em produção (BUG-030).
>
> _(entrada anterior)_ 2026-07-16 (chat de execução — **IDs de parada colapsados + nomes dos
> cards (PR #104 + sync de produção)**. PRs #102/#103 **validados e aprovados em produção**. Uma
> **dúvida** da Gestora sobre o nome dos cards da `visao_geral` expôs um **Alto fora do escopo**:
> **BUG-077** — o `journey.ts` descartava o `deliverySteps[].id` do dado e recalculava
> `ss-{type}-{referenceId}`, colapsando num id só todas as paradas que repetem o mesmo
> `referenceId`. Como a conclusão é gravada por id, **simulação contra o dado real provou que
> concluir só a 1ª Sessão de MentoCoach marcava as 10**, e clicar na 5ª abria a 1ª — o serviço
> ficava inconcluível. O parser já remendava isso, mas **só para BPL-004** (hardcode) e de forma
> **inócua**, pois o motor descartava o sufixo. **BUG-078** (Baixo): cards repetidos — corrigido no
> **dado** (planilha), não no código: as 5 primeiras paradas têm título idêntico e só a descrição as
> distingue, então usar o título quebraria 5. **PR #104:** `journey.ts` honra o id do dado; parser
> generaliza o sufixo + trava que falha alto; payload regenerado; 5 testes. **Sync rodado na
> produção** (backup `products_backup_20260716180234`). **Zero migração** (verificado: nenhum
> usuário tinha conclusão nos ids duplicados). Inventário read-only **reexecutado pós-sync** (Lição
> 16): 7/7 produtos com ids únicos, modelo de acesso intacto, simulação devolvendo 1 de 10.
> Validado: test **84/84**, type-check, build, eslint 0. Conferência em produção (BUG-030).
>
> _(entrada anterior)_ 2026-07-16 (chat de execução — **Política de agendamento: texto, regras e
> layout (PRs #102/#103)**. PR #101 **validado e aprovado em produção**. A Gestora pediu para
> reescrever o card "Política de Agendamento" — auditar antes de redigir revelou que **nenhuma das 4
> regras anunciadas era cumprida** (**BUG-076**, Alto): a janela de 20 dias só valia para
> "onboarding" (os demais apareciam com até 90 dias); o limite semanal fazia o **oposto** do
> pretendido (qualquer agendamento trancava a semana inteira, impedindo devolutiva + 1 to 1 juntos);
> o prazo de 24h **não existia**; e **nada era validado no servidor**. **PR #103:** texto único
> aprovado (opção B, enquadramento positivo), texto duplicado do modal 1 to 1 aposentado, as 4
> regras corrigidas e validadas no servidor, nova fonte única `src/lib/booking/policy.ts` chamada
> por cliente **e** servidor. Funil de lead público preservado de propósito (roda com janela de 33
> dias — aplicar 20 globalmente quebraria receita). **PR #102:** redesign dos cards de horário —
> corte no hover resolvido (`scale` dentro de container com overflow), card **~124px → ~88px**
> (3 → 4-5 horários visíveis), texto unificado em 11px, "1 VAGAS"→"1 vaga", "31 De Julho"→"31 de
> julho". Validado: **79/79** testes (20 novos; mutação das 3 regras centrais quebra o teste certo),
> eslint sem warning novo, type-check, build. **Dependência aberta:** "preservam o crédito" é
> manual hoje — o débito ao agendar (**BUG-013**) nunca foi ligado; o rastro ficou pronto.
> Conferência em produção (BUG-030).
>
> _(entrada anterior)_ 2026-07-16 (chat de execução — **MentoCoach invisível na agenda do membro
> (PR #101)**: a Gestora reportou que os eventos "MentoCoach" sincronizados não ficavam disponíveis.
> Inventário read-only na base real provou que **o sync estava correto** (25 eventos gravados) — o
> defeito era o filtro `getMeetingFilterKeyword`, **sem regra para mentocoach** (a regra "coaching"
> não pega "mentocoach"), caindo num fallback que nunca casa: **0 eventos nas 10 paradas**
> (**BUG-073**, Alto). A investigação achou um 2º Alto fora do escopo (**BUG-074**): o título
> sequestrava o filtro e 2 paradas de grupo listavam sessões de **outro serviço**, agendáveis
> ("Gestão Comportamental"→111 Devolutivas; "Finanças para Carreira"→93 Planos). Fix: regra
> mentocoach + `referenceId` com precedência sobre o título; helper extraído para
> `src/lib/journey/meeting-keyword.ts` com **7 testes** (mutação das 2 regras centrais quebra o
> teste certo). Verificado com a função de produção contra os 538 eventos reais: MentoCoach
> **0→25**, as 2 paradas erradas **111→0** e **93→0**, demais inalteradas. Validado por eslint/test
> **59/59**/type-check/build. **BUG-075** (typo "Bloquado" escapa do filtro de bloqueio, Baixo)
> registrado/Aberto. Achados de dado p/ a Gestora: 42 dos 43 eventos de grupo com `Tema: "A DEFINIR"`
> (trava as 7 paradas restantes) e nenhum evento de Offboarding. Conferência em produção (BUG-030).
>
> _(entrada anterior)_ 2026-07-16 (chat de execução — **Afinamento de design da home do hub
> (PR #100)** — **validado e aprovado em produção pela Gestora**: proposta aprovada pela Gestora e implementada em `HubHomeView.tsx`. Reduzido o ar
> vertical das 3 seções internas (Últimos Conteúdos, Suas atividades no HUB, Pulso da Comunidade)
> sem tocar tipografia, header, footer, menu, foto ou `MemberJourneyHero`: ritmo entre seções
> `space-y-32`→`space-y-14`, grid `gap-20`→`gap-10`, `ActivityCard` `h-44`→`h-36`, Pulso `py-24`→
> `py-10` e card `p-10`→`p-6`. Ganho ~400–450px de scroll. Limpeza junto: ~20 imports mortos + a
> função morta `ToolPlaceholderIcon` removidos (ESLint do arquivo: ~20 warnings → 0), acentos
> PT-BR restaurados em 4 strings (Lição 11) e emojis removidos dos comentários (Zero Emoji).
> Validado por eslint/test 52/52/type-check/build. Sem novos bugs. Conferência visual em produção
> (BUG-030). **Próximo grande item: F1-06** (19 páginas de admin), com BUG-072 na fila.
>
> _(entrada anterior)_ 2026-07-15 (chat de execução — **Feedback do pacote profile_settings:
> causa-raiz + fixes (PRs #92–#94)**: a Gestora aprovou 1/2/4 mas o bidirecional survey↔perfil
> não funcionava. **Causa-raiz (BUG-070):** o perfil lia/gravava `results/check_in` (doc órfão),
> mas a survey real vive em `Surveys/check_in.data` — corrigido (PR #92). **BUG-071:** CV/portfólio
> "Visível Network" era de enfeite (URL nunca gravada onde o networking lê; card não renderizava) —
> agora abre via proxy `/api/docs` com opt-in do dono (PR #93). **Incremento:** "Ver documento
> anexado" no FileField (PR #94). **BUG-072** ([object Object] no admin) adiado p/ F1-06. Parecer:
> não desmembrar a survey (o problema era o descasamento de coleção). Validação em produção (BUG-030).
>
> _(entrada anterior)_ 2026-07-15 (chat de execução — **Ajustes gerais da página
> `profile_settings` (PRs #88–#91)**: pacote grande da aba Perfil & Configurações (F1-05).
> **PR1** copy + `.no-scrollbar` (utility inerte → barra no seletor de abas) + "Apelido"/"Não
> definido". **PR2** redesign da aba Perfil Profissional (privacidade minimalista + fix markdown,
> 3 seções Networking/Histórico/Remuneração, toggle Banco de Talentos no header com auto-save,
> campo "Nome para exibição", copy). **PR3** edição por seção + pop-up de alterações não salvas
> (troca de aba + `beforeunload`). **PR4** prefill bidirecional da survey de check-in (self-fetch
> no `SurveyEngine`, whitelist). Diagnósticos: "Nome de Usuário"=nickname (fallback corrigido);
> survey↔profile agora bidirecional na UI. Validação em produção (BUG-030).
>
> _(entrada anterior)_ 2026-07-14 (chat de execução — **Pacote 5 validado + redesign do menu
> sanduíche do hub (PR #87)**: **Pacote 5 aprovado em produção** (Gestão de Carreira, design +
> funcionais) — lote de feedback F1-04/F1-05 (pacotes 1–6) 100% validado. **Menu sanduíche**
> (`HubHeader`) reorganizado em seções (Geral / Jornada de Membro / Networking / Gestão da Conta),
> título "Área de Membro"→"BPlen HUB", matrícula discreta entre nome e nickname, ícones sociais
> em uma linha, "Sair" como último item, "Agendar 1 to 1" abre o modal (opção A), "Conexão
> Digital"→"Social Media". Validação visual em produção (BUG-030).
>
> _(entrada anterior)_ 2026-07-14 (chat de execução — **Pacote 5: redesign da Gestão de
> Carreira (PRs #85/#86)** — fecha o lote de feedback F1-04/F1-05 (pacotes 1–6). **5A (design,
> PR #85):** 4 seções discretas (Resultados / Progressão Geral / Progressão da Carreira /
> Histórico da Jornada); Jornada mais estreita com **checkpoints recolhíveis**; 1-to-1 mais
> largo com **histórico de sessões à direita** do indicador; Backlog/Metas com larguras iguais;
> os 3 históricos (Feedbacks/Atas/Docs) foram para o fim, **3 lado a lado**; cards compactos;
> copy 5.7 "Plataforma de Desenvolvimento"→"Gestão de Jornada". **5B (funcionais, PR #86):**
> **item 8.2** — feedback exibe o Orientador do evento (`mentor`) + migração `migrate-feedback-
> authors.js`; **item 9** — `completedAt` dos objetivos ao entrar em "Alcançado" (+ exibição
> "Concluído em"). Validação em produção (BUG-030); migração a rodar pela Gestora.
>
> _(entrada anterior)_ 2026-07-14 (chat de execução — **Pacote 4 validado + Pacote 6:
> redesign do Networking (PR #84)**: **Pacote 4 aprovado em produção** pela Gestora ("está
> perfeito"). **Pacote 6** (`/hub/networking`) redesenhado — **abas ao lado da barra de busca**
> (funde a linha de abas isolada e a caixa de filtros gigante numa única barra de controle),
> **aviso de rodapé** virou tira fina discreta, e copy: eyebrow "Conexões Soberanas"→"Conexões
> de Valor", título "Ecossistema BPlen"→"Networking BPlen", aviso "Soberania & Visibilidade"→
> "Autonomia de Visibilidade", abas (opção A) "Membros / Profissionais / Parceiros". Validação
> visual em produção (BUG-030). **Próximo:** Pacote 5 (Gestão de Carreira, o maior).
>
> _(entrada anterior)_ 2026-07-14 (chat de execução — **Lote de feedback F1-04/F1-05 por
> PACOTES — Pacote 4: redesign da Gestão de Agenda (PR #83)**: `/hub/membro/gestao_agenda`
> redesenhada — header interno duplicado removido, botão "Agendar 1 to 1" movido para o header
> da página via novo slot reutilizável `action` no `FunctionalPageHeader`, box-in-box da lista
> achatado, e novo modo `embedded` no `AgendaManagementView` (compartilhado) que deixa o admin
> **idêntico** e move o controle do modal 1-to-1 para o pai. Validação visual em produção (BUG-030).
> _Contexto do lote (não logados aqui antes):_ Pacote 1 (segurança+bugs — BUG-066 e-mail Master
> confidencial + BUG-067/068/069 networking, PR #80), Pacote 2 (regras globais — CLAUDE.md 6/7/8:
> infra invisível + identidade confidencial + loading padronizado, PR #81), Pacote 3 (refino dos
> cards de Contratos, PR #82).
>
> _(entrada anterior)_ 2026-07-11 (chat de execução — **F1-05 código completo — headers
> Gestão Funcional (PR #78)**: a Gestora definiu que `profile_settings` e `networking` seguem o
> conceito Gestão Funcional; seus headers foram migrados para o `FunctionalPageHeader` (F2-05).
> Com os gated do PR #77 (BUG-033 privacidade + BUG-016 cota) e este, a **F1-05 fica com o código
> completo** — pendente só a validação visual da Gestora em produção.
>
> _(entrada anterior)_ 2026-07-11 (chat de execução — **F1-05 iniciada — gated resolvidos
> (PR #77)**: revisão de código das 4 páginas (checkout membro, networking, perfil, entrega).
> **BUG-033** (privacidade do networking: o servidor só envia contatos/CV/portfólio quando o
> dono marcou como visível — antes os valores ocultos trafegavam; + removido o filtro por
> estágio que lia `User_JourneyMap` morto) e **BUG-016** (entrega lê o `used` real da carteira,
> não mais 0). Back-buttons → "Voltar". Pendente: validação em produção + F2-05 dos headers de
> perfil/networking.
>
> _(entrada anterior)_ 2026-07-11 (chat de execução — **F1-04 código completo — PR2 design
> (PR #74)**: headers de `visao_geral`/`gestao_agenda`/`gestao_carreira` migrados para o
> `FunctionalPageHeader` (Gestão Funcional / F2-05); modal da `visao_geral` padronizado no
> `GlassModal` (BUG-063/064); link "Visão Geral" adicionado ao menu sanduíche do hub. Com o PR1
> (copy) e o PR2 (design), a **F1-04 fica com o código completo** — pendente só a validação
> visual da Gestora em produção (BUG-030).
>
> _(entrada anterior)_ 2026-07-11 (chat de execução — **F1-04 iniciada — PR1 copy (PR #73)**:
> revisão das 4 páginas (carreira, agenda, contratos, visão geral). `contratos` já compliant
> (CT-4). PR1 restaurou os acentos PT-BR de `visao_geral` e `gestao_carreira` (BUG-062, L11/F0-06).
> Decisão da Gestora: `visao_geral` fica em `/hub` (só login — serve a todos os clientes, com
> lógica por serviço ativo) + incluir link p/ ela no menu sanduíche. Falta o **PR2 (design)**:
> header canônico (`FunctionalPageHeader`) nas 3 páginas, modal da `visao_geral` no `GlassModal`,
> e o link no menu.
>
> _(entrada anterior)_ 2026-07-11 (chat de execução — **F1-03 FECHADA**: a Gestora
> reconferiu e **aprovou os 3 ajustes** do PR #72 (BUG-059/060/061). Com o motor de jornada,
> Sequence Lock/Upsell Gate e todos os modais da nav validados, a **F1-03 (dashboard + motor de
> jornada) está concluída**. Próxima frente logada: F1-04 (carreira, agenda, contratos, visão geral).
>
> _(entrada anterior)_ 2026-07-11 (chat de execução — **F1-03 validada + modais da nav
> padronizados (PR #72)**: a Gestora validou em produção o dashboard/nav/Sequence Lock/Upsell
> Gate e o modal de offboarding (aprovados). Ajustes de UI: onboarding bloqueado passa ao gate
> reutilizável no padrão do offboarding (sem foto/upsell, **BUG-059**), upsell deixa de expor
> nomes técnicos dos checkpoints (**BUG-060**), e o modal de detalhe do serviço vai para o
> `GlassModal` canônico com conteúdo em grid de 2 colunas descrição|workflow (**BUG-061**).
> Fonte de conteúdo única inalterada (`product.sheet`/`product.workflow`).
>
> _(entrada anterior)_ 2026-07-11 (chat de execução — **BUG-001 fechado 100% + T-06
> completo**: a Gestora concluiu os passos manuais do BUG-001 — `firestore.rules` publicado
> no Console e a coleção raiz de teste `Support_Tickets` apagada. Com isso o **T-06
> (Compliance técnico) fecha em 2/2 (100%)**. Nenhum bug de compliance aberto.
>
> _(entrada anterior)_ 2026-07-11 (chat de execução — **BUG-008 corrigido — chave de
> cota 1-to-1 unificada (PR #71)**: o gravador `updateMemberQuotasAction` forçava UPPERCASE
> (`1-TO-1`) enquanto o catálogo e o modal de agendamento usam `1-to-1` — saldo aparecia
> nulo e a mesma cota duplicava em dois cases. Chave canônica = minúsculo; novo
> `src/lib/quota-keys.ts` (fold com merge total=maior/used=soma); gravador auto-cura o drift
> via `update()` (não `set(merge:true)`, L16); leitores tolerantes. Migração
> `scripts/normalize-quota-keys.js` (dry-run + backup) a rodar pela Gestora. **Último Alto
> aberto fechado — triagem por severidade vazia (0 Crítico / 0 Alto).**
>
> _(entrada anterior)_ 2026-07-11 (chat de execução — **Acabamento de UX de checkout/
> contratos (PR #67)**: ajustes de copy revisados pela Gestora, preços em BRL "x.xxx,xx"
> (novo `formatBRL`), checkout normalizado ao padrão Gestão Funcional (F2-05), info do
> serviço formatada, suporte no WhatsApp nos erros, e correção da alegação "dados
> criptografados" (a app não criptografa a nível de campo — só at-rest/HTTPS/acesso).
> `SUPPORT_WHATSAPP_URL` centralizado.
>
> _(entrada anterior)_ 2026-07-10 (chat de execução — **BUG-055 aposentado + auditoria de
> acesso por-serviço (PR #66)**: o requisito (Gestora) é travar o **acesso ao serviço**, não o
> HUB — e essa trava **já existe** e ficou consistente com o gate de liberação (PR #60): o
> entitlement só é concedido após pago+assinado, e as superfícies de entrega (`/hub/servicos/
> [slug]`, `/hub/journey/[stepId]`) bloqueiam sem entitlement. Auditoria: sem porta dos fundos.
> O portão morto (`ContractGateModal`/`getPendingContracts`, inerte e abordagem errada) foi
> removido. **F1-02 sem bloqueadores de código** — resta validação em produção + CT-3c/CT-5.
>
> _(entrada anterior)_ 2026-07-10 (chat de execução — **CT-4 painel de contratos reescrito +
> nota fiscal (PRs #63/#64)**: `/hub/membro/contratos` reescrito no padrão Gestão Funcional —
> 1 card por serviço (une pedidos+contratos), **status real de assinatura**, carimbo resumido,
> **documento visualizável no HUB** via `/api/docs`, CTA por estado, rota morta corrigida.
> Nota fiscal: exibição no painel + **upload pelo admin**. Fecha **BUG-052** e **BUG-053**.
> CT-4 completo; restam CT-3c, CT-5 e a validação em produção.
>
> _(entrada anterior)_ 2026-07-10 (chat de execução — **CT-3b.2 geolocalização por IP no
> carimbo (PR #62)**: o carimbo do contrato ganha "Local aproximado (por IP)" + coordenadas,
> via headers de edge da Vercel (sem serviço externo, não invasivo); `geo` gravado na
> assinatura/Legal_Audits. IP já era real.
>
> _(entrada anterior)_ 2026-07-10 (chat de execução — **CT-3b.2 status real na tela de
> sucesso (PR #61)**: corrigida a tag "Serviço Liberado" + "já disponível" que apareciam
> **hardcoded** antes da assinatura, contradizendo o gate — agora o status é dinâmico
> (Aguardando Pagamento -> Aguardando Assinatura -> Serviço Liberado) e a faixa do grátis
> diz "liberado após a assinatura". IP no PDF confirmado real; geo por headers de edge da
> Vercel viável como adição futura.
>
> _(entrada anterior)_ 2026-07-10 (chat de execução — **CT-3b.2 carimbo + gate de
> liberação (PRs #59/#60)**: (#59) o PDF passa a ser **estampado** com data/hora, IP,
> **código único de verificação** (amarrando serviço + pedido + pagamento MP) e hash;
> (#60) **regra de liberação** — o serviço só é liberado com **pagamento aprovado E
> contrato assinado** (helper idempotente `maybeReleaseService` no webhook MP e nas
> assinaturas); fluxo **grátis vai direto** à formalização (sem checkbox redundante);
> **avulso libera ao assinar**. Concessão (selo/cotas/cupom) migra do webhook/ativação
> para a assinatura. Risco: quem paga e não assina fica sem o serviço → estado "aguardando
> assinatura" a destacar no painel (CT-4). Validação dos 3 fluxos em produção.
>
> _(entrada anterior)_ 2026-07-10 (chat de execução — **CT-3b.2 correção de UX + padrão
> Gestão Funcional (PR #58, `BUG-056`)**: a Gestora validou a CT-3b.2 e reportou defeitos —
> grátis divergia do pago (parecia "só checkbox"), CTAs de navegação apareciam antes da
> assinatura, e telas de contrato/checkout não herdavam o tema (cores hardcoded). Corrigido:
> componente de assinatura **unificado** grátis/pago, CTAs só após assinar (`PaymentStatus`
> ganhou `showActions`), migração para **theme vars** + novo header canônico
> `FunctionalPageHeader` (padrão **Gestão Funcional**). Novo item **F2-05** — categorização
> das páginas logadas nos 4 conceitos (Fullscreen/Journey/Gestão Funcional/Autênticas) +
> padrão de design por conceito (conceitos definidos; aplicado a contrato/checkout, demais
> pendentes). Logado em produção.
>
> _(entrada anterior)_ 2026-07-10 (chat de execução — **Contratos CT-3b.2 (PR #57)**:
> assinatura de contrato **pós-checkout** (grátis E pago) na tela `/hub/checkout/success`,
> keyed por `orderId`. Novo `ContractDocumentView` (cláusulas, extraído do avulso e
> compartilhado) + `CheckoutContractSigning` (ilha cliente) + actions
> `resolveCheckoutContractAction`/`signCheckoutContractAction` (`requireMatricula` + trava
> de dono). Reusa `buildContractClauses`/`ContractTermsCheckboxes`/`generateContractPdf`
> (origin "checkout"). Pago assina só após `approved`; **convite forte, não bloqueio**.
> Restam: CT-3c (área /hub/legal + audiências), CT-4 (painel), CT-5 (jurídico). Logado em produção.
>
> _(entrada anterior)_ 2026-07-10 (chat de execução — **Contratos CT-3a/CT-3b.1 (PRs #55/#56)**:
> contrato visível antes de assinar via fonte única `buildContractClauses`; rename
> retroativo→avulso; `ContractTermsCheckboxes` configurável reutilizável).
>
> _(entrada anterior)_ 2026-07-09 (chat de execução — **Contratos CT-2 (PR #51)**:
> retroativo robusto — link **único de uso único** (`_ContractTokens`, expira 30d, consumido
> na assinatura) **vinculado à conta** (matrícula do token === sessão) + **aviso de
> duplicidade** no admin (retificação). Rota `[slug]`→`[token]`, página reescrita, admin
> "Gerar link". Fecha **BUG-022**. BREAKING: links genéricos antigos param de funcionar.
> Restam: CT-3 (viewer), CT-4 (painel), CT-5 (jurídico). Validação logada em produção.
>
> _(entrada anterior)_ 2026-07-09 (chat de execução — **Contratos CT-1 (PR #50)**:
> entidade de contrato de 1ª classe (`User/{matricula}/Contracts`) com ciclo de status
> (pendente_assinatura/em_retificação/assinado/cancelado) + **IP real** capturado na
> assinatura (fecha a parte IP do BUG-054, item f). `generateContractPdf` grava a entidade
> + origin; `Legal_Audits` transitório. Próximas: CT-2 (retroativo robusto), CT-3 (viewer),
> CT-4 (painel). Validação em produção (BUG-030).
>
> _(entrada anterior)_ 2026-07-09 (chat de execução — **Contratos CT-0 (PR #49)**:
> geração do PDF do contrato corrigida — `generateContractPdf` resolve a matrícula
> (`_AuthMap`) e lê `products`/`User_Orders`/`profile` corretos. **BUG-051 confirmado em
> produção** antes do fix e agora fechado. Roadmap CT-0→CT-5 aprovado (`CONTRACTS-DESIGN.md`).
> Próximas: CT-1 (entidade+status+IP), CT-2 (retroativo robusto), CT-3 (viewer), CT-4 (painel).
>
> _(entrada anterior)_ 2026-07-09 (chat de execução — **F1-02 iniciada**:
> BUG-002 corrigido (PR #48 — trava de preço server-side + remoção da rota órfã
> `/checkout/[slug]`). O contrato retroativo (BUG-022) foi expandido pela Gestora para
> um **redesenho do subsistema de contratos** (itens a–f) — investigação revelou
> fragmentação/quebra estrutural (PDF lê coleção errada `BUG-051`, gate lê subcoleção
> morta `BUG-055`, documento não visualizável `BUG-052`, painel básico `BUG-053`, IP
> placeholder `BUG-054`). Design + plano faseado CT-0→CT-5 em novo `CONTRACTS-DESIGN.md`,
> aguardando aprovação. Validação de todo o universo em produção (BUG-030).
>
> _(entrada anterior)_ 2026-07-09 (chat de execução — **Regra global de tema dos
> modais (itens 19+20, PR #47)**: modal adapta o overlay/cor ao tema da tela que o
> chama. `GlassModal` detecta o tema via âncora e reaplica ao portal (para antes do
> `body` p/ ignorar o tema stale do usuário); nova var `--modal-backdrop`;
> `ServiceSelectionModal` convertido p/ vars. Resolve o item 19 (painel branco no
> fundo preto — causa era o painel, não o backdrop). Validado ao vivo + aprovado pela
> Gestora. **F1-01 fechado** (19 ajustes + refino #46 + regra global #47).
>
> _(entrada anterior)_ 2026-07-09 (chat de execução — **F1-01 item 11
> (/agendar) reaberto e refinado**: PR #46 — caixa de ícone como as páginas de
> produto, header alinhado ao topo (`pt-12`, ícone em `top:48px` = padrão /servicos)
> e remoção da barra de rolagem feia do card. Aprovado no preview pela Gestora.
>
> _(entrada anterior)_ 2026-07-08 (chat de execução — **TRILHA 3 (HIGIENE)
> COMPLETA**: 3d (backups: fonte em namespace + 47 coleções legadas apagadas), 3b
> (chaves dos 4 clientes normalizadas; Embaixadores com jornada total; `career_planning`
> preservado como capability viva), 3c (14 produtos arquivados excluídos → `products`
> = 12 ativos). Todos os passos com script LOCAL dry-run + export + OK. Design §2.4
> novo: separação Serviço/Feature/Gatilho (clarificação da Gestora). Restam: Fase E
> (elegibilidade) e Trilha 4 (nomenclatura DISC).
>
> _(entrada anterior)_ 2026-07-08 (chat de execução — **FASE D MERGEADA (PR #37):
> BUG-035 RESOLVIDO.** `hub/membro/layout.tsx` exige o selo no servidor para toda a
> subárvore; bypass `isAdmin ||` removido (índice + hero). Revogar o selo expulsa o
> cliente do clube na próxima navegação. Reestruturação do modelo de acesso
> **completa** (A0→A3, B1→B2, C, D + 2 PRs de dados + Sync). Também mergeado o PR #36
> (revisão da Gestora: onboarding como pré-req; 1ª mudança de regra 100% por dado).
> Restam da trilha: Trilha 3 (higiene), Fase E (elegibilidade), Trilha 4 (DISC).
>
> _(entrada anterior)_ 2026-07-08 (chat de execução — **Sync executada pela
> Gestora** (12 produtos com atributos; A2 ativo) + **Fase B2 mergeada** (PR #35):
> o motor `resolverAcesso` assume a decisão de acesso/trava da jornada via
> adaptador leniente no `useJourney`; trava linear hardcoded vira fallback só
> para etapa sem atributos. Registrados **BUG-047** (painel admin não exibe os
> atributos novos) e nota no BUG-041 (limpeza deve refletir no painel). Falta a
> **Fase D** para fechar o BUG-035.
>
> _(entrada anterior)_ 2026-07-08 (chat de execução — **Fase C mergeada** (PR #33):
> checkout reposicionado para `/hub/checkout/*` e journey para `/hub/journey/*`, com
> stubs de redirect (preservando query) em todos os paths antigos — e-mails, back_urls
> do MP em voo e tour continuam funcionando. Junior → `/hub/journey/posicionamento-
> profissional`. **A Sync do portfólio está destravada** (ativa o A2). Registrado
> **BUG-046** (links de e-mail do booking para rota inexistente, não corrigido aqui).
>
> _(entrada anterior)_ 2026-07-08 (chat de execução — **Fase B / B1 mergeada**
> (PR #32): motor puro `resolverAcesso` + 27 testes Vitest, sem consumidor. Achado e
> corrigido no mesmo PR o **BUG-045**: `npm run test` estava **vermelho na `main`**
> desde o PR #19 (mock sem `requireMatricula`) — a suíte volta a **39/39**.
> Sequenciamento da Fase B corrigido para **B1 → C → Sync → B2 + D**.
>
> _(entrada anterior)_ 2026-07-08 (chat de execução — **Fase A / A3 mergeada**
> (PR #31): botão admin de dispensa de pré-requisito na aba "Assessments /
> Devolutivas" de `admin/users`; etapas derivadas dos produtos (sem hardcode) e
> cada `serviceCode` validado contra o catálogo no servidor. Campo gravado sem
> consumidor — quem lê é o motor da Fase B. **Fase A concluída (A0→A3).**
>
> _(entrada anterior)_ 2026-07-08 (chat de execução — **Fase A / A2 mergeada**
> (PR #30): `grantServiceEntitlement` concede `member_area_access` só se o produto
> não declarar `concedeSelo: false`. **Merge behavior-neutral** — nenhum produto tem
> o campo no Firestore ainda; o comportamento vira na **Sync do portfólio**, retida
> até a Fase C por decisão da Gestora. Nenhuma contagem de track muda (A2 é
> reestruturação do modelo de acesso, não fechamento de bug; `BUG-035` fecha na
> Fase D).
>
> _(entrada anterior)_ 2026-07-07 (chat de execução — **Fase 1 iniciada**:
> BUG-035 (F1-06) promovido a **[CONFIRMADO]** por leitura (causa-raiz: enforcement
> de `member_area_access` só em `/hub/membro`; correção gated). **F1-01** (páginas
> públicas): PR #26 mergeada corrigindo **BUG-036** (hidratação no `ComparisonTable`),
> **BUG-037** (acentos/crase) e **BUG-014** (import morto); registrados **BUG-038**
> (perf, adiado) e **BUG-039** (ação órfã sem guard, remoção gated).
>
> _(entrada anterior)_ 2026-07-07 (chat de planejamento — reconciliação
> geral: corrigida a % do **T-03** (BUG-018 fechado conta como unidade inteira
> no critério de fechamento de Track, não fração — de `~1,5/4 (~38%)`,
> incorreto, para **1/4 (25%)**, exato); **F0-04** atualizado de "Parcial" para
> **Concluído** (as duas partes — `entitlements` e `User_JourneyMap` — estão
> mergeadas). Nenhuma mudança de código.
>
> _(entrada anterior)_ 2026-07-04 (chat de execução — **BUG-018 FECHADO**:
> consolidação de jornada completa — parar de escrever (PR #22), migração dos 5
> clientes atuais executada (scripts PRs #23/#24) e fallback removido (PR #25).
> Sem perda de dados. Resíduo networking no BUG-033).

---

## Fase 0 — Padrões canônicos

**Decisões: 6/6 (100%).** Implementação ainda pendente: **F0-01** — parte
GlassModal concluída (lotes 1/A/B); resta o 2º base p/ modais grandes (BUG-034,
futuro). **F0-04 concluído** (entitlements + consolidação de `User_JourneyMap`,
PRs #1/#22/#23/#24/#25).

| Item | Tema | Status |
|---|---|---|
| F0-01 | Modal canônico | Decidido · **parte GlassModal concluída** — lotes 1 (z-index, PR #15), A (4 modais-card, PR #20), B (offboarding + z-index JourneyNav, PR #21). Todos os modais-card convergidos; exceções aceitas (`ServiceSelection` público, `ContractGate` crítico); resta o 2º base p/ modais grandes app-shell (**BUG-034**, futuro). Conferência visual pendente em produção (BUG-030) |
| F0-02 | Timestamp | ✓ Decidido (padrão pronto) |
| F0-03 | Identidade | ✓ Decidido (padrão + convergência gradual) |
| F0-04 | Coleções órfãs | ✓ Concluída — `entitlements` removida (PR #1) + `User_JourneyMap` consolidado no v3 e removido de todos os clientes (PRs #22/#23/#24/#25); resíduo de nomenclatura obsoleta no networking tratado à parte (BUG-033, Fase 1) |
| F0-05 | Guard admin server-side | ✓ Mergeado (PR #1) |
| F0-06 | Tom de voz / copy | ✓ Ratificado (+ data legal em config, PR #1) |

---

## Tracks de execução associados

Onde a implementação sistemática dos temas da Fase 0 acontece. Progresso = bugs
mergeados na `main` sobre o total do track.

### T-02 — Segurança sistemática · **12 / 12 (100%)** ✅ FECHADO  `██████████`

- ✓ Mergeados: BUG-003 (recover, PR #3), BUG-007 (guard admin = F0-05, PR #1), BUG-019 (IDOR foto, PR #4), BUG-023 (rotas debug, PR #3), BUG-024 (trigger-sync removido, PR #5), BUG-021 (guard ad-hoc de upload unificado, PR #13), **BUG-020 (guards sistemáticos em Server Actions — 7 lotes, PRs #8–#14)**, **BUG-032 (escalação de privilégio no login, PR #14)**, **BUG-025 (webhook MP com assinatura HMAC, PR #16)**, **BUG-004 (path de debug no lugar do apelido no painel admin, PR #17)**, **BUG-006 (guard `requireAuth` no networking, PR #18)**, **BUG-005 (`requireMatricula` no pagamento do checkout de membro, PR #19)**
- ✅ **BUG-020 fechado** — 7 lotes: booking (PR #8, 2 IDORs), CRUD admin (PR #9), analytics admin (PR #10), queries do calendário (PR #11, 2 IDORs), journey (PR #12, 2 IDORs), upload/portfólio (PR #13, 1 IDOR + BUG-021), auth-permissions (PR #14, 1 IDOR + BUG-032). Padrão canônico do track consolidado: `requireAuth()`/`requireAdmin()` + dono-ou-admin, sessão pelo cookie assinado.
- ✅ **Track completo:** todos os 12 bugs vinculados corrigidos e mergeados. Nenhum aceite formal/adiamento foi necessário.

### T-06 — Compliance técnico · **2 / 2 (100%)** ✅ FECHADO  `██████████`

- ✓ Mergeados: BUG-023 (rotas debug removidas, PR #3), BUG-001 (`Support_Tickets` PII em
  subcoleção privada, PR #70 — rules publicadas + coleção raiz apagada pela Gestora, 2026-07-11)

### T-03 — Integridade de dados · **3 / 4 (75%)**  `████████░░`

- ✓ BUG-018 **Corrigido** — `entitlements` removida (F0-04) + consolidação de jornada completa: `User_Journey`(v3) mantido, `User_JourneyMap`(legado) parou de ser escrito (PR #22), migrado dos 5 clientes atuais (script PRs #23/#24, executado) e fallback removido (PR #25). Conta como unidade inteira no numerador (critério de fechamento de Track) — resíduo de nomenclatura no networking segue à parte no BUG-033 (Fase 1).
- ✓ BUG-010 **Corrigido** (PR #69) — `adminAddAttendeeAction` morta (versão de `post-event.ts`) removida; fonte única em `booking.ts`.
- ✓ BUG-008 **Corrigido** (PR #71) — chave de cota `1-to-1` unificada em minúsculo canônico (`src/lib/quota-keys.ts` + gravador auto-cura o drift + migração `normalize-quota-keys.js`). Merge de duplicatas total=maior/used=soma.
- ○ Aberto: BUG-009 (`UserBooking.timestamp` provavelmente sempre nulo — **[HIPÓTESE]**, a confirmar em produção)

### Outros tracks (ainda não iniciados)

- **T-01** Performance/concorrência — BUG-017 (aberto)
- **T-04** Observabilidade — escopo reduzido (inventariar gap)
- **T-05** Integrações externas — escopo misto (sandbox)

---

## Reestruturação do modelo de acesso (origem: `BUG-035`)

Desenho em `ACCESS-MODEL-DESIGN.md`. Fecha o `BUG-035` na **Fase D**, não antes.

| Etapa | Escopo | Status |
|---|---|---|
| A0 | Endurecer `portfolio_parser.py` (paths, slug BPL-003, travas) | ✓ PR #28 |
| A1 | Campos do modelo (aba `Atributos` + `ProductSchema` + `Product` + `dispensaPreRequisito`), sem consumidores | ✓ PR #29 |
| A2 | Selo condicional no checkout (`concedeSelo`) | ✓ PR #30 — **inerte até a Sync** |
| A3 | Botão admin de `dispensaPreRequisito` | ✓ PR #31 — **sem consumidor até a Fase B** |
| B1 | Motor puro `resolverAcesso` + 27 testes | ✓ PR #32 — **sem consumidor** |
| C | Checkout → `/hub/checkout` + journey → `/hub/journey` (stubs de redirect nos paths antigos) | ✓ PR #33 — **destrava a Sync** |
| — | **Sync do portfólio** (ativa o A2) | ✓ **executada pela Gestora (2026-07-08)** — 12 produtos com atributos no Firestore; `concedeSelo=false` do junior conferido |
| B2 | Adaptador leniente + motor assume o lock da jornada | ✓ PR #35 |
| D | Trancar `/hub/membro` (exige selo) | ✓ PR #37 — **BUG-035 RESOLVIDO** |

**Sequenciamento corrigido (2026-07-08):** a ordem `B → C → D` do design não roda —
o motor precisa de `preRequisitos` no Firestore, que só chegam pela Sync, retida até
a C. Ordem real: **B1 → C → Sync → B2 + D**.

**Aba `Atributos` preenchida** (2026-07-08) e conferida contra o §3.1: as 12 linhas
batem, `BPL-PAC-JR` = `public` + `concedeSelo FALSE` (a Gestora corrigiu uma
divergência apontada na conferência). Parser validado por diff — regressão zero.
**Payload não commitado e portfólio não sincronizado** de propósito: a Sync espera a C.

---

## Trilha 3 — Higiene da base

| Passo | Bug | Status |
|---|---|---|
| 3d-fonte | BUG-040 | ✓ PR #38 — namespace `_portfolio_backups` + rotação 3, nos DOIS caminhos de sync |
| 3d-limpeza | BUG-040 | ✓ **executada** — 47 coleções apagadas (export prévio); raiz 3+3 |
| 3b | BUG-042 | ✓ **migração executada** — 4 clientes normalizados (Embaixadores c/ jornada total); `career_planning` preservado (correção ao design); backups em scratch/ |
| 3c | BUG-041 | ✓ **executada** — 14 produtos arquivados excluídos; `products` = 12 ativos, 0 arquivados |

---

## Fase 1 — Validação por página (progresso)

> A Fase 1 tem **duas camadas** que evoluíram em ritmos diferentes:
> **(A) Segurança / gating** — praticamente fechada (Track T-02 100% + reestruturação
> de acesso A0→D). **(B) Validação página-a-página** de UX/copy/responsivo/render —
> majoritariamente **pendente**, porque telas logadas não autenticam no preview
> (`BUG-030`) → exige validação em **produção** (execução humana).

| Item | Página(s) | Camada A (segurança) | Camada B (validação UX) | Estado geral |
|---|---|---|---|---|
| **F1-01** | Públicas de marketing (home, /servicos, /profissionais, /conteudo, /agendar, legais) | n/a | ✓ base + **19/19 ajustes** aplicados (PR-A #42, PR-B #43, PR-C #44, PR-C2 #45) | **Cluster de ajustes COMPLETO** (copy, footer/header, design, /agendar). BUG-048/049/050 corrigidos. Base validada por leitura+preview; reconferência final ao vivo de baixo risco |
| **F1-02** | Checkout + subsistema de contratos | ✓ (BUG-005/006 via T-02) | ◐ **código completo** — CT-0..CT-4 (PRs #48..#66) | Rota órfã removida (BUG-002); subsistema reconstruído: entidade+IP+geo, avulso robusto, assinatura pós-checkout grátis+pago, padrão Gestão Funcional, carimbo/código único, **gate liberação (pagamento aprovado E contrato assinado)**, status real, painel reescrito + documento in-app + nota fiscal (CT-4), **portão morto aposentado + trava de acesso por-serviço auditada (BUG-055)**. Fechados BUG-051/052/053/054/055/056/057. **Pendente = apenas a validação MANUAL da Gestora em produção** dos 3 fluxos (grátis/pago/avulso), **programada para APÓS a limpeza da base do usuário de teste** (não há bloqueador de código); + CT-3c/CT-5 (fora do caminho crítico) |
| **F1-03** | Hub dashboard + motor de jornada | ✓ | ✓ **validada e aprovada em produção** (PR #72) | **F1-03 fechada.** Motor por dado (`resolverAcesso`), Sequence Lock/Upsell Gate e todos os modais da nav **aprovados pela Gestora** (2026-07-11). Ajustes de UI (os 3 reconferidos): onboarding no padrão offboarding (BUG-059), upsell sem nomes técnicos (BUG-060), modal de detalhe no `GlassModal` + grid 2 colunas (BUG-061) |
| **F1-04** | Hub: carreira, agenda, contratos, visão geral | ✓ (T-02 + cadeado D; `visao_geral` só login, intencional) | ◐ **código completo** (PRs #73/#74) + **feedback por pacotes** (PRs #80/#82/#83) | `contratos` já compliant (CT-4). PR1: acentos PT-BR (BUG-062). PR2: header canônico nas 3 (F2-05), modal da `visao_geral` no `GlassModal` (BUG-063/064), link "Visão Geral" no menu do hub. **Feedback da Gestora por pacotes:** Pacote 3 cards de Contratos (PR #82); Pacote 4 Gestão de Agenda (PR #83 — validado em produção); **Pacote 5 Gestão de Carreira** (PR #85 design: 4 seções, checkpoints recolhíveis, histórico de 1-to-1, 3 históricos lado a lado, larguras iguais; PR #86 funcionais: item 8.2 orientador no feedback + migração, item 9 `completedAt` dos objetivos). **Pendente: validação visual/funcional em produção** (BUG-030) + rodar a migração `migrate-feedback-authors.js` |
| **F1-05** | Checkout membro, networking, perfil, entrega | ✓ (BUG-005/006) | ◐ **código completo** (PRs #77/#78) + **feedback por pacotes** (PRs #80/#84) | Revisão das 4 páginas feita. **BUG-033** (privacidade networking + filtro de estágio morto removido) e **BUG-016** (cota `used` real na entrega) corrigidos (PR #77). Headers de perfil/networking → Gestão Funcional (PR #78, F2-05). Back-buttons → "Voltar". **Feedback da Gestora por pacotes:** Pacote 1 (BUG-067/068/069 networking, PR #80); **Pacote 6 redesign do Networking** (PR #84 — abas ao lado da busca, aviso de rodapé discreto, copy 6.1–6.4, abas "Membros/Profissionais/Parceiros"). **Pendente: só validação em produção** (+ `CouponTermsModal`) |
| **F1-06** | 19 páginas de admin | ✓ (BUG-003/007/023/024 + **BUG-035 RESOLVIDO**) | ○ não iniciada | O **bloqueador crítico (BUG-035) foi resolvido** via reestruturação A0→D. Botão A3 add em `admin/users`. Validação UI das 19 páginas não começou. BUG-047 (exibir atributos) |

**Resumo honesto:** a Fase 1 avançou muito **na camada de segurança e no motor**
(nenhum bug de segurança aberto; o maior Alto — BUG-035 — fechado; jornada
modernizada), mas a **validação visual/UX página-a-página das telas logadas mal
começou** — ela depende de produção (BUG-030) e é o grosso do trabalho restante da
Fase 1. Só a F1-01 (pública) está de fato validada ponta-a-ponta.

**Triagem por severidade (Fase 1):** **vazia** — nenhum Crítico e nenhum Alto aberto.
Os últimos Altos foram fechados: BUG-035 (PR #37), BUG-010 (PR #69), BUG-001 (PR #70 —
passos manuais concluídos pela Gestora em 2026-07-11) e BUG-008 (PR #71).

---

## Em andamento (PRs abertas)

_Nenhuma no momento._

---

## Bugs novos registrados nesta trilha (fora do plano original)

- **BUG-028** (Baixo, adiado) — login sem fallback popup→redirect (produção OK)
- **BUG-029** (Baixo, adiado) — override de `authDomain` anula proxy (produção OK)
- **BUG-030** (Baixo, **aceito**) — auth não funciona em preview Vercel (limitação conhecida)
- **BUG-031** (Baixo, pendente) — "Sincronizar Agora" não reconstrói lista dos membros (usabilidade)
- **BUG-032** (Crítico, **corrigido** PR #14) — escalação de privilégio: `syncUserPermissionsOnLogin` concedia admin a partir de e-mail não-verificado (achado no lote 7 do BUG-020)
- **BUG-033** (Médio, **[HIPÓTESE]**, aberto) — networking envia contatos/URLs não-visíveis ao client (a verificar na Fase 1 / F1-05)
- **BUG-034** (Baixo, aberto/futuro) — falta 2º componente-base para modais grandes "app-shell" (F0-01, opção iii)
- **BUG-035** (Alto, **CORRIGIDO** PR #37 — Fase D) — revogação de acesso agora expulsa do clube: cadeado server-side em `hub/membro/layout.tsx` + bypass `isAdmin ||` removido. Resolvido pela reestruturação completa A0→D (`ACCESS-MODEL-DESIGN.md`). Desbloqueia a validação do offboarding modal (F1-03)
- **BUG-036** (Médio, **corrigido** PR #26) — erro de hidratação no `ComparisonTable` (whitespace em `<colgroup>`) em `/servicos/[audience]`; F1-01
- **BUG-037** (Baixo, **corrigido** PR #26) — acentos/crase em copy pública de serviços; F1-01
- **BUG-038** (Baixo, aberto/adiado) — `<Image fill>` sem `sizes` na foto da fundadora (perf); F1-01/T-01
- **BUG-039** (Baixo, **corrigido** PR #27) — `seedComparisonProductsAction` órfã removida (double-check: zero refs no repo); F1-01
- **BUG-045** (Médio, **corrigido** PR #32) — `npm run test` quebrado na `main` desde o PR #19 (mock de `@/lib/auth-guards` sem `requireMatricula`); suíte estava 37/39 e ninguém via, porque as sessões validavam só com `tsc` + `build`

---

## Legenda

`✓` mergeado · `◐` parcial · `○` aberto · `→` em PR · **gated** = decidido, aguarda plano+aprovação para implementar
