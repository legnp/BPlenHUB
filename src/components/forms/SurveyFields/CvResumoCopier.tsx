"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import type { SurveyValue } from "@/types/survey";

interface CvResumoCopierProps {
  cvFocadoData: Record<string, SurveyValue> | null | undefined;
}

export function CvResumoCopier({ cvFocadoData }: CvResumoCopierProps) {
  const [copied, setCopied] = useState(false);

  const resumo = String(cvFocadoData?.resumo_focado || "Nenhum resumo encontrado no CV Focado.");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resumo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erro ao copiar texto:", err);
    }
  };

  return (
    <div className="w-full animate-fade-in space-y-4">
      <div className="bg-[var(--input-bg)]/80 border border-[var(--border-primary)] rounded-2xl p-6 backdrop-blur-md relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl pointer-events-none" />

        <div className="flex justify-between items-center mb-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-start)] ml-1">
            Seu Resumo Profissional Focado
          </label>
          
          <button
            type="button"
            onClick={handleCopy}
            className="flex-shrink-0 p-2 rounded-lg bg-[var(--input-bg)] hover:bg-[var(--accent-soft)] border border-[var(--input-border)] text-[var(--text-primary)] transition-all active:scale-95 flex items-center justify-center gap-1.5 text-xs font-semibold"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-500 animate-scale-up" />
                <span className="text-green-500">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Resumo</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-white/40 border border-[var(--input-border)]/50 rounded-xl p-4 min-h-[100px] leading-relaxed text-sm text-[var(--text-primary)] whitespace-pre-wrap select-all">
          {resumo}
        </div>
      </div>
    </div>
  );
}
