"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import type { SurveyValue } from "@/types/survey";

interface CvKeywordsCopierProps {
  masterCvData: Record<string, SurveyValue> | null | undefined;
}

export function CvKeywordsCopier({ masterCvData }: CvKeywordsCopierProps) {
  const [copied, setCopied] = useState(false);

  const hardSkillsRaw = masterCvData?.hard_skills;
  const metodologiasRaw = masterCvData?.metodologias;
  const hardSkills = Array.isArray(hardSkillsRaw) ? hardSkillsRaw : [];
  const metodologias = Array.isArray(metodologiasRaw) ? metodologiasRaw : [];
  const allKeywords = [...hardSkills, ...metodologias].filter(Boolean).map((kw) => String(kw));

  const keywordsString = allKeywords.join(", ");

  const handleCopy = async () => {
    if (allKeywords.length === 0) return;
    try {
      await navigator.clipboard.writeText(keywordsString);
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
            Suas Palavras-Chave e Competencias
          </label>
          
          {allKeywords.length > 0 && (
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
                  <span>Copiar Todas</span>
                </>
              )}
            </button>
          )}
        </div>

        {allKeywords.length > 0 ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 p-3 bg-white/40 border border-[var(--input-border)]/30 rounded-xl">
              {allKeywords.map((kw, idx) => (
                <span
                  key={`${kw}-${idx}`}
                  className="text-xs px-2.5 py-1 bg-[var(--accent-soft)] border border-[var(--accent-start)]/20 rounded-md text-[var(--accent-start)] font-medium"
                >
                  {kw}
                </span>
              ))}
            </div>
            
            <div className="bg-white/40 border border-[var(--input-border)]/30 rounded-xl p-3 text-xs text-[var(--text-muted)] leading-relaxed select-all">
              <strong>Formato para copiar e colar:</strong> {keywordsString}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-[var(--text-muted)]">
            Nenhuma palavra-chave encontrada no seu Master CV.
          </div>
        )}
      </div>
    </div>
  );
}
