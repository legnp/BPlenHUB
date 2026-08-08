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
- **Confirme o branch NO INSTANTE do commit, não no início da sessão.** `git status
  --short` sozinho **não mostra o branch** — use `git status --short --branch` ou
  `git branch --show-current` na mesma chamada do `git commit`. A janela entre
  "conferi" e "commitei" é onde a outra conta atua. _(Caso real, 2026-08-07: um
  commit de docs caiu no branch de código do outro chat porque ele trocou o branch
  da árvore no meio da sessão de planejamento. Ver LOG e Lição 55.)_
- **Preferir clones separados ou `git worktree` por conta** — é a única solução
  estrutural; o resto é disciplina, e disciplina falha. Com árvores independentes o
  único ponto de colisão é o push para `origin/main` (coberto pela regra 2). Para
  uma escrita de docs pontual: `git worktree add <caminho-temporário> main`, editar
  e commitar lá, `git worktree remove <caminho>` ao fim — a árvore principal nem
  fica sabendo.
- Nunca deixar edições não-commitadas de uma conta ao trocar de contexto.

### Reparo: commit que caiu no branch errado

Receita conferida em 2026-08-07. **Não use `git reset --hard`** — a outra conta
provavelmente tem trabalho não-commitado na mesma árvore, e `--hard` o destrói.

1. `git branch -f main <commit-intruso>` — a `main` não está em checkout, então move
   sem tocar na árvore. Só funciona se for fast-forward; se não for, use
   `cherry-pick` a partir de um worktree.
2. `git push origin main`.
3. `git reset --mixed <base-original-do-branch>` — devolve o branch da outra conta
   ao ponto de origem **sem alterar a árvore de trabalho**.
4. `git checkout <base> -- docs/system-audit/` — restaura só os documentos naquela
   árvore, deixando `src/` intocado.

Confira ao final: branch da outra conta na base original, os arquivos de código dela
ainda modificados, e `main == origin/main`.

### 5c. Mapa de árvores: uma pasta por sessão, escrito

O worktree é a solução estrutural, mas ele **só protege se cada sessão souber qual é a
sua**. Em 2026-08-08 o incidente aconteceu pela terceira vez em dois dias, e desta vez
com a diretriz sendo seguida: duas sessões estavam em árvores próprias, uma terceira foi
criada e declarada isolada — e um quarto chat entrou na mesma pasta e commitou no branch
alheio. Nada no ambiente amarra um chat a um diretório; o mapa existia só na cabeça da
Gestora. Por isso ele passa a viver aqui.

| Árvore | Sessão / uso | Observação |
|---|---|---|
| `C:\DevGeral\Projects\BPlenHUB` | árvore principal, fica em `main` | referência e leitura; merges locais saem daqui |
| `C:\DevGeral\Projects\BPlenHUB-exec` | chat de execução — acervo e nomenclatura | `feat/acervo-naming` |
| `C:\DevGeral\Projects\BPlenHUB-lis` | chat de execução — Área de Parceiros | criada em 2026-08-07 |
| _(sem árvore)_ | chat "Universo MentoCoach" | **pendente** — trabalho em `feat/universo-mentocoach`; precisa de árvore própria antes de voltar a editar |

**Manter esta tabela viva** é parte de abrir ou encerrar uma sessão. Linha desatualizada
aqui é pior do que linha ausente: dá falsa confiança de isolamento, que foi exatamente o
que falhou.

Regras que acompanham o mapa:

1. **Sessão nova não edita antes de ter a sua árvore.** Criar worktree é um comando e
   leva segundos; recuperar commit no branch errado levou um reparo de quatro passos com
   verificação byte a byte.
2. **Declarar a pasta na primeira mensagem de trabalho** — a sessão diz em qual árvore
   está, e a Gestora confere contra esta tabela. É a única checagem que não depende de
   ninguém lembrar da diretriz.
3. **Não confie no nome do chat para saber o que ele toca.** O chat que causou o
   incidente se chamava "Planejamento conceitual" e estava criando módulo e alterando
   cinco interfaces em `src/`. Papel declarado e papel exercido divergem; o que vale é o
   que está no disco.
4. **`git worktree list` é a fonte de verdade**, não esta tabela. A tabela diz a
   *intenção*; o comando diz o *fato*. Divergiu, o fato ganha e a tabela se corrige.

## 5. Cadência recomendada

- Execução trabalha em blocos (branch → entrega → LOG/BUGS).
- Planejamento reconcilia **após** cada bloco/onda de entregas, não em paralelo.
- Assim as janelas de escrita na `main` não se sobrepõem, e o estado agregado
  fica sempre atrás de um único reconciliador.
