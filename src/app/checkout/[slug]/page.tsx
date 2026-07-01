"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProductBySlug } from "@/actions/products";
import { processServicePurchaseAction } from "@/actions/checkout";
import { validateCouponAction } from "@/actions/coupons";
import { Product } from "@/types/products";
import { CouponValidationResult } from "@/types/marketing";
import { 
  ShieldCheck, 
  CreditCard, 
  ChevronLeft, 
  CheckCircle2, 
  Loader2, 
  Zap,
  Lock,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { getErrorMessage } from "@/lib/utils/errors";

export default function CheckoutPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<"summary" | "processing" | "success">("summary");
  const [error, setError] = useState<string | null>(null);
  
  // Marketing / Cupons
  const [couponInput, setCouponInput] = useState("");
  const [couponData, setCouponData] = useState<CouponValidationResult | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      if (!slug) return;
      const data = await getProductBySlug(slug as string);
      if (data) {
        setProduct(data);
      } else {
        setError("Produto não encontrado.");
      }
      setLoading(false);
    };
    loadProduct();
  }, [slug]);

  const handleApplyCoupon = async () => {
    if (!product || !couponInput) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Logue para aplicar cupom.");
      
      const result = await validateCouponAction(couponInput, product.price, product.id || product.slug, token);
      if (result.valid) {
        setCouponData(result);
      } else {
        setCouponError(result.message || "Cupom inválido.");
      }
    } catch (err: unknown) {
      setCouponError(getErrorMessage(err));
    } finally {
      setCouponLoading(false);
    }
  };

  const currentPrice = couponData ? couponData.finalPrice : (product?.price || 0);

  const handleConfirmPurchase = async () => {
    if (!product) return;
    
    setProcessing(true);
    setStep("processing");
    
    try {
      // Pequeno delay para efeito dramático institucional 🎭
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Usuário não autenticado.");
      
      const result = await processServicePurchaseAction(product.slug, token, couponData?.coupon?.code);
      
      if (result.success) {
        setStep("success");
      } else {
        setError(result.error || "Falha ao processar ativação.");
        setStep("summary");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Erro inesperado."));
      setStep("summary");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
     return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
           <Loader2 size={40} className="animate-spin text-[#ff0080]" />
           <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Preparando Checkout BPlen...</p>
        </div>
     );
  }

  if (error && step !== "success") {
     return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-10">
           <div className="p-10 rounded-[3rem] bg-white/5 border border-white/10 text-center space-y-6 max-w-md">
              <h2 className="text-2xl font-black">{error}</h2>
              <button onClick={() => router.back()} className="w-full py-4 bg-white/10 rounded-2xl font-black uppercase text-[10px]">Voltar para o Catálogo</button>
           </div>
        </div>
     );
  }

  return (
    <main className="min-h-screen bg-black text-white relative isolate overflow-hidden flex items-center justify-center p-6">
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ff0080] rounded-full blur-[200px] opacity-[0.05] -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#667eea] rounded-full blur-[200px] opacity-[0.05] -z-10" />

      <div className="w-full max-w-5xl">
        <AnimatePresence mode="wait">
           {step === "summary" && product && (
              <motion.div 
                 key="summary"
                 initial={{ opacity: 0, y: 30 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="flex flex-col lg:flex-row gap-12"
              >
                 {/* Lado Esquerdo: Resumo */}
                 <div className="flex-1 space-y-8 text-left">
                    <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
                       <ChevronLeft size={14} /> Revisar Serviço
                    </button>
                    
                    <div className="space-y-4">
                       <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">
                          Checkout <span className="opacity-40 tracking-normal italic">&</span> Ativação
                       </h1>
                       <p className="text-gray-500 font-bold max-w-md">
                          Você está prestes a integrar o <span className="text-[#ff0080]">{product.title}</span> ao seu ecossistema estratégico.
                       </p>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl space-y-6">
                       <div className="flex items-center gap-4">
                          <div className="p-4 bg-[#ff0080]/10 rounded-2xl text-[#ff0080]">
                             <Zap size={24} />
                          </div>
                          <div>
                             <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Entrega Garantida</h4>
                             <p className="text-lg font-black">{product.title}</p>
                          </div>
                          <div className="ml-auto text-right">
                             <p className="text-[10px] font-black uppercase tracking-widest text-[#ff0080]">ID: {product.serviceCode}</p>
                          </div>
                       </div>
                       
                       <div className="pt-6 border-t border-white/5 space-y-3">
                          <div className="flex justify-between text-sm font-bold opacity-60">
                             <span>Investimento Base</span>
                             <span>R$ {product.price.toLocaleString('pt-BR')}</span>
                          </div>
                          
                          {couponData && (
                             <div className="flex justify-between text-sm font-bold text-emerald-500 animate-pulse">
                                <span>Cupom Aplicado ({couponData.coupon?.code})</span>
                                <span>- R$ {couponData.discountAmount.toLocaleString('pt-BR')}</span>
                             </div>
                          )}

                          <div className="flex justify-between text-xl font-black pt-2 text-[#ff0080]">
                             <span>Total</span>
                             <span>R$ {currentPrice.toLocaleString('pt-BR')}</span>
                          </div>
                       </div>
                    </div>

                    {/* Campo de Cupom */}
                    <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 space-y-4">
                       <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Possui um cupom?</p>
                       <div className="flex gap-2">
                          <input 
                             type="text" 
                             placeholder="CODER20..."
                             className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest outline-none focus:border-[#ff0080] transition-all"
                             value={couponInput}
                             onChange={(e) => setCouponInput(e.target.value)}
                          />
                          <button 
                             onClick={handleApplyCoupon}
                             disabled={couponLoading || !couponInput}
                             className="px-6 py-3 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-[1.05] transition-all disabled:opacity-30"
                          >
                             {couponLoading ? "..." : "Aplicar"}
                          </button>
                       </div>
                       {couponError && <p className="text-[10px] text-red-500 font-bold px-2">{couponError}</p>}
                       {couponData && <p className="text-[10px] text-emerald-500 font-bold px-2">Cupom '{couponData.coupon?.code}' aplicado com sucesso!</p>}
                    </div>
                 </div>

                 {/* Lado Direito: Confirmação */}
                 <div className="w-full lg:w-[420px]">
                    <div className="p-10 rounded-[3rem] bg-gradient-to-b from-white/10 to-transparent border border-white/20 shadow-2xl space-y-8 backdrop-blur-3xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12">
                          <Lock size={200} />
                       </div>

                       <div className="space-y-6 relative z-10">
                          <div className="space-y-2">
                             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Método de Confirmação</h4>
                             <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                                <CreditCard size={18} className="text-[#ff0080]" />
                                <span className="text-xs font-bold">Resgate via Faturamento Interno</span>
                                <div className="ml-auto w-4 h-4 rounded-full border-2 border-[#ff0080] flex items-center justify-center">
                                   <div className="w-1.5 h-1.5 rounded-full bg-[#ff0080]" />
                                </div>
                             </div>
                          </div>

                          <div className="p-6 rounded-2xl bg-[#ff0080]/5 border border-[#ff0080]/20 space-y-2">
                             <div className="flex items-center gap-2 text-[#ff0080]">
                                <ShieldCheck size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Garantia BPlen</span>
                             </div>
                             <p className="text-[9px] text-gray-500 font-bold leading-relaxed">
                                Ao confirmar, os recursos digitais, pastas no Drive e trilhas de serviço serão provisionados em seu nome.
                             </p>
                          </div>

                          <button 
                            onClick={handleConfirmPurchase}
                            disabled={processing}
                            className="w-full py-5 rounded-2xl bg-[#ff0080] hover:bg-[#ff00b3] text-white font-black text-xs tracking-[0.2em] uppercase hover:scale-[1.02] shadow-[0_20px_40px_rgba(255,0,128,0.3)] transition-all flex items-center justify-center gap-3 group disabled:opacity-30 self-stretch"
                          >
                            {processing ? "Iniciando Camada Cloud..." : "Finalizar Contratação"}
                            {!processing && <ArrowRight size={18} className="group-hover:translate-x-1 duration-300" />}
                          </button>
                       </div>
                    </div>
                 </div>
              </motion.div>
           )}

           {step === "processing" && (
              <motion.div 
                 key="processing"
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 1.1 }}
                 className="text-center space-y-8"
              >
                 <div className="relative inline-block">
                    <div className="absolute inset-0 bg-[#ff0080] rounded-full blur-3xl opacity-20 animate-pulse" />
                    <Loader2 size={120} className="text-[#ff0080] animate-spin-slow relative z-10 opacity-40" strokeWidth={1} />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Zap size={40} className="text-white animate-bounce" />
                    </div>
                 </div>
                 <div className="space-y-3">
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic">Sincronizando <span className="opacity-40">Governança</span></h2>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Provisionando ativos digitais e Workspace...</p>
                 </div>
              </motion.div>
           )}

           {step === "success" && (
              <motion.div 
                 key="success"
                 initial={{ opacity: 0, scale: 0.9, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 className="text-center space-y-10 max-w-xl mx-auto"
              >
                 <div className="w-32 h-32 bg-emerald-500/20 rounded-[2.5rem] flex items-center justify-center text-emerald-500 border border-emerald-500/20 mx-auto shadow-[0_0_80px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 size={64} />
                 </div>
                 
                 <div className="space-y-4">
                    <h2 className="text-5xl font-black tracking-tighter">Muito <span className="text-emerald-500">Bem-vindo.</span></h2>
                    <p className="text-xl text-gray-400 font-bold leading-relaxed">
                       O serviço <span className="text-white">{product?.title}</span> já está ativo e integrado à sua Área de Membro.
                    </p>
                 </div>

                 <div className="flex flex-col gap-4">
                    <Link 
                       href="/hub"
                       className="w-full py-6 rounded-3xl bg-white text-black font-black text-xs tracking-[0.3em] uppercase hover:scale-[1.02] shadow-2xl transition-all"
                    >
                       Acessar Meu Dashboard 
                    </Link>
                    <Link 
                       href="/"
                       className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                    >
                       Voltar para o Início
                    </Link>
                 </div>
              </motion.div>
           )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </main>
  );
}
