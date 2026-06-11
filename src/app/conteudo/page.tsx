import React from "react";
import { Metadata } from "next";
import { 
  ArrowRight 
} from "lucide-react";
import { SocialFeedView } from "@/components/hub/SocialFeedView";
import { getSocialPosts } from "@/actions/social";
import { FeedbackSection } from "@/components/hub/FeedbackSection";
import { HomeFooter } from "@/components/home/HomeFooter";
import { FloatingCTAs } from "@/components/layout/FloatingCTAs";
import { SocialSidebar } from "@/components/layout/SocialSidebar";
import { ParticleNexus } from "@/components/home/ParticleNexus";
import { LANDING_TOKENS } from "@/constants/landing-tokens";
import { DynamicSubtitle } from "@/components/hub/DynamicSubtitle";

export const metadata: Metadata = {
  title: "Conteúdos",
  description: "Explore os últimos artigos, vídeos e reflexões da BPlen sobre Desenvolvimento Humano.",
};

export default async function ContentPage() {
  const posts = await getSocialPosts(true); // Apenas ativos
  
  return (
    <main className="min-h-screen bg-[#F5F7FA] text-[#1D1D1F] relative isolate overflow-x-hidden transition-colors duration-500">
      
      {/* Glows Decorativos (Suaves para modo claro) */}
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ff0080] rounded-full blur-[180px] opacity-[0.03] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#667eea] rounded-full blur-[180px] opacity-[0.03] pointer-events-none -z-10" />

      {/* Hero Section (Light Mode) */}
      <section className="pt-[60px] pb-[40px] px-6">
        <div className={LANDING_TOKENS.container}>
          <div className="text-center mb-5 space-y-4">
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-[#ff0080]">Editorial BPlen</span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-black">
              Pontos que <span className="text-gray-400">Conectam</span>
            </h1>
            <DynamicSubtitle />
          </div>
        </div>
      </section>

      {/* Content Explorer Container */}
      <section className="px-6 pb-24">
        <div className={LANDING_TOKENS.container}>
          <SocialFeedView posts={posts} />
        </div>
      </section>

      {/* Fluxo de Feedback e Sugestão 📡🗳️ */}
      <FeedbackSection />

      {/* Elementos Institucionais (Ajustados para o fundo claro do rodapé ou mantendo o dark original) */}
      <div className="bg-black text-white pt-2">
         <HomeFooter />
      </div>

      {/* 🏙️ Elementos de Interface */}
      <FloatingCTAs />
      <SocialSidebar />
      <ParticleNexus />
      
    </main>
  );
}
