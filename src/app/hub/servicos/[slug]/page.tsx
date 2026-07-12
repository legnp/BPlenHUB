import React from "react";
import { getServiceDeliveryDataAction } from "@/actions/delivery";
import { ServiceDeliveryView } from "@/components/hub/ServiceDeliveryView";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

/**
 * BPlen HUB — Rota Dinâmica de Entrega de Serviços 🏁
 * Esta página é a "Máscara Inteligente" que adapta a jornada do membro
 * com base na configuração do produto no Admin.
 */

export default async function ServiceDeliveryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // A action usa requireAuth() internamente, que verifica o cookie assinado 🛡️
  const result = await getServiceDeliveryDataAction(slug);

  if (!result.success || !result.data) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
         <div className="w-20 h-20 rounded-[2.5rem] bg-red-500/10 flex items-center justify-center text-red-500 shadow-2xl">
            <AlertCircle size={40} />
         </div>
         <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight uppercase italic text-red-500">Acesso Restrito</h2>
            <p className="text-sm font-medium text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed">
               {result.error || "Você não tem permissão para acessar este serviço ou ele não existe."}
            </p>
         </div>
         <Link 
            href="/hub/membro" 
            className="px-8 py-4 bg-white text-black rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-3"
         >
            <ArrowLeft size={16} /> Voltar
         </Link>
      </div>
    );
  }

  const { product, completedMilestones, quotas } = result.data;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <ServiceDeliveryView 
        product={product} 
        completedMilestones={completedMilestones} 
        quotas={quotas} 
      />
    </div>
  );
}
