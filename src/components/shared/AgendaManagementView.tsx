import React, { useState } from "react";
import Calendar, { CalendarEvent } from "@/components/ui/Calendar";
import UserBookings from "@/components/ui/UserBookings";
import { CalendarCheck, Plus } from "lucide-react";
import {
  getProgramacaoSummaryAction,
  getEventNpsDetailsAction
} from "@/actions/calendar";
import { EventLifecycleStatus } from "@/types/calendar";
import OneToOneBookingModal from "./OneToOneBookingModal";

interface AgendaManagementViewProps {
  events: CalendarEvent[];
  isLoading: boolean;
  refreshCounter: number;
  setRefreshCounter: React.Dispatch<React.SetStateAction<number>>;
  hideCalendar?: boolean;
}

/**
 * Shared Agenda Management View — BPlen HUB 🧬
 * Reused between Admin and Hub (Membro) to ensure visual and logic consistency.
 */
export default function AgendaManagementView({ 
  events, 
  isLoading, 
  refreshCounter, 
  setRefreshCounter,
  hideCalendar = false
}: AgendaManagementViewProps) {
  const [isOneToOneModalOpen, setIsOneToOneModalOpen] = useState(false);

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Calendário Principal */}
      {!hideCalendar && (
        <div className="bg-[var(--input-bg)] rounded-[2.5rem] p-4 border border-[var(--border-primary)] shadow-inner">
          <Calendar
            events={events}
            isLoading={isLoading} 
            onMonthChange={(date) => console.log("Mês alterado:", date)}
            onBookingSuccess={() => setRefreshCounter(p => p + 1)}
          />
        </div>
      )}

      {/* Meus Agendamentos (Módulo de Compromissos) */}
      <div className="bg-[var(--input-bg)] rounded-[2.5rem] p-8 border border-[var(--border-primary)] shadow-sm">
         <div className="flex items-center justify-between mb-8 ml-2">
            <div className="flex items-center gap-3 text-left">
               <div className="p-2.5 bg-[var(--accent-start)]/10 rounded-2xl text-[var(--accent-start)]">
                  <CalendarCheck className="w-5 h-5" />
               </div>
               <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">Gestão de Meus Compromissos</h2>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-40">Gestão e revisão da sua agenda BPlen</p>
               </div>
            </div>

            <button 
               onClick={() => setIsOneToOneModalOpen(true)}
               className="flex items-center gap-2.5 px-6 py-3.5 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:scale-[1.05] active:scale-[0.95] transition-all shadow-lg shadow-[var(--text-primary)]/10 group"
            >
               <Plus size={14} className="stroke-[3]" />
               Agendar 1 to 1
            </button>
         </div>
         <UserBookings refreshCounter={refreshCounter} />
      </div>

      {/* Modal Especializado de 1 to 1 */}
      <OneToOneBookingModal 
         isOpen={isOneToOneModalOpen}
         onClose={() => setIsOneToOneModalOpen(false)}
         allEvents={events}
         onSuccess={() => setRefreshCounter(p => p + 1)}
      />
    </div>
  );
}
