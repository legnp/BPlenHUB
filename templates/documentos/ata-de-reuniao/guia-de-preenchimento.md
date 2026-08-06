# Ata de Reuniao — Guia de Preenchimento

Template: `ata-de-reuniao.template.html` · Chassi A · A4 vertical · 7 folhas.

Uma ata da BPlen registra o que a gente conversou, o que ficou decidido e com
quem cada coisa ficou. Se um paragrafo nao sustenta uma decisao nem um
combinado, ele provavelmente nao precisa estar aqui.

**Tom.** Serio no conteudo, acolhedor na forma. Escreva como quem conta a um
colega que nao pode vir. Nada de "o presente documento", "conforme supracitado"
ou "delibera-se". Ver a secao de tom de voz no `README.md` do kit.

---

## Estrutura

| Folha | Secao | Cresce? |
| --- | --- | --- |
| 1 | Capa | Nao |
| 2 | Sobre este encontro — quando e onde, quem cuidou do registro, identificacao | Nao |
| 3 | Parte 01 — Quem participou | Sim, por linha |
| 4 | Parte 02 — Pauta e de onde paramos | Sim, por linha |
| 5 | Parte 03 — Como foi a conversa | **Sim, por folha inteira** |
| 6 | Parte 04 — Nossos combinados e fechamento | Sim, por linha |
| 7 | Contracapa | Nao |

A folha 5 e a unica replicavel por inteiro: duplique a `<section class="folha">`
completa, mantenha cabecalho e rodape, continue a numeracao dos assuntos e
ajuste o folio. Nas folhas seguintes, troque o titulo por
"Como foi a conversa (continuacao)".

---

## Campos

### Capa e folha 2

| Campo | Como preencher |
| --- | --- |
| `{{TITULO DO ENCONTRO}}` | Nome do ciclo ou do grupo, nao a data. Ex.: "Encontro de Lideranca — 3o Ciclo". Ate 60 caracteres, senao quebra a capa. |
| `{{Uma frase sobre o que conversamos}}` | Ex.: "Como esta o clima dos times depois da mudanca de estrutura". Frase, nao titulo. |
| `{{BPL-TIPO-ATA-AAMMDDHHMM}}` | Codigo do documento. `TIPO` e um rotulo curto do tipo de encontro — minusculo, sem acento, sem espaco (`1 to 1` -> `1to1`, `Onboarding` -> `onboarding`, `Comite Mensal` -> `comitemensal`). Depois vem a data/hora de inicio do encontro, sem separadores (ano com 2 digitos). Repete-se em cabecalhos e rodapes — use localizar e substituir, nunca edite um a um. Sem sequencial: o timestamp ja e unico. |
| `{{DD/MM/AAAA}}` | Data do encontro, nao a da escrita da ata. Tambem se repete. |
| `{{v1.0}}` | Versao. Repete-se nos rodapes. |
| `{{INTERNO}}` | Circulacao. Trocar tambem a classe do selo: `cls-publico`, `cls-interno`, `cls-confidencial` ou `cls-restrito`. |
| Comecamos / Terminamos | Horarios reais, nao os previstos. |
| Tipo de encontro | "Da nossa agenda regular" ou "Extra". |
| `{{5}}` dias uteis | Prazo para alguem pedir ajuste. Padrao: 5 dias uteis. |

**Quem cuidou deste registro** ja vem preenchido com o padrao BPlen — conducao e
revisao por Lisandra Lencina, anotacoes por Gemini Notes, contato
`lisandra.lencina@bplen.com` / `+55 11 94515 2088`. So alterar quando outra
pessoa conduzir.

**Como esta ata foi feita.** O bloco conta, sem rodeios, que a captura foi
automatica e a revisao foi humana, e abre a porta para correcao. Nao remover: e
o que sustenta a validade da ata e e um gesto de transparencia com quem
participou. Se em algum encontro a anotacao for manual, ajuste o texto — nunca
deixe uma declaracao que nao corresponda ao que aconteceu.

### Folha 3 — Quem participou

Uma linha por pessoa convidada, tenha vindo ou nao. Estados:

- **Esteve presente** — acompanhou o encontro todo
- **Participou em parte** — entrou em um momento especifico (convidados, em geral)
- **Avisou que nao viria** — comunicou antes
- **Nao pode vir** — quando nao houve aviso

A diferenca entre os dois ultimos importa para o acompanhamento do grupo, mas
registre sem carga de julgamento: a coluna informa, nao cobra.

### Folha 4 — Pauta

A pauta e o que **estava previsto**, na ordem e no tempo previstos. Nao
reescreva depois para refletir o que de fato aconteceu — a diferenca entre o
previsto e o vivido e informacao util sobre o grupo.

"De onde paramos" e opcional so no primeiro encontro de um ciclo. Nos demais,
toda linha de "Nossos combinados" da ata anterior reaparece aqui com sua
situacao. Esse ciclo fechado e o que faz a ata virar acompanhamento, e nao
arquivo.

### Folha 5 — Como foi a conversa

Cada assunto gera um bloco com dois campos:

**O que conversamos** — o que foi trazido e discutido. Conte, nao transcreva:
para as palavras exatas existe o Anexo I. Registre fatos, dados e pontos de
vista. Quando houver visoes diferentes, mostre as duas — ajuda quem ler depois
a entender por que a decisao foi aquela. Nomeie quem sustentou uma posicao
apenas quando isso for necessario para a decisao fazer sentido.

**O que ficou decidido** — a decisao de um jeito que se sustente sozinha: quem
decidiu, o que foi decidido, a partir de quando vale. Quem ler so este quadro,
seis meses depois, precisa entender sem voltar ao relato.

Se um assunto nao chegou a conclusao, escreva
"Ficou para conversarmos no proximo encontro". Decisao em branco e o defeito
mais comum em ata e o que mais custa depois.

### Folha 6 — Nossos combinados

O bloco de maior valor do documento:

- Uma acao por linha. Acao composta vira duas linhas.
- **Uma** pessoa por linha, nominal. "A equipe" e "todos" nao sao pessoas.
- Data, nunca "semana que vem" ou "assim que der".
- Comece por um verbo: "Levantar os temas que apareceram nas conversas de
  time e trazer no proximo encontro".
- Situacao nasce sempre **A comecar**. Os outros estados sao preenchidos na
  folha 4 da ata seguinte, nao aqui.

**Materiais de apoio.** O Anexo I e sempre a transcricao
(`BPL-TIPO-TRC-AAMMDDHHMM`, mesmo `TIPO` e mesmo timestamp da ata — os dois
nascem do mesmo encontro). Remova a linha se o encontro nao tiver sido
gravado.

**Assinaturas.** A coluna esquerda e fixa (Lisandra Lencina). A direita recebe
quem validou pela area. Em aprovacao por aceite, substitua as linhas por
"Aprovada em DD/MM/AAAA, conforme combinado na folha 2".

---

## Antes de exportar

- [ ] Nenhum `{{` restante — ative **Ocultar marcacoes** e procure na pagina
- [ ] Codigo, data e versao substituidos em **todas** as ocorrencias
      (no arquivo original sao 13, 9 e 7 respectivamente)
- [ ] Folios em sequencia depois de duplicar folhas da parte 03
- [ ] Total de paginas atualizado na contracapa
- [ ] Todo combinado tem pessoa nominal e data
- [ ] Todo assunto tem "O que ficou decidido" preenchido
- [ ] Codigo do Anexo I confere com a transcricao
- [ ] Circulacao coerente com quem vai receber
- [ ] Nenhuma pagina transbordou (script no `README.md` do kit)
- [ ] PDF exportado com **graficos de plano de fundo ativados**

---

## Convencoes de escrita

- Primeira pessoa do plural quando falar da BPlen: "nos encontramos",
  "combinamos", "retomamos".
- Tempo passado para o que aconteceu; presente para o que vale a partir de agora.
- Sem adjetivo de avaliacao ("otima reuniao", "excelente colocacao").
- Numeros por extenso ate dez; algarismos a partir de 11.
- Sem emoji, em qualquer campo.
- Siglas explicadas na primeira aparicao.
- Nome de infraestrutura nunca aparece para o cliente. Gemini Notes e excecao
  deliberada: aparece porque a transparencia sobre como a ata foi feita vale
  mais do que a regra de discricao.
