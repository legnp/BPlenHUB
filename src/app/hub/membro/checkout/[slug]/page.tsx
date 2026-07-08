import { redirect } from "next/navigation";

/**
 * Stub de compatibilidade (Fase C — ACCESS-MODEL-DESIGN.md secao 8).
 * O checkout foi reposicionado de /hub/membro/checkout para /hub/checkout
 * (todo checkout exige login, nao exige o selo de membro). Este stub preserva
 * links antigos ja distribuidos (e-mails, favoritos, back_urls em voo).
 */
export default async function LegacyCheckoutRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/hub/checkout/${slug}`);
}
