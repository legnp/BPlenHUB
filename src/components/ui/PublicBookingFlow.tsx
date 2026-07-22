"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  parseISO,
  isToday,
  isBefore,
  startOfDay,
  isSaturday,
  isSunday,
  setHours,
  setMinutes,
  differenceInDays,
  addMinutes
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
  Calendar as CalendarIcon,
  Sparkles,
  X
} from "lucide-react";
import { InputGlass } from "./InputGlass";
import { NavButton } from "./NavButton";
import {
  getPublicSlotsAction,
  bookPublicMeetingAction,
  getPublicAvailableDaysAction,
  submitBookingProposalAction,
  TimeSlot
} from "@/actions/external-booking";
import { CALENDAR_CONFIG } from "@/config/calendarConfig";

type Step = "lead" | "triagem" | "calendar" | "success";

// --- HELPERS PARA VALIDAÇÃO ---
const getLevenshteinDistance = (a: string, b: string) => {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
};

const COUNTRY_CODES = [
  // Top 3 Prioritários
  { code: "+55", label: "🇧🇷 BR +55", iso: "BR" },
  { code: "+1", label: "🇺🇸 US +1", iso: "US" },
  { code: "+351", label: "🇵🇹 PT +351", iso: "PT" },
  
  // Américas (Sul, Central, Norte e Caribe)
  { code: "+54", label: "🇦🇷 AR +54", iso: "AR" },
  { code: "+56", label: "🇨🇱 CL +56", iso: "CL" },
  { code: "+57", label: "🇨🇴 CO +57", iso: "CO" },
  { code: "+52", label: "🇲🇽 MX +52", iso: "MX" },
  { code: "+598", label: "🇺🇾 UY +598", iso: "UY" },
  { code: "+591", label: "🇧🇴 BO +591", iso: "BO" },
  { code: "+593", label: "🇪🇨 EC +593", iso: "EC" },
  { code: "+51", label: "🇵🇪 PE +51", iso: "PE" },
  { code: "+595", label: "🇵🇾 PY +595", iso: "PY" },
  { code: "+58", label: "🇻🇪 VE +58", iso: "VE" },
  { code: "+507", label: "🇵🇦 PA +507", iso: "PA" },
  { code: "+506", label: "🇨🇷 CR +506", iso: "CR" },
  { code: "+502", label: "🇬🇹 GT +502", iso: "GT" },
  { code: "+503", label: "🇸🇻 SV +503", iso: "SV" },
  { code: "+504", label: "🇭🇳 HN +504", iso: "HN" },
  { code: "+505", label: "🇳🇮 NI +505", iso: "NI" },
  { code: "+501", label: "🇧🇿 BZ +501", iso: "BZ" },
  { code: "+53", label: "🇨🇺 CU +53", iso: "CU" },
  { code: "+509", label: "🇭🇹 HT +509", iso: "HT" },

  // Europa
  { code: "+34", label: "🇪🇸 ES +34", iso: "ES" },
  { code: "+44", label: "🇬🇧 GB +44", iso: "GB" },
  { code: "+33", label: "🇫🇷 FR +33", iso: "FR" },
  { code: "+49", label: "🇩🇪 DE +49", iso: "DE" },
  { code: "+39", label: "🇮🇹 IT +39", iso: "IT" },
  { code: "+41", label: "🇨🇭 CH +41", iso: "CH" },
  { code: "+353", label: "🇮🇪 IE +353", iso: "IE" },
  { code: "+31", label: "🇳🇱 NL +31", iso: "NL" },
  { code: "+32", label: "🇧🇪 BE +32", iso: "BE" },
  { code: "+43", label: "🇦🇹 AT +43", iso: "AT" },
  { code: "+48", label: "🇵🇱 PL +48", iso: "PL" },
  { code: "+46", label: "🇸🇪 SE +46", iso: "SE" },
  { code: "+47", label: "🇳🇴 NO +47", iso: "NO" },
  { code: "+45", label: "🇩🇰 DK +45", iso: "DK" },

  // Ásia e Oceania
  { code: "+81", label: "🇯🇵 JP +81", iso: "JP" },
  { code: "+86", label: "🇨🇳 CN +86", iso: "CN" },
  { code: "+82", label: "🇰🇷 KR +82", iso: "KR" },
  { code: "+91", label: "🇮🇳 IN +91", iso: "IN" },
  { code: "+65", label: "🇸🇬 SG +65", iso: "SG" },
  { code: "+61", label: "🇦🇺 AU +61", iso: "AU" },
  { code: "+64", label: "🇳🇿 NZ +64", iso: "NZ" },

  // Oriente Médio
  { code: "+971", label: "🇦🇪 AE +971", iso: "AE" },
  { code: "+966", label: "🇸🇦 SA +966", iso: "SA" },
  { code: "+972", label: "🇮🇱 IL +972", iso: "IL" },
  { code: "+974", label: "🇶🇦 QA +974", iso: "QA" },

  // África (Lusófonos e Principais)
  { code: "+244", label: "🇦🇴 AO +244", iso: "AO" },
  { code: "+258", label: "🇲🇿 MZ +258", iso: "MZ" },
  { code: "+238", label: "🇨🇻 CV +238", iso: "CV" },
  { code: "+27", label: "🇿🇦 ZA +27", iso: "ZA" }
];

/**
 * variant "section" (default): uso em seção rolável (home BookingSection) — layout atual.
 * variant "page" (/agendar): header normalizado ao padrão /servicos (kicker + tokens) e
 * card dimensionado para caber em 1 viewport sem scroll de página (item 11 F1-01).
 */
export function PublicBookingFlow({ variant = "section" }: { variant?: "section" | "page" }) {
  const isPage = variant === "page";
  const [step, setStep] = useState<Step>("calendar");
  const [isProposalMode, setIsProposalMode] = useState(false);
  const [proposalOptions, setProposalOptions] = useState<{ date: string; time: string }[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneDDI: "+55",
    phoneDDD: "",
    phoneNumber: "",
    screening: {
      objetivo: "",
      conheceu_como: "",
      cargo: ""
    }
  });

  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(addDays(startOfDay(new Date()), 3));
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [currentDayBlockers, setCurrentDayBlockers] = useState<{ start: string; end: string }[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsLoadFailed, setSlotsLoadFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [showPhoneWarning, setShowPhoneWarning] = useState(false);

  const fetchAvailableDays = useCallback(async () => {
    try {
      const res = await getPublicAvailableDaysAction();
      setAvailableDays(res);
      if (res.length > 0) {
        setSelectedDate(parseISO(res[0]));
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchAvailableDays();
  }, [fetchAvailableDays]);

  const fetchSlots = useCallback(async (date: Date) => {
    setIsLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const res = await getPublicSlotsAction(format(date, "yyyy-MM-dd"));
      // Falha ao carregar != sem horarios (BUG-089): sem os bloqueadores, o modo
      // de proposta trataria slots bloqueados como livres. Marca a falha e limpa a
      // grade para a tela mostrar o erro, nunca disponibilidade inventada.
      if (res.error) {
        setSlots([]);
        setCurrentDayBlockers([]);
        setSlotsLoadFailed(true);
      } else {
        setSlots(res.slots);
        setCurrentDayBlockers(res.blockers);
        setSlotsLoadFailed(false);
      }
    } catch (err) {
      console.error(err);
      setSlots([]);
      setCurrentDayBlockers([]);
      setSlotsLoadFailed(true);
    } finally {
      setIsLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (step === "calendar") {
      fetchSlots(selectedDate);
    }
  }, [step, selectedDate, fetchSlots]);

  const handleBooking = async () => {
    if (!selectedSlot && proposalOptions.length === 0) return;
    setIsSubmitting(true);
    setError(null);
    try {
      if (isProposalMode) {
        const res = await submitBookingProposalAction({
          name: formData.name,
          email: formData.email,
          phone: `${formData.phoneDDI} ${formData.phoneDDD}${formData.phoneNumber}`,
          screening: formData.screening,
          options: proposalOptions
        });
        if (res.success) {
          setStep("success");
        } else {
          setError(res.message || "Erro ao enviar proposta.");
        }
      } else {
        const res = await bookPublicMeetingAction({
          name: formData.name,
          email: formData.email,
          phone: `${formData.phoneDDI} ${formData.phoneDDD}${formData.phoneNumber}`,
          screening: formData.screening,
          slot: selectedSlot!
        });
        if (res.success) {
          setStep("success");
        } else {
          setError(res.message || "Erro ao confirmar agendamento.");
        }
      }
    } catch (err) {
      console.error(err);
      setError("Erro de rede. Verifique sua conexão.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  // --- GOVERNANCE DATES ---
  const { minMaxDates } = useMemo(() => {
    const now = startOfDay(new Date());
    return {
      minMaxDates: {
        min: addDays(now, CALENDAR_CONFIG.PUBLIC_BOOKING_SETTINGS.minDaysInFuture),
        max: addDays(now, CALENDAR_CONFIG.PUBLIC_BOOKING_SETTINGS.maxDaysInFuture)
      }
    };
  }, []);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // --- CALENDAR GRID LOGIC ---
  const calendarCells = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 0 });

    const cells = [];
    let day = startDate;

    while (day <= endDate) {
      cells.push(day);
      day = addDays(day, 1);
    }
    return cells;
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    // Selecionamos o primeiro dia válido se hoje for bloqueado pela regra de 3 dias
    const minDate = minMaxDates.min;
    if (isBefore(today, minDate)) {
      setSelectedDate(minDate);
    } else {
      setSelectedDate(today);
    }
  };

  const proposalSlots = useMemo(() => {
    // Gerar slots de 30 minutos entre 06:00 e 21:00
    const result = [];
    for (let h = 6; h <= 21; h++) {
      result.push(`${h.toString().padStart(2, '0')}:00`);
      if (h < 21) result.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return result;
  }, []);

  /**
   * Horarios que o lead pode propor: a grade menos o que esta ocupado na agenda.
   * Horario ocupado nao e exibido (decisao da Gestora, 2026-07-16) — antes ficava
   * na tela esmaecido com o rotulo "OCUPADO".
   */
  const availableProposalSlots = useMemo(() => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const durationMs = CALENDAR_CONFIG.PUBLIC_BOOKING_SETTINGS.defaultDuration * 60 * 1000;

    // Evento de dia inteiro chega como "YYYY-MM-DD" (10 chars) e cobre o dia todo.
    const toMs = (iso: string, isEnd = false) => {
      if (iso.length === 10) {
        const d = parseISO(iso);
        return startOfDay(d).getTime() + (isEnd ? (24 * 60 * 60 * 1000) - 1 : 0);
      }
      return parseISO(iso).getTime();
    };

    return proposalSlots.filter((time) => {
      const startMs = parseISO(`${dateStr}T${time}:00`).getTime();
      const endMs = startMs + durationMs;
      // Sobreposicao: (InicioA < FimB) && (InicioB < FimA)
      return !currentDayBlockers.some(b => startMs < toMs(b.end, true) && toMs(b.start) < endMs);
    });
  }, [proposalSlots, currentDayBlockers, selectedDate]);

  const toggleProposalOption = (time: string) => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const exists = proposalOptions.find(o => o.date === dateStr && o.time === time);
    if (exists) {
      setProposalOptions(proposalOptions.filter(o => !(o.date === dateStr && o.time === time)));
    } else {
      if (proposalOptions.length >= 3) return;
      setProposalOptions([...proposalOptions, { date: dateStr, time }]);
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto px-4 ${isPage ? "pb-2" : "py-4"}`}>
      {/* Header — normalizado ao padrao /servicos (icone + kicker + tokens) no variant "page" */}
      <div className={`text-center animate-in fade-in slide-in-from-top-4 duration-1000 ${isPage ? "mb-3 space-y-2" : "mb-4 space-y-1.5"}`}>
        {isPage && (
          <>
            {/* Caixa de icone identica as paginas de produto (/servicos) */}
            <div className="mb-6 p-4 bg-white/5 rounded-2xl w-fit mx-auto border border-white/10 shadow-2xl">
              <CalendarIcon className="w-8 h-8 text-[var(--accent-start)]" />
            </div>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--accent-start)] block mb-3">
              Agende sua conversa
            </span>
          </>
        )}
        <h1 className={`tracking-tighter text-[var(--text-primary)] leading-[1.1] ${isPage ? "text-3xl md:text-5xl font-bold" : "text-[30px] font-black"}`}>
          Reserve seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)]">Momento BPlen</span>
        </h1>
        <p className={`text-[var(--text-muted)] opacity-70 font-medium mx-auto leading-relaxed ${isPage ? "text-sm md:text-base max-w-2xl" : "text-sm max-w-xl"}`}>
          Que tal descomplicarmos o desenvolvimento humano no trabalho juntos? <br />
          Escolha um slot abaixo e receba a confirmação em seu e-mail.
        </p>
      </div>

      <div className={`w-full max-w-4xl mx-auto p-4 sm:p-5 bg-[var(--glass-bg)] backdrop-blur-3xl border border-[var(--border-primary)] rounded-[40px] shadow-2xl relative overflow-hidden group transition-all duration-700 flex flex-col ${isPage ? "min-h-[420px] sm:min-h-[480px] justify-start" : "min-h-[600px] justify-center"}`}>

        {/* 🔮 Glow Decoration */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[var(--accent-start)]/20 rounded-full blur-3xl group-hover:bg-[var(--accent-start)]/30 transition-all duration-700" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[var(--accent-end)]/20 rounded-full blur-3xl opacity-50" />

        <AnimatePresence mode="wait">

          {step === "lead" && (
            <motion.div key="lead" {...containerVariants} className="space-y-6 relative z-10 max-w-xl mx-auto w-full">
              <div className="space-y-2 text-left">
                <h3 className="text-2xl font-black bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-muted)] bg-clip-text text-transparent">
                  Agende sua Reunião
                </h3>
                <p className="text-[var(--accent-start)] text-[10px] font-black uppercase tracking-[0.2em]">
                  PRIMEIRO UMA BOA CONVERSA, E DEPOIS MÃOS A OBRA!
                </p>
              </div>

              <div className="space-y-4">
                <InputGlass
                  label="Nome Completo"
                  placeholder="Como devemos te chamar?"
                  value={formData.name}
                  className="text-sm"
                  required
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />

                <div className="space-y-1.5 text-left relative">
                  <InputGlass
                    label="Seu melhor e-mail"
                    placeholder="seu@email.com"
                    type="email"
                    value={formData.email}
                    className="text-sm"
                    required
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase(); // Normalizar para minúsculas
                      setFormData({ ...formData, email: val });

                      // 1. Validação de Formato (Geral)
                      const isInvalid = val.length > 3 && !isValidEmail(val);

                      // 2. Scanner de Inteligente de Erros (Domínios Populares)
                      const domains = [
                        'gmail.com', 'hotmail.com', 'hotmail.com.br', 'outlook.com', 'outlook.com.br',
                        'yahoo.com', 'yahoo.com.br', 'icloud.com', 'bplen.com',
                        'bol.com.br', 'uol.com.br', 'terra.com.br', 'me.com', 'protonmail.com', 'zoho.com',
                        'aol.com', 'live.com', 'msn.com', 'globo.com', 'ig.com.br'
                      ];
                      
                      const parts = val.split('@');
                      if (parts.length !== 2) {
                        setEmailError(isInvalid ? "Por favor, insira um e-mail válido" : null);
                        return;
                      }

                      const domain = parts[1];

                      // Se o domínio já for um dos conhecidos, não sugere nada e limpa erro
                      if (domains.includes(domain)) {
                        setEmailError(null);
                        return;
                      }

                      if (isInvalid) {
                        setEmailError("Por favor, insira um e-mail válido");
                      } else if (domain && domain.length > 2) {
                        // Busca o domínio mais próximo (Fuzzy Match)
                        let bestMatch = null;
                        let minDistance = 3; // Tolerância máxima de erro (edita até 2 caracteres)

                        for (const d of domains) {
                          const distance = getLevenshteinDistance(domain, d);
                          if (distance < minDistance) {
                            minDistance = distance;
                            bestMatch = d;
                          }
                        }

                        // Se encontrou algo muito próximo, sugere
                        if (bestMatch && bestMatch !== domain) {
                          setEmailError(`Ops! Você quis dizer @${bestMatch}?`);
                        } else {
                          setEmailError(null);
                        }
                      } else {
                        setEmailError(null);
                      }
                    }}
                  />
                  {emailError && (
                    <p className="absolute -bottom-5 left-1 text-[9px] font-bold text-[var(--accent-start)] flex items-center gap-1 animate-pulse">
                      <AlertCircle className="w-3 h-3" />
                      {emailError}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 text-left relative">
                  <label className="text-[10px] text-[var(--text-muted)] opacity-50 font-black uppercase tracking-[0.2em] ml-1">
                    WhatsApp / Telefone <span className="text-red-500 ml-0.5">*</span>
                  </label>

                  <div className="flex gap-2">
                    {/* Seletor de País (DDI) */}
                    <select
                      className="w-32 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl text-[11px] text-[var(--text-primary)] p-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-start)] appearance-none cursor-pointer"
                      value={formData.phoneDDI}
                      onChange={(e) => setFormData({ ...formData, phoneDDI: e.target.value, phoneDDD: "" })}
                    >
                      {COUNTRY_CODES.map((country) => (
                        <option key={`${country.iso}-${country.code}`} value={country.code} className="bg-[var(--bg-primary)]">
                          {country.label}
                        </option>
                      ))}
                    </select>

                    {/* DDD Condicional */}
                    {formData.phoneDDI === "+55" ? (
                      <select
                        className="w-24 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl text-[11px] text-[var(--text-primary)] p-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-start)] appearance-none"
                        value={formData.phoneDDD}
                        onChange={(e) => setFormData({ ...formData, phoneDDD: e.target.value })}
                      >
                        <option value="" disabled className="bg-[var(--bg-primary)]">DDD</option>
                        {[11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99].map(ddd => (
                          <option key={ddd} value={ddd} className="bg-[var(--bg-primary)]">{ddd}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        placeholder="Cód."
                        maxLength={4}
                        value={formData.phoneDDD}
                        className="w-20 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl text-[11px] text-[var(--text-primary)] p-3 text-center focus:outline-none focus:ring-1 focus:ring-[var(--accent-start)]"
                        onChange={(e) => setFormData({ ...formData, phoneDDD: e.target.value.replace(/\D/g, "") })}
                      />
                    )}

                    {/* Número Blindado */}
                    <input
                      placeholder="Número"
                      className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl text-[11px] text-[var(--text-primary)] p-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-start)]"
                      value={formData.phoneNumber}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/[^0-9]/.test(val)) {
                          setShowPhoneWarning(true);
                        } else {
                          setShowPhoneWarning(false);
                        }
                        setFormData({ ...formData, phoneNumber: val.replace(/\D/g, "") });
                      }}
                    />
                  </div>
                  {showPhoneWarning && (
                    <p className="absolute -bottom-5 right-1 text-[9px] font-bold text-[var(--accent-start)] flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      O campo aceita somente números
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <button onClick={() => setStep("calendar")} className="text-[10px] font-black text-[var(--text-muted)] opacity-40 hover:opacity-100 hover:text-[var(--text-primary)] uppercase tracking-widest transition-all">
                  Voltar ao Calendário
                </button>
                <NavButton
                  onClick={() => setStep("triagem")}
                  disabled={!formData.name || !isValidEmail(formData.email) || !formData.phoneNumber || (formData.phoneDDI === "+55" && !formData.phoneDDD)}
                />
              </div>
            </motion.div>
          )}

          {step === "triagem" && (
            <motion.div key="triagem" {...containerVariants} className="space-y-6 relative z-10 text-left max-w-xl mx-auto w-full">
              <div className="flex items-center gap-2">
                <button onClick={() => setStep("lead")} className="p-2 hover:bg-[var(--accent-soft)] rounded-full transition-all">
                  <ChevronLeft className="w-5 h-5 text-[var(--text-muted)]" />
                </button>
                <h3 className="text-xl font-black text-[var(--text-primary)]">Demanda da reunião</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[var(--text-muted)] opacity-50 font-black uppercase tracking-[0.2em] ml-1">
                    Qual o objetivo da reunião? <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <textarea
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] backdrop-blur-md rounded-2xl p-4 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-start)] transition-all min-h-[120px]"
                    placeholder="Conte um pouco sobre o que você busca..."
                    value={formData.screening.objetivo}
                    onChange={(e) => setFormData({ ...formData, screening: { ...formData.screening, objetivo: e.target.value } })}
                  />
                </div>

                <InputGlass
                  label="Sua Profissão / Cargo"
                  placeholder="Ex: Diretor de RH, Consultor..."
                  value={formData.screening.cargo}
                  onChange={(e) => setFormData({ ...formData, screening: { ...formData.screening, cargo: e.target.value } })}
                />

                <div className="space-y-1.5">
                  <label className="text-[10px] text-[var(--text-muted)] opacity-50 font-black uppercase tracking-[0.2em] ml-1">Como conheceu a BPlen?</label>
                  <select
                    value={formData.screening.conheceu_como}
                    onChange={(e) => setFormData({ ...formData, screening: { ...formData.screening, conheceu_como: e.target.value } })}
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl p-4 text-sm text-[var(--text-primary)] focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="" disabled className="bg-[var(--bg-primary)]">Selecione uma opção...</option>
                    <option value="Linkedin" className="bg-[var(--bg-primary)]">LinkedIn</option>
                    <option value="Instagram" className="bg-[var(--bg-primary)]">Instagram</option>
                    <option value="Google" className="bg-[var(--bg-primary)]">Google</option>
                    <option value="Lisandra Lencina" className="bg-[var(--bg-primary)]">Lisandra Lencina</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <div className="flex flex-col items-end gap-2">
                  {error && (
                    <p className="text-[10px] font-bold text-red-500 animate-pulse flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {error}
                    </p>
                  )}
                  <button
                    onClick={handleBooking}
                    disabled={!formData.screening.objetivo || isSubmitting}
                    className="h-12 px-8 bg-[var(--accent-start)] text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                    {isSubmitting ? "PROCESSANDO..." : "CONCLUIR AGENDAMENTO"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === "calendar" && (
            <motion.div key="calendar" {...containerVariants} className="space-y-6 relative z-10 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-[var(--text-primary)]">
                    {isProposalMode ? "Propor Novos Horários" : "Escolha um Horário"}
                  </h3>
                </div>
                <div className="flex items-center gap-4">
                  {/* Removido: AGENDA VIRTUAL 📺 */}
                </div>
              </div>

              {isProposalMode && (
                <div className="py-2.5 px-4 bg-[var(--accent-soft)] border border-[var(--accent-start)]/20 rounded-xl">
                  <p className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">
                    <Sparkles className="w-4 h-4 inline-block mr-2 text-[var(--accent-start)]" />
                    <b>Não encontrou uma boa agenda?</b> Sugira até 3 opções de datas e horários e entraremos em contato para confirmar!
                  </p>
                </div>
              )}

              <div className="flex flex-col lg:grid lg:grid-cols-[1fr_320px] gap-8">

                {/* --- MINI CALENDAR GRID --- */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">
                      {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={goToToday}
                        className="px-2 py-1 bg-[var(--accent-soft)] hover:opacity-80 border border-[var(--border-primary)] rounded-lg text-[9px] font-black text-[var(--accent-start)] uppercase tracking-widest transition-all"
                      >
                        Hoje
                      </button>
                      <div className="flex items-center gap-0.5">
                        <button onClick={prevMonth} className="p-1.5 hover:bg-[var(--accent-soft)] rounded-lg transition-all text-[var(--text-muted)] opacity-50 hover:opacity-100 hover:text-[var(--text-primary)]">
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={nextMonth} className="p-1.5 hover:bg-[var(--accent-soft)] rounded-lg transition-all text-[var(--text-muted)] opacity-50 hover:opacity-100 hover:text-[var(--text-primary)]">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-8 gap-1">
                    <div className="text-center py-2"><span className="text-[9px] font-black text-[var(--accent-end)] uppercase tracking-tighter opacity-70">SI</span></div>
                    {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                      <div key={i} className="text-center py-2"><span className="text-[9px] font-black text-[var(--text-muted)] opacity-30 uppercase">{d}</span></div>
                    ))}

                    {calendarCells.map((day, idx) => {
                      const isSelected = isSameDay(day, selectedDate);
                      const isCurrentMonth = isSameMonth(day, currentMonth);
                      const dayISO = format(day, "yyyy-MM-dd");
                      const isAvailable = availableDays.includes(dayISO);
                      const weekNumber = getISOWeek(day);
                      const dayStart = startOfDay(day);
                      const diffDays = differenceInDays(dayStart, startOfDay(new Date()));
                      const isOutsideRange = diffDays < 3 || diffDays > 33;

                      return (
                        <React.Fragment key={day.toString()}>
                          {(idx % 7 === 0) && (
                            <div className="flex items-center justify-center py-2 opacity-70">
                              <span className="text-[10px] font-black text-[var(--accent-start)]">{weekNumber.toString().padStart(2, '0')}</span>
                            </div>
                          )}
                          <button
                            onClick={() => {
                              if (isProposalMode) {
                                // Em modo proposta, apenas dias úteis E dentro do range 3-33
                                if (!isSaturday(day) && !isSunday(day) && !isOutsideRange) {
                                  setSelectedDate(day);
                                }
                              } else {
                                if (isAvailable && !isOutsideRange) {
                                  setSelectedDate(day);
                                }
                              }
                            }}
                            disabled={(() => {
                              if (isProposalMode) {
                                return isSaturday(day) || isSunday(day) || isOutsideRange;
                              }
                              return isOutsideRange || (!isAvailable && !isSelected);
                            })()}
                            className={`relative flex flex-col items-center justify-center aspect-square rounded-xl transition-all duration-300 border m-auto w-full max-w-[36px]
                                       ${isSelected
                                ? "bg-[var(--accent-start)] border-[var(--accent-start)] text-white shadow-xl shadow-[var(--accent-start)]/30 scale-105 z-10"
                                : isToday(day)
                                  ? "bg-[var(--accent-start)]/10 border-white/5 text-[var(--accent-start)] font-bold"
                                  : isProposalMode
                                    ? (() => {
                                      return (!isSaturday(day) && !isSunday(day) && !isOutsideRange)
                                        ? isCurrentMonth ? "text-[var(--text-primary)] bg-[var(--input-bg)] border-[var(--input-border)] hover:border-[var(--accent-start)]/50" : "text-[var(--text-muted)] opacity-20 border-transparent"
                                        : "opacity-10 cursor-not-allowed cursor-default";
                                    })()
                                    : isAvailable && !isOutsideRange
                                      ? isCurrentMonth ? "text-[var(--text-primary)] bg-[var(--input-bg)] border-[var(--input-border)] hover:border-[var(--accent-start)]/50" : "text-[var(--text-muted)] opacity-20 border-transparent"
                                      : "text-[var(--text-muted)] opacity-10 border-transparent cursor-default"
                              }`}
                          >
                            <span className="text-xs font-bold">{format(day, "d")}</span>
                          </button>
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* 📊 Preview das Opções Selecionadas (Modo Proposta) */}
                  {isProposalMode && proposalOptions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="pt-6 space-y-3 border-t border-[var(--border-primary)]"
                    >
                      <h5 className="text-[10px] font-black text-[var(--text-muted)] opacity-40 uppercase tracking-[0.2em] px-1">Seu roteiro sugerido:</h5>
                      <div className="grid grid-cols-1 gap-1">
                        {proposalOptions.map((opt, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between py-1.5 px-4 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl group/item hover:border-[var(--accent-start)]/30 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-1 h-1 rounded-full bg-[var(--accent-start)] shadow-[0_0_8px_var(--accent-start)]" />
                              <span className="text-[10px] font-bold text-[var(--text-primary)] tracking-tight uppercase">
                                {format(parseISO(opt.date), "dd 'de' MMM", { locale: ptBR })} — <span className="text-[var(--accent-start)]">{opt.time}</span>
                              </span>
                            </div>
                            <button
                              onClick={() => setProposalOptions(proposalOptions.filter((_, i) => i !== idx))}
                              className="p-1.5 hover:bg-red-500/10 rounded-xl transition-all opacity-40 group-hover/item:opacity-100 hover:text-red-500"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {!isProposalMode && (
                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-3">
                      <p className="text-[9px] text-[var(--text-muted)] opacity-40 uppercase tracking-[0.2em] font-black">Agenda ruim?</p>
                      <button
                        onClick={() => {
                          setIsProposalMode(true);
                          setSelectedSlot(null);
                        }}
                        className="text-[9px] font-black text-[var(--accent-start)] uppercase tracking-[0.2em] hover:opacity-70 transition-all border-b border-dashed border-[var(--accent-start)]/40 pb-0.5"
                      >
                        Propor novos horários
                      </button>
                    </div>
                  )}
                </div>

                {/* --- SLOTS LIST --- */}
                <div className="flex flex-col h-full space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-[9px] font-black text-[var(--accent-start)] uppercase tracking-[0.2em]">PROGRAMAÇÃO DISPONÍVEL</h4>
                    <p className="text-lg font-black text-[var(--text-primary)] capitalize">
                      {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>

                  <div className="flex-1 min-h-[180px] max-h-[240px] overflow-y-auto pr-4 space-y-2 custom-scrollbar">
                    {isLoadingSlots ? (
                      <div className="h-full flex flex-col items-center justify-center gap-3 opacity-20 py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-[var(--text-primary)]" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-primary)]">Buscando horários</span>
                      </div>
                    ) : slotsLoadFailed ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-20 gap-3">
                        <AlertCircle className="w-6 h-6 text-[var(--text-muted)] opacity-30" />
                        <p className="text-[10px] font-bold text-[var(--text-muted)] opacity-60 uppercase tracking-widest max-w-[220px]">Não foi possível carregar a agenda. Tente novamente em instantes.</p>
                      </div>
                    ) : (isProposalMode ? availableProposalSlots : slots).length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-20">
                        <CalendarIcon className="w-6 h-6 text-[var(--text-muted)] opacity-20 mb-4" />
                        <p className="text-[10px] font-bold text-[var(--text-muted)] opacity-30 uppercase tracking-widest">Nenhum horário livre.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {isProposalMode ? (
                          availableProposalSlots.map((time) => {
                            const dateStr = format(selectedDate, "yyyy-MM-dd");
                            const isSelectedOption = proposalOptions.some(o => o.date === dateStr && o.time === time);

                            return (
                              <button
                                key={time}
                                onClick={() => toggleProposalOption(time)}
                                className={`py-2 rounded-xl text-xs font-black transition-all border flex flex-col items-center justify-center cursor-pointer
                                           ${isSelectedOption
                                    ? "bg-[var(--accent-start)] border-[var(--accent-start)] text-white shadow-lg"
                                    : "bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-primary)] hover:bg-[var(--accent-soft)] hover:border-[var(--accent-start)]/30"}`}
                              >
                                {time}
                              </button>
                            );
                          })
                        ) : (
                          slots.map((s) => (
                            <button
                              key={s.id}
                              disabled={!s.available}
                              onClick={() => setSelectedSlot(s.id)}
                              className={`py-2 rounded-xl text-xs font-black transition-all border flex flex-col items-center justify-center
                                         ${!s.available ? "opacity-10 cursor-not-allowed grayscale" : "cursor-pointer"}
                                         ${selectedSlot === s.id
                                  ? "bg-[var(--accent-start)] border-[var(--accent-start)] text-white shadow-[0_10px_20px_rgba(var(--accent-start-rgb),0.3)] scale-[1.02]"
                                  : "bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-primary)] hover:bg-[var(--accent-soft)] hover:border-[var(--accent-start)]/30"}`}
                            >
                              <div className="flex items-center justify-center gap-2">
                                <Clock className="w-3 h-3 opacity-30" />
                                {format(parseISO(s.start), "HH:mm")}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>


                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-[10px] font-black">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="pt-2 flex flex-col gap-3">
                    {isProposalMode && (
                      <div className="flex items-center justify-between px-2">
                        <p className="text-[10px] font-black text-[var(--text-muted)] opacity-40 uppercase tracking-widest">
                          {proposalOptions.length}/3 OPÇÕES SELECIONADAS
                        </p>
                        <button
                          onClick={() => {
                            setIsProposalMode(false);
                            setProposalOptions([]);
                          }}
                          className="text-[9px] font-black text-white/20 hover:text-white uppercase tracking-widest"
                        >
                          Voltar ao Padrão
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => setStep("lead")}
                      disabled={!isProposalMode ? !selectedSlot : proposalOptions.length === 0}
                      className="w-1/2 h-10 self-center bg-white text-black rounded-[18px] font-black text-[9px] uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      CONTINUAR
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div key="success" {...containerVariants} className="text-center py-6 space-y-4 relative z-10">
              <div className="w-16 h-16 bg-[var(--accent-start)]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--accent-start)]/20 shadow-[0_0_40px_rgba(var(--accent-start-rgb),0.2)]">
                <CheckCircle2 className="w-8 h-8 text-[var(--accent-start)] stroke-[1.5]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter inline-flex items-center">
                  {isProposalMode ? "Proposta Enviada!" : "Que alegria!"} <Sparkles className="w-6 h-6 text-[var(--accent-start)] ml-3 animate-pulse" />
                </h3>
                <p className="text-[var(--text-muted)] text-sm font-medium leading-relaxed">
                  {isProposalMode
                    ? "Recebemos sua sugestão de horários. Nossa equipe analisará e entrará em contato em breve para confirmar."
                    : "Tudo pronto para nossa conversa. Enviamos os detalhes do acesso para seu e-mail."}
                  <br />
                  <span className="text-[var(--accent-start)] font-black">{formData.email}</span>
                </p>
              </div>
              <div className="p-4 bg-[var(--accent-soft)] border border-[var(--border-primary)] rounded-2xl max-w-[320px] mx-auto space-y-1 text-left">
                <p className="text-[10px] font-black text-[var(--accent-start)] uppercase tracking-[0.2em]">
                  {isProposalMode ? "📍 Próximos Passos" : "📍 Confirmação Imediata"}
                </p>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  {isProposalMode
                    ? "Fique atento ao seu e-mail e WhatsApp. Confirmaremos uma das opções sugeridas ou proporemos um ajuste rápido."
                    : "Verifique sua caixa de entrada e spam. O link do Google Meet e o convite de calendário já estão a caminho."}
                </p>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => window.location.href = "/"}
                  className="px-8 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] hover:bg-[var(--accent-soft)] rounded-full text-[9px] font-black uppercase tracking-[0.3em] text-[var(--text-primary)] transition-all hover:border-[var(--accent-start)]/40"
                >
                  Retornar ao HUB
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
