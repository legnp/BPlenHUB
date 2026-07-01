"use client";

import React, { useEffect, useState } from "react";
import { TextareaGlass } from "@/components/ui/TextareaGlass";
import type { SurveyValue } from "@/types/survey";

interface CvResumoEditorProps {
  value: SurveyValue;
  masterCvData: Record<string, SurveyValue> | null | undefined;
  onChange: (val: string) => void;
}

export function CvResumoEditor({ value, masterCvData, onChange }: CvResumoEditorProps) {
  const [text, setText] = useState<string>(() => {
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
    return String(masterCvData?.resumo_profissional || "");
  });

  const handleTextChange = (newVal: string) => {
    setText(newVal);
    onChange(newVal);
  };

  useEffect(() => {
    if (masterCvData && (!value || (typeof value === "string" && value.length === 0))) {
      const initial = String(masterCvData.resumo_profissional || "");
      setText(initial);
      onChange(initial);
    }
  }, [masterCvData]);

  return (
    <div className="w-full animate-fade-in space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-start)] ml-1 block mb-2">
          Resumo Profissional Focado
        </label>
        <TextareaGlass
          placeholder="Reduza seu resumo profissional para 3 ou 4 linhas focando no seu objetivo..."
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          className="min-h-[160px] text-sm leading-relaxed"
        />
        <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] px-1 mt-2">
          <span>Revise o texto acima e faça as alterações desejadas.</span>
          <span>Caracteres: {text.length}</span>
        </div>
      </div>
    </div>
  );
}
