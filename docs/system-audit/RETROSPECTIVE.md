# Retrospectiva do Processo de Auditoria

Documento **vivo** de lições aprendidas executando o `00-PLAN.md`. Serve a dois
públicos:

1. **Chat de planejamento** — para refinar o plano e os docs de processo.
2. **Chats de execução** — para performar melhor que os anteriores. **Todo chat
   de execução deve ler este arquivo** (junto de `00-PLAN.md` + `LOG.md`) antes de
   agir — ver Protocolo no `00-PLAN.md`.

Cada sessão que aprender algo reutilizável adiciona/edita aqui. Origem inicial:
sessão de execução de 2026-07-02/03 (Fase 0 + início do Track T-02).

---

## Lições de execução (leia antes de agir)

Regras práticas destiladas de erros e acertos reais. São diretivas, não teoria.

1. **Nunca use uma rota/action que MUTA estado como "sonda" de teste.** Antes de
   bater em qualquer endpoint "só pra ver se responde", confirme por leitura de
   código que é read-only. _(Caso real: um `GET /api/trigger-sync` de sanity
   disparou um rewrite do registro global de programação em produção.)_

2. **Verifique no código ANTES de escrever a conclusão; marque o não-verificado
   como provisório.** O plano já manda "inspeção real, não assumida" — vale também
   para a prosa dos docs. _(Casos reais: afirmei que o arquivo de tipos do
   `entitlements` era órfão — não era, quebraria o build; e um diagnóstico de auth
   assumiu falha em produção que os dados refutaram.)_ Rotule recomendação não
   validada como **hipótese**, não como fato.

3. **Confirme premissa antes de implementar em área sensível.** Quando o alvo é
   segurança/identidade/financeiro, o gating do `CLAUDE.md` (plano + aprovação)
   não é burocracia — foi o que evitou um refactor grande e errado no fluxo de
   login (o problema era preview-only, não produção). Validar primeiro > codar
   rápido.

4. **Higiene de branch/PR: conte os PRs em voo antes de ramificar.** Não crie uma
   branch nova a partir da `main` mexendo em arquivos que um PR ainda aberto também
   altera — dá conflito/stash desnecessário. Ou mergeie o PR antes, ou mantenha a
   atualização de status na mesma branch da mudança de código.
   **Corolário (caso real 2026-07-07, F1-01):** se você commitar docs na `main`
   **local** e ramificar SEM dar `git push origin main` antes, a `origin/main`
   fica atrás e o PR (base=`origin/main`) **arrasta o commit de docs junto** no
   squash — o corpo do PR passa a subdescrever o diff e a `main` local diverge.
   Regra: **push do que for direto-na-main ANTES de criar a branch** (ou inclua os
   docs no próprio PR de propósito). Se divergir, `git diff <local> origin/main`
   para confirmar que o conteúdo local está contido no remoto antes de
   `reset --hard origin/main`.

5. **Cheque ferramentas e sintaxe de shell no começo.** Nesta máquina:
   - `gh` (GitHub CLI) **não está instalado**. Para abrir/mergear PR, usar a
     credencial já salva do git via API REST do GitHub (ver `LOG.md` para o
     padrão exato: `git credential fill` → token → `fetch` na API).
   - A ferramenta Bash é **Git Bash (sh)**, não PowerShell: usar here-string
     `<<'EOF'` para mensagens multi-linha. Sintaxe `@'...'@` (PowerShell) corrompe
     o texto.

6. **Triagem por severidade fura a ordem das fases.** Um Crítico/Alto vivo (ex.:
   `BUG-003`, escalação de admin) vale mais que seguir Fase 0→1→2 ao pé da letra.
   Priorize impacto/severidade real sobre a ordem nominal do plano.

7. **Atualize o `DASHBOARD.md` a cada PR mergeada** (Protocolo item 5). É o que
   mantém a visibilidade de progresso honesta e evita status defasado nos Tracks.

8. **Agrupe confirmações sem dependência entre si** (batch) em vez de ida-e-volta,
   para não gastar rodadas. Explicações "para leigo" quando a Gestora pedir; mas
   decisões independentes podem ser perguntadas juntas.

9. **Antes de guardar uma função, cheque se ela é primitivo de infraestrutura.**
   Se a função é chamada por `getServerSession` (ex.: `fetchUserPermissionsStatus`),
   pôr `requireAuth`/`requireAdmin` dentro dela causa **recursão infinita** (o guard
   depende de `getServerSession`, que depende dela). Padrão de solução: separe o
   **resolvedor cru** (lib, sem guard, usado pela infra com identidade já verificada)
   do **action exposto na rede** (wrapper com trava de dono via `verifySignedSession`,
   que só lê o cookie e não recursa). _(Caso real: BUG-020 lote 7 / PR #14.)_

10. **Um "último lote trivial" pode esconder o bug mais grave — inspecione o arquivo
    inteiro, não só a função citada no bug.** O BUG-020 citava só
    `fetchUserPermissionsStatus`, mas o mesmo arquivo tinha `syncUserPermissionsOnLogin`
    concedendo admin a partir de um e-mail **não-verificado** (auto-promoção a admin,
    Crítico = BUG-032, achado no lote 7). Server actions confiam em parâmetros do
    cliente: todo `(uid, email)`/`matricula` recebido tem de ser confrontado com a
    identidade **verificada** (cookie/token), nunca usado direto. Registre o achado
    novo em `BUGS.md` antes de decidir (protocolo), mesmo no meio de outro lote.

---

11. **Nunca remova acentos PT-BR de texto de interface.** A regra do projeto é
    "Zero Emoji" — **não** "zero acento". Acentos (ã, ç, é, ...) são copy correto e
    esperado; removê-los degrada a UI. _(Caso real: no F0-01 lote A eu troquei
    "Conclusão"→"Conclusao", "recepção"→"recepcao" etc. ao reescrever 4 modais —
    regressão de copy, corrigida no PR #21.)_ ASCII só é apropriado em **comentários
    de código, rotas/slugs e chaves/identificadores** — nunca em strings visíveis.

12. **GlassModal não é base universal — é a base dos modais-card.** Ao convergir
    modais para um padrão, cheque a estrutura de cada um antes de assumir que cabe:
    modais grandes "app-shell" (header/footer fixos + corpo rolável) e modais de
    outro universo (público) ou de criticidade especial (gate não-dismissível com
    z próprio) **não** devem ser forçados no card. _(Caso real: F0-01 lote B — só
    1 dos 6 candidatos cabia; os demais viraram exceções aceitas ou o 2º base
    BUG-034.)_ A decisão "um modal-base único" precisou virar "dois bases: card +
    app-shell".

13. **Contagem fracionária de Track só vale enquanto o bug está `Em Progresso` —
    um bug `Corrigido` conta como unidade inteira, nunca fração.** O precedente
    correto (BUG-020/T-02, ex.: `~5,5/11` → `~5,7/11` → ...) existia só porque o
    bug ainda não tinha fechado. Ao fechar de fato, ele soma 1 inteiro ao
    numerador — nunca "meio ponto a mais" por progresso incremental já
    encerrado. _(Caso real: BUG-018/T-03 fechou por completo (Ações 1a+2+1b) e
    o `DASHBOARD.md` foi atualizado para `~1,5/4`, quando o correto era `1/4`
    exato — erro pego só na reconciliação seguinte, 2026-07-07.)_

14. **Valide com `npm run check`, não só com `tsc` + `build`.** O `check` é
    `lint && test && type-check && build` — as sessões vinham rodando só os dois
    últimos, e o pre-commit (lint-staged) só roda eslint. Resultado: a suíte de
    testes ficou **vermelha na `main` por 4 dias** sem ninguém ver (`BUG-045`: o
    PR #19 trocou o guard de `createPreferenceAction` e não atualizou o `vi.mock`).
    Um portão que ninguém executa não é um portão. _(Caso real: achado ao rodar a
    suíte completa antes de entregar o B1, 2026-07-08.)_

15. **Teste que você escreveu contra o seu próprio código não prova nada até você
    tentar quebrá-lo.** Depois de escrever os 26 testes do motor de acesso, inverti
    deliberadamente a ordem das regras (entitlement antes de escopo) — **só 1 dos 26
    falhou**. A regra mais importante (a ordem que faz a revogação do selo expulsar
    do clube, `BUG-035`) estava mal coberta: o teste "PREVIA vence entitlement" usava
    um usuário que *possuía* o serviço, então passava nos dois arranjos. Faltava o
    caso discriminante (sem selo **e** sem entitlement). Adicionado; a mutação passou
    a quebrar 2 testes. **Rode uma mutação na regra central antes de confiar na
    suíte.** _(Caso real: PR B1, 2026-07-08.)_

---

16. **`set(..., {merge:true})` faz merge PROFUNDO de mapa e NUNCA remove chave —
    para apagar chave de um map use `update()` (substitui o campo) ou
    `FieldValue.delete()`.** A migração 3b (BUG-042) tinha de remover chaves-lixo de
    `services`; a 1ª passada usou `set(...,{merge:true})` e só as **adições**
    surtiram efeito — as remoções foram silenciosamente ignoradas (o levantamento
    pós-migração ainda mostrava o lixo). Corrigido com `doc.ref.update({services:
    target})`, que troca o valor do campo inteiro, preservando os demais campos do
    doc. **Sempre reexecute o inventário read-only depois de uma migração para
    confirmar o estado real — não confie no "APLICADO" do log.** _(Caso real: 3b,
    2026-07-08. Backups do estado original protegidos de sobrescrita na reexecução.)_

17. **"Tela aprovada" não é "fluxo exercido com dado real" — valide cada variação, não o motor.**
    A `F1-03` (motor de jornada) foi validada e **aprovada em produção** em 2026-07-11, e ainda
    assim as 10 paradas de **MentoCoach** nunca mostraram uma única sessão (`BUG-073`, Alto) e 2
    paradas de grupo listavam sessões de **outro serviço**, agendáveis (`BUG-074`, Alto). O motor
    estava certo; o que quebrou foi a **tabela de palavras-chave por serviço** — um heurístico de
    substring que falha silenciosamente, serviço a serviço, sem erro no console. Aprovar "a
    jornada" olhando 1-2 paradas não cobre isso. _(Caso real: 2026-07-16, achado só quando a
    Gestora tentou usar o MentoCoach de verdade.)_

18. **Antes de teorizar a causa, faça um inventário read-only da base real — o palpite mais óbvio
    costuma ser o errado.** O reporte era "sincronizei e não aparece", e a hipótese natural (sync
    quebrado) estava **errada**: os 25 eventos já estavam gravados corretamente. Um dump de 3
    consultas (`products.deliverySteps`, `Calendar_Events`, simulação do filtro) apontou a causa
    exata em minutos e ainda revelou um 2º Alto fora do escopo. **Escreva o simulador importando a
    função de produção compilada, não uma cópia colada** — a cópia diverge do código que vai para a
    `main` e você valida uma ficção. _(Caso real: `BUG-073`/`BUG-074`, 2026-07-16.)_

19. **Heurístico que lê texto livre editável no admin é bug esperando data.** O filtro de eventos
    casava pelo `title` da parada (editável pela Gestora) junto com o `referenceId` (identificador
    real). Bastou uma parada se chamar "Finanças para **Carreira** Profissional" para ela herdar o
    filtro do Plano de Carreira. **Identificador tem precedência sobre rótulo** — texto de UI só
    pode ser fallback, nunca fonte de decisão de negócio. _(Caso real: `BUG-074`, PR #101.)_

20. **Antes de escrever a copy de uma regra, verifique se o sistema executa a regra.** A Gestora
    pediu para reescrever o card "Política de Agendamento". Auditar antes de redigir revelou que
    **nenhuma das 4 regras anunciadas era cumprida** (`BUG-076`): a janela máxima só valia para
    "onboarding", o limite semanal fazia o **oposto** do pretendido (trancava a semana inteira), o
    prazo de 24h não existia, e **nada era validado no servidor**. Publicar só o texto teria
    transformado um bug silencioso numa promessa explícita — pior que o estado anterior. **Texto de
    regra de negócio é contrato: audite a execução antes de redigir, e entregue os dois juntos.**
    _(Caso real: PRs #102/#103, 2026-07-16.)_

21. **Regra duplicada entre cliente e servidor vira regra divergente — extraia a fonte única.** As
    regras de agendamento viviam só no `Calendar.tsx` (escondendo o evento) e o servidor aceitava
    qualquer coisa. Quando um lado é "a tela" e o outro é "a verdade", eles divergem por construção.
    A correção não foi copiar as regras para o servidor — foi criar `src/lib/booking/policy.ts` e
    fazer **as duas pontas chamarem as mesmas funções**. Vale o mesmo para o texto: os números da
    copy saem da config, então texto e regra não podem dessincronizar. _(Caso real: `BUG-076`.)_

22. **Um teste que "falha" pode estar certo — cheque a regra antes de corrigir o teste.** Ao cobrir
    a janela de 20 dias, um teste falhou na fronteira. O reflexo é ajustar o teste; a checagem
    mostrou uma **ambiguidade real de negócio**: a regra legada cortava no *início* do 20º dia, ou
    seja, o último dia agendável era o 19º — contradizendo o texto "de 20 a 3 dias" que estávamos
    prestes a publicar. O teste foi o único a notar. _(Caso real: PR #103.)_

23. **Ao mudar uma action compartilhada, mapeie TODOS os chamadores antes — um deles pode ser
    receita.** `bookEventAction` parece "o agendamento do membro", mas também serve o **funil de
    lead público**, que roda com janela de 33 dias. Aplicar a política de 20 dias "globalmente"
    teria quebrado o funil silenciosamente. A trava foi escopar as regras a quando há matrícula.
    _(Caso real: PR #103; mesma família da Lição 9 — cheque quem mais chama antes de guardar.)_

24. **Uma dúvida da Gestora vale uma investigação inteira — o Alto costuma estar ao lado da
    pergunta.** A pergunta era inócua ("de onde vem o nome dos cards?"). Puxar o fio até a fonte
    revelou que concluir uma parada marcava **todas as irmãs** (`BUG-077`, Alto): o serviço inteiro
    ficava inconcluível. Mesma família da Lição 10 (o lote trivial escondia o Crítico) e da 17
    (tela aprovada ≠ fluxo exercido). **Responder a pergunta literal e parar ali teria deixado o
    bug em produção.** _(Caso real: 2026-07-16, PR #104.)_

25. **Antes de "corrigir" o código, pergunte se o defeito não é do dado — e se o código não está
    certo.** O reflexo era trocar `description || title` por `title` na `visao_geral`. Olhar o dado
    real mostrou que isso **quebraria 5 paradas**, cujos títulos são idênticos ("Análise
    Comportamental") e que só se distinguem pela descrição. O código estava certo; o dado é que
    estava genérico, e a correção certa foi na planilha. **Dado ruim se disfarça de bug de código.**
    _(Caso real: `BUG-078`.)_

26. **Remendo com nome de serviço hardcoded é sinal de bug geral mal diagnosticado.** O parser
    tinha `if service_code == "BPL-004"` para gerar id único — alguém bateu no problema num serviço
    e remendou só ali, em vez de perguntar por que o id colidia. Pior: o remendo era **inócuo**,
    porque o consumidor (`journey.ts`) recalculava o id e descartava o sufixo. **Quando achar um
    `if X == "<id específico>"` numa regra genérica, trate como bug não diagnosticado — e verifique
    se o remendo sequer surte efeito.** Substituído por uma regra geral + trava que falha alto.
    _(Caso real: `BUG-077`.)_

27. **Quando a regra nova depende de um dado, verifique se o sistema LÊ esse dado — antes de
    desenhar a regra.** A Fase C dependia de "etapa concluída". Ao desenhar, descobri que a leitura
    de conclusão era crua e a escrita normalizada (`BUG-079`): duas contas reais tinham a chave
    legada `plano_de_Carreira`. A regra teria sido implementada, testada, aprovada — e **nunca
    destravaria**, porque esperava por uma conclusão que o sistema não enxerga. **O insumo da regra
    é parte do escopo da regra.** _(Caso real: PRs #105/#107, 2026-07-16.)_

28. **Antes de mergear uma regra de acesso, rode-a contra TODOS os usuários reais — não só contra o
    que motivou o pedido.** A Fase C foi pedida por causa do `BP-005`. Simular contra os 4 usuários
    com progresso revelou que o `BP-002` estava com **10 paradas concluídas** no Posicionamento e
    seria expulso — efeito literal da regra aprovada, mas certamente não imaginado por quem a pediu.
    Levado à Gestora ANTES do merge, ela escolheu manter a regra e conceder a dispensa. **Regra de
    acesso não se valida no caso que a motivou; valida-se na população inteira**, e o caso
    surpreendente é o que merece a decisão dela, não a sua. _(Caso real: PR #107.)_

29. **Ao afrouxar/apertar uma regra de negócio, cace os `if` que assumiam a regra ANTIGA.** A Fase C
    tornou a 1ª etapa travável. Meses antes, alguém escreveu `if (stageIndex > 0)` antes de abrir o
    modal de trava — correto **na época**, porque a 1ª etapa nunca podia estar travada. A regra nova
    não quebrou o código; quebrou a **premissa** dele, e o sintoma foi o pior possível: um clique que
    não faz nada, sem erro. **Regra nova = varredura dos guards que codificavam a regra velha**
    (`índice > 0`, `!== primeiro`, `length - 1`), não só dos que a implementavam. _(Caso real:
    `BUG-081`, achado pela Gestora horas depois do merge da Fase C.)_

    Corolário: **se o motor já calcula a resposta, a UI não pode deduzi-la por conta própria.** O
    `pendentes` existia desde o PR B2 e a UI deduzia "a etapa anterior" pela posição — o que também
    estava errado, silenciosamente, para os paralelos. Dedução paralela à fonte de verdade é bug
    esperando a regra mudar.

30. **Casar string por `includes` de trecho é bug esperando um acento — e o acento cai onde você
    não olhou.** O gráfico da Tríade casava `label.includes("importan")`, e o rótulo do membro é
    **"Importância"**: o `â` cai **dentro** do trecho buscado e a comparação falha. `"circunstância"`
    passava, porque o acento dela vem **depois** de `"circun"` — por isso o sintoma foi
    "0% / 0% / **29%**", parcial, que parece dado ruim e não bug de código (`BUG-082`).
    **Duas armadilhas juntas:**
    - **O fallback mudo.** `|| { percentage: 0 }` e `else` transformam "não encontrei" em uma
      resposta *plausível*. O gráfico mostrou 0% e o diagnóstico mostrou "Atenção ao Desperdício"
      para quem teve o **melhor** resultado — nenhum erro, nenhum log. Prefira `null` e deixe o
      chamador decidir.
    - **A correção tentadora é a errada.** Tirar o acento dos rótulos do membro faria o gráfico
      funcionar na hora — e seria regressão de copy (Lição 11), porque eles aparecem na legenda. O
      defeito é do **casamento**, não do dado. Normalize na comparação, nunca na exibição.
    _(Caso real: PR #109. A tela do admin passava os rótulos sem acento e por isso sempre
    funcionou — foi o que manteve o bug invisível, com dois códigos lendo o mesmo dado e
    divergindo; ver Lição 21.)_

31. **Mergeou? Confirme que o DEPLOY de produção subiu — merge na `main` não é entrega.** O PR #109
    foi mergeado e a `main` recebeu o código, mas a Vercel **não gerou deployment nenhum** (nem
    enfileirado); o último Production continuou sendo o PR anterior. A Gestora descobriu, não eu.
    Como este projeto mergeia **pela REST API** (o `gh` não existe na máquina), qualquer instabilidade
    do GitHub pode fazer o merge suceder e o evento de deploy se perder — o pior dos mundos, porque
    o `git log` diz que está tudo certo. **Checklist novo: depois do merge, confirmar o deployment de
    produção do commit certo antes de dizer "está em produção".**

    **Dois detalhes operacionais que custaram tempo real:**
    - **O "Redeploy" da Vercel reconstrói o MESMO commit** do deployment escolhido — ele **não** puxa
      o topo da `main`. Eu afirmei o contrário para a Gestora e a instrução era inútil: redeployar o
      deployment anterior só reconstruiria o estado anterior. Para publicar código novo é preciso um
      **evento de push novo** (commit vazio resolve), um Deploy Hook, ou `vercel --prod` autenticado.
    - **Não afirme causa de falha de infra sem o dado.** Eu disse "webhook descartado"; o painel do
      GitHub marcava **Webhooks operacional** e o incidente era só da REST API. A causa segue não
      comprovada — e dizer "não sei, mas o remédio é X" teria sido mais honesto e igualmente útil.
    _(Caso real: PR #109, 2026-07-16. Resolvido com o commit vazio `65e968a`.)_

32. **Filtrar na ESCRITA e filtrar na LEITURA não são a mesma decisão — e a intenção "não quero ver
    isso na tela" resolve-se SEMPRE na leitura.** O commit `fc00c6d` queria limpar a tela do admin
    (preocupação de leitura) e aplicou o filtro nos dois lugares: no `queries.ts` (certo) **e no
    `sync.ts`** (colateral). O de leitura afeta um consumidor; o de escrita **apaga o dado para todos
    os consumidores** — inclusive os que ninguém mapeou. Aqui o dano ficou escondido por 6 semanas:
    a agenda pública dependia daqueles eventos para saber o que estava ocupado, e passou a oferecer
    ao lead **249 dos 756 horários (32,9%)** em cima de um bloqueio real. **Antes de filtrar na
    gravação, pergunte quem mais lê essa coleção** — se a resposta não for "ninguém", filtre na
    leitura. Sintoma diagnóstico: se os leitores já se defendem sozinhos do que você quer filtrar
    (aqui os 3 já faziam `includes("bloqueado")`), o filtro da escrita é o ponto fora da curva.
    _(Caso real: `BUG-084`, PR #110, 2026-07-16.)_

33. **A hipótese de quem reporta pode estar certa no mecanismo e invertida no diagnóstico — teste o
    mecanismo, não a conclusão.** A Gestora disse: "esses eventos estão apenas sujando a base... ou
    talvez estejam aí justo para bloquear os espaços livres; verifique: se a falta de sincronização
    não afetar nada, nem precisam ser sincronizados." As duas metades apontavam para lados opostos, e
    a **segunda** era a certa: os bloqueios não estavam sujando a base — **não chegavam nela**, e a
    ausência é que quebrava a regra. Executar o pedido literal ("não sincronize") teria **aprofundado**
    o bug com aval dela. Mesma família da Lição 24 (a dúvida vale uma investigação) e da 25 (o
    reflexo de correção costuma ser o errado). **O fóssil que provou a causa foi um `lastSync`
    anterior ao commit do filtro** — quando o dado tem carimbo de tempo, ele conta a história sozinho.
    _(Caso real: `BUG-084`, 2026-07-16.)_

34. **Ao mudar o que entra numa coleção, releia os `limit()` de quem a consome.** Sincronizar +116
    bloqueios era inócuo até se notar que o registro global fazia `.limit(500)` **antes** do filtro em
    memória — com 538 docs ele **já truncava calado**, e passaria a descartar evento **real**. O
    `limit` é aplicado pelo banco antes de qualquer filtro seu: `limit` + filtro em memória é sempre
    um corte que não distingue o que você queria manter. E `where("campo","==",false)` não é o
    remédio automático: o Firestore **não casa documento sem o campo**, então a query engole os
    legados. _(Caso real: `BUG-086`, achado pelo mapa de consumidores da Lição 23, feito ANTES de
    codar — foi o mapa que pagou por si.)_

---

## Melhorias sugeridas para o PLANO (para o chat de planejamento refinar)

1. **Rollup de progresso nativo.** O plano rastreava itens/bugs mas não tinha
   visão agregada, e o status dos Tracks ficou defasado (T-02 dizia "Não iniciado"
   com 5 bugs já resolvidos). Já mitigado com `DASHBOARD.md` + Protocolo item 5 —
   considerar nascer assim em planos futuros. Adicionar um **índice bug→item/track**
   explícito (hoje a associação é inferida).

2. **Separar "decidido" de "implementado".** A Fase 0 é fase de decisão, mas
   F0-01/04/05 exigem código. "Fase 0 concluída" ficou ambíguo. Um item
   decidido-mas-gated **não** é "done" — marcar os dois estados distintamente.

3. **Recomendações como hipótese até validar.** O plano prescreve soluções antes
   da validação e algumas mudaram na execução (BUG-002 reclassificado, BUG-024 de
   "shared secret" para "remover", hipótese de authDomain invertida). Marcar
   recomendação não validada como provisória.

4. **Definir o critério de "fechar um Track".** Ex.: T-02 fecha com todo bug
   "corrigido **ou** formalmente aceito com justificativa". A % do DASHBOARD
   precisa dessa distinção para não mentir.

5. **Overlay de triagem por severidade** sobre a ordem de fases (ver Lição 6).

---

## O que funcionou muito bem (preservar)

1. **Docs como fonte de verdade compartilhada** (`00-PLAN` + `BUGS` + `LOG` +
   mapas 01-05). Contexto retomável entre chats; decisões embasadas em inspeção
   real, não achismo.

2. **`BUGS.md` desacoplado das fases.** Achados novos entram sem bagunçar a
   estrutura; a regra "registrar antes de decidir corrigir" mantém disciplina.

3. **Gating de área sensível do `CLAUDE.md`.** Forçou validação antes de codar em
   segurança/identidade/financeiro — maior gerador de valor da sessão.

4. **"Modo de validação decidido na hora"** (Automatizado vs Requer execução
   humana) — flexível e correto por item.

---

## Registro de revisões deste documento

- 2026-07-03 — criação, a partir da sessão Fase 0 + início do T-02.
- 2026-07-04 — Lições 11 (acentos PT-BR) e 12 (GlassModal não é base universal)
  adicionadas, a partir do F0-01 lote A/B.
- 2026-07-07 — Lição 13 (contagem fracionária só vale para bug `Em Progresso`)
  adicionada, a partir do erro de % do T-03 pego na reconciliação desta data.
- 2026-07-08 — Lições 14 (validar com `npm run check`, não só `tsc`+`build` —
  origem do `BUG-045`) e 15 (mutação na regra central antes de confiar na suíte —
  origem: PR B1 do motor de acesso) adicionadas.
- 2026-07-08 — Lição 16 (`set(merge:true)` não remove chave de map; reexecutar
  inventário pós-migração — origem: 3b/BUG-042) adicionada.
- 2026-07-16 — Lições 17 (tela aprovada ≠ fluxo exercido com dado real), 18
  (inventário read-only antes de teorizar; simulador com a função de produção,
  não uma cópia) e 19 (identificador tem precedência sobre rótulo editável)
  adicionadas, a partir do `BUG-073`/`BUG-074` (PR #101).
- 2026-07-16 — Lições 20 (copy de regra é contrato: audite a execução antes de
  redigir), 21 (regra duplicada entre cliente e servidor diverge por construção
  — extraia a fonte única), 22 (teste que falha pode estar certo; cheque a regra
  antes de corrigir o teste) e 23 (action compartilhada: mapeie os chamadores,
  um deles pode ser receita) adicionadas, a partir do `BUG-076` (PRs #102/#103).
- 2026-07-16 — Lições 32 (filtrar na escrita apaga o dado para todos os
  consumidores; intenção de exibição resolve-se na leitura), 33 (a hipótese de
  quem reporta pode estar certa no mecanismo e invertida no diagnóstico — o
  pedido literal aprofundaria o bug) e 34 (`limit()` é aplicado antes do filtro
  em memória; `where` por campo não casa doc sem o campo) adicionadas, a partir
  do `BUG-084`/`BUG-086` (PR #110).
- 2026-07-16 — Lição 31 (merge na main não é entrega: confirme o deploy de
  produção; o Redeploy da Vercel reconstrói o mesmo commit; não afirme causa de
  falha de infra sem o dado) adicionada, a partir do incidente do PR #109.
- 2026-07-16 — Lição 30 (casar string por `includes` quebra com acento; o
  fallback mudo disfarça a falha de resposta plausível; e normalizar na
  exibição em vez da comparação é regressão de copy) adicionada, a partir do
  `BUG-082`.
- 2026-07-16 — Lição 29 (regra nova invalida a premissa de guards antigos: cace
  os `if` que codificavam a regra velha; e a UI não deduz o que o motor já
  calcula) adicionada, a partir do `BUG-081`.
- 2026-07-16 — Lições 27 (o insumo da regra é parte do escopo da regra) e 28
  (rode a regra de acesso contra a população inteira antes de mergear, não só
  contra o caso que a motivou) adicionadas, a partir da Fase C (PRs #105-#107).
- 2026-07-16 — Lições 24 (uma dúvida da Gestora vale uma investigação inteira),
  25 (dado ruim se disfarça de bug de código) e 26 (remendo com nome de serviço
  hardcoded é bug geral mal diagnosticado — e pode ser inócuo) adicionadas, a
  partir do `BUG-077`/`BUG-078` (PR #104).
