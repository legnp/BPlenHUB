"use client";

import React from "react";
import { StatusScreen } from "@mercadopago/sdk-react";
import { ArrowRight, Home } from "lucide-react";
import Link from "next/link";

interface PaymentStatusProps {
  paymentId: string;
  /**
   * Exibe os CTAs de navegação (Dashboard / Jornada). Default true para compatibilidade.
   * No fluxo pós-checkout com contrato, os CTAs só aparecem APÓS a assinatura, então a
   * tela de sucesso passa `showActions={false}` e delega os botões ao passo assinado.
   */
  showActions?: boolean;
}

/**
 * BPlen HUB — Payment Status Screen
 * Exibe o resultado do pagamento utilizando o Status Screen Brick (Mercado Pago).
 */

export function PaymentStatus({ paymentId, showActions = true }: PaymentStatusProps) {
  const initialization = {
    paymentId: paymentId,
  };

  const customization = {
    visual: {
      showChecklist: true,
      smartAutocomplete: true,
      hideStatusDetails: false,
      hideTransactionId: false,
    },
    backUrls: {
      return: `${typeof window !== "undefined" ? window.location.origin : ""}/hub/membro?startTour=true`,
    },
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="rounded-[2.5rem] border border-[var(--border-primary)] bg-[var(--input-bg)] overflow-hidden shadow-sm">
        <StatusScreen initialization={initialization} customization={customization} />
      </div>

      {showActions ? (
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/hub/membro?startTour=true"
            className="w-full sm:w-auto px-8 py-4 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-3"
          >
            <Home size={16} /> Ir para o Dashboard
          </Link>
          <Link
            href="/hub/journey?startTour=part2"
            className="w-full sm:w-auto px-8 py-4 bg-[var(--input-bg)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[var(--accent-soft)] transition-all flex items-center justify-center gap-3"
          >
            Ver Minha Jornada <ArrowRight size={16} />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
