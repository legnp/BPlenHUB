"use client";

import React, { useEffect } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { clientEnv } from "@/env";
import { useAuthContext } from "@/context/AuthContext";
import { processPaymentAction } from "@/actions/mp-checkout";

// Inicialização Global Única (Soberania de SDK 🛡️)
initMercadoPago(clientEnv.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY, {
  locale: "pt-BR",
});

interface PaymentBrickProps {
  preferenceId: string;
  orderId: string;
  amount: number;
  onReady?: () => void;
  onError?: (error: any) => void;
  onSuccess?: (paymentId?: string) => void;
  idToken?: string;
}

/**
 * BPlen HUB — Payment Brick Wrapper (💳)
 * Integra o Checkout Bricks do Mercado Pago com o design system do HUB.
 * Gerencia o ciclo de vida do pagamento e callbacks.
 */

export function PaymentBrick({ preferenceId, orderId, amount, onReady, onError, onSuccess, idToken }: PaymentBrickProps) {
  const { user } = useAuthContext();

  const initialization = {
    amount: amount,
    preferenceId: preferenceId,
  };

  const customization = {
    paymentMethods: {
      ticket: "all" as const,
      bankTransfer: "all" as const,
      creditCard: "all" as const,
      maxInstallments: 12,
    },
    visual: {
      style: {
        theme: "flat" as const, // Mais limpo para combinar com Glassmorphism
        customVariables: {
          formBackgroundColor: "transparent",
          baseColor: "#667eea", // BPlen Accent
          buttonBackgroundColor: "#1D1D1F",
          buttonTextColor: "#ffffff",
          inputBackgroundColor: "rgba(0, 0, 0, 0.03)",
          inputBorderColor: "rgba(0, 0, 0, 0.1)",
        }
      }
    }
  };

  const onSubmit = async ({ selectedPaymentMethod, formData }: any) => {
    // 💳 Checkout Transparente: Enviamos o Payload criptografado do cartão para o backend!
    return new Promise<void>(async (resolve, reject) => {
      try {
        const currentToken = idToken || (user ? await user.getIdToken() : undefined);
        const res = await processPaymentAction(formData, orderId, currentToken);

        if (res.success) {
          console.log("✅ [PaymentBrick] Cobrança processada no Mercado Pago!");
          resolve();
          // Dá um tempo de 1.5 segundo para a animação verde do Brick rodar antes do redirect
          if (onSuccess) {
            setTimeout(() => onSuccess(res.paymentId?.toString()), 1500);
          }
        } else {
          console.error("❌ [PaymentBrick] Falha no backend:", res.error);
          reject(new Error(res.error));
        }
      } catch (err: any) {
        console.error("🚨 [PaymentBrick] Exceção estrutural:", err);
        reject(err);
      }
    });
  };

  return (
    <div className="w-full min-h-[400px] animate-in fade-in duration-700">
      <Payment
        initialization={initialization}
        customization={customization}
        onSubmit={onSubmit}
        onReady={onReady}
        onError={onError}
      />
    </div>
  );
}
