"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Sparkles, ArrowRightCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SequenceLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  prevStageTitle: string;
  type?: "etapa" | "parada";
}

/**
 * SequenceLockModal — BPlen HUB 🛡️✨
 * Modal de Soberania Metodológica para bloqueio de sequência linear.
 * Design: Glassmorphism v3.1 / Apple Pro
 */
export function SequenceLockModal({ isOpen, onClose, prevStageTitle, type = "etapa" }: SequenceLockModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          {/* Backdrop Eéreo 🌫️ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-white/40 backdrop-blur-[8px] cursor-pointer"
          />

          {/* Container do Modal 💎 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "relative w-full max-w-[440px] overflow-hidden z-10",
              "bg-white/5 backdrop-blur-2xl border border-white/10",
              "rounded-[3rem] shadow-[0_64px_128px_-24px_rgba(0,0,0,0.6)]"
            )}
          >
            {/* Esplendor Visual (Background Glow) */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-pink-500/20 rounded-full blur-[80px]" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-[80px]" />

            {/* Conteúdo Principal */}
            <div className="p-10 flex flex-col items-center text-center space-y-8">
              
              {/* Badge de Destaque ✨ */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                 <Sparkles size={12} className="text-amber-500 animate-pulse" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">
                    Soberania Metodológica
                 </span>
              </div>

              {/* Ícone de Cadeado Soberano 🔒 */}
              <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/20">
                 <Lock size={40} className="text-white" />
              </div>

              {/* Mensagem Polida */}
              <div className="space-y-4">
                <h3 className="text-2xl font-black text-white tracking-tight leading-tight">
                  {type === "etapa" ? "Aguardando Conclusão" : "Aguardando Parada"} <br /> {type === "etapa" ? "da Etapa Anterior" : "Anterior"}
                </h3>
                <p className="text-[13px] leading-relaxed text-slate-400 font-medium">
                  Para garantir a eficácia do seu progresso, a {type} <span className="text-amber-400 font-black">{prevStageTitle}</span> precisa ser concluída 100% antes de liberar este novo ciclo.
                </p>
              </div>

              {/* CTA e Rodapé */}
              <button
                onClick={onClose}
                className={cn(
                  "w-full py-5 rounded-[2rem] bg-white text-black flex items-center justify-center gap-3",
                  "font-black text-[11px] uppercase tracking-[0.25em]",
                  "hover:bg-amber-400 hover:scale-[1.02] active:scale-[0.98] transition-all duration-500"
                )}
              >
                Compreendido
                <ArrowRightCircle size={16} />
              </button>

              <div className="space-y-1">
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest opacity-60">
                    Sua evolução é linear e focada
                 </p>
                 <p className="text-[9px] font-medium text-amber-500/60 uppercase tracking-widest italic">
                    &quot;Alavanque a sua carreira&quot;
                 </p>
              </div>
            </div>

            {/* Overlay Decorativo de Vidro */}
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent opacity-30" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
