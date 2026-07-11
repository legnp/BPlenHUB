"use client";

import React, { useState } from "react";
import { PaymentBrick } from "./PaymentBrick";
import { createPreferenceAction } from "@/actions/mp-checkout";
import { useAuthContext } from "@/context/AuthContext";
import { ShoppingBag, ShieldCheck, Info, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RegistrationStep } from "./RegistrationStep";
import { CouponInput } from "./CouponInput";
import { formatBRL } from "@/lib/utils/format";

interface CheckoutFlowProps {
  product: {
    id: string;
    title: string;
    price: number;
    slug: string;
    description: string;
    maxInstallments?: number;
  };
}

export function CheckoutFlow({ product }: CheckoutFlowProps) {
  const { user } = useAuthContext();
  const [step, setStep] = useState<"registration" | "payment" | "free_activation">("registration");
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // states for V2 Coupon integration
  const [discount, setDiscount] = useState(0); // e.g. 0.4 for 40% OFF
  const [couponCode, setCouponCode] = useState<string | null>(null);

  const discountAmount = product.price * discount;
  const finalPrice = Math.max(0, product.price - discountAmount);

  async function handleInitCheckout() {
    if (finalPrice === 0) {
      // Fluxo grátis: sem checkbox redundante — ativa direto e segue para a formalização
      // do contrato na tela de sucesso (ponto único de consentimento). O passo intermediário
      // de aceite foi removido; o loader abaixo mostra o progresso até o redirect.
      setStep("free_activation");
      await handleFreeActivation();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (!user) throw new Error("Usuário não autenticado.");
      
      const token = await user.getIdToken();
      setIdToken(token);
      const result = await createPreferenceAction(product.slug, token, couponCode || undefined);

      if (result.success && result.preferenceId && result.orderId) {
        setPreferenceId(result.preferenceId);
        setOrderId(result.orderId);
        setStep("payment");
      } else {
        setError(result.error || "Falha ao iniciar checkout.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  async function handleFreeActivation() {
    setLoading(true);
    setError(null);
    try {
      if (!user) throw new Error("Usuário não autenticado.");
      const token = await user.getIdToken();
      const { processServicePurchaseAction } = await import("@/actions/checkout");
      
      // Call backend with legalConsent = true
      const result = await processServicePurchaseAction(product.slug, token, couponCode || undefined);
      
      if (result.success && result.orderId) {
         window.location.href = `/hub/checkout/success?orderId=${result.orderId}`;
      } else {
         setError(result.error || "Falha ao ativar serviço.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      
      {/* 🧾 LADO ESQUERDO: RESUMO DO PEDIDO */}
      <div className="lg:col-span-5 space-y-8">
        <div className="p-8 glass space-y-8 relative overflow-hidden">
           {/* Decorative Orb */}
           <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-[var(--accent-start)] blur-[80px] opacity-20 pointer-events-none rounded-full" />
           
           <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent-start)] shadow-sm">
                 <ShoppingBag size={28} />
              </div>
              <div className="space-y-0.5">
                 <h2 className="text-xl font-black tracking-tight text-[var(--text-primary)]">Resumo do Pedido</h2>
                 <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Confira e finalize sua contratação</p>
              </div>
           </div>

           <div className="space-y-6 pt-6 border-t border-[var(--border-primary)] relative z-10">
              <div className="space-y-3">
                 <div className="flex justify-between items-start gap-4">
                    <h3 className="font-black text-[var(--text-primary)] text-lg leading-tight">{product.title}</h3>
                    <span className="text-sm font-black text-[var(--accent-start)] whitespace-nowrap shrink-0">R$ {formatBRL(product.price)}</span>
                 </div>
                 {product.description ? (
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-line line-clamp-4">
                       {product.description}
                    </p>
                 ) : null}
              </div>

              <div className="p-4 rounded-xl bg-[var(--input-bg)] border border-[var(--border-primary)] space-y-3">
                 <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                    <span>Subtotal</span>
                    <span>R$ {formatBRL(product.price)}</span>
                 </div>
                 <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                    <span>Desconto</span>
                    <span>- R$ {formatBRL(discountAmount)}</span>
                 </div>
                 <div className="pt-3 border-t border-[var(--border-primary)] flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-[var(--text-primary)]">Total</span>
                    <span className="text-xl font-black text-[var(--text-primary)] italic">R$ {formatBRL(finalPrice)}</span>
                 </div>
              </div>

              {/* 🎟️ INPUT DE CUPOM */}
              <div className="pt-2 border-t border-[var(--border-primary)]">
                 <CouponInput 
                    productSlug={product.slug}
                    onApply={(discVal, codeVal) => {
                       setDiscount(discVal);
                       setCouponCode(codeVal);
                    }}
                    onRemove={() => {
                       setDiscount(0);
                       setCouponCode(null);
                    }}
                 />
              </div>
           </div>

           <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-3 text-emerald-500">
                 <ShieldCheck size={16} />
                 <span className="text-[9px] font-black uppercase tracking-widest">Pagamento 100% Seguro</span>
              </div>
           </div>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent-soft)] flex gap-4 items-start shadow-sm">
           <Info size={20} className="text-[var(--accent-start)] shrink-0" />
           <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed font-semibold">
              Sua Nota Fiscal será enviada para o seu e-mail cadastrado após a confirmação do pagamento.
           </p>
        </div>
      </div>

      {/* 💳 LADO DIREITO: INTERFACE DINÂMICA (DADOS OU PAGAMENTO) */}
      <div className="lg:col-span-7">
        <div className="p-1 rounded-[3rem] bg-gradient-to-b from-[var(--glass-border)] to-transparent h-full">
           <div className="glass !bg-[var(--bg-primary)] sm:!p-10 !p-6 min-h-[500px] flex flex-col items-center justify-start relative overflow-hidden h-full">
              
              <AnimatePresence mode="wait">
                 {step === "registration" ? (
                    <motion.div 
                      key="registration"
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      className="w-full"
                    >
                       <RegistrationStep onComplete={handleInitCheckout} />
                    </motion.div>
                 ) : loading ? (
                    <motion.div 
                      key="loading"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-6 text-center my-auto"
                    >
                       <Loader2 size={40} className="text-[var(--accent-start)] animate-spin" />
                       <div className="space-y-2">
                          <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">
                             {step === "free_activation" ? "Registrando sua contratação" : "Iniciando Checkout Seguro"}
                          </h4>
                          <p className="text-[10px] text-[var(--text-muted)] font-medium">
                             {step === "free_activation" ? "Preparando a formalização do contrato..." : "Conectando com Mercado Pago..."}
                          </p>
                       </div>
                     </motion.div>
                 ) : error ? (
                    <motion.div 
                      key="error"
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      className="text-center space-y-6 my-auto"
                    >
                       <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto">
                          <ShieldCheck size={32} />
                       </div>
                       <div className="space-y-2">
                          <h4 className="text-lg font-bold text-[var(--text-primary)]">Ops! Algo deu errado</h4>
                          <p className="text-xs text-[var(--text-muted)]">{error}</p>
                       </div>
                       <div className="flex flex-col gap-3">
                        <button 
                          onClick={handleInitCheckout}
                          className="px-8 py-3 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
                        >
                            Tentar Novamente
                        </button>
                        <button 
                          onClick={() => setStep("registration")}
                          className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                            Voltar para Revisão de Dados
                        </button>
                       </div>
                    </motion.div>
                 ) : preferenceId && orderId ? (
                    <motion.div 
                      key="brick"
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      className="w-full"
                    >
                       <PaymentBrick 
                         preferenceId={preferenceId} 
                         orderId={orderId}
                         amount={finalPrice} 
                         maxInstallments={product.maxInstallments}
                         idToken={idToken || undefined}
                         onSuccess={(paymentId) => {
                           if (orderId) {
                             window.location.href = `/hub/checkout/success?orderId=${orderId}&payment_id=${paymentId || ''}`;
                           } else {
                             window.location.href = `/hub/membro/dashboard`; // Fallback
                           }
                         }}
                       />
                       <button 
                          onClick={() => setStep("registration")}
                          className="mt-8 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] block mx-auto"
                        >
                            Editar Dados de Faturamento
                        </button>
                    </motion.div>
                 ) : null}
              </AnimatePresence>

              {/* Decorative Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-start)]/10 blur-[100px] pointer-events-none -z-10" />
           </div>
        </div>
      </div>

    </div>
  );
}

