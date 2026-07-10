"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Users, 
  Search, 
  ShieldCheck, 
  ShieldOff, 
  UserCircle, 
  Mail, 
  Fingerprint, 
  Loader2,
  Activity,
  Layers,
  CheckCircle2,
  ChevronDown,
  Settings,
  X,
  CreditCard,
  Rocket,
  ShieldAlert,
  Link2,
  Trophy,
  FileText,
  Copy,
  KeyRound,
  type LucideIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminUser, UserRole, UserServices } from "@/types/users";
import { cn } from "@/lib/utils";
import { getAdminUsersList, updateUserPermissions, toggleProfessionalStatusAction, updateMentoCoachSessionsQuotaAction } from "@/actions/users-admin";
import { auth } from "@/lib/firebase";
import { useAuthContext } from "@/context/AuthContext";
import { DiscDevolutivaModal } from "@/components/admin/DiscDevolutivaModal";
import { getAdminProducts } from "@/actions/products";
import { Product } from "@/types/products";
import { getMemberQuotasAction, updateMemberQuotasAction } from "@/actions/quotas";
import { getErrorMessage } from "@/lib/utils/errors";
import type { UserAssessment } from "@/actions/admin-assessments";
import type { LegalAudit } from "@/actions/legal";

/**
 * BPlen HUB — Gestão de Usuários e Governança
 * Fundação para controle de papéis e produtos/serviços granulares.
 */

const ROLE_OPTIONS: { id: UserRole; label: string; icon: LucideIcon }[] = [
  { id: "admin", label: "Administrador", icon: ShieldCheck },
  { id: "member", label: "Membro", icon: Users },
  { id: "visitor", label: "Visitante", icon: UserCircle },
  { id: "suspended", label: "Banido / Suspenso", icon: ShieldOff },
];

export default function UsersManagementPage() {
  const { isAdmin: currentAdminStatus, loading: authLoading } = useAuthContext();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  
  // Modal de Serviços e Assessments
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<"services" | "assessments" | "contracts">("services");
  const [userAssessments, setUserAssessments] = useState<UserAssessment[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [userContracts, setUserContracts] = useState<LegalAudit[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [editingQuotas, setEditingQuotas] = useState<Record<string, number>>({});
  const [isLoadingQuotas, setIsLoadingQuotas] = useState(false);
  const [discLinkInput, setDiscLinkInput] = useState("");
  const [savingDisc, setSavingDisc] = useState(false);
  const [showDiscDevolutiva, setShowDiscDevolutiva] = useState(false);
  const [savingWaiver, setSavingWaiver] = useState<string | null>(null);

  const fetchUsersAndProducts = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const [usersResult, productsResult] = await Promise.all([
        getAdminUsersList(token),
        getAdminProducts()
      ]);
      
      if (usersResult.success && usersResult.data) {
        setUsers(usersResult.data);
      }
      setProducts(productsResult);
      setError(null);
    } catch (err: unknown) {
      console.error("Fetch Error:", err);
      setError("Erro ao sincronizar dados administrativos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndProducts();
  }, []);

  // Sincronizar input do DISC quando o usuário mudar
  useEffect(() => {
    if (selectedUser) {
      setDiscLinkInput(selectedUser.metadata?.disc_link || "");
    }
  }, [selectedUser]);

  // Carregar Quotas quando o modal abre
  useEffect(() => {
    if (selectedUser && activeTab === "services") {
      const load = async () => {
        if (!selectedUser.uid) return;
        setIsLoadingQuotas(true);
        const wallet = await getMemberQuotasAction(selectedUser.uid);
        if (wallet && wallet.quotas) {
          const flatQuotas: Record<string, number> = {};
          Object.entries(wallet.quotas).forEach(([key, val]) => {
            flatQuotas[key] = val.total || 0;
          });
          setEditingQuotas(flatQuotas);
        } else {
          setEditingQuotas({});
        }
        setIsLoadingQuotas(false);
      };
      load();
    }
  }, [selectedUser, activeTab]);

  // Carregar Assessments quando o modal abre
  useEffect(() => {
    if (selectedUser && activeTab === "assessments") {
       const load = async () => {
          const { getUserAssessments } = await import("@/actions/admin-assessments");
          setLoadingAssessments(true);
          const results = await getUserAssessments(selectedUser.matricula);
          setUserAssessments(results);
          setLoadingAssessments(false);
       };
       load();
    }
  }, [selectedUser, activeTab]);

  // Carregar Contratos quando o modal abre
  useEffect(() => {
    if (selectedUser && activeTab === "contracts") {
       const load = async () => {
          const { getUserLegalAudits } = await import("@/actions/legal");
          setLoadingContracts(true);
          const results = await getUserLegalAudits(selectedUser.uid || selectedUser.matricula);
          if (results.success) setUserContracts(results.audits);
          setLoadingContracts(false);
       };
       load();
    }
  }, [selectedUser, activeTab]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.matricula.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
        
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  /**
   * Etapas da jornada (fonte única: produtos com `isStepJourney`), na ordem canônica.
   * É sobre elas que a dispensa de pré-requisito é concedida.
   */
  const journeySteps = useMemo(() => {
    return products
      .filter(p => p.isStepJourney && p.status === "active" && Boolean(p.serviceCode))
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  }, [products]);

  const handleToggleWaiver = async (serviceCode: string) => {
    if (!selectedUser) return;
    const current = selectedUser.dispensaPreRequisito ?? [];
    const next = current.includes(serviceCode)
      ? current.filter(code => code !== serviceCode)
      : [...current, serviceCode];

    setSavingWaiver(serviceCode);
    try {
      const token = await auth.currentUser?.getIdToken();
      // A action lança em caso de payload inválido/erro — tratado no catch abaixo.
      await updateUserPermissions(selectedUser.matricula, { dispensaPreRequisito: next }, token);
      setSelectedUser(prev => prev ? { ...prev, dispensaPreRequisito: next } : null);
      setUsers(prev => prev.map(u =>
        u.matricula === selectedUser.matricula ? { ...u, dispensaPreRequisito: next } : u
      ));
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Erro ao atualizar a dispensa de pré-requisito."));
    } finally {
      setSavingWaiver(null);
    }
  };

  const handleUpdateRole = async (targetMatricula: string, newRole: UserRole) => {
    setProcessingUser(targetMatricula);
    try {
      const token = await auth.currentUser?.getIdToken();
      await updateUserPermissions(targetMatricula, { role: newRole }, token);
      
      setUsers(prev => prev.map(u => 
        u.matricula === targetMatricula ? { ...u, role: newRole, isAdmin: newRole === 'admin' } : u
      ));
      if (selectedUser?.matricula === targetMatricula) {
        setSelectedUser(prev => prev ? { ...prev, role: newRole, isAdmin: newRole === 'admin' } : null);
      }
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Erro ao atualizar perfil."));
    } finally {
      setProcessingUser(null);
    }
  };

  const handleUpdateMentoCoachLimit = async (targetMatricula: string, limit: number) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      setProcessingUser(targetMatricula);
      const res = await updateMentoCoachSessionsQuotaAction(targetMatricula, limit, token);
      if (res.success) {
        alert("Limite de sessões atualizado!");
        setUsers(users.map(u => 
          u.matricula === targetMatricula ? { ...u, mentoCoachSessionsLimit: limit } : u
        ));
        setSelectedUser(prev => prev ? { ...prev, mentoCoachSessionsLimit: limit } : null);
      } else {
        alert(res.error || "Erro ao atualizar limite");
      }
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Erro ao atualizar limite"));
    } finally {
      setProcessingUser(null);
    }
  };

  const handleUpdateServices = async (targetMatricula: string, services: UserServices) => {
    if (!selectedUser) return;
    setProcessingUser(targetMatricula);
    try {
      const token = await auth.currentUser?.getIdToken();
      
      // 1. Atualizar Acessos (Booleanos)
      await updateUserPermissions(targetMatricula, { services }, token);
      
      // 2. Atualizar Cotas (Valores Numéricos)
      // Filtramos apenas as cotas que pertencem a serviços que estão ativos
      const finalQuotas: Record<string, number> = {};
      Object.entries(editingQuotas).forEach(([key, val]) => {
         if (services[key]) finalQuotas[key] = val;
      });
      
      if (Object.keys(finalQuotas).length > 0 && selectedUser.uid) {
        await updateMemberQuotasAction(selectedUser.uid, finalQuotas);
      }
      
      setUsers(prev => prev.map(u => 
        u.matricula === targetMatricula ? { ...u, services } : u
      ));
      setSelectedUser(null);
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Erro ao atualizar serviços."));
    } finally {
      setProcessingUser(null);
    }
  };

  const handleToggleRelease = async (testId: string, currentStatus: boolean) => {
    if (!selectedUser) return;
    setLoadingAssessments(true);
    try {
      const { toggleAssessmentRelease } = await import("@/actions/admin-assessments");
      const res = await toggleAssessmentRelease(selectedUser.matricula, testId, currentStatus);
      if (res.success) {
         setUserAssessments(prev => prev.map(a => 
           a.id === testId ? { ...a, isReleased: !currentStatus } : a
         ));
      }
    } catch (err) {
      alert("Erro ao atualizar status do diagnóstico.");
    } finally {
      setLoadingAssessments(false);
    }
  };

  const handleSaveDiscLink = async () => {
    if (!selectedUser) return;
    setSavingDisc(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      await updateUserPermissions(
        selectedUser.matricula, 
        { metadata: { ...selectedUser.metadata, disc_link: discLinkInput } }, 
        token
      );
      
      // Atualizar estado local
      setUsers(prev => prev.map(u => 
        u.matricula === selectedUser.matricula 
          ? { ...u, metadata: { ...u.metadata, disc_link: discLinkInput } } 
          : u
      ));
      setSelectedUser(prev => prev ? { ...prev, metadata: { ...prev.metadata, disc_link: discLinkInput } } : null);
      
      alert("Link DISC salvo com sucesso!");
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Erro ao salvar link DISC."));
    } finally {
      setSavingDisc(false);
    }
  };

  const handleToggleProfessional = async (targetMatricula: string, currentStatus: boolean) => {
    setProcessingUser(targetMatricula);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await toggleProfessionalStatusAction(targetMatricula, !currentStatus, token);
      
      if (res.success) {
        setUsers(prev => prev.map(u => 
          u.matricula === targetMatricula ? { ...u, isProfessional: !currentStatus } : u
        ));
        if (selectedUser?.matricula === targetMatricula) {
          setSelectedUser(prev => prev ? { ...prev, isProfessional: !currentStatus } : null);
        }
      } else {
        alert(res.error || "Erro ao atualizar status profissional.");
      }
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Erro crítico na governança profissional."));
    } finally {
      setProcessingUser(null);
    }
  };


  return (
    <div className="space-y-8 pb-20">
      {/* Header section com Estetíca Premium */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="space-y-1 text-left">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            GESTÃO DE <span className="text-[var(--accent-start)] italic">USUÁRIOS</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm font-medium opacity-70">
            Gestão centralizada de usuários, papéis e permissões de acesso.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex items-center gap-3 bg-[var(--accent-soft)]/20 border border-[var(--accent-start)]/10 px-6 py-3 rounded-2xl">
            <Activity size={16} className="text-[var(--accent-start)] animate-pulse" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--accent-start)]">
               Governance Engine Active
            </span>
          </div>

          <button
            onClick={async () => {
              if (!confirm("Deseja executar a migração de dados legados? Isso irá atualizar todos os perfis para o novo padrão institucional.")) return;
              try {
                const { runWelcomeMigration } = await import("@/actions/migration-welcome");
                const res = await runWelcomeMigration();
                if (res.success && res.results) {
                  alert(`Sucesso! ${res.results.migrated} usuários migrados de um total de ${res.results.total}. (${res.results.skipped} pulados).`);
                  fetchUsersAndProducts();
                } else {
                  alert(`Falha na migração de dados.`);
                }
              } catch (err: unknown) {
                alert(`Erro crítico: ${getErrorMessage(err)}`);
              }
            }}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--accent-start)] text-white rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-[var(--accent-end)] transition-all group shadow-lg shadow-[var(--accent-start)]/20"
          >
            <ShieldCheck size={14} className="group-hover:scale-110 transition-transform" />
            Migrar Dados Legados (Cleanup)
          </button>
        </div>
      </div>

      {/* Alerta de Erro (Debug) */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center gap-4 text-red-500 shadow-2xl"
          >
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
               <X size={18} />
            </div>
            <div className="flex-1">
               <h5 className="text-[10px] font-bold uppercase tracking-widest">Erro de Sincronização</h5>
               <p className="text-sm font-medium opacity-80">{error}</p>
            </div>
            <button 
              onClick={() => fetchUsersAndProducts()}
              className="px-6 py-2 bg-red-500 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-red-500/20 hover:scale-[1.02] transition-all"
            >
              Tentar Novamente
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barra de Busca e Filtros */}
      <div className="flex flex-wrap items-center gap-4 p-5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[2rem] shadow-2xl backdrop-blur-3xl">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] opacity-40" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou matrícula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--bg-primary)]/50 border border-[var(--input-border)] rounded-2xl pl-12 pr-6 py-3.5 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]/50 transition-all"
          />
        </div>

        <div className="flex items-center bg-[var(--bg-primary)]/50 p-1.5 rounded-2xl border border-[var(--input-border)] gap-1 overflow-x-auto">
          {(['all', 'admin', 'member', 'visitor', 'suspended'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-4 py-2 rounded-xl text-[9px] font-bold transition-all uppercase tracking-widest whitespace-nowrap ${roleFilter === role
                  ? role === 'suspended' ? "bg-red-500 text-white shadow-xl shadow-red-500/20" :  "bg-[var(--accent-start)] text-white shadow-xl shadow-[var(--accent-start)]/20"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
            >
              {role === 'all' ? 'Todos' : role === 'suspended' ? 'Banidos' : role}
            </button>
          ))}
        </div>
      </div>

      {/* Listagem de Usuários */}
      <div className="glass overflow-hidden rounded-[2.5rem] border-[var(--border-primary)] shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--input-bg)]/80 border-b border-[var(--border-primary)]">
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Identidade / Membro</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Papel (Role)</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Acessos Granulares</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Status</th>
                <th className="px-8 py-5 text-right text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-10 bg-[var(--input-bg)]/40 opacity-50 italic text-[10px] uppercase font-bold tracking-widest">Sincronizando governança...</td>
                  </tr>
                ))
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.matricula} className={`hover:bg-[var(--accent-soft)]/10 transition-colors group ${user.role === 'suspended' ? 'opacity-60 grayscale' : ''}`}>
                    {/* Identidade */}
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--bg-primary)] to-[var(--input-bg)] border border-[var(--border-primary)] flex items-center justify-center shrink-0 shadow-sm">
                           <UserCircle size={24} className="text-[var(--text-muted)] opacity-30" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-[var(--text-primary)] truncate flex items-center gap-2">
                             {user.name}
                             {user.nickname && <span className="text-[9px] px-1.5 py-0.5 bg-[var(--accent-start)]/10 text-[var(--accent-start)] rounded-md">@{user.nickname}</span>}
                          </h4>
                          <p className="text-[10px] text-[var(--text-muted)] font-medium flex items-center gap-1.5 mt-1">
                             <Mail size={10} /> {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Papel (Role) - Seletor Estrutural */}
                    <td className="px-8 py-6">
                      <div className="relative group/role inline-block">
                        <select 
                          value={user.role}
                          onChange={(e) => handleUpdateRole(user.matricula, e.target.value as UserRole)}
                          disabled={processingUser === user.matricula}
                          className={`appearance-none font-bold text-[9px] uppercase tracking-widest pl-3 pr-8 py-2 rounded-xl border transition-all cursor-pointer focus:outline-none ${
                            user.role === 'admin' 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" 
                            : user.role === 'suspended'
                            ? "bg-red-500/10 border-red-500/20 text-red-600"
                            : "bg-blue-500/10 border-blue-500/20 text-blue-600"
                          } disabled:opacity-30`}
                        >
                          <option value="visitor">Visitante</option>
                          <option value="member">Membro</option>
                          <option value="admin">Administrador</option>
                          <option value="suspended">Banido</option>
                        </select>
                        <ChevronDown size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
                      </div>
                    </td>

                    {/* Acessos (Destaque para Entitlements Dinâmicos) */}
                    <td className="px-8 py-6">
                      <button 
                        onClick={() => { setSelectedUser(user); setActiveTab("services"); }}
                        className="flex flex-wrap gap-1.5 hover:scale-[1.02] transition-transform text-left"
                      >
                         {Object.entries(user.services).filter(([_, active]) => active).map(([id]) => {
                            const productName = products.find(p => p.id === id || p.slug === id)?.title;
                            return (
                              <div key={id} className={`px-2 py-1 border rounded-lg text-[8px] font-bold uppercase tracking-tighter ${id === 'member_area_access' ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-600' : 'bg-[var(--accent-start)]/5 border-[var(--accent-start)]/10 text-[var(--accent-start)]/70'}`}>
                                 {id === 'member_area_access' ? 'Portaria' : (productName || id)}
                              </div>
                            );
                         })}
                         {Object.values(user.services).filter(v => v === true).length === 0 && (
                            <div className="px-2 py-1 bg-gray-500/5 border border-dashed border-gray-500/20 rounded-lg text-[8px] font-bold text-gray-400 uppercase tracking-tighter">
                               Nenhum Serviço Ativo
                            </div>
                         )}
                      </button>
                    </td>

                    {/* Status de Governança */}
                    <td className="px-8 py-6">
                      <div className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${user.role === 'suspended' ? 'text-red-500' : 'text-green-500'}`}>
                         {user.role === 'suspended' ? <ShieldAlert size={14} /> : <CheckCircle2 size={14} />}
                         {user.role === 'suspended' ? "Suspenso" : "Ativo"}
                      </div>
                    </td>

                    {/* Ações Granulares */}
                    <td className="px-8 py-6 text-right">
                       <button 
                         onClick={() => { setSelectedUser(user); setActiveTab("services"); }}
                         className="p-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-all shadow-lg shadow-black/10 flex items-center gap-2 ml-auto"
                       >
                          <Settings size={14} />
                          <span className="text-[9px] font-bold uppercase tracking-widest">Configurações</span>
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Gestão de Usuário REFORMULADO */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-overlay flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setSelectedUser(null)}
               className="absolute inset-0 bg-black/80 backdrop-blur-md"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative w-full max-w-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[3rem] overflow-hidden shadow-2xl"
             >
                {/* Modal Header */}
                <div className="p-8 border-b border-[var(--border-primary)] bg-[var(--input-bg)]/50 flex justify-between items-center text-left">
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-[var(--accent-start)] uppercase tracking-widest">Governança & Mapeamento</p>
                      <h3 className="text-xl font-bold text-[var(--text-primary)]">{selectedUser.name}</h3>
                      <div className="flex gap-4 mt-4">
                        {(["services", "assessments", "contracts"] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`text-[9px] font-bold uppercase tracking-[0.2em] pb-2 border-b-2 transition-all ${
                              activeTab === tab 
                              ? "border-[var(--accent-start)] text-[var(--accent-start)]" 
                              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            }`}
                          >
                            {tab === "services" ? "Acessos & Serviços" : tab === "assessments" ? "Assessments / Devolutivas" : "Contratos & Aceites"}
                          </button>
                        ))}
                      </div>
                   </div>
                   <button onClick={() => setSelectedUser(null)} className="p-3 rounded-2xl hover:bg-[var(--input-bg)] transition-all text-[var(--text-muted)]">
                      <X size={20} />
                   </button>
                </div>

                {/* Modal Body */}
                <div className="p-10 space-y-12 max-h-[60vh] overflow-y-auto custom-scrollbar">
                   {activeTab === "services" ? (
                      <div className="space-y-10">
                         {/* SEÇÃO 1: Níveis de Plataforma (Role & Status) */}
                         <div className="space-y-6">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--accent-start)] flex items-center gap-3">
                               <ShieldCheck size={16} /> Níveis de Plataforma & Segurança
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {/* Role: Administrativo */}
                               <div className={`p-6 rounded-[2rem] border transition-all flex items-center justify-between ${selectedUser.role === 'admin' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-[var(--input-bg)] border-[var(--border-primary)] opacity-40 hover:opacity-100'}`}>
                                  <div>
                                     <p className="text-[10px] font-bold uppercase text-[var(--text-primary)]">Modo Administrativo</p>
                                     <p className="text-[8px] text-[var(--text-muted)] uppercase mt-1">Gestão Completa do Hub</p>
                                  </div>
                                  <button 
                                    onClick={() => handleUpdateRole(selectedUser.matricula, selectedUser.role === 'admin' ? 'member' : 'admin')}
                                    className={`w-12 h-6 rounded-full relative transition-all ${selectedUser.role === 'admin' ? 'bg-emerald-500' : 'bg-[var(--text-muted)]'}`}
                                  >
                                     <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${selectedUser.role === 'admin' ? 'left-7' : 'left-1'}`} />
                                  </button>
                               </div>

                               {/* Role: Suspended (Banimento) */}
                               <div className={`p-6 rounded-[2rem] border transition-all flex items-center justify-between ${selectedUser.role === 'suspended' ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-[var(--border-primary)] opacity-40 hover:opacity-100'}`}>
                                  <div>
                                     <p className="text-[10px] font-bold uppercase text-red-500">Banir Usuário</p>
                                     <p className="text-[8px] text-[var(--text-muted)] uppercase mt-1">Bloqueio total irrecorrível</p>
                                  </div>
                                  <button 
                                    onClick={() => handleUpdateRole(selectedUser.matricula, selectedUser.role === 'suspended' ? 'member' : 'suspended')}
                                    className={`w-12 h-6 rounded-full relative transition-all ${selectedUser.role === 'suspended' ? 'bg-red-500' : 'bg-gray-700'}`}
                                  >
                                     <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${selectedUser.role === 'suspended' ? 'left-7' : 'left-1'}`} />
                                  </button>
                               </div>

                               {/* NOVO: Selo Profissional BPlen 🌟 */}
                               <div className={`p-6 rounded-[2rem] border transition-all flex items-center justify-between ${selectedUser.isProfessional ? 'bg-[var(--accent-start)]/10 border-[var(--accent-start)]/30 shadow-lg shadow-[var(--accent-start)]/5' : 'bg-[var(--input-bg)] border-[var(--border-primary)] opacity-40 hover:opacity-100'}`}>
                                  <div className="flex items-center gap-3">
                                     <div className={cn("p-2 rounded-xl", selectedUser.isProfessional ? "bg-[var(--accent-start)]/10 text-[var(--accent-start)]" : "bg-[var(--bg-primary)]/40 text-[var(--text-muted)]")}>
                                        <Trophy size={16} />
                                     </div>
                                     <div>
                                        <p className={cn("text-[10px] font-bold uppercase", selectedUser.isProfessional ? "text-[var(--accent-start)]" : "text-[var(--text-primary)]")}>Profissional BPlen</p>
                                        <p className="text-[8px] text-[var(--text-muted)] uppercase mt-1 font-medium italic">Habilitar curadoria na rede</p>
                                     </div>
                                  </div>
                                  <button 
                                    onClick={() => handleToggleProfessional(selectedUser.matricula, !!selectedUser.isProfessional)}
                                    className={`w-12 h-6 rounded-full relative transition-all ${selectedUser.isProfessional ? 'bg-[var(--accent-start)] shadow-lg shadow-[var(--accent-start)]/20' : 'bg-[var(--text-muted)]'}`}
                                  >
                                     <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${selectedUser.isProfessional ? 'left-7' : 'left-1'}`} />
                                  </button>
                               </div>

                               {/* Portaria / Área de Membro (Nova Localização: Segurança 🔐) */}
                               <button 
                                 onClick={() => {
                                    const n = { ...selectedUser.services, member_area_access: !selectedUser.services.member_area_access };
                                    setSelectedUser({ ...selectedUser, services: n });
                                 }}
                                 className={`p-6 rounded-[2rem] border text-left flex items-center justify-between group transition-all ${selectedUser.services.member_area_access ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-[var(--border-primary)] opacity-40 hover:opacity-100'}`}
                               >
                                  <div>
                                     <p className={`text-[10px] font-bold uppercase ${selectedUser.services.member_area_access ? 'text-emerald-500' : ''}`}>Área de Membros</p>
                                     <p className="text-[8px] text-[var(--text-muted)] uppercase mt-1">Acesso Base à Plataforma</p>
                                  </div>
                                  <div className={`w-10 h-5 rounded-full relative transition-all ${selectedUser.services.member_area_access ? 'bg-emerald-500' : 'bg-gray-700'}`}>
                                     <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${selectedUser.services.member_area_access ? 'left-6' : 'left-1'}`} />
                                  </div>
                               </button>

                               {/* Cotas de Sessões de MentoCoach */}
                               <div className="p-6 rounded-[2rem] border bg-white/5 border-[var(--border-primary)] text-left flex items-center justify-between transition-all">
                                  <div>
                                     <p className="text-[10px] font-bold uppercase text-[var(--text-primary)]">Cotas de MentoCoach</p>
                                     <p className="text-[8px] text-[var(--text-muted)] uppercase mt-1">Sessões 1 to 1</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                     <input 
                                       type="number"
                                       value={selectedUser.mentoCoachSessionsLimit || 10}
                                       onChange={(e) => {
                                          const val = parseInt(e.target.value);
                                          if (!isNaN(val)) {
                                             setSelectedUser({ ...selectedUser, mentoCoachSessionsLimit: val });
                                          }
                                       }}
                                       className="w-16 bg-transparent border-b border-[var(--border-primary)] text-center text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)] px-1 py-1"
                                     />
                                     <button 
                                       onClick={() => handleUpdateMentoCoachLimit(selectedUser.matricula, selectedUser.mentoCoachSessionsLimit || 10)}
                                       className="p-2 rounded-xl bg-[var(--input-bg)] text-[var(--accent-start)] hover:bg-[var(--accent-start)] hover:text-white transition-all"
                                       title="Salvar Limite"
                                     >
                                        <CheckCircle2 size={16} />
                                     </button>
                                  </div>
                               </div>
                            </div>
                         </div>

                         {/* SEÇÃO 2: Serviços Contratados (Dinâmico do Catálogo) */}
                         <div className="space-y-6">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--accent-start)] flex items-center gap-3">
                               <Rocket size={16} /> Serviços do Portfólio
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {/* Produtos do Catálogo (Dinâmicos) */}
                               {products.map((product) => {
                                  const key = product.id || product.slug;
                                  const isActive = selectedUser.services[key];
                                  return (
                                      <div 
                                        key={product.id}
                                        className={`p-6 rounded-[2rem] border transition-all flex flex-col gap-4 ${isActive ? 'bg-[var(--accent-start)]/5 border-[var(--accent-start)]/20' : 'bg-white/5 border-[var(--border-primary)] opacity-40 hover:opacity-100'}`}
                                      >
                                         <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0 pr-4">
                                               <p className={`text-[10px] font-bold uppercase truncate ${isActive ? 'text-[var(--accent-start)]' : ''}`}>{product.title}</p>
                                               <p className="text-[7px] text-[var(--text-muted)] font-bold uppercase tracking-[0.2em] mt-1">{product.serviceCode || 'Serviço Ativo'}</p>
                                            </div>
                                            <button 
                                              onClick={() => {
                                                 const n = { ...selectedUser.services, [key]: !isActive };
                                                 setSelectedUser({ ...selectedUser, services: n });
                                              }}
                                              className={`w-10 h-5 rounded-full relative transition-all shrink-0 ${isActive ? 'bg-[var(--accent-start)]' : 'bg-gray-700'}`}
                                            >
                                               <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isActive ? 'left-6' : 'left-1'}`} />
                                            </button>
                                         </div>

                                         {isActive && (
                                            <div className="pt-3 border-t border-[var(--border-primary)] flex items-center justify-between">
                                               <div className="flex items-center gap-2">
                                                  <CreditCard size={12} className="text-[var(--accent-start)]" />
                                                  <label className="text-[8px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Créditos Disponíveis</label>
                                               </div>
                                               <input 
                                                  type="number"
                                                  min="0"
                                                  value={editingQuotas[key] || 0}
                                                  onChange={(e) => {
                                                     const val = parseInt(e.target.value) || 0;
                                                     setEditingQuotas(prev => ({ ...prev, [key]: val }));
                                                  }}
                                                  className="w-16 bg-[var(--bg-primary)]/40 border border-[var(--border-primary)] rounded-lg p-2 text-[10px] text-center font-black text-[var(--text-primary)] focus:border-[var(--accent-start)] outline-none"
                                               />
                                            </div>
                                         )}
                                      </div>
                                  );
                               })}
                            </div>
                          </div>
                      </div>
                    ) : activeTab === "assessments" ? (
                      <div className="space-y-6">
                        {loadingAssessments ? (
                          <div className="flex flex-col items-center justify-center py-20 gap-4">
                             <Loader2 size={32} className="animate-spin text-[var(--accent-start)]" />
                             <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Mapeando Pesquisas... (Admin)</p>
                          </div>
                        ) : userAssessments.length > 0 ? (
                           <div className="grid grid-cols-1 gap-4">
                             {userAssessments.map((test) => (
                               <div 
                                 key={test.id}
                                 className="p-6 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[1.5rem] flex items-center justify-between"
                               >
                                  <div className="flex items-center gap-4">
                                     <div className={`p-3 rounded-xl ${test.isReleased ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                        {test.isReleased ? <CheckCircle2 size={18} /> : <Activity size={18} />}
                                     </div>
                                     <div>
                                        <h5 className="font-bold text-sm text-[var(--text-primary)]">{test.title}</h5>
                                        <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-60 mt-1">
                                           Submetido em {new Date(test.submittedAt).toLocaleDateString("pt-BR")}
                                        </p>
                                     </div>
                                  </div>
                                  
                                  <button 
                                    onClick={() => handleToggleRelease(test.id, test.isReleased)}
                                    className={`px-5 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${
                                      test.isReleased 
                                      ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white" 
                                      : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02]"
                                    }`}
                                  >
                                     {test.isReleased ? "Ocultar do Cliente" : "Liberar para Cliente"}
                                  </button>
                               </div>
                             ))}
                           </div>
                         ) : (
                           <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                              <div className="p-6 rounded-3xl bg-[var(--bg-primary)] border border-dashed border-[var(--border-primary)]">
                                 <Fingerprint size={32} className="text-[var(--text-muted)] opacity-20" />
                              </div>
                              <p className="text-sm font-bold text-[var(--text-muted)] opacity-60">Nenhuma pesquisa submetida por este usuário.</p>
                           </div>
                         )}

                         {/* Portal DISC (External Link) */}
                         <div className="p-7 bg-[var(--accent-soft)]/20 border border-[var(--accent-start)]/10 rounded-[2rem] space-y-5">
                            <div className="flex items-center gap-3">
                               <div className="p-2 bg-[var(--accent-start)]/10 rounded-xl text-[var(--accent-start)]">
                                  <Link2 size={16} />
                               </div>
                               <h6 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-start)]">Portal DISC (External Link)</h6>
                            </div>
                            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] leading-relaxed max-w-sm ml-1 opacity-60">
                               Insira o link individual gerado no portal DISC para este membro.
                            </p>
                            
                            <div className="flex gap-2">
                               <input 
                                  type="text"
                                  placeholder="https://vrs.com.br/disc/resultado/..."
                                  value={discLinkInput}
                                  onChange={(e) => setDiscLinkInput(e.target.value)}
                                  className="bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl px-5 py-3.5 text-[10px] font-mono flex-1 text-[var(--text-primary)] focus:border-[var(--accent-start)]/50 outline-none transition-all placeholder:opacity-30"
                               />
                               <button 
                                  onClick={handleSaveDiscLink}
                                  disabled={savingDisc}
                                  className="px-6 bg-[var(--accent-start)]/10 text-[var(--accent-start)] rounded-2xl text-[9px] font-bold uppercase tracking-widest hover:bg-[var(--accent-start)] hover:text-white transition-all flex items-center gap-2 border border-[var(--accent-start)]/20 disabled:opacity-30 self-stretch"
                               >
                                  {savingDisc ? <Loader2 size={14} className="animate-spin" /> : <Settings size={14} />}
                                  Salvar Link
                               </button>
                            </div>

                            <button 
                               onClick={() => setShowDiscDevolutiva(true)}
                               className="w-full py-4 bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)] text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-[var(--accent-start)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                            >
                               <Trophy size={16} className="group-hover:rotate-12 transition-transform" />
                               Lançar Devolutiva DISC
                            </button>
                         </div>

                         {/* Dispensa de Pré-Requisito (Fase A / A3) */}
                         <div className="p-7 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[2rem] space-y-5">
                            <div className="flex items-center gap-3">
                               <div className="p-2 bg-[var(--accent-start)]/10 rounded-xl text-[var(--accent-start)]">
                                  <KeyRound size={16} />
                               </div>
                               <h6 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-start)]">Dispensa de Pré-Requisito</h6>
                            </div>
                            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] leading-relaxed max-w-md ml-1 opacity-60">
                               Libera uma etapa da jornada sem exigir a conclusão das etapas anteriores.
                               Não concede o serviço nem o selo de membro — apenas remove a trava de sequência.
                            </p>

                            {journeySteps.length > 0 ? (
                               <div className="space-y-2">
                                  {journeySteps.map((step) => {
                                     const isWaived = (selectedUser.dispensaPreRequisito ?? []).includes(step.serviceCode);
                                     const preReq = step.preRequisitos;
                                     const preReqLabel = preReq && preReq.modo !== "nenhum" && preReq.etapas.length > 0
                                       ? `exige ${preReq.modo === "qualquer" ? "qualquer uma de" : "todas"}: ${preReq.etapas.join(", ")}`
                                       : "sem pré-requisito declarado";

                                     return (
                                       <div
                                         key={step.serviceCode}
                                         className="flex items-center justify-between gap-4 p-4 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[1.25rem]"
                                       >
                                          <div className="min-w-0">
                                             <h5 className="font-bold text-sm text-[var(--text-primary)] truncate">
                                                {step.order ? `${step.order}. ` : ""}{step.title}
                                             </h5>
                                             <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-60 mt-1">
                                                <span className="font-mono">{step.serviceCode}</span> · {preReqLabel}
                                             </p>
                                          </div>

                                          <button
                                            onClick={() => handleToggleWaiver(step.serviceCode)}
                                            disabled={savingWaiver !== null}
                                            className={`shrink-0 px-5 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-40 ${
                                              isWaived
                                              ? "bg-emerald-500/10 text-emerald-600 hover:bg-red-500/10 hover:text-red-500"
                                              : "bg-[var(--accent-start)]/10 text-[var(--accent-start)] border border-[var(--accent-start)]/20 hover:bg-[var(--accent-start)] hover:text-white"
                                            }`}
                                          >
                                             {savingWaiver === step.serviceCode
                                               ? <Loader2 size={12} className="animate-spin" />
                                               : isWaived ? <CheckCircle2 size={12} /> : <KeyRound size={12} />}
                                             {isWaived ? "Dispensado" : "Dispensar"}
                                          </button>
                                       </div>
                                     );
                                  })}
                               </div>
                            ) : (
                               <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-50 py-4 text-center">
                                  Nenhuma etapa de jornada ativa no catálogo de produtos.
                               </p>
                            )}
                         </div>
                       </div>
                   ) : activeTab === "contracts" ? (
                       <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--accent-start)] flex items-center gap-3">
                            <FileText size={16} /> Contratos Assinados
                          </h4>
                        </div>
                        {loadingContracts ? (
                          <div className="flex items-center justify-center p-8 text-[var(--text-muted)]">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                            Carregando contratos...
                          </div>
                        ) : userContracts.length > 0 ? (
                          userContracts.map((contract, idx: number) => (
                            <div key={idx} className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[var(--accent-start)]/10 flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-[var(--accent-start)]" />
                                </div>
                                <div>
                                  <p className="font-medium text-[var(--text-primary)]">ID do Produto: {contract.productId}</p>
                                  <p className="text-xs text-[var(--text-muted)]">Aceito em: {new Date(contract.timestamp).toLocaleString("pt-BR")}</p>
                                  <p className="text-[10px] text-[var(--text-muted)] opacity-70">Hash: {contract.documentHash?.substring(0, 16)}...</p>
                                </div>
                              </div>
                              <a href={contract.documentUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--accent-start)]/20 text-[var(--text-primary)] transition-colors">
                                <Link2 className="w-4 h-4" />
                              </a>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-[var(--text-muted)] border border-dashed border-[var(--border-primary)] rounded-xl">
                            <FileText className="w-8 h-8 mx-auto mb-3 opacity-20" />
                            <p>Nenhum contrato assinado por este usuário.</p>
                          </div>
                        )}

                        <div className="mt-8 pt-8 border-t border-[var(--border-primary)] space-y-4">
                          <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--accent-start)] flex items-center gap-3">
                            <Link2 size={16} /> Gerar Link de Contrato Retroativo
                          </h4>
                          <p className="text-xs text-[var(--text-muted)]">
                            Crie um link para que clientes antigos possam assinar formalmente serviços que já possuem.
                          </p>
                          <div className="space-y-3">
                            {products.filter(p => p.price !== 0).map(p => (
                               <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                  <div>
                                     <p className="text-xs font-bold">{p.title}</p>
                                     <p className="text-[10px] text-[var(--text-muted)]">Link único, uso único, vinculado a esta conta (30 dias)</p>
                                  </div>
                                  <button
                                     onClick={async () => {
                                        const matricula = selectedUser.matricula || selectedUser.uid;
                                        if (!matricula) { alert("Usuário sem matrícula."); return; }
                                        const { createRetroactiveContractInvitationAction } = await import("@/actions/retroactive-contract");
                                        let res = await createRetroactiveContractInvitationAction(matricula, p.id);
                                        if (!res.success && res.needsConfirmation) {
                                           if (!window.confirm(`${res.message}\n\nDeseja gerar o link mesmo assim (retificacao)?`)) return;
                                           res = await createRetroactiveContractInvitationAction(matricula, p.id, true);
                                        }
                                        if (res.success && res.path) {
                                           await navigator.clipboard.writeText(`${window.location.origin}${res.path}`);
                                           alert("Link unico gerado e copiado. Valido por 30 dias, uso unico, vinculado a esta conta.");
                                        } else {
                                           alert("Falha ao gerar link: " + (res.error || "erro desconhecido"));
                                        }
                                     }}
                                     className="p-2 rounded-lg bg-[var(--input-bg)] hover:bg-[var(--accent-start)] hover:text-white transition-all group flex gap-2 items-center"
                                     title="Gerar link único de contrato"
                                  >
                                     <span className="text-[10px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">Gerar link</span>
                                     <Copy size={16} />
                                  </button>
                               </div>
                            ))}
                          </div>
                        </div>
                      </div>
                   ) : null}
                </div>

                {/* Modal Footer */}
                {activeTab === "services" && (
                  <div className="p-8 border-t border-[var(--border-primary)] bg-[var(--input-bg)]/50 flex justify-end gap-4">
                    <button 
                      onClick={() => handleUpdateServices(selectedUser.matricula, selectedUser.services)}
                      disabled={processingUser === selectedUser.matricula}
                      className="flex items-center gap-3 px-12 py-4 bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)] text-white rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30"
                    >
                        {processingUser === selectedUser.matricula ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        {processingUser === selectedUser.matricula ? "Salvando..." : "Atualizar Governança"}
                    </button>
                  </div>
                )}
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDiscDevolutiva && selectedUser && (
          <DiscDevolutivaModal 
            user={selectedUser} 
            onClose={() => setShowDiscDevolutiva(false)} 
            onSuccess={() => {
              alert("Devolutiva publicada!");
              fetchUsersAndProducts();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
