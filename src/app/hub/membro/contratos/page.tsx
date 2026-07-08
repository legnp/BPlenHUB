import React from "react";
import { Metadata } from "next";
import { getUserOrdersAction } from "@/actions/orders";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { ScrollText, ExternalLink, AlertCircle, Clock, ShieldCheck, XCircle, Loader2 } from "lucide-react";
import { getServerSession } from "@/lib/server-session";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Meus Contratos",
  description: "Trilha Financeira e Acessos BPlen HUB",
};

export const dynamic = "force-dynamic";

/**
 * 🏷️ BPlen Tag Experience (Mapeamento Humano de Status)
 */
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
          <Clock size={12} />
          Aguardando Pagamento
        </span>
      );
    case "in_process":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-600 border border-blue-500/20">
          <Loader2 size={12} className="animate-spin" /> {/* Necessita Loader2, mas podemos usar AlertCircle ou trocar */}
          Em Processamento
        </span>
      );
    case "approved":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
          <ShieldCheck size={12} />
          Liberado no HUB
        </span>
      );
    case "rejected":
    case "cancelled":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-600 border border-red-500/20">
          <XCircle size={12} />
          Cancelado/Recusado
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-500/10 text-gray-600 border border-gray-500/20">
          <AlertCircle size={12} />
          {status}
        </span>
      );
  }
}

function canRetryPayment(status: string) {
  return ["pending", "rejected", "cancelled", "payment_failed"].includes(status);
}

export default async function ContratosPage() {
  const session = await getServerSession();
  
  if (!session) {
    redirect("/");
  }

  // Traz a trilha financeira do membro.
  const result = await getUserOrdersAction();
  const orders = result.data || [];
  const error = result.error;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Cinematográfico */}
      <div className="glass p-10 relative overflow-hidden flex flex-col md:flex-row items-center md:items-start justify-between gap-6 border-[var(--glass-border)]">
        <div className="relative z-10 flex gap-6 items-center">
          <div className="w-16 h-16 rounded-3xl bg-[var(--accent-start)]/10 text-[var(--accent-start)] flex items-center justify-center flex-shrink-0 shadow-inner border border-[var(--accent-start)]/20">
            <ScrollText size={32} />
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-[var(--text-primary)] tracking-tight uppercase italic drop-shadow-md">
              Meus Contratos
            </h1>
            <p className="text-xs font-bold text-[var(--text-muted)] mt-1 uppercase tracking-[0.2em]">
              Central de Acessos & Faturamento
            </p>
          </div>
        </div>
        
        <div className="relative z-10 hidden md:flex items-center justify-center h-16 px-6 rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] font-black uppercase tracking-widest shadow-lg">
          Ambiente Seguro Triplo A
        </div>

        {/* Efeito Glow Background */}
        <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-[var(--accent-start)]/10 blur-[100px] rounded-full pointer-events-none" />
      </div>

      {/* Grid de Orders */}
      <div className="space-y-6">
        {error ? (
          <div className="glass p-16 text-center space-y-4 border-red-500/20 bg-red-500/5">
             <AlertCircle size={48} className="mx-auto text-red-500 opacity-80" />
             <h3 className="text-lg font-black text-red-600 uppercase tracking-widest">Falha na Sincronização</h3>
             <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
               Houve um problema técnico ao recuperar seu histórico financeiro. {error}
             </p>
             <Link 
               href="/hub/membro/contratos" 
               className="inline-block mt-4 px-8 py-3 glass text-[var(--text-primary)] text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all"
             >
               Tentar Novamente
             </Link>
          </div>
        ) : orders.length === 0 ? (
          <div className="glass p-16 text-center space-y-4">
             <ScrollText size={48} className="mx-auto text-[var(--text-muted)] opacity-50" />
             <h3 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-widest">Nenhum Contrato Ativo</h3>
             <p className="text-xs text-[var(--text-secondary)]">Você ainda não processou pagamentos pelo BPlen HUB.</p>
             <Link 
               href="/hub" 
               className="inline-block mt-4 px-8 py-3 bg-[var(--accent-start)] text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:scale-105 transition-transform"
             >
               Explorar HUB
             </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="glass p-6 space-y-6 hover:shadow-xl transition-all duration-300 group border-[var(--glass-border)] relative overflow-hidden flex flex-col justify-between h-full"
              >
                {/* Decoration Subtle */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-start)]/5 blur-[40px] pointer-events-none transition-all group-hover:bg-[var(--accent-start)]/10" />

                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5">
                      <StatusBadge status={order.status} />
                      {order.statusDetail ? (
                        <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--text-muted)] pl-1">
                          {order.statusDetail}
                        </p>
                      ) : null}
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">
                      #{order.orderId.substring(0, 6)}
                    </span>
                  </div>

                  <div>
                     <h3 className="text-lg font-black text-[var(--text-primary)] leading-tight">{order.productTitle}</h3>
                     <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-1">{order.productKicker || "Plano Permanente"}</p>
                  </div>
                </div>

                <div className="space-y-5 pt-5 border-t border-[var(--border-primary)] relative z-10 mt-auto">
                  <div className="flex justify-between items-end">
                     <div>
                       <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-[var(--text-muted)] mb-1">Valor Investido</p>
                       <p className="text-xl font-black text-[var(--text-primary)]">R$ {order.finalPrice.toFixed(2)}</p>
                     </div>
                     <div className="text-right">
                       <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-[var(--text-muted)] mb-1">Data</p>
                       <p className="text-xs font-bold text-[var(--text-secondary)]">
                          {format(new Date(order.createdAt), "dd MMM yyyy", { locale: ptBR })}
                       </p>
                     </div>
                  </div>

                  {order.status === "approved" ? (
                    <Link 
                      href="/hub/membro/dashboard"
                      className="w-full py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-[var(--accent-start)] text-white hover:bg-[var(--accent-end)] text-center flex items-center justify-center gap-2 group/btn shadow-[0_4px_14px_rgba(255,44,141,0.3)] hover:shadow-[0_6px_20px_rgba(255,44,141,0.4)]"
                    >
                      Acessar HUB
                      <ExternalLink size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  ) : canRetryPayment(order.status) ? (
                    <Link 
                      href={`/hub/checkout/${order.productSlug}`}
                      className="w-full py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all glass hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] text-[var(--text-primary)] text-center flex items-center justify-center gap-2 border-[var(--glass-border)]"
                    >
                      Tentar Pagar Novamente
                    </Link>
                  ) : (
                    <div className="w-full py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[var(--input-bg)] text-[var(--text-muted)] text-center border border-[var(--border-primary)] cursor-not-allowed">
                      Ver Fatura
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
