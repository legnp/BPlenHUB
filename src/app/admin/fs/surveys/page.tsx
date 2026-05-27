import React from "react";
import { Metadata } from "next";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  BarChart3, 
  Eye, 
  Settings, 
  CheckCircle2, 
  Filter,
  Users,
  Activity
} from "lucide-react";
import { getAdminSurveysAnalytics } from "@/actions/admin-surveys";
import { FSTabs } from "@/components/admin/FSTabs";

export const metadata: Metadata = {
  title: "Gestão de Pesquisas",
  description: "Administração de pesquisas interativas e enquetes do HUB.",
};

export default async function AdminSurveysPage() {
  const { surveys, stats } = await getAdminSurveysAnalytics();

  return (
    <div className="space-y-10 animate-fade-in-up">
      <FSTabs />
      
      {/* Header Admin */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            SURVEYS <span className="text-[var(--accent-start)] italic ml-1">e Inteligência</span>
          </h1>
          <p className="text-[var(--text-muted)] text-[11px] font-medium opacity-70">
            Gerenciamento de surveys para pesquisas e análises.
          </p>
        </div>

        <button className="flex items-center gap-2 px-6 py-3 bg-[var(--input-bg)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-2xl font-bold text-sm hover:border-[var(--accent-start)]/50 transition-all">
          <Settings size={18} />
          Configurar Registry
        </button>
      </div>

      {/* Stats Quick View (Dados Reais) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-[var(--input-bg)] border border-[var(--border-primary)] space-y-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <BarChart3 size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Respostas Globais</span>
          </div>
          <div className="text-4xl font-bold text-[var(--text-primary)] text-left">
            {stats.totalGlobalResponses.toLocaleString()}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest text-left">
            Consolidado via CollectionGroup
          </p>
        </div>
        <div className="p-6 rounded-3xl bg-[var(--input-bg)] border border-[var(--border-primary)] space-y-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <Activity size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Atividade 24h</span>
          </div>
          <div className="text-4xl font-bold text-[var(--accent-start)] text-left">
            +{stats.responsesLast24h}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest text-left">Novas submissões</p>
        </div>
        <div className="p-6 rounded-3xl bg-[var(--input-bg)] border border-[var(--border-primary)] space-y-4 shadow-sm hover:shadow-md transition-all border-l-4 border-l-[var(--accent-start)]">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <CheckCircle2 size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Surveys Ativas</span>
          </div>
          <div className="text-4xl font-bold text-[var(--text-primary)] text-left">{stats.activeSurveysCount}</div>
          <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest text-left">Registradas em SURVEY_REGISTRY</p>
        </div>
      </div>

      {/* Main List Table (Dados Agregados) */}
      <div className="rounded-[2.5rem] bg-[var(--input-bg)] border border-[var(--border-primary)] overflow-hidden shadow-2xl">
        
        {/* Table Filters Header */}
        <div className="p-6 border-b border-[var(--border-primary)] flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="relative w-full md:max-w-xs group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Filtrar registry..." 
                className="w-full bg-[var(--bg-primary)]/50 border border-[var(--input-border)] rounded-xl py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-start)]/50 transition-all font-medium placeholder:text-[var(--text-muted)] placeholder:opacity-40"
              />
           </div>
           <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">
             Visão Analítica Real (Não-CRUD)
           </p>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto text-left">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border-primary)]">
                <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60">Título da Survey / Contexto</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60">Respostas</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60">Status Real</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60">Última Interação</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60 text-right">Análise</th>
              </tr>
            </thead>
            <tbody>
              {surveys.map((survey) => (
                <tr key={survey.id} className="border-b border-[var(--border-primary)] hover:bg-[var(--accent-soft)] transition-colors group">
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-start)] transition-colors leading-relaxed">
                        {survey.title}
                      </span>
                      <span className="text-[9px] text-[var(--text-muted)] uppercase font-bold tracking-widest mt-1">ID: {survey.id}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-[var(--text-primary)]">{survey.totalResponses}</span>
                      <div className="w-24 h-1 bg-[var(--bg-primary)] rounded-full overflow-hidden border border-[var(--border-primary)]">
                        <div className="w-full h-full bg-accent-start shadow-[0_0_8px_rgba(255,44,141,0.3)] animate-pulse" />
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-widest border border-green-500/20">
                      <CheckCircle2 size={10} /> Ativa
                    </span>
                  </td>
                  <td className="p-6">
                    <span className="text-[11px] text-[var(--text-secondary)] font-medium tabular-nums">
                      {survey.lastResponseAt ? new Date(survey.lastResponseAt).toLocaleString("pt-BR") : "—"}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                       <a 
                         href={`/admin/fs/surveys/preview/${survey.id}`}
                         className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-[var(--text-primary)] text-[10px] font-bold rounded-lg hover:border-[var(--accent-start)]/50 transition-all font-mono tracking-widest"
                       >
                         <Eye size={14} className="text-[var(--accent-start)]" /> PREVIEW
                       </a>
                       <button className="flex items-center gap-2 px-4 py-2 bg-accent-start text-white text-[10px] font-bold rounded-lg hover:opacity-90 transition-all shadow-lg shadow-accent-start/20">
                         <BarChart3 size={14} /> Detalhes
                       </button>
                    </div>
                  </td>
                </tr>
              ))}

              {surveys.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-sm text-[var(--text-muted)] font-medium italic">
                    Nenhuma pesquisa encontrada no registro institucional.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Admin Table */}
        <div className="p-8 flex justify-between items-center text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest bg-[var(--bg-primary)]/40">
           Exibindo {surveys.length} surveys institucionais
           <div className="flex gap-4">
              <button disabled className="opacity-30">Página Anterior</button>
              <button disabled className="opacity-30">Próxima Página</button>
           </div>
        </div>
      </div>

    </div>
  );
}
