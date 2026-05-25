# BPlen HUB: Segurança e Integridade de Dados

Este manual estabelece as leis de proteção contra falhas e vazamentos de dados, focando na blindagem do ambiente e na sincronia de registros.

## Blindagem de Ambiente (Sensor Zod)
- **Validação de Variáveis**: Toda variável em `.env` deve ser validada por um schema `Zod` em `src/env.ts`.
- **Interrupção de Falhas**: Se uma chave for nula ou mal formatada, o sistema deve interromper a execução e reportar de forma clara.

## 🔐 Controle de Acesso e Identidade
- **Middleware**: Proteção de rotas servidor (`/admin`, `/member`).
- **Permissões**: Hierarquia de usuários (Admin > Master > Member).
- **Branding de E-mail**: O e-mail "Master" (proprietário da conta) NUNCA deve ser exposto na interface do front-end. Toda comunicação deve usar Aliases.

## 📊 Integridade do Banco e Arquivos
- **Firestore Security Rules**: Somente os proprietários dos dados ou administradores podem ler/escrever.
- **Sincronia Drive/Firestore (Premissa 07)**: Todo dado salvo no Firestore deve ser espelhado no Google Drive em formato de planilha (Sheets) ou documento (PDF/TXT).
- **Matrícula BPlen**: Uso mandatório da "Matrícula BPlen" (`BP-xxx-PF-AAMMDD`) como chave primária única para usuários do ecossistema.

## 📥 Proteção de Dados Sensíveis (Blindagem #11)
- **NUNCA** subir a pasta `Instruções do Projeto/` ou arquivos `.env.local` para o GitHub (Garantido via `.gitignore`).
- **NUNCA** expor chaves privadas JSON de contas de serviço no código-fonte.

---
*Este documento é a base da nossa confiança. Falhas de segurança terão prioridade máxima de correção.*
