import React from "react";
import { getCheckoutProductAction } from "@/actions/mp-checkout";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

/**
 * BPlen HUB — Página Mestra de Checkout (💳 Soberania de Dados)
 * Rota dinâmica que gera checkouts baseados em produtos do Firestore.
 */

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Recupera dados do serviço de forma segura no servidor
  // O session resolver automático da BPlen já cuida da autenticação via cookies de sessão 🛡️
  const result = await getCheckoutProductAction(slug);
  
  // 🛡️ Prevenção de Gap (Bypass F5): Se não tem matrícula, volta para o Welcome Flow
  if (!result.success && result.error === "MATRICULA_REQUIRED") {
    const { redirect } = await import("next/navigation");
    redirect(`/hub?checkout=${slug}`);
  }

  if (!result.success || !result.data) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
         <div className="w-20 h-20 rounded-[2.5rem] bg-red-500/10 flex items-center justify-center text-red-500 shadow-2xl">
            <AlertCircle size={40} />
         </div>
         <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight uppercase italic text-red-500">Serviço Indisponível</h2>
            <p className="text-sm font-medium text-gray-500 max-w-sm mx-auto leading-relaxed">
               {result.error || "O serviço solicitado não pôde ser carregado. Verifique o link ou tente novamente."}
            </p>
         </div>
         <Link 
            href="/hub/servicos" 
            className="px-8 py-4 bg-white text-black rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-3"
         >
            <ArrowLeft size={16} /> Ver Catálogo de Serviços
         </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-12">
      
      {/* HEADER DE NAVEGAÇÃO */}
      <div className="flex items-center justify-between">
         <Link 
           href={`/hub/servicos/${slug}`} 
           className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2 group"
         >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
            Voltar para detalhes
         </Link>
         <div className="px-4 py-2 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] border border-[var(--border-primary)] text-[9px] font-black uppercase tracking-widest shadow-sm">
            Ambiente Seguro BPlen
         </div>
      </div>

      {/* CORE: FLOW DE CHECKOUT */}
      <CheckoutFlow product={result.data} />

    </div>
  );
}
