"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, ArrowRight, Loader2 } from "lucide-react";

interface WelcomeRedirectModalProps {
  isOpen: boolean;
  userName: string;
  title?: string;
  description?: string;
  buttonText?: string;
  onConfirm: () => void;
}

/**
 * BPlen HUB — Welcome Redirect Modal (🚀 Soberania UI)
 * Utiliza Portals para garantir que o modal sempre apareça no topo da hierarquia visual.
 */
export function WelcomeRedirectModal({ 
  isOpen, 
  userName, 
  onConfirm,
  title,
  description,
  buttonText = "IR PARA RECEPÇÃO"
}: WelcomeRedirectModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.classList.add("glass-modal-open");
    } else {
      document.body.classList.remove("glass-modal-open");
    }
    return () => document.body.classList.remove("glass-modal-open");
  }, [isOpen]);

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-overlay flex items-center justify-center p-4 sm:p-6 overflow-hidden isolate">
          {/* Backdrop (Camada de Profundidade Soberana 🌑) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-xl transition-all duration-500 ease-in-out"
          />

          {/* Modal Content (Card Glassmorphism v3.2 - Alta Legibilidade) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 p-8 sm:p-12 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] overflow-hidden"
          >
            {/* Decorative Glows (Soberania de Cores) */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#ff0080] blur-[120px] opacity-20 animate-pulse" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#7928ca] blur-[120px] opacity-15" />
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-10">
              <div className="w-24 h-24 rounded-[3rem] bg-gradient-to-br from-[#ff0080]/20 to-[#7928ca]/10 flex items-center justify-center text-[#ff0080] shadow-[0_20px_40px_rgba(255,0,128,0.2)] border border-white/10">
                <Rocket size={48} className="animate-pulse" />
              </div>

              <div className="space-y-5">
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-none uppercase italic text-white">
                  {title || <>Olá, <span className="text-[#ff0080]">{userName}</span></>}
                </h2>
                <p className="text-sm sm:text-base font-medium text-gray-400 leading-relaxed max-w-[350px] mx-auto">
                  {description || (
                    <>
                      Percebemos que você ainda não passou pela nossa <span className="text-white font-bold tracking-tight underline decoration-[#ff0080]/30">recepção oficial</span>. 
                      Vamos te guiar agora para garantir sua melhor experiência.
                    </>
                  )}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 w-full flex items-center gap-5 text-left group">
                <div className="p-4 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                   <ArrowRight size={18} className="text-[#ff0080]" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 leading-snug">
                   Sua intenção de contratação está segura e você retornará automaticamente para este serviço.
                </p>
              </div>

              <div className="w-full space-y-4">
                <button
                  onClick={onConfirm}
                  className="w-full py-6 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-[0.25em] hover:scale-[1.03] active:scale-[0.97] transition-all shadow-[0_25px_50px_-12px_rgba(255,255,255,0.2)] flex items-center justify-center gap-4 group"
                >
                  {buttonText}
                  <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-500" />
                </button>
              </div>

              <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.4em] text-gray-600 pt-2">
                 <Loader2 size={12} className="animate-spin text-[#ff0080]/40" />
                 Ambiente Seguro BPlen
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
