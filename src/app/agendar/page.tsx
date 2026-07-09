import React from "react";
import { PublicBookingFlow } from "@/components/ui/PublicBookingFlow";
import { HomeFooter } from "@/components/home/HomeFooter";
import { ParticleNexus } from "@/components/home/ParticleNexus";
import { FloatingCTAs } from "@/components/layout/FloatingCTAs";
import { SocialSidebar } from "@/components/layout/SocialSidebar";

export const metadata = {
  title: "Agendar Conversa",
  description: "Reserve uma reunião estratégica de 30 minutos com a equipe BPlen.",
};

/**
 * PÁGINA DE AGENDAMENTO PÚBLICO (1 TO 1) 📅
 * Herda o layout premium da Home para consistência de marca.
 */
export default function AgendarPage() {
  return (
    <main className="min-h-screen bg-black text-white relative isolate overflow-x-hidden theme-dark font-sans">
      
      {/* 🌌 Camada Global de Partículas (Herança da Home) */}
      <ParticleNexus />

      {/* Header no mesmo padrão/altura das páginas de produto (/servicos): topo
          alinhado com pt-12, sem centralização vertical. O card cresce conforme o
          conteúdo, sem barra de rolagem própria (item 11 F1-01, revisão 2026-07-09). */}
      <section className="pt-12 pb-20 px-4 relative z-10">
        <div className="w-full max-w-4xl mx-auto">
          <PublicBookingFlow variant="page" />
        </div>
      </section>

      {/* 🛰️ Navegação Global (Herança da Home) */}
      <FloatingCTAs />
      <SocialSidebar />

      {/* 8. Rodapé Minimalista (Herança da Home) */}
      <HomeFooter />

    </main>
  );
}
