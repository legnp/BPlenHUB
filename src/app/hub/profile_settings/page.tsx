"use client";

import React, { useState } from "react";
import { UserCog, ArrowLeft, Briefcase, Database } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
      
      {/* Header da Página */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Link 
            href="/hub/membro"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--accent-start)] hover:opacity-70 transition-all"
          >
            <ArrowLeft size={14} />
            Voltar
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-4 bg-[var(--accent-soft)] rounded-3xl text-[var(--accent-start)]">
              <UserCog size={32} />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tighter text-[var(--text-primary)]">
                Perfil & Configurações
              </h1>
              <p className="text-[12px] font-medium text-[var(--text-muted)] opacity-70 uppercase tracking-[0.1em]">
                Gerencie sua identidade e visibilidade no ecossistema BPlen
              </p>
            </div>
          </div>
        </div>
      </div>

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

