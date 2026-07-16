"use client";

import React, { useState, useEffect, useMemo } from "react";
import GlassModal from "@/components/ui/GlassModal";
import Calendar, { CalendarEvent } from "@/components/ui/Calendar";
import { getMemberQuotasAction } from "@/actions/quotas";
import { useAuthContext } from "@/context/AuthContext";
import { CALENDAR_CONFIG } from "@/config/calendarConfig";
import { Loader2, Briefcase, Info } from "lucide-react";

interface OneToOneBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  allEvents: CalendarEvent[];
  onSuccess: () => void;
}

/**
 * One-to-One Booking Modal — BPlen HUB 🧬
 * Includes visual quota tracking (dots) and filtered calendar.
 */
export default function OneToOneBookingModal({ 
  isOpen, 
  onClose, 
  allEvents,
  onSuccess 
}: OneToOneBookingModalProps) {
  const { user } = useAuthContext();
  const [quotas, setQuotas] = useState<{ total: number; used: number } | null>(null);
  const [isLoadingQuotas, setIsLoadingQuotas] = useState(true);

  // 1. Filtrar eventos para apenas 1-to-1
  const oneToOneEvents = useMemo(() => {
    return allEvents.filter(ev => 
      ev.summary.toLowerCase().includes("1 to 1") || 
      ev.summary.toLowerCase().includes("1-to-1")
    );
  }, [allEvents]);

  // 2. Buscar cotas do membro
  useEffect(() => {
    if (!isOpen || !user?.uid) return;

    async function loadQuotas() {
      setIsLoadingQuotas(true);
      try {
        // Agora usamos a Action que resolve o caminho hierárquico
        const wallet = await getMemberQuotasAction(user!.uid);
        if (wallet && wallet.quotas) {
          // Busca estrita pela chave normalizada
          const q = wallet.quotas["1-to-1"];
          if (q) {
             setQuotas({ total: q.total, used: q.used });
          } else {
             setQuotas(null);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar cotas:", error);
      } finally {
        setIsLoadingQuotas(false);
      }
    }
    loadQuotas();
  }, [isOpen, user]);

  return (
    <GlassModal
       isOpen={isOpen}
       onClose={onClose}
       title="Agendamento 1 to 1"
       subtitle="Consultoria individual de Gestão e Desenvolvimento de Carreira"
       maxWidth="max-w-5xl"
    >
      <div className="space-y-5 py-1">

        {/* Banner de Créditos (Bolinhas) */}
        <div className="p-4 bg-[var(--input-bg)]/50 border border-[var(--border-primary)] rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[var(--accent-start)]/10 rounded-xl text-[var(--accent-start)]">
                 <Briefcase size={18} />
              </div>
              <div className="text-left">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] leading-none mb-1">Créditos de Consultoria</h4>
                 <p className="text-sm font-black text-[var(--text-primary)]">Sessões 1 to 1 Contratadas</p>
              </div>
           </div>

           <div className="flex flex-col items-center md:items-end gap-2 px-2">
              {isLoadingQuotas ? (
                 <Loader2 className="w-4 h-4 animate-spin opacity-20" />
              ) : quotas ? (
                 <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                       {Array.from({ length: quotas.total }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-full border-2 transition-all duration-500 ${
                              i < quotas.used
                                ? "bg-[var(--accent-start)] border-[var(--accent-start)] shadow-[0_0_10px_rgba(var(--accent-rgb),0.3)]"
                                : "bg-transparent border-[var(--border-primary)] opacity-40"
                            }`}
                          />
                       ))}
                    </div>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] text-center md:text-right uppercase tracking-widest opacity-60">
                       {quotas.used} de {quotas.total} sessões realizadas
                    </p>
                 </div>
              ) : (
                 <div className="flex items-center gap-2 py-1.5 px-3 bg-[var(--accent-soft)] rounded-lg border border-[var(--border-primary)]">
                    <Info size={12} className="text-[var(--text-muted)]" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] italic">Aguardando ativação de créditos</p>
                 </div>
              )}
           </div>
        </div>

        {/* Calendário de Escolha — política própria do 1 to 1 no card do topo */}
        <div className="min-h-[440px]">
           <Calendar
              events={oneToOneEvents}
              onBookingSuccess={() => {
                onSuccess();
                onClose();
              }}
              policyNote={
                <>
                  As sessões deverão ser agendadas com no mínimo <span className="text-[var(--text-primary)] font-black">{CALENDAR_CONFIG.MIN_LEAD_TIME_DAYS} dias de antecedência</span>, com limite de <span className="text-[var(--text-primary)] font-black">{CALENDAR_CONFIG.MAX_BOOKINGS_PER_WEEK} sessão por semana</span>. Cancelamentos e reagendamentos deverão ser realizados até <span className="text-[var(--text-primary)] font-black">24h antes</span> da sessão; após esse prazo, o crédito não poderá ser reutilizado.
                </>
              }
           />
        </div>

        <p className="text-[9px] text-[var(--text-muted)] opacity-50 font-bold uppercase tracking-widest text-center">
           Ao agendar, um crédito é debitado da sua carteira
        </p>
      </div>
    </GlassModal>
  );
}
