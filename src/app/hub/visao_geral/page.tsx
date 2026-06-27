"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { useJourney } from "@/hooks/useJourney";
import { getCareerPlanningDataAction } from "@/actions/career-module";
import { getMemberActivityArtifactsAction } from "@/actions/activity-artifacts";
import { getUserBookingsAction } from "@/actions/calendar";
import Link from "next/link";
import { 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  FileText, 
  MessageSquare, 
  Target, 
  ChevronRight, 
  Calendar, 
  Award, 
  FileDown, 
  Search, 
  Briefcase, 
  Activity,
  AlertCircle
} from "lucide-react";
import AtmosphericLoading from "@/components/shared/AtmosphericLoading";
import { cn } from "@/lib/utils";

interface VisaoGeralActivity {
  id: string;
  title: string;
  stageName: string;
  stageId: string;
  type: string;
  refId: string;
  status: "completed" | "in_progress" | "pending";
  url: string;
  documentUrl?: string;
  hasFeedback?: boolean;
  hasTaskDetail?: boolean;
  feedbackText?: string;
  taskStatus?: string;
  completionDate?: string;
  stageOrder: number;
  isSequenceLocked: boolean;
  isSubstepLocked: boolean;
  bookingStatus: "not_booked" | "booked_future" | "booked_past";
}

function normalizeStr(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/_/g, "-");
}

function isAtaOrFeedbackMatch(activityTitle: string, refId: string, itemTitle: string): boolean {
  const aTitle = normalizeStr(activityTitle);
  const iTitle = normalizeStr(itemTitle);
  const rId = normalizeStr(refId);

  if (aTitle === iTitle) return true;
  if (aTitle.includes(iTitle) || iTitle.includes(aTitle)) return true;

  // Keyword exceptions
  if (rId.includes("onboarding") && iTitle.includes("onboarding")) return true;
  if (rId.includes("devolutiva-analise") && (iTitle.includes("devolutiva") || iTitle.includes("perfil"))) return true;
  if (rId.includes("devolutiva-plano") && (iTitle.includes("plano") || iTitle.includes("pdi"))) return true;
  if (rId.includes("mentocoach") && iTitle.includes("mentocoach")) return true;
  if (rId.includes("offboarding") && iTitle.includes("offboarding")) return true;

  return false;
}

function getActivityName(type: string, refId: string, defaultTitle: string): string {
  const normalizedRefId = (refId || "").toLowerCase().replace(/-/g, "_");
  
  if (type === "survey") {
    switch (normalizedRefId) {
      case "desmistificando_candidaturas":
        return "Diagnostico de Oportunidades e Mercado Oculto";
      case "master_cv":
        return "Preenchimento do Master CV";
      case "cv_focado":
        return "Customizacao do CV Focado";
      case "perfil_profissional_publico":
        return "Otimizacao do Perfil Profissional Publico (LinkedIn)";
      case "preparacao_entrevistas_networking":
        return "Preparacao para Entrevistas e Networking";
      case "pre_analise_comportamental":
        return "Pre-Analise de Inteligencia Comportamental";
      case "feedback_posicionamento_profissional":
        return "Feedback de Posicionamento Profissional";
      case "check_in":
        return "Formulario de Check-in Metodologico";
      case "disc":
        return "Mapeamento do Perfil Comportamental (DISC)";
      case "preferencias_reconhecimento":
        return "Avaliacao de Preferencias de Reconhecimento";
      case "preferencias_aprendizado":
        return "Avaliacao de Preferencias de Aprendizado";
      case "gestao_tempo":
        return "Mapeamento de Gestao de Tempo";
      case "survey_plano_acordos":
        return "Avisos e Acordos do Plano de Carreira";
      case "survey_plano_fase1":
        return "Definicao de Objetivos do Plano de Carreira";
      case "survey_plano_fase2":
        return "Selecao de Recursos do Plano de Carreira";
      case "survey_plano_fase3":
        return "Plano de Acao de Carreira";
      case "survey_plano_fase4":
        return "Consolidacao do Plano de Carreira";
      case "survey_agendamento_devolutiva":
        return "Agendamento de Devolutiva do Plano de Carreira";
      case "offboarding_survey":
        return "Avaliacao de Fechamento de Ciclo";
      default:
        return defaultTitle;
    }
  }

  if (type === "meeting") {
    switch (normalizedRefId) {
      case "onboarding":
        return "Mentoria Individual de Onboarding";
      case "devolutiva_analise_comportamental":
        return "Mentoria Individual de Devolutiva de Perfil";
      case "devolutiva_plano_carreira":
        return "Mentoria Individual de Alinhamento de PDI";
      case "sessao_mentocoach":
        return "Sessao Individual de MentoCoach";
      case "offboarding":
        return "Mentoria Individual de Fechamento";
      default:
        return defaultTitle;
    }
  }

  return defaultTitle;
}

export default function VisaoGeralPage() {
  const { user } = useAuthContext();
  const { stages, progress, loading: journeyLoading, getStageTelemetry } = useJourney(user?.uid || "guest");
  
  const [careerData, setCareerData] = useState<any>(null);
  const [activityArtifacts, setActivityArtifacts] = useState<{ feedbacks: any[]; atas: any[]; sharedDocuments: any[] }>({ feedbacks: [], atas: [], sharedDocuments: [] });
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [loadingCareer, setLoadingCareer] = useState(true);
  const [activeDetailItem, setActiveDetailItem] = useState<VisaoGeralActivity | null>(null);

  // Filtros e ordenacao
  const [searchTerm, setSearchTerm] = useState("");
  const [sortPendentes, setSortPendentes] = useState<"service" | "title-asc" | "title-desc">("service");
  const [sortEmAndamento, setSortEmAndamento] = useState<"service" | "title-asc" | "title-desc">("service");
  const [sortConcluidas, setSortConcluidas] = useState<"service" | "title-asc" | "title-desc" | "date-desc" | "date-asc">("service");

  useEffect(() => {
    async function loadData() {
      if (progress?.matricula && progress.matricula !== "PENDING") {
        try {
          // 1. Artefatos de atividades (feedbacks, atas, docs) — SEM exigir career_planning
          const artifacts = await getMemberActivityArtifactsAction(progress.matricula);
          setActivityArtifacts(artifacts);

          // 2. Dados do módulo de carreira (backlog, objetivos) — exige career_planning
          try {
            const res = await getCareerPlanningDataAction(progress.matricula);
            if (res.success && res.data) {
              setCareerData(res.data);
            }
          } catch (careerErr) {
            // Módulo de carreira pode não estar liberado — ok, apenas backlog/objetivos não serão exibidos
            console.info("[VisaoGeral] Módulo de carreira não disponível para este membro.");
          }

          const bookings = await getUserBookingsAction(progress.matricula);
          setUserBookings(bookings || []);
        } catch (e) {
          console.error("Erro ao carregar dados de atividades/reunioes:", e);
        } finally {
          setLoadingCareer(false);
        }
      } else if (progress) {
        setLoadingCareer(false);
      }
    }
    loadData();
  }, [progress]);

  const activities = useMemo(() => {
    if (journeyLoading || stages.length === 0) return [];

    const list: VisaoGeralActivity[] = [];

    // 1. Identificar o primeiro estagio ativo e seu primeiro subpasso incompleto
    let firstActiveStageId = "";
    let firstIncompleteSubstepId = "";

    for (const stage of stages) {
      const tel = getStageTelemetry(stage.id);
      if (tel.status === "current" || tel.status === "available") {
        firstActiveStageId = stage.id;
        const completedIds = progress?.steps[stage.id]?.completedSubSteps || [];
        const incomplete = stage.substeps?.find(ss => !completedIds.includes(ss.id));
        if (incomplete) {
          firstIncompleteSubstepId = incomplete.id;
        }
        break;
      }
    }

    // 2. Mapear subpassos de jornada
    stages.forEach(stage => {
      // Pular estagios arquivados ou secundarios
      if (stage.id === "primeiros-passos" || stage.id === "primeiros_passos" || stage.order === 0) {
        return;
      }

      // 🛡️ Filtro de Habilitacao (adquirido pelo cliente)
      const telemetry = getStageTelemetry(stage.id);
      if (!telemetry.hasAccess) {
        return;
      }

      const completedIds = progress?.steps[stage.id]?.completedSubSteps || [];
      const compDates = progress?.steps[stage.id]?.subStepCompletionDates || {};
      const firstIncompleteIdx = stage.substeps?.findIndex(sub => !completedIds.includes(sub.id));

      stage.substeps?.forEach((sub, idx) => {
        // Ignorar atividades secundarias (perfil, networking, etc)
        const refIdLower = (sub.referenceId || "").toLowerCase();
        if (
          refIdLower.includes("perfil_settings") || 
          refIdLower.includes("networking") || 
          refIdLower.includes("tema")
        ) {
          return;
        }

        const isCompleted = completedIds.includes(sub.id);
        let status: "completed" | "in_progress" | "pending" = "pending";

        if (isCompleted) {
          status = "completed";
        } else if (stage.id === firstActiveStageId && sub.id === firstIncompleteSubstepId) {
          status = "in_progress";
        } else {
          status = "pending";
        }

        const friendlyTitle = getActivityName(sub.type, sub.referenceId, sub.title);

        // Correlacionar atas e feedbacks usando o titulo amigavel
        let documentUrl: string | undefined = undefined;
        let hasFeedback = false;
        let feedbackText: string | undefined = undefined;

        if (careerData) {
          // Documentos padrao gerados
          if (isCompleted) {
            if (sub.referenceId === "master_cv" || sub.referenceId === "cv_focado") {
              documentUrl = `/hub/membro/journey/${stage.id}`;
            } else if (sub.referenceId === "disc") {
              documentUrl = `/hub/membro/journey/${stage.id}`;
            } else if (sub.referenceId === "survey_plano_fase4") {
              documentUrl = `/hub/membro/journey/${stage.id}`;
            }
          }

          // Se houver atas de reunioes (via activityArtifacts — sem exigir career_planning)
          if (sub.type === "meeting" && activityArtifacts.atas.length > 0) {
            const matchedAta = activityArtifacts.atas.find((a: any) => 
              isAtaOrFeedbackMatch(friendlyTitle, sub.referenceId, a.title)
            );
            if (matchedAta) {
              documentUrl = matchedAta.fileUrl;
              hasFeedback = true;
              feedbackText = matchedAta.contentSummary || "Sessao realizada com sucesso.";
            }
          }

          // Se houver feedbacks cadastrados (via activityArtifacts)
          if (activityArtifacts.feedbacks.length > 0) {
            const matchedFb = activityArtifacts.feedbacks.find((f: any) => 
              isAtaOrFeedbackMatch(friendlyTitle, sub.referenceId, f.sessionTitle || f.title)
            );
            if (matchedFb) {
              hasFeedback = true;
              feedbackText = matchedFb.content || matchedFb.feedbackText || feedbackText;
            }
          }

          // Se houver documentos compartilhados (via activityArtifacts)
          if (activityArtifacts.sharedDocuments.length > 0) {
            const matchedDoc = activityArtifacts.sharedDocuments.find((d: any) => 
              isAtaOrFeedbackMatch(friendlyTitle, sub.referenceId, d.name || d.title)
            );
            if (matchedDoc && matchedDoc.fileUrl) {
              documentUrl = matchedDoc.fileUrl;
            }
          }
        }

        // Determinar status de agendamento (bookings)
        let bookingStatus: "not_booked" | "booked_future" | "booked_past" = "not_booked";
        if (sub.type === "meeting" && userBookings.length > 0) {
          const matchedBooking = userBookings.find(b => 
            isAtaOrFeedbackMatch(friendlyTitle, sub.referenceId, b.eventTheme || b.eventSummary || "")
          );
          if (matchedBooking) {
            const now = new Date();
            const eventDate = new Date(matchedBooking.dateTime);
            bookingStatus = eventDate > now ? "booked_future" : "booked_past";
          }
        }

        // Determinar bloqueios de checkpoint no mesmo estagio
        const isSubstepLocked = !isCompleted && firstIncompleteIdx !== undefined && idx > firstIncompleteIdx;

        list.push({
          id: sub.id,
          title: friendlyTitle,
          stageName: stage.title,
          stageId: stage.id,
          type: sub.type,
          refId: sub.referenceId,
          status,
          url: `/hub/membro/journey/${stage.id}`,
          documentUrl,
          hasFeedback,
          feedbackText,
          completionDate: compDates[sub.id],
          stageOrder: stage.order || 1,
          isSequenceLocked: telemetry.isSequenceLocked,
          isSubstepLocked,
          bookingStatus
        });
      });
    });

    // 3. Incluir tarefas de carreira (se a Gestao de Carreira estiver habilitada)
    const hasGdcAccess = stages.find(s => s.id === "gestao-e-desenvolvimento")?.id;
    if (hasGdcAccess && careerData?.backlog && careerData.backlog.length > 0) {
      careerData.backlog.forEach((task: any) => {
        let status: "completed" | "in_progress" | "pending" = "pending";
        if (task.status === "Concluida" || task.status === "Concluída") {
          status = "completed";
        } else if (task.status === "Em Andamento") {
          status = "in_progress";
        }

        list.push({
          id: task.id || `task-${task.title}`,
          title: task.title,
          stageName: "Backlog de Carreira",
          stageId: "gestao-e-desenvolvimento",
          type: "task",
          refId: task.id || "",
          status,
          url: "/hub/membro/gestao_carreira",
          hasTaskDetail: true,
          taskStatus: task.status,
          feedbackText: task.feedback || task.notes,
          completionDate: task.completedAt || task.updatedAt || undefined,
          stageOrder: 5,
          isSequenceLocked: false,
          isSubstepLocked: false,
          bookingStatus: "not_booked"
        });
      });
    }

    // 4. Incluir metas estrategicas
    if (hasGdcAccess && careerData?.objectives && careerData.objectives.length > 0) {
      careerData.objectives.forEach((obj: any) => {
        let status: "completed" | "in_progress" | "pending" = "pending";
        if (obj.status === "Concluido" || obj.status === "Concluído") {
          status = "completed";
        } else if (obj.status === "Em Andamento") {
          status = "in_progress";
        }

        list.push({
          id: obj.id || `obj-${obj.title}`,
          title: `Meta: ${obj.title}`,
          stageName: "Objetivos Estrategicos",
          stageId: "gestao-e-desenvolvimento",
          type: "objective",
          refId: obj.id || "",
          status,
          url: "/hub/membro/gestao_carreira",
          hasTaskDetail: true,
          taskStatus: obj.status,
          feedbackText: obj.description,
          completionDate: obj.completedAt || obj.updatedAt || undefined,
          stageOrder: 5,
          isSequenceLocked: false,
          isSubstepLocked: false,
          bookingStatus: "not_booked"
        });
      });
    }

    return list;
  }, [stages, progress, journeyLoading, careerData, activityArtifacts, userBookings, getStageTelemetry]);

  // Filtro de busca global
  const filteredActivities = useMemo(() => {
    if (!searchTerm.trim()) return activities;
    const term = normalizeStr(searchTerm);
    return activities.filter(act => 
      normalizeStr(act.title).includes(term) ||
      normalizeStr(act.stageName).includes(term) ||
      normalizeStr(act.feedbackText || "").includes(term)
    );
  }, [activities, searchTerm]);

  // Ordenador genérico
  const sortActivities = (list: VisaoGeralActivity[], mode: string) => {
    const sorted = [...list];
    if (mode === "title-asc") {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (mode === "title-desc") {
      sorted.sort((a, b) => b.title.localeCompare(a.title));
    } else if (mode === "service") {
      sorted.sort((a, b) => a.stageOrder - b.stageOrder);
    } else if (mode === "date-desc") {
      sorted.sort((a, b) => {
        const timeA = a.completionDate ? new Date(a.completionDate).getTime() : 0;
        const timeB = b.completionDate ? new Date(b.completionDate).getTime() : 0;
        return timeB - timeA;
      });
    } else if (mode === "date-asc") {
      sorted.sort((a, b) => {
        const timeA = a.completionDate ? new Date(a.completionDate).getTime() : 9999999999999;
        const timeB = b.completionDate ? new Date(b.completionDate).getTime() : 9999999999999;
        return timeA - timeB;
      });
    }
    return sorted;
  };

  const pendentesSorted = useMemo(() => 
    sortActivities(filteredActivities.filter(a => a.status === "pending"), sortPendentes),
    [filteredActivities, sortPendentes]
  );

  const emAndamentoSorted = useMemo(() => 
    sortActivities(filteredActivities.filter(a => a.status === "in_progress"), sortEmAndamento),
    [filteredActivities, sortEmAndamento]
  );

  const concluidasSorted = useMemo(() => 
    sortActivities(filteredActivities.filter(a => a.status === "completed"), sortConcluidas),
    [filteredActivities, sortConcluidas]
  );

  if (journeyLoading || loadingCareer) {
    return <AtmosphericLoading />;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Central de Atividades */}
      <div className="glass p-10 relative overflow-hidden flex flex-col md:flex-row items-center md:items-start justify-between gap-6 border-[var(--glass-border)] rounded-[3rem]">
        <div className="relative z-10 flex gap-6 items-center">
          <div className="w-16 h-16 rounded-3xl bg-[var(--accent-start)]/10 text-[var(--accent-start)] flex items-center justify-center flex-shrink-0 shadow-inner border border-[var(--accent-start)]/20">
            <Activity size={32} />
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-[var(--text-primary)] tracking-tight uppercase italic drop-shadow-md">
              Visao Geral de Atividades
            </h1>
            <p className="text-xs font-bold text-[var(--text-muted)] mt-1 uppercase tracking-[0.2em]">
              Central de Acompanhamento e Progresso de Carreira
            </p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="glass p-5 border-[var(--glass-border)] rounded-[2rem] flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Buscar por titulo de atividade, estagio ou feedback recebido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] text-sm rounded-xl focus:border-[var(--accent-start)]/50 focus:outline-none transition-all text-[var(--text-primary)] font-medium"
          />
        </div>
      </div>

      {/* Grid de 3 Colunas Horizontais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Coluna 1: Proximas Atividades */}
        <div className="glass p-6 border-[var(--glass-border)] rounded-[2.5rem] flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-4 mb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)] flex items-center gap-2">
              <Clock size={14} className="text-yellow-500" /> Proximas
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={sortPendentes}
                onChange={(e: any) => setSortPendentes(e.target.value)}
                className="bg-[var(--input-bg)] border border-[var(--border-primary)] text-[9px] font-bold text-[var(--text-muted)] rounded-lg px-2 py-1 outline-none cursor-pointer focus:border-[var(--accent-start)]/30"
              >
                <option value="service">Servico</option>
                <option value="title-asc">A-Z</option>
                <option value="title-desc">Z-A</option>
              </select>
              <span className="text-[9px] font-mono bg-yellow-500/10 text-yellow-600 px-2.5 py-0.5 rounded-full font-bold">
                {pendentesSorted.length}
              </span>
            </div>
          </div>

          <div className="space-y-3 flex-1">
            {pendentesSorted.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-40">
                <CheckCircle2 size={32} className="text-[var(--text-muted)] mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Nenhuma atividade pendente</p>
              </div>
            ) : (
              pendentesSorted.map(act => (
                <ActivityRow key={act.id} activity={act} onOpenDetails={setActiveDetailItem} />
              ))
            )}
          </div>
        </div>

        {/* Coluna 2: Atividades em Andamento */}
        <div className="glass p-6 border-[var(--glass-border)] rounded-[2.5rem] flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-4 mb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)] flex items-center gap-2">
              <Activity size={14} className="text-blue-500" /> Em Foco
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={sortEmAndamento}
                onChange={(e: any) => setSortEmAndamento(e.target.value)}
                className="bg-[var(--input-bg)] border border-[var(--border-primary)] text-[9px] font-bold text-[var(--text-muted)] rounded-lg px-2 py-1 outline-none cursor-pointer focus:border-[var(--accent-start)]/30"
              >
                <option value="service">Servico</option>
                <option value="title-asc">A-Z</option>
                <option value="title-desc">Z-A</option>
              </select>
              <span className="text-[9px] font-mono bg-blue-500/10 text-blue-600 px-2.5 py-0.5 rounded-full font-bold">
                {emAndamentoSorted.length}
              </span>
            </div>
          </div>

          <div className="space-y-3 flex-1">
            {emAndamentoSorted.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-40">
                <Clock size={32} className="text-[var(--text-muted)] mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Foco concluido no momento</p>
              </div>
            ) : (
              emAndamentoSorted.map(act => (
                <ActivityRow key={act.id} activity={act} onOpenDetails={setActiveDetailItem} />
              ))
            )}
          </div>
        </div>

        {/* Coluna 3: Atividades Concluidas */}
        <div className="glass p-6 border-[var(--glass-border)] rounded-[2.5rem] flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-4 mb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)] flex items-center gap-2">
              <CheckCircle2 size={14} className="text-green-500" /> Concluidas
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={sortConcluidas}
                onChange={(e: any) => setSortConcluidas(e.target.value)}
                className="bg-[var(--input-bg)] border border-[var(--border-primary)] text-[9px] font-bold text-[var(--text-muted)] rounded-lg px-2 py-1 outline-none cursor-pointer focus:border-[var(--accent-start)]/30"
              >
                <option value="service">Servico</option>
                <option value="date-desc">Recentes</option>
                <option value="date-asc">Antigas</option>
                <option value="title-asc">A-Z</option>
                <option value="title-desc">Z-A</option>
              </select>
              <span className="text-[9px] font-mono bg-green-500/10 text-green-600 px-2.5 py-0.5 rounded-full font-bold">
                {concluidasSorted.length}
              </span>
            </div>
          </div>

          <div className="space-y-3 flex-1">
            {concluidasSorted.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-40">
                <AlertCircle size={32} className="text-[var(--text-muted)] mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Nenhuma atividade concluida</p>
              </div>
            ) : (
              concluidasSorted.map(act => (
                <ActivityRow key={act.id} activity={act} onOpenDetails={setActiveDetailItem} />
              ))
            )}
          </div>
        </div>

      </div>

      {/* Modal Lateral de Detalhes (Ata/Feedback/Notas) */}
      {activeDetailItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass max-w-lg w-full p-8 border-[var(--glass-border)] rounded-[3rem] relative space-y-6 text-left animate-in zoom-in duration-300">
            <div className="flex items-start justify-between border-b border-[var(--border-primary)] pb-4">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--accent-start)] block mb-1">
                  {activeDetailItem.stageName}
                </span>
                <h3 className="text-lg font-bold text-[var(--text-primary)] leading-tight">{activeDetailItem.title}</h3>
              </div>
              <button 
                onClick={() => setActiveDetailItem(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 text-xs font-black tracking-widest"
              >
                FECHAR
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-1">
                  Status
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-[var(--input-bg)] border border-[var(--border-primary)] text-[var(--text-primary)]">
                  {activeDetailItem.status === "completed" ? "Concluido" : activeDetailItem.status === "in_progress" ? "Em Andamento" : "Pendente"}
                </span>
              </div>

              {activeDetailItem.feedbackText && (
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-1">
                    Feedback / Notas do Consultor
                  </span>
                  <div className="p-4 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl text-xs font-medium leading-relaxed text-[var(--text-secondary)] whitespace-pre-line">
                    {activeDetailItem.feedbackText}
                  </div>
                </div>
              )}

              {activeDetailItem.documentUrl && (
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-2">
                    Documento Disponivel
                  </span>
                  <Link 
                    href={activeDetailItem.documentUrl}
                    target={activeDetailItem.documentUrl.startsWith("http") ? "_blank" : "_self"}
                    className="flex items-center justify-between p-4 bg-[var(--accent-soft)] hover:bg-[var(--accent-soft)]/80 border border-[var(--accent-start)]/20 rounded-2xl text-xs font-bold text-[var(--text-primary)] group transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <FileDown size={16} className="text-[var(--accent-start)]" />
                      Visualizar/Baixar Documento
                    </span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border-primary)]">
              {activeDetailItem.status !== "completed" && (
                <Link
                  href={activeDetailItem.url}
                  className="px-6 py-3 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all text-center flex-1"
                  onClick={() => setActiveDetailItem(null)}
                >
                  Ir para
                </Link>
              )}
              <button
                onClick={() => setActiveDetailItem(null)}
                className="px-6 py-3 bg-[var(--input-bg)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[var(--input-bg)]/80 transition-all flex-grow-0"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function ActivityRow({ 
  activity, 
  onOpenDetails 
}: { 
  activity: VisaoGeralActivity; 
  onOpenDetails: (act: VisaoGeralActivity) => void;
}) {
  const isCompleted = activity.status === "completed";
  const isInProgress = activity.status === "in_progress";

  // Obter ícone baseado no tipo
  let Icon = Search;
  if (activity.type === "survey") Icon = MessageSquare;
  if (activity.type === "meeting") Icon = Calendar;
  if (activity.type === "objective") Icon = Target;
  if (activity.type === "task") Icon = Briefcase;
  if (activity.type === "result") Icon = Award;

  // Máquina de estados de CTAs dinâmicos
  let ctaLabel = "Ir para";
  let ctaClass = "bg-[var(--text-primary)] hover:bg-[var(--text-primary)]/90 text-[var(--bg-primary)] hover:scale-105";
  let ctaEnabled = true;

  if (!isCompleted) {
    if (activity.isSequenceLocked) {
      ctaLabel = "Aguardando Etapa Anterior";
      ctaClass = "bg-white/5 border border-white/5 text-[var(--text-muted)] opacity-50 cursor-not-allowed";
      ctaEnabled = false;
    } else if (activity.isSubstepLocked) {
      ctaLabel = "Aguardando Checkpoint Anterior";
      ctaClass = "bg-white/5 border border-white/5 text-[var(--text-muted)] opacity-50 cursor-not-allowed";
      ctaEnabled = false;
    } else if (activity.type === "meeting") {
      if (activity.bookingStatus === "not_booked") {
        ctaLabel = "Agendar Reuniao";
        ctaClass = "bg-[var(--accent-start)] hover:opacity-90 text-white shadow-lg shadow-accent-start/20 animate-pulse";
      } else if (activity.bookingStatus === "booked_future") {
        ctaLabel = "Aguardando Data do Evento";
        ctaClass = "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 cursor-not-allowed";
        ctaEnabled = false;
      } else if (activity.bookingStatus === "booked_past") {
        ctaLabel = "Aguardando Encerramento";
        ctaClass = "bg-blue-500/10 text-blue-600 border border-blue-500/20 cursor-not-allowed";
        ctaEnabled = false;
      }
    }
  }

  // Formatar data de conclusão se aplicável
  const formattedDate = useMemo(() => {
    if (!isCompleted || !activity.completionDate) return null;
    try {
      const d = new Date(activity.completionDate);
      return d.toLocaleDateString("pt-BR");
    } catch {
      return null;
    }
  }, [isCompleted, activity.completionDate]);

  return (
    <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--input-border)] hover:bg-white/5 transition-all group flex flex-col justify-between gap-3 text-left relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2.5 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl text-[var(--text-muted)] group-hover:text-[var(--accent-start)] transition-all shrink-0 mt-0.5">
            <Icon size={16} />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-[var(--text-primary)] group-hover:translate-x-0.5 transition-transform leading-snug break-words">
              {activity.title}
            </h4>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">
                {activity.stageName}
              </span>
              {formattedDate && (
                <>
                  <span className="text-[8px] text-[var(--text-muted)] opacity-40">•</span>
                  <span className="text-[8px] font-mono text-[var(--text-muted)] font-bold">
                    Concluido em {formattedDate}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pt-2 border-t border-[var(--border-primary)]/50">
        
        {/* Badges de Status Real de Progressão */}
        <div>
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[8px] font-black uppercase tracking-widest border border-green-500/20">
              Concluido
            </span>
          ) : isInProgress ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[8px] font-black uppercase tracking-widest border border-blue-500/20">
              Em Foco
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/5 text-yellow-600/80 text-[8px] font-black uppercase tracking-widest border border-yellow-500/10">
              Pendente
            </span>
          )}
        </div>

        {/* Ícones de Interação e Navegação */}
        <div className="flex items-center gap-2">
          {/* Documento Atrelado */}
          {activity.documentUrl && (
            <Link
              href={activity.documentUrl}
              target={activity.documentUrl.startsWith("http") ? "_blank" : "_self"}
              className="p-1.5 rounded-lg bg-[var(--input-bg)] border border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--accent-start)] hover:border-[var(--accent-start)]/20 transition-all"
              title="Ver documento associado"
            >
              <FileDown size={12} />
            </Link>
          )}

          {/* Feedback/Ata/Notas */}
          {activity.hasFeedback && (
            <button
              onClick={() => onOpenDetails(activity)}
              className="p-1.5 rounded-lg bg-[var(--input-bg)] border border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--accent-start)] hover:border-[var(--accent-start)]/20 transition-all animate-pulse"
              title="Ver feedback/atas"
            >
              <MessageSquare size={12} />
            </button>
          )}

          {/* Detalhes de metas de carreira */}
          {activity.hasTaskDetail && (
            <button
              onClick={() => onOpenDetails(activity)}
              className="p-1.5 rounded-lg bg-[var(--input-bg)] border border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--accent-start)] hover:border-[var(--accent-start)]/20 transition-all"
              title="Ver detalhes da tarefa/meta"
            >
              <Target size={12} />
            </button>
          )}

          {/* Botão de Ir para Atividade */}
          {!isCompleted && (
            ctaEnabled ? (
              <Link
                href={activity.url}
                className={cn("px-2.5 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all text-center shrink-0", ctaClass)}
              >
                {ctaLabel}
              </Link>
            ) : (
              <span className={cn("px-2.5 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg text-center shrink-0", ctaClass)}>
                {ctaLabel}
              </span>
            )
          )}
        </div>

      </div>
    </div>
  );
}
