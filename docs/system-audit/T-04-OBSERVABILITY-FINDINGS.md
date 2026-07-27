# T-04 — Observabilidade (alertas de erro em produção): inventário e gap

Track de **escopo reduzido** (decisão registrada no `00-PLAN.md`): **inventariar** o
que existe hoje de monitoramento/alerta de erro em produção, **documentar o gap** e
**recomendar o próximo passo** — **não implementar**. Inventário feito por leitura de
código (read-only), 2026-07-23.

---

## 1. Inventário — o que existe hoje

| Camada | Estado | Detalhe |
|---|---|---|
| SDK de error tracking (Sentry/Datadog/Rollbar/…) | **Ausente** | Nenhuma dependência de monitoramento no `package.json` (verificado). |
| `instrumentation.ts` (hook de observabilidade do Next) | **Ausente** | Não existe. |
| `global-error.tsx` (captura de erro raiz) | **Ausente** | Não existe. |
| `error.tsx` de rota (`/admin`, `/hub`) | **Existe, mas só UX** | Mostram fallback visual com "Tentar novamente" + detalhes técnicos (dev/admin). **Não reportam** o erro a lugar nenhum (sem `captureException`, sem log externo). |
| Logging estruturado | **Ausente** | Sem `pino`/`winston`/log estruturado. O "log" de fato são **336 `console.error` + 34 `console.warn`** espalhados — vão só para o **log de função da Vercel**. |
| Retenção/drain de logs | **Ausente** | Sem log drain configurado. No plano Hobby o log de runtime é efêmero — sem histórico consultável depois. |
| Alerta proativo de ERRO | **1 único caminho** | `alertarFalha` (e-mail Resend → `notificacao@bplen.com`) no cron `sync-agenda`, quando o sync da agenda falha. É o **único** ponto que avisa a equipe de uma falha. |
| E-mails `notificacao@bplen.com` (booking, cancelamento, convite, FAQ) | Transacionais | São **notificações de negócio**, não alertas de erro — não contam como observabilidade. |
| Sinais da própria Vercel | Parcial | Por padrão a Vercel avisa **falha de BUILD/deploy** por e-mail. **Erro de RUNTIME** (server action que lança, exaustão de cota, throw não tratado) **não gera alerta** sem configuração. |

## 2. O gap (por que isso importa aqui)

**Um erro de runtime em produção é invisível para a equipe, a menos que um usuário
reporte o sintoma.** Não há "alarme" — a descoberta é sempre orientada por sintoma.

Isto não é hipótese: o próprio processo de auditoria bateu nessa classe de falha
**repetidas vezes, sempre de forma reativa**:
- **Apagões de cota do Firestore** (`BUG-087`) — a funcionalidade caiu e só se soube
  quando parou de funcionar.
- **`catch → []` que virava "tudo livre"** (`BUG-089`) — falha de backend mascarada
  como estado normal, sem nenhum sinal.
- **Merge sem deploy** (Lição 31) — o `git log` dizia "ok" e a Vercel não publicou; a
  Gestora descobriu, não a instrumentação.
- **Testes vermelhos na `main` por 4 dias** (`BUG-045`) / **em UTC por semanas**
  (`BUG-093`) — portões que ninguém via falhar.

Os **336 `console.error`** representam caminhos de erro reais cujo disparo **ninguém é
notificado**. Em produção, no plano gratuito, esses logs somem — não dá nem para
investigar depois do fato.

**Resumo do gap:** cobertura de UX de erro existe (as telas não quebram em branco), mas
**cobertura de OPERAÇÃO não** — não há captura, agregação, retenção nem alerta de erro
de runtime. A única exceção é a falha do cron da agenda.

## 3. Recomendação de próximo passo (não implementado — decisão da Gestora, pós-auditoria)

Ordenado do mais recomendado ao alternativo:

1. **Adotar um error tracker leve — recomendado: Sentry (`@sentry/nextjs`).** Free tier
   (~5k eventos/mês) cobre a escala atual. Um setup só instala `instrumentation.ts` +
   `global-error.tsx` + captura automática de erro em **server actions, rotas e render**;
   depois dá para ir adicionando `captureException` nos 336 pontos conhecidos de forma
   incremental. Entrega agregação, dedupe, histórico e **alerta** (e-mail/Slack) — que é
   exatamente o que falta.
2. **Log drains da Vercel → Axiom / Better Stack (Logtail).** Abordagem centrada em log:
   dá retenção + busca + alerta baseado em query. Bom se preferir "logs pesquisáveis" a
   "exceptions agrupadas". Requer plano/serviço externo.
3. **DIY mínimo reaproveitando o canal existente.** Um helper `reportError()` que, no
   `catch` de server action, manda e-mail para `notificacao@bplen.com` (reusa o Resend do
   `alertarFalha`). Custo zero de vendor, mas **sem dedupe/agrupamento/histórico** e
   ruidoso — serve como ponte, não como solução.

**Prioridade de cobertura (qualquer que seja a ferramenta):** ligar o alerta primeiro nas
classes de falha silenciosa já conhecidas — **erros de cota/permissão do Firestore** (a
classe do apagão), **falha do cron** (já manda e-mail — dá para unificar) e **throw não
tratado em server action**.

**Restrição de privacidade (LGPD / `CLAUDE.md` regras 4 e 7):** um error tracker captura
stack trace e, potencialmente, dados da requisição → **é obrigatório scrubar PII**
(e-mails, matrículas e, sobretudo, o e-mail do Master/equipe interna) antes do envio ao
provedor externo. Isso é parte do trabalho de implementação, não opcional.

## 4. Estado do track

**T-04 concluído no escopo reduzido definido** (inventário + gap + recomendação). A
**implementação fica fora do escopo da auditoria** (como o plano previu) — é uma decisão
da Gestora, pós-auditoria: escolher a ferramenta (Sentry recomendado), aprovar o custo
(free tier cobre hoje) e agendar o wiring + scrub de PII. Nenhum código alterado nesta fase.
