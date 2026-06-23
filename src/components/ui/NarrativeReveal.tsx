"use client";

import React, { useState, useEffect, useRef } from "react";

interface NarrativeRevealProps {
  text: string;
  onComplete?: () => void;
  speed?: number; // ms por caractere
  variant?: "h2" | "h3" | "p" | "p-muted";
  className?: string;
  delay?: number;
  active?: boolean;
}

/**
 * NarrativeReveal (Arquitetura de Revelação Estável v3.2 💎)
 * Substitui o Typewriter de string por uma estrutura DOM 100% estável.
 * Garante que negritos, quebras de linha e tipografia não sofram reflow.
 */
export function NarrativeReveal({ 
  text, 
  onComplete, 
  speed = 30, 
  variant = "p", 
  className = "",
  delay = 0,
  active = true
}: NarrativeRevealProps) {
  const [visibleChars, setVisibleChars] = useState(0);
  const onCompleteRef = useRef(onComplete);

  // Atualizar ref para evitar disparos extras no useEffect
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Normalização e Limpeza (Markdown -> Texto para contagem)
  const normalizedText = text.replaceAll("\\n", "\n");
  const rawTextForCounting = normalizedText.replace(/\*\*/g, "").replace(/==/g, ""); // Remove marcadores da contagem real

  useEffect(() => {
    if (!active) return;
    
    // Resetar estado quando o texto mudar
    setVisibleChars(0);
    
    const totalChars = rawTextForCounting.length;

    const startAnimation = () => {
      const interval = setInterval(() => {
        setVisibleChars((prev) => {
          const next = prev + 1;
          if (next >= totalChars) {
            clearInterval(interval);
            onCompleteRef.current?.();
            return totalChars;
          }
          return next;
        });
      }, speed);
      return interval;
    };

    let intervalId: NodeJS.Timeout;
    const delayTimeout = setTimeout(() => {
      intervalId = startAnimation();
    }, delay * 1000);

    return () => {
      clearTimeout(delayTimeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, [normalizedText, rawTextForCounting.length, speed, delay, active]);

  // Parser de Revelação: Renderiza a estrutura final e controla opacidade por spans
  const renderStructuredContent = () => {
    // Regex para identificar **negrito** e ==destaque==
    const parts = normalizedText.split(/(\*\*.*?\*\*|==.*?==)/g);
    let charPointer = 0;

    return parts.map((part, pIdx) => {
      const isBold = part.startsWith("**") && part.endsWith("**");
      const isHighlight = part.startsWith("==") && part.endsWith("==");
      
      const content = isBold 
        ? part.slice(2, -2) 
        : isHighlight 
          ? part.slice(2, -2) 
          : part;

      const spanClass = isBold 
        ? "font-bold text-[var(--accent-start)]" 
        : isHighlight 
          ? "font-semibold text-[var(--accent-end)]" 
          : "";

      return (
        <span key={pIdx} className={spanClass}>
          {content.split("").map((char, cIdx) => {
            const isVisible = charPointer < visibleChars;
            charPointer++; // Incrementar apenas para caracteres visíveis na string final (sem estrelas)
            
            return (
              <span 
                key={cIdx} 
                className={`transition-opacity duration-200 ${isVisible ? "opacity-100" : "opacity-0"}`}
                style={{ transitionDelay: `${(cIdx % 5) * 10}ms` }} // Micro-suavização sub-caractere
              >
                {char}
              </span>
            );
          })}
        </span>
      );
    });
  };

  const Tag = variant === "h2" ? "h2" : variant === "h3" ? "h3" : "p";
  const variantClasses = {
    h2: "text-[26px] md:text-[32px] font-medium tracking-tighter text-[var(--accent-start)] leading-[1.1]",
    h3: "text-lg font-semibold text-[var(--text-primary)] mt-6 mb-2 tracking-tight",
    p: "text-[15px] text-[var(--text-secondary)] leading-relaxed",
    "p-muted": "text-[13px] text-[var(--text-muted)] italic leading-relaxed pl-1 border-l border-white/5"
  };

  return (
    <Tag className={`${variantClasses[variant]} ${className} whitespace-pre-wrap`}>
      {renderStructuredContent()}
    </Tag>
  );
}
