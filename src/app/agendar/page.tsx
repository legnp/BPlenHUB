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

      {/* Card em 1 viewport, sem scroll de página (item 11 F1-01). O footer fica
          abaixo da dobra; a altura do card é responsiva (variant="page"). */}
      <div className="z-10 relative w-full max-w-4xl mx-auto px-4 flex flex-col items-center justify-center min-h-[100svh]">
         <div className="w-full">
            <PublicBookingFlow variant="page" />
         </div>
      </div>

      {/* 🛰️ Navegação Global (Herança da Home) */}
      <FloatingCTAs />
      <SocialSidebar />

      {/* 8. Rodapé Minimalista (Herança da Home) */}
      <HomeFooter />

    </main>
  );
}
