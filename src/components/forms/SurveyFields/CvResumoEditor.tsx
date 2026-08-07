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
  const respostaSalva = typeof value === "string" && value.length > 0 ? value : "";
  const preenchimentoMestre = String(masterCvData?.resumo_profissional || "");

  // `rascunho` guarda apenas o que o usuario digitou nesta sessao. Enquanto for
  // `null`, o campo e' DERIVADO das props: resposta salva tem prioridade, senao
  // cai no curriculo mestre. Derivar em vez de copiar para o estado dentro de um
  // efeito e' o que evita render em cascata — e, principalmente, garante que o
  // campo apareca preenchido assim que `masterCvData` chegar, sem depender de uma
  // segunda passada.
  const [rascunho, setRascunho] = useState<string | null>(null);
  const text = rascunho ?? (respostaSalva || preenchimentoMestre);

  const handleTextChange = (newVal: string) => {
    setRascunho(newVal);
    onChange(newVal);
  };

  // O efeito permanece apenas para PROPAGAR o preenchimento ao motor de
  // formularios: sem isto o texto apareceria na tela mas nao seria gravado como
  // resposta. Nao escreve estado local, so notifica o pai.
  useEffect(() => {
    if (masterCvData && !respostaSalva) {
      onChange(String(masterCvData.resumo_profissional || ""));
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
