"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

/**
 * BPlen HUB — ScrollReveal Wrapper (🚀)
 * Componente leve para isolar lógicas de animação client-side.
 * Permite que o componente pai seja um Server Component.
 */

interface ScrollRevealProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  animation?: "fade-up" | "fade-in" | "slide-left" | "slide-right" | "zoom-in";
  duration?: number;
  delay?: number;
  once?: boolean;
  threshold?: number;
}

export function ScrollReveal({
  children,
  animation = "fade-up",
  duration = 0.8,
  delay = 0,
  once = true,
  threshold = 0.1,
  className,
  ...props
}: ScrollRevealProps) {
  
  // Definições de variantes de animação BPlen Premium
  const variants = {
    "fade-up": {
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 },
    },
    "fade-in": {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
    },
    "slide-left": {
      initial: { opacity: 0, x: -30 },
      animate: { opacity: 1, x: 0 },
    },
    "slide-right": {
      initial: { opacity: 0, x: 30 },
      animate: { opacity: 1, x: 0 },
    },
    "zoom-in": {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
    },
  };

  const selectedVariant = variants[animation];

  return (
    <motion.div
      initial={selectedVariant.initial}
      whileInView={selectedVariant.animate}
      viewport={{ once, margin: `-${threshold * 100}%` }}
      transition={{ 
        duration, 
        delay, 
        ease: [0.16, 1, 0.3, 1] // Custom BPlen Cubic Bezier
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
