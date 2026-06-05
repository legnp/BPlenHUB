"use client";

import React, { useState, useEffect } from "react";
import { 
  Brain, 
  Clock, 
  Sparkles, 
  Target, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  X, 
  ExternalLink, 
  Lock, 
  Unlock, 
  Settings, 
  Trophy, 
  Link2,
  FileText,
  UserCheck,
  ChevronRight,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getDevolutivaUserData, DevolutivaUserData } from "@/actions/admin-devolutiva";
import { getAdminUsersList, updateUserPermissions } from "@/actions/users-admin";
import { toggleAssessmentRelease } from "@/actions/admin-assessments";
import { DiscDevolutivaModal } from "@/components/admin/DiscDevolutivaModal";
import { DiscChart } from "@/components/hub/DiscChart";
import { TriadDonutChart } from "@/components/hub/TriadDonutChart";
import { TriadVennChart } from "@/components/hub/TriadVennChart";
import { StackedBarChart } from "@/components/hub/StackedBarChart";
import { SURVEY_REGISTRY } from "@/config/surveys";
import { FORMS_REGISTRY } from "@/config/forms";

interface DevolutivaComportamentalViewProps {
  matricula?: string;
  hideUserSelector?: boolean;
}

export function DevolutivaComportamentalView({ 
  matricula: initialMatricula, 
  hideUserSelector = false 
}: DevolutivaComportamentalViewProps) {
  const [selectedMatricula, setSelectedMatricula] = useState<string>(initialMatricula || "");
  const [userData, setUserData] = useState<DevolutivaUserData | null>(null);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  
  // Users list state for dropdown selection
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDropdownOpen, setIsUserDropdownOpen] = useState<boolean>(false);

  // Administrative Workflows states
  const [discLinkInput, setDiscLinkInput] = useState<string>("");
  const [savingDiscLink, setSavingDiscLink] = useState<boolean>(false);
  const [showDiscModal, setShowDiscModal] = useState<boolean>(false);
  const [releasingIds, setReleasingIds] = useState<Record<string, boolean>>({});

  // Accordion active keys
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({});

  // Load complete list of users if selector is not hidden
  useEffect(() => {
    if (!hideUserSelector) {
      setLoadingUsers(true);
      getAdminUsersList()
        .then((res) => {
          if (res.success && res.data) {
            setUsersList(res.data);
          }
        })
        .catch((err) => console.error("Erro ao carregar lista de usuarios:", err))
        .finally(() => setLoadingUsers(false));
    }
  }, [hideUserSelector]);

  // Load user details when selectedMatricula changes
  useEffect(() => {
    if (selectedMatricula) {
      setLoadingData(true);
      getDevolutivaUserData(selectedMatricula)
        .then((res) => {
          if (res.success && res.data) {
            setUserData(res.data);
            setDiscLinkInput(res.data.profile.discLink || "");
          } else {
            setUserData(null);
          }
        })
        .catch((err) => console.error("Erro ao carregar dados comportamentais:", err))
        .finally(() => setLoadingData(false));
    } else {
      setUserData(null);
    }
  }, [selectedMatricula]);

  const handleToggleRelease = async (resultId: string, currentStatus: boolean) => {
    if (!selectedMatricula) return;
    setReleasingIds(prev => ({ ...prev, [resultId]: true }));
    try {
      const res = await toggleAssessmentRelease(selectedMatricula, resultId, currentStatus);
      if (res.success) {
        // Update local state
        setUserData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            results: {
              ...prev.results,
              [resultId]: {
                ...prev.results[resultId],
                isReleased: !currentStatus
              }
            }
          };
        });
      } else {
        alert(res.error || "Erro ao atualizar status do diagnostico.");
      }
    } catch (err) {
      console.error("Erro ao alternar liberacao:", err);
      alert("Erro ao salvar alteracao no servidor.");
    } finally {
      setReleasingIds(prev => ({ ...prev, [resultId]: false }));
    }
  };

  const handleSaveDiscLink = async () => {
    if (!selectedMatricula) return;
    setSavingDiscLink(true);
    try {
      const res = await updateUserPermissions(selectedMatricula, {
        metadata: { disc_link: discLinkInput }
      });
      if (res.success) {
        setUserData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            profile: {
              ...prev.profile,
              discLink: discLinkInput
            }
          };
        });
        alert("Link do Portal DISC salvo com sucesso.");
      }
    } catch (err: any) {
      alert("Erro ao salvar link do portal: " + (err.message || "Erro desconhecido"));
    } finally {
      setSavingDiscLink(false);
    }
  };

  const toggleAccordion = (id: string) => {
    setExpandedAccordions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Filter users based on query
  const filteredUsers = usersList.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.matricula.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.nickname && user.nickname.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedUserDisplay = usersList.find(u => u.matricula === selectedMatricula);

  // Formulate structures arrays for display
  const gestaoResult = userData?.results?.gestao_tempo;
  const triadData = gestaoResult?.scores ? [
    { label: "Importancia", percentage: gestaoResult.scores.importancia?.percentage || 0, color: "#10b981" },
    { label: "Urgencia", percentage: gestaoResult.scores.urgencia?.percentage || 0, color: "#facc15" },
    { label: "Circunstancia", percentage: gestaoResult.scores.circunstancia?.percentage || 0, color: "#ef4444" },
  ] : [];

  const aprendizadoResult = userData?.results?.preferencias_aprendizado;
  const vacdData = aprendizadoResult?.scores ? [
    { label: "Vis", percentage: aprendizadoResult.scores.visual?.percentage || 0, color: "#ec4899" },
    { label: "Aud", percentage: aprendizadoResult.scores.auditivo?.percentage || 0, color: "#3b82f6" },
    { label: "Cin", percentage: aprendizadoResult.scores.cinestesico?.percentage || 0, color: "#10b981" },
    { label: "Dig", percentage: aprendizadoResult.scores.digital?.percentage || 0, color: "#f59e0b" },
  ] : [];

  const reconhecimentoResult = userData?.results?.preferencias_reconhecimento;
  const reconhecimentoData = reconhecimentoResult?.scores ? [
    { label: "Afi", percentage: reconhecimentoResult.scores.afirmacao?.percentage || 0, color: "#ef4444" },
    { label: "Tem", percentage: reconhecimentoResult.scores.tempo?.percentage || 0, color: "#3b82f6" },
    { label: "Pre", percentage: reconhecimentoResult.scores.presentes?.percentage || 0, color: "#10b981" },
    { label: "Ser", percentage: reconhecimentoResult.scores.servico?.percentage || 0, color: "#f59e0b" },
    { label: "Toq", percentage: reconhecimentoResult.scores.toque?.percentage || 0, color: "#ec4899" },
  ] : [];

  const discResult = userData?.results?.disc;
  const discData = discResult?.scores ? [
    { label: "Executor", percentage: discResult.scores.executor?.percentage || 0, color: "#3b82f6" },
    { label: "Comunicador", percentage: discResult.scores.comunicador?.percentage || 0, color: "#facc15" },
    { label: "Planejador", percentage: discResult.scores.planejador?.percentage || 0, color: "#10b981" },
    { label: "Analista", percentage: discResult.scores.analista?.percentage || 0, color: "#ef4444" },
  ] : [];

  // Unified lists of surveys and forms
  const allSubmissionsList = userData ? [
    ...Object.values(userData.surveys).map(s => ({ ...s, type: "survey" as const })),
    ...Object.values(userData.forms).map(f => ({ ...f, type: "form" as const }))
  ].sort((a, b) => {
    const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
    const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
    return dateB - dateA;
  }) : [];

  // Helper to obtain question title and answer formatting
  const getRenderableFields = (submission: any) => {
    const data = submission.data || {};
    const fields: Array<{ label: string; value: string }> = [];

    if (submission.type === "survey") {
      const config = SURVEY_REGISTRY.find(s => s.id === submission.surveyId);
      if (config) {
        config.steps?.forEach(step => {
          step.fields.forEach(field => {
            const answer = data[field.id];
            if (answer !== undefined && answer !== null) {
              fields.push({
                label: step.question || field.id,
                value: formatAnswerValue(answer)
              });
            }
          });
        });
      }
    } else {
      const config = FORMS_REGISTRY.find(f => f.id === submission.formId);
      if (config) {
        config.steps?.forEach(step => {
          step.fields.forEach(field => {
            const answer = data[field.id];
            if (answer !== undefined && answer !== null) {
              fields.push({
                label: field.label || step.question || field.id,
                value: formatAnswerValue(answer)
              });
            }
          });
        });
      }
    }

    // Dynamic anti-break fallback: Include any fields present in data but not mapped by configs
    const mappedIds = new Set(fields.map(f => f.label.toLowerCase()));
    Object.entries(data).forEach(([key, val]) => {
      const humanKey = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      if (!mappedIds.has(key.toLowerCase()) && !mappedIds.has(humanKey.toLowerCase())) {
        fields.push({
          label: humanKey,
          value: formatAnswerValue(val)
        });
      }
    });

    return fields;
  };

  const formatAnswerValue = (val: any): string => {
    if (val === null || val === undefined) return "—";
    if (typeof val === "boolean") return val ? "Sim" : "Não";
    if (Array.isArray(val)) return val.map(item => formatAnswerValue(item)).join(", ");
    if (typeof val === "object") {
      if (val.url) return val.url; // File links
      return Object.entries(val)
        .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
        .join(" | ");
    }
    return String(val);
  };

  const getSubmissionTitle = (submission: any): string => {
    if (submission.type === "survey") {
      const config = SURVEY_REGISTRY.find(s => s.id === submission.surveyId);
      return config?.title || `Pesquisa: ${submission.surveyId}`;
    } else {
      const config = FORMS_REGISTRY.find(f => f.id === submission.formId);
      return config?.title || `Formulário: ${submission.formId}`;
    }
  };

  return (
    <div className="space-y-8 text-left">
      
      {/* 1. SELETOR DE USUARIO (UX Premium) */}
      {!hideUserSelector && (
        <div className="relative w-full max-w-md">
          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60 block mb-2">
            Selecionar Usuário
          </label>
          <div className="relative">
            <button 
              onClick={() => setIsUserDropdownOpen(!isDropdownOpen)}
              className="w-full bg-[var(--input-bg)] hover:bg-[var(--input-bg)]/80 border border-[var(--border-primary)] rounded-2xl py-4 px-6 flex items-center justify-between text-xs font-bold text-[var(--text-primary)] transition-all outline-none"
            >
              <div className="flex items-center gap-3">
                <UserCheck size={16} className="text-[var(--accent-start)]" />
                <span>
                  {selectedUserDisplay 
                    ? `${selectedUserDisplay.name} (${selectedUserDisplay.matricula})` 
                    : "Escolha um usuario para auditoria..."}
                </span>
              </div>
              <ChevronDown size={16} className={`text-[var(--text-muted)] transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute z-50 w-full mt-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl max-h-[300px] flex flex-col"
                >
                  <div className="p-4 border-b border-[var(--border-primary)] flex items-center gap-3 bg-[var(--input-bg)]/20">
                    <Search size={14} className="text-[var(--text-muted)]" />
                    <input 
                      type="text" 
                      placeholder="Pesquisar por nome, matricula ou @" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] placeholder:opacity-50"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {loadingUsers ? (
                      <div className="py-8 flex justify-center items-center gap-2 text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">
                        <Loader2 size={14} className="animate-spin text-[var(--accent-start)]" /> Carregando base de dados...
                      </div>
                    ) : filteredUsers.length > 0 ? (
                      filteredUsers.map(u => (
                        <button
                          key={u.matricula}
                          onClick={() => {
                            setSelectedMatricula(u.matricula);
                            setIsUserDropdownOpen(false);
                            setSearchQuery("");
                          }}
                          className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-0.5 ${u.matricula === selectedMatricula ? "bg-[var(--accent-soft)] text-[var(--accent-start)]" : "hover:bg-[var(--input-bg)]/40 text-[var(--text-primary)]"}`}
                        >
                          <span className="text-xs font-black">{u.name}</span>
                          <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider font-mono">
                            {u.nickname ? `@${u.nickname}` : u.matricula} • {u.email}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="py-8 text-center text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50">
                        Nenhum usuario encontrado
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Loading state for detailed data */}
      {loadingData && (
        <div className="py-20 flex flex-col justify-center items-center gap-4 text-center">
          <Loader2 size={36} className="animate-spin text-[var(--accent-start)]" />
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)]">
            Consolidando Analise 360º no Servidor...
          </p>
        </div>
      )}

      {/* Main dashboard view */}
      {!loadingData && userData && (
        <div className="space-y-10 animate-fade-in-up">
          
          {/* 2. HEADER: DETALHES CADASTRAIS DO USUARIO */}
          <div className="p-8 rounded-[2.5rem] bg-[var(--input-bg)] border border-[var(--border-primary)] backdrop-blur-xl relative overflow-hidden group shadow-sm">
            <div className="flex flex-col md:flex-row gap-6 md:items-center relative z-10">
              
              {/* Avatar do Usuario */}
              <div className="shrink-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border-2 border-[var(--accent-start)]/30 p-1 bg-[var(--bg-primary)] flex items-center justify-center overflow-hidden shadow-inner shadow-black/20 group-hover:border-[var(--accent-start)]/60 transition-colors">
                  {userData.profile.photoUrl ? (
                    <img 
                      src={userData.profile.photoUrl} 
                      alt={userData.profile.name} 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[var(--accent-start)] to-[var(--accent-end)] text-white flex items-center justify-center font-bold text-2xl">
                      {userData.profile.name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>

              {/* Informações Cadastrais */}
              <div className="flex-1 text-left space-y-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-[var(--text-primary)]">
                      {userData.profile.name}
                    </h2>
                    <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest flex items-center gap-2">
                      <span>{userData.profile.nickname ? `@${userData.profile.nickname}` : userData.profile.matricula}</span>
                      <span>•</span>
                      <span>{userData.profile.email}</span>
                    </p>
                  </div>

                  {/* Journey stage mapping */}
                  {userData.journey && (
                    <div className="flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-400">
                        {userData.journey.currentPhase} • {userData.journey.currentStep}
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t border-[var(--border-primary)]/40 pt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">Matricula</span>
                    <p className="text-xs font-bold text-[var(--text-primary)] mt-0.5">{userData.profile.matricula}</p>
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">Status Welcome</span>
                    <p className="text-xs font-bold text-[var(--text-primary)] mt-0.5">
                      {userData.profile.hasCompletedWelcome ? "Concluido" : "Pendente"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">Tipo de Acesso na Plataforma</span>
                    <p className="text-xs font-bold text-[var(--text-primary)] mt-0.5 uppercase tracking-wider font-mono">{userData.profile.role}</p>
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">UID Seguranca</span>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] truncate mt-0.5" title={userData.profile.uid}>{userData.profile.uid || "—"}</p>
                  </div>
                </div>
              </div>

            </div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[var(--accent-start)]/5 rounded-full blur-[100px] pointer-events-none" />
          </div>

          {/* 3. GRID PRINCIPAL: ESQUERDA (ASSESSMENTS/GRAFICOS), DIREITA (HISTORICO ACCORDIAN) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* ESQUERDA: LABORATÓRIO DE GRAFICOS & DEVOLUTIVA DISC */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="p-6 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[3rem] space-y-6 shadow-sm">
                
                {/* Header Laboratorio */}
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-500">
                    <Brain size={18} />
                  </div>
                  <div className="flex flex-col text-left">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Resultados do Usuário</h3>
                    <p className="text-xs font-black text-[var(--text-primary)] tracking-tight mt-0.5">Visualizador de Assessments</p>
                  </div>
                </div>

                <div className="space-y-6">
                  
                  {/* Lâmina 01: DISC */}
                  <div className={`p-6 bg-[var(--bg-primary)]/40 border border-[var(--border-primary)] rounded-[2rem] space-y-4 relative overflow-hidden group/blade`}>
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">Análise 01</span>
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-[var(--text-primary)]">Comportamental DISC</h4>
                      </div>
                      
                      <button 
                        onClick={() => handleToggleRelease("disc", discResult?.isReleased || false)}
                        disabled={releasingIds["disc"]}
                        className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
                          discResult?.isReleased 
                            ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white" 
                            : "bg-green-500 text-white shadow-md shadow-green-500/20"
                        }`}
                      >
                        {releasingIds["disc"] ? <Loader2 size={10} className="animate-spin" /> : discResult?.isReleased ? "Ocultar" : "Liberar"}
                      </button>
                    </div>

                    {discResult?.scores ? (
                      <div className="space-y-4">
                        <DiscChart data={discData} mini />
                      </div>
                    ) : (
                      <div className="py-6 text-center text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50 border border-dashed border-[var(--border-primary)] rounded-xl">
                        Nenhum score importado
                      </div>
                    )}
                  </div>

                  {/* Lâmina 02: Gestão do Tempo */}
                  <div className="p-6 bg-[var(--bg-primary)]/40 border border-[var(--border-primary)] rounded-[2rem] space-y-4 relative overflow-hidden">
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">Análise 02</span>
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-[var(--text-primary)]">Gestão do Tempo</h4>
                      </div>
                      
                      <button 
                        onClick={() => handleToggleRelease("gestao_tempo", gestaoResult?.isReleased || false)}
                        disabled={releasingIds["gestao_tempo"]}
                        className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
                          gestaoResult?.isReleased 
                            ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white" 
                            : "bg-green-500 text-white shadow-md shadow-green-500/20"
                        }`}
                      >
                        {releasingIds["gestao_tempo"] ? <Loader2 size={10} className="animate-spin" /> : gestaoResult?.isReleased ? "Ocultar" : "Liberar"}
                      </button>
                    </div>

                    {gestaoResult?.scores ? (
                      <div className="flex flex-col items-center">
                        <div className="w-44 h-44 flex items-center justify-center mx-auto">
                          <TriadVennChart data={triadData} mini />
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50 border border-dashed border-[var(--border-primary)] rounded-xl">
                        Nenhuma resposta
                      </div>
                    )}
                  </div>

                  {/* Lâmina 03: Aprendizado */}
                  <div className="p-6 bg-[var(--bg-primary)]/40 border border-[var(--border-primary)] rounded-[2rem] space-y-4 relative overflow-hidden">
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">Análise 03</span>
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-[var(--text-primary)]">Aprendizado VACD</h4>
                      </div>
                      
                      <button 
                        onClick={() => handleToggleRelease("preferencias_aprendizado", aprendizadoResult?.isReleased || false)}
                        disabled={releasingIds["preferencias_aprendizado"]}
                        className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
                          aprendizadoResult?.isReleased 
                            ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white" 
                            : "bg-green-500 text-white shadow-md shadow-green-500/20"
                        }`}
                      >
                        {releasingIds["preferencias_aprendizado"] ? <Loader2 size={10} className="animate-spin" /> : aprendizadoResult?.isReleased ? "Ocultar" : "Liberar"}
                      </button>
                    </div>

                    {aprendizadoResult?.scores ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-28 h-28 flex items-center justify-center">
                          <TriadDonutChart data={vacdData} mini />
                        </div>
                        <div className="flex flex-wrap justify-center gap-3">
                          {vacdData.map(item => (
                            <div key={item.label} className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-[8px] font-black uppercase tracking-wider text-[var(--text-muted)]">{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50 border border-dashed border-[var(--border-primary)] rounded-xl">
                        Nenhuma resposta
                      </div>
                    )}
                  </div>

                  {/* Lâmina 04: Reconhecimento */}
                  <div className="p-6 bg-[var(--bg-primary)]/40 border border-[var(--border-primary)] rounded-[2rem] space-y-4 relative overflow-hidden">
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">Análise 04</span>
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-[var(--text-primary)]">Preferencias de Reconhecimento</h4>
                      </div>
                      
                      <button 
                        onClick={() => handleToggleRelease("preferencias_reconhecimento", reconhecimentoResult?.isReleased || false)}
                        disabled={releasingIds["preferencias_reconhecimento"]}
                        className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
                          reconhecimentoResult?.isReleased 
                            ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white" 
                            : "bg-green-500 text-white shadow-md shadow-green-500/20"
                        }`}
                      >
                        {releasingIds["preferencias_reconhecimento"] ? <Loader2 size={10} className="animate-spin" /> : reconhecimentoResult?.isReleased ? "Ocultar" : "Liberar"}
                      </button>
                    </div>

                    {reconhecimentoResult?.scores ? (
                      <div className="space-y-4">
                        <StackedBarChart data={reconhecimentoData} />
                        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
                          {reconhecimentoData.map(item => (
                            <div key={item.label} className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50 border border-dashed border-[var(--border-primary)] rounded-xl">
                        Nenhuma resposta
                      </div>
                    )}
                  </div>

                </div>

              </div>

              {/* Portal DISC (External Link & Lançar Devolutiva manual) */}
              <div className="p-6 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[3rem] space-y-5">
                <div className="flex items-center gap-3 text-left">
                  <div className="p-2.5 bg-[var(--accent-start)]/10 rounded-2xl text-[var(--accent-start)] border border-[var(--accent-start)]/20">
                    <Link2 size={16} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent-start)]">Portal DISC Link</h4>
                    <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">Insira o link individual gerado no portal DISC</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="https://vrs.com.br/disc/resultado/..."
                    value={discLinkInput}
                    onChange={(e) => setDiscLinkInput(e.target.value)}
                    className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-4 py-2.5 text-[10px] font-mono flex-1 text-[var(--text-primary)] focus:border-[var(--accent-start)]/50 outline-none transition-all placeholder:opacity-30"
                  />
                  <button 
                    onClick={handleSaveDiscLink}
                    disabled={savingDiscLink}
                    className="px-4 bg-[var(--accent-start)]/10 text-[var(--accent-start)] border border-[var(--accent-start)]/20 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-[var(--accent-start)] hover:text-white transition-all flex items-center gap-1.5"
                  >
                    {savingDiscLink ? <Loader2 size={12} className="animate-spin" /> : <Settings size={12} />} Salvar
                  </button>
                </div>

                <button 
                  onClick={() => setShowDiscModal(true)}
                  className="w-full py-3.5 bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)] text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-[var(--accent-start)]/15 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 group"
                >
                  <Trophy size={14} className="group-hover:rotate-6 transition-transform" /> Lançar Análise DISC
                </button>
              </div>

            </div>

            {/* DIREITA: HISTÓRICO DE RESPOSTAS EM ACCORDIONS */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="p-6 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[3rem] space-y-6 shadow-sm">
                
                {/* Header Accordion */}
                <div className="flex items-center justify-between border-b border-[var(--border-primary)]/40 pb-5">
                  <div className="flex items-center gap-4 text-left">
                    <div className="p-3 bg-[var(--accent-start)]/10 rounded-2xl border border-[var(--accent-start)]/20 text-[var(--accent-start)]">
                      <FileText size={18} />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Mapa da Jornada</h3>
                      <p className="text-xs font-black text-[var(--text-primary)] tracking-tight mt-0.5">Formulários & Surveys Preenchidos</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[8px] font-black uppercase tracking-wider rounded-lg font-mono">
                    {allSubmissionsList.length} submissões
                  </span>
                </div>

                {/* Submissions accordions list */}
                <div className="space-y-4">
                  {allSubmissionsList.length > 0 ? (
                    allSubmissionsList.map((sub) => {
                      const id = sub.type === "survey" ? sub.surveyId : sub.formId;
                      const isOpen = !!expandedAccordions[id];
                      const title = getSubmissionTitle(sub);
                      const renderableFields = getRenderableFields(sub);

                      return (
                        <div 
                          key={sub.type + id} 
                          className="border border-[var(--border-primary)]/60 rounded-[1.5rem] overflow-hidden bg-[var(--bg-primary)]/20 transition-all hover:border-[var(--border-primary)]"
                        >
                          {/* Accordion Trigger Header */}
                          <button
                            onClick={() => toggleAccordion(id)}
                            className="w-full px-6 py-4 flex items-center justify-between text-left transition-colors hover:bg-[var(--input-bg)]/25"
                          >
                            <div className="space-y-1 max-w-[80%]">
                              <h4 className="text-xs font-black text-[var(--text-primary)] tracking-tight truncate group-hover:text-[var(--accent-start)] transition-colors">
                                {title}
                              </h4>
                              <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5 opacity-60">
                                <span className={`w-1.5 h-1.5 rounded-full ${sub.type === "survey" ? "bg-amber-500" : "bg-blue-500"}`} />
                                <span className="font-mono">{id}</span>
                                <span>•</span>
                                <span>{sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString("pt-BR") : "—"}</span>
                              </p>
                            </div>
                            <div className="p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-muted)]">
                              <ChevronRight size={14} className={`transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`} />
                            </div>
                          </button>

                          {/* Accordion Content */}
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: "auto" }}
                                exit={{ height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-6 pb-6 pt-2 border-t border-[var(--border-primary)]/40 bg-[var(--bg-primary)]/10 space-y-4">
                                  {renderableFields.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-4 text-left">
                                      {renderableFields.map((field, idx) => (
                                        <div key={idx} className="space-y-1">
                                          <span className="text-[8px] font-black uppercase tracking-wider text-[var(--text-muted)] opacity-70 flex items-center gap-1">
                                            <ChevronRight size={10} className="text-[var(--accent-start)]" /> {field.label}
                                          </span>
                                          <p className="text-xs font-medium text-[var(--text-primary)] leading-relaxed pl-3 whitespace-pre-line font-medium break-all">
                                            {field.value}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="py-4 text-center text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50 flex items-center justify-center gap-2">
                                      <HelpCircle size={12} /> Nenhuma resposta registrada neste formulario
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-16 text-center space-y-3">
                      <div className="w-14 h-14 mx-auto rounded-full border border-dashed border-[var(--border-primary)] flex items-center justify-center bg-[var(--bg-primary)]/30">
                        <FileText size={18} className="text-[var(--text-muted)] opacity-20" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50">
                        Nenhuma submissao registrada para este usuario
                      </p>
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>

          {/* DISC Devolutiva Modal launcher */}
          <AnimatePresence>
            {showDiscModal && (
              <DiscDevolutivaModal 
                user={{
                  matricula: userData.profile.matricula,
                  name: userData.profile.name,
                  uid: userData.profile.uid,
                  email: userData.profile.email,
                  isAdmin: false,
                  role: "member",
                  services: {}
                }} 
                onClose={() => setShowDiscModal(false)} 
                onSuccess={() => {
                  alert("Devolutiva DISC publicada com sucesso.");
                  // Reload user data to grab the newly published disc result
                  getDevolutivaUserData(selectedMatricula).then(res => {
                    if (res.success && res.data) setUserData(res.data);
                  });
                }}
              />
            )}
          </AnimatePresence>

        </div>
      )}

      {/* Selector placeholder when no user is selected */}
      {!loadingData && !userData && (
        <div className="py-24 text-center rounded-[3rem] bg-[var(--input-bg)] border border-dashed border-[var(--border-primary)] space-y-4">
          <div className="w-16 h-14 mx-auto rounded-full flex items-center justify-center text-[var(--text-muted)] opacity-30">
            <Brain size={42} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">
              Aguardando Seleção de Usuario
            </h4>
            <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider opacity-60">
              Escolha um usuario no dropdown superior para visualizar o Painel de Carreira 360º
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
