"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, ArrowRight, Loader2 } from "lucide-react";

interface WelcomeRedirectModalProps {
  isOpen: boolean;
  userName: string;
  onConfirm: () => void;
}

/**
 * BPlen HUB — Welcome Redirect Modal (🚀 Soberana UI)
 * Informa ao usuário que ele precisa passar pela recepção para garantir a melhor experiência.
 */
export function WelcomeRedirectModal({ isOpen, userName, onConfirm }: WelcomeRedirectModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-gradient-to-b from-white/10 to-white/5 border border-white/10 p-10 rounded-[3rem] shadow-2xl overflow-hidden"
          >
            {/* Decorative Glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#ff0080] blur-[100px] opacity-20" />
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-8">
              <div className="w-20 h-20 rounded-[2.5rem] bg-[#ff0080]/10 flex items-center justify-center text-[#ff0080] shadow-xl">
                <Rocket size={40} className="animate-pulse" />
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl font-black tracking-tighter leading-tight uppercase italic">
                  Olá, <span className="text-[#ff0080]">{userName}</span>
                </h2>
                <p className="text-sm font-medium text-gray-400 leading-relaxed max-w-[320px] mx-auto">
                  Percebemos que você ainda não passou pela nossa <span className="text-white font-bold tracking-tight">recepção oficial</span>. 
                  Para garantir a sua correta jornada estratégica, vamos te guiar agora.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 w-full flex items-center gap-4 text-left">
                <div className="p-3 bg-white/5 rounded-xl">
                   <ArrowRight size={16} className="text-gray-500" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 leading-snug">
                   Sua intenção de contratação já está salva e você retornará para cá em breve.
                </p>
              </div>

              <button
                onClick={onConfirm}
                className="w-full py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 group"
              >
                IR PARA RECEPÇÃO
                <ArrowRight size={18} className="group-hover:translate-x-1 duration-300" />
              </button>

              <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.3em] text-gray-600">
                 <Loader2 size={10} className="animate-spin" />
                 Ambiente Seguro BPlen
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
