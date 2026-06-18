import React from "react";
import { Metadata } from "next";
import { getProductsByAudience } from "@/actions/products";
import { Product } from "@/types/products";
import { 
  ChevronRight, 
  CheckCircle2, 
  ArrowLeft,
  User,
  Users,
  Handshake,
  Package
} from "lucide-react";
import Link from "next/link";
import { ParticleNexus } from "@/components/home/ParticleNexus";
import { HomeFooter } from "@/components/home/HomeFooter";
import { FloatingCTAs } from "@/components/layout/FloatingCTAs";
import { SocialSidebar } from "@/components/layout/SocialSidebar";
import { LANDING_TOKENS } from "@/constants/landing-tokens";
import { notFound } from "next/navigation";
import { ComparisonTable } from "@/components/services/ComparisonTable";
import { seedComparisonProductsAction } from "@/actions/seed-comparison-products";

interface PageProps {
  params: Promise<{
    audience: string;
  }>;
}

const audienceMap: Record<string, { id: 'people' | 'companies' | 'partners', title: string, kicker: string, icon: any }> = {
  "pessoas": { 
    id: 'people', 
    title: "Para Pessoas", 
    kicker: "Desenvolvimento Individual",
    icon: <User className="w-8 h-8 text-[#ff0080]" />
  },
  "empresas": { 
    id: 'companies', 
    title: "Para Empresas", 
    kicker: "HRBP & Estratégia",
    icon: <Users className="w-8 h-8 text-[#667eea]" />
  },
  "parceiros": { 
    id: 'partners', 
    title: "Para Parceiros", 
    kicker: "Ecossistema BPlen",
    icon: <Handshake className="w-8 h-8 text-[#ff0080]" />
  }
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { audience } = await params;
  const config = audienceMap[audience];
  return {
    title: config?.title || "Serviços",
    description: config?.kicker || "Tríade de soluções em Desenvolvimento Humano.",
  };
}

/**
 * Segmented Services Page — BPlen HUB 🧬
 * Lista dinamicamente os produtos de um público específico.
 */
export default async function SegmentedServicesPage({ params }: PageProps) {
  const { audience } = await params;
  const config = audienceMap[audience];

  if (!config) notFound();

  // Executa o seed sob demanda de forma resiliente para manter consistência do banco de dados 🧬
  if (config.id === 'people') {
    try {
      await seedComparisonProductsAction();
    } catch (err) {
      console.error("Erro silenciado ao semear produtos PF:", err);
    }
  }

  const products = await getProductsByAudience(config.id);

  return (
    <main className="min-h-screen bg-black text-white relative isolate overflow-x-hidden theme-dark">
      
      {/* Glows Decorativos */}
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ff0080] rounded-full blur-[180px] opacity-[0.05] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#667eea] rounded-full blur-[180px] opacity-[0.05] pointer-events-none -z-10" />


      {/* Hero Section */}
      <section className="pt-12 pb-[60px] px-6">
        <div className={LANDING_TOKENS.container}>
          <div className={LANDING_TOKENS.header.centered}>
            <div className="mb-6 p-4 bg-white/5 rounded-2xl w-fit mx-auto border border-white/10 shadow-2xl">
              {config.icon}
            </div>
            <span className={LANDING_TOKENS.header.kicker}>{config.kicker}</span>
            <h1 className={LANDING_TOKENS.header.title}>
              {config.title.split(' ')[0]} <span className="text-gray-500">{config.title.split(' ')[1]}</span>
            </h1>
            <p className={LANDING_TOKENS.header.descriptionCentered}>
              Explore nossas soluções desenhadas especificamente para {audience}. 
              Transforme potencial em resultados reais com o ecossistema BPlen.
            </p>
          </div>
        </div>
      </section>

      {/* dynamic Products Grid */}
      <section className="pb-32 px-6">
        <div className={LANDING_TOKENS.container}>
          
          {/* Comparison Table Section for People (PF) */}
          {config.id === 'people' && (
            <div className="mb-16 animate-fade-in">
              <ComparisonTable />
            </div>
          )}

          {products.length === 0 ? (
            <div className="p-20 text-center border border-white/5 bg-white/5 rounded-[3rem] opacity-40">
               <Package size={48} className="mx-auto mb-4 opacity-20" />
               <p className="text-xs font-black uppercase tracking-widest">Nenhum serviço disponível neste segmento ainda</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <div 
                  key={product.id} 
                  className={`${LANDING_TOKENS.card.container} !p-6 md:!p-8 group flex flex-col h-full bg-gradient-to-b from-white/5 to-transparent hover:border-[var(--accent-primary)]/30 transition-all`}
                >
                  <div className="relative aspect-video rounded-2xl overflow-hidden mb-5 border border-white/5 group-hover:border-white/10 shrink-0">
                     {product.sheet.coverImage ? (
                        <img 
                          src={product.sheet.coverImage} 
                          alt={product.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                     ) : (
                        <div className="w-full h-full bg-white/5 flex items-center justify-center">
                           <Package size={24} className="opacity-10" />
                        </div>
                     )}
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60" />
                  </div>
                  
                  <span className={LANDING_TOKENS.card.kicker}>{product.kicker || "PRONTO PARA VOCÊ"}</span>
                  <h3 className={`${LANDING_TOKENS.card.title} !mb-2`}>
                    {product.title}
                  </h3>
                  <p className={`${LANDING_TOKENS.card.description} mb-4 flex-grow line-clamp-2 text-xs`}>
                    {product.sheet.description}
                  </p>

                  <ul className="space-y-2 mb-6 border-t border-white/5 pt-4">
                    {(product.sheet.deliverables || []).slice(0, 3).map((item, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-[9px] uppercase font-bold tracking-tight text-gray-400">
                        <CheckCircle2 size={12} className="text-[#ff0080]/60 shrink-0" />
                        <span className="line-clamp-1">{item}</span>
                      </li>
                    ))}
                    {(!product.sheet.deliverables || product.sheet.deliverables.length === 0) && (
                      <li className="flex items-center gap-3 text-[9px] uppercase font-bold tracking-tight text-gray-500 italic opacity-50">
                        Consulte os detalhes deste serviço
                      </li>
                    )}
                  </ul>

                  <div className="mb-6 h-[50px] flex flex-col justify-end">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Investimento</span>
                    {product.price > 0 ? (
                      <div>
                        <span className="text-xl font-black text-white">
                          5x {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price / 5)}
                        </span>
                        <span className="block text-[9px] font-black text-[#ff0080] uppercase tracking-wider mt-0.5 opacity-90">
                          5% de desconto à vista
                        </span>
                      </div>
                    ) : (
                      <span className="text-xl font-black text-white">Sem Custo</span>
                    )}
                  </div>

                  <Link 
                    href={`/servicos/${audience}/${product.slug}`}
                    className="w-full py-3 rounded-xl bg-[var(--accent-primary)] text-white font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] shadow-xl group/btn transition-all flex items-center justify-center gap-2"
                  >
                    CONTRATAR AGORA
                    <ChevronRight size={14} className="group-hover/btn:translate-x-1 duration-300" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer & Global Elements */}
      <HomeFooter />
      <FloatingCTAs />
      <SocialSidebar />
      <ParticleNexus />
      
    </main>
  );
}
