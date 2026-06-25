"use client";

import React from "react";
import { SubStepConfig } from "@/types/journey";
import { ConfettiCheckbox } from "./ConfettiCheckbox";

import { 
  Loader2, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  PlayCircle, 
  Calendar as CalendarIcon, 
  ClipboardCheck, 
  Brain,
  LucideIcon
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { ptBR } from "date-fns/locale";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import Calendar from "@/components/ui/Calendar";
import UserBookings from "@/components/ui/UserBookings";
import { getSyncedEvents, getUserBookingsAction, submitEvaluationAction } from "@/actions/calendar";
import { UserBooking } from "@/types/calendar";
import { SurveyEngine } from "@/components/forms/SurveyEngine";
import { getSurveyConfig } from "@/config/surveys";
import { useAuthContext } from "@/context/AuthContext";
import { BPLEN_NOMENCLATURE } from "@/config/nomenclature";
import { checkSurveyCompletedAction } from "@/actions/submit-survey";

/**
 * Helper para remover acentuação e diacríticos de strings para comparação resiliente 🧬
 */
const normalizeStr = (str: string) => 
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/**
 * Helper para obter dinamicamente a palavra-chave de busca de eventos para cada etapa 🧬📅
 */
function getMeetingFilterKeyword(substep: SubStepConfig): string {
  const refId = (substep.referenceId || "").toLowerCase();
  const title = (substep.title || "").toLowerCase();

  if (refId.includes("onboarding") || title.includes("onboarding")) return "onboarding";
  
  if (refId.includes("analise") || refId.includes("comportamental") || 
      title.includes("analise") || title.includes("comportamental")) {
    return "analise comportamental";
  }
  
  if (refId.includes("carreira") || refId.includes("plano") || 
      title.includes("carreira") || title.includes("plano")) {
    return "plano de carreira";
  }
  
  if (refId.includes("grupo") || title.includes("grupo")) return "orientacao em grupo";
  if (refId.includes("individual") || title.includes("individual")) return "orientacao individual";
  if (refId.includes("coaching") || title.includes("coaching")) return "coaching";
  if (refId.includes("mentoria") || title.includes("mentoria")) return "mentoria";
  if (refId.includes("offboarding") || title.includes("offboarding")) return "offboarding";

  return substep.referenceId 
    ? substep.referenceId.replace(/_/g, " ").replace(/-/g, " ").toLowerCase() 
    : title;
}

interface StepRendererProps {
  substep: SubStepConfig;
  status: "locked" | "available" | "current" | "completed";
  onComplete: () => void;
  context?: "primeiros_passos" | "member_journey";
  stageId?: string;
  kicker?: string;
  icon?: string;
}

/**
 * BPlen HUB — StepRenderer 🧬🛡️
 * Orchestrator that renders the appropriate content type for a journey substep.
 */
export function StepRenderer({ substep, status, onComplete, context = "member_journey", stageId, kicker, icon }: StepRendererProps) {
  const { user, matricula, nickname } = useAuthContext();

  const DynamicIcon = ({ name, size = 18, className }: { name?: string, size?: number, className?: string }) => {
    const IconComponent = name ? (LucideIcons as any)[name] : null;
    if (!IconComponent) return <LucideIcons.Sparkles size={size} className={className} />;
    return <IconComponent size={size} className={className} />;
  };

  // Selecionar o dicionário de textos baseado no contexto da página 🍱
  const nomen = context === "primeiros_passos" 
    ? BPLEN_NOMENCLATURE.primeiros_passos 
    : BPLEN_NOMENCLATURE.member_area.journey;

  if (status === "locked") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-16 bg-[var(--input-bg)]/5 rounded-[3.5rem] border border-dashed border-[var(--border-primary)] opacity-40">
        <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mb-6">
           <AlertCircle size={24} className="text-[var(--text-muted)]" />
        </div>
        <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-[var(--text-primary)]">{nomen.locked_title}</h3>
        <p className="text-[10px] font-medium text-[var(--text-muted)] mt-2 text-center max-w-xs">
           {nomen.locked_desc}
        </p>
      </div>
    );
  }

  const [events, setEvents] = React.useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = React.useState(false);
  const [userBookings, setUserBookings] = React.useState<UserBooking[]>([]);
  const [isEvaluating, setIsEvaluating] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [feedback, setFeedback] = React.useState("");

  const loadData = React.useCallback(async () => {
    setLoadingEvents(true);
    try {
      const allEvents = await getSyncedEvents();
      
      const keyword = normalizeStr(getMeetingFilterKeyword(substep));
      const filteredEvents = allEvents.filter(ev => {
        const summaryNorm = normalizeStr(ev.summary || "");
        return summaryNorm.includes(keyword);
      });
      setEvents(filteredEvents);

      if (matricula) {
        const bookings = await getUserBookingsAction(matricula);
        setUserBookings(bookings);
      }
    } catch (error) {
       console.error("Erro StepRenderer loadData:", error);
    } finally {
      setLoadingEvents(false);
    }
  }, [substep.type, substep.referenceId, substep.title, matricula]);

  React.useEffect(() => {
    if (substep.type === "meeting") {
      loadData();
    }
  }, [loadData, substep.type]);

  const handleNPS = async (bookingId: string) => {
    if (!rating || !matricula || !user?.uid) return;
    setIsEvaluating(true);
    try {
      const res = await submitEvaluationAction(matricula, bookingId, rating, feedback, user.uid);
      if (res.success) {
        loadData(); // Refresh UI
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsEvaluating(false);
    }
  };

  const [isSurveyActive, setIsSurveyActive] = React.useState(false);
  const [isSurveySubmittedLocal, setIsSurveySubmittedLocal] = React.useState(false);
  const [isSurveyCompletedInDb, setIsSurveyCompletedInDb] = React.useState(false);
  const [checkingSurvey, setCheckingSurvey] = React.useState(false);
  const [isDownloadingPdi, setIsDownloadingPdi] = React.useState(false);

  const handleDownloadPdi = async () => {
    if (!matricula) return;
    setIsDownloadingPdi(true);
    try {
      const { getPdiSurveysDataAction } = await import("@/actions/submit-survey");
      const responses = await getPdiSurveysDataAction(matricula);
      
      if (!responses || Object.keys(responses).length === 0) {
        alert("Não foi possível carregar as respostas do seu PDI. Certifique-se de que respondeu às fases anteriores.");
        return;
      }
      
      const { generatePdiDocx } = await import("@/lib/docx-generator");
      await generatePdiDocx(responses, nickname || "Membro");
    } catch (err) {
      console.error("Erro ao baixar PDI:", err);
      alert("Houve um erro ao gerar o documento do seu PDI. Tente novamente.");
    } finally {
      setIsDownloadingPdi(false);
    }
  };

  React.useEffect(() => {
    setIsSurveyActive(false);
    setIsSurveySubmittedLocal(false);
    setIsSurveyCompletedInDb(false);
  }, [substep.id]);

  React.useEffect(() => {
    if ((substep.type === "survey" || substep.type === "form") && matricula && status !== "completed") {
      setCheckingSurvey(true);
      checkSurveyCompletedAction(matricula, substep.referenceId)
        .then((completed) => {
          setIsSurveyCompletedInDb(completed);
        })
        .catch((err) => {
          console.error("❌ Erro ao checar status da pesquisa:", err);
        })
        .finally(() => {
          setCheckingSurvey(false);
        });
    }
  }, [substep.type, substep.referenceId, matricula, status]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
       if (window.location.search.includes("action=finishTour") && substep.referenceId === "welcome_video_01") {
          onComplete();
          window.history.replaceState({}, "", window.location.pathname);
       }
    }
  }, [substep.referenceId, onComplete]);

  const renderContent = () => {
    const isPdiSurvey = substep.referenceId ? substep.referenceId.startsWith("survey_pdi_") : false;
    switch (substep.type) {
      case "content":
        const isGuidedTour = substep.referenceId === "welcome_video_01";

        if (isGuidedTour) {
            return (
              <div className="flex-1 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 relative">
                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-pink-500/10 rounded-xl flex items-center justify-center text-pink-500">
                          <DynamicIcon name={icon} />
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-500/high">{kicker || nomen.badge_tour}</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight">{nomen.instructions.welcome_title}</h2>
                    <p className="text-[12px] font-medium text-[var(--text-muted)] max-w-xl leading-relaxed">{nomen.instructions.welcome_desc}</p>
                 </div>
                 
                 <div className="p-16 border border-[var(--border-primary)] rounded-[3.5rem] bg-[var(--input-bg)]/20 flex flex-col items-center justify-center text-center gap-8 shadow-inner">
                    {status === "completed" ? (
                       <div className="flex items-center gap-3 px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                          <CheckCircle2 size={18} className="text-emerald-500" />
                          <span className="text-[11px] font-black uppercase tracking-widest text-emerald-500">
                             {nomen.instructions.survey_status_done}
                          </span>
                       </div>
                    ) : (
                       <ConfettiCheckbox 
                          label={nomen.actions.mark_as_done} 
                          onComplete={onComplete} 
                       />
                    )}
                 </div>
              </div>
           );
        }

        return (
          <div className="flex-1 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
             <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                      <DynamicIcon name={icon} />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/high">{kicker || nomen.badge_content}</span>
                </div>
                <h2 className="text-3xl font-black tracking-tight">{substep.title}</h2>
                <p className="text-[12px] font-medium text-[var(--text-muted)] max-w-xl leading-relaxed">{substep.description}</p>
             </div>
             
             <div className="aspect-video w-full rounded-[3rem] bg-black/40 border border-white/5 flex items-center justify-center relative group overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <PlayCircle size={64} className="text-white opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 z-10" />
                <div className="absolute bottom-8 left-8 z-10 opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 text-white">
                   <p className="text-[10px] font-black uppercase tracking-widest">{nomen.instructions.content_play_label}</p>
                </div>
             </div>

             <div className="flex justify-between items-center pt-4">
                {status === "completed" && (
                   <div className="flex items-center gap-3 px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                      <CheckCircle2 size={18} className="text-emerald-500" />
                      <span className="text-[11px] font-black uppercase tracking-widest text-emerald-500">
                         {nomen.instructions.survey_status_done}
                      </span>
                   </div>
                )}
                
                <div className="flex gap-4 ml-auto">
                   {status === "completed" && substep.allowReview && (
                      <button 
                         onClick={() => { /* Lógica de rever vídeo/conteúdo se necessário */ }}
                         className="px-8 py-4 border border-[var(--border-primary)] text-[var(--text-muted)] rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:text-[var(--text-primary)] transition-all"
                      >
                         {nomen.actions.review}
                      </button>
                   )}
                   {status !== "completed" ? (
                      <ConfettiCheckbox 
                         label={nomen.actions.mark_as_done} 
                         onComplete={onComplete} 
                      />
                   ) : (
                      <button 
                         onClick={onComplete}
                         className="px-10 py-4 bg-[var(--accent-start)] text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[var(--accent-start)]/20"
                      >
                         {nomen.actions.review}
                      </button>
                   )}
                </div>
             </div>
          </div>
        );

      case "form":
      case "survey":
        const isSurvey = substep.type === "survey";
        const surveyConfig = getSurveyConfig(substep.referenceId);

        // 1. Loader de Verificação (Evita flashes indesejados ao carregar estado do DB)
        if (checkingSurvey) {
           return (
              <div className="flex-1 flex flex-col items-center justify-center p-20 animate-in fade-in duration-300">
                 <Loader2 className="w-10 h-10 animate-spin text-[var(--accent-start)]" />
                 <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-50">Sincronizando banco de dados...</p>
              </div>
           );
        }

        // 2. Se a pesquisa estiver ativa, renderiza o SurveyEngine
        if (isSurveyActive && surveyConfig) {
           return (
              <div className="flex-1 animate-in zoom-in duration-500 py-4">
                 <SurveyEngine 
                    config={surveyConfig}
                    userUid={user?.uid || "guest"}
                    userNickname={nickname}
                    onSubmitSuccess={() => {
                       // Sinaliza que as respostas foram gravadas e fecha o motor visualmente
                       setIsSurveySubmittedLocal(true);
                       setIsSurveyActive(false);
                    }}
                    onComplete={() => {
                       setIsSurveyActive(false);
                       onComplete();
                    }}
                 />
              </div>
           );
        }

        // 3. Se a pesquisa foi concluída no DB ou nesta sessão, mas o status da jornada ainda não atualizou:
        // Exibe o card de feedback premium com o botão interativo de confetes!
        if ((isSurveyCompletedInDb || isSurveySubmittedLocal) && status !== "completed" && surveyConfig) {
            return (
              <div className="flex-1 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 pt-6">
                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-500 animate-pulse">
                          <CheckCircle2 size={18} />
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">
                          Respostas Salvas!
                       </span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight">{substep.title}</h2>
                    <p className="text-[12px] font-medium text-[var(--text-muted)] max-w-xl leading-relaxed">
                       Sua avaliação foi registrada com sucesso em nossa base de dados. Agora, sele a conclusão para atualizar o seu progresso da jornada e liberar a próxima etapa.
                    </p>
                 </div>
                 
                 <div className="p-16 border border-[var(--border-primary)] rounded-[3.5rem] bg-[var(--input-bg)]/20 flex flex-col items-center justify-center text-center gap-8 shadow-inner animate-in zoom-in duration-500">
                    <div className="space-y-3 max-w-md">
                       <h3 className="text-lg font-black tracking-tight text-[var(--text-primary)]">Excelente!</h3>
                       <p className="text-[11px] font-medium text-[var(--text-muted)] leading-relaxed whitespace-pre-line">
                          {surveyConfig.completionMessage || "Sua participação foi registrada. Clique no botão abaixo para concluir."}
                       </p>
                     {substep.referenceId === "survey_pdi_fase4" && (
                        <button
                           onClick={handleDownloadPdi}
                           disabled={isDownloadingPdi}
                           className="group relative flex items-center gap-3 px-8 py-3.5 bg-[var(--accent-start)] hover:bg-[var(--accent-end)] text-white rounded-full text-[10px] font-black uppercase tracking-wider transition-all shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                           {isDownloadingPdi ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                           ) : (
                              <FileText size={14} />
                           )}
                           <span>{isDownloadingPdi ? "Gerando PDI..." : "Baixar PDI (.docx)"}</span>
                        </button>
                     )}
                    </div>

                    <ConfettiCheckbox 
                       label="Marcar atividade como Concluída" 
                       onComplete={() => {
                          // Reseta estados locais de fluxo
                          setIsSurveySubmittedLocal(false);
                          setIsSurveyCompletedInDb(false);
                          // Atualiza o progresso no Firestore e avança síncronamente
                          onComplete();
                       }} 
                    />
                 </div>
              </div>
            );
         }

        // 4. Fluxo Padrão: Estado Concluído ou Botão Inicial para Começar
        return (
          <div className="flex-1 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 pt-6">
             <div className="space-y-4">
                 <div className="flex items-center gap-3">
                     <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center",
                        stageId === "analise-comportamental" ? "bg-amber-500/10 text-amber-500" :
                        isSurvey ? "bg-purple-500/10 text-purple-500" : "bg-emerald-500/10 text-emerald-500"
                     )}>
                        <DynamicIcon name={icon} />
                     </div>
                     <span className={cn(
                        "text-[10px] font-black uppercase tracking-[0.3em]",
                        stageId === "analise-comportamental" ? "text-amber-500" :
                        isSurvey ? "text-purple-500" : "text-emerald-500"
                     )}>
                        {kicker || (stageId === "analise-comportamental" ? "Análise Comportamental" : isSurvey ? nomen.badge_survey : nomen.badge_form)}
                     </span>
                 </div>
                 <h2 className="text-3xl font-black tracking-tight">{substep.title}</h2>
                 <p className="text-[12px] font-medium text-[var(--text-muted)] max-w-xl leading-relaxed">
                   {stageId === "analise-comportamental" && substep.description === "Atividade de desenvolvimento" ? "Análise Comportamental" : substep.description}
                 </p>
              </div>
              
              <div className="flex flex-col items-center justify-center pt-10 animate-in fade-in zoom-in duration-700 delay-300">
                 {status === "completed" ? (
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3 px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                         <CheckCircle2 size={18} className="text-emerald-500" />
                         <span className="text-[11px] font-black uppercase tracking-widest text-emerald-500">
                            {nomen.instructions.survey_status_done}
                         </span>
                      </div>
 
                      {substep.allowReview && !isPdiSurvey && (
                         <button 
                            onClick={() => {
                               setIsSurveyActive(true);
                            }}
                            className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-emerald-500 transition-colors flex items-center gap-2 group"
                         >
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] group-hover:bg-emerald-500 transition-colors" />
                            {nomen.actions.review}
                         </button>
                      )}

                      {substep.referenceId === "survey_pdi_fase4" && (
                          <button
                             onClick={handleDownloadPdi}
                             disabled={isDownloadingPdi}
                             className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-start)] hover:text-[var(--accent-end)] transition-colors flex items-center gap-2 disabled:opacity-50 group cursor-pointer"
                          >
                             {isDownloadingPdi ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-start)]" />
                             ) : (
                                <FileText size={14} className="text-[var(--accent-start)]" />
                             )}
                             <span>{isDownloadingPdi ? "Gerando PDI..." : "Baixar PDI (.docx)"}</span>
                          </button>
                       )}
                    </div>
                 ) : (
                    <button 
                       onClick={() => setIsSurveyActive(true)}
                       className="group relative flex items-center gap-4 px-14 py-5 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-full text-[12px] font-black uppercase tracking-[0.25em] hover:scale-105 active:scale-95 transition-all shadow-2xl hover:shadow-[var(--text-primary)]/20 overflow-hidden"
                    >
                       <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                       <PlayCircle size={20} className="relative z-10" />
                       <span className="relative z-10">{isSurvey ? nomen.actions.survey_start : nomen.actions.form_start}</span>
                    </button>
                 )}
              </div>
          </div>
        );

      case "meeting":
        // Identificar se há um agendamento existente para este contexto
        const keyword = normalizeStr(getMeetingFilterKeyword(substep));
        const activeBooking = userBookings.find(b => {
           const summaryNorm = normalizeStr(b.eventDetail?.summary || "");
           return summaryNorm.includes(keyword) && b.eventLifecycleStatus !== "cancelled";
        });

        const isCompleted = activeBooking?.eventLifecycleStatus === "completed" || activeBooking?.attendanceStatus === "present";

        return (
          <div className="flex-1 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
             <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                      <DynamicIcon name={icon} />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">
                      {kicker || (isCompleted ? nomen.badge_meeting.completed : activeBooking ? nomen.badge_meeting.confirmed : nomen.badge_meeting.booking)}
                   </span>
                </div>
                <h2 className="text-3xl font-black tracking-tight">
                   {isCompleted ? "Histórico da Sessão" : activeBooking ? "Tudo certo para o encontro!" : substep.title}
                </h2>
                <p className="text-[12px] font-medium text-[var(--text-muted)] max-w-xl leading-relaxed">
                   {isCompleted 
                     ? "Sua sessão foi concluída com sucesso. Veja abaixo os documentos e avalie sua experiência."
                     : activeBooking 
                        ? `Sua ${substep.title} está confirmada. O 100% desta etapa será liberado assim que a sessão for concluída e o consultor emitir sua Ata.`
                        : (substep.referenceId === "onboarding" 
                           ? "Escolha um horário para sua sessão de Onboarding." 
                           : "Selecione o melhor horário para sua sessão com nossos especialistas.")}
                </p>
             </div>
             
             {!activeBooking ? (
                <div className="flex-1 min-h-[600px] border border-[var(--border-primary)] rounded-[3rem] bg-[var(--input-bg)]/10 overflow-hidden relative">
                   {loadingEvents ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg-primary)]/40 backdrop-blur-sm z-50">
                         <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                         <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-amber-500">Sincronizando Agenda...</p>
                      </div>
                   ) : (
                      <div className="p-4 sm:p-8 h-full">
                         <Calendar 
                            events={events} 
                            onBookingSuccess={() => { loadData(); }}
                         />
                      </div>
                   )}
                </div>
             ) : (
                <div className="space-y-6">
                   <div className="mt-4">
                      <UserBookings 
                         compact={true} 
                         filterSummary={getMeetingFilterKeyword(substep)} 
                         onRefresh={() => loadData()}
                      />
                   </div>

                   {/* BOTÃO PARA AVANÇAR */}
                   {isCompleted && status !== "completed" && (
                      <div className="mt-6 flex justify-center animate-in fade-in slide-in-from-bottom-4 delay-300">
                         <ConfettiCheckbox 
                            label={nomen.actions.mark_as_done} 
                            onComplete={onComplete} 
                         />
                      </div>
                   )}
                </div>
             )}

             {/* Outros Agendamentos */}
             {!isCompleted && !activeBooking && (
                <div className="mt-4">
                   <UserBookings 
                      compact={true} 
                      filterSummary={getMeetingFilterKeyword(substep)} 
                   />
                </div>
             )}
          </div>
        );

      case "result":
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-16 bg-blue-500/5 rounded-[3.5rem] border border-blue-500/10 animate-in zoom-in duration-700">
             <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-8 relative">
                <CheckCircle2 size={40} className="text-blue-500" />
                <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse" />
             </div>
             <h3 className="text-xl font-black tracking-tight">Análise Concluída!</h3>
             <p className="text-[11px] font-medium text-[var(--text-muted)] mt-2 text-center max-w-xs leading-relaxed">
                Seus insights estratégicos já foram processados e estão prontos para visualização.
             </p>
             <button 
                onClick={onComplete}
                className="mt-10 px-10 py-4 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20"
             >
                Ver Relatório Completo
             </button>
          </div>
        );

      default:
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-20">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--accent-start)]" />
            <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-50">Sincronizando Experiência...</p>
          </div>
        );
    }
  };

  return <div className="flex-1 flex flex-col h-full min-h-[500px]">{renderContent()}</div>;
}
