import { redirect } from "next/navigation";

/**
 * Stub de compatibilidade (Fase C). Preserva a query string: pagamentos do
 * Mercado Pago em transito no momento do deploy retornam para esta URL antiga
 * com orderId/payment_id, que precisam chegar intactos ao destino novo.
 */
export default async function LegacyCheckoutSuccessRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") query.set(key, value);
    else if (Array.isArray(value)) value.forEach(v => query.append(key, v));
  }
  const suffix = query.toString();
  redirect(`/hub/checkout/success${suffix ? `?${suffix}` : ""}`);
}
