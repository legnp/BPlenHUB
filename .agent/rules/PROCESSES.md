# BPlen HUB: Governança Operacional e Processos

Este manual define a rotina operacional, os fluxos de deploy e a metodologia de trabalho entre o Antigravity (IA) e o Gestor. As regras a seguir são leis soberanas de workflow e integridade do projeto.

---

## 🚪 1. O Ritual de Início de Tarefa (O Reporte Unificado)

Toda e qualquer demanda técnica entregue pelo Gestor deve passar obrigatoriamente pela fase de planejamento antes de qualquer modificação de código ou execução de comandos locais de escrita. O Antigravity deve elaborar e apresentar o seguinte modelo preenchido de forma técnica e precisa:

### 📑 Reporte Unificado: Viabilidade Técnica & Planejamento Operacional
**Demanda**: [Nome da Feature/Demanda]  
**Status Atual**: ⏳ Aguardando Validação e Comentários do Gestor

#### PART 1: 📋 Reporte de Viabilidade Técnica (Arquitetura e Impacto)
Esta seção mapeia as alterações lógicas e físicas e os recursos que o gestor precisa providenciar.

| Tópico Técnico | Mapeamento e Diagnóstico do Antigravity (Com Referências) | Comentários do Gestor | Validação |
| :--- | :--- | :--- | :---: |
| **Camadas Afetadas** | *Especificar a Área de Negócio (ex: admin, hub, home, firestore, coleção x, etc.) e a Camada Técnica (client-side, server-side, front-end ou back-end).* | Digite aqui... | [ ] |
| **Complexidade do Escopo** | *Análise do escopo, arquivos que serão criados ou editados e nível de intervenção.* | Digite aqui... | [ ] |
| **Dependências de Código** | *Relação de dependências vinculadas à Área do Projeto (ex: importação de hooks do hub, esquemas do admin, etc.) e bibliotecas externas.* | Digite aqui... | [ ] |
| **Efeito Dominó / Impacto** | *Mapeamento preventivo de como o novo deploy se relaciona ou pode afetar outras partes do ecossistema BPlen.* | Digite aqui... | [ ] |
| **Papel do Antigravity** | *Indicação da especialidade exigida para o escopo (ex: Desenvolvedor Full Stack, Data Engineer, etc.).* | Digite aqui... | [ ] |
| **Acessos e Credenciais** | *Chaves de ambiente, tokens ou dados de teste necessários para que a IA ou o Gestor executem a tarefa.* | Digite aqui... | [ ] |
| **Roteiro de Validação Humana** | *(Dinâmico) Sequência passo a passo customizada para que o Gestor teste e valide visualmente ou logicamente a alteração.* | Digite aqui... | [ ] |
| **Plano de Rollback** | *(Dinâmico) Comando ou ação de reversão rápida caso ocorra qualquer problema pós-deploy.* | Digite aqui... | [ ] |

#### PART 2: ⚙️ Workbench de Planejamento e Otimização (Tokens e Configurações)
Esta seção estabelece as diretrizes operacionais para economia de recursos e garantia de compliance técnico e estético.

| Item de Controle | Proposta Operacional do Antigravity | Comentários do Gestor | Validação |
| :--- | :--- | :--- | :---: |
| **1. Ignore List (Arquivos)** | *Listagem de arquivos/pastas ignorados na leitura de contexto para economizar tokens e tempo de processamento.* | Digite aqui... | [ ] |
| **2. Volume da Tarefa** | *Sugerido pelo Antigravity:*<br>[ ] FLASH (Modificação pontual direta)<br>[ ] PLANNING/PRO (Múltiplos arquivos ou nova arquitetura) | Digite aqui... | [ ] |
| **3. Workbench de Texto** | **Títulos**: strings de título propostas<br>**Subtítulos**: strings secundárias propostas<br>**Mensagens/Alertas**: textos de confirmação ou erros propostos | Altere as strings exatas aqui... | [ ] |
| **4. Habilitação de Skills** | *Marcação de quais sub-habilidades lógicas devem permanecer ativas (ex: frontend-layout, backend-logic, data-engineer) para otimização de processamento.* | Digite aqui... | [ ] |
| **5. Modelo e Carga** | *Sugestão de modelo e peso da carga técnica.*<br>⚠️ *AÇÃO HUMANA: Mude a chave seletora da IDE antes de dar o próximo comando.* | Digite aqui... | [ ] |

---

## 🧱 2. Políticas de Desenvolvimento e Legado

1.  **Prioridade Anti-Hardcoded**:
    *   Toda nova lógica ou elemento de texto dinâmico deve evitar valores "chumbados" (hardcoded), priorizando dados vindos do banco de dados, arquivos de tradução/configuração ou variáveis de ambiente.
    *   Valores fixos só são aceitos quando comprovadamente não houver alternativas técnicas viáveis.
2.  **Preservação e Evolução do Legado**:
    *   Arquivos e módulos herdados que já possuem desvios de governança ou strings hardcoded não são alterados por padrão.
    *   Se um novo desenvolvimento colidir com códigos legados, o impacto e a necessidade de refatoração para adequação à nova governança serão avaliados caso a caso, dependendo de aprovação expressa do Gestor através do *Reporte Unificado*.
    *   Este modelo de preservação incremental aplica-se a todas as novas regras globais implementadas no projeto.

---

## 🚀 3. Protocolo de Git Push e Deployment

1.  **Autorização Expressa**: É terminantemente PROIBIDO realizar `git push` ou deploys para ambientes compartilhados sem a autorização individual, expressa e por escrito do Gestor em cada etapa.
2.  **Verificação Pré-Push (Build Check)**: Antes de solicitar autorização para push, o Antigravity deve executar obrigatoriamente `npm run build` para garantir que a build do Next.js está íntegra e sem warnings críticos.
3.  **Deploy Version**: Toda vez que o push for executado, o Antigravity deve informar no chat o hash identificador do commit gerado (ex: exibindo a saída de `git log -1 --oneline`), mantendo o controle transparente do histórico.

---

## 📂 4. Gestão de Documentos (Living Documents)

As diretrizes abaixo aplicam-se ao **Backlog List** e ao **Relatório de Projeto**:

1.  **Cabeçalho Obrigatório**: Todo documento de controle deve exibir no topo:
    *   `Última Atualização: [DD/MM/AAAA] — [HH:MM:SS]`
    *   `Versão/Status Geral: [Etapa X % Concluída]`
2.  **Atualização Sob Demanda**: A edição e atualização destes documentos de controle só podem ser efetuadas sob solicitação ou aprovação explícita do Gestor.

---

## 🛡️ 5. Proteção de Repositório Público (Blindagem #11)

*   **Bloqueio de Envio**: Nunca comite ou envie para repositórios públicos a pasta `Instruções do Projeto/`, arquivos `.env*` ou segredos (API Keys, chaves JSON de Contas de Serviço). A blindagem é garantida localmente via `.gitignore` e verificada na auditoria de soberania.

---

## 🚫 6. Protocolo Zero Emoji Estendido

1.  **Comunicação de Engenharia**: Emojis são proibidos em mensagens de commit, mensagens de logs (`console.log`, `console.warn`, `console.error`), exceções de código (`throw new Error`), e-mails e comentários no código-fonte.
2.  **Interface Premium**: A interface do usuário deve manter estética minimalista inspirada no *Apple iOS Pro*, livre de pictogramas ou emojis informais nas mensagens de toast, avisos, modais e títulos. Toda iconografia deve ser vetorial estruturada (Lucide).

---
*Este manual dita os processos soberanos do ecossistema BPlen HUB. A estrita observância das regras é a garantia de escalabilidade e segurança do projeto.*
