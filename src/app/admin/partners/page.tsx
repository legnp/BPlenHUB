import { getPartnersAction } from "@/actions/admin/partners";
import PartnersClient from "./PartnersClient";

/**
 * BPlen HUB — Admin: Gestao de Parceiros (camada servidor)
 * Busca a lista no servidor e entrega pronta ao componente cliente, em vez de
 * carregar dentro de um `useEffect`.
 *
 * A autorizacao ja foi resolvida em `src/app/admin/layout.tsx`, que redireciona
 * sessao invalida, suspensa ou sem papel de admin antes de renderizar esta
 * pagina. O `requireAdmin()` dentro da action permanece como segunda camada.
 */
export default async function AdminPartnersPage() {
  const partners = await getPartnersAction();

  return <PartnersClient initialPartners={partners} />;
}
