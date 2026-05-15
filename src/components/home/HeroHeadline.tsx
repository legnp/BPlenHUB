"use client";

import React from "react";
import { motion } from "framer-motion";

/**
 * HeroHeadline (Client Component ⚡)
 * Isola a animação e o evento de clique do título principal.
 */
export function HeroHeadline() {
  const handleOpenModal = () => {
    window.dispatchEvent(new Event("open-service-modal"));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex justify-center"
    >
      <button 
        onClick={handleOpenModal}
        className="group flex flex-col items-center justify-center text-center cursor-pointer transition-transform hover:scale-[1.02]"
        aria-label="Clique aqui para descomplicar o desenvolvimento humano no trabalho"
      >
        <span className="text-[var(--text-muted)] text-xs tracking-widest lowercase mb-1 group-hover:text-[var(--text-primary)] transition-colors">
          clique aqui para
        </span>
        <span className="text-white text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight block -mb-2 z-10">
          descomplicar o
        </span>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff0080] via-[#c026d3] to-[#7928ca] bg-[size:200%_auto] animate-gradient-flow text-5xl md:text-7xl lg:text-[6.5rem] font-black tracking-tighter leading-[0.85] z-20 pb-2">
          desenvolvimento
        </span>
        <span 
          className="text-transparent bg-clip-text bg-gradient-to-r from-[#c026d3] via-[#ff0080] to-[#7928ca] bg-[size:200%_auto] animate-gradient-flow text-5xl md:text-7xl lg:text-[6.5rem] font-black tracking-tighter leading-[0.85] -mt-1 md:-mt-3 z-30 pb-2"
          style={{ animationDelay: "2s" }}
        >
          humano
        </span>
        <span className="text-[var(--text-secondary)] text-xl md:text-2xl font-medium tracking-tight mt-1 group-hover:text-[var(--text-primary)] transition-colors">
          no trabalho
        </span>
      </button>
    </motion.div>
  );
}
