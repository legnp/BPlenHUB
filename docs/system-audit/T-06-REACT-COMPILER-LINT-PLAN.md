# T-06 — Correção dos 16 erros de lint do React Compiler

**Status:** Aberto. Nenhuma onda executada.
**Aberto em:** 2026-08-06
**Última atualização:** 2026-08-06

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

### 6.1. `src/app/admin/partners/page.tsx:40`

Situação: `useEffect(() => { loadPartners(); }, [])` com `loadPartners` declarada
logo abaixo, no corpo do componente.

Correção: envolver `loadPartners` em `useCallback` e declará-la antes do efeito,
ou mover o corpo da função para dentro do próprio efeito.

**ARMADILHA CRÍTICA:** se `loadPartners` for adicionada ao array de dependências
**sem** `useCallback`, ela é recriada a cada render e o efeito entra em **loop
infinito de requisições** ao backend (`getPartnersAction`). Este é o modo de falha
mais comum desta correção específica. Validar abrindo a página de admin de
parceiros e confirmando no painel de rede do navegador que há **uma** chamada, não
um fluxo contínuo.

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

### 6.3. Definição de pronto da Onda 1

- `npx eslint` reporta **10 erros** (16 menos 6).
- `npm run test` continua com 485 passando.
- `npm run build` conclui com sucesso.
- Página de admin de parceiros carrega e faz uma única requisição.
- Efeito de confete validado visualmente na jornada.

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

Correção correta: `// eslint-disable-next-line react-hooks/preserve-manual-memoization`
acompanhada de comentário justificando, no mesmo espírito do override que
`eslint.config.mjs` já mantém para `scripts/` e `templates/`.

**Reavaliar quando:** o React Compiler for habilitado em `next.config.ts`. Nesse
dia, a supressão deve ser removida e a memoização manual reavaliada de verdade.

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

### 8.2. `src/components/hub/MemberJourneyHero.tsx:34`

Situação: efeito com dependências `[progress, stages]` que ressincroniza
`activeStageId` para `progress.lastActiveStepId`, ou para `stages[0].id` quando
não há progresso.

Efeito colateral atual: sempre que `progress` muda de identidade (por exemplo, ao
chegar atualização de dados), a seleção manual de estágio feita pelo usuário é
desfeita e volta para `lastActiveStepId`. Corrigir elimina esse salto — comportamento
observável que pode surpreender quem já se acostumou.

Atenção: `stages` chega assíncrono via `useJourney`. O valor inicial de
`activeStageId` é a string fixa `"onboarding"`. Qualquer correção precisa
preservar o comportamento de assumir o primeiro estágio quando a lista carrega.

### 8.3. `src/app/hub/journey/[stepId]/page.tsx:37` e `:55`, `src/app/admin/marketing/page.tsx:92`

Ainda não analisados em profundidade. Antes de corrigir, ler o efeito completo e
classificar em qual dos padrões acima se encaixa (semeadura a partir de dado
assíncrono, ou sincronização de prop para estado local).

### 8.4. Definição de pronto da Onda 3

- `npx eslint` reporta **0 erros**.
- `npm run check` completo passa de ponta a ponta, cumprindo a regra #5.
- Existe teste cobrindo o autopreenchimento a partir do `masterCvData` e a
  restauração a partir de `value` em pelo menos um campo `Cv*`.
- Validação manual: formulário de currículo preenche, salva, restaura e não
  apaga digitação em andamento.

---

## 9. Como validar cada entrega

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
| 1 — purity + immutability | 6 | Aberta | — | — |
| 2 — memoização (suprimir) | 1 | Aberta | — | — |
| 3 — set-state-in-effect | 9 | Aberta | — | — |
