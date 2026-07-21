import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * `BUG-108` — o `submitInvitationSurveyAction` aceitava `token` E `matricula` como
 * parametros separados do cliente e gravava em `User/{matricula}/Surveys/...` sem
 * nunca conferir que o token pertencia aquela matricula. Um chamador nao autenticado
 * escrevia na subcolecao privada de QUALQUER membro so informando a matricula, e
 * `sendInvitationRsvpEmailsAction` (tambem exportada) era vetor de e-mail em nome de
 * terceiros. Mesmo padrao de identidade do BUG-032/106 — 3o lugar.
 *
 * Fix (Opcao B): a identidade vem da SESSAO VERIFICADA (idToken -> getServerSession),
 * nunca do parametro. O token e a autorizacao deste convite e precisa ter sido
 * reivindicado pela mesma pessoa da sessao (`claimedBy === matricula`). O disparo de
 * e-mail deixou de ser exportado (helper interno).
 */

const h = vi.hoisted(() => {
  const sessionMock = vi.fn();
  const tokenState = { exists: true, data: {} as Record<string, unknown> };
  const box = { surveyWrite: null as null | { path: string; payload: Record<string, unknown> } };
  return { sessionMock, tokenState, box };
});

vi.mock("@/lib/server-session", () => ({ getServerSession: h.sessionMock }));
vi.mock("firebase-admin", () => ({
  firestore: { FieldValue: { serverTimestamp: () => "SERVER_TS" } },
}));
vi.mock("resend", () => ({ Resend: class { emails = { send: async () => ({ id: "x" }) }; } }));
vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: () => ({
    collection: () => ({
      doc: () => ({ get: async () => ({ exists: h.tokenState.exists, data: () => h.tokenState.data }) }),
    }),
    doc: (path: string) => ({
      set: async (payload: Record<string, unknown>) => { h.box.surveyWrite = { path, payload }; },
    }),
  }),
}));

import * as invitationsModule from "@/actions/invitations";
import { submitInvitationSurveyAction } from "@/actions/invitations";

const TOKEN = "BPL-INV-ABC";
const SLUG = "pre_inauguracao";
const DONO = "BP-005-PF-260523";

beforeEach(() => {
  h.box.surveyWrite = null;
  h.sessionMock.mockReset();
  h.tokenState.exists = true;
  h.tokenState.data = { eventSlug: SLUG, status: "claimed", claimedBy: DONO };
});

describe("BUG-108: submit do convite deriva a identidade da sessao verificada", () => {
  it("grava na matricula da SESSAO quando o token foi reivindicado por ela", async () => {
    h.sessionMock.mockResolvedValue({ uid: "u1", matricula: DONO });
    const res = await submitInvitationSurveyAction(TOKEN, SLUG, { rsvp: "nao" }, "idtoken-x");

    expect(res.success).toBe(true);
    expect(h.box.surveyWrite?.path).toBe(`User/${DONO}/Surveys/invitation_${SLUG}`);
    expect(h.box.surveyWrite?.payload.matricula).toBe(DONO);
  });

  it("recusa quando o token foi reivindicado por OUTRA pessoa — nao grava nada", async () => {
    h.sessionMock.mockResolvedValue({ uid: "u1", matricula: DONO });
    h.tokenState.data = { eventSlug: SLUG, status: "claimed", claimedBy: "BP-999-PF-000000" };
    const res = await submitInvitationSurveyAction(TOKEN, SLUG, { rsvp: "nao" }, "idtoken-x");

    expect(res.success).toBe(false);
    expect(h.box.surveyWrite).toBeNull();
  });

  it("recusa sem sessao valida (idToken ausente/invalido) — nao grava nada", async () => {
    h.sessionMock.mockResolvedValue(null);
    const res = await submitInvitationSurveyAction(TOKEN, SLUG, { rsvp: "nao" }, undefined);

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/login/i);
    expect(h.box.surveyWrite).toBeNull();
  });

  it("recusa token ainda nao reivindicado (unused)", async () => {
    h.sessionMock.mockResolvedValue({ uid: "u1", matricula: DONO });
    h.tokenState.data = { eventSlug: SLUG, status: "unused", claimedBy: null };
    const res = await submitInvitationSurveyAction(TOKEN, SLUG, { rsvp: "nao" }, "idtoken-x");

    expect(res.success).toBe(false);
    expect(h.box.surveyWrite).toBeNull();
  });

  it("recusa token de outro evento", async () => {
    h.sessionMock.mockResolvedValue({ uid: "u1", matricula: DONO });
    h.tokenState.data = { eventSlug: "outro_evento", status: "claimed", claimedBy: DONO };
    const res = await submitInvitationSurveyAction(TOKEN, SLUG, { rsvp: "nao" }, "idtoken-x");

    expect(res.success).toBe(false);
    expect(h.box.surveyWrite).toBeNull();
  });

  it("o disparo de e-mail deixou de ser um endpoint de rede (nao exportado)", () => {
    const mod = invitationsModule as Record<string, unknown>;
    expect(mod.sendInvitationRsvpEmails).toBeUndefined();
    expect(mod.sendInvitationRsvpEmailsAction).toBeUndefined();
  });
});
