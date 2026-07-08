import { redirect } from "next/navigation";

/**
 * Stub de compatibilidade (Fase C). A jornada foi reposicionada de
 * /hub/membro/journey para /hub/journey — a trilha e' exibida por completo a
 * qualquer logado (estados de previa/bloqueio por etapa ficam com o motor de
 * acesso), enquanto /hub/membro segue exclusivo do selo (Fase D).
 * Preserva links antigos (tour, e-mails, favoritos).
 */
export default async function LegacyJourneyStepRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ stepId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { stepId } = await params;
  const sp = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string") query.set(key, value);
    else if (Array.isArray(value)) value.forEach(v => query.append(key, v));
  }
  const suffix = query.toString();
  redirect(`/hub/journey/${stepId}${suffix ? `?${suffix}` : ""}`);
}
