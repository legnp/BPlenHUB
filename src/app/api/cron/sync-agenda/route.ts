import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { serverEnv } from "@/env";
import { runCalendarSync } from "@/actions/calendar-module/sync";
import { getAdminDb } from "@/lib/firebase-admin";
import { refreshAdminMetricsSnapshot } from "@/lib/admin/metrics-snapshot";

/**
 * Sincronizacao automatica da agenda (cron diario da Vercel).
 *
 * Agendado em `vercel.json` para **06:00 UTC = 03:00 no horario de Brasilia**.
 * O cron da Vercel roda em UTC — escrever "0 3" aqui dispararia a meia-noite no
 * Brasil. (Mesma classe de armadilha do BUG-093.) No plano Hobby a precisao e de
 * +-59min, entao a execucao cai entre 03:00 e 03:59 BRT.
 *
 * Seguranca: esta rota MUTA estado (grava e apaga eventos). O projeto ja foi
 * mordido por uma rota de sync sem guard (`BUG-024` removeu a `/api/trigger-sync`;
 * a Licao 1 nasceu de um GET que reescreveu producao). Por isso ela:
 *   - exige o header `Authorization: Bearer <CRON_SECRET>` que a Vercel envia;
 *   - **falha fechada**: sem `CRON_SECRET` configurado, recusa todo mundo;
 *   - roda com a trava anti-apagao ligada (execucao nao assistida).
 *
 * Nota: o segredo e lido de `process.env` direto, e nao do schema Zod de
 * `src/env.ts`, porque aquele arquivo e area sensivel (gated no `CLAUDE.md`) —
 * mover para la e uma mudanca a parte, com aprovacao propria.
 */

// O sync percorre ~800 eventos (Google + escritas em blocos). O default de 10s
// nao basta; 60s e o teto do plano Hobby.
export const maxDuration = 60;

const TEAM_ALERT_TO = "notificacao@bplen.com";

async function alertarFalha(detalhe: string) {
  try {
    const resend = new Resend(serverEnv.RESEND_API_KEY);
    await resend.emails.send({
      from: "BPlen HUB <hub@bplen.com>",
      to: TEAM_ALERT_TO,
      subject: "Falha na sincronizacao automatica da agenda",
      html: `
        <p>A sincronizacao automatica da agenda (03:00) <b>nao foi concluida</b>.</p>
        <p style="background:#FFF0F6;border-left:4px solid #ff2c8d;padding:12px;border-radius:8px;font-size:13px;">
          ${detalhe}
        </p>
        <p style="font-size:13px;">A agenda segue com os dados da ultima sincronizacao bem-sucedida —
        nada foi corrompido. Para atualizar agora, use o botao <b>Sincronizar</b> em
        Admin &gt; Sincronizar Agenda.</p>
      `,
    });
  } catch (mailErr) {
    // O alerta falhar nao pode mascarar a falha original nos logs.
    console.error("[Cron] Falha ao enviar o e-mail de alerta:", mailErr);
  }
}

/**
 * T1-2: snapshot diario de metricas do admin (`Admin_Metrics_Daily`) partilhando o
 * mesmo slot de cron (plano Hobby, 1 slot — decisao da Gestora). Best-effort e
 * isolado: a falha do snapshot NUNCA invalida o sync nem derruba o cron (Licao 40).
 * Idempotente — recalcula do zero e sobrescreve.
 */
async function atualizarSnapshotMetricas() {
  try {
    const db = getAdminDb();
    const snap = await refreshAdminMetricsSnapshot(db);
    console.log(`[Cron] Snapshot de metricas do admin atualizado (${snap.dateKey}).`);
  } catch (err) {
    console.error("[Cron] Falha ao atualizar o snapshot de metricas (ignorada):", err);
  }
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error("[Cron] CRON_SECRET nao configurado — requisicao recusada (falha fechada).");
    return NextResponse.json({ error: "Cron nao configurado." }, { status: 503 });
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    console.warn("[Cron] Tentativa de disparo sem credencial valida.");
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  try {
    const result = await runCalendarSync({ guardMassDeletion: true });

    // Snapshot de metricas do admin (T1-2): isolado e independente da agenda —
    // roda mesmo que o sync recuse, e sua falha e absorvida (nao afeta a resposta).
    await atualizarSnapshotMetricas();

    if (!result.success) {
      // Inclui o caso da trava anti-apagao: e uma recusa deliberada, e a Gestora
      // precisa saber que a agenda NAO foi atualizada.
      await alertarFalha(result.message || "Motivo nao informado pelo sync.");
      return NextResponse.json(result, { status: 500 });
    }

    console.log(`[Cron] Agenda sincronizada: ${result.synced} eventos, ${result.deleted} removidos.`);
    return NextResponse.json(result);
  } catch (error) {
    const detalhe = error instanceof Error ? error.message : "Erro desconhecido.";
    console.error("[Cron] Erro nao tratado na sincronizacao:", error);
    await alertarFalha(detalhe);
    return NextResponse.json({ success: false, message: detalhe }, { status: 500 });
  }
}
