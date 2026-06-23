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
  const rawTextForCounting = normalizedText
    .replace(/\*\*/g, "")
    .replace(/==/g, "")
    .replace(/\[done\]/g, " ")
    .replace(/\[current\]/g, " "); // Remove marcadores da contagem real

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

  // Ícone inline: check de conclusão (verde esmeralda)
  const DoneIcon = () => (
    <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-emerald-500/15 mr-1.5 align-middle">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );

  // Ícone inline: etapa atual (dot azul pulsante suave)
  const CurrentIcon = () => (
    <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-blue-500/15 mr-1.5 align-middle">
      <span className="w-[8px] h-[8px] rounded-full bg-blue-500 animate-pulse" />
    </span>
  );

  // Parser de Revelação: Renderiza a estrutura final e controla opacidade por spans
  const renderStructuredContent = () => {
    // Regex para identificar **negrito**, ==destaque== e [done]/[current]
    const parts = normalizedText.split(/(\*\*.*?\*\*|==.*?==|\[done\]|\[current\])/g);
    let charPointer = 0;

    return parts.map((part, pIdx) => {
      // Renderizar ícones inline para marcadores de status
      if (part === "[done]") {
        charPointer++; // Conta como 1 char para animação
        const isVisible = charPointer <= visibleChars;
        return (
          <span key={pIdx} className={`transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}>
            <DoneIcon />
          </span>
        );
      }
      if (part === "[current]") {
        charPointer++;
        const isVisible = charPointer <= visibleChars;
        return (
          <span key={pIdx} className={`transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}>
            <CurrentIcon />
          </span>
        );
      }

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
            charPointer++;
            
            return (
              <span 
                key={cIdx} 
                className={`transition-opacity duration-200 ${isVisible ? "opacity-100" : "opacity-0"}`}
                style={{ transitionDelay: `${(cIdx % 5) * 10}ms` }}
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
