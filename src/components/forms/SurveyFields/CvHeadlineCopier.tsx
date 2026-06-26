"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CvHeadlineCopierProps {
  cvFocadoData: any;
  masterCvData: any;
}

export function CvHeadlineCopier({ cvFocadoData, masterCvData }: CvHeadlineCopierProps) {
  const [copied, setCopied] = useState(false);

  const cargo = cvFocadoData?.pdi_posicao_target || "Posicao Target";
  const skill1 = masterCvData?.hard_skills?.[0] || "";
  const skill2 = masterCvData?.metodologias?.[0] || masterCvData?.hard_skills?.[1] || "";

  const parts = [cargo, skill1, skill2].filter(Boolean);
  const headline = parts.join(" | ");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(headline);
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
        
        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-start)] ml-1 block mb-2">
          Sua Headline Recomendada
        </label>
        
        <div className="flex items-center justify-between gap-4 bg-white/5 border border-white/5 rounded-xl p-4 min-h-[60px]">
          <p className="text-sm font-medium text-[var(--text-primary)] leading-relaxed select-all">
            {headline}
          </p>
          
          <button
            type="button"
            onClick={handleCopy}
            className="flex-shrink-0 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[var(--text-primary)] transition-all active:scale-95 flex items-center justify-center gap-1.5 text-xs font-semibold"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-400 animate-scale-up" />
                <span className="text-green-400">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>
        
        <p className="text-[10px] text-[var(--text-muted)] mt-2.5 px-1 leading-relaxed">
          Esta combinacao usa a sua posicao target do CV Focado e as suas principais competencias do Master CV.
        </p>
      </div>
    </div>
  );
}
