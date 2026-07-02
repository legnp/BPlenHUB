# Mapa 5 — Design System / Componentes

Inventaria os componentes de UI reutilizáveis (modais, cards, badges, botões,
tipografia) e em quais páginas cada um é usado, com qual variante/estilo
aplicado em cada ocorrência.

Objetivo: tornar concreto (não abstrato) o trabalho da Fase 0 de definir o
padrão canônico de design e identificar onde já existe desvio — lembrando que,
por `CLAUDE.md`, existem dois universos visuais (área pública e área logada/hub)
com padrões próprios, e que código legado que viola o padrão não deve ser usado
como referência do que é correto.

Ainda não populado — a ser preenchido pelo chat de planejamento a partir de
inspeção real do código (não assumir a partir de nomes de arquivo).

## Formato esperado

```
- Componente: Modal (ex: src/components/ui/Modal.tsx)
  - Universo: Hub (logado)
  - Variantes encontradas: [com blur, sem blur, bordas 8px, bordas 12px, ...]
  - Usado em: [página A (variante X), página B (variante Y), ...]
  - Observação: desvio identificado ou padrão canônico ainda indefinido
```
