# Workspace_Global — Espelhamento do Acervo do Usuario

Todo dado gerado pelo contato do usuario com a plataforma tem contrapartida na
pasta dele no workspace. O default e **gravar**; nao gravar e a excecao, e
excecao precisa de decisao registrada.

## Por que este documento existe

A regra ja estava escrita: `SURVEY_GLOBAL.md` manda "manter sincronia obrigatoria
entre Firestore e Drive". Mesmo assim, 18 dos 26 surveys do sistema nunca
chegaram ao acervo — entre eles os modulos de Carreira e PDI inteiros.

A causa nao foi desconhecimento da regra. Foi a falta de um contrato concreto: a
gravacao dependia de uma allowlist manual por `surveyId`, quem nao estivesse nela
caia num `default` que so logava um aviso, e nada no processo obrigava a
inclusao. O dado ficava integro no banco, o envio aparecia como concluido, e a
ausencia era silenciosa.

Diretriz sem mecanismo de verificacao nao se sustenta. O que segue e o
mecanismo.

## Principio

O acervo e a **estrategia de backup independente da plataforma**. Ele existe para
o caso de o banco nao estar disponivel, para auditoria, e para devolver ao membro
o que e dele. Isso define as decisoes abaixo: historico acumula, dado nao e
resumido na saida, e falha de gravacao nunca e silenciosa no log.

## Taxonomia de pastas

Constantes em `src/lib/drive-utils.ts` (`DRIVE_FOLDERS`). Nunca escrever o nome
literal da pasta.

| Pasta | Conteudo |
|---|---|
| `0.Acompanhamento` | series temporais: acessos, jornada, preferencias |
| `1.Identidade` | foto de perfil e identidade visual |
| `2.Cadastro` | dados cadastrais |
| `3.Surveys` | respostas de pesquisas e formularios |
| `4.Resultados` | resultados e devolutivas |
| `5.Documentos` | documentos com valor probatorio e anexos |
| `6.Financeiro` | extratos |

**Sempre resolver a pasta com `getStandardFolderWithHealing`**, passando os nomes
legados. Usar `ensureFolder` com nome literal recria a pasta antiga que outro
fluxo acabou de curar, e o acervo do mesmo membro se parte em duas pastas — foi
o que aconteceu com contratos, foto de perfil, uploads e devolutiva DISC.

## Documento ou planilha

**Documento** (arquivo proprio) para **ato pontual com valor probatorio**:
contrato, aceite de termos, aceite de cupom. Um arquivo por ato, com carimbo de
tempo no nome. Nunca sobrescrever — reaceite gera documento novo, senao a trilha
que a LGPD pede desaparece.

**Planilha com linha anexada** para **serie que evolui**: respostas, acessos,
preferencias, financeiro, tarefas. `appendDataToSheet`.

**Snapshot que sobrescreve** so quando o dado **e estado, nao evento**. Hoje o
unico caso legitimo e o progresso da jornada. Resposta de survey e evento: cada
envio e um fato distinto, e tratar como estado ja apagou historico (BUG-110).

## Regras de escrita

1. **Anexar, nao sobrescrever.** Ver acima.
2. **Colunas derivam da definicao, nao da mao.** Cabecalho escrito campo a campo
   quebra em silencio quando o campo e renomeado: a coluna vira `"N/A"` e ninguem
   percebe (BUG-109). Usar `buildGenericSurveyRow` ou equivalente.
3. **Ordem de colunas estavel entre envios.** O cabecalho e escrito no primeiro
   envio e nunca mais; se a ordem variasse, a linha 3 nao significaria o mesmo
   que a linha 2. Campo nao respondido vira celula vazia, nao coluna ausente.
4. **Notacao A1 acima de 26 colunas.** Usar `columnLetter`. O calculo ingenuo
   (`String.fromCharCode(64 + n)`) devolve `"["` na 27a coluna e o Sheets recusa
   o range inteiro.
5. **Fail-soft.** Falha no espelhamento nunca derruba a operacao que ja gravou no
   banco. Capturar, logar com contexto, seguir.
6. **Fora do caminho critico.** Usar `after()` do `next/server`. Uma gravacao no
   acervo custa varias chamadas de API; o usuario nao pode esperar por isso num
   gate, num banner ou no login.
7. **Idempotencia do retroativo.** A chave e o carimbo de tempo na coluna A
   (`skipIfFirstColumnMatches`). A verdade sobre o que ja foi gravado e a propria
   planilha, nao uma marca no banco.
8. **Data original na retroacao.** Passar o `submittedAt` real. Uma planilha
   dizendo que tudo foi respondido no dia do resgate e um historico falso.

## Identidade

**Nunca cunhar matricula por causa de espelhamento.** Usar
`findMatriculaByIdentity` (read-only). Quem inaugura conta e o aceite de termos,
via `resolveUserIdentity`; nenhum outro registro tem esse poder. Cunhar a partir
de um clique em banner ou de telemetria encheria a base de identidades fantasma.

Sem matricula resolvida, o registro simplesmente nao acontece — e isso e um
resultado valido, nao um erro.

## Toda categoria nova precisa de dois caminhos

1. **Gancho para frente** — grava sozinho a partir do deploy.
2. **Caminho retroativo** — resgata o que ja existe no banco, exposto na aba
   `Pessoas > Acervo` (`src/actions/admin/backfill-drive.ts`).

Entregar so o primeiro deixa um passivo invisivel, que e exatamente a situacao
que originou este documento.

## Checklist para nova coleta de dados

Antes de considerar pronta qualquer feature que grave dado do usuario:

- [ ] O dado tem contrapartida no acervo? Se nao, a excecao esta registrada e
      aprovada?
- [ ] A pasta foi resolvida por `getStandardFolderWithHealing`?
- [ ] Documento ou planilha, conforme a natureza do dado?
- [ ] Anexa em vez de sobrescrever?
- [ ] As colunas derivam da definicao?
- [ ] Roda em `after()` e e fail-soft?
- [ ] O caminho retroativo foi incluido na aba Acervo?
- [ ] Nenhum nome de infraestrutura vazou para a interface do cliente (regra 6 do
      `CLAUDE.md`)?

## Fora do espelhamento por decisao

Registrado aqui para nao ser reaberto como se fosse esquecimento:

- **Preferencia de cookies de visitante anonimo** — decisao da Gestora
  (2026-08-03): registrar apenas usuario identificado, para nao criar registro de
  quem nunca abriu conta. Visitante segue so em `localStorage`.
- **Historico de acessos anterior ao deploy** — nunca existiu serie a resgatar; o
  `_AuthMap` guardava so o ultimo login.

## Pendencias conhecidas

Estado em 2026-08-05. Manter esta secao viva.

Separadas pelo criterio que importa na priorizacao: **sem fluxo** gera passivo
novo todo dia; **sem retroativo** e estatico.

### Sem fluxo (dado de hoje ainda nao chega ao acervo)

- **Area de Parceiros** (`Partner_Consent`, `Partner_Referrals`,
  `Partner_Billing_Cycles`): a sessao que desenvolve a area fecha isso ao
  concluir, seguindo este documento.
- **Agendamentos** (`User_Bookings`, `Booking_Proposals`,
  `User_Booking_History`): adiado para evitar colisao com o trabalho de agenda
  em andamento.

### Retroativo dispensado por decisao

Decisao da Gestora (2026-08-05): nao executar o resgate na base restante — nao ha
dado relevante a refletir para os membros efetivamente ativos. O caminho
retroativo continua disponivel na aba `Pessoas > Acervo` caso mude.

### Outros

- **Resgate complementar nao e idempotente**: `triggerRetroactiveDriveSyncAction`
  anexa sem checar o que ja existe, entao reexecutar duplica extrato financeiro e
  backlog (a jornada escapa, por ser snapshot). Viola a regra 7 acima. A
  ferramenta e anterior a este documento.
- **Pastas partidas**: membros antigos podem ter `2.Documentos` e `5.Documentos`
  ao mesmo tempo. A cura so renomeia a legada quando a padrao ainda nao existe,
  entao com as duas presentes o conteudo antigo fica orfao. Ajuste manual da
  Gestora.
- **Handlers curados**: 8 surveys tem handler proprio que grava um subconjunto
  dos campos MAIS os scores calculados (totais e percentuais) — dado derivado que
  o registro generico nao produz. Nao podem ser simplesmente aposentados: a fase
  de curadoria e de FUSAO, nao de substituicao.
- **Sem matricula, sem espelhamento**: chamado aberto por quem ainda nao tem
  matricula cai em `_SupportTickets/{uid}` e nao tem pasta de destino. Mesma
  natureza do visitante anonimo.
