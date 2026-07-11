"use client";

import React, { useState, useEffect } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { CalendarDays } from "lucide-react";
import { getProgramacaoForMemberAction } from "@/actions/calendar";
import { ProgramacaoEntry } from "@/types/calendar";
import AgendaManagementView from "@/components/shared/AgendaManagementView";
import { FunctionalPageHeader } from "@/components/layout/FunctionalPageHeader";

/**
 * Gestão de Agenda do Membro — BPlen HUB 🧬
 * Estratégia de Máscara (Reuse de Componente Admin): Unifica a visão de compromissos.
 */
export default function GestaoAgendaPage() {
  const { user } = useAuthContext();
  const [events, setEvents] = useState<ProgramacaoEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Carregar dados iniciais dos eventos (Registry)
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await getProgramacaoForMemberAction();
        setEvents(data);
      } catch (error) {
        console.error("Erro ao carregar programação no Hub:", error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [refreshCounter]);

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <div className="max-w-[1400px] mx-auto pt-[10px] px-6 pb-6 md:pt-[10px] md:px-12 md:pb-12 space-y-12 flex-1 w-full">
        
        {/* Header de Navegação — padrão canônico Gestão Funcional (F2-05) */}
        <FunctionalPageHeader
          eyebrow="Compromissos e programação"
          title="Minha"
          titleAccent="Agenda"
          backHref="/hub/membro"
          backLabel="Voltar ao Dashboard"
          icon={<CalendarDays size={24} />}
        />

        {/* ─── Shared View (Mascara) ─── */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
           <AgendaManagementView 
              events={events} 
              isLoading={isLoading} 
              refreshCounter={refreshCounter} 
              setRefreshCounter={setRefreshCounter}
              hideCalendar={true}
           />
        </div>

      </div>
    </div>
  );
}
