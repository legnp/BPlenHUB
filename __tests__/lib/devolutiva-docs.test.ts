import { describe, it, expect } from "vitest";
import { getDevolutivaDocs } from "@/lib/journey/devolutiva-docs";
import type { UserBooking } from "@/types/calendar";

const booking = (patch: Partial<UserBooking>): UserBooking =>
  ({
    id: "x", eventId: "x", userId: "u", week: 1, year: 2026,
    timestamp: null, rating: 0, feedback: "", eventDetail: null,
    ...patch
  }) as UserBooking;

const doc = (fileId: string, fileName: string) =>
  ({ fileId, fileName, url: `https://drive.google.com/file/d/${fileId}/view`, uploadedAt: "2026-06-16T19:45:52.890Z" });

/** Agendamentos reais do BP-005-PF-260523 (levantados da base). */
const BOOKINGS_REAIS: UserBooking[] = [
  booking({
    id: "onboarding-1", eventSummary: "Onboarding",
    meetingMinutesFile: doc("1_EKJaOyivFKwowVDLrZoW1zpfbHEbRek", "Ata-Onboarding_BPlen-202606031530.pdf"),
    participantDocs: [doc("1W5j049KBAiGAwPAGSLV89aFR-XO7ELfe", "download.jfif")]
  }),
  booking({ id: "1to1-1", eventSummary: "1 to 1" }),
  booking({ id: "plano-1", eventSummary: "Consultoria Plano de Carreira" }),
  booking({
    id: "devolutiva-1", eventSummary: "Devolutiva Analise Comportamental",
    meetingMinutesFile: null,
    participantDocs: [
      doc("1sNG9a1I9SrxS-vYDbkoajsMn5uq_5U4q", "BPlen_HUB-Rt-Dev_Analise_Comportamental-BP-005-PF-260523.pdf"),
      doc("1zX13PlTQ3SfirGU0uoAB_7-7XzOF3ujY", "DISC-BP-005-PF-260523-Lisandra_Lencina-202508.pdf")
    ]
  }),
];

describe("getDevolutivaDocs — documentos entregues na devolutiva", () => {
  it("devolve os 2 documentos da devolutiva do BP-005", () => {
    const docs = getDevolutivaDocs(BOOKINGS_REAIS);
    expect(docs.map(d => d.fileName)).toEqual([
      "BPlen_HUB-Rt-Dev_Analise_Comportamental-BP-005-PF-260523.pdf",
      "DISC-BP-005-PF-260523-Lisandra_Lencina-202508.pdf"
    ]);
  });

  it("NAO traz documentos de outras sessoes", () => {
    // Discriminante: o Onboarding tem ata e anexo. Se o filtro do evento falhar,
    // o membro veria a ata do Onboarding no card de Analise Comportamental.
    const docs = getDevolutivaDocs(BOOKINGS_REAIS);
    expect(docs.map(d => d.fileName).join()).not.toContain("Onboarding");
    expect(docs.map(d => d.fileName).join()).not.toContain("download.jfif");
  });

  it("inclui a ata da devolutiva quando existir", () => {
    const docs = getDevolutivaDocs([
      booking({
        id: "d", eventSummary: "Devolutiva Analise Comportamental",
        meetingMinutesFile: doc("ata-1", "Ata-Devolutiva.pdf"),
        participantDocs: [doc("rel-1", "Relatorio.pdf")]
      })
    ]);
    expect(docs.map(d => d.fileName)).toEqual(["Ata-Devolutiva.pdf", "Relatorio.pdf"]);
  });

  it("casa as duas grafias reais do evento no Google Calendar", () => {
    // O nome e' texto livre e ja aparece com e sem acento em "Análise".
    // Nota honesta: este teste NAO exercita a normalizacao de acento — os termos
    // buscados ("devolutiva"/"comportamental") nao tem acento, entao ele passa
    // com ou sem ela. A normalizacao la e' defensiva, e esta documentada como tal.
    for (const nome of ["Devolutiva Analise Comportamental", "Devolutiva Análise Comportamental"]) {
      const docs = getDevolutivaDocs([
        booking({ id: "d", eventSummary: nome, participantDocs: [doc("f1", "Relatorio.pdf")] })
      ]);
      expect(docs).toHaveLength(1);
    }
  });

  it("cai no eventDetail quando o agendamento legado nao tem eventSummary", () => {
    const docs = getDevolutivaDocs([
      booking({
        id: "d",
        eventDetail: { summary: "Devolutiva Analise Comportamental" } as UserBooking["eventDetail"],
        participantDocs: [doc("f1", "Relatorio.pdf")]
      })
    ]);
    expect(docs).toHaveLength(1);
  });

  it("sessao sem anexo devolve vazio (a acao fica escondida)", () => {
    const docs = getDevolutivaDocs([
      booking({ id: "d", eventSummary: "Devolutiva Analise Comportamental", participantDocs: [] })
    ]);
    expect(docs).toEqual([]);
  });

  it("sem devolutiva agendada devolve vazio", () => {
    expect(getDevolutivaDocs([booking({ id: "a", eventSummary: "1 to 1" })])).toEqual([]);
  });

  it("nao repete o mesmo arquivo (ex.: reagendamento)", () => {
    const docs = getDevolutivaDocs([
      booking({ id: "d1", eventSummary: "Devolutiva Analise Comportamental", participantDocs: [doc("f1", "Relatorio.pdf")] }),
      booking({ id: "d2", eventSummary: "Devolutiva Analise Comportamental", participantDocs: [doc("f1", "Relatorio.pdf")] }),
    ]);
    expect(docs).toHaveLength(1);
  });
});
