# Diretriz de Escopos — duas contas Claude no mesmo projeto

Duas contas Claude trabalham no BPlen HUB ao mesmo tempo. Esta diretriz evita
que os trabalhos conflitem (edições concorrentes, colisões de `main`, estado
divergente). Regra de ouro: **papéis separados, arquivos com dono claro, e uma
escritora por vez na `main`.**

## 1. Papéis (quem faz o quê)

### Conta de EXECUÇÃO (implementa código)
- Implementa features/correções/refino em `src/`, `scripts/`, `public/`,
  configs, testes. **Sempre em branch própria** (PR, ou fast-forward na `main`
  só quando a Gestora aprovar — precedente das Fases de auth: preview não
  autentica área logada, BUG-030).
- **Registra bugs** em `BUGS.md` (fonte de verdade de bug) já vinculando ao
  item/track (Protocolo item 3).
- Escreve a **própria entrada no `LOG.md`** ao entregar (rotulada
  `Chat de execução`).
- Atualiza o `DASHBOARD.md` no que for contagem direta do próprio PR
  (Protocolo item 5).
- **NÃO** reescreve o estado agregado do `00-PLAN.md` (seção "Estado da
  auditoria", grupos da lista priorizada, índice bug→track, triagem) — isso é do
  planejamento. Deixa o rastro em `BUGS.md`/`LOG.md` e o planejamento reconcilia.

### Conta de PLANEJAMENTO/AUDITORIA (esta — docs-only)
- **Nunca toca código** (`src/`, `scripts/`, `public/`). Lê código read-only para
  investigar/reconciliar.
- **Dona** de: `00-PLAN.md` (todo o estado agregado: fases, tracks, índice
  bug→track, triagem, "Estado da auditoria"), tabelas agregadas do `DASHBOARD.md`,
  `RETROSPECTIVE.md`, e os docs de design/plano (`AUTH-*`, `EMAIL-*`,
  `AUTH-TRACKING-DESIGN.md`, etc.).
- **Reconcilia** o que a execução deixou em `BUGS.md`/`LOG.md` para dentro do
  `00-PLAN.md`/`DASHBOARD.md` — **depois** que a execução mergeia (não durante).
- Registra reconciliações no `LOG.md` (rotuladas `Chat de planejamento`).

## 2. Arquivos compartilhados (risco de colisão) e como tratar

`LOG.md`, `BUGS.md`, `DASHBOARD.md` são escritos pelas duas contas. Regras:

1. **Uma escritora por vez na `main`.** Não rodar as duas contas editando docs de
   governança simultaneamente. Se a execução está mergeando, o planejamento
   espera; e vice-versa.
2. **`git pull --rebase` (ou re-checar o arquivo) ANTES de todo commit de docs**
   na `main`. Nunca `git push --force`. Se o push for rejeitado (não
   fast-forward), rebaseia e reaplica.
3. **Antes de editar um doc compartilhado, releia-o** — o arquivo pode ter mudado
   no disco desde a última leitura (aconteceu de verdade: o `DASHBOARD.md` mudou
   sob edição concorrente). Edits que dependem do contexto ao redor devem reler
   primeiro.
4. **Entradas de `LOG.md` são append no topo, autossuficientes, datadas e
   rotuladas** (`Chat de execução`/`Chat de planejamento`) — reduz a área de
   conflito a poucas linhas no topo.

## 3. Fronteira dura (o que cada conta NUNCA faz)

- Planejamento **nunca** edita `src/`/`scripts/`/`public/` nem abre branch de
  código.
- Execução **nunca** reescreve o estado agregado do `00-PLAN.md` (índice
  bug→track, triagem, "Estado da auditoria", grupos da lista priorizada). Só
  deixa o dado bruto em `BUGS.md`/`LOG.md`.

## 4. Fluxo de handoff entre as contas

- O **`LOG.md` é o canal** entre as contas: a entrada mais recente é o estado.
- Toda conta, ao começar, **confirma contra git** (`git log`, `git rev-parse`,
  `merge-base --is-ancestor`) antes de tratar qualquer status herdado como fato
  (Lição 45 / Protocolo item 15).
- Código só é "entregue" quando **mergeado na `main` e em produção** — WIP em
  branch não conta para a reconciliação (Lição 31).

## 5b. Diretório de trabalho compartilhado (o risco mais perigoso)

Se as duas contas usam o **mesmo repositório local** (hoje
`C:\DevGeral\Projects\BPlenHUB`; era `D:\BPlen_HUB\Dev` até a migração da máquina em
2026-08-06), a árvore de trabalho e o branch ativo são **um só** — trocar de branch
numa conta muda o que a outra vê. Regras:

- **Deixe o repositório no mesmo branch em que o encontrou.** Se precisar mudar de
  branch para commitar docs na `main` (ex.: a sessão está numa branch de código
  WIP), volte para o branch original ao terminar. (Foi o que esta reconciliação
  fez: `feat/drive-coverage-surveys` → `main` para os docs → devolvida.)
- Preferir, quando possível, **clones separados ou `git worktree` por conta**, para
  árvores independentes — aí o único ponto de colisão é o push para `origin/main`
  (coberto pela regra 2).
- Nunca deixar edições não-commitadas de uma conta ao trocar de contexto.

## 5. Cadência recomendada

- Execução trabalha em blocos (branch → entrega → LOG/BUGS).
- Planejamento reconcilia **após** cada bloco/onda de entregas, não em paralelo.
- Assim as janelas de escrita na `main` não se sobrepõem, e o estado agregado
  fica sempre atrás de um único reconciliador.
