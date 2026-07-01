"use client";

import React, { useState } from "react";
import { Download, FileText, Check } from "lucide-react";
import type { SurveyValue } from "@/types/survey";

interface CvDownloadButtonProps {
  masterCvData: Record<string, SurveyValue> | null | undefined;
  userNickname: string;
}

export function CvDownloadButton({ masterCvData, userNickname }: CvDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);

  const handleDownload = async () => {
    if (!masterCvData) {
      alert("Nao foi possivel carregar os dados do seu Master CV. Certifique-se de ter preenchido o modulo anterior.");
      return;
    }
    setDownloading(true);
    try {
      const { generateMasterCvDocx } = await import("@/lib/docx-generator");
      await generateMasterCvDocx(masterCvData, userNickname || "Membro");
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch (err) {
      console.error("Erro ao baixar Master CV:", err);
      alert("Houve um erro ao gerar o documento do seu Master CV. Tente novamente.");
    } finally {
      setDownloading(false);
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
            <h4 className="text-sm font-bold text-[var(--text-primary)]">
              Seu Master CV esta pronto!
            </h4>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Use o arquivo Word do seu Master CV para copiar as conquistas e estruturar suas respostas STAR-LA na caixa abaixo.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex-shrink-0 px-5 py-3 rounded-xl bg-[var(--accent-start)] hover:bg-[var(--accent-end)] text-white font-semibold transition-all active:scale-95 flex items-center gap-2 text-xs disabled:opacity-50 disabled:pointer-events-none shadow-sm"
          >
            {done ? (
              <>
                <Check className="w-4 h-4" />
                <span>Pronto!</span>
              </>
            ) : downloading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Baixando...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Baixar Master CV (.docx)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
