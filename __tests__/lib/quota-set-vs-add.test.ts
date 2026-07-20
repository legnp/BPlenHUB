import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * `BUG-104` — somar (aquisição) x definir (edição).
 *
 * As duas operações eram a MESMA função, e o nome ("update") não dizia qual
 * acontecia. O painel do admin exibe o valor atual no campo e reenviava esse
 * mesmo valor — que era **somado**. Abrir a ficha e salvar duas vezes **dobrava**
 * a cota do membro.
 *
 * A soma continua existindo e é intencional (decisão da Gestora): uma nova
 * aquisição do mesmo serviço — ou de outro que conceda a mesma cota — deve
 * acumular. O que faltava era a operação ter nome próprio.
 *
 * Aqui o teste é de COMPORTAMENTO (não de arquitetura): a aritmética é a regra de
 * negócio, e é ela que dobrava o saldo.
 */

const walletState: { data: Record<string, unknown> | undefined } = { data: undefined };
let escrito: Record<string, unknown> | null = null;

vi.mock("@/lib/firebase-admin", () => ({
  default: {},
  getAdminDb: () => ({
    doc: () => ({}),
    // `resolveMatriculaByUid` (local a member-quotas.ts) le o _AuthMap por aqui.
    collection: () => ({
      doc: () => ({ get: async () => ({ exists: true, data: () => ({ matricula: "BP-001-PF-260418" }) }) }),
    }),
    runTransaction: async (fn: (t: unknown) => Promise<void>) => {
      const tx = {
        get: async () => ({ exists: walletState.data !== undefined, data: () => walletState.data }),
        update: (_ref: unknown, payload: Record<string, unknown>) => { escrito = payload; },
        set: (_ref: unknown, payload: Record<string, unknown>) => { escrito = payload; },
      };
      await fn(tx);
    },
  }),
}));

const quotasEscritas = () => (escrito?.quotas ?? {}) as Record<string, { total: number; used: number }>;

describe("cota: somar (aquisição) x definir (edição)", () => {
  beforeEach(() => {
    escrito = null;
    // Membro com 10 sessões contratadas, 3 já consumidas.
    walletState.data = { quotas: { "1-to-1": { total: 10, used: 3, lastUpdated: "x" } } };
  });

  it("addMemberQuotas SOMA — nova aquisição acumula", async () => {
    const { addMemberQuotas } = await import("@/lib/member-quotas");
    await addMemberQuotas("uid", { "1-to-1": 5 });
    expect(quotasEscritas()["1-to-1"].total).toBe(15);
  });

  it("setMemberQuotas DEFINE — salvar a ficha duas vezes não dobra", async () => {
    const { setMemberQuotas } = await import("@/lib/member-quotas");

    // O painel mostra 10 no campo e reenvia 10. Antes do BUG-104 isso virava 20.
    await setMemberQuotas("uid", { "1-to-1": 10 });
    expect(quotasEscritas()["1-to-1"].total).toBe(10);

    // E salvar de novo continua 10 — é o coração do bug.
    walletState.data = { quotas: quotasEscritas() };
    await setMemberQuotas("uid", { "1-to-1": 10 });
    expect(quotasEscritas()["1-to-1"].total).toBe(10);
  });

  it("definir PRESERVA o consumo — o admin edita o contratado, não o usado", async () => {
    const { setMemberQuotas } = await import("@/lib/member-quotas");
    await setMemberQuotas("uid", { "1-to-1": 20 });
    expect(quotasEscritas()["1-to-1"]).toMatchObject({ total: 20, used: 3 });
  });

  it("definir não mexe em chave que não veio no parâmetro", async () => {
    // O painel envia só as cotas de serviços ATIVOS. Apagar as demais seria uma
    // mudança de dado além da intenção de quem clicou em salvar.
    walletState.data = {
      quotas: {
        "1-to-1": { total: 10, used: 3, lastUpdated: "x" },
        "onboarding": { total: 1, used: 1, lastUpdated: "x" },
      },
    };
    const { setMemberQuotas } = await import("@/lib/member-quotas");
    await setMemberQuotas("uid", { "1-to-1": 7 });

    expect(quotasEscritas()["1-to-1"].total).toBe(7);
    expect(quotasEscritas()["onboarding"]).toMatchObject({ total: 1, used: 1 });
  });

  it("definir numa carteira nova parte de used = 0", async () => {
    walletState.data = undefined;
    const { setMemberQuotas } = await import("@/lib/member-quotas");
    await setMemberQuotas("uid", { "1-to-1": 4 });
    expect(quotasEscritas()["1-to-1"]).toMatchObject({ total: 4, used: 0 });
  });
});
