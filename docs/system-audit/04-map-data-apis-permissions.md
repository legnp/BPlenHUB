# Mapa 4 — Dados, APIs/Server Actions e Permissões

Mapeia de forma combinada (os três se entrelaçam):

a) Coleções/subcoleções do Firestore e o schema real de cada uma (campos e
   tipos, incluindo drift entre o tipo declarado em `src/types` e o que de fato
   é gravado/lido).
b) Cada rota de API (`src/app/api`) e Server Action (`src/actions`): quem chama
   (quais páginas/componentes), qual guard de autenticação/autorização usa
   (`requireAuth`/`requireAdmin`/nenhum), e qual integração externa aciona, se
   houver (Mercado Pago, Resend, Google Drive/Sheets).
c) Rotas/actions sem página associada (webhooks, crons) também entram, mesmo
   sem aparecer no Mapa de Páginas.

Ainda não populado — a ser preenchido pelo chat de planejamento a partir de
inspeção real do código (não assumir a partir de nomes de arquivo).

## Formato esperado

```
- Coleção: User/{matricula}/User_Permissions/quotas
  - Schema real: MemberQuotaWallet { uid, quotas: Record<string,MemberQuota>, ... }
  - Lida por: getMemberQuotasAction
  - Escrita por: updateMemberQuotasAction, consumeQuotaAction

- Server Action: getMemberQuotasAction(uid)
  - Chamada por: useJourney, admin/users/page.tsx, OneToOneBookingModal
  - Auth guard: nenhum explícito
  - Integração externa: nenhuma
```
