"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Classes de tema do design system (espelham o ThemeContext, exceto "light" que é o
 * default do :root). O modal portaliza para document.body e por isso escapa do escopo
 * de tema da pagina (nas paginas publicas o `theme-dark` fica no <main>). A detecção
 * abaixo reaplica o tema da tela que chamou o modal.
 */
const THEME_CLASSES = [
  "theme-dark",
  "theme-rosa-pitaya",
  "theme-lavanda-azulado",
  "theme-amarelo-sol",
  "theme-cinza-nublado",
  "theme-daltonico",
] as const;
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  maxWidth?: string;
  className?: string;
  /**
   * Classe do backdrop (overlay). Default = backdrop claro unificado (F0-01), correto
   * nos temas logados claros. Páginas públicas ESCURAS devem passar um backdrop escuro
   * (ex.: "bg-black/60 backdrop-blur-[8px]") para não gerar o overlay branco (BUG-050).
   */
  backdropClassName?: string;
}

/**
 * BPlen HUB — Componente de Modal Cristal (Glassmorphism Premium)
 * Padroniza o visual de popups com 2% de opacidade e 40px de blur.
 */
export default function GlassModal({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  maxWidth = "max-w-md",
  className = "",
  backdropClassName = "bg-[var(--modal-backdrop)] backdrop-blur-[8px]",
}: GlassModalProps) {

  const [mounted, setMounted] = useState(false);
  // Ancora invisivel renderizada NO LUGAR (dentro do escopo de tema da pagina), usada
  // para detectar qual tema aplicar ao portal (que renderiza em document.body).
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [themeClass, setThemeClass] = useState<string | null>(null);

  // Client-side hydration check for Portal
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Detecta o tema da tela que chamou o modal, subindo a arvore a partir da ancora e
  // PARANDO ANTES do <body> — o ThemeContext grava o tema do usuario no body mesmo em
  // paginas publicas, entao o body carrega um tema "stale"; o tema correto e o do
  // <main>/wrapper da area (theme-dark publico, ou o wrapper de tema do hub/admin).
  // Sem ancestral tematico (ex.: /conteudo, pagina clara) -> null -> :root (claro).
  const detectThemeClass = useCallback((): string | null => {
    let el: HTMLElement | null = anchorRef.current?.parentElement ?? null;
    while (el && el !== document.body) {
      for (const c of THEME_CLASSES) {
        if (el.classList.contains(c)) return c;
      }
      el = el.parentElement;
    }
    return null;
  }, []);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThemeClass(detectThemeClass());
    }
  }, [isOpen, detectThemeClass]);

  // Fechar ao pressionar ESC e Gerenciar Classe Global do Body
  useEffect(() => {
    // Esc handler
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      document.body.classList.add("glass-modal-open");
    } else {
      document.body.classList.remove("glass-modal-open");
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.classList.remove("glass-modal-open");
    };
  }, [isOpen, onClose]);

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-overlay flex items-start justify-center p-4 overflow-y-auto custom-scrollbar">
          {/* Sombra imersiva sutil atrás do modal */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 ${backdropClassName}`}
            onClick={onClose}
          />

          {/* Wrapper de Animação (Invisível) */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={`relative w-full my-auto ${maxWidth} ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Vidro Estático Nativo Tailwind (Sem backdrop-blur, agora que a página recua) */}
            <div className="w-full h-full bg-[var(--glass-bg)] border border-[var(--glass-border)] shadow-2xl rounded-[40px] p-8 backdrop-blur-2xl">
              {/* Header do Modal */}
              {(title || subtitle) && (
                <div className="flex justify-between items-start mb-6 text-left">
                  <div className="text-left">
                    {title && <h3 className="text-xl font-black text-[var(--text-primary)] leading-tight">{title}</h3>}
                    {subtitle && (
                      <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mt-1">
                        {subtitle}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-3 hover:bg-[var(--accent-soft)] rounded-2xl transition-all group"
                    aria-label="Fechar"
                  >
                    <X className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
                  </button>
                </div>
              )}

              {/* Conteúdo Dinâmico */}
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Ancora invisivel no escopo de tema da pagina (fonte da detecção acima). */}
      <span ref={anchorRef} aria-hidden="true" className="hidden" />
      {mounted
        ? createPortal(
            <div className={themeClass ?? undefined}>{modalContent}</div>,
            document.body
          )
        : null}
    </>
  );
}
