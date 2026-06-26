"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CvResumoCopierProps {
  cvFocadoData: any;
}

export function CvResumoCopier({ cvFocadoData }: CvResumoCopierProps) {
  const [copied, setCopied] = useState(false);

  const resumo = cvFocadoData?.resumo_focado || "Nenhum resumo encontrado no CV Focado.";

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
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl pointer-events-none" />

        <div className="flex justify-between items-center mb-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-start)] ml-1">
            Seu Resumo Profissional Focado
          </label>
          
          <button
            type="button"
            onClick={handleCopy}
            className="flex-shrink-0 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[var(--text-primary)] transition-all active:scale-95 flex items-center justify-center gap-1.5 text-xs font-semibold"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-400 animate-scale-up" />
                <span className="text-green-400">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Resumo</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-white/5 border border-white/5 rounded-xl p-4 min-h-[100px] leading-relaxed text-sm text-[var(--text-primary)] whitespace-pre-wrap select-all">
          {resumo}
        </div>
      </div>
    </div>
  );
}
