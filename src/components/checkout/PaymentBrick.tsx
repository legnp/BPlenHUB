"use client";

import React, { useEffect } from "react";
import { loadMercadoPago } from "@mercadopago/sdk-js";
import { clientEnv } from "@/env";
import { useAuthContext } from "@/context/AuthContext";
import { processPaymentAction, type MercadoPagoFormData } from "@/actions/mp-checkout";

interface PaymentBrickProps {
  preferenceId: string;
  orderId: string;
  amount: number;
  maxInstallments?: number;
  onReady?: () => void;
  onError?: (error: unknown) => void;
  onSuccess?: (paymentId?: string) => void;
  idToken?: string;
}

interface MercadoPagoBrickSettings {
  initialization: {
    amount: number;
    preferenceId: string;
  };
  customization: {
    paymentMethods: {
      ticket: string;
      bankTransfer: string;
      creditCard: string;
      maxInstallments: number;
    };
    visual: {
      style: {
        theme: string;
        customVariables: {
          baseColor: string;
        };
      };
    };
  };
  callbacks: {
    onReady: () => void;
    onSubmit: (param: { formData: MercadoPagoFormData }) => Promise<void>;
    onError: (error: unknown) => void;
  };
  mercadoPago: unknown;
}

interface WindowWithMercadoPago extends Window {
  MercadoPago?: new (key: string, options?: { locale: string }) => {
    bricks: () => {
      create: (
        type: string,
        containerId: string,
        settings: MercadoPagoBrickSettings
      ) => Promise<{ unmount?: () => void }>;
    };
  };
}

/**
 * BPlen HUB — Payment Brick Wrapper
 * Integra o Checkout Bricks do Mercado Pago com o design system do HUB.
 * Gerencia o ciclo de vida do pagamento e callbacks.
 */
export function PaymentBrick({
  preferenceId,
  orderId,
  amount,
  maxInstallments,
  onReady,
  onError,
  onSuccess,
  idToken,
}: PaymentBrickProps) {
  const { user } = useAuthContext();
  const brickController = React.useRef<{ unmount?: () => void } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const renderBrick = async () => {
      try {
        await loadMercadoPago();

        const win = window as unknown as WindowWithMercadoPago;
        if (!win.MercadoPago) return;

        const mp = new win.MercadoPago(clientEnv.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY, {
          locale: "pt-BR",
        });

        const bricksBuilder = mp.bricks();

        const settings: MercadoPagoBrickSettings = {
          initialization: {
            amount: Number(amount),
            preferenceId: preferenceId,
          },
          customization: {
            paymentMethods: {
              ticket: "all",
              bankTransfer: "all",
              creditCard: "all",
              maxInstallments: maxInstallments || 12,
            },
            visual: {
              style: {
                theme: "flat",
                customVariables: {
                  baseColor: "#667eea",
                },
              },
            },
          },
          callbacks: {
            onReady: () => {
              if (onReady) onReady();
            },
            onSubmit: ({ formData }: { formData: MercadoPagoFormData }) => {
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
                } catch (err: unknown) {
                  reject(err instanceof Error ? err : new Error(String(err)));
                }
              });
            },
            onError: (error: unknown) => {
              console.error("Payment Brick Error:", error);
              if (onError) onError(error);
            },
          },
          mercadoPago: mp,
        };

        if (isMounted) {
          // Limpa qualquer instancia anterior para evitar duplicidade
          const container = document.getElementById("paymentCardBrick_container");
          if (container) container.innerHTML = "";

          brickController.current = await bricksBuilder.create(
            "payment",
            "paymentCardBrick_container",
            settings
          );
        }
      } catch (err) {
        console.error("PaymentBrick critical failure:", err);
      }
    };

    renderBrick();

    return () => {
      isMounted = false;
      if (brickController.current) {
        // brickController.current.unmount();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferenceId, orderId, amount]); // Re-renderiza se a preferencia mudar

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
