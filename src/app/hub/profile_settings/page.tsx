"use client";

import React, { useState } from "react";
import { UserCog, Briefcase, Database, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { FunctionalPageHeader } from "@/components/layout/FunctionalPageHeader";

import { ProfileIdentityTab } from "@/components/hub/ProfileIdentityTab";
import { ProfileProfessionalTab } from "@/components/hub/ProfileProfessionalTab";
import { ProfileRegistrationTab } from "@/components/hub/ProfileRegistrationTab";

/**
 * BPlen HUB — Perfil & Configurações
 * Espaço para autogestão de identidade, pitch e visibilidade na rede.
 */
export default function ProfileSettingsPage() {
  const [activeTab, setActiveTab] = useState("geral");
  // Guarda de alterações não salvas da aba Perfil Profissional (item 2.5)
  const [professionalDirty, setProfessionalDirty] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  const tabs = [
    { id: "geral", label: "Geral", icon: UserCog },
    { id: "talento", label: "Perfil Profissional", icon: Briefcase },
    { id: "dados", label: "Dados Cadastrais", icon: Database },
  ];

  const handleTabClick = (id: string) => {
    if (id === activeTab) return;
    // Se há edições não salvas no Perfil Profissional, avisa antes de trocar de aba.
    if (activeTab === "talento" && professionalDirty) {
      setPendingTab(id);
      return;
    }
    setActiveTab(id);
  };

  const confirmLeave = () => {
    if (!pendingTab) return;
    setProfessionalDirty(false);
    setActiveTab(pendingTab);
    setPendingTab(null);
  };

  return (
    <div className="max-w-[1440px] mx-auto pt-[10px] px-6 md:px-12 pb-16 space-y-10 w-full animate-fade-in">

      {/* Header — padrão canônico Gestão Funcional (F2-05) */}
      <FunctionalPageHeader
        eyebrow="Sua identidade profissional na BPlen"
        title="Perfil &"
        titleAccent="Configurações"
        backHref="/hub/membro"
        backLabel="Voltar"
        icon={<UserCog size={24} />}
      />

      {/* Navegação por Abas Horizontal */}
      <div className="flex items-center gap-1 p-1 bg-[var(--input-bg)]/20 border border-[var(--border-primary)]/50 rounded-2xl w-fit overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-500 text-[11px] font-black uppercase tracking-widest whitespace-nowrap",
                isActive
                  ? "bg-[var(--accent-start)] text-white shadow-lg shadow-[var(--accent-start)]/20 scale-105"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5"
              )}
            >
              <Icon size={14} className={cn(isActive ? "animate-pulse" : "opacity-50")} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Conteúdo Dinâmico por Aba */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-[400px]">
        {activeTab === "geral" && <ProfileIdentityTab />}
        {activeTab === "talento" && <ProfileProfessionalTab onDirtyChange={setProfessionalDirty} />}
        {activeTab === "dados" && <ProfileRegistrationTab />}
      </div>

      {/* Aviso de alterações não salvas ao trocar de aba (item 2.5) */}
      {pendingTab && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[2rem] shadow-2xl p-8 space-y-5 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-500 flex items-center justify-center">
              <AlertTriangle size={26} />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Alterações não salvas</h3>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Você editou campos no <strong className="text-[var(--text-secondary)]">Perfil Profissional</strong> e ainda não salvou. Clique em <strong className="text-[var(--text-secondary)]">Salvar</strong> na seção antes de sair — ou descarte as alterações.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setPendingTab(null)}
                className="flex-1 px-5 py-3 bg-[var(--accent-start)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
              >
                Continuar editando
              </button>
              <button
                onClick={confirmLeave}
                className="flex-1 px-5 py-3 glass text-[var(--text-muted)] border border-[var(--border-primary)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)] transition-all"
              >
                Descartar e sair
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
