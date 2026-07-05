"use client";

import React from "react";
import GlassModal from "@/components/ui/GlassModal";
import { Lock, Sparkles, ArrowRightCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SequenceLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  prevStageTitle: string;
  type?: "etapa" | "parada";
}

/**
 * SequenceLockModal — BPlen HUB
 * Modal de bloqueio de sequencia linear. Padronizado sobre o GlassModal canonico
 * (portal, backdrop, z-index e scroll unificados); conteudo especifico como children.
 */
// Nota: comentarios em ASCII; textos de interface preservam a acentuacao PT-BR.
export function SequenceLockModal({ isOpen, onClose, prevStageTitle, type = "etapa" }: SequenceLockModalProps) {
  return (
    <GlassModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-[440px]">
      <div className="flex flex-col items-center text-center space-y-8">
        {/* Badge de Destaque */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
          <Sparkles size={12} className="text-amber-500 animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">
            Soberania Metodológica
          </span>
        </div>

        {/* Icone de Cadeado */}
        <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/20">
          <Lock size={40} className="text-white" />
        </div>

        {/* Mensagem */}
        <div className="space-y-4">
          <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight leading-tight">
            {type === "etapa" ? "Aguardando Conclusão" : "Aguardando Parada"} <br /> {type === "etapa" ? "da Etapa Anterior" : "Anterior"}
          </h3>
          <p className="text-[13px] leading-relaxed text-[var(--text-secondary)] font-medium">
            Para garantir a eficácia do seu progresso, a {type} <span className="text-amber-500 font-black">{prevStageTitle}</span> precisa ser concluída 100% antes de liberar este novo ciclo.
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={onClose}
          className={cn(
            "w-full py-5 rounded-[2rem] bg-[var(--text-primary)] text-[var(--bg-primary)] flex items-center justify-center gap-3",
            "font-black text-[11px] uppercase tracking-[0.25em]",
            "hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-500"
          )}
        >
          Compreendido
          <ArrowRightCircle size={16} />
        </button>

        <div className="space-y-1">
          <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60">
            Sua evolução é linear e focada
          </p>
          <p className="text-[9px] font-medium text-amber-500/70 uppercase tracking-widest italic">
            &quot;Alavanque a sua carreira&quot;
          </p>
        </div>
      </div>
    </GlassModal>
  );
}
