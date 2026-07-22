"use client";

import React, { useState } from "react";
import { runWelcomeMigration, WelcomeMigrationResults } from "@/actions/migration-welcome";
import { Play, Loader2, CheckCircle2, AlertCircle, UserPlus } from "lucide-react";
import { getErrorMessage } from "@/lib/utils/errors";
import { FunctionalPageHeader } from "@/components/layout/FunctionalPageHeader";

export default function MigrateWelcomePage() {
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [results, setResults] = useState<WelcomeMigrationResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    if (!confirm("Tem certeza que deseja rodar a migração? Isso atualizará os dados de onboarding de todos os usuários.")) return;

    setStatus("running");
    try {
      const res = await runWelcomeMigration();
      setResults(res.results);
      setStatus("success");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setStatus("error");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <FunctionalPageHeader
        eyebrow="Sistema e Ferramentas"
        title="Migrar"
        titleAccent="Onboarding"
        icon={<UserPlus size={24} />}
      />

      <p className="text-[var(--text-muted)] text-[11px] font-medium opacity-70 -mt-4">
        Atualização do formato legado de onboarding para o padrão institucional.
      </p>

      <div className="p-10 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[2.5rem] max-w-xl w-full mx-auto space-y-8">

        {status === "idle" && (
          <div className="text-center space-y-8">
            <div className="p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
              <p className="text-xs text-yellow-500 font-bold leading-relaxed">
                ATENÇÃO: este processo lê todos os usuários e cria os registros de onboarding
                conforme o novo padrão institucional.
              </p>
            </div>
            <button
              onClick={handleStart}
              className="px-12 py-5 bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold text-[10px] tracking-widest uppercase hover:translate-y-[-2px] transition-all flex items-center gap-4 mx-auto rounded-full shadow-xl"
            >
              Iniciar Migração <Play size={16} />
            </button>
          </div>
        )}

        {status === "running" && (
          <div className="text-center space-y-8 py-12">
            <Loader2 size={48} className="animate-spin text-[var(--accent-start)] mx-auto" />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">Processando Usuários...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-8">
            <div className="flex items-center gap-4 p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500">
              <CheckCircle2 size={24} />
              <span className="text-sm font-bold">Migração Concluída com Sucesso!</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
               {[
                 { label: "Total", val: results?.total ?? 0 },
                 { label: "Migrados", val: results?.migrated ?? 0 },
                 { label: "Pulados", val: results?.skipped ?? 0 },
                 { label: "Erros", val: results?.errors ?? 0 },
               ].map(item => (
                 <div key={item.label} className="p-4 bg-[var(--bg-primary)]/50 border border-[var(--border-primary)] rounded-2xl text-center">
                    <div className="text-[9px] text-[var(--text-muted)] mb-1 font-bold uppercase tracking-widest">{item.label}</div>
                    <div className="text-2xl font-bold text-[var(--text-primary)]">{item.val}</div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="text-center space-y-8">
            <div className="flex items-center gap-4 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500">
              <AlertCircle size={24} />
              <div className="text-left">
                <span className="text-sm font-bold block">Erro na Migração</span>
                <span className="text-xs opacity-80">{error}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
