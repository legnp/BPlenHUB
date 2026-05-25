"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, ArrowRight } from "lucide-react";
import Link from "next/link";

interface CheckoutResumeFloatingButtonProps {
  slug: string;
  userName?: string;
}

/**
 * BPlen HUB — Botão Flutuante de Continuidade de Checkout 🚀🛡️
 * Aparece como um lembrete laranja vibrante para usuários que vieram do fluxo de contratação.
 */
export function CheckoutResumeFloatingButton({ slug, userName }: CheckoutResumeFloatingButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[999] w-[90%] max-w-md"
    >
      <Link
        href={`/hub/membro/checkout/${slug}`}
        className="group relative flex items-center gap-4 p-5 bg-gradient-to-r from-[#ff8c00] to-[#ff0080] rounded-[2rem] shadow-[0_20px_50px_rgba(255,140,0,0.3)] border border-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden"
      >
        {/* Glow Effects */}
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="relative z-10 p-3 bg-white/20 rounded-2xl text-white">
           <Rocket size={24} className="animate-pulse" />
        </div>

        <div className="relative z-10 flex-1 text-left">
           <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70 mb-0.5">
             {userName ? `Olá, ${userName}` : "Atenção"}
           </p>
           <h4 className="text-sm font-black uppercase tracking-tight text-white leading-tight">
             Continuar contratação do serviço?
           </h4>
        </div>

        <div className="relative z-10 p-2 bg-white text-[#ff8c00] rounded-full group-hover:translate-x-2 transition-transform duration-500">
           <ArrowRight size={18} />
        </div>
      </Link>
    </motion.div>
  );
}
