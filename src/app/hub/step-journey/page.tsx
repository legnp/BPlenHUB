"use client";

import React, { useState, useEffect } from "react";
import { JourneyNav } from "@/components/journey/JourneyNav";
import { motion, AnimatePresence } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useJourney } from "@/hooks/useJourney";
import AtmosphericLoading from "@/components/shared/AtmosphericLoading";
import { StepStatus } from "@/types/journey";

/**
 * BPlen HUB — Step Journey Dashboard 🧬
 * Página de visão geral da jornada do membro.
 */
export default function StepJourneyPage() {
  const { user, nickname } = useAuthContext();
  const { stages, progress, loading, getStepStatus, getStageTelemetry } = useJourney(user?.uid || "guest");
  const [currentStepId, setCurrentStepId] = useState("onboarding");

  useEffect(() => {
    if (progress?.lastActiveStepId) {
      setCurrentStepId(progress.lastActiveStepId);
    } else if (stages.length > 0) {
      setCurrentStepId(stages[0].id);
    }
  }, [progress, stages]);

  const currentStep = stages.find(s => s.id === currentStepId) || stages[0];
  
  if (loading || !currentStep) {
    return <AtmosphericLoading />;
  }

  // Renderização segura do ícone
  const IconName = currentStep.icon as keyof typeof LucideIcons;
  const IconComponent = (LucideIcons[IconName] as typeof LucideIcons.Circle) || LucideIcons.Circle;

  // Pre-calculate status map for Navigator
  const statusMap = stages.reduce((acc, stage) => {
    acc[stage.id] = getStepStatus(stage.id);
    return acc;
  }, {} as Record<string, StepStatus>);

  return (
    <div className="max-w-7xl mx-auto px-6 pt-[10px] pb-12">
      {/* Header da Jornada */}
      <header className="mb-12 text-center md:text-left">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[10px] font-black uppercase tracking-[0.2em] mb-4 border border-[var(--accent-primary)]/20">
            Evolution Path
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[var(--text-primary)] mb-4">
            Olá, <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]">{nickname || "Membro"}</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm md:text-base max-w-2xl leading-relaxed opacity-80">
            Bem-vindo à sua trilha de evolução estratégica. Acompanhe abaixo as etapas fundamentais para o seu desenvolvimento na BPlen.
          </p>
        </motion.div>
      </header>

      {/* Navegação da Jornada (Horizontal Stepper) */}
      <section className="mb-12">
        <JourneyNav 
          stages={stages}
          currentStepId={currentStepId} 
          stepStatusMap={statusMap}
          getStageTelemetry={getStageTelemetry}
          onSelectStep={setCurrentStepId}
        />
      </section>

      {/* Central Focus Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          <div className="lg:col-span-8 glass-morphism border border-[var(--border-primary)] rounded-[32px] p-8 md:p-12 shadow-2xl overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-primary)] opacity-[0.03] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            
            <div className="flex items-center gap-6 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white shadow-lg">
                <IconComponent className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent-primary)] mb-1">
                  Etapa Dinâmica
                </p>
                <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
                  {currentStep.title}
                </h2>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]/50 border-l-4 border-l-[var(--accent-primary)]">
                <p className="text-sm font-bold text-[var(--text-primary)] mb-2 italic">"{currentStep.title}"</p>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  {currentStep.description}
                </p>
              </div>

               {/* Atividades do Step */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentStep.substeps.map((sub: any, ridx: number) => (
                  <div 
                    key={ridx} 
                    onClick={() => {
                       window.location.href = `/hub/membro/journey/${currentStep.id}`;
                    }}
                    className="p-4 rounded-xl border border-[var(--border-primary)] bg-white/5 flex items-center gap-4 group/item hover:border-[var(--accent-primary)]/40 transition-all cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-secondary)]">
                       {sub.type === 'survey' ? <LucideIcons.ClipboardCheck className="w-4 h-4" /> : <LucideIcons.FileText className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-wider">{sub.title}</p>
                      <p className="text-[9px] text-[var(--text-muted)] line-clamp-1">Clique para iniciar</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 flex flex-wrap gap-4">
                <button 
                  onClick={() => window.location.href = `/hub/membro/journey/${currentStep.id}`}
                  className="px-8 py-3.5 rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                >
                  Ir para Etapa
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
             <div className="glass-morphism border border-[var(--border-primary)] rounded-[24px] p-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <LucideIcons.BarChart3 className="w-4 h-4 text-[var(--accent-primary)]" />
                  Performance
                </h3>
                <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed opacity-80">
                  Progresso monitorado via Firestore. Complete as atividades para avançar na jornada oficial.
                </p>
             </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
