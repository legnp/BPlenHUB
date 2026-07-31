import { headers } from "next/headers";
import { buildEntrarPath } from "./identity-guards";

/**
 * BPlen HUB — Alvo de redirecionamento para /entrar no servidor.
 *
 * Le o caminho pedido do header `x-bplen-pathname` (setado pelo proxy) e monta o
 * redirecionamento unificado `/entrar?returnTo=<caminho>`. Usado pelos layouts
 * protegidos como fallback quando o cookie existe mas esta invalido/stale (caso
 * em que o proxy — que so checa existencia — deixa passar e o layout barra). Se o
 * header faltar, cai para o `fallbackPath` interno.
 */
export async function entrarRedirectTarget(fallbackPath: string = "/hub"): Promise<string> {
  const h = await headers();
  const path = h.get("x-bplen-pathname") || fallbackPath;
  return buildEntrarPath(path);
}
