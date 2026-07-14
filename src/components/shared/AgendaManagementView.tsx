import React, { useState } from "react";
import Calendar, { CalendarEvent } from "@/components/ui/Calendar";
import UserBookings from "@/components/ui/UserBookings";
import { CalendarCheck, Plus } from "lucide-react";
import OneToOneBookingModal from "./OneToOneBookingModal";

interface AgendaManagementViewProps {
  events: CalendarEvent[];
  isLoading: boolean;
  refreshCounter: number;
  setRefreshCounter: React.Dispatch<React.SetStateAction<number>>;
  hideCalendar?: boolean;
  /**
   * Modo "embutido" numa página que já provê o próprio cabeçalho
   * (ex.: gestao_agenda com FunctionalPageHeader). Quando true:
   * - omite o cabeçalho interno "Meus Agendamentos" (evita título duplicado);
   * - achata o wrapper-cartão da lista (sem box-in-box);
   * - NÃO renderiza o botão "Agendar 1 to 1" aqui (vive no header da página),
   *   e o estado de abertura do modal 1-to-1 é controlado pelo pai.
   * O uso do admin não passa esta prop — permanece idêntico.
   */
  embedded?: boolean;
  /** Estado de abertura do modal 1-to-1 quando controlado pelo pai (embedded). */
  isOneToOneModalOpen?: boolean;
  /** Callback do pai para abrir/fechar o modal 1-to-1 (embedded). */
  onOneToOneModalOpenChange?: (open: boolean) => void;
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
  hideCalendar = false,
  embedded = false,
  isOneToOneModalOpen,
  onOneToOneModalOpenChange
}: AgendaManagementViewProps) {
  const [internalModalOpen, setInternalModalOpen] = useState(false);

  // Quando embutido, o pai controla o modal (o botão vive no header da página);
  // caso contrário (admin), o estado é interno — comportamento inalterado.
  const isControlled = embedded && typeof onOneToOneModalOpenChange === "function";
  const modalOpen = isControlled ? !!isOneToOneModalOpen : internalModalOpen;
  const setModalOpen = (open: boolean) => {
    if (isControlled) onOneToOneModalOpenChange!(open);
    else setInternalModalOpen(open);
  };

  return (
    <div className={embedded ? "animate-in fade-in duration-500" : "space-y-12 animate-in fade-in duration-500"}>
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
      <div className={embedded ? "" : "bg-[var(--input-bg)] rounded-[2.5rem] p-8 border border-[var(--border-primary)] shadow-sm"}>
         {!embedded && (
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
                  onClick={() => setModalOpen(true)}
                  className="flex items-center gap-2.5 px-6 py-3.5 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:scale-[1.05] active:scale-[0.95] transition-all shadow-lg shadow-[var(--text-primary)]/10 group"
               >
                  <Plus size={14} className="stroke-[3]" />
                  Agendar 1 to 1
               </button>
            </div>
         )}
         <UserBookings refreshCounter={refreshCounter} />
      </div>

      {/* Modal Especializado de 1 to 1 */}
      <OneToOneBookingModal
         isOpen={modalOpen}
         onClose={() => setModalOpen(false)}
         allEvents={events}
         onSuccess={() => setRefreshCounter(p => p + 1)}
      />
    </div>
  );
}
