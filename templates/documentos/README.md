# Kit de Documentos BPlen

Sistema de templates para todo documento formal que a BPlen emite — interno,
para cliente ou para o mercado.

Este kit **nao e** o design system da area logada. Sao dois universos visuais
deliberadamente distintos: o HUB e digital, glassmorphism, Inter, acento rosa;
o documento e impresso, sobrio, serifado, petroleo e ametista. Nao importar
tokens de um para o outro.

---

## 1. Arquitetura do kit

O kit tem tres camadas. Ao criar um template novo, escreva apenas a camada 3.

| Camada | Arquivo | Papel |
| --- | --- | --- |
| 1 — Fundacao | `sistema/tokens.css` | Cor, tipografia, escala, ritmo, geometria A4. Fonte unica de verdade. |
| 2 — Chassi | `sistema/chassi-*.css` | Estrutura de pagina, cabecalho, rodape, tabelas, quadros, impressao. |
| 2 — Exportacao | `sistema/exportar.js` | Geracao de PDF, Word e HTML. Compartilhado por todos os templates. |
| 3 — Template | `<tipo>/<tipo>.template.html` | Somente conteudo e placeholders do tipo de documento. |

Todo template novo precisa de tres ligacoes com o sistema:

```html
<link rel="stylesheet" href="../sistema/tokens.css" />
<link rel="stylesheet" href="../sistema/chassi-a-encadernado.css" />
...
<body data-tipo="ATA">          <!-- sigla de tres letras do documento -->
...
<script src="../sistema/exportar.js"></script>   <!-- ultima linha do body -->
```

O `data-tipo` e o que faz o arquivo exportado sair com o nome certo. Sem ele,
um documento que cite o codigo de outro (a transcricao cita a ata a que
pertence) sai batizado com o codigo errado.

**Regra:** nenhum template declara cor ou tamanho de fonte em valor literal.
Se algo nao existe nos tokens, o token e que deve ser criado.

### Os tres chassis

| Chassi | Estrutura | Serve |
| --- | --- | --- |
| **A — Encadernado** | Capa · Folha de rosto · Miolo · Contracapa | Ata, Relatorio, Ebook, Material didatico, Plano de aula, Diagnostico, Proposta |
| **B — Papel timbrado** | Cabecalho e rodape em todas as paginas, sem capa | Contrato, Aditivo, Carta, Declaracao, Certificado, Recibo, Procuracao, Termo LGPD |
| **C — Apresentacao** | 16:9, grade de slide | Deck comercial, aula, treinamento |

Implementado ate agora: **Chassi A** e **Chassi B**. Chassi C existe hoje so
como uma instancia avulsa (`templates/apresentacao-institucional/`, gerada
via `pptxgenjs`, fora deste sistema de tokens/CSS) — ainda nao e reusavel
como os outros dois.

### Fronteira com o sistema de contrato do HUB

O Chassi B **nao e** o motor de contrato da plataforma (compra de servico
pelo checkout). Aquele e codigo de produto, com ciclo de vida proprio
(`pendente_assinatura -> assinado`), gerado em PDFKit e classificado como
**area sensivel** (financeiro + identidade + juridico) em
`docs/system-audit/CONTRACTS-DESIGN.md` — mudanca ali segue o processo de
design/aprovacao proprio daquele sistema, nao este kit. O Chassi B cobre
instrumentos formais **fora** do checkout: parceria B2B, NDA avulso, carta,
declaracao — nunca o contrato de compra do cliente final na plataforma.

---

## 2. Nomenclatura de documentos

Codigo obrigatorio em todo documento, espelhando a logica da matricula BPlen
(`BP-xxx-PF-AAMMDD`):

```
BPL-CONTEXTO-TIPO-AAMMDDHHMM[-MATRICULA]
```

- `BPL` — prefixo institucional fixo
- `CONTEXTO` — rotulo curto do tipo de encontro/interacao que originou o
  documento (ver regra de formacao abaixo). Para documentos sem encontro
  associado, o rotulo curto da natureza do servico.
- `TIPO` — sigla de tres letras do tipo de documento (ver tabela abaixo)
- `AAMMDDHHMM` — data e hora de origem do documento, sem separadores (ano com
  2 digitos, igual a convencao da matricula). Para atas e sua transcricao,
  e a data/hora de inicio do encontro; para os demais tipos, a data/hora de
  emissao do documento.
- `MATRICULA` — a matricula BPlen do cliente (`BP-xxx-PF-AAMMDD`), **apenas
  quando o documento for exclusivo de um cliente especifico** (contrato,
  proposta, certificado nominal). Omitir em documentos internos ou que
  envolvam terceiros sem matricula (parceiros, fornecedores).

Sem sequencial: o timestamp ja e unico por natureza, entao nenhum registro
externo precisa ser consultado para gerar o proximo numero.

### Regra de formacao do `CONTEXTO`

Deriva do campo que identifica o tipo de encontro (`encontro.tipo` na ata) ou
do eixo equivalente do template:

1. Minusculo.
2. Sem acento.
3. Sem espaco nem caractere especial — junta tudo.

Exemplos: `1 to 1` -> `1to1` · `Onboarding` -> `onboarding` ·
`Comite Mensal` -> `comitemensal` · `Kickoff` -> `kickoff`.

Para templates que nao nascem de um encontro (contrato, certificado), o
`CONTEXTO` reflete o eixo mais relevante daquele tipo de documento — a
definir quando o template for construido; nao ha uma unica regra universal
para todos.

Exemplos completos:
- `BPL-1to1-ATA-2607301526` — ata de um 1 a 1 em 30/07/2026 as 15:26.
- `BPL-1to1-TRC-2607301526` — a transcricao do mesmo encontro: mesmo
  `CONTEXTO`, mesmo timestamp, so a sigla `TIPO` muda.
- `BPL-onboarding-CTR-2608041000-BP-045-PF-260112` — contrato de onboarding
  emitido em 04/08/2026 as 10:00, exclusivo do cliente de matricula
  `BP-045-PF-260112`.

### Siglas

| Sigla | Documento | Chassi |
| --- | --- | --- |
| `ATA` | Ata de reuniao | A |
| `TRC` | Transcricao de encontro (anexo de ata) | A |
| `REL` | Relatorio | A |
| `PRO` | Proposta comercial | A |
| `EBK` | Ebook / material autoral | A |
| `MAT` | Material didatico / atividade | A |
| `PLA` | Plano de aula / roteiro pedagogico | A |
| `CTR` | Contrato | B |
| `ADT` | Aditivo contratual | B |
| `CAR` | Carta / oficio / comunicado | B |
| `DEC` | Declaracao | B |
| `CER` | Certificado / atestado | B |
| `REC` | Recibo | B |
| `NDA` | Termo de confidencialidade | B |
| `LGP` | Termo de consentimento de dados | B |
| `POP` | Procedimento operacional padrao | B |
| `APR` | Apresentacao | C |

### Versionamento

`v0.x` = rascunho em circulacao restrita. `v1.0` = versao valida.
`v1.1`, `v1.2` = retificacoes apos a v1.0, sempre com registro do que mudou.
Documento assinado nunca e editado: gera-se nova versao.

### Classificacao de confidencialidade

Todo documento carrega um selo. Classe define quem pode receber.

| Classe | Alcance | Classe CSS |
| --- | --- | --- |
| `PUBLICO` | Livre circulacao, inclusive externa | `cls-publico` |
| `INTERNO` | Equipe BPlen | `cls-interno` |
| `CONFIDENCIAL` | Nominalmente listados no documento | `cls-confidencial` |
| `RESTRITO` | Dados pessoais sensiveis; acesso registrado | `cls-restrito` |

---

## 3. Sistema visual

**Tipografia.** Duas familias, papeis separados e nao intercambiaveis.

- **Source Serif 4** — toda prosa: titulos, corpo, relatos, clausulas. Serifa
  leve desenhada para tela, mantem legibilidade em PDF lido no celular.
  Fallback: Source Serif Pro, Georgia, Times New Roman.
- **Inter** — dados: rotulos, tabelas, metadados, numeros, selos. E a fonte do
  HUB; amarra o documento ao produto sem quebrar a sobriedade do impresso.

Se a familia serifada nao estiver disponivel offline, o fallback Georgia
preserva a cor tipografica sem quebrar a paginacao.

**Cor.** Base sobria; a paleta viva entra em dose homeopatica.

| Papel | Token | Valor |
| --- | --- | --- |
| Tinta | `--doc-tinta` | `#0D0D0D` |
| Institucional (titulos, fios, tabelas) | `--doc-institucional` | `#044159` |
| Realce (deliberacao, indice de secao) | `--doc-realce` | `#9C389D` |
| Destaque / atencao | `--doc-ambar` | `#F2BE05` |
| Positivo / concluido | `--doc-verde` | `#3C7369` |

**Assinatura grafica.** O circulo da logomarca e o elemento proprietario do
sistema: marca d'agua sangrada na capa e contracapa, e marcador de lista no
miolo. O gradiente petroleo -> ametista aparece como fio de 2,5 mm no topo da
capa e no pe da contracapa. Nenhum outro ornamento e permitido.

---

## 3.1. Tom de voz

A BPlen e uma consultoria de **desenvolvimento humano**. O documento e serio no
conteudo e acolhedor na forma — nao e peca juridica, contabil nem de auditoria.

Escreva como quem conta a um colega o que aconteceu. Titulos e rotulos usam a
lingua que as pessoas falam, nao o jargao que os manuais usam:

| Nao usar | Usar |
| --- | --- |
| Quorum, Composicao do encontro | Quem participou |
| Deliberacao | O que ficou decidido |
| Registro dos trabalhos | Como foi a conversa |
| Plano de acao, Encaminhamentos | Nossos combinados |
| Ordem do dia | O que estava previsto |
| Responsavel, Prazo | Com quem fica, Ate quando |
| Ausencia justificada | Avisou que nao viria |
| Nota metodologica | Como esta ata foi feita |
| Anexos e documentos de referencia | Materiais de apoio |
| Encerramento | Fechamento |
| Aprovacao tacita, findo o prazo | Se algo nao bate, e so escrever pra gente |

Regras de escrita: primeira pessoa do plural quando falar da BPlen ("nos
encontramos", "combinamos"); nada de "o presente documento" ou "conforme
supracitado"; sem adjetivo de avaliacao; sem emoji; sem sigla nao explicada.
Seriedade vem da precisao dos fatos, nao da dureza do vocabulario.

---

## 4. Como usar um template

1. Duplique a pasta do tipo desejado para onde o documento sera produzido.
2. Substitua todo campo `{{ENTRE CHAVES}}` — aparecem destacados em ambar na tela.
3. Duplique blocos marcados `<!-- REPETIVEL -->` conforme a necessidade.
4. Remova blocos marcados `<!-- OPCIONAL -->` que nao se apliquem.
5. Em instrumentos do Chassi B, decida os blocos marcados
   `<!-- CONDICIONAL -->` (caixa tracejada ambar na tela, some na impressao):
   diferente do OPCIONAL, aqui a escolha muda o sentido juridico do
   documento (ex.: parceria remunerada ou nao) — leia o aviso antes de
   decidir manter ou apagar.
6. Na Formalizacao de um Chassi B: mantenha so a variante de assinatura
   (Digital ou Fisica) que corresponde ao meio realmente usado.
7. Clique em **Ocultar marcacoes** e revise o documento limpo.
8. Exporte pelos botoes da barra superior. A barra nunca sai no arquivo final.

### Formatos de exportacao

O HTML e o **documento-mestre**. Os demais formatos sao gerados a partir dele,
nunca editados em paralelo — se dois arquivos divergirem, vale o HTML.

| Formato | Botao | Quando usar | Fidelidade |
| --- | --- | --- | --- |
| **PDF** | `PDF` | Envio ao cliente, arquivo, assinatura | Total |
| **Word** | `Word` | Quando o cliente precisa editar ou comentar | Alta |
| **HTML** | `HTML` | Envio por link ou e-mail, leitura no celular | Total |

**PDF.** Abre a caixa de impressao do navegador. Configure:
Destino **Salvar como PDF** · Paginas **Todas** · Margens **Nenhuma** ·
**Graficos de plano de fundo: ATIVADO** — sem esta ultima opcao a capa sai
branca.

**Word.** Gera um `.doc` que abre no Word, no Google Docs e no LibreOffice, ja
com A4, margens de 2 cm, cores, tabelas e quebras de pagina. Como o Word nao
entende as folhas de 297 mm fixas, o texto passa a fluir naturalmente entre as
paginas — a contagem final pode diferir do PDF. A serifa vira Georgia, que e a
mais proxima disponivel em qualquer maquina. Use quando o cliente precisar
escrever no documento; para tudo o mais, prefira o PDF.

> **Antes de enviar o Word a alguem:** abra o arquivo no Word e salve como
> `.docx`. Os logos entram no `.doc` como referencia a esta pasta; salvar como
> `.docx` embute as imagens no arquivo. Sem esse passo, o documento chega ao
> destinatario sem a logomarca.

**HTML.** Gera um arquivo unico, com CSS embutido e logos convertidos para
base64. Funciona offline, sem depender desta pasta, e pode ser anexado em
e-mail ou aberto no celular.

**PowerPoint.** Nao se aplica a este chassi: ata e transcricao sao documentos de
leitura, nao de projecao. Apresentacoes pertencem ao **Chassi C**, com grade
16:9 propria e geracao nativa em `.pptx` — a construir.

### Ao editar um template

Toda pagina tem altura fixa de 297 mm e corta o que exceder. Depois de inserir
conteudo, confira se nada transbordou colando no console do navegador:

```js
[...document.querySelectorAll('.folha')].forEach((f,i)=>{const m=f.querySelector('.miolo');if(!m)return;const k=[...m.children];const s=(m.getBoundingClientRect().bottom-k[k.length-1].getBoundingClientRect().bottom)/3.7795;console.log('folha',i+1,s.toFixed(1)+'mm',s<0?'TRANSBORDOU':'ok')})
```

Valor negativo significa conteudo perdido: quebre a secao em nova folha.

---

## 5. Publicacao

Esta pasta fica fora de `public/`, portanto **nao e servida pela web** — os
arquivos versionam no git mas nao ficam acessiveis por URL. Ao promover algum
template a material publico, mover uma copia exportada em PDF, nunca o HTML.

---

## 6. Estado do kit

| Template | Situacao |
| --- | --- |
| Ata de reuniao (`ATA`) | Pronto — piloto do Chassi A. PDF, Word e HTML |
| Transcricao (`TRC`) | Pronto — anexo I das atas. PDF, Word e HTML |
| Chassi B (papel timbrado) | Pronto — cabecalho/rodape timbrado, bloco de formalizacao hibrido (assinatura digital ou fisica) |
| Termo de Alianca e Parceria Estrategica (`CTR`) | Pronto — piloto do Chassi B. Conteudo juridico preservado verbatim da fonte oficial; blocos condicionais marcados para parceria remunerada e vitrine publica |
| Chassi C (apresentacao 16:9) | Existe uma instancia (`apresentacao-institucional/`, `.pptx` via `pptxgenjs`), mas nao e reusavel ainda — fora do sistema de tokens/CSS deste kit |
| Assinatura de e-mail | Pronto — fora deste kit (`templates/assinatura-email/`), segue o Padrao de E-mail V01 (`email-layout.ts`), nao o Chassi A/B |
| Relatorio, Ebook, Material didatico, demais siglas do Chassi B | A desdobrar a partir dos chassis existentes |

**Nota juridica:** o conteudo do Termo de Parceria (`CTR`) foi preservado
verbatim do documento fonte oficial da BPlen. Qualquer alteracao de merito
juridico (nao so preenchimento de placeholder) exige validacao de quem
responde legalmente pela BPlen antes do envio a um parceiro real — este kit
cuida da estrutura/formatacao, nao substitui revisao juridica.
