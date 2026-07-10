import React from "react";
import { CheckoutContractSigning } from "@/components/contracts/CheckoutContractSigning";

/**
 * BPlen HUB — Tela de Sucesso do Checkout (Gestão Funcional).
 *
 * Superfície única para grátis e pago (ambos convergem aqui). Todo o conteúdo dinâmico
 * (cabeçalho + status real + confirmação + assinatura do contrato) vive no
 * CheckoutContractSigning, que reflete o ESTADO REAL: o serviço só é marcado como
 * liberado APÓS a assinatura (gate CT-3b.2) — nada de "serviço liberado" hardcoded.
 */

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ payment_id?: string; orderId?: string }>;
}) {
  const { payment_id, orderId } = await searchParams;
  const isFree = !!orderId?.includes("FREE");

  return (
    <div className="max-w-[1440px] mx-auto pt-[10px] px-6 pb-16 md:px-12 w-full animate-fade-in">
      {orderId ? (
        <CheckoutContractSigning orderId={orderId} paymentId={payment_id} isFree={isFree} />
      ) : (
        <div className="py-24 text-center text-sm font-medium text-[var(--text-muted)]">
          Pedido não identificado.
        </div>
      )}
    </div>
  );
}
