# BPlen HUB: Arquitetura Anti-Spaghetti

Este manual define as regras de ouro para manter a escalabilidade e organização do código. É terminantemente proibido violar estas diretrizes sem uma revisão formal de governança.

## 📁 Estrutura de Pastas Master
Todo novo código deve residir nestas categorias:
- `src/components/ui/`: Componentes atômicos puros (Buttons, Cards, Badges).
- `src/components/layout/`: Elementos estruturais globais (Grid, Navigation).
- `src/components/forms/`: Lógicas de interação de dados e formulários.
- `src/hooks/`: Toda lógica de negócio e estados complexos fora das páginas.
- `src/types/`: Definições rigorosas de TypeScript (Schemas Zod, Interfaces).
- `src/lib/`: Instalações de SDKs e clientes (Firebase, Google, Resend).

## 🛠️ Regras de Desenvolvimento
1. **Nada de Inline**: Se um código de interface for repetido em duas páginas, ele deve obrigatoriamente ser abstraído em um componente em `/ui` ou `/layout`.
2. **TypeScript Strict**: O uso de `any` é estritamente proibido. Toda interface deve ser tipada em `src/types` ou localmente com rigor.
3. **Páginas Orquestradoras**: As páginas em `src/app/` devem servir apenas como orquestradoras, chamando componentes e hooks. Evite lógica de negócio pesada dentro das páginas.
4. **Validação Atômica**: Toda entrada de dados (incluindo variáveis de ambiente e retornos de API) deve passar pelo sensor do `Zod`.

## 📦 Gestão de Estado
- Use o estado local do React para componentes UI simples.
- Use `Context` ou `Zustand` para estados globais (Onboarding, Autenticação, Preferências).

---
*Este documento é a base da nossa integridade técnica. Em caso de dúvida, a regra vence a tarefa.*
