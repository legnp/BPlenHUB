"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  MapPin, 
  CreditCard, 
  Save, 
  Edit3, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InputGlass } from "@/components/ui/InputGlass";
import { SelectGlass } from "@/components/ui/SelectGlass";
import { ChoiceButton } from "@/components/ui/ChoiceButton";
import { 
  getRegistrationDataAction, 
  updateRegistrationDataAction, 
  RegistrationData 
} from "@/actions/profile-registration";
import { maskCPF, maskCEP, maskPhoneBR, lookupCEP } from "@/utils/validations";
import { GLOBAL_COUNTRIES } from "@/utils/locations";

/**
 * BPlen HUB — ProfileRegistrationTab 📋🛡️
 * Central de gestão de dados oficiais, fiscais e residenciais.
 */
export function ProfileRegistrationTab() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCEPChecking, setIsCEPChecking] = useState(false);
  const [data, setData] = useState<RegistrationData | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // 1. Carregamento Inicial
  useEffect(() => {
    async function load() {
      const res = await getRegistrationDataAction();
      if (res.success && res.data) {
        setData(res.data);
      }
      setIsLoading(false);
    }
    load();
  }, []);

  // 2. Manipulação de Mudanças com Máscaras 🎭
  const updateField = (field: keyof RegistrationData, value: string) => {
    if (!data) return;
    let finalValue = value;

    if (field === "cpf") finalValue = maskCPF(value);
    if (field === "cep" || field === "billing_cep") finalValue = maskCEP(value);
    if (field === "phone") finalValue = maskPhoneBR(value);

    setData({ ...data, [field]: finalValue });
  };

  // 3. Efeito de Busca de CEP 🛰️
  const handleCEPLookup = async (type: 'residencial' | 'faturamento') => {
    if (!data) return;
    const cep = type === 'residencial' ? data.cep : data.billing_cep;
    const cleanCEP = (cep || "").replace(/\D/g, "");

    if (cleanCEP.length === 8) {
      setIsCEPChecking(true);
      const res = await lookupCEP(cleanCEP);
      if (res) {
        if (type === 'residencial') {
          setData(prev => prev ? ({
            ...prev,
            rua: res.street,
            cidade: res.city,
            estado: res.state,
            pais: "BR"
          }) : null);
        } else {
          setData(prev => prev ? ({
            ...prev,
            billing_rua: res.street,
            billing_cidade: res.city,
            billing_estado: res.state,
            billing_pais: "BR"
          }) : null);
        }
      }
      setIsCEPChecking(false);
    }
  };

  // 4. Salvamento
  const handleSave = async () => {
    if (!data) return;
    setIsSaving(true);
    setMessage(null);

    const res = await updateRegistrationDataAction(data);
    if (res.success) {
      setMessage({ type: 'success', text: "Dados cadastrais atualizados e sincronizados com sucesso!" });
      setIsEditing(false);
    } else {
      setMessage({ type: 'error', text: "Erro ao salvar dados. Verifique sua conexão." });
    }
    setIsSaving(false);
    setTimeout(() => setMessage(null), 5000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Loader2 className="w-10 h-10 text-[var(--accent-start)] animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] italic">
          Recuperando registros oficiais...
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-5xl space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* 🏆 Botões de Ação de Topo */}
      <div className="flex justify-between items-center px-4">
         <div className="space-y-1">
            <h2 className="text-xl font-black tracking-tight text-[var(--text-primary)]">Dados Cadastrais</h2>
            <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-widest opacity-60">Identificação e Informações Oficiais</p>
         </div>

         <div className="flex items-center gap-4">
            {isEditing ? (
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-3 bg-[var(--accent-start)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[var(--accent-start)]/20 flex items-center gap-2"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Salvar Alterações
              </button>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-8 py-3 glass text-[var(--text-primary)] border border-[var(--border-primary)] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--input-bg)] transition-all flex items-center gap-2"
              >
                <Edit3 size={14} />
                Habilitar Edição
              </button>
            )}
         </div>
      </div>

      {/* 📊 Feedback de Status */}
      {message && (
        <div className={cn(
          "px-8 py-4 rounded-3xl text-[11px] font-bold flex items-center gap-3 animate-in slide-in-from-top-2 duration-500",
          message.type === 'success' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
        )}>
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* 🏢 Seção 1: Identificação BPlen (Read-Only) */}
      <div className="p-10 border border-[var(--border-primary)] bg-[var(--glass-bg)] rounded-[3.5rem] glass space-y-8">
         <div className="flex items-center gap-4 text-[var(--accent-start)]">
            <ShieldCheck size={24} />
            <h3 className="text-sm font-black uppercase tracking-widest">Identificação da Conta</h3>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2 opacity-80">
               <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]"><Lock size={10} /> Matrícula</label>
               <InputGlass value={data.matricula} readOnly className="bg-[var(--bg-primary)]/40 border-[var(--border-primary)]" />
            </div>
            <div className="space-y-2 opacity-80">
               <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]"><Lock size={10} /> E-mail de Conexão</label>
               <InputGlass value={data.email} readOnly className="bg-[var(--bg-primary)]/40 border-[var(--border-primary)]" />
            </div>
            <div className="space-y-2 opacity-80">
               <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]"><Lock size={10} /> Apelido</label>
               <InputGlass value={data.user_name} readOnly className="bg-[var(--bg-primary)]/40 border-[var(--border-primary)]" />
            </div>
         </div>
         <p className="text-[9px] text-[var(--text-muted)] italic">* Dados de identificação protegidos. Para alterá-los, entre em contato com o suporte institucional.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 👤 Seção 2: Dados Pessoais */}
        <div className="p-10 border border-[var(--border-primary)] bg-[var(--input-bg)] rounded-[3.5rem] glass space-y-8">
           <div className="flex items-center gap-4 text-[var(--text-primary)]">
              <User size={20} />
              <h3 className="text-sm font-black uppercase tracking-widest">Dados Pessoais</h3>
           </div>
           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Nome Completo</label>
                 <InputGlass 
                    disabled={!isEditing} 
                    value={data.full_name} 
                    onChange={(e) => updateField('full_name', e.target.value)}
                    placeholder="Seu nome completo"
                 />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">CPF</label>
                    <InputGlass 
                       disabled={!isEditing} 
                       value={data.cpf} 
                       onChange={(e) => updateField('cpf', e.target.value)}
                       placeholder="000.000.000-00"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Nascimento</label>
                    <InputGlass 
                       disabled={!isEditing} 
                       type="date"
                       value={data.birth_date} 
                       onChange={(e) => updateField('birth_date', e.target.value)}
                    />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">WhatsApp / Telefone</label>
                 <InputGlass 
                    disabled={!isEditing} 
                    value={data.phone} 
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="(00) 00000-0000"
                 />
              </div>
           </div>
        </div>

        {/* 📍 Seção 3: Endereço Residencial */}
        <div className="p-10 border border-[var(--border-primary)] bg-[var(--input-bg)] rounded-[3.5rem] glass space-y-8">
           <div className="flex items-center gap-4 text-[var(--text-primary)]">
              <MapPin size={20} />
              <h3 className="text-sm font-black uppercase tracking-widest">Endereço Residencial</h3>
           </div>
           <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">CEP</label>
                    <div className="relative">
                       <InputGlass 
                          disabled={!isEditing} 
                          value={data.cep} 
                          onChange={(e) => updateField('cep', e.target.value)}
                          onBlur={() => handleCEPLookup('residencial')}
                          placeholder="00000-000"
                       />
                       {isCEPChecking && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                             <Loader2 size={12} className="animate-spin text-[var(--accent-start)]" />
                          </div>
                       )}
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">País</label>
                    <SelectGlass 
                       disabled={!isEditing} 
                       value={data.pais}
                       onChange={(e) => updateField('pais', e.target.value)}
                    >
                       <option value="">Selecione</option>
                       {GLOBAL_COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </SelectGlass>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Estado</label>
                    <InputGlass disabled={!isEditing} value={data.estado} onChange={(e) => updateField('estado', e.target.value)} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Cidade</label>
                    <InputGlass disabled={!isEditing} value={data.cidade} onChange={(e) => updateField('cidade', e.target.value)} />
                 </div>
              </div>
              <div className="grid grid-cols-3 gap-6">
                 <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Logradouro</label>
                    <InputGlass disabled={!isEditing} value={data.rua} onChange={(e) => updateField('rua', e.target.value)} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Número</label>
                    <InputGlass disabled={!isEditing} value={data.numero} onChange={(e) => updateField('numero', e.target.value)} />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Complemento</label>
                 <InputGlass disabled={!isEditing} value={data.complemento} onChange={(e) => updateField('complemento', e.target.value)} placeholder="Apto, Bloco, etc." />
              </div>
           </div>
        </div>

        {/* 🧾 Seção 4: Dados de Faturamento */}
        <div className="p-10 border border-[var(--border-primary)] bg-[var(--input-bg)] rounded-[3.5rem] glass space-y-10 col-span-1 lg:col-span-2">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-[var(--text-primary)]">
                 <CreditCard size={20} />
                 <h3 className="text-sm font-black uppercase tracking-widest">Configuração de Faturamento</h3>
              </div>
              <div className="w-full md:w-auto">
                 <ChoiceButton 
                    active={data.billing_same_as_address === "yes"} 
                    onClick={() => updateField('billing_same_as_address', 'yes')}
                    className="w-full md:w-auto"
                 >
                    Usar endereço residencial
                 </ChoiceButton>
                 <ChoiceButton 
                    active={data.billing_same_as_address === "no"} 
                    onClick={() => updateField('billing_same_as_address', 'no')}
                    className="ml-0 md:ml-4 mt-4 md:mt-0 w-full md:w-auto"
                 >
                    Usar outro endereço
                 </ChoiceButton>
              </div>
           </div>

           {data.billing_same_as_address === "no" && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">CEP Faturamento</label>
                   <div className="relative">
                      <InputGlass 
                        disabled={!isEditing} 
                        value={data.billing_cep} 
                        onChange={(e) => updateField('billing_cep', e.target.value)}
                        onBlur={() => handleCEPLookup('faturamento')}
                      />
                      {isCEPChecking && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                             <Loader2 size={12} className="animate-spin text-[var(--accent-start)]" />
                          </div>
                       )}
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Logradouro Faturamento</label>
                   <InputGlass disabled={!isEditing} value={data.billing_rua} onChange={(e) => updateField('billing_rua', e.target.value)} />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Número</label>
                   <InputGlass disabled={!isEditing} value={data.billing_numero} onChange={(e) => updateField('billing_numero', e.target.value)} />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Cidade</label>
                   <InputGlass disabled={!isEditing} value={data.billing_cidade} onChange={(e) => updateField('billing_cidade', e.target.value)} />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Estado</label>
                   <InputGlass disabled={!isEditing} value={data.billing_estado} onChange={(e) => updateField('billing_estado', e.target.value)} />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">País Faturamento</label>
                   <SelectGlass value={data.billing_pais} onChange={(e) => updateField('billing_pais', e.target.value)} disabled={!isEditing}>
                      <option value="">Selecione</option>
                      {GLOBAL_COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                   </SelectGlass>
                </div>
             </div>
           )}
        </div>

      </div>
    </div>
  );
}
