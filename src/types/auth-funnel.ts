/**
 * BPlen HUB — Tipos do Funil de Autenticacoes (aba Autenticacoes do admin)
 *
 * Snapshot read-only do funil de onboarding: junta as contas que autenticaram
 * (Firebase Auth), o `_AuthMap` (identidade cunhada) e o `User` (onboarding
 * concluido). Ver `docs/system-audit/AUTH-TRACKING-DESIGN.md`.
 *
 * IMPORTANTE (rotulos neutros, regra 6 do CLAUDE.md): nenhum campo/valor aqui
 * expoe o nome da infraestrutura. Para a UI, tudo vive "no BPlen HUB".
 */

/** Estagios do funil, na ordem de progressao. */
export type AuthFunnelStage =
  | "authenticated" // autenticou, nunca abriu welcome/cadastro (sem matricula)
  | "identity_generated" // abriu welcome/cadastro, nao concluiu
  | "onboarding_complete"; // User existe com hasCompletedWelcome === true

/**
 * Marcador de caso de borda de higiene (nao e um estagio do funil):
 * - `orphan_authmap`: identidade cunhada cujo login foi revogado/apagado.
 * - `user_without_auth`: registro de usuario legado sem login correspondente.
 */
export type AuthFunnelNote = "orphan_authmap" | "user_without_auth" | null;

/** Uma pessoa no funil (uma conta de login OU um caso de borda de higiene). */
export interface AuthFunnelRow {
  /** UID da conta de login; `null` quando e um registro sem login (borda). */
  uid: string | null;
  /** E-mail exibivel (ja mascarado contra identidade interna). */
  email: string;
  /** Nome exibivel (ja mascarado contra identidade interna). */
  displayName: string;
  /** Provedor de login (ex.: "google.com", "password") ou "-". */
  provider: string;
  /** Data de criacao da conta de login (ISO) ou `null`. */
  createdAt: string | null;
  /** Ultimo login (ISO) ou `null`. */
  lastSignInAt: string | null;
  /** Matricula cunhada, se ja houver identidade. */
  matricula: string | null;
  /** Estagio no funil. */
  stage: AuthFunnelStage;
  /** Conta de login desabilitada. */
  disabled: boolean;
  /** `false` quando a linha e um caso de borda sem conta de login. */
  hasAuthAccount: boolean;
  /** Identidade veio de auto-healing (`_AuthMap.recoveredAt`). */
  recovered: boolean;
  /** Marcador de caso de borda de higiene, se aplicavel. */
  note: AuthFunnelNote;
}

/** Agregados do funil para os StatTiles. */
export interface AuthFunnelSummary {
  /** Contas de login existentes (base do funil). */
  totalAuthenticated: number;
  /** Pessoas em "identidade gerada" (abriram e nao concluiram). */
  identityGenerated: number;
  /** Pessoas com onboarding concluido. */
  onboardingComplete: number;
  /** Conversao = onboardingComplete / totalAuthenticated (0..1). */
  conversionRate: number;
  /** Identidades orfas (sem conta de login). */
  orphanAuthMaps: number;
  /** Registros de usuario sem conta de login. */
  usersWithoutAuth: number;
}

export interface AuthFunnelResult {
  rows: AuthFunnelRow[];
  summary: AuthFunnelSummary;
}

/**
 * Entradas cruas para o construtor puro `buildAuthFunnel`. A action de rede
 * normaliza as tres fontes para estes formatos e o construtor faz o join,
 * a classificacao, a mascara e os agregados — sem depender do SDK, para poder
 * ser exercido em teste (Licao 18: teste a funcao de producao, nao uma copia).
 */
export interface RawAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  provider: string | null;
  creationTime: string | null;
  lastSignInTime: string | null;
  disabled: boolean;
}

export interface RawAuthMap {
  uid: string;
  matricula: string | null;
  recovered: boolean;
}

export interface RawUserDoc {
  matricula: string;
  uid: string | null;
  email: string | null;
  name: string | null;
  hasCompletedWelcome: boolean;
}
