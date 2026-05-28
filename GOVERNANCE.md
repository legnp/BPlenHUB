# BPlen HUB — Diretrizes de Governança e Robustez

Este documento formaliza as leis de qualidade, a rotina de entrega segura e a integridade de engenharia do ecossistema BPlen HUB. Estas diretrizes são soberanas e guiam toda e qualquer colaboração entre a Inteligência Artificial (Antigravity) e o Gestor.

---

## 🚪 1. O Portal Obrigatório: Reporte Unificado

Nenhuma alteração de código, refatoração, correção de bug, deploy ou comando de modificação local pode ser executado antes da apresentação, revisão e aprovação explícita do **Reporte Unificado de Viabilidade Técnica e Planejamento Operacional**.

1.  **Fluxo de Trabalho de Demanda**:
    *   **Passo 1**: O Gestor apresenta a demanda no chat.
    *   **Passo 2**: O Antigravity mapeia o impacto e retorna o **Reporte Unificado** preenchido com as propostas operacionais e sugestão de modelo/volume.
    *   **Passo 3**: O Gestor revisa, faz comentários ou ajustes e fornece a aprovação formal.
    *   **Passo 4**: O Antigravity cria o `task.md` e inicia a execução técnica.
2.  **Mapeamento de Áreas**: No reporte, as **Camadas Afetadas** e as **Dependências de Código** devem obrigatoriamente citar a área de negócios de referência correspondente (ex: `admin`, `hub`, `home`, `firestore`, `coleção x`, etc.) e a camada técnica (client, server, back-end ou front-end).

---

## 📋 2. Definição de Pronto (Definition of Done)

Uma tarefa ou funcionalidade é considerada oficialmente **CONCLUÍDA** apenas quando:
1.  **Tipagem Forte**: Não existem usos de `any` em áreas lógicas ou críticas (Política Zero Any).
2.  **Combate ao Hardcoded**: Novos códigos priorizam dinamicidade (banco de dados, configuração ou variáveis). O uso de strings fixas/valores chumbados (hardcoded) é permitido apenas quando inexistirem alternativas.
3.  **Preservação de Legado**: Códigos legados existentes com desvios ou hardcoded são mantidos para preservar a segurança de produção. Se uma nova feature depender de alterá-los, o impacto será avaliado caso a caso na rota de aprovação do Gestor.
4.  **Build Limpo**: O comando `npm run build` termina com sucesso sem erros locais.
5.  **Lint & Style**: O comando `npm run lint` não reporta erros.
6.  **Testes de Regressão**: `npm run test` passa em 100% dos cenários (Vitest).
7.  **Classificação de Ativos**: Toda nova demanda de coleta deve ser classificada como **Survey**, **Form** ou **Hybrid** conforme os guias `SURVEY_GLOBAL.md` e `FORMS_GLOBAL.md`.

---

## 🔒 3. Rigor de Comunicação, Textos e Deploy

Para mitigar erros técnicos, reduzir processamento desnecessário e preservar a estética Premium do BPlen HUB, aplicam-se as seguintes regras de deploy:

1.  **Aprovação Textual Estrita (100%)**:
    *   Nenhum texto de interface, string de feedback, mensagens de alerta ou títulos podem ser deployados sem validação prévia.
    *   Todas as strings novas devem ser aprovadas no **Workbench de Texto** do *Reporte Unificado* antes de irem para o código.
2.  **Protocolo Zero Emoji**:
    *   É terminantemente proibido o uso de emojis em comentários de código, mensagens de erro, logs do console (`console.log`, `console.error`), exceções internas (`throw new Error`), commits de Git, e-mails de notificação e elementos visuais da interface (front-end e back-end).
    *   A identidade visual do projeto segue estritamente o minimalismo *Apple iOS Pro* baseado em ícones vetoriais elegantes (Lucide-react), fontes limpas e espaçamentos equilibrados.
3.  **Mapeamento de Dependências**:
    *   Antes de qualquer deploy ou push para o GitHub, o Antigravity deve evidenciar de forma detalhada como o novo código se relaciona e se pode afetar ou depender de outras áreas existentes do projeto.

---

## ⚙️ 4. Rotina de Validação e Segurança de Dados

1.  **Comando de Auditoria (Soberania)**:
    *   Sempre que desejar validar a integridade completa do ecossistema antes de um deploy, utilize o comando-chave:
        > **"Antigravity, execute o Gate de Soberania 3.1."**
    *   Este comando aciona a varredura automática de `any`, validação de arquivos confidenciais e execução do pipeline `npm run check`.
2.  **Isolamento de Dados**: Dados confidenciais de usuários residem estritamente em subcoleções privadas (`User/{matricula}/...`), nunca em coleções raiz soltas.
3.  **Blindagem de Ambiente (Zod)**: Toda variável em `.env` deve ser validada no startup pelo schema Zod (`src/env.ts`), impedindo execuções em caso de chaves nulas ou mal formatadas.

---
**BPlen HUB** — *Excelência e Governança em Desenvolvimento Humano.*
