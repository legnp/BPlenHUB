import React from "react";
import { PaymentStatus } from "@/components/checkout/PaymentStatus";
import { CheckoutContractSigning } from "@/components/contracts/CheckoutContractSigning";
import { FunctionalPageHeader } from "@/components/layout/FunctionalPageHeader";
import { CheckCircle2, Zap, Clock } from "lucide-react";

/**
 * BPlen HUB — Tela de Sucesso do Checkout (Gestão Funcional).
 *
 * Superfície única para grátis e pago (ambos convergem aqui). Ordem: cabeçalho
 * padrão -> confirmação (grátis: nota; pago: status Mercado Pago SEM os CTAs) ->
 * assinatura do contrato IDÊNTICA para os dois. Os CTAs de navegação (Dashboard /
 * Jornada) só aparecem APÓS a assinatura (dentro do CheckoutContractSigning).
 */

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ payment_id?: string; orderId?: string }>;
}) {
  const { payment_id, orderId } = await searchParams;
  const isFree = orderId?.includes("FREE");

  return (
    <div className="max-w-[1440px] mx-auto pt-[10px] px-6 pb-16 md:px-12 space-y-10 w-full animate-fade-in">
      <FunctionalPageHeader
        eyebrow={isFree ? "Ativação Concluída" : "Checkout Concluído"}
        title="Formalização"
        titleAccent="do Serviço"
        statusTag={{
          label: isFree ? "Serviço Liberado" : "Pagamento Processado",
          tone: "success",
          icon: <CheckCircle2 size={12} />,
        }}
      />

      {/* Confirmação da contratação — compacta; o foco da tela é o contrato abaixo. */}
      {isFree ? (
        <div className="max-w-3xl mx-auto rounded-[2rem] bg-emerald-500/5 border border-emerald-500/15 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Zap size={22} />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-black text-[var(--text-primary)]">Ativação gratuita concluída</p>
            <p className="text-xs text-[var(--text-muted)] font-medium">
              O serviço já está disponível na sua conta. Formalize o contrato abaixo.
            </p>
          </div>
        </div>
      ) : payment_id ? (
        <PaymentStatus paymentId={payment_id} showActions={false} />
      ) : (
        <div className="max-w-3xl mx-auto rounded-[2rem] bg-[var(--input-bg)] border border-[var(--border-primary)] p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-start)] flex items-center justify-center shrink-0">
            <Clock size={22} />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-black text-[var(--text-primary)]">Processando sua ativação</p>
            <p className="text-xs text-[var(--text-muted)] font-medium">
              Em alguns instantes o acesso será liberado automaticamente.
            </p>
          </div>
        </div>
      )}

      {orderId ? <CheckoutContractSigning orderId={orderId} /> : null}
    </div>
  );
}
