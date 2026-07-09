"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Users, Handshake, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ServiceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const audiences = [
  {
    id: "pessoas",
    title: "Para Pessoas",
    subtitle: "Carreira & Liderança",
    description: "Metodologias ágeis para seu desenvolvimento individual.",
    icon: <User className="w-6 h-6 text-[#ff0080]" />,
    href: "/servicos/pessoas",
    color: "hover:border-[#ff0080]/30"
  },
  {
    id: "empresas",
    title: "Para Empresas",
    subtitle: "HRBP as a Service",
    description: "Estratégia e performance para o seu time e cultura.",
    icon: <Users className="w-6 h-6 text-[#667eea]" />,
    href: "/servicos/empresas",
    color: "hover:border-[#667eea]/30"
  },
  {
    id: "parceiros",
    title: "Para Parceiros",
    subtitle: "Sinergia de alto valor",
    description: "Projetos especiais e co-criação de alto impacto.",
    icon: <Handshake className="w-6 h-6 text-[#ff0080]" />,
    href: "/servicos/parceiros",
    color: "hover:border-[#ff0080]/30"
  }
];

/**
 * ServiceSelectionModal — BPlen HUB ✨
 * Um modal elegante e minimalista para direcionar o usuário ao catálogo correto.
 */
export function ServiceSelectionModal({ isOpen, onClose }: ServiceSelectionModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-overlay flex items-center justify-center p-6">
          {/* Backdrop Glass */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[var(--modal-backdrop)] backdrop-blur-3xl transition-all"
          />

          {/* Modal Content — cores via vars de tema: adapta a tela que chama
              (dark em / e /servicos, claro em /conteudo). */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-[var(--glass-bg)] border border-[var(--border-primary)] backdrop-blur-2xl rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* Header */}
            <div className="p-10 pb-6 flex items-center justify-between border-b border-[var(--border-primary)]">
               <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent-start)]">Selecione sua jornada</span>
                  <h2 className="text-3xl font-black tracking-tighter text-[var(--text-primary)]">Como podemos <span className="text-[var(--text-muted)]">te apoiar?</span></h2>
               </div>
               <button
                 onClick={onClose}
                 className="p-3 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all flex items-center justify-center"
               >
                 <X size={20} />
               </button>
            </div>

            {/* Selection Body */}
            <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-6">
               {audiences.map((audience) => (
                 <Link 
                   key={audience.id}
                   href={audience.href}
                   onClick={onClose}
                   className={`flex flex-col justify-between p-8 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[2.5rem] transition-all group ${audience.color} hover:bg-[var(--accent-soft)] min-h-[240px] shadow-sm`}
                 >
                    <div className="space-y-6">
                       <div className="p-4 bg-[var(--input-bg)] rounded-2xl w-fit group-hover:scale-110 transition-transform">
                          {audience.icon}
                       </div>
                       <div className="space-y-1">
                          <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">{audience.subtitle}</span>
                          <h3 className="text-xl font-black text-[var(--text-primary)]">{audience.title}</h3>
                       </div>
                    </div>

                    <div className="pt-8 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                       Conhecer Serviços
                       <ArrowRight size={14} className="text-[#ff0080]" />
                    </div>
                 </Link>
               ))}
            </div>

            {/* Footer Footer */}
            <div className="p-8 bg-[var(--input-bg)] border-t border-[var(--border-primary)] text-center">
               <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                  Foco em estratégia e desenvolvimento humano prático.
               </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
