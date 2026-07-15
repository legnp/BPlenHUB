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
 * BPlen HUB — Networking
 * Espaco de conexoes entre membros, profissionais e parceiros.
 */
export default function NetworkingPage() {
  const [activeTab, setActiveTab] = useState<NetworkingTab>("membros");
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("Todos");
  const [data, setData] = useState<(NetworkingMember | PartnerData)[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Abas horizontais (rotulos encurtados no Pacote 6 — sem "BPlen" repetido)
  const tabs = [
    { id: "membros", label: "Membros", icon: Users },
    { id: "profissionais", label: "Profissionais", icon: Star },
    { id: "parceiros", label: "Parceiros", icon: Handshake },
  ];

  // Efeito de busca em tempo real (debounced)
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
    }, 400); // Debounce de 400ms

    return () => clearTimeout(delayDebounceFn);
  }, [activeTab, search, serviceFilter]);

  // Ramos de Atuação Únicos (Derivados dos Dados de Parceiros)
  const availableServices = useMemo(() => {
    if (activeTab !== "parceiros") return [];
    return Array.from(new Set((data as PartnerData[]).map((p) => p.serviceType))).filter(Boolean) as string[];
  }, [data, activeTab]);

  return (
    <div className="max-w-[1440px] mx-auto pt-[10px] px-6 md:px-12 pb-16 space-y-10 w-full animate-in fade-in duration-1000">
      
      {/* Header + barra de controle (abas ao lado da busca — Pacote 6) */}
      <div className="space-y-8">
        {/* Header — padrao canonico Gestao Funcional (F2-05) */}
        <FunctionalPageHeader
          eyebrow="Conexões de Valor"
          title="Networking"
          titleAccent="BPlen"
          backHref="/hub"
          backLabel="Voltar"
          icon={<Network size={24} />}
        />

        {/* Barra de controle unica: abas (esquerda) + busca (direita) */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
           {/* Abas */}
           <div className="flex p-1.5 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[1.75rem] glass shrink-0 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                        if (tab.id === activeTab) return;
                        // Limpa os dados da aba anterior para nao renderizar um shape
                        // diferente (parceiro x membro) enquanto o novo load ocorre.
                        setData([]);
                        setIsLoading(true);
                        setActiveTab(tab.id as NetworkingTab);
                        setSearch("");
                    }}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2.5 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap",
                      isActive
                        ? "bg-[var(--accent-start)] text-white shadow-lg"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <Icon size={14} className={cn(isActive && "animate-pulse")} />
                    {tab.label}
                  </button>
                )
              })}
           </div>

           {/* Busca (+ filtro de Ramos nos Parceiros) */}
           <div className="flex-1 w-full">
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
      </div>

      {/* Grid de resultados */}
      <div>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4 animate-pulse">
             <Loader2 size={40} className="text-[var(--accent-start)] animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Carregando Networking</p>
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

      {/* Aviso discreto de visibilidade (Pacote 6) */}
      <div className="flex items-center gap-3 px-5 py-3.5 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl glass">
         <Info size={16} className="text-[var(--accent-start)] shrink-0" />
         <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            <span className="font-black uppercase tracking-wide text-[10px] text-[var(--text-secondary)]">Autonomia de Visibilidade</span>
            <span className="mx-1.5 opacity-40">·</span>
            Seu perfil só aparece aqui se a visibilidade estiver ativada nas suas configurações — você controla o que fica visível para os demais membros.
         </p>
      </div>

    </div>
  );
}
