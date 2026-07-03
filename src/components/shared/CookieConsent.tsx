"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, Check, ShieldCheck } from "lucide-react";

/**
 * BPlen HUB — Cookie Consent Banner (LGPD) 🍪🛡️
 * Design premium com glassmorphism, animações fluidas e ativação condicional.
 */

const CONSENT_KEY = "bplen_cookie_consent";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Verificar se o usuário já deu consentimento
    const consent = localStorage.getItem(CONSENT_KEY);
    
    if (!consent) {
      // 2. Pequeno delay para não assustar o usuário e garantir o design first
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(CONSENT_KEY, "all");
    setIsVisible(false);
    // Disparar evento para o GoogleAnalyticsLoader "acordar"
    window.dispatchEvent(new Event("bplen_consent_updated"));
  };

  const handleAcceptEssential = () => {
    localStorage.setItem(CONSENT_KEY, "essential");
    setIsVisible(false);
    window.dispatchEvent(new Event("bplen_consent_updated"));
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-md z-toast"
        >
          <div className="bg-[var(--bg-primary)]/80 backdrop-blur-2xl border border-[var(--border-primary)] shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden group">
            
            {/* Decoração sutil de fundo */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--accent-primary)]/5 rounded-full blur-3xl group-hover:bg-[var(--accent-primary)]/10 transition-all duration-700" />
            
            <div className="relative space-y-6">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-[var(--accent-primary)]/10 rounded-2xl text-[var(--accent-primary)]">
                  <ShieldCheck size={24} />
                </div>
                <button 
                  onClick={handleAcceptEssential}
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">
                  Sua privacidade é nossa <span className="text-[var(--accent-primary)]">prioridade</span>.
                </h3>
                <p className="text-[11px] leading-relaxed text-[var(--text-secondary)] font-medium opacity-80">
                  Utilizamos cookies essenciais para garantir que o BPlen HUB funcione com segurança e inteligência. 
                  Ao aceitar, você nos ajuda a entender como o ecossistema está evoluindo através de métricas anônimas.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                >
                  <Check size={14} />
                  Aceitar Tudo
                </button>
                <button
                  onClick={handleAcceptEssential}
                  className="px-6 py-4 bg-transparent border border-[var(--border-primary)] text-[var(--text-primary)] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--text-primary)]/5 transition-all"
                >
                  Apenas Essenciais
                </button>
              </div>

              <p className="text-[9px] text-[var(--text-muted)] text-center font-bold uppercase tracking-tighter opacity-50">
                Respeitamos a LGPD e sua liberdade de escolha.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
