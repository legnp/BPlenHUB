---
description: Diretrizes de Governança para Criação e Envio de E-mails Transacionais
---

# Diretrizes Globais para E-mails Transacionais — BPlen HUB (v1.0 📧💎)

Todas as comunicações enviadas via e-mail (utilizando Resend ou qualquer outro gateway) no ecossistema BPlen HUB devem respeitar obrigatoriamente as diretrizes abaixo.

---

## 1. Regras de Design e Layout (Soberana v3.1)

O design oficial de e-mails do BPlen HUB é o **Soberana v3.1** (Apple Pro-Style). Ele deve ser importado de `src/lib/emails/soberana-layout.ts`.

* **Alinhamento**: Todo o conteúdo do corpo do e-mail, títulos, logomarca e rodapé deve ser **estritamente alinhado à esquerda**.
* **Cores e Estilos**: Utilizar os tokens expostos em `EMAIL_STYLES` (ex.: `${EMAIL_STYLES.h2}`, `${EMAIL_STYLES.p}`, `${EMAIL_STYLES.button}`).
* **Assinatura Padronizada**: Utilizar rodapés consistentes (ex.: `Equipe BPlen HUB` ou `BPlen Financeiro`).

---

## 2. Redação de Assuntos (Subjects) e Conteúdo

* **PROIBIÇÃO DE EMOJIS**: Nenhum emoji deve ser inserido nos assuntos (subjects) ou no corpo dos e-mails. A comunicação é premium e corporativa.
* **PREFIXOS EM ASSUNTOS**: **NÃO utilizar o nome BPlen entre colchetes** (exemplo: `[BPlen HUB]` ou `[BPlen]`) nos assuntos dos e-mails. O assunto deve ser limpo e direto ao ponto:
  * ❌ *Incorreto*: `[BPlen HUB] Presença confirmada: Onboarding`
  *  *Correto*: `Presença confirmada: Onboarding`

---

## 3. Extração Soberana de Nickname e Dados de Contato

Sempre que um e-mail for direcionado a um usuário específico, o nome do destinatário deve ser obtido respeitando a soberania de dados do projeto:

1. **Obter a Matrícula**: Identificar a matrícula do usuário.
2. **Consultar Coleção Raiz**: Buscar o documento mestre na coleção `User/{matricula}`.
3. **Cadeia de Fallbacks Oficial**:
   ```ts
   const nickname = uData.User_Nickname || uData.User_Welcome?.User_Nickname || uData.Authentication_Name || uData.User_Name || "Membro BPlen";
   ```
4. **Evitar Acoplamentos de Subcoleções**: Nunca confie unicamente em dados de nome/apelido persistidos em subcoleções (como `Calendar_Events/{id}/attendees`), pois estes podem não estar sincronizados com o estado mais atual da conta do usuário.

---

## 4. Remetentes Oficiais (Aliases)

Sempre utilize remetentes que correspondam perfeitamente ao contexto da transação:
* **Assuntos Financeiros / Compras / Recibos**: `BPlen Financeiro <financeiro@bplen.com>`
* **Assuntos Gerais de Eventos / Plataforma / Acessos**: `BPlen HUB <hub@bplen.com>`
