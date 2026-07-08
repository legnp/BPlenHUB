"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Target, ChevronRight, ArrowLeft } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useJourney } from "@/hooks/useJourney";
import { JourneyNav } from "@/components/journey/JourneyNav";
import Link from "next/link";

import { usePathname } from "next/navigation";
import { BPLEN_NOMENCLATURE } from "@/config/nomenclature";

interface MemberJourneyHeroProps {
  showAction?: boolean;
  variant?: "default" | "minimal";
}

/**
 * MemberJourneyHero — BPlen HUB 🧬
 * Componente unificado para exibição da Jornada (Regra: 1 para Muitos).
 * Utilizado na Home do HUB e na Área de Membro.
 */
export function MemberJourneyHero({ showAction = false, variant = "default" }: MemberJourneyHeroProps) {
  const { user, services } = useAuthContext();
  
  // Journey Integration
  const { stages, progress, loading, getStageTelemetry } = useJourney(user?.uid || "guest");
  const [activeStageId, setActiveStageId] = useState<string>("onboarding");

  // Sincronizar estágio ativo baseado no progresso
  useEffect(() => {
    if (progress?.lastActiveStepId) {
       setActiveStageId(progress.lastActiveStepId);
    } else if (stages.length > 0) {
       setActiveStageId(stages[0].id);
    }
  }, [progress, stages]);
  
  // Otimização: Memoizar o mapa de status para evitar re-cálculos caros no render 🚀
  const stepStatusMap = useMemo(() => {
    if (!progress?.steps) return {};
    return Object.fromEntries(
      Object.entries(progress.steps).map(([k, v]) => [k, v.status])
    );
  }, [progress?.steps]);

  // Removido o return null para suportar renderização progressiva.
  // O JourneyNav interno lidará com o estado vazio se necessário.
  
  const isMinimal = variant === "minimal";
  const pathname = usePathname();
  const isHubHome = pathname === "/hub";
  // Fase D: sem bypass de admin — o selo nao e' herdado (coerente com o cadeado
  // do /hub/membro); admin sem selo ve a previa como qualquer nao-membro.
  const isFullMember = services?.member_area_access === true;
  const showPreview = isHubHome && !isFullMember;

  return (
    <section 
      id="jornada-membro-card"
      className={isMinimal 
      ? "bg-transparent border-none p-0 relative overflow-visible group" 
      : "bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[3.5rem] p-10 md:p-14 relative overflow-visible group shadow-sm transition-all duration-500 hover:shadow-lg transform-gpu"
    }>
      {!isMinimal && (
        <div className="absolute inset-0 overflow-hidden rounded-[3.5rem] pointer-events-none">
          <div className="absolute top-0 right-0 p-12 opacity-5">
             <Compass size={180} className="text-[var(--accent-start)] rotate-12" />
          </div>
        </div>
      )}

      <div className="relative z-10 space-y-8">
         <AnimatePresence>
            {!isMinimal && (
               <motion.div 
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: "auto" }}
                 exit={{ opacity: 0, height: 0 }}
                 className="flex flex-col md:flex-row md:items-end justify-between gap-6 overflow-hidden pb-4"
               >
                  <div className="space-y-4">
                     <div className="flex items-center gap-2.5 text-[var(--accent-start)]">
                        <Target size={18} className="animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">
                          {showPreview ? (
                            <>
                              <span className="text-[var(--text-primary)]">Prévia</span> da {BPLEN_NOMENCLATURE.member_area.hero_badge}
                            </>
                          ) : (
                            BPLEN_NOMENCLATURE.member_area.hero_badge
                          )}
                        </span>
                     </div>
                     <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight italic">
                       {BPLEN_NOMENCLATURE.member_area.hero_title.split(" ").slice(0, -1).join(" ")} <span className="text-[var(--accent-start)] not-italic">{BPLEN_NOMENCLATURE.member_area.hero_title.split(" ").pop()}</span>
                     </h2>
                  </div>

                  {showAction && (
                     <Link 
                       href="/hub/membro"
                       className="group/btn flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-[var(--accent-start)]/10 hover:border-[var(--accent-start)]/30 transition-all duration-500 shadow-sm"
                     >
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] group-hover/btn:text-[var(--accent-start)] transition-colors">
                           {BPLEN_NOMENCLATURE.member_area.hero_action}
                        </span>
                        <ChevronRight size={14} className="text-[var(--text-muted)] group-hover/btn:text-[var(--accent-start)] group-hover/btn:translate-x-1 transition-all" />
                     </Link>
                  )}
               </motion.div>
            )}
         </AnimatePresence>

         <div className={isMinimal ? "pt-0" : "pt-4"}>
            {stages.length > 0 && (
              <JourneyNav 
                 stages={stages}
                 currentStepId={activeStageId} 
                 stepStatusMap={stepStatusMap}
                 getStageTelemetry={getStageTelemetry}
              />
            )}
         </div>
      </div>
    </section>
  );
}
