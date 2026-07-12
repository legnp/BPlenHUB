"use client";

import React, { useState } from "react";
import { UserCog, Briefcase, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { FunctionalPageHeader } from "@/components/layout/FunctionalPageHeader";

import { ProfileIdentityTab } from "@/components/hub/ProfileIdentityTab";
import { ProfileProfessionalTab } from "@/components/hub/ProfileProfessionalTab";
import { ProfileRegistrationTab } from "@/components/hub/ProfileRegistrationTab";

/**
 * BPlen HUB — Perfil & Configurações ⚙️🧬
 * Espaço para autogestão de identidade, pitch e visibilidade na rede.
 */
export default function ProfileSettingsPage() {
  const [activeTab, setActiveTab] = useState("geral");

  const tabs = [
    { id: "geral", label: "Geral", icon: UserCog },
    { id: "talento", label: "Perfil Profissional", icon: Briefcase },
    { id: "dados", label: "Dados Cadastrais", icon: Database },
  ];

  return (
    <div className="p-6 md:p-10 space-y-10 animate-fade-in max-w-7xl mx-auto">
      
      {/* Header — padrão canônico Gestão Funcional (F2-05) */}
      <FunctionalPageHeader
        eyebrow="Sua identidade e visibilidade no ecossistema BPlen"
        title="Perfil &"
        titleAccent="Configurações"
        backHref="/hub/membro"
        backLabel="Voltar"
        icon={<UserCog size={24} />}
      />

      {/* 🧭 Navegação por Abas Horizontal */}
      <div className="flex items-center gap-1 p-1 bg-[var(--input-bg)]/20 border border-[var(--border-primary)]/50 rounded-2xl w-fit overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
        {activeTab === "talento" && <ProfileProfessionalTab />}
        {activeTab === "dados" && <ProfileRegistrationTab />}
      </div>

    </div>
  );
}

