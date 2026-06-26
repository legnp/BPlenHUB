"use client";

import React, { useState } from "react";
import { FileText, Download, Check, HelpCircle } from "lucide-react";

interface CvFocadoExporterProps {
  cvFocadoData: any;
  userNickname: string;
  options?: string[];
  label?: string;
  description?: string;
}

export function CvFocadoExporter({
  cvFocadoData,
  userNickname,
  options = [],
  label,
  description
}: CvFocadoExporterProps) {
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const isPdf = options.includes("pdf");

  const handleExport = async () => {
    if (!cvFocadoData) {
      alert("Dados do CV Focado nao encontrados. Por favor, certifique-se de preencher o CV Focado antes.");
      return;
    }
    setGenerating(true);
    try {
      const { generateCvFocadoDocx } = await import("@/lib/docx-generator");
      await generateCvFocadoDocx(cvFocadoData, userNickname || "Profissional");
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      console.error("Erro ao exportar CV:", err);
      alert("Nao foi possivel gerar o documento. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="w-full animate-fade-in space-y-4">
      <div className="bg-[var(--input-bg)]/80 border border-[var(--border-primary)] rounded-2xl p-6 backdrop-blur-md relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-4">
          <div className="p-3 bg-[var(--accent-soft)] border border-[var(--accent-start)]/20 rounded-xl text-[var(--accent-start)]">
            <FileText className="w-6 h-6" />
          </div>
          
          <div className="flex-1 space-y-1">
            {label && (
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                {label}
              </h4>
            )}
            {description && (
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white/40 border border-[var(--input-border)]/50 p-4 rounded-xl">
          <div className="text-xs text-[var(--text-muted)] flex items-start gap-1.5 max-w-[280px]">
            <HelpCircle className="w-4 h-4 text-[var(--accent-start)] flex-shrink-0 mt-0.5" />
            <span>
              {isPdf
                ? "Gere o arquivo Word (.docx) e use a funcao 'Salvar como PDF' em seu editor para obter um arquivo PDF com texto limpo para ATS."
                : "Gere a versao Word (.docx) limpa e sem colunas duplas, ideal para envio direto em sistemas ATS complexos."}
            </span>
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={generating}
            className="flex-shrink-0 bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)] hover:opacity-90 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-accent-start/15"
          >
            {generating ? (
              <span>Gerando...</span>
            ) : done ? (
              <>
                <Check className="w-4 h-4" />
                <span>Pronto!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{isPdf ? "Baixar CV Focado (.docx)" : "Baixar CV Focado (.docx)"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
