import { getAdminCouponsList } from "@/actions/coupons";
import { getAdminCouponsV2Action } from "@/actions/coupon-v2";
import { Coupon } from "@/types/marketing";
import MarketingClient, { V2Batch, V2Coupon } from "./MarketingClient";

/**
 * BPlen HUB — Admin: Marketing e Cupons (camada servidor)
 * Busca cupons V1 e lotes V2 no servidor e entrega prontos ao componente
 * cliente, em vez de carregar dentro de um `useEffect`.
 *
 * As actions sao chamadas SEM token: elas declaram `idToken` como opcional e,
 * na ausencia dele, `getServerSession` cai no cookie de sessao assinado. Nao ha
 * troca de mecanismo de autenticacao — os dois caminhos ja existiam e
 * convergem para a mesma resolucao de permissoes.
 *
 * A autorizacao ja foi resolvida em `src/app/admin/layout.tsx`, que redireciona
 * sessao invalida, suspensa ou sem papel de admin antes de renderizar esta
 * pagina. O `requireAdmin()` dentro das actions permanece como segunda camada.
 */
export default async function MarketingAdminPage() {
  const [resultV1, resultV2] = await Promise.all([
    getAdminCouponsList(),
    getAdminCouponsV2Action()
  ]);

  const initialCoupons: Coupon[] =
    resultV1.success && resultV1.data ? resultV1.data : [];

  const dadosV2 =
    resultV2.success && resultV2.data
      ? (resultV2.data as { batches: V2Batch[]; coupons: V2Coupon[] })
      : { batches: [], coupons: [] };

  return (
    <MarketingClient
      initialCoupons={initialCoupons}
      initialBatches={dadosV2.batches || []}
      initialV2Coupons={dadosV2.coupons || []}
    />
  );
}
