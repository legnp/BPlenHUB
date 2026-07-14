"use client";

import React, { useState, useEffect } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { getProgramacaoForMemberAction } from "@/actions/calendar";
import { ProgramacaoEntry } from "@/types/calendar";
import AgendaManagementView from "@/components/shared/AgendaManagementView";
import { FunctionalPageHeader } from "@/components/layout/FunctionalPageHeader";

/**
 * Gestão de Agenda do Membro — BPlen HUB 🧬
 * Estratégia de Máscara (Reuse de Componente Admin): Unifica a visão de compromissos.
 */
export default function GestaoAgendaPage() {
  const [events, setEvents] = useState<ProgramacaoEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isOneToOneModalOpen, setIsOneToOneModalOpen] = useState(false);

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
      <div className="max-w-[1440px] mx-auto pt-[10px] px-6 md:px-12 pb-16 space-y-10 flex-1 w-full">
        
        {/* Header de Navegação — padrão canônico Gestão Funcional (F2-05).
            O botão "Agendar 1 to 1" vive no slot de ação do header (à direita
            do título); o modal é controlado aqui e consumido pela shared view. */}
        <FunctionalPageHeader
          eyebrow="Gestão e revisão da sua agenda BPlen"
          title="Gestão de Meus"
          titleAccent="Compromissos"
          backHref="/hub/membro"
          backLabel="Voltar"
          icon={<CalendarDays size={24} />}
          action={
            <button
              onClick={() => setIsOneToOneModalOpen(true)}
              className="flex items-center gap-2.5 px-6 py-3.5 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:scale-[1.05] active:scale-[0.95] transition-all shadow-lg shadow-[var(--text-primary)]/10 group"
            >
              <Plus size={14} className="stroke-[3]" />
              Agendar 1 to 1
            </button>
          }
        />

        {/* ─── Shared View (Mascara, embutida) ─── */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
           <AgendaManagementView
              events={events}
              isLoading={isLoading}
              refreshCounter={refreshCounter}
              setRefreshCounter={setRefreshCounter}
              hideCalendar={true}
              embedded={true}
              isOneToOneModalOpen={isOneToOneModalOpen}
              onOneToOneModalOpenChange={setIsOneToOneModalOpen}
           />
        </div>

      </div>
    </div>
  );
}
