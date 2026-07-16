"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  getDiscResult,
  GestaoTempoResult,
  AprendizadoResult,
  ReconhecimentoResult,
  DiscResult
} from "@/actions/get-user-results";
import { getUserBookingsAction } from "@/actions/calendar";
import { UserBooking } from "@/types/calendar";
import { getDevolutivaDocs } from "@/lib/journey/devolutiva-docs";
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
  Briefcase,
  CheckCircle2,
  Circle,
  FileText
} from "lucide-react";
import { GlobalFooter } from "@/components/layout/GlobalFooter";
import { useAuthContext } from "@/context/AuthContext";
import { parseISO, isBefore, isAfter, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BookingDetailModal } from "@/components/ui/UserBookings";
import { submitEvaluationAction } from "@/actions/calendar";
import { getCareerPlanningDataAction, CareerPlanningData } from "@/actions/career-module";
import { useJourney } from "@/hooks/useJourney";
import { CareerTask } from "@/types/career";
import Link from "next/link";
import AtmosphericLoading from "@/components/shared/AtmosphericLoading";

/**
 * MemberDashboardView — BPlen HUB
 * Componente unificado para a nova Área de Membro Raiz.
 */
export default function MemberDashboardView() {
  const { user, matricula, services } = useAuthContext();
  const [gestaoResult, setGestaoResult] = useState<GestaoTempoResult | null>(null);
  const [aprendizadoResult, setAprendizadoResult] = useState<AprendizadoResult | null>(null);
  const [reconhecimentoResult, setReconhecimentoResult] = useState<ReconhecimentoResult | null>(null);
  const [discResult, setDiscResult] = useState<DiscResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Histórico de Mentorias
  const [historyBookings, setHistoryBookings] = useState<UserBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Dashboard Agenda Modal (Reuse)
  const [selectedBooking_Dashboard, setSelectedBooking_Dashboard] = useState<UserBooking | null>(null);
  const [docsMenuOpen, setDocsMenuOpen] = useState(false);
  const [isEvaluating_Dashboard, setIsEvaluating_Dashboard] = useState<string | null>(null);

  // Career Module State
  const [careerData, setCareerData] = useState<CareerPlanningData | null>(null);
  const [loadingCareer, setLoadingCareer] = useState(false);
  const { stages, progress } = useJourney(user?.uid || "guest");

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
        const [gestaoRes, aprendizadoRes, reconhecimentoRes, discRes] = await Promise.allSettled([
          getGestaoTempoResult(user!.uid, user!.email || ''),
          getAprendizadoResult(user!.uid, user!.email || ''),
          getReconhecimentoResult(user!.uid, user!.email || ''),
          getDiscResult(user!.uid, user!.email || '')
        ]);

        if (gestaoRes.status === "fulfilled") setGestaoResult(gestaoRes.value);
        if (aprendizadoRes.status === "fulfilled") setAprendizadoResult(aprendizadoRes.value);
        if (reconhecimentoRes.status === "fulfilled") setReconhecimentoResult(reconhecimentoRes.value);
        if (discRes.status === "fulfilled") setDiscResult(discRes.value);
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

  useEffect(() => {
    if (!matricula || !services?.career_planning) return;
    async function loadCareer() {
      setLoadingCareer(true);
      try {
        const res = await getCareerPlanningDataAction(matricula!);
        if (res.success) setCareerData(res.data ?? null);
      } catch (err) {
        console.error("Erro ao carregar dados de carreira no dashboard:", err);
      } finally {
        setLoadingCareer(false);
      }
    }
    loadCareer();
  }, [matricula, services?.career_planning]);

  // Mapeamentos de dados
  const triadData = gestaoResult?.scores ? [
    { label: 'Importância', percentage: gestaoResult.scores.importancia?.percentage || 0, color: '#10b981' },
    { label: 'Urgência', percentage: gestaoResult.scores.urgencia?.percentage || 0, color: '#facc15' },
    { label: 'Circunstância', percentage: gestaoResult.scores.circunstancia?.percentage || 0, color: '#ef4444' },
  ] : [];

  const vacdData = aprendizadoResult?.scores ? [
    { label: 'Visual', percentage: aprendizadoResult.scores.visual?.percentage || 0, color: '#ec4899' },
    { label: 'Auditivo', percentage: aprendizadoResult.scores.auditivo?.percentage || 0, color: '#3b82f6' },
    { label: 'Cinestésico', percentage: aprendizadoResult.scores.cinestesico?.percentage || 0, color: '#10b981' },
    { label: 'Digital', percentage: aprendizadoResult.scores.digital?.percentage || 0, color: '#f59e0b' },
  ] : [];

  const reconhecimentoData = reconhecimentoResult?.scores ? [
    { label: 'Palavras de Afirmação', percentage: reconhecimentoResult.scores.afirmacao?.percentage || 0, color: '#ef4444' },
    { label: 'Tempo de Qualidade', percentage: reconhecimentoResult.scores.tempo?.percentage || 0, color: '#3b82f6' },
    { label: 'Receber Presentes', percentage: reconhecimentoResult.scores.presentes?.percentage || 0, color: '#10b981' },
    { label: 'Atos de Serviço', percentage: reconhecimentoResult.scores.servico?.percentage || 0, color: '#f59e0b' },
    { label: 'Toque Físico', percentage: reconhecimentoResult.scores.toque?.percentage || 0, color: '#ec4899' },
  ] : [];

  const discData = discResult?.scores ? [
    { label: 'Executor', percentage: discResult.scores.executor?.percentage || 0, color: '#3b82f6' },
    { label: 'Comunicador', percentage: discResult.scores.comunicador?.percentage || 0, color: '#facc15' },
    { label: 'Planejador', percentage: discResult.scores.planejador?.percentage || 0, color: '#10b981' },
    { label: 'Analista', percentage: discResult.scores.analista?.percentage || 0, color: '#ef4444' },
  ] : [];

  // Documentos entregues na devolutiva de analise comportamental (anexados pelo
  // admin naquele agendamento). Derivado dos bookings que a tela ja carrega.
  const devolutivaDocs = useMemo(() => getDevolutivaDocs(historyBookings), [historyBookings]);

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
                     <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-4">
                           <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-500">
                              <Brain size={20} />
                           </div>
                           <div className="flex flex-col text-left">
                              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Perfil & Assessments</h3>
                              <p className="text-xs font-black text-[var(--text-primary)] tracking-tight mt-1">Análise Comportamental</p>
                           </div>
                        </div>

                        {/* Documentos entregues na devolutiva. Só aparece quando há
                            anexos registrados pelo admin naquela sessão. */}
                        {devolutivaDocs.length > 0 && (
                           <div className="relative shrink-0">
                              <button
                                 onClick={() => setDocsMenuOpen(v => !v)}
                                 aria-expanded={docsMenuOpen}
                                 aria-label="Documentos da devolutiva"
                                 className="p-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--accent-start)] hover:border-[var(--accent-start)]/30 hover:bg-[var(--accent-soft)] transition-all"
                              >
                                 <FileText size={14} />
                              </button>

                              <AnimatePresence>
                                 {docsMenuOpen && (
                                    <>
                                       {/* Captura o clique fora para fechar */}
                                       <div className="fixed inset-0 z-40" onClick={() => setDocsMenuOpen(false)} />
                                       <motion.div
                                          initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                          animate={{ opacity: 1, y: 0, scale: 1 }}
                                          exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                          transition={{ duration: 0.15 }}
                                          className="absolute right-0 top-full mt-2 w-64 z-50 p-2 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-2xl"
                                       >
                                          <p className="px-2 py-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60">
                                             Documentos da Devolutiva
                                          </p>
                                          <div className="space-y-0.5">
                                             {devolutivaDocs.map(doc => (
                                                <button
                                                   key={doc.fileId}
                                                   onClick={() => { handleDownload(doc.fileId); setDocsMenuOpen(false); }}
                                                   className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-left hover:bg-[var(--accent-soft)] transition-colors group/doc"
                                                >
                                                   <FileText size={12} className="shrink-0 text-[var(--text-muted)] opacity-50 group-hover/doc:text-[var(--accent-start)] group-hover/doc:opacity-100 transition-all" />
                                                   <span className="text-[10px] font-bold text-[var(--text-secondary)] group-hover/doc:text-[var(--text-primary)] truncate transition-colors">
                                                      {doc.fileName}
                                                   </span>
                                                </button>
                                             ))}
                                          </div>
                                       </motion.div>
                                    </>
                                 )}
                              </AnimatePresence>
                           </div>
                        )}
                     </div>

                     <div className="space-y-6 relative z-10">
                        {/* Análise 01: DISC */}
                        {discResult && (
                           <MiniCard
                              title="Comportamental DISC"
                              subtitle="Análise 01"
                              isReleased={discResult.isReleased !== false}
                              submittedAt={discResult.submittedAt}
                              icon={<Brain size={14} className="text-[var(--accent-start)]" />}
                              chart={<DiscChart data={discData} mini />}
                              data={discData}
                              hideLegend
                           />
                        )}

                        {/* Análise 02: Tempo */}
                        {gestaoResult && (
                           <MiniCard 
                              title="Gestão do Tempo" 
                              subtitle="Análise 02" 
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
                              title="Preferências de Aprendizado" 
                              subtitle="Análise 03" 
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
                              title="Preferências de Reconhecimento" 
                              subtitle="Análise 04" 
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
                            <p className="text-xs font-black text-[var(--text-primary)] tracking-tight mt-1">Consultoria, 1 to 1 e Sessões</p>
                         </div>
                      </div>

                      <div className="space-y-4">
                        {loadingBookings ? (
                           <div className="py-8 flex items-center gap-4 opacity-30">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <p className="text-[9px] font-black uppercase tracking-widest">Sincronizando agenda...</p>
                           </div>
                        ) : historyBookings.length === 0 ? (
                           <div className="py-10 bg-[var(--input-bg)]/30 border border-dashed border-[var(--border-primary)] rounded-2xl text-center px-6">
                              <p className="text-[9px] font-medium text-[var(--text-muted)] italic leading-relaxed">
                                O histórico e programação da sua agenda aparecerão aqui.
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
                    {services?.career_planning ? (
                       <div id="hub-carreira" className="p-8 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[3.5rem] space-y-6 shadow-sm hover:scale-[1.01] transition-all group duration-300">
                          <div className="flex items-center gap-4">
                             <div className="p-3 bg-pink-500/10 rounded-2xl border border-pink-500/20 text-pink-500 group-hover:bg-pink-500/20 transition-all">
                                <Briefcase size={20} />
                             </div>
                             <div className="flex flex-col text-left">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Gestão de Carreira</h3>
                                <p className="text-xs font-black text-[var(--text-primary)] tracking-tight mt-1">Gerencie o progresso da sua jornada</p>
                             </div>
                          </div>
                          
                          <div className="space-y-4">
                             {loadingCareer ? (
                                <div className="py-8 flex items-center gap-4 opacity-30">
                                   <Loader2 className="w-5 h-5 animate-spin" />
                                   <p className="text-[9px] font-black uppercase tracking-widest">Sincronizando carreira...</p>
                                </div>
                             ) : (
                                <div className="space-y-4">
                                   {/* Listagem Dinâmica de Tarefas ou Jornada */}
                                   {careerData?.backlog && careerData.backlog.length > 0 ? (
                                      <div className="space-y-2">
                                         {careerData.backlog
                                            .filter((t: CareerTask) => t.status === "Sprint atual" || t.status === "Próxima Sprint")
                                            .sort((a: CareerTask, b: CareerTask) => a.status === "Sprint atual" ? -1 : 1)
                                            .slice(0, 3)
                                            .map((task: CareerTask) => (
                                               <div key={task.id} className="p-4 bg-[var(--input-bg)]/40 border border-[var(--border-primary)]/60 rounded-2xl flex items-center justify-between">
                                                  <div className="flex items-center gap-3 overflow-hidden">
                                                     <div className={`w-2 h-2 rounded-full shrink-0 ${task.status === "Sprint atual" ? "bg-pink-500 animate-pulse" : "bg-blue-400"}`} />
                                                     <span className="text-[10px] font-bold text-[var(--text-primary)] truncate">{task.title}</span>
                                                  </div>
                                                  <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] shrink-0 ml-4">
                                                     {task.status === "Sprint atual" ? "Sprint" : "Próxima"}
                                                  </span>
                                               </div>
                                            ))
                                         }
                                         {careerData.backlog.filter((t: CareerTask) => t.status === "Sprint atual" || t.status === "Próxima Sprint").length === 0 && (
                                            <div className="py-6 bg-[var(--input-bg)]/30 border border-dashed border-[var(--border-primary)] rounded-2xl text-center px-4">
                                               <p className="text-[9px] font-medium text-[var(--text-muted)] italic">Acesse para planejar suas tarefas.</p>
                                            </div>
                                         )}
                                      </div>
                                   ) : (
                                      /* Fallback: Etapas da Jornada */
                                      <div className="space-y-2">
                                         {(() => {
                                            const currentIndex = stages.findIndex(s => s.id === progress?.lastActiveStepId);
                                            const currentStage = stages[currentIndex];
                                            const nextStage = stages[currentIndex + 1];

                                            return (
                                               <>
                                                  {currentStage && (
                                                     <div className="p-4 bg-[var(--input-bg)]/40 border border-[var(--border-primary)]/60 rounded-2xl flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                           <CheckCircle2 size={14} className="text-pink-500" />
                                                           <div className="flex flex-col">
                                                              <span className="text-[8px] font-black uppercase tracking-widest text-pink-500/60">Etapa Atual</span>
                                                              <span className="text-[10px] font-bold text-[var(--text-primary)]">{currentStage.title}</span>
                                                           </div>
                                                        </div>
                                                     </div>
                                                  )}
                                                  {nextStage && (
                                                     <div className="p-4 bg-[var(--input-bg)]/10 border border-dashed border-[var(--border-primary)]/40 rounded-2xl flex items-center justify-between opacity-60">
                                                        <div className="flex items-center gap-3">
                                                           <Circle size={14} className="text-[var(--text-muted)]" />
                                                           <div className="flex flex-col">
                                                              <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">Próxima Etapa</span>
                                                              <span className="text-[10px] font-bold text-[var(--text-primary)]">{nextStage.title}</span>
                                                           </div>
                                                        </div>
                                                     </div>
                                                  )}
                                               </>
                                            );
                                         })()}
                                      </div>
                                   )}

                                   <Link 
                                      href="/hub/membro/gestao_carreira"
                                      className="w-full py-4 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:scale-[1.01] transition-all shadow-lg mt-4"
                                   >
                                      Gestão de carreira completa
                                      <ExternalLink size={12} />
                                   </Link>
                                </div>
                             )}
                          </div>
                       </div>
                    ) : (
                       <div id="hub-carreira" className="p-8 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[3.5rem] space-y-6 shadow-sm opacity-60">
                          <div className="flex items-center gap-4">
                             <div className="p-3 bg-pink-500/5 rounded-2xl border border-pink-500/20 text-pink-500">
                                <Briefcase size={20} />
                             </div>
                             <div className="flex flex-col text-left">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Gestão de Carreira</h3>
                                <p className="text-xs font-black text-[var(--text-primary)] tracking-tight mt-1">Gerencie o progresso da sua jornada</p>
                             </div>
                          </div>
                          <div className="py-14 bg-[var(--input-bg)]/30 border border-dashed border-[var(--border-primary)] rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                             <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] italic">Em desenvolvimento</p>
                          </div>
                       </div>
                    )}
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
                    window.location.href = "/hub/journey/onboarding?startTour=part2";
                 }
              }
           }
           return step;
        })}
        isOpen={isTourOpen} 
        onComplete={() => setIsTourOpen(false)}
        userName={user?.displayName ? user.displayName.split(" ")[0] : "Membro"}
      />

      <GlobalFooter variant="full" />
    </div>
  );
}

interface MiniCardChartDatum {
  label: string;
  percentage: number;
  color: string;
}

interface MiniCardProps {
  title: string;
  subtitle: string;
  data: MiniCardChartDatum[];
  icon: React.ReactNode;
  isReleased: boolean;
  submittedAt?: string | number | { seconds: number } | null;
  chart: React.ReactNode;
  hideLegend?: boolean;
}

function MiniCard({ title, subtitle, data, icon, isReleased, submittedAt, chart, hideLegend }: MiniCardProps) {
  const formattedDate = submittedAt ? new Date(typeof submittedAt === "object" && submittedAt.seconds ? submittedAt.seconds * 1000 : submittedAt as string | number).toLocaleDateString("pt-BR") : null;

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
            {data.map((item) => (
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
