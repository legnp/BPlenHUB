import { maskInternalContact } from "@/lib/identity-mask";
import type {
  AuthFunnelResult,
  AuthFunnelRow,
  AuthFunnelStage,
  RawAuthMap,
  RawAuthUser,
  RawUserDoc,
} from "@/types/auth-funnel";

/**
 * BPlen HUB — Construtor puro do Funil de Autenticacoes
 *
 * Camada CRUA, sem `"use server"` e sem SDK: recebe as tres fontes ja lidas
 * (contas de login, `_AuthMap`, `User`) e devolve as linhas do funil + os
 * agregados. Fica puro de proposito para ser exercido por teste com a funcao
 * de producao, nao uma copia (Licao 18). A action de rede
 * (`getAuthFunnelAction`) so faz a leitura, normaliza e delega para ca.
 *
 * Ver `docs/system-audit/AUTH-TRACKING-DESIGN.md` (secoes 4 e 8).
 */

/**
 * Classifica uma pessoa no funil. Puro por design — depende so do estado de
 * identidade, nao de ter conta de login (uma identidade orfa ainda tem estagio).
 *
 * | matricula | User existe | hasCompletedWelcome | estagio               |
 * |-----------|-------------|---------------------|-----------------------|
 * | ausente   | -           | -                   | authenticated         |
 * | presente  | nao / sim   | false               | identity_generated    |
 * | presente  | sim         | true                | onboarding_complete   |
 */
export function classifyFunnelStage(input: {
  matricula: string | null;
  userExists: boolean;
  hasCompletedWelcome: boolean;
}): AuthFunnelStage {
  if (!input.matricula) return "authenticated";
  if (input.userExists && input.hasCompletedWelcome) return "onboarding_complete";
  return "identity_generated";
}

export function buildAuthFunnel(input: {
  authUsers: RawAuthUser[];
  authMaps: RawAuthMap[];
  users: RawUserDoc[];
}): AuthFunnelResult {
  const { authUsers, authMaps, users } = input;

  // Indices para join O(1).
  const authMapByUid = new Map<string, RawAuthMap>();
  for (const m of authMaps) authMapByUid.set(m.uid, m);

  const userByMatricula = new Map<string, RawUserDoc>();
  const userByUid = new Map<string, string>(); // uid -> matricula (auto-healing por uid)
  for (const u of users) {
    userByMatricula.set(u.matricula, u);
    if (u.uid) userByUid.set(u.uid, u.matricula);
  }

  const authUids = new Set(authUsers.map((u) => u.uid));
  const coveredMatriculas = new Set<string>();
  const rows: AuthFunnelRow[] = [];

  // 1. Base do funil: cada conta de login.
  for (const au of authUsers) {
    const fromMap = authMapByUid.get(au.uid);
    // AuthMap primeiro; se faltar, cai no vinculo por uid do proprio User
    // (mesma ordem de resolucao do auto-healing em find-matricula.ts).
    const matricula = fromMap?.matricula ?? userByUid.get(au.uid) ?? null;
    const userDoc = matricula ? userByMatricula.get(matricula) : undefined;
    if (matricula) coveredMatriculas.add(matricula);

    rows.push({
      uid: au.uid,
      email: maskInternalContact(au.email || userDoc?.email || ""),
      displayName: maskInternalContact(au.displayName || userDoc?.name || ""),
      provider: au.provider || "-",
      createdAt: au.creationTime,
      lastSignInAt: au.lastSignInTime,
      matricula,
      stage: classifyFunnelStage({
        matricula,
        userExists: Boolean(userDoc),
        hasCompletedWelcome: userDoc?.hasCompletedWelcome ?? false,
      }),
      disabled: au.disabled,
      hasAuthAccount: true,
      recovered: fromMap?.recovered ?? false,
      note: null,
    });
  }

  // 2. Borda: `_AuthMap` orfao (uid sem conta de login).
  for (const m of authMaps) {
    if (authUids.has(m.uid)) continue;
    const userDoc = m.matricula ? userByMatricula.get(m.matricula) : undefined;
    if (m.matricula) coveredMatriculas.add(m.matricula);

    rows.push({
      uid: m.uid,
      email: maskInternalContact(userDoc?.email || ""),
      displayName: maskInternalContact(userDoc?.name || ""),
      provider: "-",
      createdAt: null,
      lastSignInAt: null,
      matricula: m.matricula,
      stage: classifyFunnelStage({
        matricula: m.matricula,
        userExists: Boolean(userDoc),
        hasCompletedWelcome: userDoc?.hasCompletedWelcome ?? false,
      }),
      disabled: false,
      hasAuthAccount: false,
      recovered: m.recovered,
      note: "orphan_authmap",
    });
  }

  // 3. Borda: `User` sem conta de login (dado legado/import).
  for (const u of users) {
    if (coveredMatriculas.has(u.matricula)) continue;
    if (u.uid && authUids.has(u.uid)) continue; // ja coberto na etapa 1
    rows.push({
      uid: u.uid,
      email: maskInternalContact(u.email || ""),
      displayName: maskInternalContact(u.name || ""),
      provider: "-",
      createdAt: null,
      lastSignInAt: null,
      matricula: u.matricula,
      stage: classifyFunnelStage({
        matricula: u.matricula,
        userExists: true,
        hasCompletedWelcome: u.hasCompletedWelcome,
      }),
      disabled: false,
      hasAuthAccount: false,
      recovered: false,
      note: "user_without_auth",
    });
  }

  // Agregados. O funil tem por base as contas que de fato autenticaram; os
  // casos de borda entram como contadores de higiene separados.
  const totalAuthenticated = rows.filter((r) => r.hasAuthAccount).length;
  const onboardingComplete = rows.filter((r) => r.stage === "onboarding_complete").length;
  const identityGenerated = rows.filter((r) => r.stage === "identity_generated").length;
  const orphanAuthMaps = rows.filter((r) => r.note === "orphan_authmap").length;
  const usersWithoutAuth = rows.filter((r) => r.note === "user_without_auth").length;

  return {
    rows,
    summary: {
      totalAuthenticated,
      identityGenerated,
      onboardingComplete,
      conversionRate: totalAuthenticated > 0 ? onboardingComplete / totalAuthenticated : 0,
      orphanAuthMaps,
      usersWithoutAuth,
    },
  };
}
