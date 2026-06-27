# BPlen HUB — Custom Agent Rules

## Requisitos e Rastreabilidade no Planejamento
1. Toda vez que for criar ou atualizar o plano de implementacao (implementation_plan.md) para qualquer alteracao no sistema (incluindo novas surveys, formularios, fluxos ou logicas de banco), o agente deve listar explicitamente todos os requisitos solicitados pelo usuario em uma Tabela de Rastreabilidade.
2. A tabela deve conter:
   * **Requisito Solicitado (Texto do Usuario)**: O texto exato da instrucao fornecida pelo usuario no prompt.
   * **Resolucao Tecnica / Arquivo de Destino**: Onde e como esse requisito especifico sera implementado no codigo.
3. Isso garante que nenhum requisito comportamental (como salvamento progressivo de rascunhos, regras de visibilidade baseadas em roles, ou regras de banco) seja omitido durante as fases de desenvolvimento.
