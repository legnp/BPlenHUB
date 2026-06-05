"use client";

import React, { useState, useEffect } from "react";
import { TriadDonutChart } from "@/components/hub/TriadDonutChart";
import { TriadVennChart } from "@/components/hub/TriadVennChart";
import { StackedBarChart } from "@/components/hub/StackedBarChart";
import { DiscChart } from "@/components/hub/DiscChart";
import { MemberJourneyHero } from "@/components/hub/MemberJourneyHero";
import { GuidedTourOverlay } from "@/components/shared/GuidedTourOverlay";
import { memberOnboardingSteps } from "@/config/tour/member-onboarding";
import { 
  getGestaoTempoResult, 
  getAprendizadoResult, 
  getReconhecimentoResult,
  getDiscResult
} from "@/actions/get-user-results";
import { getUserBookingsAction } from "@/actions/calendar";
import { UserBooking } from "@/types/calendar";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  Sparkles, 
  Heart, 
  Compass, 
  Target, 
  Brain, 
  Loader2,
  ExternalLink,
  CalendarDays,
  Eye,
  Video,
  Briefcase
} from "lucide-react";
import { HomeFooter } from "@/components/home/HomeFooter";
import { useAuthContext } from "@/context/AuthContext";
import { parseISO, isBefore, isAfter, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BookingDetailModal } from "@/components/ui/UserBookings";
import { submitEvaluationAction } from "@/actions/calendar";
import Link from "next/link";
import AtmosphericLoading from "@/components/shared/AtmosphericLoading";

/**
 * MemberDashboardView — BPlen HUB
 * Componente unificado para a nova Área de Membro Raiz.
 */
export default function MemberDashboardView() {
  const { user, matricula } = useAuthContext();
  const [gestaoResult, setGestaoResult] = useState<any>(null);
  const [aprendizadoResult, setAprendizadoResult] = useState<any>(null);
  const [reconhecimentoResult, setReconhecimentoResult] = useState<any>(null);
  const [discResult, setDiscResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Histórico de Mentorias
  const [historyBookings, setHistoryBookings] = useState<UserBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Dashboard Agenda Modal (Reuse)
  const [selectedBooking_Dashboard, setSelectedBooking_Dashboard] = useState<UserBooking | null>(null);
  const [isEvaluating_Dashboard, setIsEvaluating_Dashboard] = useState<string | null>(null);

  // Guided Tour State
  const [isTourOpen, setIsTourOpen] = useState(false);
  
  useEffect(() => {
     // Check if we just bounced back here to start the tour natively
     if (typeof window !== "undefined") {
        const search = window.location.search;
        if (search.includes("startTour=true")) {
           const timer = setTimeout(() => setIsTourOpen(true), 1500);
           // Limpar a URL para não refazer no refresh
           window.history.replaceState({}, "", "/hub/membro");
           return () => clearTimeout(timer);
        }
     }
  }, []);

  // Orquestrador de Desfoque global agora é gerenciado pelo Spotlight do GuidedTourOverlay

  const handleEvaluate_Dashboard = async (id: string, r: number, f: string) => {
    if (!matricula || !user) return;
    setIsEvaluating_Dashboard(id);
    try {
       await submitEvaluationAction(matricula, id, r, f, user.uid);
       const bookings = await getUserBookingsAction(matricula);
       setHistoryBookings(bookings);
    } catch (error) {
       console.error("Erro ao avaliar no dashboard:", error);
    } finally {
       setIsEvaluating_Dashboard(null);
    }
  };



  useEffect(() => {
    if (!user) return;
    
    async function loadResults() {
      try {
        const results = await Promise.allSettled([
          getGestaoTempoResult(user!.uid, user!.email || ''),
          getAprendizadoResult(user!.uid, user!.email || ''),
          getReconhecimentoResult(user!.uid, user!.email || ''),
          getDiscResult(user!.uid, user!.email || '')
        ]);

        results.forEach((res, index) => {
          if (res.status === "fulfilled") {
            const data = res.value;
            if (index === 0) setGestaoResult(data);
            if (index === 1) setAprendizadoResult(data);
            if (index === 2) setReconhecimentoResult(data);
            if (index === 3) setDiscResult(data);
          }
        });
      } catch (error) {
        console.error("🚨 [MemberDashboard] Erro inesperado:", error);
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, [user]);

  useEffect(() => {
    if (!matricula) return;
    const currentMatricula = matricula;

    async function loadBookings() {
      setLoadingBookings(true);
      try {
        const bookings = await getUserBookingsAction(currentMatricula);
        setHistoryBookings(bookings);
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
      } finally {
        setLoadingBookings(false);
      }
    }
    loadBookings();
  }, [matricula]);

  // Mapeamentos de dados
  const triadData = gestaoResult?.scores ? [
    { label: 'Importância', percentage: gestaoResult.scores.importancia?.percentage || 0, color: '#10b981' },
    { label: 'Urgência', percentage: gestaoResult.scores.urgencia?.percentage || 0, color: '#facc15' },
    { label: 'Circunstância', percentage: gestaoResult.scores.circunstancia?.percentage || 0, color: '#ef4444' },
  ] : [];

  const vacdData = aprendizadoResult?.scores ? [
    { label: 'Vis', percentage: aprendizadoResult.scores.visual?.percentage || 0, color: '#ec4899' },
    { label: 'Aud', percentage: aprendizadoResult.scores.auditivo?.percentage || 0, color: '#3b82f6' },
    { label: 'Cin', percentage: aprendizadoResult.scores.cinestesico?.percentage || 0, color: '#10b981' },
    { label: 'Dig', percentage: aprendizadoResult.scores.digital?.percentage || 0, color: '#f59e0b' },
  ] : [];

  const reconhecimentoData = reconhecimentoResult?.scores ? [
    { label: 'Afi', percentage: reconhecimentoResult.scores.afirmacao?.percentage || 0, color: '#ef4444' },
    { label: 'Tem', percentage: reconhecimentoResult.scores.tempo?.percentage || 0, color: '#3b82f6' },
    { label: 'Pre', percentage: reconhecimentoResult.scores.presentes?.percentage || 0, color: '#10b981' },
    { label: 'Ser', percentage: reconhecimentoResult.scores.servico?.percentage || 0, color: '#f59e0b' },
    { label: 'Toq', percentage: reconhecimentoResult.scores.toque?.percentage || 0, color: '#ec4899' },
  ] : [];

  const discData = discResult?.scores ? [
    { label: 'Executor', percentage: discResult.scores.executor?.percentage || 0, color: '#3b82f6' },
    { label: 'Comunicador', percentage: discResult.scores.comunicador?.percentage || 0, color: '#facc15' },
    { label: 'Planejador', percentage: discResult.scores.planejador?.percentage || 0, color: '#10b981' },
    { label: 'Analista', percentage: discResult.scores.analista?.percentage || 0, color: '#ef4444' },
  ] : [];

  const handleDownload = async (fileId: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      window.open(`/api/docs/${fileId}?token=${token}`, "_blank");
    } catch (error) {
      console.error("Erro ao gerar token para download:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <div className="max-w-[1400px] mx-auto pt-[10px] px-6 pb-6 md:pt-[10px] md:px-12 md:pb-12 space-y-12 flex-1 w-full">
        
        <AnimatePresence mode="wait">
          {loading ? (
            <AtmosphericLoading key="loading" />
          ) : (
            <motion.div 
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              {/* Journey Hero (Regra: 1 para Muitos) */}
              <div id="hub-journey-nav">
                 <MemberJourneyHero />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8 items-start">
                {/* Barra Lateral: Laboratório de Assessments */}
                <aside id="hub-assessments" className="space-y-6">
                  <div className="p-8 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[3.5rem] space-y-8 shadow-sm relative overflow-hidden group">
                     {/* Header do Laboratório */}
                     <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-500">
                           <Brain size={20} />
                        </div>
                        <div className="flex flex-col text-left">
                           <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Perfil & Assessments</h3>
                           <p className="text-xs font-black text-[var(--text-primary)] tracking-tight mt-1">Análise Comportamental</p>
                        </div>
                     </div>

                     <div className="space-y-6 relative z-10">
                        {/* Lâmina 01: DISC */}
                        <div className={`p-8 bg-[var(--input-bg)]/20 border border-[var(--border-primary)] rounded-[2.5rem] space-y-4 transition-all relative overflow-hidden group/blade ${!discResult ? 'opacity-60 grayscale' : 'hover:bg-[var(--input-bg)]/40 hover:border-blue-500/30'}`}>
                           <div className="flex items-center justify-between mb-4 relative z-10">
                              <div className="flex flex-col">
                                 <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Analise 01</span>
                                 <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">Comportamental DISC</h4>
                              </div>
                              {discResult?.isReleased === false ? (
                                 <div className="flex items-center gap-2 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    <span className="text-[7px] font-black uppercase tracking-[0.15em] text-amber-600">Ativo</span>
                                 </div>
                              ) : discResult ? (
                                 <div className="flex items-center gap-2 px-2.5 py-1 bg-green-500/10 border border-green-500/10 rounded-full">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                    <span className="text-[7px] font-black uppercase tracking-[0.15em] text-green-600">Analisado</span>
                                 </div>
                              ) : null}
                           </div>

                           {discResult ? (
                              <div className="space-y-6 relative z-10">
                                 <DiscChart data={discData} mini />
                              </div>
                           ) : (
                              <div className="w-24 h-24 mx-auto rounded-full border border-dashed border-[var(--border-primary)] flex items-center justify-center bg-[var(--bg-primary)]/30">
                                 <Brain size={20} className="text-[var(--text-muted)] opacity-20" />
                              </div>
                           )}
                        </div>

                        {/* Análise 02: Tempo */}
                        {gestaoResult && (
                           <MiniCard 
                              title="Gestão do Tempo" 
                              subtitle="Análise 02 / Tríade" 
                              isReleased={gestaoResult.isReleased !== false}
                              submittedAt={gestaoResult.submittedAt}
                              icon={<Clock size={14} className="text-[var(--accent-start)]" />}
                              chart={<TriadVennChart data={triadData} mini />}
                              data={triadData} 
                              hideLegend
                           />
                        )}

                        {/* Análise 03: Aprendizado */}
                        {aprendizadoResult && (
                           <MiniCard 
                              title="Aprendizado" 
                              subtitle="Análise 03 / VACD" 
                              isReleased={aprendizadoResult.isReleased !== false}
                              submittedAt={aprendizadoResult.submittedAt}
                              icon={<Sparkles size={14} className="text-[var(--accent-start)]" />}
                              chart={<TriadDonutChart data={vacdData} mini />}
                              data={vacdData}
                           />
                        )}

                        {/* Análise 04: Reconhecimento */}
                        {reconhecimentoResult && (
                           <MiniCard 
                              title="Reconhecimento" 
                              subtitle="Análise 04 / Premiações" 
                              isReleased={reconhecimentoResult.isReleased !== false}
                              submittedAt={reconhecimentoResult.submittedAt}
                              icon={<Target size={14} className="text-[var(--accent-start)]" />}
                              chart={<StackedBarChart data={reconhecimentoData} />}
                              data={reconhecimentoData}
                           />
                        )}
                     </div>

                     <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
                  </div>
                </aside>

                {/* Coluna Principal: Agenda & Outras Funções */}
                <div className="space-y-8 flex flex-col">
                   {/* Card de Agenda */}
                   <div id="hub-agenda" className="p-8 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[2.5rem] space-y-6 shadow-sm">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-[var(--accent-start)]/10 rounded-2xl border border-[var(--accent-start)]/20 text-[var(--accent-start)]">
                            <CalendarDays size={20} />
                         </div>
                         <div className="flex flex-col text-left">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Sua agenda BPlen</h3>
                            <p className="text-xs font-black text-[var(--text-primary)] tracking-tight mt-1">1 to 1 & Sessões</p>
                         </div>
                      </div>

                      <div className="space-y-4">
                        {loadingBookings ? (
                           <div className="py-8 flex items-center gap-4 opacity-30">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <p className="text-[9px] font-black uppercase tracking-widest">Sincronizando...</p>
                           </div>
                        ) : historyBookings.length === 0 ? (
                           <div className="py-10 bg-[var(--input-bg)]/30 border border-dashed border-[var(--border-primary)] rounded-2xl text-center px-6">
                              <p className="text-[9px] font-medium text-[var(--text-muted)] italic leading-relaxed">
                                Suas atividades de mentoria aparecerão aqui.
                              </p>
                           </div>
                        ) : (
                           <div className="space-y-4">
                              <div className="space-y-4">
                               <OutcomeCard 
                                  booking={
                                     historyBookings.find(b => isAfter(parseISO(b.eventDetail?.start || ""), new Date())) 
                                     || historyBookings[0]
                                  } 
                                  onDownload={handleDownload} 
                                  onViewDetails={(b) => setSelectedBooking_Dashboard(b)}
                                  compact
                               />
                               
                               <Link 
                                  href="/hub/membro/gestao_agenda"
                                  className="w-full py-4 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:scale-[1.01] transition-all shadow-lg"
                               >
                                  Gestão de Agenda completa
                                  <ExternalLink size={12} />
                               </Link>
                              </div>
                           </div>
                        )}
                      </div>
                   </div>

                   {/* Módulo Gestão de Carreira */}
                   <div id="hub-carreira" className="p-8 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[3.5rem] space-y-6 shadow-sm opacity-60">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-pink-500/5 rounded-2xl border border-pink-500/20 text-pink-500">
                            <Briefcase size={20} />
                         </div>
                         <div className="flex flex-col text-left">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Módulo Complementar</h3>
                            <p className="text-xs font-black text-[var(--text-primary)] tracking-tight mt-1">Gestão de Carreira</p>
                         </div>
                      </div>
                      <div className="py-14 bg-[var(--input-bg)]/30 border border-dashed border-[var(--border-primary)] rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                         <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] italic">Em desenvolvimento</p>
                      </div>
                   </div>
                </div>
              </div>

              {/* Telemetria de Identidade */}
              <div className="pt-12 border-t border-[var(--border-primary)] border-dashed opacity-20 text-center">
                  <div className="flex flex-col items-center gap-2 text-[8px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)]">
                     <p>Sincronismo de Identidade Ativo</p>
                     <p>UID: {user?.uid}</p>
                  </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {selectedBooking_Dashboard && (
        <BookingDetailModal 
          booking={selectedBooking_Dashboard}
          isOpen={!!selectedBooking_Dashboard}
          onClose={() => setSelectedBooking_Dashboard(null)}
          onEvaluate={handleEvaluate_Dashboard}
          isSubmitting={isEvaluating_Dashboard === selectedBooking_Dashboard.id}
          onRefresh={async () => {
             if (matricula) {
                const bookings = await getUserBookingsAction(matricula);
                setHistoryBookings(bookings);
             }
          }}
        />
      )}

      <GuidedTourOverlay 
        steps={memberOnboardingSteps.map((step, idx) => {
           // No último passo da Dashboard (Assessments), redirecionar para a página da jornada
           if (step.targetId === "hub-assessments") {
              return {
                 ...step,
                 action: () => {
                    setIsTourOpen(false);
                    if (typeof window !== 'undefined') {
                       sessionStorage.setItem("bplen_tour_onboarding", "true");
                    }
                    window.location.href = "/hub/membro/journey/onboarding?startTour=part2";
                 }
              }
           }
           return step;
        })}
        isOpen={isTourOpen} 
        onComplete={() => setIsTourOpen(false)}
        userName={user?.displayName ? user.displayName.split(" ")[0] : "Membro"}
      />

      <HomeFooter />
    </div>
  );
}

function MiniCard({ title, subtitle, data, icon, isReleased, submittedAt, chart, hideLegend }: any) {
  const formattedDate = submittedAt ? new Date(submittedAt.seconds ? submittedAt.seconds * 1000 : submittedAt).toLocaleDateString("pt-BR") : null;

  return (
    <section className={`p-8 bg-[var(--input-bg)]/20 border border-[var(--border-primary)] rounded-[2.5rem] space-y-4 transition-all relative overflow-hidden group/card ${!isReleased ? 'opacity-70 grayscale-[0.5]' : 'hover:bg-[var(--input-bg)]/40 hover:border-blue-500/20'}`}>
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] flex items-center justify-center shadow-inner group-hover/card:bg-[var(--accent-soft)] transition-colors">
            {icon}
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">{title}</h4>
            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tight opacity-60 group-hover/card:opacity-100 transition-opacity">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className={`transition-all duration-700 ${!isReleased ? 'blur-md grayscale opacity-30 select-none' : 'opacity-100'}`}>
        {(data && data.length > 0) ? chart : (
          <div className="w-32 h-32 mx-auto rounded-full border border-dashed border-[var(--border-primary)] flex items-center justify-center bg-[var(--bg-primary)]/30">
             <Heart size={16} className="text-[var(--accent-start)] opacity-20" />
          </div>
        )}
      </div>

      {isReleased && data.length > 0 && !hideLegend && (
         <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 px-4 opacity-70 group-hover/card:opacity-100 transition-opacity">
            {data.map((item: any) => (
               <div key={item.label} className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[7.5px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">{item.label}</span>
               </div>
            ))}
         </div>
      )}
    </section>
  );
}

function OutcomeCard({ 
  booking, 
  onViewDetails
}: { 
  booking: UserBooking, 
  onDownload: (fileId: string) => void, 
  onViewDetails: (booking: UserBooking) => void,
  compact?: boolean 
}) {
  const event = booking.eventDetail;
  if (!event) return null;

  const meetingLink = event.meetingLink || (event.location?.startsWith("http") ? event.location : "");

  const eventDate = parseISO(event.start);
  const isPast = isBefore(eventDate, new Date());

  const statusLabel = booking.eventLifecycleStatus 
    ? (booking.eventLifecycleStatus === 'completed' ? 'Concluída' : booking.eventLifecycleStatus === 'cancelled' ? 'Cancelada' : booking.eventLifecycleStatus === 'postponed' ? 'Adiada' : 'Agendada')
    : (isPast ? "Realizada" : "Agendada");

  const statusColor = booking.eventLifecycleStatus === 'completed' ? "bg-green-500/10 text-green-600" : "bg-blue-500/10 text-blue-500";

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group flex flex-col md:flex-row gap-4 items-center px-6 py-5 bg-[var(--bg-primary)]/40 border border-[var(--border-primary)] rounded-[2rem] hover:border-[var(--accent-start)]/30 transition-all shadow-sm relative overflow-hidden"
    >
       <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[var(--accent-start)] to-[var(--accent-end)] flex flex-col items-center justify-center text-white shadow-lg">
             <span className="text-[7px] font-black uppercase leading-none">{format(eventDate, "MMM", { locale: ptBR })}</span>
             <span className="text-xs font-black leading-tight">{format(eventDate, "dd")}</span>
          </div>
          <span className="text-[10px] font-bold text-[var(--text-muted)] opacity-60">{format(eventDate, "HH:mm")}h</span>
       </div>
       <div className="flex-1 min-w-0 text-left">
          <h4 className="text-xs font-black text-[var(--text-primary)] truncate group-hover:text-[var(--accent-start)] transition-colors">{event.summary}</h4>
          <span className="text-[9px] font-bold text-[var(--text-muted)] opacity-40">/ {event.mentor || "BPlen"}</span>
       </div>
       <div className="flex items-center gap-4 shrink-0">
          <span className={`px-2.5 py-1 rounded-full text-[7px] font-black uppercase tracking-widest ${statusColor}`}>{statusLabel}</span>
          
          {meetingLink && statusLabel !== "Concluída" && statusLabel !== "Cancelada" && statusLabel !== "Adiada" && (
             <a 
                href={meetingLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2.5 bg-[var(--accent-start)]/10 hover:bg-[var(--accent-start)]/20 text-[var(--accent-start)] rounded-xl border border-[var(--accent-start)]/20 hover:border-[var(--accent-start)]/40 transition-all flex items-center justify-center"
                title="Ir à reunião"
             >
                <Video size={16} />
             </a>
          )}
          
          <button onClick={() => onViewDetails(booking)} className="p-2.5 bg-[var(--input-bg)] rounded-xl border border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--accent-start)] transition-all">
             <Eye size={16} />
          </button>
       </div>
    </motion.div>
  );
}
