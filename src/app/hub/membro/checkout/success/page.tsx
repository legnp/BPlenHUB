import React from "react";
import { PaymentStatus } from "@/components/checkout/PaymentStatus";
import { ShieldCheck } from "lucide-react";

/**
 * BPlen HUB — Página de Sucesso no Checkout 🏆
 * Exibe a confirmação do Mercado Pago e orienta o usuário.
 */

export default async function CheckoutSuccessPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ payment_id?: string; orderId?: string }> 
}) {
  const { payment_id, orderId } = await searchParams;
  const isFree = orderId?.includes("FREE");

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 space-y-12 text-center">
      
      <div className="space-y-4">
         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-[9px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/20">
            <ShieldCheck size={12} /> {isFree ? "Serviço Liberado" : "Transação Processada"}
         </div>
         <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white uppercase italic">
            {isFree ? (
               <>Você está <span className="text-emerald-500">Pronto.</span></>
            ) : (
               <>Quase lá, <span className="text-accent-start">Membro.</span></>
            )}
         </h1>
         <p className="text-gray-400 text-sm max-w-md mx-auto font-medium">
            {isFree 
              ? "Sua ativação gratuita foi concluída com sucesso. O serviço já está disponível na sua conta."
              : "Estamos processando sua ativação. Em alguns instantes seu acesso será liberado automaticamente."}
         </p>
      </div>

      {isFree ? (
         <div className="p-12 rounded-[3rem] bg-emerald-500/5 border border-emerald-500/10 text-center space-y-4">
           <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest">
              Acesso Liberado Imediatamente
           </p>
           <a 
             href="/hub/membro?startTour=true"
             className="text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:underline block"
           >
             Ir para o Dashboard
           </a>
         </div>
      ) : payment_id ? (
        <PaymentStatus paymentId={payment_id} />
      ) : (
        <div className="p-12 rounded-[3rem] bg-white/[0.03] border border-white/10 text-center space-y-4">
           <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
              Aguardando confirmação do gateway...
           </p>
           <a 
             href="/hub/membro?startTour=true"
             className="text-[10px] font-black uppercase tracking-widest text-accent-start hover:underline block"
           >
             Ir para o Dashboard
           </a>
        </div>
      )}

    </div>
  );
}
