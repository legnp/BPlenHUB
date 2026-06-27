"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";

interface CvVagaDescriptionButtonProps {
  descricaoVaga?: string;
}

export function CvVagaDescriptionButton({ descricaoVaga }: CvVagaDescriptionButtonProps) {
  const [showDesc, setShowDesc] = useState(false);

  if (!descricaoVaga) return null;

  return (
    <div className="w-full bg-[var(--input-bg)]/80 border border-[var(--border-primary)] rounded-2xl overflow-hidden backdrop-blur-md shadow-sm">
      <button
        type="button"
        onClick={() => setShowDesc(!showDesc)}
        className="w-full flex items-center justify-between px-6 py-4 text-xs font-black uppercase tracking-widest text-[var(--text-primary)]/80 hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[var(--accent-start)]" />
          <span>Consultar descricao da vaga</span>
        </div>
        {showDesc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {showDesc && (
        <div className="px-6 pb-6 pt-2 border-t border-[var(--border-primary)]/30 animate-fade-in">
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap select-text">
            {descricaoVaga}
          </p>
        </div>
      )}
    </div>
  );
}
