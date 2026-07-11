import React from "react";
import { getCheckoutProductAction } from "@/actions/mp-checkout";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { AlertCircle, ArrowLeft, MessageCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { FunctionalPageHeader } from "@/components/layout/FunctionalPageHeader";
import { SUPPORT_WHATSAPP_URL } from "@/config/support";

/**
 * BPlen HUB — Página Mestra de Checkout (💳 Soberania de Dados)
 * Rota dinâmica que gera checkouts baseados em produtos do Firestore.
 */

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // 🧬 CONEXÃO DE FLOW: Plano Junior redireciona diretamente para o Posicionamento de Carreira
  if (slug === "junior") {
    const { redirect } = await import("next/navigation");
    redirect("/hub/journey/posicionamento-profissional");
  }
  
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
            <p className="text-sm font-medium text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed">
               {result.error || "O serviço solicitado não pôde ser carregado. Verifique o link ou tente novamente."}
            </p>
            <p className="text-xs font-medium text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed pt-1">
               Precisa de ajuda? Fale com o suporte BPlen pelo WhatsApp.
            </p>
         </div>
         <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
               href="/hub/servicos"
               className="px-8 py-4 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-3"
            >
               <ArrowLeft size={16} /> Ver Catálogo de Serviços
            </Link>
            <a
               href={SUPPORT_WHATSAPP_URL}
               target="_blank"
               rel="noopener noreferrer"
               className="px-8 py-4 bg-[var(--input-bg)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--accent-soft)] transition-all flex items-center gap-3"
            >
               <MessageCircle size={16} /> Suporte no WhatsApp
            </a>
         </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto pt-[10px] px-6 pb-16 md:px-12 space-y-10 w-full animate-fade-in">
      <FunctionalPageHeader
        eyebrow="Contratação Segura"
        title="Checkout"
        titleAccent="do Serviço"
        backHref={`/hub/servicos/${slug}`}
        backLabel="Voltar para detalhes"
        statusTag={{ label: "Ambiente Seguro BPlen", tone: "success", icon: <ShieldCheck size={12} /> }}
      />

      {/* CORE: FLOW DE CHECKOUT */}
      <CheckoutFlow product={result.data} />
    </div>
  );
}
