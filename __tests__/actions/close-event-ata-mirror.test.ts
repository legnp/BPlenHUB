import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";

/**
 * `BUG-101` — a Ata some do agendamento do membro se for enviada DEPOIS de
 * fechar o participante.
 *
 * O `meetingMinutesFile` do `User_Bookings` era escrito somente pela
 * `closeAttendeeAction`, que copia o valor do doc do evento NO INSTANTE do
 * fechamento do participante. A `closeEventAction` (quem recebe a Ata) gravava
 * no doc do evento e no historico de Atas, mas nunca voltava ao agendamento —
 * a ordem das duas partes decidia se o membro via a Ata (caso real: BP-005,
 * Devolutiva de 16/06, fechada 19:45 e Ata enviada 20:12).
 *
 * O fix espelha a Ata para o `User_Bookings` de cada participante no MESMO
 * laco que ja replica para `Atas`, tornando as duas partes independentes de
 * ordem. Fonte da verdade segue sendo o doc do evento.
 */

interface Escrita {
  path: string;
  payload: Record<string, unknown>;
}

const escritas: Escrita[] = [];

const estado: {
  evento: Record<string, unknown>;
  attendees: Array<Record<string, unknown>>;
  bookingsPorMatricula: Record<string, string | undefined>;
} = { evento: {}, attendees: [], bookingsPorMatricula: {} };

function fakeDoc(path: string): Record<string, unknown> {
  return {
    path,
    set: async (payload: Record<string, unknown>) => {
      escritas.push({ path, payload });
    },
    get: async () => ({
      exists: true,
      data: () => (path.startsWith("Calendar_Events/") ? estado.evento : {}),
    }),
    collection: (sub: string) => {
      const subPath = `${path}/${sub}`;
      if (sub === "attendees") {
        return {
          get: async () => ({
            empty: estado.attendees.length === 0,
            docs: estado.attendees.map((a) => ({ data: () => a })),
          }),
        };
      }
      if (sub === "User_Bookings") {
        return {
          where: () => ({
            limit: () => ({
              get: async () => {
                const matricula = path.split("/")[1];
                const bookingId = estado.bookingsPorMatricula[matricula];
                return bookingId
                  ? { empty: false, docs: [{ ref: fakeDoc(`${subPath}/${bookingId}`) }] }
                  : { empty: true, docs: [] };
              },
            }),
          }),
        };
      }
      return { doc: (id: string) => fakeDoc(`${subPath}/${id}`) };
    },
  };
}

vi.mock("@/lib/auth-guards", () => ({
  requireAdmin: async () => ({ uid: "admin-uid", isAdmin: true }),
}));

// Modulos pesados do grafo de import do post-event.ts (googleapis/Resend) —
// irrelevantes para este comportamento e lentos o bastante para estourar timeout.
vi.mock("@/lib/google-auth", () => ({
  getSheetsClient: async () => ({}),
  getDriveClient: async () => ({}),
}));
vi.mock("@/lib/drive-utils", () => ({
  createSpreadsheet: async () => ({ id: "", webViewLink: "" }),
  getEventDriveFolder: async () => "",
  syncDataToSheet: async () => {},
}));
vi.mock("@/lib/attendance-emails", () => ({
  sendAttendanceRegisteredEmail: async () => {},
  sendAbsenceRegisteredEmail: async () => {},
}));
vi.mock("@/actions/calendar-module/queries", () => ({
  getEventAttendees: async () => [],
}));

vi.mock("@/lib/firebase-admin", () => ({
  default: {
    firestore: {
      FieldValue: {
        serverTimestamp: () => "SERVER_TS",
        increment: (n: number) => n,
      },
    },
  },
  getAdminDb: () => ({
    collection: (nome: string) => ({
      doc: (id: string) => fakeDoc(`${nome}/${id}`),
      // updateGlobalProgramacaoRegistryAction roda ao final do fechamento; aqui
      // basta nao quebrar (colecao vazia).
      orderBy: () => ({ limit: () => ({ get: async () => ({ size: 0, docs: [] }) }) }),
    }),
    batch: () => ({
      set: (ref: { path: string }, payload: Record<string, unknown>) => {
        escritas.push({ path: ref.path, payload });
      },
      commit: async () => {},
    }),
  }),
}));

const ATA = {
  url: "https://drive.example/ata.pdf",
  fileId: "file-123",
  fileName: "ata.pdf",
  uploadedAt: "2026-06-16T20:12:00.000Z",
};

const fechamento = (meetingMinutesFile: typeof ATA | null) => ({
  lifecycleStatus: "completed" as const,
  internalGeneralComment: "",
  publicGeneralComment: "Sessão concluída.",
  meetingMinutesFile,
  updatedBy: "Gestora",
});

const escritasEm = (trecho: string) => escritas.filter((e) => e.path.includes(trecho));

describe("BUG-101: closeEventAction espelha a Ata no agendamento do membro", () => {
  // O primeiro import do modulo paga o custo de transform do grafo inteiro e
  // estoura o timeout padrao do primeiro teste — aquecer uma vez aqui.
  beforeAll(async () => {
    await import("@/actions/calendar-module/post-event");
  }, 30000);

  beforeEach(() => {
    escritas.length = 0;
    estado.evento = { summary: "Devolutiva Analise Comportamental", start: "2026-06-16T19:00:00-03:00" };
    estado.attendees = [{ matricula: "BP-005-PF-260523" }];
    estado.bookingsPorMatricula = { "BP-005-PF-260523": "bk-1" };
  });

  it("Ata enviada DEPOIS do fechamento do participante chega ao User_Bookings", async () => {
    const { closeEventAction } = await import("@/actions/calendar-module/post-event");
    const res = await closeEventAction("EV1", fechamento(ATA));

    expect(res.success).toBe(true);
    const noBooking = escritasEm("User_Bookings/bk-1");
    expect(noBooking).toHaveLength(1);
    expect(noBooking[0].payload.meetingMinutesFile).toEqual(ATA);
  });

  it("a replica para o historico de Atas (comportamento pre-existente) continua", async () => {
    const { closeEventAction } = await import("@/actions/calendar-module/post-event");
    await closeEventAction("EV1", fechamento(ATA));

    const nasAtas = escritasEm("User/BP-005-PF-260523/Atas/booking-EV1-ata");
    expect(nasAtas).toHaveLength(1);
    expect(nasAtas[0].payload.fileUrl).toBe(ATA.url);
  });

  it("participante sem agendamento correspondente nao quebra o fechamento", async () => {
    estado.bookingsPorMatricula = {};
    const { closeEventAction } = await import("@/actions/calendar-module/post-event");
    const res = await closeEventAction("EV1", fechamento(ATA));

    expect(res.success).toBe(true);
    expect(escritasEm("User_Bookings")).toHaveLength(0);
    // A replica de Atas nao depende do agendamento existir.
    expect(escritasEm("/Atas/")).toHaveLength(1);
  });

  it("matricula PENDING e pulada por inteiro, como antes", async () => {
    estado.attendees = [{ matricula: "PENDING" }, { matricula: "BP-005-PF-260523" }];
    const { closeEventAction } = await import("@/actions/calendar-module/post-event");
    await closeEventAction("EV1", fechamento(ATA));

    expect(escritasEm("User/PENDING")).toHaveLength(0);
    expect(escritasEm("User_Bookings/bk-1")).toHaveLength(1);
  });

  it("fechamento SEM Ata nao espelha nada", async () => {
    const { closeEventAction } = await import("@/actions/calendar-module/post-event");
    const res = await closeEventAction("EV1", fechamento(null));

    expect(res.success).toBe(true);
    expect(escritasEm("User_Bookings")).toHaveLength(0);
    expect(escritasEm("/Atas/")).toHaveLength(0);
  });
});
