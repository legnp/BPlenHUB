import React from "react";
import { Metadata } from "next";
import { getProductBySlug } from "@/actions/products";
import { 
  ChevronRight, 
  CheckCircle2, 
  ArrowLeft,
  Package,
  ShieldCheck,
  CreditCard,
  MessageSquare,
  FileText
} from "lucide-react";
import Link from "next/link";
import { ParticleNexus } from "@/components/home/ParticleNexus";
import { HomeFooter } from "@/components/home/HomeFooter";
import { FloatingCTAs } from "@/components/layout/FloatingCTAs";
import { SocialSidebar } from "@/components/layout/SocialSidebar";
import { MatriculaGuard } from "@/components/checkout/MatriculaGuard";
import { LANDING_TOKENS } from "@/constants/landing-tokens";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    audience: string;
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return {
    title: product?.title || "Carregando...",
    description: product?.sheet.description.slice(0, 160) || "Detalhes do serviço estratégico.",
  };
}

/**
 * Product Detail Page — BPlen HUB 🧬
 * Apresentação completa da ficha técnica do serviço e CTA de contratação.
 */
export default async function ProductDetailPage({ params }: PageProps) {
  const { audience, slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  return (
    <main className="min-h-screen bg-black text-white relative isolate overflow-x-hidden theme-dark">
      
      {/* Decorative Overlays */}
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ff0080] rounded-full blur-[180px] opacity-[0.05] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#667eea] rounded-full blur-[180px] opacity-[0.05] pointer-events-none -z-10" />

      {/* Breadcrumb Navigation */}
      <div className="pt-[60px] px-6 max-w-7xl mx-auto">
         <Link 
           href={`/servicos/${audience}`}
           className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors group"
         >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Voltar para {audience.charAt(0).toUpperCase() + audience.slice(1)}
         </Link>
      </div>

      {/* Hero Section / Title & Badge */}
      <section className="pt-12 pb-20 px-6">
        <div className={LANDING_TOKENS.container}>
          <div className="flex flex-col lg:flex-row gap-16 items-start">
             
             {/* Text Side */}
             <div className="flex-1 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <span className="px-3 py-1 bg-[#ff0080]/10 border border-[#ff0080]/20 rounded-full text-[#ff0080] text-[10px] font-black uppercase tracking-widest">
                       Serviço de Elite
                     </span>
                     <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-gray-400 text-[10px] font-black uppercase tracking-widest">
                       {audience.toUpperCase()}
                     </span>
                  </div>
                  <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight">
                    {product.title}
                  </h1>
                </div>

                <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <ShieldCheck size={120} />
                   </div>
                   <p className="text-lg md:text-xl text-gray-300 leading-relaxed font-bold tracking-tight opacity-90 relative z-10">
                     {product.sheet.description}
                   </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <BenefitCard icon={<Zap size={18} />} title="Ativo Imediato" text="Acesso liberado após confirmação de faturamento." />
                   <BenefitCard icon={<ShieldCheck size={18} />} title="Segurança Total" text="Proteção de dados e conformidade estratégica." />
                </div>
             </div>

             {/* Sticky Pricing / CTA Side */}
             <div className="w-full lg:w-[400px] sticky top-32">
                <div className="p-10 rounded-[3rem] bg-gradient-to-b from-white/10 to-transparent border border-white/20 shadow-2xl space-y-8 backdrop-blur-2xl">
                   <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Investimento Único</p>
                      <div className="flex items-baseline gap-2">
                         <span className="text-sm font-bold opacity-40">R$</span>
                         <span className="text-6xl font-black tracking-tighter">
                            {product.price > 0 ? product.price.toLocaleString('pt-BR') : "Consulte"}
                         </span>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 leading-relaxed italic opacity-60">
                        {product.sheet.paymentConditions || "Condições flexíveis disponíveis via consultoria."}
                      </p>
                   </div>

                   <MatriculaGuard productSlug={product.slug}>
                     Contratar Serviço
                   </MatriculaGuard>

                   <div className="pt-6 border-t border-white/10 space-y-4">
                      <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-tight text-gray-500">
                         <CreditCard size={14} className="text-gray-600" />
                         Pagamento Seguro via Stripe
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-tight text-gray-500">
                         <FileText size={14} className="text-gray-600" />
                         Emissão automática de Nota Fiscal
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Technical Sheet / FAQ Section */}
      <section className="pb-32 px-6">
        <div className={LANDING_TOKENS.container}>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
              
              {/* FAQ Side */}
              <div className="space-y-12">
                 <div className="space-y-4">
                    <h2 className="text-3xl font-black tracking-tighter uppercase">Perguntas <span className="opacity-40">Frequentes</span></h2>
                    <p className="text-gray-500 text-sm font-bold tracking-tight">Esclareça suas dúvidas sobre a entrega deste serviço.</p>
                 </div>
                 
                 <div className="space-y-6">
                    {product.sheet.faq.length > 0 ? product.sheet.faq.map((item, idx) => (
                       <div key={idx} className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-3">
                          <h4 className="text-sm font-black uppercase tracking-widest text-[#ff0080]/80">{item.question}</h4>
                          <p className="text-sm text-gray-400 leading-relaxed font-bold tracking-tight opacity-80">{item.answer}</p>
                       </div>
                    )) : (
                       <p className="text-xs text-gray-500 italic">FAQ em atualização pelo Admin.</p>
                    )}
                 </div>
              </div>

              {/* Terms / Workflow Side */}
              <div className="space-y-12">
                 <div className="space-y-4">
                    <h2 className="text-3xl font-black tracking-tighter uppercase">Workflow de <span className="opacity-40">Entrega</span></h2>
                    <p className="text-gray-500 text-sm font-bold tracking-tight">O que compõe a sua experiência conosco.</p>
                 </div>

                 <div className="space-y-4">
                    {product.workflow.map((step, idx) => (
                       <div key={step.id} className="flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/5 group hover:border-[#ff0080]/20 transition-all">
                          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black group-hover:bg-[#ff0080] group-hover:text-white transition-all">
                             {idx + 1}
                          </div>
                          <div className="space-y-1">
                             <h5 className="text-[11px] font-black uppercase tracking-widest">{step.title}</h5>
                             <p className="text-[10px] text-gray-500 font-bold tracking-tight">{step.description || "Atividade estratégica mapeada."}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

           </div>
        </div>
      </section>

      <HomeFooter />
      <FloatingCTAs />
      <SocialSidebar />
      <ParticleNexus />
      
    </main>
  );
}

function BenefitCard({ icon, title, text }: any) {
  return (
    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center gap-5">
       <div className="p-3 bg-[#ff0080]/10 rounded-xl text-[#ff0080]">
          {icon}
       </div>
       <div>
          <h4 className="text-[10px] font-black uppercase tracking-widest">{title}</h4>
          <p className="text-[10px] text-gray-500 font-bold mt-1 tracking-tight">{text}</p>
       </div>
    </div>
  );
}

const Zap = ({ size }: { size: number }) => (
   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
)
