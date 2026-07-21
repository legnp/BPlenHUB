# Roteiro de Validação — Reabertura do T-02 (segurança) + BUG-099

Roteiro para a **Gestora** validar em produção o conjunto de mudanças entregue entre
2026-07-19 e 2026-07-20. Escrito porque foram **9 PRs em áreas sensíveis** (identidade,
cotas, agenda, surveys), e o risco de regressão silenciosa é real.

**Como usar:** siga na ordem. A Parte 1 é a mais importante — ela verifica que **nada
quebrou**. A Parte 2 verifica que as **correções funcionam**. Cada item diz o que fazer,
o que esperar, e o que significa se der errado.

**Por que tudo é em produção:** telas logadas não autenticam no preview da Vercel
(`BUG-030`, risco aceito). Não há como validar isso antes do deploy.

---

## O que foi entregue (contexto)

| PR | Entrega | Risco de regressão |
|---|---|---|
| #121 | `BUG-099` — parada da jornada mostra o agendamento | Médio (3 telas) |
| #122 | Cotas: guard sem quebrar o pagamento | **Alto** (webhook MP) |
| #123 | PII: DISC/PDI/surveys só do dono | **Alto** (dashboard do membro) |
| #124 | **CRÍTICO** — sequestro de conta por e-mail | **Alto** (login/identidade) |
| #125 | Fonte única de identidade + `BUG-107` | **Alto** (surveys) |
| #126 | Superfície por sessão + pasta de anônimos | **Alto** (motor de survey) |
| #127 | Guard no pós-evento | Médio (admin) |
| #128 | Seeds fora da rede | Baixo |
| #129 | Efeitos fora da rede + teste de superfície | Médio |

---

## PARTE 1 — Nada pode ter quebrado

Esta parte é a que importa. Se algum item falhar, **pare e me avise** antes de seguir.

### 1.1 Login e identidade (o mais crítico)

O PR #124 mudou **de onde vem o e-mail que identifica o usuário**. É o ponto de maior risco.

1. Faça **logout** e **login** de novo com sua conta.
2. Confirme que entrou no hub e que seu **nome/apelido** aparece certo no header.
3. Confirme que o **número da matrícula** aparece certo no menu sanduíche.

**Esperado:** tudo normal, como antes.
**Se falhar:** identidade não está resolvendo — é o mais grave. Me avise imediatamente.

### 1.2 Dashboard do membro (resultados)

O PR #123 travou a leitura de DISC, Gestão de Tempo, Aprendizado e Reconhecimento.

1. Abra o hub do membro.
2. Confirme que os **gráficos e resultados** aparecem (DISC, Tríade, etc.).

**Esperado:** os mesmos resultados de antes.
**Se falhar (resultados vazios):** a trava está barrando o próprio dono — erro no meu guard.

### 1.3 Devolutiva no admin

Mesmo PR, caminho do admin (você lendo o resultado de **outro** membro).

1. Entre no `/admin`, abra a **Devolutiva Comportamental** de um membro.
2. Confirme que os resultados dele aparecem.

**Esperado:** normal.
**Se falhar:** o "ou-admin" da trava não está funcionando.
**Atenção especial:** confirme que aparece o resultado **daquele membro**, não o seu. Foi
um risco que identifiquei ao escrever o fix.

### 1.4 Survey e formulário (motor de jornada)

Os PRs #125/#126 mudaram como o motor de survey resolve identidade. **Este é o de maior
superfície.**

1. Abra uma parada de jornada que tenha **survey** ou **formulário**.
2. Confirme que a tela carrega (não fica em "Sincronizando banco de dados...").
3. **Responda e envie** um survey qualquer.
4. Confirme que gravou (a tela muda para "Respostas Salvas!" / conclusão).

**Esperado:** fluxo normal.
**Se falhar:** o `resolveOwnIdentityAction` não está resolvendo a matrícula.

### 1.5 Geração de contrato (PDF)

O PR #129 colocou trava no `generateContractPdf`.

1. Abra `/hub/membro/contratos`.
2. Abra o **documento** de um contrato existente.

**Esperado:** o PDF abre normalmente.
**Se falhar:** a trava está barrando o dono.

### 1.6 Pós-evento no admin (fechar sessão)

O PR #127 colocou `requireAdmin` no fechamento de evento e presença.

1. No `/admin/agenda`, abra um evento e use o **fluxo de pós-evento**.
2. Marque presença de um participante e salve.

**Esperado:** salva normalmente (você é admin).
**Se falhar:** o guard está barrando o admin — erro meu.

### 1.7 Página pública de convite

O PR #128 moveu o seed do convite.

1. Abra `bplen.com/convites/pre_inauguracao` (pode ser **deslogada**).

**Esperado:** a página do convite carrega normalmente.
**Se falhar:** a página quebrou ao perder o seed automático.

---

## PARTE 2 — As correções funcionam

### 2.1 `BUG-099` — agendamento confirmado na parada ✅ JÁ VALIDADO

Você já confirmou (print de 20/07): a parada "Devolutiva do Plano" mostra a sessão de
30/06 sob o cabeçalho **"Sessão realizada"**. **Nada a fazer.**

### 2.2 `BUG-107` — feedback de visitante NÃO LOGADO

**Este nunca funcionou.** Antes o visitante recebia "Falha ao registrar sua avaliação".

1. Abra uma **janela anônima** (ou faça logout).
2. Vá em `bplen.com/conteudo`.
3. Use o card de **avaliação de conteúdo** e envie uma nota.
4. Repita em `bplen.com/conteudo/artigo/{qualquer-artigo}`.

**Esperado:** envio bem-sucedido, sem mensagem de erro.
**Como confirmar de verdade:** me avise que enviou — eu confiro na base se o registro caiu
em `User/BP-ANON`. Antes desta correção, a base tinha **zero** registros anônimos.

### 2.3 Pasta única de anônimos

Consequência do PR #126. Depois que você fizer o teste 2.2, os envios anônimos passam a se
concentrar em **uma pasta só** (`User/BP-ANON`), em vez de criar uma pasta por envio.

**Nada a fazer agora** — é a base para a análise de personas que você descreveu. Eu confiro
na base depois do seu teste.

---

## PARTE 3 — O que NÃO dá para validar agora

### 3.1 Cotas após compra (PR #122) — depende da limpeza da base

**Este é o item de maior risco que eu não consigo testar sozinho** (não há como disparar um
pagamento real do Mercado Pago).

Já está registrado na fila pós-limpeza do `F1-02`. Quando a base do usuário de teste for
limpa:

1. Ative um serviço **grátis** (preço 0 ou cupom de 100%).
2. Confira se a **cota apareceu na carteira** do membro.

Isso exercita o **mesmo** `grantServiceEntitlement` do webhook do Mercado Pago.

**Por que importa:** se eu errei, o cliente paga e **não recebe a cota**, em silêncio (a
chamada vive num `try/catch` que só faz `console.error`).

### 3.2 O que já foi feito e não precisa de você

- **Normalização de chaves de cota** (`BUG-008`): executei em 20/07. 3 carteiras
  normalizadas, backups em `scratch/quota-key-backups/`, reexecução confirma 0 restantes.

---

## PARTE 4 — Pendências que ficaram abertas (decisão sua)

Nenhuma destas quebra nada hoje; são decisões que eu não podia tomar.

| Bug | O que é | O que preciso de você |
|---|---|---|
| ~~**`BUG-108`** (Alto)~~ **CORRIGIDO (PR #135)** | Convite aceita `matricula` do cliente sem vincular ao token — escrita em subcoleção de qualquer membro + vetor de e-mail | **Decidido (Opção B) e implementado:** identidade pela sessão verificada + token exige `claimedBy` da sessão. **Validação visual:** responder um convite de ponta a ponta (token → login → survey → envio) e confirmar que grava e o e-mail chega |
| ~~**`BUG-101`** (Médio)~~ **CORRIGIDO (PR #133)** | Ata some do agendamento se enviada **depois** de fechar o participante. 1 de 7 afetado (BP-005) | **Validação visual:** abrir a Gestão de Agenda do BP-005 e confirmar que a Devolutiva de 16/06 agora mostra o botão **ATA** (o doc foi reconciliado). Fechamentos futuros ficam independentes de ordem |
| **`BUG-104`** (Médio) | Editar cota no painel **soma** em vez de definir — salvar 2× dobra | Confirmado por você que é parcialmente intencional; falta implementar |
| **`BUG-105`** (Baixo) | Pré-Análise Comportamental é coletada e **nunca exibida** | Construir a devolutiva ou aposentar o instrumento |
| ~~**`BUG-100`** (Médio)~~ **CORRIGIDO (PR #134)** | `StepRenderer` chama hooks depois de early return — crash latente | **Validação visual:** navegar entre paradas travadas e disponíveis de uma jornada sem a tela quebrar. Parada travada segue com 0 leitura de agenda (custo de cota inalterado) |
| Tokens de teste | 10 `BPL-INV-TEST*` com convidados fictícios em produção | Sair ou ficar? É F4-02 |

**Atualização (2026-07-20):** o `BUG-108` foi corrigido (PR #135, deploy `success`) — era o **último
bloqueador**. Com ele fechado e após reconciliar `BUG-102`/`BUG-103`/`BUG-107` (docs estavam
defasados), o **T-02 volta a FECHADO**, agora conferido por PADRÃO via a invariante executável
`server-action-surface.test.ts` — não mais bug a bug (a falha de método que originou a reabertura).

---

## Resumo do que a varredura achou e corrigiu

| | Antes | Depois |
|---|---|---|
| Funções expostas na rede | 177 | 160 |
| Sem guard | **57** | 24 |
| Sem guard **e sem motivo registrado** | 57 | **0** |

Buracos reais fechados em produção: concessão de crédito sem autenticação, leitura do
material psicométrico de qualquer membro, **tomada de conta por e-mail digitado (Crítico)**,
cunhagem de matrícula em série, fechamento de evento e escrita na carreira de qualquer
membro, e disparo de efeitos de survey em conta alheia.

A partir do PR #129, uma **action nova sem guard quebra o teste** antes de virar bug — a
conferência deixou de depender de alguém reler uma lista.
