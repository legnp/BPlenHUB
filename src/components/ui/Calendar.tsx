"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  getISOWeek,
  getYear,
  parseISO,
  isToday,
  isBefore,
  startOfDay
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Loader2,
  Clock,
  ChevronDown,
  Filter,
  CheckCircle2,
  AlertCircle,
  Users,
  User,
  Tag,
  BadgeCheck
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { UserBooking } from "@/types/calendar";
import { bookEventAction, getUserBookingsAction } from "@/actions/calendar";
import { getOneToOneTypes } from "@/actions/OneToOneActions";
import GlassModal from "@/components/ui/GlassModal";
import { CALENDAR_CONFIG } from "@/config/calendarConfig";

/**
 * BPlen HUB — Calendar UI (Booking Edition)
 */

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string; // ISO String
  end?: string;
  htmlLink?: string;
  description?: string;
  status?: string;
  totalCapacity?: number;
  registeredCount?: number;
  mentor?: string;
  theme?: string | null;
}

interface CalendarProps {
  events?: CalendarEvent[];
  isLoading?: boolean;
  onMonthChange?: (date: Date) => void;
  onBookingSuccess?: (event?: CalendarEvent) => void;
  /**
   * Texto do card "Política de Agendamento". Quando omitido, usa a política
   * padrão (antecedência + janela de Onboarding + limite semanal). Cada
   * contexto pode passar a sua — ex.: o modal 1 to 1 (que não trata Onboarding
   * e precisa citar a regra de cancelamento).
   */
  policyNote?: React.ReactNode;
}

export default function Calendar({
  events = [],
  isLoading = false,
  onMonthChange,
  onBookingSuccess,
  policyNote
}: CalendarProps) {
  const { user, matricula, nickname } = useAuthContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterType, setFilterType] = useState("Todos");
  const [bookingStatus, setBookingStatus] = useState<{ id: string, message: string, type: 'success' | 'error' } | null>(null);

  // Estados do Modal de Confirmação
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [eventToConfirm, setEventToConfirm] = useState<CalendarEvent | null>(null);
  const [oneToOneTypes, setOneToOneTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [expectations, setExpectations] = useState("");
  const [isBooking, setIsBooking] = useState<string | null>(null);

  const [userBookings, setUserBookings] = useState<UserBooking[]>([]);

  // Carregar tipos 1-to-1 e agendamentos do usuário
  useEffect(() => {
    async function load() {
      const types = await getOneToOneTypes();
      setOneToOneTypes(types);
      
      if (matricula) {
        const bookings = await getUserBookingsAction(matricula);
        setUserBookings(bookings);
      }
    }
    load();
  }, [user, matricula]);

  // --- LÓGICA DE DADOS ---

  const eventTypes = useMemo(() => {
    const types = new Set<string>();
    events.forEach(ev => {
      if (ev.summary) types.add(ev.summary);
    });
    return ["Todos", ...Array.from(types).sort()];
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (filterType === "Todos") return events;
    return events.filter(ev => ev.summary === filterType);
  }, [events, filterType]);

  const selectedDayEvents = useMemo(() => {
    const now = new Date();
    const minLeadTime = addDays(startOfDay(now), CALENDAR_CONFIG.MIN_LEAD_TIME_DAYS);
    const maxOnboardingWindow = addDays(startOfDay(now), CALENDAR_CONFIG.MAX_ONBOARDING_WINDOW_DAYS);

    return filteredEvents.filter(ev => {
      const evDate = parseISO(ev.start);
      if (!isSameDay(evDate, selectedDate)) return false;
      if (isBefore(evDate, minLeadTime)) return false;
      if (ev.summary.toLowerCase().includes("onboarding")) {
        if (!isBefore(evDate, maxOnboardingWindow)) return false;
      }
      return true;
    });
  }, [filteredEvents, selectedDate]);

  // --- AÇÕES ---

  const handleBooking = async (eventId: string, oneToOneData?: { type: string; expectations: string }) => {
    if (!user || !matricula || !nickname) return;
    setIsBooking(eventId);
    setBookingStatus(null);
    try {
      const result = await bookEventAction(
        eventId, 
        user.uid, 
        user.email || "", 
        matricula, 
        nickname, 
        oneToOneData
      );
      if (result.success) {
        setBookingStatus({ id: eventId, message: "Agendamento realizado com sucesso!", type: 'success' });
        onBookingSuccess?.(eventToConfirm || undefined);
        setIsConfirmModalOpen(false);
        setExpectations("");
        setSelectedType("");
      } else {
        setBookingStatus({ id: eventId, message: result.message || "Erro ao agendar.", type: 'error' });
      }
    } catch (e) {
      setBookingStatus({ id: eventId, message: "Erro crítico no agendamento.", type: 'error' });
    } finally {
      setIsBooking(null);
    }
  };

  const openConfirmModal = (event: CalendarEvent) => {
    setEventToConfirm(event);
    setIsConfirmModalOpen(true);
    setBookingStatus(null);
  };

  const nextMonth = () => {
    const next = addMonths(currentDate, 1);
    setCurrentDate(next);
    onMonthChange?.(next);
  };

  const prevMonth = () => {
    const prev = subMonths(currentDate, 1);
    setCurrentDate(prev);
    onMonthChange?.(prev);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
    onMonthChange?.(today);
  };

  // --- RENDERIZAÇÃO ---

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500">

      {/* Header Bar: Filtros (Removido a pedido) */}
      {/* 2. Política de Agendamento */}
      <div className="flex flex-col md:flex-row gap-4 p-5 bg-[var(--accent-soft)] border border-[var(--border-primary)] rounded-3xl animate-in fade-in slide-in-from-top-2 duration-700">
        <div className="flex items-center gap-3 md:border-r md:border-[var(--border-primary)] md:pr-6 text-left">
          <div className="p-2 bg-[var(--bg-primary)] rounded-xl shadow-sm text-[var(--accent-end)]"><CalendarIcon className="w-4 h-4" /></div>
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none text-left">Política de<br />Agendamento</p>
        </div>
        <div className="flex-1 text-left">
          <p className="text-[10px] font-bold text-[var(--text-muted)] leading-relaxed italic text-left">
            {policyNote ?? (
              <>
                As sessões são liberadas com <span className="text-[var(--text-primary)] font-black">{CALENDAR_CONFIG.MIN_LEAD_TIME_DAYS} dias de antecedência</span>. Eventos de <span className="text-[var(--accent-start)] font-black">Onboarding</span> possuem visibilidade limitada a {CALENDAR_CONFIG.MAX_ONBOARDING_WINDOW_DAYS} dias. O limite de participação é de <span className="text-[var(--text-primary)] font-black uppercase">{CALENDAR_CONFIG.MAX_BOOKINGS_PER_WEEK} evento por semana (SI)</span>.
              </>
            )}
          </p>
        </div>
      </div>

      {/* 3. Grid Principal */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* COLUNA ESQUERDA: MINI CALENDAR + LEGENDA */}
        <div className="w-full lg:w-[360px] shrink-0 flex flex-col gap-4">
          <div className="bg-[var(--input-bg)] backdrop-blur-md rounded-3xl border border-[var(--input-border)] p-5 shadow-[0_8px_32_0_rgba(31,38,135,0.02)]">

            <div className="flex items-center justify-between mb-6 px-1 text-left">
              <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest leading-none">
                {format(currentDate, "MMMM yyyy", { locale: ptBR })}
              </h3>
              <div className="flex items-center gap-1">
                <button onClick={prevMonth} className="p-1.5 hover:bg-[var(--accent-soft)] rounded-lg transition-colors text-[var(--text-muted)] opacity-50 hover:opacity-100 hover:text-[var(--text-primary)]">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={goToToday} className="px-2.5 py-1 text-[10px] font-black bg-[var(--accent-start)]/10 text-[var(--accent-start)] hover:bg-[var(--accent-start)]/20 rounded-md transition-all uppercase">
                  Hoje
                </button>
                <button onClick={nextMonth} className="p-1.5 hover:bg-[var(--accent-soft)] rounded-lg transition-colors text-[var(--text-muted)] opacity-50 hover:opacity-100 hover:text-[var(--text-primary)]">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-8 gap-0.5">
              <div className="text-center py-2"><span className="text-[10px] font-black text-[var(--accent-end)] opacity-40 uppercase tracking-tighter">SI</span></div>
              {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
                <div key={i} className="text-center py-2"><span className="text-[10px] font-black text-[var(--text-muted)] opacity-30 uppercase">{d}</span></div>
              ))}

              {(() => {
                const monthStart = startOfMonth(currentDate);
                const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
                const endDate = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });
                const cells = [];
                let day = startDate;

                while (day <= endDate) {
                  const cloneDay = day;
                  const isSelected = isSameDay(day, selectedDate);
                  const isCurrentMonth = isSameMonth(day, monthStart);
                  const isCurrentDay = isToday(day);
                  const isPast = isBefore(day, startOfDay(new Date()));
                  const weekNumber = getISOWeek(day);

                  if (day.getDay() === 1 || day === startDate) {
                    cells.push(
                      <div key={`si-${day}`} className="flex items-center justify-center py-2.5">
                        <span className="text-[10px] font-black text-[var(--accent-end)] opacity-60">{weekNumber.toString().padStart(2, '0')}</span>
                      </div>
                    );
                  }

                  const now = new Date();
                  const leadDate = addDays(startOfDay(now), CALENDAR_CONFIG.MIN_LEAD_TIME_DAYS);
                  const maxOnboarding = addDays(startOfDay(now), CALENDAR_CONFIG.MAX_ONBOARDING_WINDOW_DAYS);

                  const hasVisibleEvents = filteredEvents.some(ev => {
                    const evDate = parseISO(ev.start);
                    if (!isSameDay(evDate, cloneDay)) return false;
                    if (isBefore(evDate, leadDate)) return false;
                    if (ev.summary.toLowerCase().includes("onboarding") && !isBefore(evDate, maxOnboarding)) return false;
                    return true;
                  });

                  cells.push(
                    <button
                      key={day.toString()}
                      onClick={() => setSelectedDate(cloneDay)}
                      className={`relative flex flex-col items-center justify-center py-2.5 rounded-xl transition-all duration-300 ${isSelected ? "bg-[var(--accent-start)] text-white shadow-lg shadow-[var(--accent-start)]/30 scale-105 z-10" :
                          isCurrentDay ? "bg-[var(--accent-start)]/10 text-[var(--accent-start)] font-bold" :
                            isCurrentMonth ? "text-[var(--text-primary)] font-medium" : "text-[var(--text-muted)] opacity-20"
                        } ${isPast && !isSelected && !isCurrentDay ? "opacity-30 grayscale saturate-0" : ""}`}
                    >
                      <span className="text-[11px] font-bold">{format(day, "d")}</span>
                      {hasVisibleEvents && !isSelected && (
                        <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isPast ? "bg-[var(--text-muted)] opacity-20" : "bg-[var(--accent-start)]"}`} />
                      )}
                    </button>
                  );
                  day = addDays(day, 1);
                }
                return cells;
              })()}
            </div>
          </div>

          {/* Legenda SI */}
          <div className="px-4 py-2 bg-transparent border-none animate-in fade-in slide-in-from-top-2 duration-700">
            <div className="flex items-start gap-3 group text-left">
              <div className="shrink-0 w-6 h-6 flex items-center justify-center bg-[var(--accent-end)]/5 rounded-lg border border-[var(--accent-end)]/10 transition-all group-hover:bg-[var(--accent-end)]/10">
                <span className="text-[10px] font-black text-[var(--accent-end)]">SI</span>
              </div>
              <div className="flex flex-col">
                <p className="text-[9px] font-black text-[var(--text-muted)] opacity-70 uppercase tracking-widest leading-none mb-1 text-left">Semana ISO</p>
                <p className="text-[9px] font-bold text-[var(--text-muted)] opacity-50 leading-relaxed italic text-left">
                  Padrão internacional de contagem utilizado para sincronização de cronogramas globais (SI-01 a SI-52).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: EVENT PANEL */}
        <div className="flex-1 w-full lg:h-[400px] bg-[var(--input-bg)]/20 backdrop-blur-[40px] rounded-3xl border border-[var(--input-border)] p-8 shadow-[0_8px_32_0_rgba(31,38,135,0.03)] flex flex-col">

          <div className="mb-4 text-left">
            <h4 className="text-[10px] font-black text-[var(--accent-start)] uppercase tracking-[0.2em] mb-1">PROGRAMAÇÃO DISPONÍVEL</h4>
            <h2 className="text-2xl font-black text-[var(--text-primary)] capitalize">
              {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </h2>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-4 custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-20">
                <Loader2 className="w-6 h-6 animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Aguarde...</p>
              </div>
            ) : selectedDayEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="p-4 bg-[var(--accent-soft)] rounded-full mb-4">
                  <CalendarIcon className="w-6 h-6 text-[var(--text-muted)] opacity-20" />
                </div>
                <h3 className="text-xs font-bold text-[var(--text-muted)] opacity-40 uppercase tracking-widest leading-relaxed">
                  Nenhuma sessão disponível para esta data<br />
                  <span className="text-[9px] opacity-50 lowercase tracking-normal">Consulte as regras de antecedência de {CALENDAR_CONFIG.MIN_LEAD_TIME_DAYS} dias</span>
                </h3>
              </div>
            ) : (
              selectedDayEvents.map(ev => {
                const capacity = ev.totalCapacity || 0;
                const registered = ev.registeredCount || 0;
                const isFull = registered >= capacity && capacity > 0;
                const status = bookingStatus?.id === ev.id ? bookingStatus : null;

                const evDate = parseISO(ev.start);
                const evWeek = getISOWeek(evDate);
                const evYear = getYear(evDate);
                const isWeekLocked = userBookings.some(b => b.week === evWeek && b.year === evYear);

                return (
                  <button
                    key={ev.id}
                    onClick={() => openConfirmModal(ev)}
                    disabled={isBooking === ev.id || isFull || isWeekLocked}
                    className={`group relative flex flex-col p-6 rounded-3xl transition-all duration-300 border text-left w-full focus:outline-none focus:ring-2 focus:ring-[var(--accent-start)]
                       ${isFull || isWeekLocked
                          ? "bg-[var(--bg-primary)]/20 border-[var(--border-primary)] opacity-50 grayscale cursor-not-allowed"
                          : isBooking === ev.id
                            ? "bg-[var(--accent-soft)] border-[var(--accent-start)]/50 cursor-wait opacity-80"
                            : "bg-[var(--bg-primary)]/40 border-[var(--border-primary)] hover:border-[var(--accent-start)] hover:bg-[var(--accent-soft)]/20 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                       }
                    `}
                  >
                    <div className="flex gap-5 w-full">
                      <div className="shrink-0 flex flex-col items-center gap-0.5 pt-0.5 min-w-[44px]">
                        <span className={`text-[12px] font-black ${isFull || isWeekLocked ? "text-[var(--text-muted)] opacity-50" : "text-[var(--text-primary)]"}`}>{format(evDate, "HH:mm")}</span>
                        <div className="w-px h-3 bg-[var(--text-muted)] opacity-20 my-0.5 rounded-full" />
                        <span className="text-[10px] font-black text-[var(--text-muted)] opacity-50">
                           {ev.end ? format(parseISO(ev.end), "HH:mm") : format(new Date(evDate.getTime() + 60 * 60000), "HH:mm")}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex justify-end items-start mb-0.5 gap-4">
                           {/* Compact and clear select button or status badge */}
                           {isBooking === ev.id ? (
                              <span className="text-[9px] px-2 py-1 bg-[var(--accent-start)]/10 rounded-md font-black tracking-widest uppercase text-[var(--accent-start)] animate-pulse shrink-0">Aguarde...</span>
                           ) : isFull ? (
                              <span className="text-[9px] px-2 py-1 bg-red-500/10 rounded-md font-black tracking-widest uppercase text-red-500 opacity-80 shrink-0">Esgotado</span>
                           ) : isWeekLocked ? (
                              <span className="text-[9px] px-2 py-1 bg-[var(--text-muted)]/10 rounded-md font-black tracking-widest uppercase text-[var(--text-muted)] opacity-60 shrink-0">Ocupado</span>
                           ) : (
                              <span className="text-[9px] px-2.5 py-1 bg-[var(--text-muted)]/5 group-hover:bg-[var(--accent-start)]/10 rounded-md font-black tracking-widest uppercase text-[var(--text-muted)] opacity-60 group-hover:opacity-100 group-hover:text-[var(--accent-start)] transition-all shrink-0">Selecionar</span>
                           )}
                        </div>

                        {/* Inline details to save space */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[10px] uppercase tracking-tight">
                           <div className="flex items-center gap-1.5">
                             <Users className="w-3 h-3 text-[var(--text-muted)] opacity-40 shrink-0" />
                             <span className={`font-bold ${isFull ? "text-red-500" : "text-[var(--text-muted)] opacity-70"}`}>
                               {isFull ? "SEM VAGAS" : `${capacity - registered} VAGAS`}
                             </span>
                           </div>

                           <div className="flex items-center gap-1.5">
                             <User className="w-3 h-3 text-[var(--text-muted)] opacity-40 shrink-0" />
                             <span className="font-bold text-[var(--text-muted)] opacity-70">
                               Orientador: <span className="text-[var(--text-primary)] opacity-90">{ev.mentor || "BPlen"}</span>
                             </span>
                           </div>

                           {ev.theme && (
                             <div className="flex items-center gap-1.5">
                               <Tag className="w-3 h-3 text-[var(--accent-start)] opacity-40 shrink-0" />
                               <span className="font-bold text-[var(--accent-start)] opacity-90">
                                 {ev.theme}
                               </span>
                             </div>
                           )}
                        </div>

                        {ev.description && (
                          <p className="text-[10px] text-[var(--text-muted)] opacity-60 line-clamp-1 italic leading-relaxed mt-2 text-left">
                            {ev.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {status && (
                      <div className={`mt-4 flex items-center gap-3 p-3 rounded-2xl animate-in slide-in-from-bottom-2 ${status.type === 'success' ? "bg-green-500/10 text-green-700 border border-green-500/20" : "bg-red-500/10 text-red-700 border border-red-500/20"
                        }`}>
                        {status.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        <span className="text-[10px] font-bold uppercase tracking-tight">{status.message}</span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE AGENDAMENTO */}
      <GlassModal
        isOpen={isConfirmModalOpen && !!eventToConfirm}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirmação de Agendamento"
        subtitle={`Podemos confirmar o agendamento da sessão de ${eventToConfirm?.summary}?`}
        maxWidth="max-w-lg"
      >
        <div className="space-y-6 mb-10">
          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-start)]/5 flex items-center justify-center text-[var(--accent-start)] border border-[var(--accent-start)]/10 group-hover:bg-[var(--accent-start)]/10 transition-all">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold text-[var(--text-muted)] opacity-40 uppercase tracking-widest leading-none mb-1">Data do Evento</p>
              <p className="text-sm font-bold text-[var(--text-primary)]">
                {eventToConfirm && format(parseISO(eventToConfirm.start), "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-end)]/5 flex items-center justify-center text-[var(--accent-end)] border border-[var(--accent-end)]/10 group-hover:bg-[var(--accent-end)]/10 transition-all">
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold text-[var(--text-muted)] opacity-40 uppercase tracking-widest leading-none mb-1">Horário Previsto</p>
              <p className="text-sm font-bold text-[var(--text-primary)]">
                {eventToConfirm && format(parseISO(eventToConfirm.start), "HH:mm")} — {eventToConfirm?.end ? format(parseISO(eventToConfirm.end), "HH:mm") : "..."}
              </p>
            </div>
          </div>

          {/* Campos Dinâmicos para 1 to 1 */}
          {eventToConfirm?.summary.toLowerCase().includes("1 to 1") && (
            <div className="space-y-4 pt-4 border-t border-[var(--border-primary)] animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-[var(--text-muted)] opacity-40 uppercase tracking-widest ml-1">Demanda do 1 to 1</label>
                <div className="relative">
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full pl-5 pr-10 py-4 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-start)]/20 appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-[var(--bg-primary)]">Selecione o motivo...</option>
                    {oneToOneTypes.map((type, idx) => (
                      <option key={idx} value={type} className="bg-[var(--bg-primary)]">{type}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] opacity-20 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-[var(--text-muted)] opacity-40 uppercase tracking-widest ml-1">Expectativas do Encontro</label>
                <textarea
                  value={expectations}
                  onChange={(e) => setExpectations(e.target.value)}
                  placeholder="O que você espera desta reunião? Quais pontos deseja abordar?"
                  className="w-full p-5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-start)]/20 min-h-[120px] resize-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => eventToConfirm && handleBooking(eventToConfirm.id, eventToConfirm.summary.toLowerCase().includes("1 to 1") ? { type: selectedType, expectations } : undefined)}
            disabled={isBooking === eventToConfirm?.id || (eventToConfirm?.summary.toLowerCase().includes("1 to 1") && !selectedType)}
            className="w-full py-5 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
          >
            <div className="relative z-10 flex items-center justify-center gap-2">
              {isBooking === eventToConfirm?.id ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <BadgeCheck className="w-5 h-5" />
              )}
              {isBooking === eventToConfirm?.id ? "PROCESSANDO..." : "CONFIRMAR E AGENDAR"}
            </div>
          </button>
          <p className="text-[9px] text-[var(--text-muted)] opacity-40 font-bold uppercase tracking-widest text-center">
            Ao confirmar, um e-mail com os detalhes será enviado para você.
          </p>
        </div>
      </GlassModal>
    </div>
  );
}
