"use client";

import React, { useState, useEffect } from "react";
import GlassModal from "@/components/ui/GlassModal";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MessageSquare, 
  FileText, 
  User, 
  Upload, 
  Save, 
  Loader2,
  ChevronRight,
  ArrowLeft,
  Calendar as CalendarIcon,
  Check,
  AlertCircle
} from "lucide-react";
import { 
  getEventAttendees,
  closeEventAction,
  closeAttendeeAction,
  adminAddAttendeeAction,
  generateEventSummarySheetAction
} from "@/actions/calendar";
import { 
  GoogleCalendarEvent, 
  AttendeeData, 
  EventLifecycleStatus, 
  AttendanceStatus 
} from "@/types/calendar";
import { uploadPostEventDocAction } from "@/actions/upload-to-drive";
import { getAdminUsersList } from "@/actions/users-admin";
import { AdminUser } from "@/types/users";
import { useAuthContext } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { surveys } from "@/config/surveys";
import type { SurveyConfig } from "@/types/survey";

// `surveys` é indexado por IDs literais conhecidos, mas `ref` vem de um <select>
// dinâmico (pode não corresponder a uma chave real).
const surveyRegistry = surveys as Record<string, SurveyConfig | undefined>;
import { assignDynamicSubstepToPresentAttendeesAction } from "@/actions/journey";
import { getErrorMessage } from "@/lib/utils/errors";

interface AttendeeEditState {
  attendanceStatus: AttendanceStatus;
  participantFeedback: string;
  participantTasks: string;
  participantDocs: Array<{ url: string; fileId: string; fileName: string; uploadedAt: string }>;
}

interface PostEventWizardProps {
  isOpen: boolean;
  onClose: () => void;
  event: GoogleCalendarEvent | null;
  onSuccess?: () => void;
}

export default function PostEventWizard({ isOpen, onClose, event, onSuccess }: PostEventWizardProps) {
  const { user } = useAuthContext();
  const [step, setStep] = useState<1 | 2>(1);
  const [attendees, setAttendees] = useState<AttendeeData[]>([]);
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Parte 1 State
  const [lifecycleStatus, setLifecycleStatus] = useState<EventLifecycleStatus>("completed");
  const [internalComment, setInternalComment] = useState("");
  const [publicComment, setPublicComment] = useState("");
  const [minutesFile, setMinutesFile] = useState<{ url: string; fileId: string; fileName: string; uploadedAt: string } | null>(null);
  const [isUploadingMinutes, setIsUploadingMinutes] = useState(false);

  // Parte 2 State (Per Attendee)
  const [selectedAttendeeIndex, setSelectedAttendeeIndex] = useState<number | null>(null);
  const [attendeeEdits, setAttendeeEdits] = useState<Record<string, AttendeeEditState>>({});

  // User Search State
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isGeneratingSheet, setIsGeneratingSheet] = useState(false);

  // Dynamic Subcheckpoints Bulk Assigner States
  const [selectedSubstepRef, setSelectedSubstepRef] = useState("");
  const [substepTitle, setSubstepTitle] = useState("");
  const [isAssigningSubstep, setIsAssigningSubstep] = useState(false);

  useEffect(() => {
    if (isOpen && event) {
      setStep(1);
      loadAttendees();
      
      // Initialize Part 1 from event or defaults
      setLifecycleStatus(event.lifecycleStatus || "completed");
      setInternalComment(event.internalGeneralComment || "");
      setPublicComment(event.publicGeneralComment || "");
      setMinutesFile(event.meetingMinutesFile || null);
    }
  }, [isOpen, event]);

  const loadAttendees = async () => {
    if (!event) return;
    setIsLoadingAttendees(true);
    try {
      const data = await getEventAttendees(event.id);
      setAttendees(data);
      
      // Initialize edits for each attendee
      const initialEdits: Record<string, AttendeeEditState> = {};
      data.forEach(att => {
        initialEdits[att.userId] = {
          attendanceStatus: att.attendanceStatus || "pending",
          participantFeedback: att.participantFeedback || "",
          participantTasks: att.participantTasks || "",
          participantDocs: att.participantDocs || []
        };
      });
      setAttendeeEdits(initialEdits);
    } catch (error) {
      console.error("Erro ao carregar inscritos:", error);
    } finally {
      setIsLoadingAttendees(false);
    }
  };

  const loadAllUsers = async () => {
    if (!user) return;
    setIsSearchingUsers(true);
    try {
      const idToken = await user.getIdToken();
      const res = await getAdminUsersList(idToken);
      if (res.success && res.data) {
        setAllUsers(res.data);
      }
    } catch (error) {
      console.error("Erro ao carregar lista de usuários:", error);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const handleAddParticipant = async (matricula: string) => {
    if (!event || !user) return;
    
    // Check if already in attendees list
    if (attendees.some(a => a.matricula === matricula)) {
      alert("Este aluno já está na lista deste evento.");
      return;
    }

    setIsSaving(true);
    try {
      const idToken = await user.getIdToken();
      const res = await adminAddAttendeeAction(event.id, matricula, idToken);
      
      if (res.success) {
        setIsUserSearchOpen(false);
        setSearchQuery("");
        await loadAttendees(); // Reload list
        alert("Participante adicionado com sucesso!");
      } else {
        alert("Erro ao adicionar participante: " + res.message);
      }
    } catch (error) {
      console.error(error);
      alert("Erro crítico ao adicionar participante.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConcludeFlow = async () => {
    if (!event || !user) return;
    
    setIsGeneratingSheet(true);
    try {
      const idToken = await user.getIdToken();
      // Gerar a planilha de resumo administrativa
      await generateEventSummarySheetAction(event.id, idToken);
      
      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      console.error("Erro ao gerar resumo final:", error);
      alert("ATENÇÃO: A planilha de consolidação não pôde ser gerada na pasta do Google Drive. Verifique as permissões de acesso da conta hub@bplen.com ou as variáveis do sistema.\n\n" + (getErrorMessage(error, "Erro desconhecido")));
      // Mesmo com erro na planilha, permitimos fechar pois o grosso (atas/presença) já foi salvo.
      onSuccess?.();
      onClose();
    } finally {
      setIsGeneratingSheet(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'minutes' | 'individual', attendeeUserId?: string) => {
    if (!user || !event) return;
    
    // Validar limite de tamanho de 5MB (5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`O arquivo selecionado (${(file.size / (1024 * 1024)).toFixed(2)}MB) excede o limite maximo permitido de 5MB.`);
      return;
    }
    
    const isGeneral = type === 'minutes';
    const targetMatricula = attendeeUserId 
      ? attendees.find(a => a.userId === attendeeUserId)?.matricula 
      : (isGeneral ? "" : attendees[0]?.matricula);

    if (!isGeneral && !targetMatricula) {
      alert("Nenhum participante encontrado para vincular o documento individual.");
      return;
    }

    if (isGeneral) setIsUploadingMinutes(true);

    try {
      const idToken = await user.getIdToken();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("matricula", targetMatricula || "");
      formData.append("eventId", event.id);
      formData.append("idToken", idToken);
      formData.append("isGeneral", isGeneral.toString());

      const res = await uploadPostEventDocAction(formData);

      if (res.success && res.url) {
        const fileData = { 
          url: res.url, 
          fileId: res.fileId!, 
          fileName: res.fileName!, 
          uploadedAt: res.uploadedAt! 
        };

        if (type === 'minutes') {
          setMinutesFile(fileData);
        } else if (attendeeUserId) {
          setAttendeeEdits(prev => ({
            ...prev,
            [attendeeUserId]: {
              ...prev[attendeeUserId],
              participantDocs: [...prev[attendeeUserId].participantDocs, fileData]
            }
          }));
        }
      } else {
        alert("Erro no upload: " + res.error);
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("Erro crítico no upload.");
    } finally {
      if (type === 'minutes') setIsUploadingMinutes(false);
    }
  };

  const savePart1 = async () => {
    if (!event || !user) return;
    setIsSaving(true);
    try {
      const res = await closeEventAction(event.id, {
        lifecycleStatus,
        internalGeneralComment: internalComment,
        publicGeneralComment: publicComment,
        meetingMinutesFile: minutesFile,
        updatedBy: user.email || user.uid
      });

      if (res.success) {
        setStep(2);
      } else {
        alert("Erro ao salvar Parte 1: " + res.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const saveAttendee = async (attendeeUserId: string) => {
    if (!event || !user) return;
    const edit = attendeeEdits[attendeeUserId];
    const attendee = attendees.find(a => a.userId === attendeeUserId);
    if (!attendee) return;

    setIsSaving(true);
    try {
      const res = await closeAttendeeAction(event.id, attendeeUserId, attendee.matricula, {
        ...edit,
        checkedBy: user.email || user.uid
      });

      if (res.success) {
        // Update local attendees list to show "saved" state if we want
        alert(`Dados de ${attendee.nickname} salvos com sucesso!`);
      } else {
        alert("Erro ao salvar participante: " + res.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignBulkSubstep = async () => {
    if (!event || !selectedSubstepRef) return;
    setIsAssigningSubstep(true);
    try {
      const res = await assignDynamicSubstepToPresentAttendeesAction(event.id, {
        title: substepTitle || "Atividade Complementar",
        type: "survey",
        referenceId: selectedSubstepRef,
        description: "Atividade complementar atribuida pelo consultor"
      });
      
      if (res.success) {
        alert(res.message);
        setSelectedSubstepRef("");
        setSubstepTitle("");
      } else {
        alert("Erro ao atribuir: " + res.message);
      }
    } catch (e: unknown) {
      console.error(e);
      alert("Erro ao executar acao: " + (getErrorMessage(e, "Erro desconhecido")));
    } finally {
      setIsAssigningSubstep(false);
    }
  };

  if (!event) return null;

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 1 ? "Fechar Evento (Parte 1)" : "Presença e Feedbacks (Parte 2)"}
      subtitle={event.summary}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6 min-h-[500px] flex flex-col">
        
        {/* Step Indicator */}
        <div className="flex items-center gap-4 px-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${step === 1 ? "bg-[var(--accent-start)] text-white border-[var(--accent-start)]" : "bg-[var(--input-bg)] text-[var(--text-muted)] border-[var(--border-primary)]"}`}>
            <span className="text-[10px] font-black">01. GERAL</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--text-muted)] opacity-30" />
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${step === 2 ? "bg-[var(--accent-start)] text-white border-[var(--accent-start)]" : "bg-[var(--input-bg)] text-[var(--text-muted)] border-[var(--border-primary)]"}`}>
            <span className="text-[10px] font-black">02. PARTICIPANTES</span>
          </div>
        </div>

        {step === 1 ? (
          <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Status Selection */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Status Final do Evento</label>
              <div className="grid grid-cols-4 gap-3">
                {(["completed", "cancelled", "postponed", "scheduled"] as EventLifecycleStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setLifecycleStatus(status)}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${lifecycleStatus === status ? "bg-[var(--accent-soft)] border-[var(--accent-start)]/50 ring-2 ring-[var(--accent-start)]/10" : "bg-[var(--input-bg)] border-[var(--border-primary)] hover:border-[var(--text-muted)]/30"}`}
                  >
                    {status === 'completed' && <CheckCircle2 className={`w-5 h-5 ${lifecycleStatus === status ? "text-[var(--accent-start)]" : "text-[var(--text-muted)] opacity-30"}`} />}
                    {status === 'cancelled' && <XCircle className={`w-5 h-5 ${lifecycleStatus === status ? "text-[var(--accent-start)]" : "text-[var(--text-muted)] opacity-30"}`} />}
                    {status === 'postponed' && <Clock className={`w-5 h-5 ${lifecycleStatus === status ? "text-[var(--accent-start)]" : "text-[var(--text-muted)] opacity-30"}`} />}
                    {status === 'scheduled' && <CalendarIcon className={`w-5 h-5 ${lifecycleStatus === status ? "text-[var(--accent-start)]" : "text-[var(--text-muted)] opacity-30"}`} />}
                    <span className="text-[9px] font-black uppercase tracking-widest">{status}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 flex items-center gap-2">
                  <AlertCircle className="w-3 h-3 text-red-500" /> Comentário Interno (Só Admin)
                </label>
                <textarea
                  value={internalComment}
                  onChange={(e) => setInternalComment(e.target.value)}
                  placeholder="Notas para auditoria interna..."
                  className="w-full h-32 p-4 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[32px] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-start)]/20 transition-all resize-none font-medium"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 flex items-center gap-2">
                  <MessageSquare className="w-3 h-3 text-green-500" /> Comentário Público (Para Alunos)
                </label>
                <textarea
                  value={publicComment}
                  onChange={(e) => setPublicComment(e.target.value)}
                  placeholder="Resumo geral do que foi visto..."
                  className="w-full h-32 p-4 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[32px] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-start)]/20 transition-all resize-none font-medium"
                />
              </div>
            </div>

            {/* Meeting Minutes Upload */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Ata da Reunião (Distribuída aos Alunos)</label>
              <div className="flex items-center gap-4 p-6 bg-[var(--input-bg)] border border-dashed border-[var(--border-primary)] rounded-[32px]">
                {minutesFile ? (
                   <div className="flex-1 flex items-center justify-between bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--accent-start)]/20 shadow-sm">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-[var(--accent-start)]/10 rounded-xl text-[var(--accent-start)]">
                            <FileText className="w-5 h-5" />
                         </div>
                         <div>
                            <p className="text-xs font-bold text-[var(--text-primary)]">{minutesFile.fileName}</p>
                            <p className="text-[9px] font-medium text-[var(--text-muted)] uppercase tracking-widest">Subido em {format(new Date(minutesFile.uploadedAt), "dd/MM 'às' HH:mm")}</p>
                         </div>
                      </div>
                      <button onClick={() => setMinutesFile(null)} className="p-2 hover:bg-red-500/10 text-red-500 rounded-xl transition-all">
                         <XCircle className="w-4 h-4" />
                      </button>
                   </div>
                ) : (
                  <div className="flex-1 text-center">
                    <input 
                      type="file" 
                      id="minutes-upload" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'minutes');
                      }}
                    />
                    <label 
                      htmlFor="minutes-upload"
                      className="inline-flex flex-col items-center gap-2 cursor-pointer group"
                    >
                      {isUploadingMinutes ? (
                        <Loader2 className="w-8 h-8 text-[var(--accent-start)] animate-spin" />
                      ) : (
                        <div className="p-4 bg-[var(--bg-primary)] rounded-full border border-[var(--border-primary)] group-hover:border-[var(--accent-start)] transition-all">
                          <Upload className="w-6 h-6 text-[var(--text-muted)] group-hover:text-[var(--accent-start)]" />
                        </div>
                      )}
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                        {isUploadingMinutes ? "Subindo ATA..." : "Clique para subir a ATA"}
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
               <button
                 onClick={savePart1}
                 disabled={isSaving}
                 className="flex items-center gap-3 px-10 py-4.5 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-[32px] font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
               >
                 {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                 Próxima Etapa
               </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex gap-6 animate-in fade-in slide-in-from-left-4 duration-500">
            {/* Sidebar: List of Attendees */}
            <div className="w-1/3 bg-[var(--input-bg)]/50 rounded-[32px] border border-[var(--border-primary)] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-[var(--border-primary)] bg-[var(--input-bg)] flex justify-between items-center">
                <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Inscritos ({attendees.length})</h4>
                <button 
                  onClick={() => {
                    setIsUserSearchOpen(true);
                    loadAllUsers();
                  }}
                  className="p-2 bg-[var(--accent-start)] text-white rounded-xl hover:scale-110 transition-all shadow-lg shadow-[var(--accent-start)]/20"
                  title="Adicionar Participante Manual"
                >
                  <User size={14} className="stroke-[3]" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                {isLoadingAttendees ? (
                  <div className="p-8 flex flex-col items-center gap-4 opacity-30">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-[9px] font-black uppercase tracking-widest tracking-[0.3em]">Carregando...</span>
                  </div>
                ) : attendees.map((att, idx) => (
                  <button
                    key={att.userId}
                    onClick={() => setSelectedAttendeeIndex(idx)}
                    className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all group ${selectedAttendeeIndex === idx ? "bg-[var(--accent-soft)] border border-[var(--accent-start)]/20 shadow-sm" : "hover:bg-[var(--input-bg)]"}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${selectedAttendeeIndex === idx ? "bg-[var(--accent-start)] text-white" : "bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-muted)]"}`}>
                      {att.nickname?.[0] || <User size={14} />}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className={`text-xs font-black truncate ${selectedAttendeeIndex === idx ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>{att.nickname}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                         <div className={`w-1.5 h-1.5 rounded-full ${attendeeEdits[att.userId]?.attendanceStatus === 'present' ? "bg-green-500" : attendeeEdits[att.userId]?.attendanceStatus === 'absent' ? "bg-red-500" : "bg-amber-500"}`} />
                         <span className="text-[8px] font-black uppercase tracking-widest opacity-40">{att.matricula}</span>
                      </div>
                    </div>
                    {attendeeEdits[att.userId]?.attendanceStatus !== 'pending' && <Check className="w-3 h-3 text-[var(--accent-start)]" />}
                  </button>
                ))}
              </div>
              <div className="p-4 border-t border-[var(--border-primary)] space-y-4">
                  {/* Bulk Subcheckpoint Widget */}
                  <div className="p-4 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-primary)] space-y-3">
                     <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Subcheckpoint Dinamico em Lote</p>
                     <div className="space-y-2">
                        <select 
                           value={selectedSubstepRef}
                           onChange={(e) => {
                              const ref = e.target.value;
                              setSelectedSubstepRef(ref);
                              const surveyObj = surveyRegistry[ref];
                              setSubstepTitle(surveyObj?.title || "");
                           }}
                           className="w-full p-2.5 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl text-[10px] font-bold text-[var(--text-primary)] focus:outline-none"
                        >
                           <option value="">Selecione um Modelo...</option>
                           {Object.entries(surveyRegistry).map(([key, val]) => (
                              <option key={key} value={key}>{val?.title || key}</option>
                           ))}
                        </select>
                        
                        <input 
                           type="text"
                           placeholder="Titulo customizado do Checkpoint..."
                           value={substepTitle}
                           onChange={(e) => setSubstepTitle(e.target.value)}
                           className="w-full p-2.5 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl text-[10px] font-bold text-[var(--text-primary)] focus:outline-none"
                        />
                        
                        <button
                           onClick={handleAssignBulkSubstep}
                           disabled={!selectedSubstepRef || isAssigningSubstep}
                           className="w-full py-2.5 bg-[var(--accent-start)] hover:bg-[var(--accent-end)] text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                        >
                           {isAssigningSubstep ? "Atribuindo..." : "Atribuir aos Presentes"}
                        </button>
                     </div>
                  </div>

                  <button 
                    onClick={() => setStep(1)}
                    className="w-full py-3 flex items-center justify-center gap-2 bg-[var(--bg-primary)] hover:bg-[var(--accent-soft)] rounded-2xl transition-all text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]"
                  >
                     <ArrowLeft size={12} /> Voltar para Geral
                  </button>
               </div>
            </div>

            {/* Main Content: Attendee Details */}
            <div className="flex-1 bg-[var(--input-bg)]/30 rounded-[32px] border border-[var(--border-primary)] p-8 overflow-y-auto custom-scrollbar">
              {selectedAttendeeIndex === null ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-4">
                   <User size={48} className="stroke-1" />
                   <div>
                      <h4 className="text-xs font-black uppercase tracking-widest">Nenhum Selecionado</h4>
                      <p className="text-[10px] font-medium max-w-[200px] mt-2 leading-relaxed">Selecione um participante ao lado para registrar presença e feedback individual.</p>
                   </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                   <div className="flex justify-between items-start">
                      <div>
                         <h4 className="text-xl font-black text-[var(--text-primary)]">{attendees[selectedAttendeeIndex].nickname}</h4>
                         <p className="text-[10px] font-black text-[var(--accent-start)] uppercase tracking-[0.2em] mt-1">{attendees[selectedAttendeeIndex].matricula}</p>
                      </div>
                      
                      <div className="flex gap-2 p-1 bg-[var(--bg-primary)] rounded-full border border-[var(--border-primary)] shadow-sm">
                         {(['pending', 'present', 'absent'] as AttendanceStatus[]).map(status => (
                           <button
                             key={status}
                             onClick={() => setAttendeeEdits(prev => ({
                               ...prev,
                               [attendees[selectedAttendeeIndex].userId]: {
                                 ...prev[attendees[selectedAttendeeIndex].userId],
                                 attendanceStatus: status
                               }
                             }))}
                             className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${attendeeEdits[attendees[selectedAttendeeIndex].userId]?.attendanceStatus === status ? (status === 'present' ? 'bg-green-500 text-white shadow-lg' : status === 'absent' ? 'bg-red-500 text-white shadow-lg' : 'bg-amber-500 text-white shadow-lg') : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                           >
                              {status === 'present' ? 'Presente' : status === 'absent' ? 'Faltou' : 'Pendente'}
                           </button>
                         ))}
                      </div>
                   </div>

                   <hr className="border-[var(--border-primary)]" />

                   <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Feedback Individual (Só Aluno Vê)</label>
                         <textarea
                           value={attendeeEdits[attendees[selectedAttendeeIndex].userId]?.participantFeedback}
                           onChange={(e) => setAttendeeEdits(prev => ({
                             ...prev,
                             [attendees[selectedAttendeeIndex].userId]: {
                               ...prev[attendees[selectedAttendeeIndex].userId],
                               participantFeedback: e.target.value
                             }
                           }))}
                           placeholder="Ex: Teve um ótimo desempenho, foco na tarefa X..."
                           className="w-full h-24 p-4 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-3xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-start)]/20 transition-all resize-none font-medium"
                         />
                      </div>

                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Tarefas Sugeridas (Só Aluno Vê)</label>
                         <textarea
                           value={attendeeEdits[attendees[selectedAttendeeIndex].userId]?.participantTasks}
                           onChange={(e) => setAttendeeEdits(prev => ({
                             ...prev,
                             [attendees[selectedAttendeeIndex].userId]: {
                               ...prev[attendees[selectedAttendeeIndex].userId],
                               participantTasks: e.target.value
                             }
                           }))}
                           placeholder="Ex: [ ] Ler capítulo 2; [ ] Fazer teste DISC..."
                           className="w-full h-24 p-4 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-3xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-start)]/20 transition-all resize-none font-medium"
                         />
                      </div>
                   </div>

                   {/* Individual Documents */}
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Documentos Adicionais Individualizados</label>
                      <div className="grid grid-cols-2 gap-3">
                         {attendeeEdits[attendees[selectedAttendeeIndex].userId]?.participantDocs.map((doc, dIdx) => (
                           <div key={dIdx} className="p-3 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-primary)] flex items-center justify-between group">
                              <div className="flex items-center gap-3 overflow-hidden">
                                 <FileText className="w-4 h-4 text-[var(--accent-start)] shrink-0" />
                                 <span className="text-[10px] font-bold text-[var(--text-primary)] truncate">{doc.fileName}</span>
                              </div>
                              <button 
                                onClick={() => setAttendeeEdits(prev => ({
                                  ...prev,
                                  [attendees[selectedAttendeeIndex].userId]: {
                                    ...prev[attendees[selectedAttendeeIndex].userId],
                                    participantDocs: prev[attendees[selectedAttendeeIndex].userId].participantDocs.filter((_, i) => i !== dIdx)
                                  }
                                }))}
                                className="p-1.5 opacity-0 group-hover:opacity-100 bg-red-500/10 text-red-500 rounded-lg transition-all"
                              >
                                 <XCircle size={12} />
                              </button>
                           </div>
                         ))}
                         <div className="p-3 border border-dashed border-[var(--border-primary)] rounded-2xl flex items-center justify-center">
                            <input 
                              type="file" 
                              id={`ind-upload-${attendees[selectedAttendeeIndex].userId}`} 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file, 'individual', attendees[selectedAttendeeIndex!].userId);
                              }}
                            />
                            <label 
                              htmlFor={`ind-upload-${attendees[selectedAttendeeIndex].userId}`}
                              className="inline-flex items-center gap-2 cursor-pointer hover:text-[var(--accent-start)] transition-all"
                            >
                               <Upload size={14} className="text-[var(--text-muted)]" />
                               <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Subir Arquivo</span>
                            </label>
                         </div>
                      </div>
                   </div>

                   <div className="flex justify-end pt-4">
                      <button
                        onClick={() => saveAttendee(attendees[selectedAttendeeIndex!].userId)}
                        disabled={isSaving}
                        className="flex items-center gap-3 px-8 py-3.5 bg-[var(--accent-start)] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-[var(--accent-start)]/20"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar Aluno
                      </button>
                   </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Final Actions Footer */}
        <div className="pt-6 border-t border-[var(--border-primary)] border-dashed flex justify-between items-center px-4">
           {step === 2 && (
              <p className="text-[9px] font-bold text-[var(--text-muted)] italic opacity-40">
                O evento geral já foi fechado. Agora ajuste cada participante.
              </p>
           )}
           <div className="flex gap-4 ml-auto">
              <button
                onClick={onClose}
                className="px-6 py-3.5 text-[var(--text-muted)] font-black text-[9px] uppercase tracking-widest hover:text-[var(--text-primary)] transition-all"
              >
                Cancelar / Sair
              </button>
              {step === 2 && (
                <button
                  onClick={handleConcludeFlow}
                  disabled={isGeneratingSheet}
                  className="flex items-center gap-3 px-10 py-4.5 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-[32px] font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isGeneratingSheet ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Gerando Relatório...
                    </>
                  ) : "Concluir Fluxo"}
                </button>
              )}
           </div>
        </div>
      </div>

      {/* Manual User Search Modal (Overlay) */}
      <AnimatePresence>
        {isUserSearchOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsUserSearchOpen(false)}
            />
            <div className="relative w-full max-w-md bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase tracking-widest">Adicionar Participante</h3>
                  <button onClick={() => setIsUserSearchOpen(false)} className="opacity-30 hover:opacity-100 transition-opacity">
                    <XCircle size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Buscar por nome ou matrícula..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-12 pl-12 pr-4 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[var(--accent-start)]/20"
                      autoFocus
                    />
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] opacity-30" />
                  </div>

                  <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                    {isSearchingUsers ? (
                      <div className="p-8 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-start)]" />
                      </div>
                    ) : (
                      allUsers
                        .filter(u => 
                          u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.matricula.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .slice(0, 10) // Limit to avoid chaos
                        .map(u => (
                          <button
                            key={u.matricula}
                            onClick={() => handleAddParticipant(u.matricula)}
                            disabled={isSaving}
                            className="w-full p-4 bg-[var(--input-bg)] hover:bg-[var(--accent-soft)] border border-transparent hover:border-[var(--accent-start)]/20 rounded-2xl flex items-center justify-between transition-all group disabled:opacity-50"
                          >
                            <div className="text-left">
                              <p className="text-[10px] font-black group-hover:text-[var(--accent-start)] transition-colors">{u.name}</p>
                              <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-wider">{u.matricula}</p>
                            </div>
                            <ChevronRight size={14} className="text-[var(--text-muted)] opacity-20 group-hover:opacity-100" />
                          </button>
                        ))
                    )}
                    {!isSearchingUsers && searchQuery && allUsers.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.matricula.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                      <p className="text-center text-[9px] font-black uppercase text-[var(--text-muted)] opacity-40 py-8">Nenhum usuário encontrado.</p>
                    )}
                    {!isSearchingUsers && !searchQuery && (
                      <p className="text-center text-[9px] font-black uppercase text-[var(--text-muted)] opacity-40 py-8">Digite para iniciar a busca...</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </GlassModal>
  );
}
