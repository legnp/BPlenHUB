"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Save, 
  Edit3, 
  FileText, 
  Briefcase, 
  Globe, 
  Mail, 
  Phone, 
  MessageSquare, 
  Instagram, 
  Linkedin, 
  Music, 
  MessageCircle,
  Hash,
  Loader2,
  CheckCircle2,
  AlertCircle,
  LucideIcon,
  Link2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  getProfessionalProfileAction, 
  updateProfessionalProfileAction, 
  ProfessionalProfileData,
  ContactItem
} from "@/actions/profile-professional";
import { useAuthContext } from "@/context/AuthContext";
import { BenefitsPackage } from "@/components/forms/SurveyFields/BenefitsPackage";
import { FileField } from "@/components/forms/SurveyFields/FileField";
import { InputGlass } from "@/components/ui/InputGlass";
import { TextareaGlass } from "@/components/ui/TextareaGlass";


/**
 * BPlen HUB — ProfileProfessionalTab 🧬🏛️
 * Central de gestão de carreira e interação na rede.
 * Foco em Soberania de Dados e Privacidade Seletiva.
 */
export function ProfileProfessionalTab() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<ProfessionalProfileData | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // 1. Carregamento Inicial
  useEffect(() => {
    async function load() {
      const res = await getProfessionalProfileAction();
      if (res.success && res.data) {
        setData(res.data);
      }
      setIsLoading(false);
    }
    load();
  }, []);

  // 2. Manipulação de Mudanças (Tipagem Robusta 🛡️)
  const updateField = <K extends keyof ProfessionalProfileData>(field: K, value: ProfessionalProfileData[K]) => {
    if (!data) return;
    setData({ ...data, [field]: value });
  };

  const updateContact = <K extends keyof ProfessionalProfileData['contacts']>(
    key: K, 
    field: keyof ContactItem, 
    value: ContactItem[keyof ContactItem]
  ) => {
    if (!data) return;
    setData({
      ...data,
      contacts: {
        ...data.contacts,
        [key]: {
          ...data.contacts[key],
          [field]: value
        }
      }
    });
  };

  const updateHashtag = (index: number, val: string) => {
    if (!data) return;
    const newTags = [...data.hashtags];
    // Adição automática de # se não existir
    let finalVal = val.trim();
    if (finalVal && !finalVal.startsWith('#')) finalVal = `#${finalVal}`;
    newTags[index] = finalVal;
    updateField('hashtags', newTags);
  };

  // 3. Salvamento
  const handleSave = async () => {
    if (!data) return;
    setIsSaving(true);
    setMessage(null);

    const res = await updateProfessionalProfileAction(data);
    if (res.success) {
      setMessage({ type: 'success', text: "Perfil profissional atualizado com sucesso!" });
      setIsEditing(false);
    } else {
      setMessage({ type: 'error', text: "Falha ao salvar. Tente novamente." });
    }
    setIsSaving(false);
    
    // Limpa mensagem após 5 segundos
    setTimeout(() => setMessage(null), 5000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Loader2 className="w-10 h-10 text-[var(--accent-start)] animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] italic">
          Sincronizando trilha profissional...
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-5xl space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 🛡️ Mural de Privacidade Interna */}
      <div className="p-8 border border-blue-500/20 bg-blue-500/5 rounded-[3rem] glass flex flex-col md:flex-row items-center gap-6">
        <div className="p-4 bg-[var(--input-bg)] rounded-3xl text-blue-400">
           <ShieldCheck size={32} />
        </div>
        <div className="space-y-1 text-center md:text-left">
           <h4 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Soberania de Privacidade</h4>
           <p className="text-[11px] leading-relaxed text-[var(--text-secondary)] opacity-80">
              Dados profissionais (Remuneração, Regime, Benefícios) são utilizados **exclusivamente** para processos internos da BPlen. Estes dados **nunca** ficarão visíveis para outros membros ou na página de networking.
           </p>
        </div>
      </div>

      {/* 🏆 Botões de Ação de Topo */}
      <div className="flex justify-between items-center px-4">
         <div className="space-y-1">
            <h2 className="text-xl font-black tracking-tight text-[var(--text-primary)]">Perfil Profissional</h2>
            <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-widest opacity-60">Gestão de Carreira e Networking</p>
         </div>

         <div className="flex items-center gap-4">
            {isEditing ? (
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-3 bg-[var(--accent-start)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[var(--accent-start)]/20 flex items-center gap-2"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Salvar Perfil
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

      {/* 🧊 Grid de Seções */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* 🧱 Seção 1: Configuração de Networking (Destaque Visual) */}
        <div className="p-10 border border-[var(--border-primary)] bg-[var(--input-bg)] rounded-[3.5rem] glass space-y-8 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-5">
              <Globe size={80} />
           </div>
           
           <div className="space-y-4 relative z-10">
              <h3 className="text-sm font-black uppercase tracking-widest text-[var(--accent-start)]">Networking BPlen</h3>
              
              <div className="flex flex-col gap-6">
                {/* Toggles Globais */}
                <div className="flex flex-col gap-4">
                   <div className="flex items-center justify-between p-4 bg-[var(--bg-primary)]/40 rounded-2xl border border-[var(--border-primary)]">
                      <div className="space-y-1">
                         <span className="text-[10px] font-black uppercase text-[var(--text-primary)]">Visibilidade na Rede</span>
                         <p className="text-[9px] text-[var(--text-muted)] italic">Aparecer para outros membros nas buscas</p>
                      </div>
                      <input 
                        type="checkbox" 
                        disabled={!isEditing}
                        checked={data.networking_visibility}
                        onChange={(e) => updateField('networking_visibility', e.target.checked)}
                        className="w-10 h-10 accent-[var(--accent-start)] cursor-pointer disabled:opacity-30"
                      />
                   </div>

                   <div className="flex items-center justify-between p-4 bg-[var(--bg-primary)]/40 rounded-2xl border border-[var(--border-primary)]">
                      <div className="space-y-1">
                         <span className="text-[10px] font-black uppercase text-[var(--text-primary)]">Banco de Talentos</span>
                         <p className="text-[9px] text-[var(--text-muted)] italic">Participar de indicações institucionais</p>
                      </div>
                      <input 
                        type="checkbox" 
                        disabled={!isEditing}
                        checked={data.participation_talent_bank}
                        onChange={(e) => updateField('participation_talent_bank', e.target.checked)}
                        className="w-10 h-10 accent-[var(--accent-start)] cursor-pointer disabled:opacity-30"
                      />
                   </div>
                </div>

                {/* Sales Pitch */}
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Elevator Pitch (Sales Pitch)</label>
                   <textarea 
                     rows={4}
                     disabled={!isEditing}
                     value={data.sales_pitch}
                     onChange={(e) => updateField('sales_pitch', e.target.value)}
                     className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl p-6 text-xs text-[var(--text-primary)] placeholder:italic focus:border-[var(--accent-start)]/50 focus:outline-none transition-all disabled:opacity-40"
                     placeholder="Conte sua proposta de valor em poucas palavras..."
                   />
                </div>

                {/* Hashtags Discovery */}
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Palavras-Chave para Descoberta (Hashtags)</label>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {data.hashtags.map((tag, idx) => (
                        <div key={idx} className="relative group">
                           <Hash size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent-start)] transition-colors" />
                           <input 
                              type="text"
                              disabled={!isEditing}
                              placeholder={`Tag ${idx + 1}`}
                              value={tag}
                              onChange={(e) => updateHashtag(idx, e.target.value)}
                              className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl pl-10 pr-4 py-3 text-[11px] text-[var(--text-primary)] focus:border-[var(--accent-start)]/30 outline-none transition-all disabled:opacity-40 uppercase font-black"
                           />
                        </div>
                      ))}
                   </div>
                </div>
              </div>
           </div>
        </div>

        {/* 📱 Seção 2: Matriz de Interação (Contatos) */}
        <div className="p-10 border border-[var(--border-primary)] bg-[var(--bg-primary)]/10 rounded-[3.5rem] glass space-y-8">
           <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-muted)]">Matriz de Interação</h3>
              <p className="text-[10px] text-[var(--text-muted)] italic">Preencha seus canais e escolha o que mostrar na rede.</p>
              
              <div className="space-y-3 pt-4">
                 {(Object.keys(data.contacts) as Array<keyof ProfessionalProfileData['contacts']>).map((key) => {
                   const item = data.contacts[key];
                   
                   const contactMap: Record<keyof ProfessionalProfileData['contacts'], { label: string, icon: LucideIcon }> = {
                     email: { label: 'E-mail', icon: Mail },
                     phone: { label: 'Telefone', icon: Phone },
                     whatsapp: { label: 'WhatsApp', icon: MessageSquare },
                     instagram: { label: 'Instagram', icon: Instagram },
                     linkedin: { label: 'LinkedIn', icon: Linkedin },
                     tiktok: { label: 'TikTok', icon: Music },
                     discord: { label: 'Discord', icon: MessageCircle },
                     site: { label: 'Site/URL', icon: Globe },
                   };

                   const Icon = contactMap[key].icon;
                   const label = contactMap[key].label;
                   
                   return (
                     <div key={key} className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                           <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-[var(--input-bg)] rounded-lg text-[var(--text-muted)]">
                              <Icon size={12} />
                           </div>
                           <input 
                              type="text"
                              disabled={!isEditing}
                              placeholder={label}
                              value={item.value}
                              onChange={(e) => updateContact(key, 'value', e.target.value)}
                              className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl pl-12 pr-4 py-4 text-xs text-[var(--text-primary)] focus:border-[var(--accent-start)] outline-none transition-all disabled:opacity-30"
                           />
                        </div>
                        <button 
                           onClick={() => updateContact(key, 'isPublic', !item.isPublic)}
                           disabled={!isEditing}
                           className={cn(
                             "px-4 py-4 rounded-2xl border transition-all flex items-center justify-center gap-3 w-full md:w-40",
                             item.isPublic 
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                              : "bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-muted)] grayscale"
                           )}
                        >
                           {item.isPublic ? <Eye size={14} /> : <EyeOff size={14} />}
                           <span className="text-[10px] font-black uppercase tracking-widest">{item.isPublic ? "Público" : "Oculto"}</span>
                        </button>
                     </div>
                   );
                 })}
              </div>
           </div>
        </div>

        {/* 💼 Seção 3: Carreira e Remuneração (Internal Only) */}
        <div className="p-10 border border-[var(--border-primary)] bg-[var(--input-bg)] rounded-[3.5rem] glass space-y-8 col-span-1 lg:col-span-2">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[var(--border-primary)]">
              <div className="space-y-1">
                 <h3 className="text-sm font-black uppercase tracking-widest text-[var(--accent-start)]">Regime e Remuneração (Internal)</h3>
                 <p className="text-[10px] text-[var(--text-muted)] italic">Estes dados alimentam a inteligência da BPlen e seu status no Banco de Talentos.</p>
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 flex items-center gap-2">
                 <ShieldCheck size={16} />
                 <span className="text-[9px] font-black uppercase tracking-widest">Confidencial</span>
              </div>
           </div>

           {/* Regime de Trabalho */}
           <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Regime Atual</label>
              <div className="flex flex-col sm:flex-row gap-2">
                {["CLT", "PJ", "Trabalho informal", "Não estou empregado"].map((opt) => (
                   <button 
                      key={opt}
                      disabled={!isEditing}
                      onClick={() => updateField('regime_choice', opt)}
                      className={cn(
                        "px-6 py-4 rounded-2xl border text-[11px] font-bold text-left transition-all flex-1",
                        data.regime_choice === opt 
                         ? "bg-[var(--accent-start)] border-[var(--accent-start)] text-white" 
                         : "bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--accent-soft)]"
                      )}
                   >
                      {opt}
                   </button>
                ))}
              </div>
           </div>

           {/* Pacote de Benefícios — Componente Rico da Survey */}
           <div className={cn("space-y-4", !isEditing && "opacity-60 pointer-events-none")}>
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Pacote e Benefícios</label>
              <BenefitsPackage
                options={[
                  "Salário", "Comissão", "Bônus", "PLR", "Previdência Privada", "VR/VA Flex", 
                  "VR", "VA", "VT", "Vale Combustível", "Estacionamento", 
                  "Seguro Médico", "Seguro Odontológico", "Seguro de Vida", 
                  "Dayoff", "Home Office", "Expectativa Salarial"
                ]}
                value={data.beneficios_pacote || {}}
                onChange={(val) => updateField('beneficios_pacote', val)}
              />
           </div>
        </div>

        {/* 📂 Seção 4: Carreira Profissional — Documentos, Links e Ativos */}
        <div className="p-10 border border-[var(--border-primary)] bg-[var(--input-bg)] rounded-[3.5rem] glass space-y-8 col-span-1 lg:col-span-2">
           <div className="space-y-1 pb-6 border-b border-[var(--border-primary)]">
              <h3 className="text-sm font-black uppercase tracking-widest text-[var(--accent-start)]">Carreira Profissional</h3>
              <p className="text-[10px] text-[var(--text-muted)] italic">Anexe seus documentos e compartilhe seus canais profissionais.</p>
           </div>
           
           {/* Upload de Documentos */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Currículo */}
             <div className="p-8 bg-[var(--bg-primary)]/40 rounded-[2.5rem] border border-[var(--border-primary)] flex flex-col gap-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <FileText size={20} className="text-[var(--accent-start)]" />
                      <span className="text-[11px] font-black uppercase tracking-tighter text-[var(--text-primary)]">Currículo (PDF)</span>
                   </div>
                   <button 
                      disabled={!isEditing}
                      onClick={() => updateField('cv_networking_visibility', !data.cv_networking_visibility)}
                      className={cn(
                         "px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                         data.cv_networking_visibility 
                           ? "bg-emerald-500 text-white" 
                           : "bg-[var(--input-bg)] border border-[var(--border-primary)] text-[var(--text-muted)]"
                      )}
                   >
                      {data.cv_networking_visibility ? <Eye size={10} /> : <EyeOff size={10} />}
                      Visível Network
                   </button>
                </div>
                <div className={cn(!isEditing && "opacity-60 pointer-events-none")}>
                  <FileField
                    id="cv_upload"
                    label="Currículo / Resumo Profissional"
                    type="CV"
                    matricula={data.matricula || ""}
                    value={data.cv_upload || null}
                    maxSizeMB={5}
                    onChange={(val) => updateField('cv_upload', val)}
                  />
                </div>
             </div>

             {/* Portfólio */}
             <div className="p-8 bg-[var(--bg-primary)]/40 rounded-[2.5rem] border border-[var(--border-primary)] flex flex-col gap-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Briefcase size={20} className="text-[var(--accent-start)]" />
                      <span className="text-[11px] font-black uppercase tracking-tighter text-[var(--text-primary)]">Portfólio / Projetos</span>
                   </div>
                   <button 
                      disabled={!isEditing}
                      onClick={() => updateField('portfolio_networking_visibility', !data.portfolio_networking_visibility)}
                      className={cn(
                         "px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                         data.portfolio_networking_visibility 
                           ? "bg-emerald-500 text-white" 
                           : "bg-[var(--input-bg)] border border-[var(--border-primary)] text-[var(--text-muted)]"
                      )}
                   >
                      {data.portfolio_networking_visibility ? <Eye size={10} /> : <EyeOff size={10} />}
                      Visível Network
                   </button>
                </div>
                <div className={cn(!isEditing && "opacity-60 pointer-events-none")}>
                  <FileField
                    id="portfolio_upload"
                    label="Apresentação de Portfólio"
                    type="Portfolio"
                    matricula={data.matricula || ""}
                    value={data.portfolio_upload || null}
                    maxSizeMB={20}
                    onChange={(val) => updateField('portfolio_upload', val)}
                  />
                </div>
             </div>
           </div>

           {/* Links Profissionais */}
           <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2">
                 <Link2 size={16} className="text-[var(--accent-start)]" />
                 <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Links Profissionais</label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputGlass
                  label="LinkedIn (URL)"
                  placeholder="linkedin.com/in/seu-perfil"
                  value={data.linkedin_url || ""}
                  onChange={(e) => updateField('linkedin_url', e.target.value)}
                  disabled={!isEditing}
                />
                <InputGlass
                  label="Instagram (URL)"
                  placeholder="@seunome"
                  value={data.instagram_url || ""}
                  onChange={(e) => updateField('instagram_url', e.target.value)}
                  disabled={!isEditing}
                />
                <InputGlass
                  label="Página Web Profissional"
                  placeholder="www.seusite.com.br"
                  value={data.web_url || ""}
                  onChange={(e) => updateField('web_url', e.target.value)}
                  disabled={!isEditing}
                />
                <InputGlass
                  label="Página de Portfólio (Behance, GitHub, etc)"
                  placeholder="behance.net/seu-perfil"
                  value={data.portfolio_url || ""}
                  onChange={(e) => updateField('portfolio_url', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
           </div>

           {/* Comentários sobre Carreira */}
           <div className="space-y-2">
              <TextareaGlass
                label="Comentários sobre sua carreira profissional"
                placeholder="Fale um pouco mais sobre sua trajetória..."
                value={data.comentarios_carreira || ""}
                onChange={(e) => updateField('comentarios_carreira', e.target.value)}
                rows={4}
                disabled={!isEditing}
              />
           </div>
        </div>


      </div>
    </div>
  );
}
