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
  Link2,
  Users,
  UserSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getProfessionalProfileAction,
  updateProfessionalProfileAction,
  updateTalentBankParticipationAction,
  ProfessionalProfileData,
  ContactItem
} from "@/actions/profile-professional";
import { BenefitsPackage } from "@/components/forms/SurveyFields/BenefitsPackage";
import { FileField } from "@/components/forms/SurveyFields/FileField";
import { InputGlass } from "@/components/ui/InputGlass";
import { TextareaGlass } from "@/components/ui/TextareaGlass";

type SectionKey = "networking" | "historico" | "remuneracao";

/**
 * Rótulo de seção discreto (rótulo em caixa alta + linha fina), no mesmo padrão
 * da separação de seções da Gestão de Carreira. `action` recebe o botão de
 * editar/salvar da seção (item 2.5 — edição por seção).
 */
function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] shrink-0">
        {children}
      </span>
      <div className="h-px flex-1 bg-[var(--border-primary)]/40" />
      {action}
    </div>
  );
}

/**
 * BPlen HUB — ProfileProfessionalTab
 * Gestão de carreira, networking e remuneração (dados internos).
 * Edição por seção (2.5): cada seção habilita/salva de forma independente, e um
 * guarda de "alterações não salvas" (beforeunload + aviso na troca de aba, via
 * `onDirtyChange` para a página) evita perder edições.
 */
export function ProfileProfessionalTab({ onDirtyChange }: { onDirtyChange?: (dirty: boolean) => void }) {
  const [editing, setEditing] = useState<Record<SectionKey, boolean>>({
    networking: false,
    historico: false,
    remuneracao: false
  });
  const [savingSection, setSavingSection] = useState<SectionKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingTalent, setIsTogglingTalent] = useState(false);
  const [data, setData] = useState<ProfessionalProfileData | null>(null);
  const [baseline, setBaseline] = useState<ProfessionalProfileData | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // 1. Carregamento Inicial
  useEffect(() => {
    async function load() {
      const res = await getProfessionalProfileAction();
      if (res.success && res.data) {
        setData(res.data);
        setBaseline(res.data);
      }
      setIsLoading(false);
    }
    load();
  }, []);

  // Dirty = alguma edição pendente (comparação com o baseline salvo).
  const isDirty = !!(data && baseline && JSON.stringify(data) !== JSON.stringify(baseline));

  // Reporta o estado para a página (guarda de troca de aba).
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Guarda de fechamento/reload do navegador.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // 2. Manipulação de Mudanças
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

  // 3. Salvamento por seção (persiste o perfil e reseta o baseline).
  const handleSaveSection = async (section: SectionKey) => {
    if (!data) return;
    setSavingSection(section);
    setMessage(null);

    const res = await updateProfessionalProfileAction(data);
    if (res.success) {
      setBaseline(data);
      setEditing((prev) => ({ ...prev, [section]: false }));
      setMessage({ type: 'success', text: "Seção salva com sucesso!" });
    } else {
      setMessage({ type: 'error', text: "Falha ao salvar. Tente novamente." });
    }
    setSavingSection(null);
    setTimeout(() => setMessage(null), 5000);
  };

  // 4. Banco de Talentos — toggle independente (grava na hora, fora do modo edição)
  const handleToggleTalentBank = async () => {
    if (!data || isTogglingTalent) return;
    const next = !data.participation_talent_bank;
    setData({ ...data, participation_talent_bank: next });
    setIsTogglingTalent(true);
    const res = await updateTalentBankParticipationAction(next);
    if (res.success) {
      // Mantém o baseline em sincronia para não marcar a aba como "não salva".
      setBaseline((prev) => prev ? { ...prev, participation_talent_bank: next } : prev);
    } else {
      setData((prev) => prev ? { ...prev, participation_talent_bank: !next } : prev);
      setMessage({ type: 'error', text: "Falha ao atualizar o Banco de Talentos." });
      setTimeout(() => setMessage(null), 5000);
    }
    setIsTogglingTalent(false);
  };

  // Botão editar/salvar por seção (função de render — não é um componente,
  // para não recriar tipo a cada render / react-hooks/static-components).
  const renderSectionEditButton = (section: SectionKey) => {
    const isSaving = savingSection === section;
    return editing[section] ? (
      <button
        onClick={() => handleSaveSection(section)}
        disabled={isSaving}
        className="shrink-0 px-4 py-2 bg-[var(--accent-start)] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-60"
      >
        {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
        Salvar
      </button>
    ) : (
      <button
        onClick={() => setEditing((prev) => ({ ...prev, [section]: true }))}
        className="shrink-0 px-4 py-2 glass text-[var(--text-primary)] border border-[var(--border-primary)] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[var(--input-bg)] transition-all flex items-center gap-1.5"
      >
        <Edit3 size={12} />
        Editar
      </button>
    );
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

  const editNet = editing.networking;
  const editHist = editing.historico;
  const editRem = editing.remuneracao;

  return (
    <div className="max-w-5xl space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Aviso de privacidade discreto (item 2.1) */}
      <div className="flex items-start gap-3 px-5 py-3.5 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl glass">
        <ShieldCheck size={16} className="text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          <span className="font-black uppercase tracking-wide text-[10px] text-[var(--text-secondary)]">Segurança da sua Privacidade</span>
          <span className="mx-1.5 opacity-40">·</span>
          Dados profissionais (remuneração, regime, benefícios) são usados{" "}
          <strong className="font-black text-[var(--text-secondary)]">exclusivamente</strong> para processos internos da BPlen e{" "}
          <strong className="font-black text-[var(--text-secondary)]">nunca</strong> ficam visíveis para outros membros ou na página de networking.
        </p>
      </div>

      {/* Cabeçalho da aba: título + toggle Banco de Talentos (item 2.7) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div className="space-y-1">
          <h2 className="text-xl font-black tracking-tight text-[var(--text-primary)]">Perfil Profissional</h2>
          <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-widest opacity-60">Gestão de Carreira e Networking</p>
        </div>

        {/* Banco de Talentos — toggle direto (item 2.7) */}
        <button
          onClick={handleToggleTalentBank}
          disabled={isTogglingTalent}
          className={cn(
            "flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all disabled:opacity-60 self-start md:self-auto",
            data.participation_talent_bank
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-500"
              : "bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-muted)]"
          )}
          title="Participar do Banco de Talentos da BPlen"
        >
          <Users size={14} />
          <span className="text-left leading-tight">
            <span className="block text-[9px] font-black uppercase tracking-widest">Banco de Talentos</span>
            <span className="block text-[8px] font-bold opacity-70">{data.participation_talent_bank ? "Participando" : "Não participa"}</span>
          </span>
          <span className={cn("relative w-9 h-5 rounded-full transition-all shrink-0", data.participation_talent_bank ? "bg-emerald-500" : "bg-[var(--border-primary)]")}>
            <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all", data.participation_talent_bank ? "left-[18px]" : "left-0.5")} />
          </span>
        </button>
      </div>

      {/* Feedback de Status */}
      {message && (
        <div className={cn(
          "px-8 py-4 rounded-3xl text-[11px] font-bold flex items-center gap-3 animate-in slide-in-from-top-2 duration-500",
          message.type === 'success' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
        )}>
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* ===== SEÇÃO: NETWORKING ===== */}
      <section className="space-y-5">
        <SectionLabel action={renderSectionEditButton("networking")}>Networking</SectionLabel>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* Networking BPlen */}
          <div className="p-6 border border-[var(--border-primary)] bg-[var(--input-bg)] rounded-[2rem] glass space-y-5">
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--accent-start)]">Networking BPlen</h3>

            {/* Nome para exibição (item 2.9) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Nome para exibição</label>
              <div className="relative">
                <UserSquare size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  disabled={!editNet}
                  value={data.display_name}
                  onChange={(e) => updateField('display_name', e.target.value)}
                  placeholder="Como seu nome aparece no card de Networking"
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl pl-9 pr-3 py-2.5 text-[11px] text-[var(--text-primary)] focus:border-[var(--accent-start)]/40 outline-none transition-all disabled:opacity-40"
                />
              </div>
              <p className="text-[8px] text-[var(--text-muted)] italic">Se vazio, usamos seu nome completo dos Dados Cadastrais.</p>
            </div>

            {/* Visibilidade na Rede */}
            <div className="flex items-center justify-between p-3 bg-[var(--bg-primary)]/40 rounded-xl border border-[var(--border-primary)]">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase text-[var(--text-primary)]">Visibilidade na Rede</span>
                <p className="text-[8px] text-[var(--text-muted)] italic">Aparecer para outros membros nas buscas</p>
              </div>
              <button
                onClick={() => updateField('networking_visibility', !data.networking_visibility)}
                disabled={!editNet}
                className={cn("relative w-10 h-5 rounded-full transition-all shrink-0 disabled:opacity-40", data.networking_visibility ? "bg-[var(--accent-start)]" : "bg-[var(--border-primary)]")}
              >
                <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all", data.networking_visibility ? "left-[22px]" : "left-0.5")} />
              </button>
            </div>

            {/* Sales Pitch */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Elevator Pitch</label>
              <textarea
                rows={3}
                disabled={!editNet}
                value={data.sales_pitch}
                onChange={(e) => updateField('sales_pitch', e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl p-3.5 text-[11px] text-[var(--text-primary)] placeholder:italic focus:border-[var(--accent-start)]/40 focus:outline-none transition-all disabled:opacity-40"
                placeholder="Sua proposta de valor em poucas palavras..."
              />
            </div>

            {/* Hashtags */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Palavras-Chave (Hashtags)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {data.hashtags.map((tag, idx) => (
                  <div key={idx} className="relative group">
                    <Hash size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent-start)] transition-colors" />
                    <input
                      type="text"
                      disabled={!editNet}
                      placeholder={`Tag ${idx + 1}`}
                      value={tag}
                      onChange={(e) => updateHashtag(idx, e.target.value)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-lg pl-8 pr-3 py-2 text-[10px] text-[var(--text-primary)] focus:border-[var(--accent-start)]/30 outline-none transition-all disabled:opacity-40 uppercase font-black"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contatos para Networking (item 2.10 a/b + 2.8) */}
          <div className="p-6 border border-[var(--border-primary)] bg-[var(--bg-primary)]/10 rounded-[2rem] glass space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-muted)]">Contatos para Networking</h3>
              <p className="text-[10px] text-[var(--text-muted)] italic">Configure seus canais de contato para a página de Networking.</p>
            </div>

            <div className="space-y-2 pt-1">
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
                  <div key={key} className="flex gap-2">
                    <div className="flex-1 relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                        <Icon size={13} />
                      </div>
                      <input
                        type="text"
                        disabled={!editNet}
                        placeholder={label}
                        value={item.value}
                        onChange={(e) => updateContact(key, 'value', e.target.value)}
                        className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl pl-9 pr-3 py-2.5 text-[11px] text-[var(--text-primary)] focus:border-[var(--accent-start)] outline-none transition-all disabled:opacity-30"
                      />
                    </div>
                    <button
                      onClick={() => updateContact(key, 'isPublic', !item.isPublic)}
                      disabled={!editNet}
                      className={cn(
                        "px-3 py-2.5 rounded-xl border transition-all flex items-center justify-center gap-1.5 w-24 shrink-0 disabled:opacity-40",
                        item.isPublic
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-[var(--input-bg)] border-[var(--border-primary)] text-[var(--text-muted)]"
                      )}
                    >
                      {item.isPublic ? <Eye size={12} /> : <EyeOff size={12} />}
                      <span className="text-[9px] font-black uppercase tracking-widest">{item.isPublic ? "Público" : "Oculto"}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* ===== SEÇÃO: HISTÓRICO PROFISSIONAL ===== */}
      <section className="space-y-5">
        <SectionLabel action={renderSectionEditButton("historico")}>Histórico Profissional</SectionLabel>

        <div className="p-6 border border-[var(--border-primary)] bg-[var(--input-bg)] rounded-[2rem] glass space-y-6">
          <div className="space-y-1 pb-5 border-b border-[var(--border-primary)]">
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--accent-start)]">Carreira Profissional</h3>
            <p className="text-[10px] text-[var(--text-muted)] italic">Anexe seus documentos e compartilhe seus canais profissionais.</p>
          </div>

          {/* Upload de Documentos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Currículo */}
            <div className="p-6 bg-[var(--bg-primary)]/40 rounded-[1.75rem] border border-[var(--border-primary)] flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-[var(--accent-start)]" />
                  <span className="text-[11px] font-black uppercase tracking-tighter text-[var(--text-primary)]">Currículo (PDF)</span>
                </div>
                <button
                  disabled={!editHist}
                  onClick={() => updateField('cv_networking_visibility', !data.cv_networking_visibility)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 disabled:opacity-40",
                    data.cv_networking_visibility
                      ? "bg-emerald-500 text-white"
                      : "bg-[var(--input-bg)] border border-[var(--border-primary)] text-[var(--text-muted)]"
                  )}
                >
                  {data.cv_networking_visibility ? <Eye size={10} /> : <EyeOff size={10} />}
                  Visível Network
                </button>
              </div>
              <div className={cn(!editHist && "opacity-60 pointer-events-none")}>
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
            <div className="p-6 bg-[var(--bg-primary)]/40 rounded-[1.75rem] border border-[var(--border-primary)] flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Briefcase size={18} className="text-[var(--accent-start)]" />
                  <span className="text-[11px] font-black uppercase tracking-tighter text-[var(--text-primary)]">Portfólio / Projetos</span>
                </div>
                <button
                  disabled={!editHist}
                  onClick={() => updateField('portfolio_networking_visibility', !data.portfolio_networking_visibility)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 disabled:opacity-40",
                    data.portfolio_networking_visibility
                      ? "bg-emerald-500 text-white"
                      : "bg-[var(--input-bg)] border border-[var(--border-primary)] text-[var(--text-muted)]"
                  )}
                >
                  {data.portfolio_networking_visibility ? <Eye size={10} /> : <EyeOff size={10} />}
                  Visível Network
                </button>
              </div>
              <div className={cn(!editHist && "opacity-60 pointer-events-none")}>
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
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <Link2 size={15} className="text-[var(--accent-start)]" />
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Links Profissionais</label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputGlass
                label="LinkedIn (URL)"
                placeholder="linkedin.com/in/seu-perfil"
                value={data.linkedin_url || ""}
                onChange={(e) => updateField('linkedin_url', e.target.value)}
                disabled={!editHist}
              />
              <InputGlass
                label="Instagram (URL)"
                placeholder="@seunome"
                value={data.instagram_url || ""}
                onChange={(e) => updateField('instagram_url', e.target.value)}
                disabled={!editHist}
              />
              <InputGlass
                label="Página Web Profissional"
                placeholder="www.seusite.com.br"
                value={data.web_url || ""}
                onChange={(e) => updateField('web_url', e.target.value)}
                disabled={!editHist}
              />
              <InputGlass
                label="Página de Portfólio (Behance, GitHub, etc)"
                placeholder="behance.net/seu-perfil"
                value={data.portfolio_url || ""}
                onChange={(e) => updateField('portfolio_url', e.target.value)}
                disabled={!editHist}
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
              disabled={!editHist}
            />
          </div>
        </div>
      </section>

      {/* ===== SEÇÃO: REMUNERAÇÃO TOTAL ===== */}
      <section className="space-y-5">
        <SectionLabel action={renderSectionEditButton("remuneracao")}>Remuneração Total</SectionLabel>

        <div className="p-6 border border-[var(--border-primary)] bg-[var(--input-bg)] rounded-[2rem] glass space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b border-[var(--border-primary)]">
            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase tracking-widest text-[var(--accent-start)]">Estado do pacote de remuneração atual</h3>
              <p className="text-[10px] text-[var(--text-muted)] italic">Descreva o seu pacote de remuneração atual ou do último trabalho.</p>
              <p className="text-[10px] font-bold text-[var(--accent-start)]">Esses dados ajudam a BPlen a otimizar a seleção de oportunidades para você.</p>
            </div>
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 flex items-center gap-2 shrink-0 self-start">
              <ShieldCheck size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Confidencial</span>
            </div>
          </div>

          {/* Regime de Trabalho */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Regime Atual</label>
            <div className="flex flex-col sm:flex-row gap-2">
              {["CLT", "PJ", "Trabalho informal", "Não estou empregado"].map((opt) => (
                <button
                  key={opt}
                  disabled={!editRem}
                  onClick={() => updateField('regime_choice', opt)}
                  className={cn(
                    "px-4 py-3 rounded-xl border text-[11px] font-bold text-left transition-all flex-1 disabled:opacity-60",
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
          <div className={cn("space-y-3", !editRem && "opacity-60 pointer-events-none")}>
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
      </section>

    </div>
  );
}
