# T-06 — Correção dos 16 erros de lint do React Compiler

**Status:** Ondas 1, 2, 3A e 3B concluídas. **Restam 3 erros**, ambos em frentes que exigem aprovação do Gestor (3C e 3D).
**Aberto em:** 2026-08-06
**Última atualização:** 2026-08-06 — 3B concluída: os 5 campos `Cv*` corrigidos, com 25 testes novos. Ver 8.1.

---

## 1. Por que este documento existe

A regra inegociável #5 do `CLAUDE.md` exige que `npm run check` passe antes de
considerar qualquer coisa pronta. **Hoje ela não é cumprida:** o comando para no
primeiro estágio (`lint`) com 16 erros, e os estágios de teste, tipos e build nem
chegam a rodar quando invocados por ele.

Este plano existe para que a correção seja retomável entre sessões sem
redescobrir contexto, sem repetir análise e sem quebrar o produto.

## 2. Estado medido

Medido em 2026-08-06, na `main` em `07e60bb`, com Node v24.19.0 e npm v11.17.0.

| Verificação | Comando | Resultado |
| --- | --- | --- |
| Lint | `npx eslint` | **16 erros**, 217 avisos, 90 arquivos |
| Testes | `npm run test` | 485 passando, 51 arquivos, ~8s |
| Tipos | `npm run type-check` | limpo |
| Build | `npm run build` | sucesso, ~29s |
| Conjunto | `npm run check` | **falha no lint**, não avança |

Para reproduzir o inventário exato de erros:

```
npx eslint --format json
```

O build **não** roda o lint (`next.config.ts` não configura ESLint no build), por
isso a publicação na Vercel não está bloqueada por este débito. Nada está quebrado
em produção por causa destes 16 itens.

## 3. Dois fatos que condicionam todo o plano

### 3.1. O React Compiler NÃO está habilitado

`next.config.ts` não contém `reactCompiler`. As regras `react-hooks/*` que geram
estes erros vêm do pacote `eslint-config-next` 16 e estão avisando sobre um
compilador que não está compilando nada.

Consequência prática: a correção canônica de `preserve-manual-memoization` —
remover a memoização manual e deixar o compilador assumir — **causaria regressão
real de performance** neste projeto. Ver Onda 2.

### 3.2. Nenhum arquivo afetado tem cobertura de teste

Verificado nos 41 arquivos de `__tests__/`: não há teste para `Cv*`,
`ConfettiCheckbox`, `MemberJourneyHero`, `admin/partners` ou `admin/marketing`.
Os testes `journey-*.test.ts` cobrem adaptadores e lógica de audiência, **não**
estes componentes.

Consequência prática: os 485 testes que passam **não são rede de segurança para
esta correção**. Qualquer regressão introduzida aqui passa despercebida pela
suíte. Por isso a Onda 3 exige escrever teste antes de tocar no código.

## 4. Restrições de processo (herdadas do CLAUDE.md)

1. **Branch própria + Pull Request, nunca commit direto na `main`.** Limpeza de
   débito técnico é explicitamente citada como código de produto no "Fluxo de
   entrega". A exceção de commit direto vale só para infraestrutura de
   governança de baixo risco, o que **não** é o caso destas correções.
2. **`SurveyEngine.tsx` é god file.** Se a correção dos campos `Cv*` exigir mudar
   como o `SurveyEngine` passa a prop `value`, isso dispara a regra "Antes de
   mudanças não-triviais": apresentar plano e aguardar aprovação explícita do
   Gestor antes de implementar.
3. **Zero Emoji** (regra #2) e **Zero Any** (regra #1) continuam valendo em todo
   código novo escrito aqui.
4. **Não deixar `console.log` de depuração** no código entregue.

## 5. Inventário dos 16 erros

| # | Regra | Arquivo:linha | Onda |
| --- | --- | --- | --- |
| 1 | `react-hooks/immutability` | `src/app/admin/partners/page.tsx:40` | 1 |
| 2 | `react-hooks/purity` | `src/components/journey/ConfettiCheckbox.tsx:164` | 1 |
| 3 | `react-hooks/purity` | `src/components/journey/ConfettiCheckbox.tsx:166` | 1 |
| 4 | `react-hooks/purity` | `src/components/journey/ConfettiCheckbox.tsx:168` | 1 |
| 5 | `react-hooks/purity` | `src/components/journey/ConfettiCheckbox.tsx:183` | 1 |
| 6 | `react-hooks/purity` | `src/components/journey/ConfettiCheckbox.tsx:188` | 1 |
| 7 | `react-hooks/preserve-manual-memoization` | `src/components/hub/MemberJourneyHero.tsx:41` | 2 |
| 8 | `react-hooks/set-state-in-effect` | `src/components/forms/SurveyFields/CvBusinessCardGenerator.tsx:59` | 3 |
| 9 | `react-hooks/set-state-in-effect` | `src/components/forms/SurveyFields/CvContactFilter.tsx:65` | 3 |
| 10 | `react-hooks/set-state-in-effect` | `src/components/forms/SurveyFields/CvEducationFilter.tsx:50` | 3 |
| 11 | `react-hooks/set-state-in-effect` | `src/components/forms/SurveyFields/CvExperienceFilter.tsx:51` | 3 |
| 12 | `react-hooks/set-state-in-effect` | `src/components/forms/SurveyFields/CvResumoEditor.tsx:29` | 3 |
| 13 | `react-hooks/set-state-in-effect` | `src/components/hub/MemberJourneyHero.tsx:34` | 3 |
| 14 | `react-hooks/set-state-in-effect` | `src/app/hub/journey/[stepId]/page.tsx:37` | 3 |
| 15 | `react-hooks/set-state-in-effect` | `src/app/hub/journey/[stepId]/page.tsx:55` | 3 |
| 16 | `react-hooks/set-state-in-effect` | `src/app/admin/marketing/page.tsx:92` | 3 |

Números de linha valem para a `main` em `07e60bb`. Se divergirem, reconfirmar com
`npx eslint --format json` antes de editar.

---

## 6. Onda 1 — risco baixo, isolados (6 erros)

**Branch sugerida:** `fix/lint-onda-1-purity-immutability`

### 6.1. `src/app/admin/partners/page.tsx` — RECLASSIFICADO PARA A ONDA 3

**Diagnóstico original (incorreto):** o erro `react-hooks/immutability` na linha 40
parecia problema isolado de hoisting — `useEffect(() => { loadPartners(); }, [])`
com `loadPartners` declarada logo abaixo como `async function`.

**O que se descobriu ao executar:** envolver `loadPartners` em `useCallback` e
declará-la antes do efeito remove o erro de `immutability`, mas o arquivo passa a
acusar `react-hooks/set-state-in-effect` no ponto da chamada. A regra sinaliza
qualquer efeito que invoque função que escreve estado, e **não** considera a
fronteira do `await` suficiente.

O rótulo `immutability` era sintoma; a causa real é que a página busca dados
dentro de um `useEffect`. Isso é a mesma natureza dos 9 itens da Onda 3, e o
conserto que a regra pede é arquitetural: carregar os parceiros em Server
Component e passar por props, ou adotar biblioteca de data fetching. **Não é
correção de risco baixo.**

**O que foi feito e depois revertido:** a conversão para `useCallback` chegou a ser
implementada, junto com a separação entre carga inicial e recarga por ação do
usuário (`refreshPartners`, reexibindo o indicador de carregamento). Foi
**revertida**, e o arquivo está idêntico à `main`.

O motivo da reversão é instrutivo e vale registrar: o hook de pre-commit
(`husky` + `lint-staged`) **barrou o commit**, porque o arquivo continuava com um
erro de lint. O portão do próprio projeto demonstrou que a mudança não pertencia a
uma onda de risco baixo. Mantê-la exigiria `--no-verify`, o que desligaria a
proteção para todos os arquivos do commit — preço alto por uma alteração que não
reduzia a contagem de erros.

Aprendizado para as próximas ondas: **só entra no commit arquivo que sai com zero
erros.** Arquivo que continua com erro depois da correção deve ser revertido e
tratado na onda apropriada, nunca commitado com bypass.

**ARMADILHA que segue valendo para a Onda 3:** se `loadPartners` for adicionada ao
array de dependências **sem** `useCallback`, ela é recriada a cada render e o
efeito entra em **loop infinito de requisições** ao backend (`getPartnersAction`).
Validar abrindo a página de admin de parceiros e confirmando no painel de rede do
navegador que há **uma** chamada, não um fluxo contínuo.

### 6.2. `src/components/journey/ConfettiCheckbox.tsx` (5 erros)

Situação: `Math.random()` é chamado durante o render, dentro do `.map()` que
desenha as partículas. Linhas 164, 166 e 168 calculam `angle`, `speed`, `targetX`
e `targetY`; linha 183 calcula a rotação final; linha 188 calcula `duration`.

Correção: mover toda a aleatoriedade para o momento de **criação** da partícula
(onde o array `particles` é populado, no handler do clique) e guardar os valores
já sorteados como campos do objeto `particle`. O `.map()` passa a apenas ler
`particle.targetX`, `particle.targetY`, etc.

**EFEITO VISUAL ESPERADO E ACEITÁVEL:** hoje cada re-render re-sorteia o destino
de partículas que já estão no ar, e o framer-motion as redireciona no meio do voo.
Depois da correção cada partícula segue trajetória fixa desde o nascimento. O
efeito continua funcionando, mas **fica visivelmente diferente** — mais estável,
sem trepidação, e com ritmo constante (hoje `duration` oscila a cada render).
Isto é o conserto correto, não uma regressão. Ainda assim, validar visualmente e
confirmar com o Gestor se a nova aparência agrada, já que é elemento de interface.

### 6.3. Definição de pronto da Onda 1 — ATINGIDA

Resultado real, medido em 2026-08-06:

- `npx eslint` reporta **11 erros** (16 menos 5). A meta original era 10; a
  diferença é o `admin/partners` reclassificado em 6.1.
- `npm run test`: 485 passando, sem alteração.
- `npm run type-check`: limpo.
- `npm run build`: sucesso.
- **Validação visual do confete: aprovada pelo Gestor** em 2026-08-06, em
  ambiente local. A nova aparência (trajetórias fixas, sem redirecionamento em
  voo) foi considerada correta.

---

## 7. Onda 2 — não corrigir, documentar (1 erro)

**Pode ir junto com a Onda 1 na mesma branch.**

### 7.1. `src/components/hub/MemberJourneyHero.tsx:41`

Situação: `useMemo` que constrói `stepStatusMap` via
`Object.fromEntries(Object.entries(progress.steps).map(...))`, com dependência
`[progress?.steps]`. O comentário no código registra que a memoização foi
deliberada, para "evitar re-cálculos caros no render".

**NÃO REMOVER O `useMemo`.** Como o React Compiler não está habilitado (ver 3.1),
não há nada que assuma o lugar da memoização manual. Removê-la faria o
`Object.fromEntries` rodar em todo render de um componente usado na Home do HUB e
na Área de Membro — regressão real de performance, em nome de satisfazer uma
regra que fiscaliza um compilador desligado.

**RESOLVIDO EM 2026-08-06 — e sem supressão.** O plano previa
`eslint-disable-next-line` com justificativa. Antes de recorrer a isso, testou-se
o conserto real, que funcionou: a regra reclamava do optional chaining
`progress?.steps` usado como dependência do `useMemo`. Extrair para uma const
local resolve, mantendo a memoização e sem alterar comportamento:

```ts
const steps = progress?.steps;
const stepStatusMap = useMemo(() => {
  if (!steps) return {};
  return Object.fromEntries(
    Object.entries(steps).map(([k, v]) => [k, v.status])
  );
}, [steps]);
```

**Aprendizado para a Onda 3:** antes de suprimir uma regra do React Compiler,
verificar se ela não está apontando para um detalhe de escrita — optional chaining
em dependência, expressão complexa no array de deps — que tem conserto trivial e
sem risco. A supressão é último recurso, não primeiro.

---

## 8. Onda 3 — risco alto, uma de cada vez (9 erros)

**Branch sugerida:** uma por lote, não tudo junto.
**Pré-requisito obrigatório:** escrever teste antes de tocar no código (ver 3.2).

### 8.1. O padrão compartilhado dos 5 campos `Cv*`

Os cinco campos seguem a mesma estrutura: um `useEffect` com dependências
`[value, masterCvData]` que semeia até nove estados locais de uma vez.

Referência concreta (`CvBusinessCardGenerator.tsx`, linhas 57-78): se `value`
existe, restaura `skipCard`, `name`, `pitch`, `phone`, `email`, `linkedin`,
`website`, `visibleFields`, `theme` e `qrTarget`; senão, se `masterCvData` existe,
prefila `name`, `phone`, `email`, `linkedin` e `website` a partir do Master CV.

**RISCO 1 — perder o autopreenchimento do Master CV (modo de falha mais
provável).** `masterCvData` chega de forma assíncrona; na primeira renderização
ele é `undefined`. Uma "correção" que use inicializador de `useState` captura esse
`undefined` e o prefill **nunca acontece**. Sintoma: o usuário abre o formulário
de currículo e encontra campos vazios em vez dos dados já cadastrados. Falha
silenciosa, sem erro no console.

**RISCO 2 — inverter o comportamento de sobrescrita.** Se o `SurveyEngine` recria
o objeto `value` a cada render, o efeito hoje re-dispara e sobrescreve o que o
usuário está digitando. Corrigir isso muda comportamento observável, e
provavelmente conserta um bug latente. Porém: se algum fluxo reaproveita o mesmo
componente ao trocar de etapa contando com esse reset, a etapa nova passaria a
exibir dados da anterior. Se for o caso, a solução é forçar remontagem via `key`
no ponto de uso, **não** manter o efeito.

**RISCO 3 — `visibleFields` é objeto aninhado**, protegido por
`if (value.visibleFields)`. Perder esse guard faz campos que o usuário
deliberadamente ocultou reaparecerem no cartão gerado.

**RISCO 4 — `triggerChange` lê os estados via closure** para propagar de volta ao
`SurveyEngine`. Mudar a forma como o estado é derivado afeta o que é propagado.
Conferir que o payload enviado continua idêntico.

**Ordem sugerida:** corrigir **um** campo `Cv*` isoladamente, validar à mão no
navegador (abrir o formulário com Master CV preenchido, conferir prefill; salvar,
sair e voltar, conferir restauração), e só então replicar o padrão validado nos
outros quatro.

### 8.1.1. RESOLVIDO EM 2026-08-06 — os cinco campos

**Padrão aplicado.** Em todos: o valor deixa de ser copiado para o estado dentro
do efeito e passa a ser **derivado** das props, com precedência
`rascunho > resposta salva > currículo mestre`. O estado local (`rascunho`) guarda
apenas o que o usuário alterou nesta sessão. Onde havia propagação ao motor de
formulários, o efeito permaneceu **só para isso** — sem ele o texto apareceria na
tela mas não seria gravado como resposta.

**Rede de segurança.** `@testing-library/react` foi adicionado como
devDependency; o restante da infra já existia. Foram criados **25 testes**, cinco
por campo, e todos foram escritos e validados **contra o código antigo** antes de
qualquer refatoração, para provar que mediam o comportamento certo.

**Três achados durante a execução:**

1. **Mutação de props.** `CvEducationFilter` e `CvExperienceFilter` alteravam os
   objetos no lugar dentro de uma cópia rasa do array (`updated[i].visible = ...`).
   Isso mutava também o objeto vindo da prop `value` — inofensivo enquanto o
   estado era uma cópia, mas corromperia a fonte com o estado derivado. Os toggles
   passaram a criar objetos novos.
2. **Código duplicado.** A montagem a partir do currículo mestre estava escrita
   duas vezes em `CvContactFilter` (inicializador e efeito), com risco de
   divergirem. Virou função de módulo, usada nos dois lugares.
3. **`CvBusinessCardGenerator` nunca propagou o preenchimento do mestre.**
   Diferente dos outros quatro, o ramo do currículo mestre só chamava os setters,
   sem `onChange` — o cartão aparecia preenchido mas a resposta só era gravada
   quando o usuário mexia em algo. Comportamento **preservado de propósito**, e há
   teste fixando isso para que não seja "corrigido" por engano.

**Sobre o `CvBusinessCardGenerator`:** era o mais invasivo, com nove estados
escritos de uma vez. A correção manteve os **mesmos nomes** de variáveis e
setters, trocando apenas a origem — de estado copiado para valor derivado — de
modo que as ~35 chamadas espalhadas pelo JSX seguiram inalteradas. Com a
derivação, o efeito desapareceu por completo.

**Validação manual pendente.** O Gestor não pôde validar no navegador porque o
usuário de teste já tem as etapas concluídas e não há como retroceder. Ficou
combinado que a verificação acontece no teste de ponta a ponta pós-auditoria; se
falhar, reportar e corrigir. Os 25 testes cobrem justamente o cenário que não é
reproduzível à mão: o currículo mestre chegando **depois** da tela abrir.

### 8.2. `src/components/hub/MemberJourneyHero.tsx:34` — RESOLVIDO EM 2026-08-06

Resolvido junto com a Onda 2, por necessidade: os dois erros viviam no **mesmo
arquivo**, e o `lint-staged` exige o arquivo inteiro limpo para permitir o commit.
Ver o aprendizado em 8.2.1.

**A avaliação de risco original estava errada.** O plano supunha que corrigir esse
efeito mudaria comportamento observável, desfazendo a "seleção manual de estágio
do usuário". Ao mapear o arquivo, constatou-se que `setActiveStageId` **só é
chamado dentro do próprio efeito** — nada mais no componente altera esse estado, e
o único outro uso é a leitura em `currentStepId={activeStageId}`. Não existe
seleção manual. Era estado derivado guardado em `useState` sem necessidade.

Correção aplicada: remover estado e efeito, derivando no render com a mesma
precedência do código anterior.

```ts
const activeStageId = progress?.lastActiveStepId || stages[0]?.id || "onboarding";
```

Usa `||` e não `??` de propósito, para reproduzir a semântica de veracidade do
`if` original. Ganho adicional: elimina o render inicial com `"onboarding"` que o
efeito depois corrigia num segundo passo.

### 8.2.1. Aprendizado: dividir ondas por ARQUIVO, não por regra

O plano original agrupou os erros por regra de lint. Isso quebrou na prática: o
`MemberJourneyHero` tinha um item na Onda 2 e outro na Onda 3, e como o hook de
pre-commit reprova o arquivo inteiro, a Onda 2 não podia ser commitada sozinha.

**Para o resto da Onda 3:** verificar antes quantos erros cada arquivo tem, e
tratar arquivo por arquivo até zerar. Um arquivo com erro remanescente não entra
em commit nenhum.

### 8.3. `src/app/admin/partners` — RESOLVIDO EM 2026-08-06

Ver 6.1 para o histórico da tentativa anterior, revertida.

Correção aplicada: separação em Server Component + componente cliente.

- `page.tsx` passa a ser Server Component: chama `getPartnersAction()` e entrega
  o resultado por prop.
- `PartnersClient.tsx` (o antigo `page.tsx`, movido com `git mv` para preservar
  histórico) recebe `initialPartners`, inicializa o estado com ele e mantém só a
  interatividade. `isLoading` passa a nascer `false`, porque os dados já chegam
  prontos. A recarga por ação do usuário virou `refreshPartners()`, chamada em
  `handleSave` e `handleDelete`.

**Por que foi seguro chamar a action no servidor:** `src/app/admin/layout.tsx` já
é Server Component com gate que **redireciona** sessão inválida, suspensa ou sem
papel de admin antes de renderizar os filhos. O `requireAdmin()` dentro da action
lança exceção, o que num Server Component viraria página de erro — mas isso nunca
acontece, porque ninguém sem permissão chega a renderizar a página. Verificado:
requisição sem sessão responde `307` para `/entrar?returnTo=/admin/partners`,
igual ao comportamento anterior.

Efeito colateral esperado e aceitável: a rota passa a ser renderizada
dinamicamente (usa cookies no servidor), aparecendo no build junto de
`/admin/partners-program`, que já era assim.

### 8.3.1. `src/app/admin/marketing/page.tsx:92` — BLOQUEADO, EXIGE APROVAÇÃO

Mesmo padrão de busca dentro de `useEffect`, mas **não** pode seguir o caminho de
8.3, por dois motivos:

1. **Autenticação diferente.** `fetchCoupons` faz `await user.getIdToken()` no
   cliente e passa o token para `getAdminCouponsList(token)` e
   `getAdminCouponsV2Action(token)`. Migrar para Server Component exige trocar o
   mecanismo para cookie de sessão, alterando a assinatura dessas actions.
2. **Regra do `CLAUDE.md`.** Mudanças que tocam fluxos financeiros — checkout,
   **cupons**, cotas — exigem plano apresentado e aprovação explícita do Gestor
   antes de implementar. Esta tela é a administração de cupons.

Não implementar sem passar por essa aprovação.

### 8.4. `src/app/hub/journey/[stepId]/page.tsx:37` e `:55` — EXIGE APROVAÇÃO

Analisado em 2026-08-06. **É o caso mais delicado dos nove**, e o oposto do
`MemberJourneyHero`: aqui o estado é genuinamente interativo e **não pode ser
derivado**.

`setCurrentSubStepId` é chamado pelo usuário em três pontos além dos efeitos:
- linha 152, `onSelectSubStep={setCurrentSubStepId}` — clique na navegação
- linha 175 — avanço automático após concluir um sub-passo
- linha 202 — mesmo avanço, no fluxo de onboarding

São dois efeitos entrelaçados:
- **`:37`** — reset ao trocar de `stepId`: zera `isInitialized` e `currentSubStepId`.
- **`:55`** — inicialização: quando os dados carregam, escolhe o primeiro
  sub-passo incompleto, ou o último da lista se tudo estiver concluído.

A dificuldade: a inicialização depende de dados assíncronos (`progress`,
`stepConfig`), então não cabe em inicializador de `useState` — na primeira
renderização os dados não existem.

Caminhos possíveis, a decidir no plano de aprovação:
1. Separar em componente pai que aguarda os dados e filho remontado por `key={stepId}`,
   recebendo o sub-passo inicial já resolvido por prop.
2. Padrão oficial de ajuste de estado durante o render (comparar `stepId` anterior
   com o atual e ajustar antes de renderizar), que a regra aceita por não ser efeito.

**`CLAUDE.md` exige plano aprovado** para mudanças em regras de gating de jornada.
Apresentar arquivos afetados, abordagem e riscos, e aguardar aval explícito.

### 8.5. Definição de pronto da Onda 3

- `npx eslint` reporta **0 erros**.
- `npm run check` completo passa de ponta a ponta, cumprindo a regra #5.
- Existe teste cobrindo o autopreenchimento a partir do `masterCvData` e a
  restauração a partir de `value` em pelo menos um campo `Cv*`.
- Validação manual: formulário de currículo preenche, salva, restaura e não
  apaga digitação em andamento.

---

## 9. Como validar cada entrega

### 9.1. Validação visual: usar ambiente local, não preview da Vercel

**O preview da Vercel não autentica.** Constatado em 2026-08-06: o site carrega
normalmente (variáveis de ambiente do Preview estão corretas e não há Deployment
Protection), mas o login falha. A causa é que `signInWithPopup`
(`src/hooks/use-auth.ts`) exige que a origem esteja na lista de domínios
autorizados do Firebase Auth, e essa lista é de **correspondência exata, sem
curinga**. Cada preview ganha um domínio novo derivado do nome do branch, então
nenhum deles está autorizado — e cadastrar um a um é inviável.

Consequência: **qualquer mudança que precise de validação em área logada deve ser
verificada localmente.** `localhost` já vem autorizado de fábrica no Firebase.

```
npm run dev
```

A solução durável seria um domínio fixo de preview (ex.: `preview.bplen.com`
amarrado a um branch de longa vida na Vercel, e esse host cadastrado no Firebase).
Foi avaliada e **descartada em 2026-08-06**: para validar interface, o ambiente
local resolve melhor, recarrega na hora e não depende de DNS nem de dois painéis
de configuração.

### 9.2. Comandos

```
npx eslint
npm run test
npm run type-check
npm run build
```

E, ao final da Onda 3, o conjunto:

```
npm run check
```

## 10. Escopo secundário (opcional, não bloqueia)

- **217 avisos**, majoritariamente `@typescript-eslint/no-unused-vars`, em 90
  arquivos. Não impedem `npm run check`, que só falha por erros.
- **`lint-errors.json`** (462 KB) está commitado na raiz do repositório. Verificar
  se ainda tem uso ou se virou resíduo removível.

## 11. Fora de escopo — já resolvido

Os 7 erros de `@typescript-eslint/no-require-imports` em
`templates/apresentacao-institucional/` **já foram resolvidos** no commit
`07e60bb`, estendendo o override de `eslint.config.mjs` que já existia para
`scripts/`. Eles apareceram quando `templates/` passou a ser versionada
(commit `8dfd0dc`) e não fazem parte deste plano. Não refazer.

## 12. Registro de progresso

Atualizar esta tabela ao concluir cada onda, junto com o campo "Última
atualização" no topo do documento.

| Onda | Erros | Status | Branch / PR | Concluída em |
| --- | --- | --- | --- | --- |
| 1 — purity (`ConfettiCheckbox`) | 5 | **Concluída** | `fix/lint-onda-1-purity-immutability` | 2026-08-06 |
| 2 — `MemberJourneyHero` (memoização + efeito) | 2 | **Concluída** | `fix/lint-onda-2-memoizacao` | 2026-08-06 |
| 3A — `admin/partners` para Server Component | 1 | **Concluída** | `fix/lint-onda-3a-partners-server` | 2026-08-06 |
| 3B — 5 campos `Cv*` | 5 | **Concluída** | `fix/lint-onda-3b-campos-cv` | 2026-08-06 |
| 3C — `hub/journey/[stepId]` | 2 | Aberta, **exige aprovação** | — | — |
| 3D — `admin/marketing` | 1 | Aberta, **exige aprovação** | — | — |

Contagem de erros: 16 na abertura, 11 após a Onda 1, 9 após a Onda 2, 8 após a
3A, **3** após a 3B. Testes: 485 na abertura, **510** após a 3B.

**Os 3 erros restantes estão inteiramente nas duas frentes que dependem de
aprovação do Gestor.** Nenhum trabalho de correção pode avançar sem ela.

A Onda 3 foi subdividida ao ser executada: os 9 erros não formavam um grupo
homogêneo. Duas frentes exigem aprovação do Gestor antes de implementar — 3C toca
gating de jornada, 3D toca fluxo de cupons.

Duas correções ao plano original, ambas descobertas ao executar:

1. A Onda 2 foi resolvida com conserto real, não com a supressão prevista (ver 7.1).
2. Levou junto o item `MemberJourneyHero:34`, que era da Onda 3, porque os dois
   erros dividiam o mesmo arquivo e o hook de pre-commit reprova arquivo parcial.
   A avaliação de risco daquele item também estava errada — ver 8.2 e 8.2.1.

**Restam 9 erros na Onda 3**, distribuídos assim por arquivo: 5 campos `Cv*`
(1 cada), `hub/journey/[stepId]/page.tsx` (2), `admin/marketing/page.tsx` (1) e
`admin/partners/page.tsx` (1, `immutability`).
