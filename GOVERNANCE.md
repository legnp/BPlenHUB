# BPlen HUB — Diretrizes de Governança e Robustez

Este documento formaliza os critérios de qualidade e a rotina de entrega segura do ecossistema BPlen HUB.

## 📋 Definição de Pronto (Definition of Done)

Uma tarefa ou funcionalidade é considerada **CONCLUÍDA** apenas quando:
1. **Tipagem Forte**: Não existem usos de `any` em áreas lógicas ou críticas (Política Zero Any).
2. **Build Limpo**: O comando `npm run build` termina com sucesso sem erros.
3. **Lint & Style**: `npm run lint` não reporta erros (avisos de acessibilidade em imagens são aceitáveis temporariamente).
4. **Testes**: `npm run test` passa em 100% dos casos.
5. **Arquitetura Hierárquica**: Dados sensíveis de usuários residem em subcoleções privadas (`User/{matricula}/...`).
6. **Classificação de Ativos**: Toda nova demanda de coleta deve ser classificada como **Survey**, **Form** ou **Hybrid** conforme as definições de `SURVEY_GLOBAL.md` e `FORMS_GLOBAL.md`.

## ⚙️ Rotina de Validação e Governança
 
### 1. Comando de Auditoria (Antigravity)
Sempre que desejar validar a integridade completa antes de um deploy, utilize o comando-chave para a IA:
> **"Antigravity, execute o Gate de Soberania 3.1."**

Este comando aciona a auditoria automática de `any`, verificação de cobertura de testes, validação de arquitetura modular e execução do pipeline `npm run check`.

### 2. Pipeline Local (Manual)
Antes de cada `git push` ou deploy, **DEVE-SE** executar obrigatoriamente:

```powershell
npm run check
```

O pipeline unifica:
- `lint`: Garante padrões Zero-Any.
- `test`: Valida fluxos críticos (Vitest).
- `type-check`: Valida integridade do TypeScript (`tsc`).
- `build`: Garante estabilidade da aplicação Next.js.


## 🔐 Segurança e Arquitetura de Dados

- **Isolamento**: Nunca use coleções raiz para dados que pertencem a um único usuário.
- **Identificação**: Utilize o `AuthContext` para obter `matricula` e `nickname`. Evite consultas repetitivas ao Firestore.
- **Transactions**: Operações que envolvem contadores (vagas, sequências) devem usar `runTransaction`.

- Bloqueio de build ou type-check.
- Uso de any sem justificativa técnica extrema.
- Vazamento de chaves de API (protegido pelo sensor Zod).
- Chamadas de banco de dados sem validação de permissão.
- Uso de emojis em interfaces ou comunicações oficiais.

---
**BPlen HUB** — *Excelência em Desenvolvimento Humano.*
