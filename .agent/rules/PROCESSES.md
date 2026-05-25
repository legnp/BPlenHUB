# BPlen HUB: Governança Operacional e Processos

Este manual define como o BPlen HUB é desenvolvido, mantido e versionado. As regras a seguir são leis supremas de workflow entre IA e Usuário.

## Protocolo de Git Push e Deployment
1. **Autorização Expressa**: É terminantemente PROIBIDO realizar `git push` para o GitHub sem a autorização individual e expressa do usuário em cada etapa concluída.
2. **Push por Comando**: O push só deve ser executado após o usuário dar o comando ou aprovar a ação em uma conversa.
3. **Build Check**: Antes de solicitar o push, certifique-se de que o projeto está "buildando" sem erros no ambiente local (`npm run build`).
4. **Deploy Version**: SEMPRE que você executar um `git push`, é OBRIGATÓRIO informar ao usuário no chat qual foi o código/hash da versão enviada (ex: retornando a saída de `git log -1 --oneline` ou o hash gerado no commit).

## Gestão de Documentos (Living Documents)
As diretrizes abaixo aplicam-se ao **Backlog List** e ao **Relatório de Projeto**:

1. **Cabeçalho Obrigatório**: Todo documento de controle deve conter no topo:
   - `Última Atualização: [DATA] — [HORA]`
   - `Versão/Status Geral: [ETAPA %]`
2. **Versionamento e Registro**:
   - Registrar mudanças por Etapa ou Módulo.
   - Manter histórico de marcos concluídos.
3. **Atualização Sob Demanda**: A revisão e edição desses documentos só devem ocorrer sob autorização expressa do usuário.

## Proteção de Repositório Público (Blindagem #11)
- **Bloqueio de Envio**: Nunca inclua a pasta `Instruções do Projeto/` ou arquivos `.env*` em commits para repositórios compartilhados ou públicos.
- **Limpeza de Credenciais**: Verifique se segredos (API Keys, Private Keys) não foram "vazados" em logs ou mensagens de erro enviadas ao GitHub.

## Comunicação via Aliases (Resend)
- **Protocolos de E-mail**: Selecionar o alias correto baseado no fluxo de trabalho (hub, it, lisandra, atendimento, financeiro).
- **Provedor**: Utilização exclusiva do **Resend** para envios do ecossistema.

## Critério de Aceitação e Conclusão
1. **Validação Humana**: Uma implementação ou deployment só é considerado oficialmente "Concluído" após a validação total e aprovação explícita do usuário.
2. **Código no Ar vs. Conclusão**: O fato de o sistema estar funcional ou disponível no ambiente (localhost/vercel) não caracteriza conclusão de 100%.
3. **Refinamentos de Validação**: A finalização de uma tarefa no Backlog List só deve ocorrer após os refinamentos solicitados durante a fase de validação humana.

## Protocolo Zero Emoji
1. **Comunicação Interna e Externa**: É terminantemente proibido o uso de emojis em mensagens de commit, logs de sistema, comentários de código e interações de suporte ou desenvolvimento.
2. **Interface do Usuário**: A interface deve manter o padrão minimalista Apple IOS Pro, sem o uso de elementos pictográficos informais (emojis).

---
*Este documento é a base da nossa governança operacional. O respeito aos processos garante a segurança e estabilidade do projeto.*
