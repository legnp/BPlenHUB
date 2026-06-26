"use client";

import React from "react";
import { CheckCircle2, FileText, Settings, ShieldCheck } from "lucide-react";

interface CvConclusaoInfoProps {
  senioridadePretendida: string;
}

export function CvConclusaoInfo({ senioridadePretendida }: CvConclusaoInfoProps) {
  const isJrPleno = senioridadePretendida === "Júnior" || senioridadePretendida === "Pleno";

  return (
    <div className="w-full animate-fade-in space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-5">
        <h3 className="text-xs font-black uppercase tracking-widest text-[var(--accent-start)]">
          Checklist de Revisão Final
        </h3>

        <div className="space-y-4">
          {/* Item 1: Limite de Páginas */}
          <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
            <FileText className="w-5 h-5 text-[var(--accent-start)] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                Tamanho Limite do Currículo
              </h4>
              <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                Como seu foco é uma posição <strong>{senioridadePretendida || "Pretendida"}</strong>, certifique-se de que o documento final não ultrapasse{" "}
                <strong>{isJrPleno ? "1 página" : "2 páginas"}</strong>.
              </p>
            </div>
          </div>

          {/* Item 2: Foco em Proposta de Solução */}
          <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
            <Settings className="w-5 h-5 text-[var(--accent-start)] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                Foco no Próximo Objetivo
              </h4>
              <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                Seu currículo deixou de ser um documento geral sobre o seu passado e se tornou uma proposta de solução direta e alinhada com as necessidades da vaga alvo.
              </p>
            </div>
          </div>

          {/* Item 3: Dicas de Plataforma (ATS) */}
          <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
            <ShieldCheck className="w-5 h-5 text-[var(--accent-start)] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                Formatos de Envio (ATS)
              </h4>
              <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                Para plataformas como Gupy ou Workday, salve o documento gerado em PDF baseado em texto. Caso a candidatura seja direta por e-mail ou a plataforma apresente problemas na extração de texto, envie a versão <strong>.DOCX (Word)</strong> limpa que vamos gerar agora.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
