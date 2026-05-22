"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TypedText } from "@/components/ui/TypedText";
import { Volume2, ChevronRight, Play } from "lucide-react";
import { useTourStore } from "@/store/tour-store";
import { useRouter, usePathname } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";

export function GlobalTourOverlay() {
  const { isActive, steps, currentIndex, nextStep, isNavigating, setNavigating, endTour } = useTourStore();
  const { nickname } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();

  const [isNarrating, setIsNarrating] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; placement: 'right' | 'left' | 'center' } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  const currentStep = steps[currentIndex];

  const interpolate = (text: string) => {
    return text.replace(/\{User_Nickname\}/g, nickname || "Membro BPlen");
  };

  const calculatePosition = useCallback(() => {
    if (!currentStep?.targetId || isNavigating) {
      setTooltipPos(null);
      return;
    }

    const el = document.getElementById(currentStep.targetId);
    if (!el) {
      setTooltipPos(null);
      return;
    }

    // Efeito de destaque no elemento alvo
    el.style.position = el.style.position === 'static' || !el.style.position ? 'relative' : el.style.position;
    el.style.zIndex = '102';

    const rect = el.getBoundingClientRect();
    const tooltipWidth = 440;
    const gap = 24;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    const spaceRight = viewportW - rect.right;
    const spaceLeft = rect.left;

    let left: number;
    let placement: 'right' | 'left' | 'center';

    if (spaceRight >= tooltipWidth + gap) {
      left = rect.right + gap;
      placement = 'right';
    } else if (spaceLeft >= tooltipWidth + gap) {
      left = rect.left - tooltipWidth - gap;
      placement = 'left';
    } else {
      left = Math.max(16, (viewportW - tooltipWidth) / 2);
      placement = 'center';
    }

    let top = rect.top + rect.height / 2 - 140;
    if (placement === 'center') {
      top = rect.bottom + gap;
    }
    top = Math.max(16, Math.min(top, viewportH - 350));
    left = Math.max(16, left);

    setTooltipPos({ top, left, placement });
  }, [currentStep, isNavigating]);

  // Roteamento Automático e Disparo de Ações
  useEffect(() => {
    if (!isActive || !currentStep) return;

    // Se estivermos na rota errada, navegamos e pausamos a UI
    if (pathname !== currentStep.route) {
      setNavigating(true);
      router.push(currentStep.route);
      return; // O useEffect rodará novamente quando pathname mudar
    }

    setNavigating(false);

    // Disparar ações customizadas
    if (currentStep.customAction) {
      window.dispatchEvent(new CustomEvent('tour-action', { detail: currentStep.customAction }));
    }

    // Scroll e Cálculo de Posição
    if (currentStep.targetId) {
      setTimeout(() => {
        const el = document.getElementById(currentStep.targetId!);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(calculatePosition, 400);
        } else {
          calculatePosition();
        }
      }, 500); // Dar tempo pro React renderizar a página nova
    } else {
      calculatePosition();
    }

    return () => {
      // Limpar z-index modificado
      if (currentStep?.targetId) {
        const el = document.getElementById(currentStep.targetId);
        if (el) {
          el.style.zIndex = '';
        }
      }
    };
  }, [isActive, currentStep, pathname, router, calculatePosition, setNavigating]);

  useEffect(() => {
    if (!isActive) return;
    const handleResize = () => calculatePosition();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [isActive, calculatePosition]);

  const narrate = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(interpolate(currentStep.content));
      utterance.lang = "pt-BR";
      utterance.rate = 1.1;
      utterance.pitch = 1.1;
      utterance.onstart = () => setIsNarrating(true);
      utterance.onend = () => setIsNarrating(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!isActive || isNavigating || !currentStep) return null;

  const tooltipStyle: React.CSSProperties = tooltipPos
    ? {
        position: 'fixed',
        top: tooltipPos.top,
        left: tooltipPos.left,
      }
    : {};

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-all duration-700"
        onClick={() => {}} 
      />

      <div className={!tooltipPos ? "absolute inset-0 flex items-center justify-center pointer-events-none z-[101]" : "pointer-events-none z-[101]"}>
         <AnimatePresence mode="wait">
           <motion.div
             ref={tooltipRef}
             key={currentIndex}
             initial={{ opacity: 0, y: 20, scale: 0.95 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: -20, scale: 0.95 }}
             transition={{ duration: 0.5, ease: "easeOut" }}
             className="pointer-events-auto w-full max-w-md p-8 bg-[var(--bg-primary)]/95 backdrop-blur-2xl border border-[var(--border-primary)] rounded-[2.5rem] shadow-[0_32px_64px_rgba(0,0,0,0.5)] flex flex-col gap-6"
             style={tooltipStyle}
           >
          <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-4">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 cursor-pointer">
                   {isNarrating ? <Volume2 className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4" onClick={narrate} />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">BPlen Narrator</span>
             </div>
             <button onClick={endTour} className="text-[10px] font-bold text-[var(--text-muted)] hover:text-white uppercase tracking-wider">
               Pular Tour
             </button>
          </div>

          <div className="min-h-[80px]">
             {currentStep.title && (
               <h4 className="text-xl font-black text-[var(--text-primary)] mb-2 tracking-tight">{interpolate(currentStep.title)}</h4>
             )}
             <div className="text-sm md:text-base text-[var(--text-muted)] leading-relaxed italic">
                <TypedText 
                  text={interpolate(currentStep.content)} 
                  speed={25} 
                />
             </div>
          </div>

          <div className="flex items-center justify-between pt-4">
             <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <div 
                     key={i} 
                     className={`h-1.5 rounded-full transition-all duration-500 ${i === currentIndex ? "w-8 bg-pink-500" : i < currentIndex ? "w-3 bg-pink-500/40" : "w-1.5 bg-[var(--text-muted)]/20"}`}
                  />
                ))}
             </div>
             <button 
                onClick={nextStep}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl max-w-[280px] text-center leading-tight"
             >
                {currentStep.buttonLabel || (currentIndex === steps.length - 1 ? "Começar Jornada" : "Entendi")}
                <ChevronRight size={14} className="shrink-0" />
             </button>
          </div>
        </motion.div>
      </AnimatePresence>
      </div>
    </div>
  );
}
