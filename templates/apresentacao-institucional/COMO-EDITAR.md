# Apresentação Institucional BPlen — Como Editar

`BPlen-Apresentacao-Institucional.pptx` é **gerado**, não editado diretamente
em conteúdo estrutural. `build.js` é a fonte de verdade — abre no PowerPoint
normalmente para apresentar ou fazer ajuste pontual, mas qualquer mudança
que precise sobreviver a uma próxima geração (corrigir um dado, adicionar um
slide, trocar copy) deve entrar no `build.js`, não só no arquivo final.

## Identidade visual usada

A mesma do site público (`src/components/home/*.tsx`): preto (`#0A0A0A`) +
gradiente magenta/roxo (`#FF0080` → `#7928CA`), tipografia sans bold/tight.
**Não é** a paleta petróleo/ametista do kit de documentos (`templates/documentos/`)
nem o rosa do HUB logado — cada uma serve um contexto diferente; esta é a
identidade de vitrine institucional. Reaproveitar um padrão já usado noutra
página não precisa de aprovação prévia; se algo aqui mudar de fato o padrão
visual (nova cor, nova fonte), aí sim vale alinhar antes.

## Estrutura (19 slides)

Capa · Quem Somos · Missão & O Que Nos Move · Para Quem (3 segmentos) ·
Cenário Atual (transição + estatísticas) · Como Ajudamos (transição + 3
pilares) · Nosso Posicionamento (transição + 4 forças, 2 slides) · Nossos
Valores (5) · Fundadora · Trajetória · Resultados · Próximos Passos/CTA ·
Encerramento.

Todo o conteúdo (textos, números, links) veio das páginas públicas reais do
site — nenhuma estatística ou frase foi inventada para este deck.

## Regenerar

```bash
npm install        # so na primeira vez, ou se package.json mudar
node build.js       # gera BPlen-Apresentacao-Institucional.pptx
```

## Checagem antes de considerar pronto

Esta máquina não tem LibreOffice/PowerPoint instalado para renderizar
imagem — os scripts abaixo substituem a inspeção visual até onde dá:

```bash
python qa-geometria.py    # nenhuma forma pode estourar a borda do slide
python qa-texto.py        # confere quebra de linha real (fonte Arial do
                           # Windows) contra a altura de cada caixa de texto
```

Se você adicionar ou alterar um bloco de texto em `build.js`, adicione o
caso correspondente em `qa-texto.py` (mesmo texto, largura, tamanho de
fonte e `lineSpacingMultiple` usados na chamada real) antes de aceitar a
mudança — é o único jeito de pegar estouro de texto sem render visual.

Se `scripts/office/validate.py` do skill de pptx estiver disponível
(schema/relacionamentos/gráficos), rode também:

```bash
python <caminho-do-skill>/scripts/office/validate.py BPlen-Apresentacao-Institucional.pptx
```

Em outra máquina com LibreOffice instalado, prefira a rota completa do
skill (`soffice.py --convert-to pdf` + `pdftoppm` + inspeção visual real) —
é mais confiável que os dois scripts de QA geométrica acima.

## Arquivos

| Arquivo | Papel |
| --- | --- |
| `build.js` | Fonte — todo o conteúdo e layout dos 19 slides |
| `make-glow.js` | Gera `assets/glow-bg.png` (glow de fundo, réplica do efeito do site) |
| `make-icons.js` | Gera os ícones (`assets/icon-*.png`) via react-icons |
| `qa-geometria.py` | Confere estouro de borda |
| `qa-texto.py` | Confere quebra de linha vs. altura de caixa |
| `assets/` | Logo, glow, ícones — reexecutar `make-glow.js`/`make-icons.js` se apagados |

Rodar `make-glow.js` / `make-icons.js` de novo só é necessário se você mudar
a paleta ou pedir um ícone novo — os PNGs já ficam versionados em `assets/`.
