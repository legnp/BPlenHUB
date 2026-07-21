import React from "react";
import { Metadata } from "next";
import {
  Search,
  Eye,
  Settings,
  CheckCircle2,
  BarChart3,
  Activity
} from "lucide-react";
import { getAdminFormsAnalytics } from "@/actions/admin-forms";
import { FSTabs } from "@/components/admin/FSTabs";
import { FunctionalPageHeader } from "@/components/layout/FunctionalPageHeader";
import { StatTile } from "@/components/admin/StatTile";

export const metadata: Metadata = {
  title: "Gestão de Formulários",
  description: "Administração de fluxos operacionais e coleta de dados.",
};

export default async function FormsManagementPage() {
  const { forms, stats, error } = await getAdminFormsAnalytics();

  return (
    <div className="space-y-10 animate-fade-in-up">
      <FSTabs />

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
          <Activity size={18} className="shrink-0" />
          <div className="text-left">
            <p className="text-sm font-bold">Não foi possível carregar as estatísticas.</p>
            <p className="text-[11px] opacity-80">Os números abaixo não refletem a base — tente recarregar. ({error})</p>
          </div>
        </div>
      )}
      
      <FunctionalPageHeader
        eyebrow="Instrumentos e Devolutivas"
        title="Formulários"
        titleAccent="Operacionais"
        icon={<CheckCircle2 size={24} />}
        action={
          <button className="flex items-center gap-2 px-6 py-3 bg-[var(--input-bg)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-full font-bold text-sm hover:border-[var(--accent-start)]/50 transition-all">
            <Settings size={18} />
            Configurações
          </button>
        }
      />

      <p className="text-[var(--text-muted)] text-[11px] font-medium opacity-70 -mt-4">
        Gerenciamento de formulários para fluxos, triagem e CRM.
      </p>

      {/* Metricas rapidas (dados reais) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatTile
          icon={<BarChart3 size={20} />}
          label="Respostas Globais"
          value={stats.totalGlobalResponses.toLocaleString()}
          detail="Consolidado"
          tone="accent"
        />
        <StatTile
          icon={<Activity size={20} />}
          label="Atividade 24h"
          value={`+${stats.responsesLast24h}`}
          detail="Novas submissões"
          tone="accent"
        />
        <StatTile
          icon={<CheckCircle2 size={20} />}
          label="Formulários Ativos"
          value={stats.activeFormsCount}
          detail="Total ativo"
          tone="success"
        />
      </div>

      {/* Main List Table (Dados Agregados) */}
      <div className="rounded-[2.5rem] bg-[var(--input-bg)] border border-[var(--border-primary)] overflow-hidden shadow-2xl">
        
        {/* Table Filters Header */}
        <div className="p-6 border-b border-[var(--border-primary)] flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="relative w-full md:max-w-xs group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Filtrar formulários..." 
                className="w-full bg-[var(--bg-primary)]/50 border border-[var(--input-border)] rounded-xl py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-start)]/50 transition-all font-medium placeholder:text-[var(--text-muted)] placeholder:opacity-40"
              />
           </div>
           <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">
             Gestão de Operações BPlen HUB
           </p>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto text-left">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border-primary)]">
                <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60">Título do Formulário / Contexto</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60">Respostas</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60">Status Real</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60">Última Interação</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60 text-right">Análise</th>
              </tr>
            </thead>
            <tbody>
              {forms.map((form) => (
                <tr key={form.id} className="border-b border-[var(--border-primary)] hover:bg-[var(--accent-soft)] transition-colors group">
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-start)] transition-colors leading-relaxed">
                        {form.title}
                      </span>
                      <span className="text-[9px] text-[var(--text-muted)] uppercase font-bold tracking-widest mt-1">ID: {form.id}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-[var(--text-primary)]">{form.totalResponses}</span>
                      <div className="w-24 h-1 bg-[var(--bg-primary)] rounded-full overflow-hidden border border-[var(--border-primary)]">
                        <div className="w-full h-full bg-accent-start shadow-[0_0_8px_rgba(255,44,141,0.3)] animate-pulse" />
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-widest border border-green-500/20">
                      <CheckCircle2 size={10} /> {form.status === "active" ? "Ativo" : form.status}
                    </span>
                  </td>
                  <td className="p-6">
                    <span className="text-[11px] text-[var(--text-secondary)] font-medium tabular-nums">
                      {form.lastResponseAt ? new Date(form.lastResponseAt).toLocaleString("pt-BR") : "—"}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                       <a 
                         href={`/admin/fs/forms/preview/${form.id}`}
                         className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-[var(--text-primary)] text-[10px] font-bold rounded-lg hover:border-[var(--accent-start)]/50 transition-all font-mono tracking-widest"
                       >
                         <Eye size={14} className="text-[var(--accent-start)]" /> Prévia
                       </a>
                       <button className="flex items-center gap-2 px-4 py-2 bg-accent-start text-white text-[10px] font-bold rounded-lg hover:opacity-90 transition-all shadow-lg shadow-accent-start/20">
                         <BarChart3 size={14} /> Detalhes
                       </button>
                    </div>
                  </td>
                </tr>
              ))}

              {forms.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-sm text-[var(--text-muted)] font-medium italic">
                    Nenhum formulário operacional registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Admin Table */}
        <div className="p-8 flex justify-between items-center text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest bg-[var(--bg-primary)]/40">
           Exibindo {forms.length} formulários operacionais
           <div className="flex gap-4 font-bold">
              <button disabled className="opacity-30">Página Anterior</button>
              <button disabled className="opacity-30">Próxima Página</button>
           </div>
        </div>
      </div>

    </div>
  );
}
