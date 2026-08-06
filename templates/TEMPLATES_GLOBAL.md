# Kit de Templates BPlen — Contrato Global

> Leitura obrigatória antes de criar, alterar ou desdobrar qualquer template
> deste diretório. Este documento existe para dar continuidade ao trabalho
> entre sessões — depois de um `/clear`, é aqui que se reconstrói o
> contexto, sem precisar reabrir a conversa original.

---

## 1. O que é este diretório

`templates/` reúne todo material de identidade e documento formal que a
BPlen produz fora do produto (HUB): atas, contratos, apresentações,
assinatura de e-mail. Cada subpasta é um artefato ou uma família de
artefatos; este arquivo é o índice e o registro das decisões que atravessam
todos eles.

```
templates/
├── TEMPLATES_GLOBAL.md          este arquivo
├── documentos/                  kit de documentos impressos (Chassi A/B)
│   ├── README.md                contrato do kit de documentos — leitura obrigatória antes de mexer ali
│   ├── sistema/                 tokens.css, chassi-*.css, exportar.js
│   ├── ata-de-reuniao/
│   ├── transcricao/
│   └── contrato-parceria/
│       └── minutas/             versões de revisão sem dado preenchido
├── assinatura-email/            assinatura de Gmail (fora do sistema de documentos)
└── apresentacao-institucional/  deck .pptx (gerado via pptxgenjs, fora do sistema de documentos)
```

**Regra de navegação:** cada subpasta tem seu próprio `README.md` ou
`COMO-*.md`/`guia-de-preenchimento.md` com o detalhe operacional. Este
arquivo não repete esse detalhe — ele registra o que é transversal: por que
as coisas são como são, e como decidir para o que ainda não existe.

---

## 2. As quatro identidades visuais do ecossistema BPlen

Erro mais caro de cometer neste projeto: aplicar a identidade errada a um
artefato novo. Existem **quatro sistemas visuais deliberadamente distintos**
coexistindo no mesmo projeto — nenhum deles é "o padrão BPlen" sozinho; cada
um serve um contexto.

| Sistema | Onde vive | Cor | Tipografia | Serve |
| --- | --- | --- | --- | --- |
| **Site público** | `src/components/home/*.tsx` | Preto + gradiente magenta→roxo (`#FF0080`→`#C026D3`→`#7928CA`) | Sans bold/black, tracking apertado | Vitrine, landing page, energia de marketing |
| **HUB logado** | `src/app/globals.css` (tema padrão) | Glassmorphism, rosa `#FF2C8D`/`#FF006E` | Inter | Interface do produto, área logada |
| **Kit de documentos** | `templates/documentos/sistema/tokens.css` | Petróleo `#044159` + ametista `#9C389D`/`#9558A6` | Source Serif 4 (prosa) + Inter (dados) | Documento formal — ata, contrato, relatório, ebook |
| **E-mail transacional (Padrão V01)** | `src/lib/emails/email-layout.ts` | Petróleo `#044159` + ametista `#9558A6`/`#9677D9` (mesma família do kit de documentos) | Inter | E-mails automáticos do sistema (notificação, aceite, cobrança) |

### Regra de herança — qual identidade um artefato novo deve seguir

Não existe uma resposta única; depende do **contexto de uso**, não do tipo
de arquivo:

- **É lido em correspondência 1:1 ou é um instrumento formal** (ata,
  contrato, relatório, e-mail transacional, assinatura pessoal de e-mail)?
  → Petróleo/ametista (kit de documentos ou Padrão V01 — são a mesma
  família de cor, o V01 só troca a serifa por Inter porque cliente de
  e-mail não carrega fonte customizada).
- **É vitrine, material de venda ou institucional para público externo
  amplo** (apresentação institucional, landing page, material de captação)?
  → Preto + gradiente magenta/roxo do site público.
- **É tela do produto, dentro da área logada?** → Glassmorphism rosa do
  HUB. Este kit não toca essa área.

Precedente já registrado: a apresentação institucional (`.pptx`) foi
avaliada e foi para o gradiente magenta/roxo, porque é material de vitrine
(prospecção, "quem somos"), não correspondência. A assinatura de e-mail e o
kit de documentos foram para petróleo/ametista, porque são correspondência
e instrumento formal, respectivamente.

**Antes de estilizar qualquer coisa nova:** procure primeiro se o padrão já
existe em algum desses quatro lugares e reaproveite. Reaproveitar padrão
existente, do jeito que já é usado, não precisa de aprovação — inventar um
quinto sistema visual precisa.

---

## 3. Arquitetura em camadas do kit de documentos

Vale só para `templates/documentos/`. Detalhe completo no
`documentos/README.md`; resumo aqui:

| Camada | Arquivo | Papel |
| --- | --- | --- |
| 1 — Fundação | `sistema/tokens.css` | Cor, tipografia, escala, ritmo, geometria A4 |
| 2 — Chassi | `sistema/chassi-a-encadernado.css`, `chassi-b-timbrado.css` | Estrutura de página |
| 2 — Exportação | `sistema/exportar.js` | PDF/Word/HTML, compartilhado por todos os templates |
| 3 — Template | `<tipo>/<tipo>.template.html` | Só conteúdo e placeholders |

Um template novo **só escreve a camada 3**. Se precisar de uma cor ou
tamanho que não existe em `tokens.css`, o token é que deve ser criado —
nunca um valor literal solto num template.

### Os três chassis

| Chassi | Estrutura | Status | Serve |
| --- | --- | --- | --- |
| **A — Encadernado** | Capa · Folha de rosto · Miolo · Contracapa | Pronto | Ata, Relatório, Ebook, Material didático, Diagnóstico |
| **B — Papel timbrado** | Cabeçalho/rodapé em toda página, sem capa, Formalização híbrida (assinatura digital ou física) | Pronto | Contrato, Aditivo, Carta, Declaração, Certificado, NDA |
| **C — Apresentação 16:9** | Grade de slide | Só uma instância avulsa (`apresentacao-institucional/`, via `pptxgenjs`, fora do sistema de tokens/CSS) — não é reusável ainda | Deck comercial, aula, treinamento |

---

## 4. Convenção de nomenclatura de documentos

```
BPL-CONTEXTO-TIPO-AAMMDDHHMM[-MATRICULA]
```

- `BPL` — prefixo institucional fixo.
- `CONTEXTO` — rótulo curto do tipo de encontro/interação que originou o
  documento. Minúsculo, sem acento, sem espaço: `1 to 1` → `1to1`,
  `Onboarding` → `onboarding`. Para templates sem encontro associado
  (contrato, certificado), reflete o eixo mais relevante daquele tipo —
  não há regra universal, decidir por template.
- `TIPO` — sigla fixa de três letras (tabela abaixo).
- `AAMMDDHHMM` — data/hora de origem, sem separadores, ano com 2 dígitos
  (mesma lógica da matrícula `BP-xxx-PF-AAMMDD`). Sem sequencial: o
  timestamp já é único.
- `MATRICULA` — só quando o documento for exclusivo de um cliente
  específico. Formato da matrícula BPlen do cliente.

**A transcrição usa o mesmo CONTEXTO e o mesmo timestamp da ata** que
documenta — os dois nascem do mesmo encontro, só a sigla `TIPO` muda.

Exemplos reais já em uso: `BPL-1to1-ATA-2607301526`,
`BPL-1to1-TRC-2607301526`.

### Siglas em uso

| Sigla | Documento | Chassi | Status |
| --- | --- | --- | --- |
| `ATA` | Ata de reunião | A | Pronto |
| `TRC` | Transcrição / registro da conversa | A | Pronto |
| `CTR` | Contrato / termo | B | Pronto (piloto: Termo de Aliança e Parceria) |
| `REL` | Relatório | A | Não iniciado |
| `PRO` | Proposta comercial | A | Não iniciado |
| `EBK` | Ebook / material autoral | A | Não iniciado |
| `MAT` | Material didático / atividade | A | Não iniciado |
| `PLA` | Plano de aula | A | Não iniciado |
| `ADT` | Aditivo contratual | B | Não iniciado |
| `CAR` | Carta / ofício | B | Não iniciado |
| `DEC` | Declaração | B | Não iniciado |
| `CER` | Certificado / atestado | B | Não iniciado |
| `REC` | Recibo | B | Não iniciado |
| `NDA` | Termo de confidencialidade | B | Não iniciado |
| `LGP` | Termo de consentimento de dados | B | Não iniciado |
| `POP` | Procedimento operacional padrão | B | Não iniciado |
| `APR` | Apresentação | C | Uma instância avulsa (institucional) |

### Versionamento

`v0.x` = rascunho em circulação restrita. `v1.0` = versão válida. `v1.1`,
`v1.2` = retificação pós-`v1.0`, sempre com registro do que mudou.
Documento assinado nunca é editado: gera-se nova versão.

### Classificação de confidencialidade

Todo documento carrega um selo: `PUBLICO`, `INTERNO`, `CONFIDENCIAL`,
`RESTRITO` (classes CSS `cls-publico`/`cls-interno`/`cls-confidencial`/
`cls-restrito`, definidas em `tokens.css`).

---

## 5. Diretrizes gerais de conteúdo

### Tom de voz

A BPlen é consultoria de **desenvolvimento humano**. Documento sério no
conteúdo, acolhedor na forma — nunca peça jurídica, contábil ou de
auditoria na linguagem (mesmo quando o documento *é* juridicamente
vinculante, como um contrato — sério ≠ frio).

| Não usar | Usar |
| --- | --- |
| Quórum, Composição do encontro | Quem participou |
| Deliberação | O que ficou decidido |
| Registro dos trabalhos | Como foi a conversa |
| Plano de ação, Encaminhamentos | Nossos combinados |
| Ordem do dia | O que estava previsto |
| Responsável, Prazo | Com quem fica, Até quando |
| Ausência justificada | Avisou que não viria |
| Encerramento | Fechamento |

Regras de escrita: primeira pessoa do plural para falar da BPlen ("nos
encontramos", "combinamos"); nada de "o presente documento" ou "conforme
supracitado"; sem adjetivo de avaliação; **sem emoji, em qualquer campo,
inclusive comentário de código e guia de instrução**; sigla sempre
explicada na primeira ocorrência.

**Exceção deliberada:** conteúdo jurídico preservado verbatim de fonte
oficial (ex. cláusulas de contrato) mantém o registro formal original — não
se "traduz" cláusula jurídica para o tom conversacional. O tom de voz acima
vale para o texto que a BPlen escreve do zero (ata, e-mail, apresentação),
não para texto legal já redigido e aprovado.

### Nunca inventar dado

Toda estatística, cláusula, CNPJ, valor ou compromisso que aparece num
template vem de uma fonte real (arquivo fornecido, código em produção,
página pública já publicada) — nunca de invenção para preencher espaço.
Quando falta informação, ela fica como placeholder, não como suposição.

### Preservação verbatim de conteúdo jurídico

Quando um template envolve texto jurídico já redigido pela BPlen (contrato,
termo, cláusula), o conteúdo é preservado **palavra por palavra** da fonte
oficial. O template adiciona estrutura visual e converte marcadores de
placeholder — nunca edita o mérito da cláusula por iniciativa própria,
mesmo que pareça redundante ou inconsistente num recorte específico
(precedente: reversão de uma edição indevida na Cláusula 3.4 da minuta
"somente vitrine" — ver `documentos/contrato-parceria/`). Alteração de
mérito jurídico exige validação de quem responde legalmente pela BPlen.

### Fronteira com sistemas de produto já existentes

Antes de criar um template nesta pasta, checar se já existe um sistema
equivalente **dentro do produto** (código do HUB) que não deve ser
duplicado nem substituído por este kit:

- **Contrato de compra de serviço pelo checkout** — gerado por
  `src/lib/contract-content.ts` + `src/actions/legal.ts` (PDFKit), entidade
  própria no Firestore (`User/{matricula}/Contracts`), ciclo de vida
  gated, documentado em `docs/system-audit/CONTRACTS-DESIGN.md`. **Área
  sensível** (financeiro + identidade + jurídico) — mudança ali segue
  processo próprio, não este kit. O Chassi B cobre instrumentos **fora**
  desse fluxo (parceria B2B, NDA avulso).
- **E-mail transacional automático** — `src/lib/emails/email-layout.ts`
  (Padrão V01). Este kit não reescreve esse motor; a assinatura de e-mail
  pessoal (`assinatura-email/`) só *segue a mesma paleta*, é um artefato
  totalmente separado (HTML colado manualmente na configuração do Gmail).

---

## 6. Processo de trabalho estabelecido

Sequência usada em todo artefato construído até aqui — repetir para os
próximos:

1. **Pesquisar antes de desenhar.** Antes de estilizar ou escrever copy,
   checar o que já existe: outro template no kit, conteúdo real já escrito
   em algum componente do site, um sistema de produto equivalente. Nunca
   assumir que "o padrão BPlen" é o primeiro que vier à cabeça — são quatro
   sistemas (seção 2) e a escolha errada custa retrabalho.
2. **Consultar antes de executar** em decisões que mudam a abordagem
   inteira (formato de entrega, identidade visual, escopo do conteúdo) —
   perguntar objetivamente, com opções, antes de construir.
3. **Construir com verificação real, não visual "de olho".** Todo template
   HTML é medido no navegador (altura de folha, transbordo de texto) antes
   de ser considerado pronto — nunca só renderizado e aceito de olho. Para
   `.pptx`, usar o skill de pptx (`pptxgenjs` + `validate.py` + QA
   geométrico) — nesta máquina, sem LibreOffice/PowerPoint instalados, a
   verificação visual real é substituída por checagem geométrica
   (`qa-geometria.py`) e de encaixe de texto com fontes reais do Windows
   (`qa-texto.py`), documentado em `apresentacao-institucional/COMO-EDITAR.md`.
4. **Testar o pipeline com dado real antes de aprovar**, quando o artefato
   é gerado (não só preenchido à mão) — a ata só foi considerada pronta
   depois de rodar com uma reunião real (Gaja Contábil) e o parceiro
   aprovar o resultado.
5. **Documentar o padrão assim que ele nasce.** Cada decisão de sistema
   (paleta, convenção de nome, chassi novo) é registrada no `README.md` do
   kit e neste arquivo antes de seguir para o próximo artefato — não fica
   só na conversa.

---

## 7. Erros já cometidos e corrigidos (não repetir)

- **Regex de exportação desatualizada.** Ao adicionar o segmento
  `CONTEXTO` ao código do documento, o `exportar.js` não foi atualizado
  junto — o botão de exportação gerava nome de arquivo genérico. Toda vez
  que a convenção de nomenclatura mudar, checar `sistema/exportar.js`.
- **Edição de mérito jurídico não autorizada.** Ver seção 5 acima.
- **Emoji em guia de instrução.** Mesmo texto de bastidor (comentário,
  guia de preenchimento) segue a regra zero-emoji do projeto.
- **Cache de CSS no navegador durante verificação.** Depois de editar um
  `chassi-*.css`, forçar reload sem cache antes de remedir — senão a
  medição reflete o CSS antigo e mascara a correção.

---

## 8. Pendências em aberto

- **Chassi C reusável.** Hoje só existe uma instância avulsa
  (`apresentacao-institucional/`, `.pptx` via `pptxgenjs`). Generalizar
  para um sistema de slides reusável (tokens + geração parametrizada) é
  trabalho futuro, não feito ainda.
- **Demais siglas do Chassi A e B** (`REL`, `PRO`, `EBK`, `MAT`, `PLA`,
  `ADT`, `CAR`, `DEC`, `CER`, `REC`, `NDA`, `LGP`, `POP`) — nenhuma
  construída ainda; desdobram do chassi já pronto correspondente.
- **Cláusula 3.6 do Termo de Aliança** pressupõe aceite eletrônico
  (Clickwrap); se um parceiro específico assinar fisicamente, a redação
  precisa de ajuste manual — não está automatizado.
- **Minutas geram novas siglas?** As três minutas do Termo de Aliança
  (`documentos/contrato-parceria/minutas/`) ainda não têm código
  `BPL-...` próprio — são material de revisão pré-formalização, decisão
  pendente se merecem numeração ou ficam sempre fora da convenção.
