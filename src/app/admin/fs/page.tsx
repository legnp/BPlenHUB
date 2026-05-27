"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, 
  Clock, 
  Users, 
  Activity, 
  CheckCircle2, 
  Search, 
  User, 
  ChevronDown, 
  ExternalLink,
  Loader2,
  FileSpreadsheet,
  TrendingUp,
  FileText
} from "lucide-react";
import { 
  getAdminFSAnalytics, 
  getFSItemDetails, 
  FSRegistrySummary, 
  FSGlobalStats, 
  FSItemDetails, 
  FSRespondent
} from "@/actions/admin-fs";
import { FSTabs } from "@/components/admin/FSTabs";

export default function AdminFSAnalyticsPage() {
  // Estados Globais de Carregamento e Dados
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<FSGlobalStats | null>(null);
  const [items, setItems] = useState<FSRegistrySummary[]>([]);
  
  // Estados do Item Selecionado
  const [selectedItem, setSelectedItem] = useState<FSRegistrySummary | null>(null);
  const [details, setDetails] = useState<FSItemDetails | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Filtro de Respondentes
  const [respondentSearch, setRespondentSearch] = useState("");

  // Carregar dados iniciais (Consolidado e Lista de Itens)
  useEffect(() => {
    async function loadGlobalData() {
      try {
        setLoading(true);
        const res = await getAdminFSAnalytics();
        if (res.success && res.stats && res.items) {
          setStats(res.stats);
          setItems(res.items);
          
          // Selecionar o primeiro item por padrão se houver
          if (res.items.length > 0) {
            setSelectedItem(res.items[0]);
          }
        } else {
          setError(res.error || "Não foi possível carregar as informações estatísticas.");
        }
      } catch (err) {
        console.error(err);
        setError("Erro de rede ou permissão ao acessar o servidor.");
      } finally {
        setLoading(false);
      }
    }

    loadGlobalData();
  }, []);

  // Carregar detalhes quando o item selecionado mudar
  useEffect(() => {
    if (!selectedItem) return;
    const itemId = selectedItem.id;
    const itemType = selectedItem.type;

    async function loadItemDetails() {
      try {
        setDetailsLoading(true);
        const res = await getFSItemDetails(itemId, itemType);
        if (res.success && res.details) {
          setDetails(res.details);
        } else {
          console.error(res.error);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setDetailsLoading(false);
      }
    }

    loadItemDetails();
  }, [selectedItem]);

  // Filtragem dos respondentes na busca local
  const filteredRespondents = details?.respondents.filter(rep => {
    const term = respondentSearch.toLowerCase();
    return (
      rep.name.toLowerCase().includes(term) ||
      rep.nickname.toLowerCase().includes(term) ||
      rep.matricula.toLowerCase().includes(term)
    );
  }) || [];

  // Formatador de Data de Submissão
  const formatSubmissionDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return "Data inválida";
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-14rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-[var(--accent-start)]" />
          <p className="text-xs uppercase tracking-widest font-bold text-[var(--text-muted)] opacity-60">
            Estruturando Painel Analítico...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in-up text-left">
      <FSTabs />
      
      {/* 1. CABEÇALHO DA PÁGINA (Apple Pro Layout) */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1"
      >
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          ANÁLISE DE SUBMISSÕES
        </h1>
        <p className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-[0.15em] opacity-70">
          Painel consolidado de formulários e pesquisas
        </p>
      </motion.div>

      {/* 2. CARDS DO PAINEL CONSOLIDADO GERAL */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
            className="p-6 rounded-[24px] bg-[var(--input-bg)] border border-[var(--border-primary)] space-y-3 shadow-sm hover:shadow-md transition-all backdrop-blur-md"
          >
            <div className="flex items-center justify-between text-[var(--text-muted)]">
              <CheckCircle2 size={18} className="text-[var(--accent-start)]" />
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">F&S ATIVOS</span>
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)] tracking-tighter">
              {stats.totalForms + stats.totalSurveys}
            </div>
            <p className="text-[11px] font-medium text-[var(--text-muted)]">
              {stats.totalForms} formulários e {stats.totalSurveys} pesquisas ativos
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-[24px] bg-[var(--input-bg)] border border-[var(--border-primary)] space-y-3 shadow-sm hover:shadow-md transition-all backdrop-blur-md"
          >
            <div className="flex items-center justify-between text-[var(--text-muted)]">
              <Users size={18} className="text-indigo-500" />
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">RESPOSTAS TOTAIS</span>
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)] tracking-tighter">
              {stats.totalGlobalResponses.toLocaleString()}
            </div>
            <p className="text-[11px] font-medium text-[var(--text-muted)]">
              respostas totais enviadas
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="p-6 rounded-[24px] bg-[var(--input-bg)] border border-[var(--border-primary)] space-y-3 shadow-sm hover:shadow-md transition-all backdrop-blur-md border-l-4 border-l-[var(--accent-start)]"
          >
            <div className="flex items-center justify-between text-[var(--text-muted)]">
              <Activity size={18} className="text-[var(--accent-end)] animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">ATIVIDADE RECENTE</span>
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)] tracking-tighter">
              +{stats.responsesLast24h}
            </div>
            <p className="text-[11px] font-medium text-[var(--text-muted)]">
              submissões nas últimas 24 horas
            </p>
          </motion.div>
        </div>
      )}

      {/* 3. SELEÇÃO DA ESTRUTURA (Filtro Personalizado) */}
      <div className="p-6 rounded-[24px] bg-[var(--input-bg)] border border-[var(--border-primary)] backdrop-blur-xl shadow-sm space-y-6 relative z-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 relative">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-60">
              FILTRAR ESTRUTURA
            </span>
            
            {/* Custom Dropdown Trigger */}
            <div className="relative mt-1">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center justify-between gap-6 px-5 py-3.5 bg-[var(--bg-primary)]/40 hover:bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-[var(--accent-start)]/40 rounded-xl font-bold text-xs text-[var(--text-primary)] tracking-wide transition-all min-w-[280px]"
              >
                <span className="flex items-center gap-2">
                  {selectedItem?.type === "survey" ? (
                    <BarChart3 size={15} className="text-[var(--accent-start)]" />
                  ) : (
                    <FileText size={15} className="text-indigo-400" />
                  )}
                  {selectedItem?.title || "Selecione uma estrutura..."}
                </span>
                <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute left-0 mt-2 w-full max-h-60 overflow-y-auto bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl shadow-2xl z-50 custom-scrollbar backdrop-blur-xl"
                  >
                    <div className="p-1">
                      {items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSelectedItem(item);
                            setDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-left text-xs font-semibold transition-all ${
                            selectedItem?.id === item.id 
                              ? "bg-[var(--accent-soft)] text-[var(--text-primary)]" 
                              : "hover:bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          <span className="truncate max-w-[200px]">{item.title}</span>
                          <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md ${
                            item.type === "survey" 
                              ? "bg-[var(--accent-start)]/10 text-[var(--accent-start)]" 
                              : "bg-indigo-500/10 text-indigo-400"
                          }`}>
                            {item.type === "survey" ? "Survey" : "Forms"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Nome e ID do Item Selecionado */}
          {selectedItem && (
            <div className="flex flex-col text-left md:text-right gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-50">
                ESTRUTURA SELECIONADA
              </span>
              <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
                {selectedItem.title}
              </h2>
              <p className="text-[10px] text-[var(--text-muted)] font-mono opacity-80">
                ID: <span className="font-bold text-[var(--text-primary)]">{selectedItem.id}</span> | Tipo: <span className="font-bold">{selectedItem.type === "survey" ? "Pesquisa" : "Formulário"}</span>
              </p>
            </div>
          )}
        </div>

        {/* 4. METRICAS RAPIDAS HORIZONTAIS */}
        <AnimatePresence mode="wait">
          {detailsLoading ? (
            <div className="h-16 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--accent-start)]" />
            </div>
          ) : details ? (
            <motion.div
              key={details.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[var(--border-primary)]/50"
            >
              <div className="p-4 rounded-xl bg-[var(--bg-primary)]/40 border border-[var(--border-primary)]/50 flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-[var(--accent-start)]/10 text-[var(--accent-start)]">
                  <Users size={16} />
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-60">Total de Respondentes</p>
                  <p className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                    {details.totalRespondents} usuários concluíram
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-primary)]/40 border border-[var(--border-primary)]/50 flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Clock size={16} />
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-60">Tempo Médio de Conclusão</p>
                  <p className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                    {details.averageCompletionTimeSeconds 
                      ? `${Math.round(details.averageCompletionTimeSeconds / 60)} minutos` 
                      : "Não monitorado nesta estrutura"}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* 5. GRID DE DUAS CAMADAS (GRID INFERIOR: 1/4 Respondentes, 3/4 Placeholder Análise) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ESQUERDA: LISTA DE RESPONDENTES (1/4 da tela ou col-span-4 / col-span-3) */}
        <div className="lg:col-span-4 rounded-[24px] bg-[var(--input-bg)] border border-[var(--border-primary)] backdrop-blur-xl p-5 shadow-sm space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight uppercase">
              Respondentes
            </h3>
            <p className="text-[10px] text-[var(--text-muted)] opacity-70">
              Usuários que concluíram e enviaram dados
            </p>
          </div>

          {/* Campo de Busca Interno */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] opacity-50 group-hover:text-[var(--accent-start)] transition-colors" size={13} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou matrícula..." 
              value={respondentSearch}
              onChange={(e) => setRespondentSearch(e.target.value)}
              className="w-full bg-[var(--bg-primary)]/40 border border-[var(--border-primary)] rounded-lg py-2 pl-8 pr-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-start)]/50 transition-all placeholder:text-[var(--text-muted)] placeholder:opacity-50"
            />
          </div>

          {/* Lista de Usuários com Scroll */}
          <div className="max-h-[360px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {detailsLoading ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" />
                </div>
              ) : filteredRespondents.length > 0 ? (
                filteredRespondents.map((rep, idx) => (
                  <motion.div
                    key={rep.matricula + rep.submittedAt}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                    className="p-3 bg-[var(--bg-primary)]/30 hover:bg-[var(--bg-primary)] border border-[var(--border-primary)]/40 rounded-xl space-y-2 group transition-all"
                  >
                    <div className="flex justify-between items-start gap-1">
                      <div className="text-left space-y-0.5 max-w-[70%]">
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                          {rep.name}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] font-medium">
                          {rep.nickname ? `@${rep.nickname}` : rep.matricula}
                        </p>
                      </div>
                      
                      {/* Tooltip de Futuro Acesso a Perfil */}
                      <div className="relative group/tooltip">
                        <button 
                          disabled
                          className="p-1.5 rounded-lg bg-[var(--input-bg)] hover:bg-[var(--accent-soft)] border border-[var(--border-primary)]/50 text-[var(--text-muted)] opacity-40 cursor-not-allowed transition-all"
                          title="Acesso ao perfil em desenvolvimento"
                        >
                          <User size={11} />
                        </button>
                        <div className="absolute right-0 bottom-full mb-1 px-2 py-1 bg-[var(--text-primary)] text-[var(--bg-primary)] text-[8px] uppercase tracking-wider font-bold rounded shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          Perfil em desenvolvimento
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-[9px] text-[var(--text-muted)] font-mono opacity-80">
                      <Clock size={10} />
                      <span>{formatSubmissionDate(rep.submittedAt)}</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-12 text-center text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider opacity-50">
                  Nenhum respondente encontrado
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* DIREITA: ESPAÇO RESERVADO ANALISE (3/4 da tela ou col-span-8 / col-span-9) */}
        <div className="lg:col-span-8 rounded-[24px] bg-[var(--input-bg)] border border-[var(--border-primary)] backdrop-blur-xl p-6 shadow-sm min-h-[440px] flex flex-col justify-between relative overflow-hidden">
          
          <div className="space-y-1 text-left relative z-10">
            <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight uppercase">
              Métricas Específicas
            </h3>
            <p className="text-[10px] text-[var(--text-muted)] opacity-70">
              Análise e consolidação avançada de dados
            </p>
          </div>

          {/* Placeholder Visual Premium */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 relative z-10">
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--accent-start)]/5 rounded-full blur-xl animate-pulse" />
              <div className="p-5 bg-[var(--bg-primary)]/50 border border-[var(--border-primary)] rounded-[20px] text-[var(--accent-start)] relative">
                <BarChart3 size={32} />
              </div>
            </div>
            
            <div className="space-y-2 max-w-sm">
              <p className="text-xs font-bold text-[var(--text-primary)] tracking-tight uppercase">
                Camada Analítica em Construção
              </p>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed font-medium">
                Os gráficos de análise avançada e inteligência para esta estrutura estão sendo modelados e serão disponibilizados progressivamente no BPlen HUB.
              </p>
            </div>
            
            <span className="text-[8px] font-bold uppercase tracking-[0.25em] text-[var(--accent-start)] bg-[var(--accent-start)]/10 px-3 py-1.5 rounded-full">
              Camada 2 • Progressive Deploy
            </span>
          </div>

          {/* Gráficos em Linhas Finas Decorativas de Fundo */}
          <div className="absolute bottom-0 right-0 left-0 h-1/3 opacity-[0.03] pointer-events-none z-0">
            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
              <path d="M0,80 Q15,70 30,85 T60,50 T90,75 T100,60 L100,100 L0,100 Z" fill="url(#grad)" />
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent-start)" />
                  <stop offset="100%" stopColor="var(--accent-end)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
        </div>

      </div>
    </div>
  );
}
