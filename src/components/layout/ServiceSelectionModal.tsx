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
            className="absolute inset-0 bg-black/20 backdrop-blur-3xl transition-all"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-[#111] border border-white/10 rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* Header */}
            <div className="p-10 pb-6 flex items-center justify-between border-b border-white/5">
               <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ff0080]">Selecione sua jornada</span>
                  <h2 className="text-3xl font-black tracking-tighter text-white">Como podemos <span className="text-gray-500">te apoiar?</span></h2>
               </div>
               <button 
                 onClick={onClose}
                 className="p-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all flex items-center justify-center"
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
                   className={`flex flex-col justify-between p-8 bg-white/5 border border-white/5 rounded-[2.5rem] transition-all group ${audience.color} hover:bg-white/[0.08] min-h-[240px] shadow-sm`}
                 >
                    <div className="space-y-6">
                       <div className="p-4 bg-white/5 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                          {audience.icon}
                       </div>
                       <div className="space-y-1">
                          <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">{audience.subtitle}</span>
                          <h3 className="text-xl font-black text-white">{audience.title}</h3>
                       </div>
                    </div>

                    <div className="pt-8 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 text-[9px] font-black uppercase tracking-widest text-white/50">
                       Explorar Soluções
                       <ArrowRight size={14} className="text-[#ff0080]" />
                    </div>
                 </Link>
               ))}
            </div>

            {/* Footer Footer */}
            <div className="p-8 bg-white/[0.02] border-t border-white/5 text-center">
               <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                  Foco em estratégia e desenvolvimento humano prático.
               </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
