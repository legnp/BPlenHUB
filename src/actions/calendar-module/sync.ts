import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-guards";
import { getCalendarClient } from "@/lib/google-auth";
import { formatISO, addDays } from "date-fns";
import { serverEnv } from "@/env";
import { GoogleCalendarEvent } from "@/types/calendar";
import { CALENDAR_CONFIG } from "@/config/calendarConfig";
import { calendar_v3 } from "googleapis";
import { getEventStandardSlug } from "@/lib/utils";
import { isBlockerSummary } from "@/lib/booking/blocker";
import { updateGlobalProgramacaoRegistryAction } from "./post-event";
import { getCalendarEventTypes } from "@/actions/calendar-event-types";

/** Casa o titulo do Google com o `googleTitle` do tipo, sem depender de acento/caixa. */
function normalizeEventTitle(value: string | undefined | null): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Sincronização de 90 Dias (Firestore 🛡️)
 * Identifica novos eventos, atualiza existentes e remove "fantasmas".
 */
export async function syncCalendarToFirestore(idToken?: string) {
  await requireAdmin(idToken);
  // Disparo humano: a Gestora ve o resultado na tela, entao uma remocao grande
  // (ex.: limpeza legitima de muitos eventos) nao e barrada.
  return runCalendarSync({ guardMassDeletion: false });
}

/**
 * O sync em si, SEM guard — resolvedor cru.
 *
 * Existe separado porque o cron nao tem sessao de admin: pôr `requireAdmin` aqui
 * dentro impediria o disparo automatico. Padrao do Protocolo item 8 / Licao 9:
 * separar o resolvedor cru (interno, chamado por quem ja verificou a identidade)
 * do action exposto na rede (`syncCalendarToFirestore`, com `requireAdmin`).
 * **Nao exportar isto pelo dispatcher `calendar.ts`** — quem chama de fora tem de
 * passar pelo action guarded ou pela rota de cron (que valida o `CRON_SECRET`).
 *
 * `guardMassDeletion`: trava anti-apagao para execucao NAO ASSISTIDA. Se a
 * resposta do Google vier drasticamente menor que a base, aborta em vez de
 * apagar — uma resposta parcial as 3h sumiria com eventos reais em silencio, e
 * so se descobriria quando um membro nao conseguisse agendar.
 */
export async function runCalendarSync(options: { guardMassDeletion?: boolean } = {}) {
  try {
    const calendar = await getCalendarClient();
    const db = getAdminDb();
    const now = new Date();
    const ninetyDaysOut = addDays(now, CALENDAR_CONFIG.SYNC_WINDOW_DAYS);

    const timeMin = formatISO(now);
    const timeMax = formatISO(ninetyDaysOut);

    // Pagina TODAS as paginas do Google. `events.list` devolve no maximo 250 por
    // pagina por padrao e este sync nunca seguia o `nextPageToken` — enxergava so
    // 250 dos ~795 eventos da janela, nada depois do 250o sincronizava, e a
    // limpeza abaixo apagava da base os que ele nao tinha lido (BUG-088).
    const googleItems: calendar_v3.Schema$Event[] = [];
    let pageToken: string | undefined = undefined;
    let pages = 0;
    do {
      const page: calendar_v3.Schema$Events = (await calendar.events.list({
        calendarId: serverEnv.GOOGLE_CALENDAR_ID,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 2500, // teto por pagina da API — reduz o numero de paginas
        pageToken,
      })).data;
      googleItems.push(...(page.items || []));
      pageToken = page.nextPageToken || undefined;
      pages++;
      if (pages >= 20) {
        // Trava de seguranca: 20 paginas x 2500 = 50k eventos, muito acima de
        // qualquer janela real de 90 dias. Se chegar aqui, algo esta errado —
        // falha alto em vez de sincronizar pela metade em silencio.
        console.error(`[Sync] Limite de ${pages} paginas atingido; janela suspeita. Abortando.`);
        return { success: false, message: "Sincronizacao abortada: numero de paginas acima do esperado." };
      }
    } while (pageToken);

    // Os eventos de bloqueio SAO sincronizados, e de proposito: a agenda publica
    // (`getPublicSlotsAction`) so trata um horario como ocupado se houver evento
    // sobreposto aqui em `Calendar_Events`. Filtra-los na gravacao — o que este
    // sync fazia desde `fc00c6d` — deixava a grade de proposta oferecer ao lead
    // horarios que a Gestora tem bloqueados (BUG-084). Quem nao deve exibi-los
    // filtra na LEITURA, pelo campo `isBlocker` gravado abaixo.
    const googleIds = new Set(googleItems.map(item => item.id).filter(Boolean));

    // Cleanup: Buscar eventos no Firestore nesse período
    const firestoreEventsSnap = await db.collection("Calendar_Events")
      .where("start", ">=", timeMin)
      .where("start", "<=", timeMax)
      .get();

    // Com a paginacao acima, esta rodada pode envolver ~795 escritas + delecoes —
    // acima do limite de 500 operacoes por batch do Firestore. Acumulamos as
    // operacoes e comitamos em blocos (BUG-086 era o sintoma inverso: truncar
    // silenciosamente por causa de um limite nao respeitado).
    type Op = { kind: "delete"; ref: FirebaseFirestore.DocumentReference }
            | { kind: "set"; ref: FirebaseFirestore.DocumentReference; data: FirebaseFirestore.DocumentData };
    const ops: Op[] = [];
    let deletedCount = 0;
    let syncedCount = 0;

    // Remover deletados
    firestoreEventsSnap.docs.forEach(doc => {
      if (!googleIds.has(doc.id)) {
        ops.push({ kind: "delete", ref: doc.ref });
        deletedCount++;
      }
    });

    // Tipos de evento (Etapa 3.1): resolvem o SIGNIFICADO do slot a partir do
    // titulo generico do Google. Nesta fase o `tipoId` e apenas GRAVADO — ninguem
    // le para decidir nada, e o casamento atual (palavra-chave + `Tema:`) segue
    // intocado. A virada acontece na Fase 3.3, depois de validada. Evento que nao
    // casa com nenhum tipo fica sem `tipoId` e aparece no admin como "sem tipo".
    const eventTypes = await getCalendarEventTypes();
    const tipoPorTitulo = new Map(
      eventTypes.map(t => [normalizeEventTitle(t.googleTitle), t])
    );

    // Upsert dos vindos do Google
    const syncStamp = new Date().toISOString();
    googleItems.forEach((item: calendar_v3.Schema$Event) => {
      if (!item.id) return;
      const ref = db.collection("Calendar_Events").doc(item.id);

      const rawDescription = item.description || "";
      const plainDescription = rawDescription.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "\n");
      const capacityMatch = plainDescription.match(/Vagas:\s*(\d+)/i);
      const mentorMatch = plainDescription.match(/Orientador:\s*([^\n;]+)/i);
      const themeMatch = plainDescription.match(/Tema:\s*([^\n;]+)/i);

      const tipo = tipoPorTitulo.get(normalizeEventTitle(item.summary));

      ops.push({ kind: "set", ref, data: {
        summary: item.summary,
        // Etapa 3.1 — so classifica; nenhum consumidor le isto ainda.
        tipoId: tipo?.id ?? null,
        start: item.start?.dateTime || item.start?.date,
        end: item.end?.dateTime || item.end?.date,
        location: item.location || "",
        htmlLink: item.htmlLink,
        meetingLink: item.hangoutLink || "",
        totalCapacity: capacityMatch ? parseInt(capacityMatch[1]) : 0,
        mentor: mentorMatch ? mentorMatch[1].trim() : "",
        theme: themeMatch ? themeMatch[1].trim() : undefined,
        slug: getEventStandardSlug(item.summary || "", item.start?.dateTime || item.start?.date || "", item.id),
        // Classificado na gravacao para que os leitores filtrem por identificador,
        // e nao refazendo cada um o seu casamento de texto no titulo.
        isBlocker: isBlockerSummary(item.summary),
        lastSync: syncStamp
      } });
      syncedCount++;
    });

    // Trava anti-apagao (execucao nao assistida). Se a resposta do Google veio
    // parcial, o cleanup acima marcaria para delecao os eventos que ele nao viu —
    // e ninguem esta olhando as 3h. Aborta ANTES de qualquer escrita.
    if (options.guardMassDeletion && firestoreEventsSnap.size > 0) {
      const ratio = deletedCount / firestoreEventsSnap.size;
      if (ratio > 0.5) {
        const pct = (ratio * 100).toFixed(0);
        const msg = `Abortado por seguranca: o sync apagaria ${deletedCount} de ${firestoreEventsSnap.size} eventos da janela (${pct}%). A resposta do Google veio com ${googleItems.length} eventos e pode estar incompleta. Nada foi alterado. Rode o Sincronizar manual para revisar.`;
        console.error(`[Sync] ${msg}`);
        return { success: false, message: msg };
      }
    }

    // Comita em blocos de 450 (margem sob o teto de 500 do Firestore).
    const BATCH_LIMIT = 450;
    for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
      const batch = db.batch();
      for (const op of ops.slice(i, i + BATCH_LIMIT)) {
        if (op.kind === "delete") batch.delete(op.ref);
        else batch.set(op.ref, op.data, { merge: true });
      }
      await batch.commit();
    }

    // Reconstroi o snapshot `Programacao_Registry` a partir do que acabamos de
    // gravar. As telas do membro (modal de 1 to 1, gestao_agenda) e o admin
    // (ProgramacaoResumo) leem esse snapshot, nao o `Calendar_Events` fresco — e
    // o snapshot so era refeito por acoes de booking/post-evento, entao a agenda
    // do membro congelava entre sincronizacoes (BUG-095). Sem isto, os eventos
    // recem-sincronizados sao invisiveis para o membro ate alguem agendar algo.
    // Falha do rebuild nao invalida o sync em si: registra e segue.
    try {
      await updateGlobalProgramacaoRegistryAction();
    } catch (registryErr) {
      console.error("[Sync] Sincronizacao ok, mas o rebuild do Programacao_Registry falhou:", registryErr);
    }

    return { success: true, count: googleItems.length, synced: syncedCount, deleted: deletedCount };
  } catch (error) {
    console.error("Erro na sincronização de calendário:", error);
    return { success: false, message: (error as Error).message };
  }
}
