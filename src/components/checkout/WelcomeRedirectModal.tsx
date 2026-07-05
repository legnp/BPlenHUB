"use client";

import React from "react";
import GlassModal from "@/components/ui/GlassModal";
import { Rocket, ArrowRight, Loader2 } from "lucide-react";

interface WelcomeRedirectModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  title?: string;
  description?: string;
  buttonText?: string;
  onConfirm: () => void;
}

/**
 * BPlen HUB — Welcome / Prompt Modal
 * Padronizado sobre o GlassModal canonico (portal, backdrop e z-index unificados).
 * Usado hoje como prompt de login/registro antes da contratacao (ver MatriculaGuard).
 * Dismissivel: o usuario pode fechar; o CTA dispara onConfirm.
 */
export function WelcomeRedirectModal({
  isOpen,
  onClose,
  userName,
  onConfirm,
  title,
  description,
  buttonText = "CONTINUAR",
}: WelcomeRedirectModalProps) {
  return (
    <GlassModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="flex flex-col items-center text-center space-y-10">
        <div className="w-24 h-24 rounded-[3rem] bg-gradient-to-br from-[var(--accent-start)]/20 to-[var(--accent-end)]/10 flex items-center justify-center text-[var(--accent-start)] shadow-[0_20px_40px_rgba(255,0,128,0.2)] border border-[var(--border-primary)]">
          <Rocket size={48} className="animate-pulse" />
        </div>

        <div className="space-y-5">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-none uppercase italic text-[var(--text-primary)]">
            {title || <>Ola, <span className="text-[var(--accent-start)]">{userName}</span></>}
          </h2>
          <p className="text-sm sm:text-base font-medium text-[var(--text-secondary)] leading-relaxed max-w-[350px] mx-auto">
            {description || (
              <>
                Percebemos que voce ainda nao passou pela nossa <span className="text-[var(--text-primary)] font-bold tracking-tight underline decoration-[var(--accent-start)]/30">recepcao oficial</span>.
                Vamos te guiar agora para garantir sua melhor experiencia.
              </>
            )}
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-[var(--input-bg)] border border-[var(--border-primary)] w-full flex items-center gap-5 text-left group">
          <div className="p-4 bg-[var(--input-bg)] rounded-2xl group-hover:scale-110 transition-transform duration-500">
            <ArrowRight size={18} className="text-[var(--accent-start)]" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)] leading-snug">
            Sua intencao de contratacao esta segura e voce retornara automaticamente para este servico.
          </p>
        </div>

        <div className="w-full space-y-4">
          <button
            onClick={onConfirm}
            className="w-full py-6 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-3xl font-black text-xs uppercase tracking-[0.25em] hover:opacity-90 hover:scale-[1.03] active:scale-[0.97] transition-all shadow-lg flex items-center justify-center gap-4 group"
          >
            {buttonText}
            <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-500" />
          </button>
        </div>

        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)] pt-2">
          <Loader2 size={12} className="animate-spin text-[var(--accent-start)]/40" />
          Ambiente Seguro BPlen
        </div>
      </div>
    </GlassModal>
  );
}
