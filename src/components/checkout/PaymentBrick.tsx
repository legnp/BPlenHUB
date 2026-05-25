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
  const brickController = React.useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const renderBrick = async () => {
      try {
        await loadMercadoPago();
        
        // 🛡️ Inicialização Soberana (Puro JS)
        if (!(window as any).MercadoPago) return;

        const mp = new (window as any).MercadoPago(clientEnv.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY, {
          locale: "pt-BR",
        });

        const bricksBuilder = mp.bricks();

        const settings = {
          initialization: {
            amount: Number(amount),
            preferenceId: preferenceId,
          },
          customization: {
            paymentMethods: {
              ticket: "all",
              bankTransfer: "all",
              creditCard: "all",
              maxInstallments: 12,
            },
            visual: {
              style: {
                theme: "flat",
                customVariables: {
                  baseColor: "#667eea",
                }
              }
            }
          },
          callbacks: {
            onReady: () => {
              if (onReady) onReady();
            },
            onSubmit: ({ selectedPaymentMethod, formData }: any) => {
              return new Promise<void>(async (resolve, reject) => {
                try {
                  const currentToken = idToken || (user ? await user.getIdToken() : undefined);
                  const res = await processPaymentAction(formData, orderId, currentToken);

                  if (res.success) {
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
            },
            onError: (error: any) => {
              console.error("🚨 [Brick-Error]:", error);
              if (onError) onError(error);
            },
          },
        };

        if (isMounted) {
          // Limpa qualquer instância anterior para evitar duplicidade
          const container = document.getElementById("paymentCardBrick_container");
          if (container) container.innerHTML = "";

          brickController.current = await bricksBuilder.create(
            "payment",
            "paymentCardBrick_container",
            settings
          );
        }
      } catch (err) {
        console.error("❌ [PaymentBrick] Falha Crítica:", err);
      }
    };

    renderBrick();

    return () => {
      isMounted = false;
      if (brickController.current) {
        // brickController.current.unmount(); // Alguns SDKs do MP não expõem unmount direto aqui
      }
    };
  }, [preferenceId, orderId, amount]); // Re-renderiza se a preferência mudar

  return (
    <div className="w-full min-h-[400px] animate-in fade-in duration-700">
      <div id="paymentCardBrick_container">
        <div className="flex items-center justify-center p-12 text-slate-400">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Conectando ao ambiente seguro...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
