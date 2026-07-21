"use client";

import React, { useState, useEffect, useMemo } from "react";
import { syncCalendarToFirestore, getSyncedEvents } from "@/actions/calendar";
import { GoogleCalendarEvent } from "@/types/calendar";
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Calendar as CalendarIcon,
  ExternalLink,
  Clock,
  LayoutDashboard,
  Filter,
  ArrowUpDown,
  TrendingUp,
  Activity,
  Settings2,
  Trash2,
  BadgeCheck,
  Loader2
} from "lucide-react";
import { getOneToOneTypes, updateOneToOneTypes } from "@/actions/OneToOneActions";
import { getCalendarEventTypes, updateCalendarEventTypes } from "@/actions/calendar-event-types";
import { getAdminProducts } from "@/actions/products";
import { CalendarEventType } from "@/types/calendar-event-types";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import GlassModal from "@/components/ui/GlassModal";
import { FunctionalPageHeader } from "@/components/layout/FunctionalPageHeader";
import { StatTile } from "@/components/admin/StatTile";

type SortOption = "date" | "name" | "status";
type DateRangeOption = "all" | "15" | "30";

export default function AgendaManagementPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{ count: number; timestamp: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncedEvents, setSyncedEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Novos controles de visualização
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [dateRange, setDateRange] = useState<DateRangeOption>("all");

  // Configuração 1-to-1
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [oneToOneTypes, setOneToOneTypes] = useState<string[]>([]);
  const [newType, setNewType] = useState("");
  // Tipos de evento (Etapa 3.1): o significado do slot mora aqui, nao no titulo.
  const [eventTypes, setEventTypes] = useState<CalendarEventType[]>([]);
  const [servicos, setServicos] = useState<{ serviceCode: string; title: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Carregar preview dos eventos já sincronizados
  useEffect(() => {
    async function load() {
      setIsLoadingList(true);
      try {
        const events = await getSyncedEvents();
        setSyncedEvents(events);

        // Carrega tipos 1-to-1 (as razoes seguem na sua fonte original)
        const types = await getOneToOneTypes();
        setOneToOneTypes(types);

        // Tipos de evento + catalogo de servicos para o campo "atende"
        const [tiposEvento, produtos] = await Promise.all([
          getCalendarEventTypes(),
          getAdminProducts(),
        ]);
        setEventTypes(tiposEvento);
        setServicos(
          produtos
            .filter(p => p.serviceCode)
            .map(p => ({ serviceCode: p.serviceCode as string, title: p.title }))
            .sort((a, b) => a.serviceCode.localeCompare(b.serviceCode))
        );
      } catch (err: unknown) {
        console.error("Erro ao carregar preview:", err);
      } finally {
        setIsLoadingList(false);
      }
    }
    load();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const res = await syncCalendarToFirestore();
      if (res.success) {
        alert(`Sincronização concluída!\nSincronizados: ${res.synced}\nRemovidos: ${res.deleted}`);
        const updatedEvents = await getSyncedEvents();
        setSyncedEvents(updatedEvents);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Erro ao sincronizar agenda.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Duas fontes distintas de proposito (Licao 21): as razoes do 1 to 1 seguem
    // em Settings/OneToOne (ja alimentam o dropdown do membro) e a configuracao
    // dos tipos vai para Settings/CalendarEventTypes.
    const [resRazoes, resTipos] = await Promise.all([
      updateOneToOneTypes(oneToOneTypes),
      updateCalendarEventTypes(eventTypes),
    ]);
    if (resRazoes.success && resTipos.success) {
      setIsConfigModalOpen(false);
    } else {
      alert(resTipos.message || "Erro ao salvar configurações.");
    }
    setIsSaving(false);
  };

  const updateTipo = (id: string, patch: Partial<CalendarEventType>) => {
    setEventTypes(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));
  };

  const toggleAtende = (id: string, serviceCode: string) => {
    setEventTypes(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const atende = t.atende.includes(serviceCode)
          ? t.atende.filter(c => c !== serviceCode)
          : [...t.atende, serviceCode];
        return { ...t, atende };
      })
    );
  };

  /** Quantos eventos ja sincronizados casam com este tipo — feedback imediato. */
  const contarEventosDoTipo = (googleTitle: string) => {
    const alvo = googleTitle.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
    return syncedEvents.filter(
      ev => (ev.summary || "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase() === alvo
    ).length;
  };

  const handleAddType = () => {
    if (newType.trim() && !oneToOneTypes.includes(newType.trim())) {
      setOneToOneTypes([...oneToOneTypes, newType.trim()]);
      setNewType("");
    }
  };

  const handleRemoveType = (typeToRemove: string) => {
    setOneToOneTypes(oneToOneTypes.filter((t) => t !== typeToRemove));
  };

  /**
   * Cálculo de Estatísticas (Stats Section)
   */
  const stats = useMemo(() => {
    if (!syncedEvents.length) return { total: 0, types: [], status: { sync: 0 } };

    const total = syncedEvents.length;

    // Contagem por Tipo (Top 5)
    const typeMap: Record<string, number> = {};
    syncedEvents.forEach(ev => {
      const type = ev.summary || "Sem Título";
      typeMap[type] = (typeMap[type] || 0) + 1;
    });

    const topTypes = Object.entries(typeMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      total,
      types: topTypes,
      status: {
        sync: syncedEvents.filter(e => e.status === "sincronizado" || !e.status).length
      }
    };
  }, [syncedEvents]);

  /**
   * Processamento da Lista (Filtro + Ordenação)
   */
  const processedEvents = useMemo(() => {
    let result = [...syncedEvents];

    // 1. Filtro de Busca (Título + Descrição)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(ev =>
        ev.summary?.toLowerCase().includes(term) ||
        ev.description?.toLowerCase().includes(term)
      );
    }

    // 2. Filtro Temporal (15 ou 30 dias)
    if (dateRange !== "all") {
      const now = new Date();
      const limit = addDays(now, parseInt(dateRange));
      result = result.filter(ev => {
        const date = ev.start ? parseISO(ev.start) : new Date();
        return date.getTime() < limit.getTime();
      });
    }

    // 3. Ordenação
    result.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(a.start).getTime() - new Date(b.start).getTime();
      }
      if (sortBy === "name") {
        return a.summary.localeCompare(b.summary);
      }
      // Placeholder status sort (todos são 'sincronizado' por enquanto)
      return 0;
    });

    return result;
  }, [syncedEvents, searchTerm, dateRange, sortBy]);

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      <FunctionalPageHeader
        eyebrow="Jornada e Agenda"
        title="Sincronizar"
        titleAccent="Agenda"
        icon={<RefreshCw size={24} />}
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-full font-bold text-[10px] uppercase tracking-widest bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-muted)] transition-all hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)] active:scale-[0.98]"
            >
              <Settings2 className="w-4 h-4" />
              Configurar Tipos de Evento
            </button>

            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg hover:translate-y-[-2px] active:scale-[0.98] shrink-0 ${isSyncing
                  ? "bg-[var(--input-bg)] text-[var(--text-muted)] cursor-not-allowed"
                  : "bg-gradient-to-tr from-[var(--accent-start)] to-[var(--accent-end)] text-white shadow-[var(--accent-start)]/20"
                }`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Sincronizando..." : "Sincronizar Agora"}
            </button>
          </div>
        }
      />

      <p className="text-[var(--text-muted)] text-sm font-medium opacity-70 -mt-4">
        Sincronização da agenda do BPlen HUB
      </p>

      {/* Stats Cards Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          icon={<LayoutDashboard className="w-5 h-5" />}
          label="Total na Base"
          value={stats.total}
          detail="Eventos mapeados"
          tone="accent"
        />

        <StatTile
          icon={<Activity className="w-5 h-5" />}
          label="Status Sincronizado"
          value={stats.status.sync}
          detail="Operacional"
          tone="success"
          dot
        />

        <div className="col-span-1 md:col-span-2 p-6 bg-[var(--input-bg)] rounded-[2rem] border border-[var(--border-primary)] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-1.5 bg-[var(--accent-end)]/10 rounded-xl text-[var(--accent-end)]">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] leading-none">Principais Tipos / Serviços (Top 5)</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {stats.types.map((t, i) => (
              <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-[var(--input-bg)] rounded-xl border border-[var(--input-border)] shadow-sm hover:border-[var(--accent-start)]/30 transition-all">
                <span className="text-[9px] font-bold text-[var(--text-primary)] line-clamp-1 max-w-[150px]">{t.name}</span>
                <span className="text-[9px] font-bold text-[var(--accent-start)] bg-[var(--accent-start)]/10 px-1 rounded-lg border border-[var(--accent-start)]/10">{t.count}</span>
              </div>
            ))}
            {stats.types.length === 0 && <span className="text-[9px] text-[var(--text-muted)] italic">Aguardando dados...</span>}
          </div>
        </div>
      </div>

      {/* Controls Bar (Filter/Sort/Search) */}
      <div className="flex flex-wrap items-center gap-4 p-5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[2rem] sticky top-4 z-10 shadow-2xl backdrop-blur-3xl">
        {/* Search */}
        <div className="relative flex-1 min-w-[250px]">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] opacity-40" />
          <input
            type="text"
            placeholder="Filtrar por título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--bg-primary)]/50 border border-[var(--input-border)] rounded-2xl pl-12 pr-6 py-3.5 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]/50 transition-all placeholder:text-[var(--text-muted)] placeholder:opacity-40"
          />
        </div>

        {/* Date Filters */}
        <div className="flex items-center bg-[var(--bg-primary)]/50 p-1.5 rounded-2xl border border-[var(--input-border)] gap-1">
          {(["all", "15", "30"] as DateRangeOption[]).map((opt) => (
            <button
              key={opt}
              onClick={() => setDateRange(opt)}
              className={`px-4 py-2 rounded-xl text-[9px] font-bold transition-all uppercase tracking-widest ${dateRange === opt
                  ? "bg-[var(--accent-start)] text-white shadow-xl shadow-[var(--accent-start)]/20"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
            >
              {opt === "all" ? "Todos" : `Próx. ${opt} Dias`}
            </button>
          ))}
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-[var(--bg-primary)]/50 rounded-2xl border border-[var(--input-border)]">
          <ArrowUpDown className="w-3.5 h-3.5 text-[var(--accent-start)]" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-transparent text-[9px] font-bold text-[var(--text-muted)] focus:outline-none cursor-pointer uppercase tracking-widest hover:text-[var(--text-primary)] transition-colors"
          >
            <option value="date" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Ordenar por Data</option>
            <option value="name" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Ordenar por Nome</option>
            <option value="status" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Ordenar por Status</option>
          </select>
        </div>
      </div>

      {/* Sync Feedback Alerts */}
      <AnimatePresence>
        {lastSyncResult && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 p-5 bg-green-500/10 border border-green-500/10 rounded-2xl text-green-500"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div className="text-[11px] font-bold uppercase tracking-widest">
              Painel atualizado: {lastSyncResult.count} eventos capturados em {format(new Date(lastSyncResult.timestamp), "HH:mm:ss")}.
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 p-5 bg-red-500/10 border border-red-500/10 rounded-2xl text-red-500"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="text-[11px] font-bold uppercase tracking-widest">
              Falha na Sincronização: {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events Grid */}
      <div className="space-y-6">
        {isLoadingList ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-[var(--input-bg)] animate-pulse rounded-[2.5rem] border border-[var(--border-primary)]"></div>
            ))}
          </div>
        ) : processedEvents.length === 0 ? (
          <div className="p-24 text-center border-2 border-dashed border-[var(--border-primary)] rounded-[3rem] bg-[var(--input-bg)] backdrop-blur-sm">
            <CalendarIcon className="w-16 h-16 text-[var(--text-muted)] opacity-10 mx-auto mb-6" />
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-[0.3em]">Nenhum evento encontrado</p>
            <p className="text-[11px] text-[var(--text-muted)] opacity-40 mt-3 max-w-xs mx-auto">Ajuste os filtros ou realize uma nova sincronização.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedEvents.map(event => (
              <div
                key={event.id}
                className="group relative p-8 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[2.5rem] hover:bg-[var(--accent-soft)] hover:border-[var(--accent-start)]/30 transition-all duration-500 hover:translate-y-[-4px] shadow-sm hover:shadow-xl"
              >
                {/* Status Indicator Dot */}
                <div className="absolute top-8 left-8 flex items-center gap-2 bg-[var(--bg-primary)] backdrop-blur-xl px-3 py-1.5 rounded-full border border-[var(--border-primary)] shadow-2xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-start)] shadow-[0_0_10px_rgba(255,44,141,0.5)]" />
                  <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Sincronizado</span>
                </div>

                <div className="flex justify-end items-start mb-8">
                  <a
                    href={event.htmlLink}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-[var(--bg-primary)] shadow-xl border border-[var(--border-primary)] rounded-xl text-[var(--text-muted)] hover:text-[var(--accent-start)] hover:border-[var(--accent-start)]/30 transition-all hover:scale-110"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <h4 className="font-bold text-xl text-[var(--text-primary)] group-hover:text-[var(--accent-start)] transition-colors line-clamp-2 leading-tight min-h-[56px]">{event.summary}</h4>

                <div className="mt-8 space-y-4 pt-8 border-t border-[var(--border-primary)]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-start)]/5 flex items-center justify-center text-[var(--accent-start)] border border-[var(--accent-start)]/10">
                      <CalendarIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] opacity-40">Data do Serviço</p>
                      <p className="text-xs font-bold text-[var(--text-primary)]">{event.start && format(new Date(event.start), "dd 'de' MMMM, yyyy", { locale: ptBR })}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-end)]/5 flex items-center justify-center text-[var(--accent-end)] border border-[var(--accent-end)]/10">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] opacity-40">Horário Previsto</p>
                      <p className="text-xs font-bold text-[var(--text-primary)]">
                        {event.start && format(new Date(event.start), "HH:mm")} - {event.end && format(new Date(event.end), "HH:mm")}
                      </p>
                    </div>
                  </div>
                </div>

                {event.description && (
                  <div className="mt-8 p-5 rounded-2xl bg-[var(--accent-start)]/[0.02] border border-[var(--border-primary)]">
                    <p className="text-[10px] text-[var(--text-secondary)] line-clamp-2 italic leading-relaxed opacity-60">
                      &quot;{event.description}&quot;
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Logic Box */}
      <div className="p-6 bg-[var(--accent-start)]/[0.04] border border-[var(--accent-start)]/10 rounded-[2.5rem] shadow-2xl">
        <div className="flex gap-5">
          <div className="p-3 bg-[var(--accent-start)]/10 rounded-2xl shrink-0 h-fit">
            <AlertCircle className="w-5 h-5 text-[var(--accent-start)]" />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-primary)]">Governança BPlen (auditoria de 90 dias)</p>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-medium opacity-60">
              Este dashboard utiliza uma base sincronizada incremental. Eventos passados são arquivados automaticamente para atribuição de Auditoria e Atas, enquanto eventos futuros são atualizados a cada sincronização. A ordenação e agrupamento por título auxiliam na identificação rápida de gargalos de portfólio.
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Configuração 1-to-1 */}
      <GlassModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Tipos de Evento"
        subtitle="O horário vem do Google; o significado é configurado aqui."
      >
        <div className="space-y-5 p-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar text-left">
          {eventTypes.map((tipo) => {
            const casados = contarEventosDoTipo(tipo.googleTitle);
            return (
              <div key={tipo.id} className="p-5 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-[var(--text-primary)]">{tipo.label}</h3>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                      casa com: {tipo.googleTitle}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${casados > 0 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}>
                    {casados > 0 ? `${casados} eventos na agenda` : "nenhum evento com este título"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="space-y-1.5 block">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Consultor padrão</span>
                    <input
                      type="text"
                      value={tipo.consultorPadrao}
                      onChange={(e) => updateTipo(tipo.id, { consultorPadrao: e.target.value })}
                      className="w-full px-4 py-3 bg-[var(--bg-primary)]/50 border border-[var(--input-border)] rounded-xl text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]/50"
                    />
                  </label>
                  <label className="space-y-1.5 block">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Vagas padrão</span>
                    <input
                      type="number"
                      min={0}
                      value={tipo.vagasPadrao}
                      onChange={(e) => updateTipo(tipo.id, { vagasPadrao: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-[var(--bg-primary)]/50 border border-[var(--input-border)] rounded-xl text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]/50"
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Atende os serviços</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {servicos.map((sv) => (
                      <label key={sv.serviceCode} className="flex items-center gap-2 p-2 rounded-xl hover:bg-[var(--accent-soft)] cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={tipo.atende.includes(sv.serviceCode)}
                          onChange={() => toggleAtende(tipo.id, sv.serviceCode)}
                          className="accent-[var(--accent-start)]"
                        />
                        <span className="text-[11px] font-medium text-[var(--text-primary)] truncate">{sv.title}</span>
                        <span className="text-[9px] font-mono text-[var(--text-muted)] opacity-60 shrink-0">{sv.serviceCode}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {tipo.id === "1-to-1" && (
                  <div className="space-y-2 pt-3 border-t border-[var(--border-primary)]">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                      Razões (viram o tema do agendamento)
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                        placeholder="Ex: Alinhamento Estratégico"
                        className="flex-1 px-4 py-3 bg-[var(--bg-primary)]/50 border border-[var(--input-border)] rounded-xl text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]/50 placeholder:text-[var(--text-muted)] placeholder:opacity-40"
                        onKeyDown={(e) => e.key === "Enter" && handleAddType()}
                      />
                      <button
                        onClick={handleAddType}
                        className="px-5 py-3 bg-[var(--accent-start)] text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[var(--accent-end)] transition-all"
                      >
                        Adicionar
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {oneToOneTypes.length === 0 ? (
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-40 py-3">
                          Nenhuma razão cadastrada
                        </p>
                      ) : (
                        oneToOneTypes.map((razao, index) => (
                          <div key={index} className="flex justify-between items-center px-4 py-2.5 bg-[var(--bg-primary)]/50 border border-[var(--border-primary)] rounded-xl group">
                            <span className="text-[11px] font-bold text-[var(--text-primary)]">{razao}</span>
                            <button
                              onClick={() => handleRemoveType(razao)}
                              className="p-1.5 opacity-0 group-hover:opacity-100 bg-red-500/10 text-red-500 rounded-lg transition-all hover:bg-red-500 hover:text-white"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <p className="text-[10px] font-medium text-[var(--text-muted)] opacity-70 px-1">
            Nesta fase a configuração é apenas registrada: o agendamento do membro segue
            funcionando pelo mecanismo atual, sem alteração.
          </p>
        </div>

        <div className="p-2">
          <div className="pt-6 border-t border-[var(--border-primary)] flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-3 px-10 py-4.5 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-md"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}

