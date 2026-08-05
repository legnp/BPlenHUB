"use client";

import React, { useState, useEffect } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { getProgramacaoForMemberAction } from "@/actions/calendar";
import { ProgramacaoEntry } from "@/types/calendar";
import AgendaManagementView from "@/components/shared/AgendaManagementView";
import { FunctionalPageHeader } from "@/components/layout/FunctionalPageHeader";
import PartnerSessionBookingModal from "@/components/shared/PartnerSessionBookingModal";

/**
 * Gestao de Agenda do Parceiro — BPlen HUB
 *
 * Mesma estrutura da agenda do membro (reaproveita `AgendaManagementView`), com o
 * agendamento proprio: sessoes de parceria sao LIVRES — sem carteira de creditos e sem
 * penalidade. A janela de agendamento e a regra de cancelamento continuam sendo as
 * mesmas, aplicadas no servidor pela politica unica.
 *
 * A autorizacao e' o gate de servidor da subarvore /hub/partners.
 */
export default function PartnerGestaoAgendaPage() {
  const [events, setEvents] = useState<ProgramacaoEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await getProgramacaoForMemberAction("partner");
        setEvents(data);
      } catch (error) {
        console.error("Erro ao carregar programacao da agenda de parceria:", error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [refreshCounter]);

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <div className="max-w-[1440px] mx-auto pt-[10px] px-6 md:px-12 pb-16 space-y-10 flex-1 w-full">
        <FunctionalPageHeader
          eyebrow="Gestão e revisão da sua agenda de parceria"
          title="Gestão de Meus"
          titleAccent="Compromissos"
          backHref="/hub/partners"
          backLabel="Voltar"
          icon={<CalendarDays size={24} />}
          action={
            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="flex items-center gap-2.5 px-6 py-3.5 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:scale-[1.05] active:scale-[0.95] transition-all shadow-lg shadow-[var(--text-primary)]/10"
            >
              <Plus size={14} className="stroke-[3]" />
              Agendar Sessão
            </button>
          }
        />

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <AgendaManagementView
            events={events}
            isLoading={isLoading}
            refreshCounter={refreshCounter}
            setRefreshCounter={setRefreshCounter}
            hideCalendar={true}
            embedded={true}
          />
        </div>
      </div>

      <PartnerSessionBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        allEvents={events}
        onSuccess={() => setRefreshCounter((c) => c + 1)}
      />
    </div>
  );
}
