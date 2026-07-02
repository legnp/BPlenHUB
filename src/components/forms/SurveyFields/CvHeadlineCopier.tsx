"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import type { SurveyValue } from "@/types/survey";

interface CvHeadlineCopierProps {
  cvFocadoData: Record<string, SurveyValue> | null | undefined;
  masterCvData: Record<string, SurveyValue> | null | undefined;
}

export function CvHeadlineCopier({ cvFocadoData, masterCvData }: CvHeadlineCopierProps) {
  const [copied, setCopied] = useState(false);

  const hardSkills = masterCvData?.hard_skills;
  const metodologias = masterCvData?.metodologias;
  const cargo = String(cvFocadoData?.pdi_posicao_target || "Posicao Target");
  const skill1 = String((Array.isArray(hardSkills) ? hardSkills[0] : "") || "");
  const skill2 = String((Array.isArray(metodologias) ? metodologias[0] : "") || (Array.isArray(hardSkills) ? hardSkills[1] : "") || "");

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
      <div className="bg-[var(--input-bg)]/80 border border-[var(--border-primary)] rounded-2xl p-6 backdrop-blur-md relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl pointer-events-none" />
        
        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-start)] ml-1 block mb-2">
          Sua Headline Recomendada
        </label>
        
        <div className="flex items-center justify-between gap-4 bg-white/40 border border-[var(--input-border)]/50 rounded-xl p-4 min-h-[60px]">
          <p className="text-sm font-medium text-[var(--text-primary)] leading-relaxed select-all">
            {headline}
          </p>
          
          <button
            type="button"
            onClick={handleCopy}
            className="flex-shrink-0 p-2.5 rounded-lg bg-[var(--input-bg)] hover:bg-[var(--accent-soft)] border border-[var(--input-border)] text-[var(--text-primary)] transition-all active:scale-95 flex items-center justify-center gap-1.5 text-xs font-semibold"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-500 animate-scale-up" />
                <span className="text-green-500">Copiado!</span>
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
