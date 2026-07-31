import type { Metadata } from "next";
import { EntrarClient } from "./EntrarClient";

/**
 * BPlen HUB — /entrar (superficie canonica de autenticacao).
 * Server wrapper: le o `returnTo` da query e delega para o client. A validacao
 * anti open-redirect e feita no client (sanitizeReturnTo) e reforcada no servidor
 * em cada consumidor de `returnTo` (proxy, layouts, magic link).
 */
export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: false },
};

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = params.returnTo;
  const returnTo = typeof raw === "string" ? raw : "/hub";
  return <EntrarClient returnTo={returnTo} />;
}
