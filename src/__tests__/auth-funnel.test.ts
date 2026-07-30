import { describe, it, expect } from "vitest";
import { buildAuthFunnel, classifyFunnelStage } from "@/lib/auth-funnel";
import type { RawAuthMap, RawAuthUser, RawUserDoc } from "@/types/auth-funnel";

/**
 * Funil de Autenticacoes — classificacao dos 3 estagios + casos de borda.
 * Testa a funcao de producao (`buildAuthFunnel`/`classifyFunnelStage`), nao
 * uma copia (Licao 18). Ver docs/system-audit/AUTH-TRACKING-DESIGN.md.
 */

function authUser(over: Partial<RawAuthUser> & { uid: string }): RawAuthUser {
  return {
    email: `${over.uid}@ext.com`,
    displayName: over.uid,
    provider: "google.com",
    creationTime: "2026-07-01T00:00:00.000Z",
    lastSignInTime: "2026-07-20T00:00:00.000Z",
    disabled: false,
    ...over,
  };
}

describe("classifyFunnelStage — os 3 estagios", () => {
  it("sem matricula = authenticated (logou, nunca abriu welcome)", () => {
    expect(classifyFunnelStage({ matricula: null, userExists: false, hasCompletedWelcome: false })).toBe(
      "authenticated"
    );
  });

  it("matricula + User inexistente = identity_generated (abriu, nao concluiu)", () => {
    expect(classifyFunnelStage({ matricula: "BP-001-PF-260701", userExists: false, hasCompletedWelcome: false })).toBe(
      "identity_generated"
    );
  });

  it("matricula + User existe mas hasCompletedWelcome=false = identity_generated", () => {
    // Caso discriminante (Licao 15): so a flag de conclusao separa este estagio
    // da Recepcao completa — inverter a flag muda a resposta.
    expect(classifyFunnelStage({ matricula: "BP-002-PF-260701", userExists: true, hasCompletedWelcome: false })).toBe(
      "identity_generated"
    );
  });

  it("matricula + User existe + hasCompletedWelcome=true = reception_complete", () => {
    expect(classifyFunnelStage({ matricula: "BP-003-PF-260701", userExists: true, hasCompletedWelcome: true })).toBe(
      "reception_complete"
    );
  });
});

describe("buildAuthFunnel — join das tres fontes", () => {
  it("classifica os 3 estagios a partir das contas de login", () => {
    const authUsers: RawAuthUser[] = [
      authUser({ uid: "uidA" }), // authenticated (sem AuthMap)
      authUser({ uid: "uidB" }), // identity_generated (AuthMap sem User completo)
      authUser({ uid: "uidC" }), // reception_complete
    ];
    const authMaps: RawAuthMap[] = [
      { uid: "uidB", matricula: "BP-002-PF-260701", recovered: false },
      { uid: "uidC", matricula: "BP-003-PF-260701", recovered: false },
    ];
    const users: RawUserDoc[] = [
      { matricula: "BP-003-PF-260701", uid: "uidC", email: "c@ext.com", name: "C", hasCompletedWelcome: true },
    ];

    const { rows, summary } = buildAuthFunnel({ authUsers, authMaps, users });

    const byUid = Object.fromEntries(rows.map((r) => [r.uid, r]));
    expect(byUid.uidA.stage).toBe("authenticated");
    expect(byUid.uidB.stage).toBe("identity_generated");
    expect(byUid.uidC.stage).toBe("reception_complete");

    expect(summary.totalAuthenticated).toBe(3);
    expect(summary.identityGenerated).toBe(1);
    expect(summary.receptionComplete).toBe(1);
    expect(summary.conversionRate).toBeCloseTo(1 / 3);
  });

  it("resolve identidade por uid do User quando o AuthMap falta (auto-healing)", () => {
    const authUsers = [authUser({ uid: "uidD" })];
    const authMaps: RawAuthMap[] = []; // sem AuthMap
    const users: RawUserDoc[] = [
      { matricula: "BP-004-PF-260701", uid: "uidD", email: "d@ext.com", name: "D", hasCompletedWelcome: true },
    ];

    const { rows } = buildAuthFunnel({ authUsers, authMaps, users });
    expect(rows).toHaveLength(1);
    expect(rows[0].matricula).toBe("BP-004-PF-260701");
    expect(rows[0].stage).toBe("reception_complete");
  });

  it("borda: _AuthMap orfao sem conta de login vira linha de higiene", () => {
    const authUsers: RawAuthUser[] = [];
    const authMaps: RawAuthMap[] = [{ uid: "ghost", matricula: "BP-009-PF-260701", recovered: true }];
    const users: RawUserDoc[] = [];

    const { rows, summary } = buildAuthFunnel({ authUsers, authMaps, users });
    expect(rows).toHaveLength(1);
    expect(rows[0].hasAuthAccount).toBe(false);
    expect(rows[0].note).toBe("orphan_authmap");
    expect(rows[0].recovered).toBe(true);
    expect(rows[0].stage).toBe("identity_generated");
    expect(summary.orphanAuthMaps).toBe(1);
    expect(summary.totalAuthenticated).toBe(0);
  });

  it("borda: User sem conta de login vira linha de higiene", () => {
    const authUsers: RawAuthUser[] = [];
    const authMaps: RawAuthMap[] = [];
    const users: RawUserDoc[] = [
      { matricula: "BP-010-PF-260701", uid: null, email: "legacy@ext.com", name: "Legado", hasCompletedWelcome: true },
    ];

    const { rows, summary } = buildAuthFunnel({ authUsers, authMaps, users });
    expect(rows).toHaveLength(1);
    expect(rows[0].hasAuthAccount).toBe(false);
    expect(rows[0].note).toBe("user_without_auth");
    expect(rows[0].stage).toBe("reception_complete");
    expect(summary.usersWithoutAuth).toBe(1);
  });

  it("nao duplica: User cujo uid ja e conta de login nao vira linha de borda", () => {
    const authUsers = [authUser({ uid: "uidE" })];
    const authMaps: RawAuthMap[] = [];
    const users: RawUserDoc[] = [
      { matricula: "BP-005-PF-260701", uid: "uidE", email: "e@ext.com", name: "E", hasCompletedWelcome: false },
    ];

    const { rows, summary } = buildAuthFunnel({ authUsers, authMaps, users });
    expect(rows).toHaveLength(1);
    expect(rows[0].hasAuthAccount).toBe(true);
    expect(summary.usersWithoutAuth).toBe(0);
  });

  it("mascara a identidade interna em email e nome (regra 7)", () => {
    const authUsers = [
      authUser({ uid: "uidMaster", email: "legnp@bplen.com", displayName: "legnp@bplen.com" }),
    ];
    const { rows } = buildAuthFunnel({ authUsers, authMaps: [], users: [] });
    expect(rows[0].email).not.toContain("bplen.com");
    expect(rows[0].email).toBe("Consultoria BPlen");
    expect(rows[0].displayName).toBe("Consultoria BPlen");
  });
});
