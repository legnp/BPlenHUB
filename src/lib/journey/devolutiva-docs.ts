import type { UserBooking } from "@/types/calendar";

/**
 * Documentos entregues na reuniao de Devolutiva de Analise Comportamental.
 *
 * Sao os anexos que o admin registra naquele agendamento: a ata
 * (`meetingMinutesFile`) e os documentos do participante (`participantDocs`) —
 * ex.: o relatorio de Analise Comportamental e o DISC em PDF.
 */
export interface DevolutivaDoc {
  fileId: string;
  fileName: string;
}

/** Remove acento e caixa — o nome do evento e' texto livre do Google Calendar. */
function normalizar(valor: string | undefined | null): string {
  return (valor || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * O agendamento e' a devolutiva de analise comportamental?
 *
 * O nome vem do Google Calendar ("Devolutiva Analise Comportamental"), texto
 * livre que a Gestora pode reescrever. A normalizacao de acento aqui e'
 * DEFENSIVA, nao load-bearing: os termos buscados ("devolutiva",
 * "comportamental") nao tem acento hoje, entao ela nao muda o resultado — ela
 * protege se o termo mudar. O BUG-082 nasceu de um casamento cru como este, em
 * que o acento caiu justamente dentro do trecho buscado.
 */
function isDevolutiva(booking: UserBooking): boolean {
  const nome = normalizar(booking.eventSummary ?? booking.eventDetail?.summary);
  return nome.includes("devolutiva") && nome.includes("comportamental");
}

/**
 * Documentos da devolutiva do membro, prontos para exibicao. Vazio quando a
 * sessao ainda nao aconteceu ou o admin nao anexou nada — o chamador esconde a
 * acao nesse caso, em vez de oferecer um menu vazio.
 */
export function getDevolutivaDocs(bookings: readonly UserBooking[]): DevolutivaDoc[] {
  const docs: DevolutivaDoc[] = [];

  for (const booking of bookings) {
    if (!isDevolutiva(booking)) continue;

    if (booking.meetingMinutesFile?.fileId) {
      docs.push({
        fileId: booking.meetingMinutesFile.fileId,
        fileName: booking.meetingMinutesFile.fileName || "Ata da devolutiva"
      });
    }

    for (const doc of booking.participantDocs ?? []) {
      if (doc?.fileId) {
        docs.push({ fileId: doc.fileId, fileName: doc.fileName || "Documento" });
      }
    }
  }

  // O mesmo arquivo pode aparecer em mais de um agendamento (ex.: reagendamento).
  const vistos = new Set<string>();
  return docs.filter(d => (vistos.has(d.fileId) ? false : vistos.add(d.fileId)));
}
