"use server";

import { requireAuth } from "@/lib/auth-guards";
import { resolveMatricula } from "@/lib/user-matricula";
import { getAdminDb } from "@/lib/firebase-admin";
import { checkCpfStatus, type CpfCheckStatus } from "@/lib/identity/cpf-index";

/**
 * BPlen HUB — Checagem de disponibilidade de CPF (feedback de blur — Fase 1b).
 *
 * Somente-leitura: diz se o CPF esta livre, ja e do proprio usuario, ou pertence a
 * outra conta. NAO revela QUEM e o dono (privacidade). Guardada por sessao
 * (`requireAuth`) para nao virar sonda publica de enumeracao de CPF — so quem esta
 * logado, no seu proprio cadastro, consulta. Erro/identidade nao resolvida ->
 * `unknown` (nunca gera falso "em uso").
 */
export async function checkCpfAvailabilityAction(
  cpf: string,
  idToken?: string
): Promise<{ status: CpfCheckStatus | "unknown" }> {
  try {
    const session = await requireAuth(idToken);
    const matricula = await resolveMatricula(session.uid, session.email || "");
    if (!matricula) return { status: "unknown" };
    const status = await checkCpfStatus(getAdminDb(), cpf, matricula);
    return { status };
  } catch {
    return { status: "unknown" };
  }
}
