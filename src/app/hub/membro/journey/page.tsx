import { redirect } from "next/navigation";

/** Stub de compatibilidade (Fase C) — ver [stepId]/page.tsx. */
export default async function LegacyJourneyIndexRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string") query.set(key, value);
    else if (Array.isArray(value)) value.forEach(v => query.append(key, v));
  }
  const suffix = query.toString();
  redirect(`/hub/journey${suffix ? `?${suffix}` : ""}`);
}
