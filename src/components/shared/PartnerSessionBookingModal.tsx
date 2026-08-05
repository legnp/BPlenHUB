"use client";

import React, { useEffect, useMemo, useState } from "react";
import GlassModal from "@/components/ui/GlassModal";
import Calendar, { CalendarEvent } from "@/components/ui/Calendar";
import { getCalendarEventTypes } from "@/actions/calendar-event-types";
import { CalendarEventType } from "@/types/calendar-event-types";
import { eventServesAudience } from "@/lib/booking/session-demands";
import { Info } from "lucide-react";

/**
 * Agendamento de sessao do PARCEIRO.
 *
 * Diferenca essencial para o modal do membro: aqui nao ha carteira de creditos nem
 * penalidade — a sessao de parceria e' livre (decisao da Gestora). O que continua
 * valendo e' a janela de agendamento e a regra de cancelamento, aplicadas no servidor
 * pela mesma politica de sempre.
 *
 * A GRADE PODE SER A MESMA do membro e do funil publico (decisao da Gestora,
 * 2026-08-05): um tipo de evento serve quantas audiencias a configuracao disser, e o
 * horario e' disputado — quem agendar primeiro ocupa a vaga. O que nao se mistura e' a
 * lista de motivos: aqui aparece a do parceiro, configurada no proprio tipo.
 *
 * A oferta e' filtrada por AUDIENCIA do tipo, nunca por texto de titulo.
 */
export default function PartnerSessionBookingModal({
  isOpen,
  onClose,
  allEvents,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  allEvents: CalendarEvent[];
  onSuccess: () => void;
}) {
  const [types, setTypes] = useState<CalendarEventType[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    getCalendarEventTypes()
      .then((res) => {
        if (active) setTypes(res);
      })
      .catch((error) => {
        console.error("Erro ao carregar tipos de evento da agenda:", error);
      });
    return () => {
      active = false;
    };
  }, [isOpen]);

  const partnerEvents = useMemo(
    () => allEvents.filter((ev) => eventServesAudience(ev, types, "partner")),
    [allEvents, types]
  );

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Agendar Sessão de Parceria" maxWidth="max-w-4xl">
      <div className="space-y-6">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--input-bg)]/40 border border-[var(--border-primary)]">
          <Info size={16} className="text-[var(--accent-start)] mt-0.5 shrink-0" />
          <p className="text-[11px] font-medium text-[var(--text-secondary)] leading-relaxed">
            As sessões de parceria são livres: não consomem créditos. Os horários são os mesmos
            oferecidos às demais agendas, então quem confirmar primeiro garante a vaga. Escolha um
            horário disponível e informe o motivo do encontro para prepararmos a conversa.
          </p>
        </div>

        {partnerEvents.length === 0 ? (
          <div className="p-10 rounded-[2rem] border border-dashed border-[var(--border-primary)] text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Não há horários de parceria abertos no momento. Assim que novas datas forem
              publicadas, elas aparecem aqui.
            </p>
          </div>
        ) : (
          <Calendar
            events={partnerEvents}
            audience="partner"
            onBookingSuccess={() => {
              onSuccess();
              onClose();
            }}
          />
        )}
      </div>
    </GlassModal>
  );
}
