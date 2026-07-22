"use client";

import React, { useState, useEffect } from "react";
import { getSyncedEvents } from "@/actions/calendar";
import { GoogleCalendarEvent } from "@/types/calendar";
import {
  Calendar as CalendarIcon,
  LayoutList
} from "lucide-react";
import { FunctionalPageHeader } from "@/components/layout/FunctionalPageHeader";

// Sub-módulos (Abas)
import ProgramacaoResumo from "@/components/admin/ProgramacaoResumo";
import AgendaManagementView from "@/components/shared/AgendaManagementView";

type TabId = "resumo" | "agenda";

export default function GestaoAgendaPage() {
  const [activeTab, setActiveTab] = useState<TabId>("resumo");
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Carregar dados iniciais dos eventos sincronizados (para Agenda)
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await getSyncedEvents();
        setEvents(data);
      } catch (error) {
        console.error("Erro ao carregar prévia do calendário:", error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [refreshCounter]);

  const tabs = [
    { id: "resumo", label: "Gestão de Programação", icon: LayoutList },
    { id: "agenda", label: "Gestão de Agenda", icon: CalendarIcon },
  ];

  return (
    <div className="space-y-8">
      <FunctionalPageHeader
        eyebrow="Jornada e Agenda"
        title="Programação"
        titleAccent="da Jornada"
        icon={<LayoutList size={24} />}
        action={
          <div className="flex p-1.5 bg-[var(--input-bg)]/50 backdrop-blur-md rounded-[2rem] border border-[var(--border-primary)] shadow-sm">
             {tabs.map((tab) => {
               const Icon = tab.icon;
               const isSelected = activeTab === tab.id;
               return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabId)}
                    className={`flex items-center gap-2.5 px-6 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${isSelected ? "bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-lg shadow-[var(--text-primary)]/10" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-60 hover:opacity-100"}`}
                  >
                    <Icon size={14} className={isSelected ? "stroke-[3]" : "stroke-[2.5]"} />
                    {tab.label}
                  </button>
               );
             })}
          </div>
        }
      />

      {/* Main Content Area */}
      <div className="min-h-[600px]">
        {activeTab === "resumo" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <ProgramacaoResumo />
          </div>
        )}

        {activeTab === "agenda" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <AgendaManagementView 
                events={events} 
                isLoading={isLoading} 
                refreshCounter={refreshCounter} 
                setRefreshCounter={setRefreshCounter}
             />
          </div>
        )}
      </div>
    </div>
  );
}
