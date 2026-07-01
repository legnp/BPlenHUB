"use client";

import React, { useState, useEffect } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { useJourney } from "@/hooks/useJourney";
import { 
  ArrowLeft, 
  Briefcase, 
  Calendar, 
  Upload, 
  MessageSquare, 
  CheckSquare, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  ExternalLink, 
  Lock, 
  Award, 
  Activity, 
  Check, 
  BookOpen, 
  Sparkles, 
  Clock, 
  Target,
  FileText,
  HelpCircle
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  getCareerPlanningDataAction, 
  addCareerTaskAction,
  updateCareerTaskStatusAction,
  addCareerTaskCommentAction,
  deleteCareerTaskAction,
  saveCareerObjectiveAction,
  updateCareerGoalProgressAction
} from "@/actions/career-module";
import { getUserBookingsAction, getUserOneToOneQuotaAction } from "@/actions/calendar-module/queries";
import { CareerTask, CareerTaskStatus, CareerObjective, CareerGoal } from "@/types/career";
import { getErrorMessage } from "@/lib/utils/errors";

function extractGoogleDriveFileId(url: string): string | null {
  if (!url) return null;
  
  // Pattern 1: /file/d/([a-zA-Z0-9_-]+)
  const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) return fileDMatch[1];
  
  // Pattern 2: id=([a-zA-Z0-9_-]+)
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return idMatch[1];
  
  // Pattern 3: /d/([a-zA-Z0-9_-]+)
  const dMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch && dMatch[1]) return dMatch[1];
  
  return null;
}

export default function GestaoCarreiraPage() {
  const { user, matricula } = useAuthContext();
  
  // Dynamic Journey integration
  const { stages, progress, loading: journeyLoading } = useJourney(user?.uid || "guest");

  // Career module states
  const [careerData, setCareerData] = useState<any>(null);
  const [loadingCareer, setLoadingCareer] = useState<boolean>(true);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  // Mentoring states
  const [mentoringQuotaTotal, setMentoringQuotaTotal] = useState<number | null>(null);
  const [mentoringBookings, setMentoringBookings] = useState<any[]>([]);

  // New task state
  const [newTaskTitle, setNewTaskTitle] = useState<string>("");
  const [submittingTask, setSubmittingTask] = useState<boolean>(false);

  // Task comments state (taskId -> commentText)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  // New Objective modal/inline state
  const [showObjForm, setShowObjForm] = useState<boolean>(false);
  const [objTitle, setObjTitle] = useState<string>("");
  const [objDesc, setObjSummary] = useState<string>("");
  const [objTargetDate, setObjTargetDate] = useState<string>("");
  const [objGoals, setObjGoals] = useState<Array<Omit<CareerGoal, "id">>>([]);
  const [newGoalTitle, setNewGoalTitle] = useState<string>("");
  const [newGoalTarget, setNewGoalTarget] = useState<number>(100);
  const [newGoalUnit, setNewGoalUnit] = useState<string>("%");
  const [submittingObj, setSubmittingObj] = useState<boolean>(false);

  // Load career data
  const loadCareerData = async () => {
    if (!matricula) return;
    setLoadingCareer(true);
    try {
      const res = await getCareerPlanningDataAction(matricula);
      if (res.success && res.data) {
        setCareerData(res.data);
      } else {
        setCareerData(null);
      }

      // Fetch mentoring data
      const bookingsRes = await getUserBookingsAction(matricula);
      const quotaRes = await getUserOneToOneQuotaAction(matricula);
      
      const oneToOneBookings = bookingsRes.filter(b => b.category === "1to1");
      setMentoringBookings(oneToOneBookings);
      setMentoringQuotaTotal(quotaRes);

    } catch (err) {
      console.error("Erro ao carregar planejamento de carreira:", err);
    } finally {
      setLoadingCareer(false);
    }
  };

  useEffect(() => {
    if (matricula) {
      loadCareerData();
    }
  }, [matricula]);

  // Handle access gate
  const hasAccess = careerData?.isCareerPlanningReleased === true;

  // Toggle Accordions
  const toggleAccordion = (section: string) => {
    setActiveAccordion(prev => (prev === section ? null : section));
  };

  // Handle secure Google Drive document downloading/viewing via proxy
  const handleDownloadFile = async (e: React.MouseEvent, fileUrl: string) => {
    e.preventDefault();
    if (!user) return;

    const fileId = extractGoogleDriveFileId(fileUrl);
    if (fileId) {
      try {
        const token = await user.getIdToken();
        window.open(`/api/docs/${fileId}?token=${token}`, "_blank");
      } catch (err) {
        console.error("Erro ao obter token de acesso para documento:", err);
        window.open(fileUrl, "_blank"); // fallback seguro
      }
    } else {
      window.open(fileUrl, "_blank"); // fallback seguro para URLs externas
    }
  };

  // Add Backlog Task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricula || !newTaskTitle.trim() || submittingTask) return;
    setSubmittingTask(true);
    try {
      const res = await addCareerTaskAction(matricula, newTaskTitle);
      if (res.success && res.task) {
        setNewTaskTitle("");
        await loadCareerData(); // Reload updated backlog
      } else {
        alert(res.error || "Erro ao adicionar tarefa.");
      }
    } catch (err: unknown) {
      alert("Erro de conexao: " + getErrorMessage(err));
    } finally {
      setSubmittingTask(false);
    }
  };

  // Update Task Status
  const handleUpdateTaskStatus = async (taskId: string, newStatus: CareerTaskStatus) => {
    if (!matricula) return;
    try {
      const res = await updateCareerTaskStatusAction(matricula, taskId, newStatus);
      if (res.success) {
        setCareerData((prev: any) => {
          if (!prev) return null;
          const updatedBacklog = prev.backlog.map((task: CareerTask) => {
            if (task.id === taskId) {
              return {
                ...task,
                status: newStatus,
                statusHistory: [
                  ...task.statusHistory,
                  { status: newStatus, changedAt: new Date().toISOString() }
                ]
              };
            }
            return task;
          });
          return { ...prev, backlog: updatedBacklog };
        });
      } else {
        alert(res.error || "Erro ao atualizar status da tarefa.");
      }
    } catch (err: unknown) {
      alert("Erro ao alterar status: " + getErrorMessage(err));
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (!matricula || !window.confirm("Deseja realmente remover esta tarefa?")) return;
    try {
      const res = await deleteCareerTaskAction(matricula, taskId);
      if (res.success) {
        setCareerData((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            backlog: prev.backlog.filter((t: CareerTask) => t.id !== taskId)
          };
        });
      } else {
        alert(res.error || "Erro ao remover tarefa.");
      }
    } catch (err: unknown) {
      alert("Erro ao remover tarefa: " + getErrorMessage(err));
    }
  };

  // Add Comment to Task
  const handleAddComment = async (taskId: string) => {
    const text = commentInputs[taskId];
    if (!matricula || !text || !text.trim() || submittingComment[taskId]) return;
    
    setSubmittingComment(prev => ({ ...prev, [taskId]: true }));
    try {
      const res = await addCareerTaskCommentAction(matricula, taskId, text);
      if (res.success && res.comment) {
        // Clear input
        setCommentInputs(prev => ({ ...prev, [taskId]: "" }));
        // Add locally
        setCareerData((prev: any) => {
          if (!prev) return null;
          const updatedBacklog = prev.backlog.map((task: CareerTask) => {
            if (task.id === taskId) {
              return {
                ...task,
                comments: [...task.comments, res.comment!]
              };
            }
            return task;
          });
          return { ...prev, backlog: updatedBacklog };
        });
      } else {
        alert(res.error || "Erro ao registrar comentario.");
      }
    } catch (err: unknown) {
      alert("Erro: " + getErrorMessage(err));
    } finally {
      setSubmittingComment(prev => ({ ...prev, [taskId]: false }));
    }
  };

  // Add Inline Goal to Temporary Objective List
  const handleAddGoalToTempList = () => {
    if (!newGoalTitle.trim()) return;
    setObjGoals(prev => [
      ...prev,
      {
        title: newGoalTitle.trim(),
        targetValue: newGoalTarget,
        currentValue: 0,
        unit: newGoalUnit,
        completed: false
      }
    ]);
    setNewGoalTitle("");
  };

  // Save Strategic Objective
  const handleSaveObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricula || !objTitle.trim() || submittingObj) return;
    setSubmittingObj(true);
    try {
      const formattedGoals = objGoals.map((g, idx) => ({
        id: `g_${idx}_${Date.now()}`,
        ...g
      }));
      const res = await saveCareerObjectiveAction(
        matricula,
        null,
        objTitle,
        objDesc,
        "Não Iniciado",
        objTargetDate,
        formattedGoals
      );
      if (res.success) {
        setShowObjForm(false);
        setObjTitle("");
        setObjSummary("");
        setObjTargetDate("");
        setObjGoals([]);
        await loadCareerData(); // Reload objectives
      } else {
        alert(res.error || "Falha ao gravar objetivo estratégico.");
      }
    } catch (err: unknown) {
      alert("Erro: " + getErrorMessage(err));
    } finally {
      setSubmittingObj(false);
    }
  };

  // Update Goal Progress
  const handleUpdateGoalProgress = async (objectiveId: string, goalId: string, value: number) => {
    if (!matricula) return;
    try {
      const res = await updateCareerGoalProgressAction(matricula, objectiveId, goalId, value);
      if (res.success) {
        // Optimistic UI updates
        setCareerData((prev: any) => {
          if (!prev) return null;
          const updatedObjectives = prev.objectives.map((obj: CareerObjective) => {
            if (obj.id === objectiveId) {
              const updatedGoals = obj.goals.map((g) => {
                if (g.id === goalId) {
                  return {
                    ...g,
                    currentValue: value,
                    completed: value >= g.targetValue
                  };
                }
                return g;
              });
              
              // Recalcular status do objetivo geral
              let nextStatus = obj.status;
              const completedCount = updatedGoals.filter(g => g.completed).length;
              if (updatedGoals.length > 0) {
                if (completedCount === updatedGoals.length) {
                  nextStatus = "Alcançado";
                } else if (completedCount > 0 || value > 0) {
                  nextStatus = "Em Andamento";
                } else {
                  nextStatus = "Não Iniciado";
                }
              }

              return {
                ...obj,
                goals: updatedGoals,
                status: nextStatus
              };
            }
            return obj;
          });
          return { ...prev, objectives: updatedObjectives };
        });
      } else {
        alert(res.error || "Erro ao salvar progresso.");
      }
    } catch (err: unknown) {
      alert("Erro de conexao: " + getErrorMessage(err));
    }
  };

  // Get status class for objectives
  const getObjectiveStatusStyle = (status: string) => {
    switch (status) {
      case "Alcançado":
        return "bg-green-500/10 text-green-400 border border-green-500/25";
      case "Em Andamento":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/25";
      case "Pausado":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/25";
      default:
        return "bg-gray-500/10 text-gray-400 border border-gray-500/25";
    }
  };

  // 1 to 1 Quotas and Statuses Calculation
  const mentoringUsed = mentoringBookings.filter(b => b.attendanceStatus === "present").length;
  const mentoringPending = mentoringBookings.filter(b => !b.attendanceStatus || b.attendanceStatus === "pending").length;
  const mentoringAbsent = mentoringBookings.filter(b => b.attendanceStatus === "absent" || ["rescheduled", "cancelled"].includes(b.eventLifecycleStatus || "")).length;

  // Render Gate / Loading States
  if (loadingCareer || journeyLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center space-y-4">
        <Loader2 size={36} className="animate-spin text-[var(--accent-start)]" />
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)]">
          Carregando Hub de Carreira...
        </p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6 max-w-lg mx-auto space-y-6">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-full text-red-500">
          <Lock size={28} />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-black text-[var(--text-primary)]">Módulo Bloqueado</h2>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            A Gestao de Carreira ainda nao esta ativa para sua conta. Entre em contato com seu consultor BPlen para liberar o acesso.
          </p>
        </div>
        <Link 
          href="/hub/membro"
          className="px-6 py-3 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--input-bg)]/80 text-[var(--text-primary)] transition-all flex items-center gap-2"
        >
          <ArrowLeft size={14} /> Voltar ao Painel Principal
        </Link>
      </div>
    );
  }

  // Calculate dynamics metrics
  const activeObjectives = careerData?.objectives || [];
  const completedObjectives = activeObjectives.filter((o: CareerObjective) => o.status === "Alcançado").length;
  const totalTasks = careerData?.backlog?.length || 0;
  const completedTasks = careerData?.backlog?.filter((t: CareerTask) => t.status === "Concluída").length || 0;

  return (
    <div className="flex flex-col min-h-screen text-left">
      <div className="max-w-[1440px] mx-auto pt-[10px] px-6 pb-12 md:px-12 space-y-10 w-full animate-fade-in">
        
        {/* HEADER & NAVIGATION */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[var(--border-primary)]/40 pb-6">
          <div className="space-y-4">
            <Link 
              href="/hub/membro"
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Painel Principal
            </Link>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent-start)]">Plataforma de Desenvolvimento</span>
              <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Gestao e Desenvolvimento da sua Carreira</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-gradient-to-r from-[var(--accent-start)]/10 to-[var(--accent-end)]/10 border border-[var(--accent-start)]/20 rounded-full flex items-center gap-2">
              <Activity size={12} className="text-[var(--accent-start)]" />
              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-primary)]">
                Jornada: {progress?.overallProgress || 0}% Concluido
              </span>
            </div>
          </div>
        </header>

        {/* METRICS & OVERALL STATUS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[2rem] flex items-center gap-4 shadow-sm">
            <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl">
              <Target size={20} />
            </div>
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">Objetivos Estrategicos</span>
              <p className="text-xl font-black text-[var(--text-primary)] mt-1">
                {completedObjectives}/{activeObjectives.length}
              </p>
            </div>
          </div>

          <div className="p-6 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[2rem] flex items-center gap-4 shadow-sm">
            <div className="p-3.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl">
              <CheckSquare size={20} />
            </div>
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">Backlog Checklist</span>
              <p className="text-xl font-black text-[var(--text-primary)] mt-1">
                {completedTasks}/{totalTasks}
              </p>
            </div>
          </div>

          <div className="p-6 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[2rem] flex items-center gap-4 shadow-sm">
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl">
              <Clock size={20} />
            </div>
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">Atas de Reunioes</span>
              <p className="text-xl font-black text-[var(--text-primary)] mt-1">
                {careerData?.atas?.length || 0}
              </p>
            </div>
          </div>

          <div className="p-6 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[2rem] flex items-center gap-4 shadow-sm">
            <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
              <FileText size={20} />
            </div>
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">Docs Compartilhados</span>
              <p className="text-xl font-black text-[var(--text-primary)] mt-1">
                {careerData?.sharedDocuments?.length || 0}
              </p>
            </div>
          </div>
        </div>

        {/* DOUBLE COLUMN: JOURNEY PROGRESSION & MENTORING QUOTAS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT CONTAINER: JOURNEY CHECKPOINTS */}
          <div className="lg:col-span-6 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[3.5rem] p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-3 text-left">
              <div className="p-3 bg-[var(--accent-start)]/10 rounded-2xl border border-[var(--accent-start)]/20 text-[var(--accent-start)]">
                <Award size={18} />
              </div>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">Progressao Jornada de Membro BPlen</h3>
                <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">Acompanhe suas paradas, checkpoints e evolucoes</p>
              </div>
            </div>

            <div className="space-y-4 max-h-[380px] overflow-y-auto custom-scrollbar pr-2">
              {stages.map((stage) => {
                const stepProgress = progress?.steps[stage.id];
                const totalSub = stage.substeps.length;
                const completedSub = stepProgress?.completedSubSteps?.length || 0;
                const percent = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0;

                return (
                  <div key={stage.id} className="p-4 bg-[var(--bg-primary)]/40 border border-[var(--border-primary)]/40 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col text-left">
                        <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">Fase {stage.order}</span>
                        <span className="text-[11px] font-black text-[var(--text-primary)] mt-0.5">{stage.title}</span>
                      </div>
                      <span className="text-[9px] font-mono font-black text-[var(--accent-start)]">{percent}%</span>
                    </div>

                    <div className="w-full bg-[var(--border-primary)]/40 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)] h-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {stage.substeps.map((sub) => {
                        const isDone = stepProgress?.completedSubSteps?.includes(sub.id);
                        return (
                          <div key={sub.id} className="flex items-center gap-1.5">
                            <div className={`w-3 h-3 rounded-full flex items-center justify-center border ${
                              isDone 
                                ? "bg-green-500/15 border-green-500 text-green-400" 
                                : "border-[var(--border-primary)] text-[var(--text-muted)] opacity-40"
                            }`}>
                              {isDone && <Check size={8} />}
                            </div>
                            <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{sub.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT CONTAINER: MENTORING QUOTAS (1 to 1 PROGRESSION) */}
          <div className="lg:col-span-6 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[3.5rem] p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-3 text-left">
              <div className="p-3 bg-[var(--accent-start)]/10 rounded-2xl border border-[var(--accent-start)]/20 text-[var(--accent-start)]">
                <BookOpen size={18} />
              </div>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">Progressao de 1 to 1</h3>
                <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">Controle de saldo de mentorias e acompanhamentos executivos</p>
              </div>
            </div>

            {mentoringQuotaTotal !== null && mentoringQuotaTotal > 0 ? (
              <div className="p-6 bg-[var(--bg-primary)]/40 border border-[var(--border-primary)]/40 rounded-2xl space-y-5 text-center">
                <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                  {/* Circle SVG bar */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      stroke="var(--border-primary)" 
                      strokeWidth="6" 
                      fill="transparent" 
                      className="opacity-35"
                    />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      stroke="var(--accent-start)" 
                      strokeWidth="6" 
                      fill="transparent" 
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * (mentoringUsed / mentoringQuotaTotal))}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-black text-[var(--text-primary)]">{mentoringUsed} / {mentoringQuotaTotal}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60 mt-0.5">Sessoes Consumidas</span>
                  </div>
                </div>

                <div className="border-t border-[var(--border-primary)]/40 pt-4 flex justify-around text-left">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">Saldo Restante</span>
                    <p className="text-sm font-bold text-[var(--text-primary)] mt-0.5">{mentoringQuotaTotal - mentoringUsed} sessoes</p>
                  </div>
                  <div className="border-l border-[var(--border-primary)]/40 pl-6">
                    <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">Cota Total Contratada</span>
                    <p className="text-sm font-bold text-[var(--text-primary)] mt-0.5">{mentoringQuotaTotal} sessoes</p>
                  </div>
                </div>

                {/* Sublist: Event Status */}
                <div className="border-t border-[var(--border-primary)]/40 pt-4 flex flex-col gap-2 text-left px-2">
                   <div className="flex items-center justify-between">
                     <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5"><Clock size={12} /> Pendentes de Realização</span>
                     <span className="text-[10px] font-black text-[var(--text-primary)]">{mentoringPending}</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-[9px] font-bold uppercase tracking-widest text-red-400 flex items-center gap-1.5"><Trash2 size={12} /> Ausências / Remarcadas</span>
                     <span className="text-[10px] font-black text-[var(--text-primary)]">{mentoringAbsent}</span>
                   </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center space-y-2 border border-dashed border-[var(--border-primary)]/60 rounded-2xl">
                <Sparkles size={24} className="text-[var(--text-muted)] opacity-30 mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] mt-2">Você ainda não tem cotas de 1 to 1</p>
                <p className="text-[9px] text-[var(--text-muted)] mt-1">Sua cota contratada não foi identificada no sistema.</p>
              </div>
            )}
          </div>

        </div>

        {/* THE ACCORDIONS: FEEDBACKS, MEETINGS ATAS, SHARED DOCUMENTS */}
        <div className="space-y-4">
          
          {/* Accordion 1: Feedbacks Recebidos */}
          <div className="bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[2.5rem] overflow-hidden shadow-sm">
            <button
              onClick={() => toggleAccordion("feedbacks")}
              className="w-full px-8 py-5 flex items-center justify-between text-left transition-colors hover:bg-[var(--input-bg)]/25"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[var(--text-primary)]">Feedbacks Recebidos</h4>
                  <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">Historico de feedbacks, avaliacoes qualitativas e orientacoes do seu mentor</p>
                </div>
              </div>
              <ChevronDown size={18} className={`text-[var(--text-muted)] transition-transform duration-300 ${activeAccordion === "feedbacks" ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {activeAccordion === "feedbacks" && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden border-t border-[var(--border-primary)]/40"
                >
                  <div className="p-8 space-y-4 bg-[var(--bg-primary)]/10">
                    {careerData?.feedbacks && careerData.feedbacks.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {careerData.feedbacks.map((fb: any) => (
                          <div key={fb.id} className="p-6 bg-[var(--bg-primary)] border border-[var(--border-primary)]/60 rounded-3xl space-y-4 text-left shadow-inner">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--accent-start)]">{fb.author}</span>
                              <span className="text-[8px] font-bold text-[var(--text-muted)] font-mono">{fb.createdAt ? new Date(fb.createdAt).toLocaleDateString("pt-BR") : "—"}</span>
                            </div>
                            <div className="space-y-1">
                              <h5 className="text-xs font-black text-[var(--text-primary)]">{fb.title}</h5>
                              <p className="text-xs text-[var(--text-muted)] leading-relaxed whitespace-pre-line font-medium">{fb.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-50 flex items-center justify-center gap-2">
                        <HelpCircle size={14} /> Nenhum feedback registrado pela consultoria BPlen
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Accordion 2: Histórico de Atas de Reuniões */}
          <div className="bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[2.5rem] overflow-hidden shadow-sm">
            <button
              onClick={() => toggleAccordion("atas")}
              className="w-full px-8 py-5 flex items-center justify-between text-left transition-colors hover:bg-[var(--input-bg)]/25"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-amber-500/10 rounded-2xl text-amber-400 border border-amber-500/20">
                  <Calendar size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[var(--text-primary)]">Historico de Atas de Reunioes</h4>
                  <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">Acompanhe as pautas, deliberacoes e atas de mentorias estruturadas</p>
                </div>
              </div>
              <ChevronDown size={18} className={`text-[var(--text-muted)] transition-transform duration-300 ${activeAccordion === "atas" ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {activeAccordion === "atas" && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden border-t border-[var(--border-primary)]/40"
                >
                  <div className="p-8 space-y-4 bg-[var(--bg-primary)]/10">
                    {careerData?.atas && careerData.atas.length > 0 ? (
                      <div className="space-y-3">
                        {careerData.atas.map((ata: any) => (
                          <div key={ata.id} className="p-4 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl flex items-center justify-between">
                            <div className="space-y-1 text-left max-w-[70%]">
                              <h5 className="text-xs font-black text-[var(--text-primary)]">{ata.title}</h5>
                              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                                <span>Data: {ata.meetingDate ? new Date(ata.meetingDate + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</span>
                                {ata.contentSummary && (
                                  <>
                                    <span>•</span>
                                    <span className="normal-case font-medium truncate">{ata.contentSummary}</span>
                                  </>
                                )}
                              </p>
                            </div>
                            <button 
                              onClick={(e) => handleDownloadFile(e, ata.fileUrl)}
                              className="p-3 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl text-[9px] font-bold uppercase tracking-wider hover:bg-[var(--accent-start)] hover:text-white hover:border-transparent transition-all flex items-center gap-2 cursor-pointer"
                            >
                              <ExternalLink size={12} /> Ver Ata no Drive
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-50 flex items-center justify-center gap-2">
                        <HelpCircle size={14} /> Nenhuma ata de reuniao registrada nesta conta
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Accordion 3: Histórico de Documentos da Jornada */}
          <div className="bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[2.5rem] overflow-hidden shadow-sm">
            <button
              onClick={() => toggleAccordion("docs")}
              className="w-full px-8 py-5 flex items-center justify-between text-left transition-colors hover:bg-[var(--input-bg)]/25"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
                  <FileText size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[var(--text-primary)]">Historico de Documentos da Jornada</h4>
                  <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">Acesso rapido aos PDFs, relatorios e materiais compartilhados via Google Drive</p>
                </div>
              </div>
              <ChevronDown size={18} className={`text-[var(--text-muted)] transition-transform duration-300 ${activeAccordion === "docs" ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {activeAccordion === "docs" && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden border-t border-[var(--border-primary)]/40"
                >
                  <div className="p-8 space-y-4 bg-[var(--bg-primary)]/10">
                    {careerData?.sharedDocuments && careerData.sharedDocuments.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {careerData.sharedDocuments.map((doc: any) => (
                          <div key={doc.id} className="p-4 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl flex items-center justify-between">
                            <div className="space-y-1 text-left max-w-[65%]">
                              <span className="text-[8px] font-black uppercase tracking-widest text-[var(--accent-start)]">{doc.category}</span>
                              <h5 className="text-xs font-black text-[var(--text-primary)] leading-tight">{doc.title}</h5>
                              <p className="text-[8px] text-[var(--text-muted)] truncate font-mono">{doc.fileName}</p>
                            </div>
                            <button 
                              onClick={(e) => handleDownloadFile(e, doc.fileUrl)}
                              className="px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl text-[8px] font-black uppercase tracking-wider hover:bg-[var(--accent-start)] hover:text-white hover:border-transparent transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <ExternalLink size={10} /> Baixar PDF
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-50 flex items-center justify-center gap-2">
                        <HelpCircle size={14} /> Nenhum documento de apoio anexado a sua conta
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* BACKLOGLIST & METAS STRATEGICAS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: BACKLOGLIST DA SUA CARREIRA (Checklist container showing row by row) */}
          <div className="lg:col-span-7 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[3.5rem] p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border-primary)]/40 pb-5">
              <div className="flex items-center gap-3 text-left">
                <div className="p-3 bg-[var(--accent-start)]/10 rounded-2xl border border-[var(--accent-start)]/20 text-[var(--accent-start)]">
                  <CheckSquare size={18} />
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">Backloglist da sua Carreira</h3>
                  <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">Gerenciamento vertical de tarefas da sua carreira</p>
                </div>
              </div>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleAddTask} className="flex gap-2 text-left">
              <input
                type="text"
                required
                placeholder="Ex: Concluir curso de Lideranca Executiva..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-xs text-[var(--text-primary)] flex-1 focus:border-[var(--accent-start)]/50 outline-none transition-all placeholder:opacity-30"
              />
              <button
                type="submit"
                disabled={submittingTask}
                className="px-5 bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
              >
                {submittingTask ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Adicionar Tarefa
              </button>
            </form>

            {/* Vertically Aligned Rows Checklist */}
            <div className="space-y-3">
              {careerData?.backlog && careerData.backlog.length > 0 ? (
                <div className="space-y-3 max-h-[450px] overflow-y-auto custom-scrollbar pr-1">
                  {careerData.backlog.map((task: CareerTask) => {
                    const isDone = task.status === "Concluída";
                    const isCommentsOpen = !!expandedComments[task.id];
                    const numComments = task.comments?.length || 0;

                    return (
                      <div key={task.id} className="p-4 bg-[var(--bg-primary)]/40 border border-[var(--border-primary)] rounded-2xl space-y-3 flex flex-col justify-between hover:border-[var(--border-primary)]/80 transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 max-w-[70%] text-left">
                            <button
                              onClick={() => handleUpdateTaskStatus(task.id, isDone ? "Backlog" : "Concluída")}
                              className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                isDone 
                                  ? "bg-green-500/15 border-green-500 text-green-400" 
                                  : "border-[var(--border-primary)] text-transparent hover:border-[var(--accent-start)]/40"
                              }`}
                            >
                              <Check size={12} />
                            </button>
                            <div className="space-y-0.5">
                              <span className={`text-xs font-bold leading-snug block ${isDone ? "line-through text-[var(--text-muted)] opacity-60" : "text-[var(--text-primary)]"}`}>
                                {task.title}
                              </span>
                              <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
                                Criado em: {task.createdAt ? new Date(task.createdAt).toLocaleDateString("pt-BR") : "—"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={task.status}
                              onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as CareerTaskStatus)}
                              className="bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[9px] font-bold uppercase rounded-lg px-2 py-1 outline-none text-[var(--text-primary)] focus:border-[var(--accent-start)]/50"
                            >
                              <option value="Backlog">Backlog</option>
                              <option value="Sprint atual">Sprint atual</option>
                              <option value="Próxima Sprint">Próxima Sprint</option>
                              <option value="Pausada">Pausada</option>
                              <option value="Cancelada">Cancelada</option>
                              <option value="Concluída">Concluída</option>
                            </select>

                            <button 
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1.5 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                              title="Remover tarefa"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Comments Toggler and list */}
                        <div className="border-t border-[var(--border-primary)]/40 pt-2.5 flex items-center justify-between text-[10px] font-bold text-[var(--text-muted)]">
                          <button
                            onClick={() => setExpandedComments(prev => ({ ...prev, [task.id]: !isCommentsOpen }))}
                            className="hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors"
                          >
                            <MessageSquare size={12} />
                            <span>{numComments} {numComments === 1 ? "comentário" : "comentários"}</span>
                            <ChevronDown size={10} className={`transition-transform duration-300 ${isCommentsOpen ? "rotate-180" : ""}`} />
                          </button>
                        </div>

                        <AnimatePresence>
                          {isCommentsOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden space-y-3 pt-2"
                            >
                              {/* History of comments */}
                              {task.comments && task.comments.length > 0 && (
                                <div className="space-y-2 bg-[var(--bg-primary)]/80 p-3 rounded-xl border border-[var(--border-primary)]/40 max-h-[150px] overflow-y-auto custom-scrollbar">
                                  {task.comments.map((comment) => (
                                    <div key={comment.id} className="text-xs space-y-0.5 border-b border-[var(--border-primary)]/10 pb-2 last:border-0 last:pb-0 text-left">
                                      <div className="flex justify-between items-center">
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${comment.author === "admin" ? "text-[var(--accent-start)]" : "text-blue-400"}`}>
                                          {comment.author === "admin" ? "Consultor BPlen" : "Voce"}
                                        </span>
                                        <span className="text-[8px] text-[var(--text-muted)] font-mono">
                                          {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString("pt-BR") + " " + new Date(comment.createdAt).toLocaleTimeString("pt-BR", {hour: "2-digit", minute:"2-digit"}) : "—"}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-[var(--text-primary)] leading-normal font-medium">{comment.text}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* New Comment Input */}
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Adicionar observacao..."
                                  value={commentInputs[task.id] || ""}
                                  onChange={(e) => setCommentInputs(prev => ({ ...prev, [task.id]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleAddComment(task.id);
                                  }}
                                  className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-1.5 text-[11px] text-[var(--text-primary)] flex-1 focus:border-[var(--accent-start)]/50 outline-none transition-all placeholder:opacity-30"
                                />
                                <button
                                  onClick={() => handleAddComment(task.id)}
                                  disabled={submittingComment[task.id]}
                                  className="px-3 bg-[var(--accent-soft)] text-[var(--accent-start)] hover:bg-[var(--accent-start)] hover:text-white rounded-lg text-[9px] font-bold uppercase transition-all"
                                >
                                  {submittingComment[task.id] ? <Loader2 size={10} className="animate-spin" /> : "Enviar"}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center space-y-2 border border-dashed border-[var(--border-primary)]/60 rounded-2xl">
                  <CheckSquare size={24} className="text-[var(--text-muted)] opacity-30 mx-auto" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">Nenhuma tarefa no seu backlog</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: METAS E OBJETIVOS (Dynamic objectives with dynamic targets progression calculation) */}
          <div className="lg:col-span-5 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[3.5rem] p-8 space-y-6 shadow-sm text-left">
            <div className="flex items-center justify-between border-b border-[var(--border-primary)]/40 pb-5">
              <div className="flex items-center gap-3 text-left">
                <div className="p-3 bg-[var(--accent-start)]/10 rounded-2xl border border-[var(--accent-start)]/20 text-[var(--accent-start)]">
                  <Target size={18} />
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">Metas e Objetivos</h3>
                  <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">Acompanhe e atualize suas metas estrategicas e objetivos</p>
                </div>
              </div>

              <button
                onClick={() => setShowObjForm(!showObjForm)}
                className="p-1.5 bg-[var(--accent-soft)] hover:bg-[var(--accent-start)] hover:text-white text-[var(--accent-start)] border border-[var(--accent-start)]/25 rounded-lg transition-all"
                title="Cadastrar Objetivo"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Objective Creation Form */}
            <AnimatePresence>
              {showObjForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleSaveObjective}
                  className="p-5 bg-[var(--bg-primary)]/60 border border-[var(--border-primary)] rounded-2xl space-y-4 overflow-hidden text-left"
                >
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">Titulo do Objetivo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Transicao para Head de Produtos"
                      value={objTitle}
                      onChange={(e) => setObjTitle(e.target.value)}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:border-[var(--accent-start)]/50 outline-none transition-all placeholder:opacity-30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">Resumo / Descricao</label>
                    <input
                      type="text"
                      placeholder="Ex: Mapear novas habilidades executivas ate o fim do ano"
                      value={objDesc}
                      onChange={(e) => setObjSummary(e.target.value)}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:border-[var(--accent-start)]/50 outline-none transition-all placeholder:opacity-30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">Data Alvo</label>
                    <input
                      type="date"
                      value={objTargetDate}
                      onChange={(e) => setObjTargetDate(e.target.value)}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:border-[var(--accent-start)]/50 outline-none transition-all"
                    />
                  </div>

                  {/* Temporary goals inside the creation form */}
                  <div className="border-t border-[var(--border-primary)]/40 pt-3 space-y-3">
                    <span className="text-[8px] font-black uppercase tracking-widest text-[var(--accent-start)] block">Metas Chave do Objetivo</span>
                    
                    {objGoals.length > 0 && (
                      <div className="space-y-1.5 max-h-[120px] overflow-y-auto custom-scrollbar">
                        {objGoals.map((g, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[10px] bg-[var(--bg-primary)] p-2 rounded-lg border border-[var(--border-primary)]/40">
                            <span className="font-bold text-[var(--text-primary)]">{g.title}</span>
                            <span className="text-[8px] font-black uppercase text-[var(--text-muted)] font-mono">Alvo: {g.targetValue} {g.unit}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-12 gap-2">
                      <input
                        type="text"
                        placeholder="Nome da Meta..."
                        value={newGoalTitle}
                        onChange={(e) => setNewGoalTitle(e.target.value)}
                        className="col-span-6 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-2.5 py-1.5 text-[11px] text-[var(--text-primary)] focus:border-[var(--accent-start)]/50 outline-none placeholder:opacity-30"
                      />
                      <input
                        type="number"
                        placeholder="Alvo"
                        value={newGoalTarget}
                        onChange={(e) => setNewGoalTarget(Number(e.target.value))}
                        className="col-span-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-2.5 py-1.5 text-[11px] text-[var(--text-primary)] focus:border-[var(--accent-start)]/50 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddGoalToTempList}
                        className="col-span-3 bg-[var(--accent-soft)] hover:bg-[var(--accent-start)] hover:text-white text-[var(--accent-start)] rounded-lg text-[9px] font-bold uppercase transition-all"
                      >
                        Inserir
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingObj}
                    className="w-full py-3 bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)] text-white rounded-xl text-[9px] font-bold uppercase tracking-[0.15em] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
                  >
                    {submittingObj ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Gravar Objetivo
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* List of active strategic goals */}
            <div className="space-y-4">
              {careerData?.objectives && careerData.objectives.length > 0 ? (
                <div className="space-y-4 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
                  {careerData.objectives.map((obj: CareerObjective) => {
                    return (
                      <div key={obj.id} className="p-4 bg-[var(--bg-primary)]/40 border border-[var(--border-primary)] rounded-2xl space-y-3 text-left">
                        <div className="flex justify-between items-start">
                          <div className="space-y-0.5 max-w-[70%]">
                            <h5 className="text-xs font-black text-[var(--text-primary)] leading-tight">{obj.title}</h5>
                            {obj.description && (
                              <p className="text-[10px] text-[var(--text-muted)] font-medium leading-relaxed">{obj.description}</p>
                            )}
                          </div>
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider ${getObjectiveStatusStyle(obj.status)}`}>
                            {obj.status}
                          </span>
                        </div>

                        {obj.targetDate && (
                          <span className="text-[8px] text-[var(--text-muted)] font-black uppercase tracking-wider font-mono block">
                            Meta ate: {new Date(obj.targetDate + "T00:00:00").toLocaleDateString("pt-BR")}
                          </span>
                        )}

                        <div className="space-y-2 border-t border-[var(--border-primary)]/20 pt-2">
                          {obj.goals && obj.goals.map((g: CareerGoal) => {
                            const percent = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
                            return (
                              <div key={g.id} className="space-y-1.5">
                                <div className="flex justify-between text-[10px] font-bold text-[var(--text-primary)]">
                                  <span>{g.title}</span>
                                  <span>{g.currentValue} / {g.targetValue} {g.unit} ({percent}%)</span>
                                </div>

                                <div className="w-full bg-[var(--border-primary)]/40 h-2 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)] h-full transition-all duration-300"
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>

                                {/* Inline progress update buttons */}
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleUpdateGoalProgress(obj.id, g.id, Math.max(0, g.currentValue - 10))}
                                    className="px-2 py-0.5 bg-[var(--bg-primary)] hover:bg-[var(--border-primary)] border border-[var(--border-primary)] text-[8px] font-bold rounded"
                                  >
                                    -10
                                  </button>
                                  <button
                                    onClick={() => handleUpdateGoalProgress(obj.id, g.id, Math.min(g.targetValue, g.currentValue + 10))}
                                    className="px-2 py-0.5 bg-[var(--bg-primary)] hover:bg-[var(--border-primary)] border border-[var(--border-primary)] text-[8px] font-bold rounded"
                                  >
                                    +10
                                  </button>
                                  <button
                                    onClick={() => handleUpdateGoalProgress(obj.id, g.id, g.targetValue)}
                                    className="px-2 py-0.5 bg-[var(--accent-soft)] hover:bg-[var(--accent-start)] hover:text-white text-[var(--accent-start)] text-[8px] font-bold rounded ml-auto"
                                  >
                                    Concluir
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center space-y-2 border border-dashed border-[var(--border-primary)]/60 rounded-2xl">
                  <Target size={24} className="text-[var(--text-muted)] opacity-30 mx-auto" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">Nenhum objetivo estrategico definido</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
