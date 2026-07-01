"use client";

import React, { useState, useEffect } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getProgramacaoForMemberAction } from "@/actions/calendar";
import { ProgramacaoEntry } from "@/types/calendar";
import AgendaManagementView from "@/components/shared/AgendaManagementView";

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
        
        {/* Header de Navegação */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
           <div className="space-y-4">
              <Link 
                href="/hub/membro"
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group"
              >
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                  Voltar ao Dashboard
              </Link>
           </div>
        </header>

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
