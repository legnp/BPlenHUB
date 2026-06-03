"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  getProgramacaoSummaryAction, 
  getEventNpsDetailsAction,
  getEventAttendees,
  rescheduleAttendeeAction
} from "@/actions/calendar";
import { 
  GoogleCalendarEvent,
  EventLifecycleStatus 
} from "@/types/calendar";
import { 
  FileText, 
  ExternalLink, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Calendar as CalendarIcon,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Star,
  Eye,
  MessageCircle,
  Phone,
  Mail,
  RefreshCw,
  Video
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuthContext } from "@/context/AuthContext";
import PostEventWizard from "./PostEventWizard";
import GlassModal from "@/components/ui/GlassModal";

interface EventSummary {
  id: string;
  summary: string;
  start: string;
  end: string;
  mentor: string;
  theme?: string;
  statusLabel: "futuro" | "pendente" | "concluido";
  folderUrl: string | null;
  htmlLink: string;
  registeredCount: number;
  totalCapacity: number;
  metrics: {
    presenceCount: number;
    npsAvg: number;
    reviewsCount: number;
  };
  meetingLink?: string;
  location?: string;
  // Post-event fields (kept for PostEventWizard pre-population)
  postEventCompleted?: boolean;
  lifecycleStatus?: EventLifecycleStatus;
  internalGeneralComment?: string;
  publicGeneralComment?: string;
  meetingMinutesFile?: { url: string; fileId: string; fileName: string; uploadedAt: string } | null;
}

type SortField = "date" | "name" | "nps" | "presence" | "capacity";
type SortDirection = "asc" | "desc";
type StatusFilter = "todos" | "futuro" | "pendente" | "concluido";

const getInitials = (name: string) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

export default function ProgramacaoResumo() {
  const { user } = useAuthContext();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Modal Wizard State
  const [selectedEvent, setSelectedEvent] = useState<EventSummary | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Dropdown Menu State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // NPS Detail Modal State
  const [npsModalEvent, setNpsModalEvent] = useState<EventSummary | null>(null);
  const [npsData, setNpsData] = useState<{ npsAvg: number; reviewsCount: number; reviews: Array<{ nickname: string; matricula: string; rating: number; feedback: string; evaluatedAt: string | null }> } | null>(null);
  const [isLoadingNps, setIsLoadingNps] = useState(false);

  const handleOpenNpsModal = async (ev: EventSummary) => {
    setNpsModalEvent(ev);
    setIsLoadingNps(true);
    setNpsData(null);
    try {
      const idToken = await user?.getIdToken();
      const res = await getEventNpsDetailsAction(ev.id, idToken);
      if (res.success) {
        setNpsData({ npsAvg: res.npsAvg, reviewsCount: res.reviewsCount, reviews: res.reviews });
      }
    } catch (err) {
      console.error("Erro ao carregar NPS:", err);
    } finally {
      setIsLoadingNps(false);
    }
  };

  // Attendees Modal State
  const [attendeesModalEvent, setAttendeesModalEvent] = useState<EventSummary | null>(null);
  const [attendeesData, setAttendeesData] = useState<any[]>([]);
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(false);

  const handleOpenAttendeesModal = async (ev: EventSummary) => {
    setAttendeesModalEvent(ev);
    setIsLoadingAttendees(true);
    setAttendeesData([]);
    try {
      const res = await getEventAttendees(ev.id);
      setAttendeesData(res || []);
    } catch (err) {
      console.error("Erro ao carregar inscritos:", err);
    } finally {
      setIsLoadingAttendees(false);
    }
  };

  // Reschedule State
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [reschedulingAttendee, setReschedulingAttendee] = useState<any | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  const openRescheduleModal = (attendee: any) => {
    setReschedulingAttendee(attendee);
    setIsRescheduleModalOpen(true);
  };

  const closeRescheduleModal = () => {
    setIsRescheduleModalOpen(false);
    setReschedulingAttendee(null);
  };

  const handleReschedule = async (newEventId: string) => {
    if (!attendeesModalEvent || !reschedulingAttendee) return;
    setIsRescheduling(true);
    try {
      const idToken = await user?.getIdToken();
      const res = await rescheduleAttendeeAction(
        attendeesModalEvent.id,
        newEventId,
        reschedulingAttendee.userId,
        idToken
      );

      if (res.success) {
        // Refresh everything
        setRefreshCounter(p => p + 1);
        closeRescheduleModal();
        // Close attendees modal too since it's outdated now
        setAttendeesModalEvent(null);
      } else {
        alert("Erro ao reagendar: " + res.message);
      }
    } catch (err: any) {
      alert("Erro inesperado: " + err.message);
    } finally {
      setIsRescheduling(false);
    }
  };

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const idToken = await user?.getIdToken();
        const data = await getProgramacaoSummaryAction(idToken);
        setEvents(data);
      } catch (error) {
        console.error("Erro ao carregar resumo:", error);
      } finally {
        setIsLoading(false);
      }
    }
    if (user) load();
  }, [user, refreshCounter]);

  // Click away listener for dropdown
  useEffect(() => {
    const handleClickAway = () => setActiveMenuId(null);
    if (activeMenuId) {
      window.addEventListener("click", handleClickAway);
    }
    return () => window.removeEventListener("click", handleClickAway);
  }, [activeMenuId]);

  const handleOpenWizard = (ev: EventSummary) => {
    setSelectedEvent(ev);
    setIsWizardOpen(true);
    setActiveMenuId(null);
  };

  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "date" ? "asc" : "desc");
    }
  };

  // Filtered & Sorted Events (memoized)
  const filteredEvents = useMemo(() => {
    let result = [...events];

    // 1. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(ev =>
        ev.summary.toLowerCase().includes(q) ||
        (ev.theme && ev.theme.toLowerCase().includes(q)) ||
        ev.mentor.toLowerCase().includes(q)
      );
    }

    // 2. Status filter
    if (statusFilter !== "todos") {
      result = result.filter(ev => ev.statusLabel === statusFilter);
    }

    // 3. Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "date":
          cmp = new Date(a.start).getTime() - new Date(b.start).getTime();
          break;
        case "name":
          cmp = a.summary.localeCompare(b.summary, "pt-BR");
          break;
        case "nps":
          cmp = (a.metrics.npsAvg || 0) - (b.metrics.npsAvg || 0);
          break;
        case "presence":
          cmp = (a.metrics.presenceCount || 0) - (b.metrics.presenceCount || 0);
          break;
        case "capacity":
          cmp = (a.registeredCount || 0) - (b.registeredCount || 0);
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return result;
  }, [events, searchQuery, statusFilter, sortField, sortDirection]);

  const statusMap = {
    futuro: { label: "Futuro", color: "bg-blue-500/10 text-blue-400", icon: Clock },
    pendente: { label: "Pendente Fechamento", color: "bg-amber-500/10 text-amber-500 animate-pulse", icon: AlertCircle },
    concluido: { label: "Concluído", color: "bg-green-500/10 text-green-500", icon: CheckCircle2 },
  };

  const statusFilterOptions: { key: StatusFilter; label: string; color: string }[] = [
    { key: "todos", label: "Todos", color: "bg-[var(--text-primary)]/5 text-[var(--text-primary)]" },
    { key: "futuro", label: "Futuro", color: "bg-blue-500/10 text-blue-400" },
    { key: "pendente", label: "Pendente", color: "bg-amber-500/10 text-amber-500" },
    { key: "concluido", label: "Concluído", color: "bg-green-500/10 text-green-500" },
  ];

  // Count per status for badges
  const statusCounts = useMemo(() => {
    const counts = { todos: events.length, futuro: 0, pendente: 0, concluido: 0 };
    events.forEach(ev => { counts[ev.statusLabel]++; });
    return counts;
  }, [events]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-2.5 h-2.5 opacity-30" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="w-2.5 h-2.5 text-[var(--accent-start)]" /> 
      : <ArrowDown className="w-2.5 h-2.5 text-[var(--accent-start)]" />;
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-50">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-start)]" />
        <p className="text-[10px] font-bold uppercase tracking-widest">Carregando Programação...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent-start)] ml-2">Resumo da programação</p>
        <button 
          onClick={async () => {
             if (confirm("Deseja recalcular todas as métricas históricas? Isso pode levar alguns segundos.")) {
               setIsLoading(true);
               try {
                 const idToken = await user?.getIdToken();
                 if (idToken) {
                   const { healProgramacaoMasterAction } = await import("@/actions/calendar");
                   const res = await healProgramacaoMasterAction(idToken);
                   if (res.success) {
                      alert(`Sucesso! ${res.processed} eventos processados.`);
                      setRefreshCounter(p => p + 1);
                   } else {
                      alert("Erro no Healing: " + res.message);
                   }
                 }
               } catch (err) {
                 console.error(err);
               } finally {
                 setIsLoading(false);
               }
             }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-start)]/10 hover:bg-[var(--accent-start)]/20 text-[var(--accent-start)] rounded-xl border border-[var(--accent-start)]/20 transition-all text-[9px] font-black uppercase tracking-widest"
        >
           <TrendingUp className="w-3 h-3" />
           Recalcular Métricas (Healing)
        </button>
      </div>

      {/* ─── Search, Filter & Sort Toolbar ─── */}
      <div className="flex flex-col gap-3 p-4 bg-[var(--input-bg)]/20 rounded-[1.5rem] border border-[var(--border-primary)]">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] opacity-40" />
          <input 
            type="text"
            placeholder="Buscar por evento, tema ou orientador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-[var(--bg-primary)]/60 border border-[var(--border-primary)] rounded-2xl text-xs font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] placeholder:opacity-40 focus:outline-none focus:border-[var(--accent-start)]/40 focus:ring-2 focus:ring-[var(--accent-start)]/10 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-[var(--input-bg-hover)] transition-all opacity-40 hover:opacity-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Status Filter Chips */}
          <div className="flex items-center gap-2">
            <Filter className="w-3 h-3 text-[var(--text-muted)] opacity-40" />
            <div className="flex items-center gap-1.5">
              {statusFilterOptions.map((opt) => {
                const isActive = statusFilter === opt.key;
                const count = statusCounts[opt.key];
                return (
                  <button
                    key={opt.key}
                    onClick={() => setStatusFilter(opt.key)}
                    className={`
                      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all
                      ${isActive 
                        ? `${opt.color} ring-2 ring-current/20 shadow-sm` 
                        : "bg-[var(--input-bg)]/40 text-[var(--text-muted)] opacity-50 hover:opacity-80"
                      }
                    `}
                  >
                    <span>{opt.label}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[7px] font-black ${isActive ? "bg-current/10" : "bg-[var(--border-primary)]/30"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Counter */}
          <span className="text-[9px] font-bold text-[var(--text-muted)] opacity-40">
            {filteredEvents.length} de {events.length} evento{events.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ─── Table Header (Desktop) — with sortable columns ─── */}
      <div className="hidden md:grid grid-cols-[2fr_1.2fr_1fr_1fr_0.8fr_1.5fr_1fr] gap-4 px-8 py-4 bg-[var(--input-bg)]/30 rounded-2xl border border-[var(--border-primary)] text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">
        <div className="flex items-center gap-3">
          <button onClick={() => handleSortToggle("date")} className="flex items-center gap-1.5 hover:text-[var(--accent-start)] transition-colors text-left">
            <span>Data</span>
            <SortIcon field="date" />
          </button>
          <span className="opacity-20">/</span>
          <button onClick={() => handleSortToggle("name")} className="flex items-center gap-1.5 hover:text-[var(--accent-start)] transition-colors text-left">
            <span>Evento</span>
            <SortIcon field="name" />
          </button>
        </div>
        <div>Orientador</div>
        <div>Status</div>
        <button onClick={() => handleSortToggle("nps")} className="flex items-center justify-center gap-1.5 hover:text-[var(--accent-start)] transition-colors">
          <span>NPS</span>
          <SortIcon field="nps" />
        </button>
        <button onClick={() => handleSortToggle("presence")} className="flex items-center justify-center gap-1.5 hover:text-[var(--accent-start)] transition-colors">
          <span>Presença</span>
          <SortIcon field="presence" />
        </button>
        <button onClick={() => handleSortToggle("capacity")} className="flex items-center justify-center gap-1.5 hover:text-[var(--accent-start)] transition-colors">
          <span>Inscritos / Vagas</span>
          <SortIcon field="capacity" />
        </button>
        <div className="text-right pr-4">Ações</div>
      </div>

      {/* Row List */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-[var(--border-primary)] rounded-[2.5rem] opacity-30">
            <p className="text-[10px] font-black uppercase tracking-widest">
              {searchQuery || statusFilter !== "todos" 
                ? "Nenhum evento encontrado com os filtros aplicados" 
                : "Nenhuma programação encontrada"}
            </p>
            {(searchQuery || statusFilter !== "todos") && (
              <button 
                onClick={() => { setSearchQuery(""); setStatusFilter("todos"); }}
                className="mt-3 text-[9px] font-bold text-[var(--accent-start)] hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : filteredEvents.map((ev) => {
          const SIcon = statusMap[ev.statusLabel].icon;
          const isMenuOpen = activeMenuId === ev.id;

          return (
            <div 
              key={ev.id} 
              className="group grid grid-cols-1 md:grid-cols-[2fr_1.2fr_1fr_1fr_0.8fr_1.5fr_1fr] gap-4 items-center px-8 py-5 bg-[var(--bg-primary)]/40 border border-[var(--border-primary)] rounded-[2rem] hover:border-[var(--accent-start)]/30 transition-all hover:translate-x-1"
            >
              {/* Event Name & Theme */}
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-[10px] font-bold text-[var(--text-muted)] opacity-50">{format(parseISO(ev.start), "dd/MM/yy - HH:mm", { locale: ptBR })}</span>
                <h4 className="text-sm font-black text-[var(--text-primary)] truncate">{ev.summary}</h4>
                {ev.theme && <span className="text-[10px] font-medium text-[var(--accent-start)] opacity-70 truncate"># {ev.theme}</span>}
              </div>

              {/* Mentor */}
              <div className="text-xs font-bold text-[var(--text-primary)]/80">
                {ev.mentor || "BPlen Hub"}
              </div>

              {/* Status */}
              <div>
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${statusMap[ev.statusLabel].color}`}>
                  <SIcon className="w-3 h-3" />
                  {statusMap[ev.statusLabel].label}
                </span>
              </div>

              {/* NPS */}
              <div className="text-center">
                {ev.metrics.npsAvg > 0 ? (
                  <div className="inline-flex items-center gap-1.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/5 text-green-500 rounded-lg">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-xs font-black">{ev.metrics.npsAvg}</span>
                      <span className="text-[8px] opacity-40 font-bold">({ev.metrics.reviewsCount})</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenNpsModal(ev); }}
                      className="p-1.5 rounded-lg bg-green-500/5 hover:bg-green-500/15 text-green-500 transition-all hover:scale-110"
                      title="Ver detalhes NPS"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <span className="text-[9px] font-bold text-[var(--text-muted)] opacity-30">S/ Aval.</span>
                )}
              </div>

              {/* Attendance */}
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 text-xs font-black text-[var(--text-primary)]">
                  <span className={ev.metrics.presenceCount > 0 ? "text-green-500" : "opacity-30"}>{ev.metrics.presenceCount}</span>
                  <span className="opacity-20">/</span>
                  <span className="opacity-40">{ev.registeredCount}</span>
                </div>
              </div>

              {/* Registered vs Capacity */}
              <div className="text-center">
                <div className="flex flex-col items-center gap-1">
                   <div className="w-full h-1.5 bg-[var(--input-bg)] rounded-full overflow-hidden border border-[var(--border-primary)]/30">
                      <div 
                        className="h-full bg-[var(--accent-start)] rounded-full" 
                        style={{ width: `${Math.min(100, ((ev.registeredCount || 0) / (ev.totalCapacity || 1)) * 100)}%` }} 
                      />
                   </div>
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleOpenAttendeesModal(ev); }}
                     className="flex items-center gap-2 text-[9px] font-bold text-[var(--text-muted)] opacity-60 hover:opacity-100 hover:text-[var(--accent-start)] hover:underline transition-all cursor-pointer"
                     title="Visualizar inscritos"
                   >
                      <Users className="w-2.5 h-2.5" />
                      {ev.registeredCount || 0} / {ev.totalCapacity || 0} vagas
                   </button>
                </div>
              </div>

              {/* Actions Dropdown */}
              <div className="flex items-center justify-end relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(isMenuOpen ? null : ev.id);
                  }}
                  className={`p-2.5 rounded-xl border transition-all ${isMenuOpen ? "bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)] shadow-lg" : "bg-[var(--input-bg)] hover:bg-[var(--input-bg-hover)] text-[var(--text-muted)] border-[var(--border-primary)]"}`}
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>

                {isMenuOpen && (
                  <div 
                    className="absolute top-full right-0 mt-2 w-56 p-2 bg-[var(--bg-primary)]/90 backdrop-blur-xl border border-[var(--border-primary)] rounded-[1.5rem] shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-col gap-1">
                      {/* Visualizar Inscritos Action */}
                      <button 
                        onClick={() => {
                          setActiveMenuId(null);
                          handleOpenAttendeesModal(ev);
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--accent-start)] hover:text-white transition-all text-left text-[11px] font-bold group/item"
                      >
                        <Users className="w-4 h-4 opacity-50 group-hover/item:opacity-100" />
                        <span>Visualizar Inscritos ({ev.registeredCount || 0})</span>
                      </button>

                      <hr className="my-1 border-[var(--border-primary)] opacity-30 mx-2" />

                      {/* Close Event Action */}
                      <button 
                        onClick={() => handleOpenWizard(ev)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--accent-start)] hover:text-white transition-all text-left text-[11px] font-bold group/item"
                      >
                        <CheckCircle2 className="w-4 h-4 opacity-50 group-hover/item:opacity-100" />
                        <span>{ev.postEventCompleted ? "Ver Resumo / Dados" : "Fechar Evento"}</span>
                      </button>

                      <hr className="my-1 border-[var(--border-primary)] opacity-30 mx-2" />

                      {/* External Links */}
                      <a 
                        href={ev.htmlLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--input-bg-hover)] transition-all text-left text-[11px] font-bold group/item"
                      >
                         <CalendarIcon className="w-4 h-4 opacity-50 text-blue-400" />
                         <span>Google Calendar</span>
                      </a>

                      {(ev.meetingLink || (ev.location?.startsWith("http") ? ev.location : "")) && (
                        <a 
                          href={ev.meetingLink || ev.location} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--input-bg-hover)] transition-all text-left text-[11px] font-bold group/item"
                        >
                           <Video className="w-4 h-4 opacity-50 text-purple-400" />
                           <span>Acessar Reunião</span>
                        </a>
                      )}

                      {ev.folderUrl && (
                        <a 
                          href={ev.folderUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--input-bg-hover)] transition-all text-left text-[11px] font-bold group/item"
                        >
                           <ExternalLink className="w-4 h-4 opacity-50 text-green-500" />
                           <span>Pasta do Drive</span>
                        </a>
                      )}

                      {/* Minutes Action */}
                      <a 
                        href={ev.meetingMinutesFile?.url || "#"} 
                        target="_blank" 
                        rel="noreferrer"
                        onClick={(e) => !ev.meetingMinutesFile?.url && e.preventDefault()}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left text-[11px] font-bold group/item ${ev.meetingMinutesFile?.url ? "hover:bg-[var(--input-bg-hover)]" : "opacity-30 cursor-not-allowed grayscale"}`}
                      >
                         <FileText className="w-4 h-4 opacity-50 text-amber-500" />
                         <span>Visualizar Ata</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Wizard Modal */}
      {selectedEvent && (
        <PostEventWizard 
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          event={selectedEvent}
          onSuccess={() => setRefreshCounter(p => p + 1)}
        />
      )}

      {/* Attendees Detail Modal */}
      <GlassModal
        isOpen={!!attendeesModalEvent}
        onClose={() => { setAttendeesModalEvent(null); setAttendeesData([]); }}
        title="Lista de Inscritos"
        subtitle={attendeesModalEvent?.summary}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar pr-1">
          {isLoadingAttendees ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 opacity-40">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-start)]" />
              <span className="text-[9px] font-black uppercase tracking-widest">Carregando inscritos...</span>
            </div>
          ) : attendeesData.length > 0 ? (
            <div className="space-y-3">
              {attendeesData.map((attendee, idx) => {
                const initials = getInitials(attendee.nickname);
                
                // Determine attendance badge status
                let attendanceBadge = null;
                if (attendee.attendanceStatus === "present") {
                  attendanceBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest bg-green-500/10 text-green-500 border border-green-500/20">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Presença
                    </span>
                  );
                } else if (attendee.attendanceStatus === "absent") {
                  attendanceBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20">
                      <X className="w-2.5 h-2.5" />
                      Falta
                    </span>
                  );
                } else {
                  attendanceBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Clock className="w-2.5 h-2.5" />
                      Pendente
                    </span>
                  );
                }

                return (
                  <div 
                    key={attendee.userId || idx} 
                    className="p-5 bg-[var(--bg-primary)]/50 rounded-3xl border border-[var(--border-primary)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[var(--accent-start)]/30 transition-all duration-300"
                  >
                    {/* User Info Block */}
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-full border border-[var(--border-primary)]/40 overflow-hidden flex items-center justify-center bg-gradient-to-br from-[var(--accent-start)] to-[var(--accent-end)] shadow-md">
                          {attendee.photoUrl ? (
                            <img 
                              src={attendee.photoUrl} 
                              alt={attendee.nickname} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-black text-white">
                              {initials}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Name / Matricula */}
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black text-[var(--text-primary)] leading-tight">{attendee.nickname}</h4>
                        <p className="text-[9px] font-bold text-[var(--text-muted)] opacity-50 uppercase tracking-widest">Matrícula: {attendee.matricula || "Lead / Sem Matrícula"}</p>
                        
                        {/* Timestamps */}
                        {attendee.timestamp && (
                          <p className="text-[8px] font-medium text-[var(--text-muted)] opacity-40">
                            Agendado em: {format(parseISO(attendee.timestamp), "dd/MM/yy - HH:mm", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons and Badges Block */}
                    <div className="flex flex-wrap items-center sm:justify-end gap-3 shrink-0">
                      {/* Badge Area */}
                      <div className="flex flex-wrap gap-1.5">
                        {/* Lead badge */}
                        {attendee.isLead && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[8px] font-black uppercase tracking-widest">
                            Lead
                          </span>
                        )}

                        {/* 1 to 1 Badge */}
                        {attendee.type && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-[var(--accent-start)]/10 text-[var(--accent-start)] border border-[var(--accent-start)]/20 text-[8px] font-black uppercase tracking-widest" title={attendee.expectations}>
                            {attendee.type}
                          </span>
                        )}

                        {/* Attendance Badge */}
                        {attendanceBadge}
                      </div>

                      {/* Interactive Buttons */}
                      <div className="flex items-center gap-1.5 border-l border-[var(--border-primary)] pl-3 ml-1">
                        {/* Email Link */}
                        <a
                          href={`mailto:${attendee.email}`}
                          className="p-2 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--accent-start)]/10 hover:text-[var(--accent-start)] text-[var(--text-muted)] border border-[var(--border-primary)] transition-all"
                          title={`Enviar e-mail para ${attendee.email}`}
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>

                        {/* Phone Link (if available) */}
                        {attendee.phone ? (
                          <a
                            href={`tel:${attendee.phone}`}
                            className="p-2 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--accent-start)]/10 hover:text-[var(--accent-start)] text-[var(--text-muted)] border border-[var(--border-primary)] transition-all"
                            title={`Ligar para ${attendee.phone}`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <div
                            className="p-2 rounded-xl bg-[var(--input-bg)]/40 text-[var(--text-muted)]/30 border border-[var(--border-primary)]/40 cursor-not-allowed"
                            title="Telefone não disponível"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </div>
                        )}

                        {/* Reschedule Button */}
                        <button
                          onClick={() => openRescheduleModal(attendee)}
                          className="p-2 rounded-xl bg-[var(--input-bg)] hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/30 text-[var(--text-muted)] border border-[var(--border-primary)] transition-all ml-2"
                          title="Reagendar participante"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center border border-dashed border-[var(--border-primary)] rounded-3xl opacity-30">
              <p className="text-[10px] font-black uppercase tracking-widest">Nenhum participante inscrito neste evento</p>
            </div>
          )}
        </div>
      </GlassModal>

      {/* NPS Detail Modal */}
      <GlassModal
        isOpen={!!npsModalEvent}
        onClose={() => { setNpsModalEvent(null); setNpsData(null); }}
        title="Avaliações NPS"
        subtitle={npsModalEvent?.summary}
        maxWidth="max-w-lg"
      >
        <div className="space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar pr-1">
          {isLoadingNps ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 opacity-40">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-start)]" />
              <span className="text-[9px] font-black uppercase tracking-widest">Carregando avaliações...</span>
            </div>
          ) : npsData ? (
            <>
              {/* Summary Header */}
              <div className="flex items-center justify-between p-5 bg-green-500/5 rounded-2xl border border-green-500/15">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center">
                    <span className="text-2xl font-black text-green-600">{npsData.npsAvg}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Nota Média</p>
                    <p className="text-[9px] font-bold text-[var(--text-muted)] opacity-50">{npsData.reviewsCount} avaliação{npsData.reviewsCount !== 1 ? "ões" : "ão"}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= Math.round(npsData.npsAvg) ? "fill-[#FFB800] text-[#FFB800]" : "text-black/[0.06]"}`} />
                  ))}
                </div>
              </div>

              {/* Star Distribution */}
              <div className="space-y-1.5">
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Distribuição</p>
                {[5,4,3,2,1].map(star => {
                  const count = npsData.reviews.filter(r => r.rating === star).length;
                  const pct = npsData.reviewsCount > 0 ? (count / npsData.reviewsCount) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-12 shrink-0">
                        <Star className="w-3 h-3 fill-[#FFB800] text-[#FFB800]" />
                        <span className="text-[10px] font-black text-[var(--text-primary)]">{star}</span>
                      </div>
                      <div className="flex-1 h-2 bg-[var(--input-bg)] rounded-full overflow-hidden border border-[var(--border-primary)]/30">
                        <div className="h-full bg-[#FFB800] rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[9px] font-black text-[var(--text-muted)] opacity-50 w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>

              {/* Individual Reviews */}
              {npsData.reviews.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 flex items-center gap-2">
                    <MessageCircle className="w-3 h-3" /> Feedbacks Individuais
                  </p>
                  <div className="space-y-2">
                    {npsData.reviews.map((review, idx) => (
                      <div key={idx} className="p-4 bg-[var(--bg-primary)]/50 rounded-2xl border border-[var(--border-primary)] space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[var(--accent-start)]/10 flex items-center justify-center text-[var(--accent-start)] text-[9px] font-black">
                              {review.nickname?.[0] || "?"}
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-[var(--text-primary)]">{review.nickname}</p>
                              <p className="text-[7px] font-bold text-[var(--text-muted)] opacity-40 uppercase tracking-widest">{review.matricula}</p>
                            </div>
                          </div>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={`w-3 h-3 ${s <= review.rating ? "fill-[#FFB800] text-[#FFB800]" : "text-black/[0.06]"}`} />
                            ))}
                          </div>
                        </div>
                        {review.feedback && (
                          <p className="text-[10px] text-[var(--text-primary)] font-medium leading-relaxed italic pl-9">
                            "{review.feedback}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {npsData.reviews.filter(r => r.feedback).length === 0 && npsData.reviewsCount > 0 && (
                <p className="text-center text-[9px] font-bold text-[var(--text-muted)] opacity-30 py-4">Nenhum feedback escrito registrado</p>
              )}
            </>
          ) : (
            <p className="text-center text-[9px] font-bold text-[var(--text-muted)] opacity-30 py-8">Erro ao carregar dados</p>
          )}
        </div>
      </GlassModal>

      {/* Reschedule Modal */}
      <GlassModal
        isOpen={isRescheduleModalOpen}
        onClose={closeRescheduleModal}
        title="Reagendar Participante"
        subtitle="Selecione um novo horário da mesma categoria para transferir o participante."
        maxWidth="max-w-xl"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
          {(() => {
            if (!attendeesModalEvent || !reschedulingAttendee) return null;

            const getCategoryString = (summary: string) => {
              if (!summary) return "";
              if (summary.toLowerCase().includes("1 to 1")) return "1 to 1";
              return summary.split(/[-:]/)[0].trim().toLowerCase();
            };

            const currentCategory = getCategoryString(attendeesModalEvent.summary);

            const availableEvents = events.filter(ev => {
              if (ev.statusLabel !== "futuro") return false;
              if (ev.id === attendeesModalEvent.id) return false;
              return getCategoryString(ev.summary) === currentCategory;
            });

            return (
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-[var(--text-muted)] opacity-60 uppercase tracking-widest border-b border-[var(--border-primary)] pb-2">
                  Filtrando por eventos do tipo: <span className="text-[var(--text-primary)] opacity-100">{currentCategory}</span>
                </p>

                {availableEvents.length > 0 ? (
                  <div className="space-y-3">
                    {availableEvents.map(ev => {
                      const isFull = ev.totalCapacity > 0 && ev.registeredCount >= ev.totalCapacity;
                      const vagasRestantes = ev.totalCapacity > 0 ? ev.totalCapacity - ev.registeredCount : 0;
                      const dateStr = format(parseISO(ev.start), "dd/MM/yyyy", { locale: ptBR });
                      const timeStr = format(parseISO(ev.start), "HH:mm");

                      return (
                        <div 
                          key={ev.id}
                          className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${isFull ? "bg-[var(--input-bg)]/40 border-[var(--border-primary)]/40 opacity-50" : "bg-[var(--bg-primary)]/50 border-[var(--border-primary)] hover:border-[var(--accent-start)]/30"}`}
                        >
                          <div>
                            <p className="text-xs font-black text-[var(--text-primary)]">{ev.summary}</p>
                            <p className="text-[10px] font-bold text-[var(--text-muted)] opacity-70">
                              {dateStr} às {timeStr}h • {ev.mentor}
                            </p>
                            {ev.totalCapacity > 0 && (
                              <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${isFull ? 'text-red-500' : 'text-green-500'}`}>
                                {isFull ? "Esgotado" : `${vagasRestantes} vagas restantes`}
                              </p>
                            )}
                          </div>
                          
                          <button
                            onClick={() => {
                              if (isFull || isRescheduling) return;
                              if (confirm(`Deseja realmente transferir ${reschedulingAttendee.nickname} para o evento "${ev.summary}" em ${dateStr} às ${timeStr}h?`)) {
                                handleReschedule(ev.id);
                              }
                            }}
                            disabled={isFull || isRescheduling}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isFull ? "bg-[var(--input-bg)] text-[var(--text-muted)] cursor-not-allowed" : "bg-[var(--accent-start)] text-white hover:opacity-90 shadow-md shadow-[var(--accent-start)]/20"}`}
                          >
                            {isFull ? "Sem Vagas" : "Transferir"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center border border-dashed border-[var(--border-primary)] rounded-2xl opacity-40">
                    <p className="text-[10px] font-black uppercase tracking-widest">Nenhum outro evento deste tipo agendado para o futuro.</p>
                  </div>
                )}

                {isRescheduling && (
                  <div className="flex items-center justify-center gap-2 py-4 text-amber-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Processando reagendamento e enviando e-mail de notificação...</span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </GlassModal>
    </div>
  );
}
