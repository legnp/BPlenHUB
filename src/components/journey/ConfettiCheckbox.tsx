"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

interface ConfettiCheckboxProps {
  label: string;
  onComplete: () => void;
  disabled?: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  shape: "circle" | "square" | "triangle";
  scale: number;
}

const PREMIUM_COLORS = [
  "#ff2c8d", // BPlen Pink
  "#7c3aed", // Violet
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Rose
];

export function ConfettiCheckbox({ label, onComplete, disabled = false }: ConfettiCheckboxProps) {
  const [isChecked, setIsChecked] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const triggerConfetti = () => {
    if (!buttonRef.current) return;

    // Obter as coordenadas centrais do botão
    const rect = buttonRef.current.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    const newParticles: Particle[] = Array.from({ length: 60 }).map((_, i) => {
      const size = Math.random() * 8 + 6;
      const shapes: Array<"circle" | "square" | "triangle"> = ["circle", "square", "triangle"];
      
      return {
        id: Date.now() + i,
        x: startX,
        y: startY,
        rotation: Math.random() * 360,
        color: PREMIUM_COLORS[Math.floor(Math.random() * PREMIUM_COLORS.length)],
        size,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        scale: Math.random() * 0.4 + 0.8,
      };
    });

    setParticles(newParticles);
  };

  const handleCheck = () => {
    if (isChecked || disabled) return;

    setIsChecked(true);
    triggerConfetti();

    // Aguardar o término da festa visual para disparar o callback mestre
    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  // Limpar as partículas após flutuarem para fora da tela
  useEffect(() => {
    if (particles.length > 0) {
      const timer = setTimeout(() => {
        setParticles([]);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [particles]);

  return (
    <>
      {/* Container do Botão Premium */}
      <div className="flex justify-center items-center py-4 w-full">
        <button
          ref={buttonRef}
          onClick={handleCheck}
          disabled={disabled || isChecked}
          className={`
            relative flex items-center gap-4 px-6 py-4 rounded-2xl
            border border-[var(--border-primary)] 
            bg-[var(--input-bg)]/20 backdrop-blur-md
            transition-all duration-300 group overflow-hidden select-none
            ${isChecked ? "cursor-default border-emerald-500/30 bg-emerald-500/5" : "hover:border-[var(--text-primary)]/40 hover:bg-[var(--input-bg)]/40 active:scale-[0.98] cursor-pointer"}
          `}
          style={{ maxWidth: "340px" }}
        >
          {/* Círculo do Checkbox */}
          <div className="relative flex items-center justify-center">
            <div
              className={`
                w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500
                ${isChecked 
                  ? "bg-gradient-to-tr from-[#ff2c8d] to-[#7c3aed] border-transparent scale-110 shadow-lg shadow-pink-500/20" 
                  : "border-[var(--text-primary)]/30 group-hover:border-[var(--text-primary)]/60"}
              `}
            >
              <AnimatePresence>
                {isChecked && (
                  <motion.svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <motion.path
                      d="M2.5 6L5 8.5L9.5 3.5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  </motion.svg>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Rótulo de Texto */}
          <span
            className={`
              text-[11px] font-bold uppercase tracking-widest transition-colors duration-500
              ${isChecked ? "text-emerald-500/high font-black" : "text-[var(--text-primary)]/80 group-hover:text-[var(--text-primary)]"}
            `}
          >
            {isChecked ? "Etapa Concluída!" : label}
          </span>

          {/* Sutil brilho de fundo no hover */}
          {!isChecked && (
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-pink-500/0 via-pink-500/5 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          )}
        </button>
      </div>

      {/* Partículas de Confete Renderizadas fora do fluxo do botão (Tela Inteira) */}
      <AnimatePresence>
        {particles.length > 0 && (
          <div className="fixed inset-0 pointer-events-none z-[9999]">
            {particles.map((particle) => {
              const angle = Math.random() * Math.PI * 2;
              // Dispersão circular e impulso para cima
              const speed = Math.random() * 250 + 150;
              const targetX = Math.cos(angle) * speed * 1.5;
              const targetY = -Math.abs(Math.sin(angle)) * speed * 2 - (Math.random() * 200 + 100);

              return (
                <motion.div
                  key={particle.id}
                  initial={{
                    x: particle.x,
                    y: particle.y,
                    rotate: particle.rotation,
                    scale: 0,
                    opacity: 1,
                  }}
                  animate={{
                    x: particle.x + targetX,
                    y: particle.y + targetY,
                    rotate: particle.rotation + (Math.random() * 360 + 180),
                    scale: [0, particle.scale, particle.scale * 0.7, 0],
                    opacity: [1, 1, 0.8, 0],
                  }}
                  transition={{
                    duration: 1.8 + Math.random() * 0.8,
                    ease: "easeOut",
                  }}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: particle.size,
                    height: particle.shape === "square" ? particle.size : particle.size * 0.6,
                    backgroundColor: particle.color,
                    borderRadius: particle.shape === "circle" ? "50%" : particle.shape === "triangle" ? "0 50% 50% 50%" : "2px",
                  }}
                />
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
