# Diretrizes para Evitar Retrabalho e Desperdício de Recursos (Tokens/Tempo)
> **Status:** Ativo | **Público-Alvo:** Agentes de IA e Desenvolvedores BPlen HUB

Este guia estabelece os protocolos obrigatórios para garantir eficiência máxima, segurança operacional e **desperdício zero de recursos e tokens** durante o desenvolvimento no BPlen HUB. Ao atuar sob diferentes chats/agentes, estas regras impedem que implementações entrem em conflito ou gerem retrabalhos constantes.

---

## 1. Protocolo de Planejamento e Mapeamento Prévio (Pesquisa Estrita)
Antes de escrever uma única linha de código, o agente **deve** realizar uma varredura completa na estrutura existente.

*   **Não Duplicar Lógica:** Antes de criar uma nova Server Action, Utilitário ou Componente, faça uma busca global (`grep_search`) por palavras-chave relacionadas. Muitas funções de busca, atualização ou conexão ao Firestore já existem no projeto.
*   **Inspeção de Workflows:** Verifique a pasta `.agent/workflows/` para seguir padrões de arquitetura já homologados no projeto (como `/criar-form` ou `/criar-survey`).
*   **Limitação do Escopo:** Caso o escopo não esteja 100% claro, o agente deve apresentar um **Plano de Implementação** resumido para aprovação do usuário, em vez de assumir premissas e codificar às cegas.

---

## 2. Protocolo de Validação Isolada (Ambiente Local e Scratch)
A maior fonte de retrabalho e deploys quebrados é a falta de testes locais focados.

*   **Uso Obrigatório de Scratch Scripts:** Para qualquer nova integração de banco de dados (Firestore), APIs ou lógica de backend complexa, crie um script temporário em `scratch/` (ex: `scratch/test-conexao.ts`).
*   **Comandos de Execução Segura:** Execute esses scripts usando ferramentas rápidas de runtime local, como:
    ```bash
    npx tsx scratch/test-conexao.ts
    ```
*   **Validação Antes do Deploy:** O deploy de produção (`npm run build` ou `firebase deploy`) **só é permitido após o teste local em scratch retornar sucesso de ponta a ponta**. Nunca faça deploy assumindo que o código funcionará sem um teste de execução local bem-sucedido.

---

## 3. Gestão Rigorosa de Variáveis de Ambiente e Credenciais
Erros na formatação de chaves privadas e tokens de API geram erros silenciosos difíceis de depurar em produção.

*   **Evitar Truncamentos e Duplicações:** Ao copiar e colar chaves privadas (como a do Firebase Admin SDK), verifique os bytes de controle e certifique-se de que não houve quebras de linha duplicadas ou perdas de caracteres no final.
*   **Tratamento de Quebras de Linha (`\n`):** O Next.js lê variáveis do `.env.local` preservando caracteres literais de barra invertida (`\\n`). Toda inicialização que use chaves privadas deve utilizar uma função de normalização robusta:
    ```typescript
    const normalizePrivateKey = (key: string | undefined) => {
      if (!key) return undefined;
      return key.replace(/\\n/g, '\n');
    };
    ```

---

## 4. Alinhamento Contínuo de Contexto (Histórico entre Chats)
Como o desenvolvimento é distribuído entre diferentes sessões de chat com contextos isolados:

*   **Preservar Comentários e Docstrings:** Nunca remova ou sobrescreva comentários explicativos pré-existentes no código, a menos que a lógica tenha mudado completamente. Eles orientam o próximo agente sobre as decisões técnicas tomadas.
*   **Registrar Alterações (Walkthroughs):** Sempre documente as principais mudanças arquiteturais ou correções feitas de forma resumida e objetiva, para que o usuário possa facilmente compartilhar o estado atual com outros agentes ou chats (como feito em `walkthrough.md`).
