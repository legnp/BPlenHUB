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
