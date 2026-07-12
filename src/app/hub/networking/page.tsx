"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Users, 
  Star, 
  Handshake, 
  Loader2, 
  Network,
  Rocket,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NetworkingCard } from "@/components/hub/NetworkingCard";
import { NetworkingFilters } from "@/components/hub/NetworkingFilters";
import { getNetworkingDataAction, NetworkingMember, NetworkingTab } from "@/actions/networking";
import { PartnerData } from "@/actions/admin/partners";
import { FunctionalPageHeader } from "@/components/layout/FunctionalPageHeader";

/**
 * BPlen HUB — Networking Space 🌐🚀✨
 * Onde conexões se transformam em performance organizacional.
 */
export default function NetworkingPage() {
  const [activeTab, setActiveTab] = useState<NetworkingTab>("membros");
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("Todos");
  const [data, setData] = useState<(NetworkingMember | PartnerData)[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Abas Horizontais Estilo Profile 🦴
  const tabs = [
    { id: "membros", label: "Networking BPlen", icon: Users },
    { id: "profissionais", label: "Profissionais BPlen", icon: Star },
    { id: "parceiros", label: "Parceiros BPlen", icon: Handshake },
  ];

  // 1. Efeito de Busca Real-time 🛰️
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const res = await getNetworkingDataAction(activeTab, search, serviceFilter);
      if (res.success) {
        setData(res.data || []);
      }
      setIsLoading(false);
    }

    const delayDebounceFn = setTimeout(() => {
      load();
    }, 400); // Debounce de 400ms para performance soberana

    return () => clearTimeout(delayDebounceFn);
  }, [activeTab, search, serviceFilter]);

  // Ramos de Atuação Únicos (Derivados dos Dados de Parceiros)
  const availableServices = useMemo(() => {
    if (activeTab !== "parceiros") return [];
    return Array.from(new Set((data as PartnerData[]).map((p) => p.serviceType))).filter(Boolean) as string[];
  }, [data, activeTab]);

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24 animate-in fade-in duration-1000">
      
      {/* 🔮 Hero Section & Tabs */}
      <div className="space-y-10 px-4">
        {/* Header — padrão canônico Gestão Funcional (F2-05) */}
        <FunctionalPageHeader
          eyebrow="Conexões Soberanas"
          title="Ecossistema"
          titleAccent="BPlen"
          backHref="/hub"
          backLabel="Voltar"
          icon={<Network size={24} />}
        />

        {/* Navigation Tabs */}
        <div className="flex justify-center md:justify-start">
           <div className="flex p-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[2.5rem] glass">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                        setActiveTab(tab.id as NetworkingTab);
                        setSearch("");
                    }}
                    className={cn(
                      "flex items-center gap-3 px-6 py-3 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap",
                      isActive
                        ? "bg-[var(--accent-start)] text-white shadow-xl scale-105"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <Icon size={14} className={cn(isActive && "animate-pulse")} />
                    {tab.label}
                  </button>
                )
              })}
           </div>
        </div>

        {/* 🔍 Centro de Filtros */}
        <div className="bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[3.5rem] p-8 glass space-y-6">
           <NetworkingFilters
              tab={activeTab}
              search={search}
              setSearch={setSearch}
              serviceFilter={serviceFilter}
              setServiceFilter={setServiceFilter}
              availableServices={availableServices}
           />
        </div>
      </div>

      {/* 🚀 Grid de Resultados */}
      <div className="px-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4 animate-pulse">
             <Loader2 size={40} className="text-[var(--accent-start)] animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Mapeando conexões estratégicas...</p>
          </div>
        ) : data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
             {data.map((item, idx) => (
                <div key={item.id} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 50}ms` }}>
                   <NetworkingCard 
                      type={activeTab === "parceiros" ? "partner" : "member"}
                      data={item}
                   />
                </div>
             ))}
          </div>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center text-center space-y-6 bg-[var(--input-bg)] border border-dashed border-[var(--border-primary)] rounded-[4rem]">
             <div className="p-6 bg-[var(--input-bg)] rounded-full text-[var(--text-muted)]">
                <Rocket size={48} />
             </div>
             <div className="space-y-2">
                <h3 className="text-xl font-black text-[var(--text-primary)]">Nenhum resultado encontrado</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] max-w-xs mx-auto">
                   Tente ajustar seus filtros ou termos de busca para encontrar novas conexões.
                </p>
             </div>
          </div>
        )}
      </div>

      {/* 💡 Banner Informativo */}
      <div className="px-4">
         <div className="p-10 bg-gradient-to-br from-[var(--accent-start)]/20 to-transparent border border-[var(--accent-start)]/20 rounded-[4rem] glass flex flex-col md:flex-row items-center gap-10">
            <div className="p-6 bg-[var(--accent-start)] rounded-[2.5rem] text-white shadow-2xl shadow-[var(--accent-start)]/20">
               <Info size={40} />
            </div>
            <div className="space-y-3 text-center md:text-left flex-1">
               <h4 className="text-lg font-black text-[var(--text-primary)] tracking-tight uppercase">Soberania & Visibilidade</h4>
               <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-2xl">
                  Seu perfil só aparece no networking se a visibilidade estiver habilitada nas configurações. No BPlen HUB, você tem autonomia total sobre quem pode visualizar seu Pitch e hashtags profissionais.
               </p>
            </div>
         </div>
      </div>

    </div>
  );
}
