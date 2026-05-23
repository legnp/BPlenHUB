"use client";

import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TypedText } from "@/components/ui/TypedText";
import { Volume2, ChevronRight, Play } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useTourStore } from "@/store/tour-store";

export interface TourStep {
  targetId?: string;
  title?: string;
  content: string;
  buttonLabel?: string;
  action?: () => void;
  route?: string;
  customAction?: string;
  placement?: 'right' | 'left' | 'top' | 'bottom' | 'center';
  gap?: number;
}

interface GuidedTourOverlayProps {
  steps?: TourStep[];
  onComplete?: () => void;
  onReveal?: (revealedIds: string[]) => void;
  onFocus?: (targetId: string | null) => void;
  isOpen?: boolean;
  userName?: string;
  currentStepIndex?: number;
  onNext?: () => void;
}

/**
 * BPlen HUB - Step Journey Engine
 * Spotlight-based navigation with smart positioning and route awareness.
 */
export function GuidedTourOverlay({ 
  steps: propsSteps, 
  onComplete: propsOnComplete, 
  onReveal, 
  onFocus, 
  isOpen: propsIsOpen, 
  userName,
  currentStepIndex: propsIndex,
  onNext: propsOnNext
}: GuidedTourOverlayProps) {
  const store = useTourStore();
  
  // Usar props se fornecidas, caso contrário usar store
  const steps = propsSteps || store.steps;
  const isOpen = propsIsOpen !== undefined ? propsIsOpen : store.isActive;
  const [internalIndex, setInternalIndex] = useState(0);
  const currentIndex = propsIndex !== undefined ? propsIndex : (propsSteps ? internalIndex : store.currentIndex);
  
  const [isNarrating, setIsNarrating] = useState(false);
  const [revealedIds, setRevealedIds] = useState<string[]>([]);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; placement: string } | null>(null);
  const [spotlightRect, setSpotlightRect] = useState<{ x: number; y: number; width: number; height: number; rx: number } | null>(null);
  
  const tooltipRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const currentStep = steps[currentIndex];

  const interpolate = (text: string) => {
    return text.replace(/\{User_Nickname\}/g, userName || "Membro BPlen");
  };

  const calculatePosition = useCallback(() => {
    if (!currentStep?.targetId) {
      setTooltipPos(null);
      return;
    }

    const el = document.getElementById(currentStep.targetId);
    if (!el) {
      setTooltipPos(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    const tooltipWidth = 440;
    const gap = currentStep.gap || 24;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    const spaceRight = viewportW - rect.right;
    const spaceLeft = rect.left;
    const spaceBottom = viewportH - rect.bottom;
    const spaceTop = rect.top;

    let left: number;
    let top: number;
    let placement: string;

    const preferred = currentStep.placement;

    if (preferred === 'right' || (!preferred && spaceRight >= tooltipWidth + gap)) {
      left = rect.right + gap;
      top = rect.top + rect.height / 2 - 140;
      placement = 'right';
    } else if (preferred === 'left' || (!preferred && spaceLeft >= tooltipWidth + gap)) {
      left = rect.left - tooltipWidth - gap;
      top = rect.top + rect.height / 2 - 140;
      placement = 'left';
    } else if (preferred === 'bottom' || (!preferred && spaceBottom > 350)) {
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      top = rect.bottom + gap;
      placement = 'bottom';
    } else {
      left = Math.max(16, (viewportW - tooltipWidth) / 2);
      top = rect.top - 350 - gap;
      placement = 'top';
    }

    // Clamping
    top = Math.max(16, Math.min(top, viewportH - 350));
    left = Math.max(16, Math.min(left, viewportW - tooltipWidth - 16));

    setTooltipPos({ top, left, placement });
  }, [currentStep]);

  // Observer for dynamic target changes
  useLayoutEffect(() => {
    if (!isOpen || !currentStep?.targetId) return;
    
    const target = document.getElementById(currentStep.targetId);
    if (!target) return;

    const observer = new ResizeObserver(() => calculatePosition());
    observer.observe(target);
    observer.observe(document.body);

    const interval = setInterval(calculatePosition, 500);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, [isOpen, currentStep?.targetId, calculatePosition]);

  // Entrance actions and individual blur handling
  useEffect(() => {
    if (!isOpen) return;

    // Entrance custom action
    if (currentStep?.customAction) {
      window.dispatchEvent(new CustomEvent('tour-action', { detail: currentStep.customAction }));
    }

    // Handle Route Navigation
    if (currentStep?.route && pathname !== currentStep.route) {
      router.push(currentStep.route);
      return;
    }

    if (currentStep?.targetId) {
      onFocus?.(currentStep.targetId);
      setRevealedIds(prev => {
        const next = prev.includes(currentStep.targetId!) ? prev : [...prev, currentStep.targetId!];
        onReveal?.(next);
        return next;
      });

      const el = document.getElementById(currentStep.targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(calculatePosition, 500);
      } else {
        calculatePosition();
      }
    } else {
      onFocus?.(null);
      setTooltipPos(null);
    }

    // Apply individual styles like the Member Area tour
    const elementsToBlur = [
      document.getElementById("hub-global-header"),
      document.getElementById("hub-social-menu-area"),
      document.getElementById("hub-journey-top-nav"),
      document.getElementById("hub-assessments"),
      document.getElementById("hub-agenda"),
      document.getElementById("hub-carreira"),
      document.getElementById("ultimos-conteudos"),
      document.getElementById("primeiros-passos-acesso"),
      document.getElementById("jornada-membro-card"),
      document.getElementById("checkpoints-area"),
      document.getElementById("hub-support-btn"),
      document.getElementById("theme-switcher-btn"),
      document.getElementById("tour-profile-photo")?.parentElement
    ].filter(Boolean) as HTMLElement[];

    elementsToBlur.forEach(el => {
      const isTarget = el.id === currentStep?.targetId || el.contains(document.getElementById(currentStep?.targetId || ""));
      if (isTarget) {
        el.style.filter = "none";
        el.style.zIndex = "1002";
        el.style.position = "relative";
        el.style.pointerEvents = "auto";
        el.style.boxShadow = "0 0 80px rgba(255, 0, 128, 0.4)";
        el.style.transition = "all 0.6s ease-out";
      } else {
        el.style.filter = "blur(12px)";
        el.style.opacity = "0.5";
        el.style.pointerEvents = "none";
        el.style.zIndex = "1";
        el.style.boxShadow = "none";
        el.style.transition = "all 0.6s ease-out";
      }
    });

    return () => {
      elementsToBlur.forEach(el => {
        el.style.filter = "";
        el.style.opacity = "";
        el.style.pointerEvents = "";
        el.style.zIndex = "";
        el.style.boxShadow = "";
      });
    };
  }, [currentIndex, isOpen, pathname, calculatePosition, onFocus, onReveal, currentStep, router]);

  useEffect(() => {
    if (!isOpen) {
      setInternalIndex(0);
      setRevealedIds([]);
      setTooltipPos(null);
    }
  }, [isOpen]);

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

  const handleNext = () => {
    // Executar ação customizada via evento global
    if (currentStep.customAction) {
      window.dispatchEvent(new CustomEvent('tour-action', { detail: currentStep.customAction }));
    }

    if (currentStep.action) currentStep.action();
    
    if (propsOnNext) {
      propsOnNext();
    } else if (propsSteps) {
      // Controle interno para componente isolado
      if (internalIndex < steps.length - 1) {
        setInternalIndex(prev => prev + 1);
      } else {
        propsOnComplete?.();
      }
    } else {
      // Controle via Store para Tour Global
      store.nextStep();
    }
  };

  const handleComplete = () => {
    if (propsOnComplete) {
      propsOnComplete();
    } else {
      store.endTour();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[4px] pointer-events-none" />

      <div className={!tooltipPos ? "absolute inset-0 flex items-center justify-center pointer-events-none z-[1001]" : "pointer-events-none z-[1001]"}>
         <AnimatePresence mode="wait">
            <motion.div
              ref={tooltipRef}
              key={currentIndex}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                top: tooltipPos?.top,
                left: tooltipPos?.left,
                position: tooltipPos ? 'fixed' : 'relative'
              }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="pointer-events-auto w-full max-w-md p-8 bg-[var(--bg-primary)]/90 backdrop-blur-3xl border border-[var(--border-primary)] rounded-[2.5rem] shadow-[0_32px_64px_rgba(0,0,0,0.4)] flex flex-col gap-6"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-4">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 cursor-pointer hover:bg-pink-500/30 transition-colors">
                       {isNarrating ? <Volume2 className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4" onClick={narrate} />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">BPlen Narrator</span>
                 </div>
                 <button 
                  onClick={handleComplete}
                  className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-pink-500 transition-colors"
                 >
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
                    onClick={handleNext}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl max-w-[280px] text-center leading-tight"
                 >
                    {currentStep.buttonLabel || (currentIndex === steps.length - 1 ? "Finalizar" : "Entendi")}
                    <ChevronRight size={14} className="shrink-0" />
                 </button>
              </div>
            </motion.div>
         </AnimatePresence>
      </div>
    </div>
  );
}
