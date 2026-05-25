"use client";

import React, { useEffect, useState } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { loadMercadoPago } from "@mercadopago/sdk-js";
import { clientEnv } from "@/env";
import { useAuthContext } from "@/context/AuthContext";
import { processPaymentAction } from "@/actions/mp-checkout";

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
  const [mpInstance, setMpInstance] = useState<any>(null);

  useEffect(() => {
    const initSDK = async () => {
      try {
        // 🚀 Carregamento Robusto: Garante que a instância esteja pronta
        await loadMercadoPago();
        initMercadoPago(clientEnv.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY, {
          locale: "pt-BR",
        });
        
        // Captura a instância global para injetar no Brick
        if ((window as any).MercadoPago) {
          const mp = new (window as any).MercadoPago(clientEnv.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY, {
            locale: "pt-BR",
          });
          setMpInstance(mp);
        }
      } catch (err) {
        console.error("🚨 [PaymentBrick] Erro ao carger SDK:", err);
      }
    };
    initSDK();
  }, []);

  const initialization = {
    amount: Number(amount),
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
        theme: "flat" as const,
        customVariables: {
          baseColor: "#667eea",
          formBackgroundColor: "transparent",
          buttonTextColor: "#ffffff",
        }
      }
    }
  };

  const onSubmit = async ({ selectedPaymentMethod, formData }: any) => {
    // 💳 Checkout Transparente
    return new Promise<void>(async (resolve, reject) => {
      try {
        const currentToken = idToken || (user ? await user.getIdToken() : undefined);
        const res = await processPaymentAction(formData, orderId, currentToken);

        if (res.success) {
          console.log("✅ [PaymentBrick] Cobrança processada!");
          resolve();
          if (onSuccess) {
            setTimeout(() => onSuccess(res.paymentId?.toString()), 1500);
          }
        } else {
          reject(new Error(res.error));
        }
      } catch (err: any) {
        reject(err);
      }
    });
  };

  return (
    <div className="w-full min-h-[400px] animate-in fade-in duration-700">
      {mpInstance ? (
        <Payment
          {...({
            key: preferenceId,
            initialization,
            customization,
            onSubmit,
            onReady,
            onError,
            mercadoPago: mpInstance, // 🛡️ Injeção de instância estável
          } as any)}
        />
      ) : (
        <div className="flex items-center justify-center p-8 text-slate-400">
          <div className="animate-pulse">Seguindo para o ambiente seguro...</div>
        </div>
      )}
    </div>
  );
}
