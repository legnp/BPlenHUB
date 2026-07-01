"use client";

import React, { useState, useEffect, useMemo } from "react";
import GlassModal from "@/components/ui/GlassModal";
import Calendar, { CalendarEvent } from "@/components/ui/Calendar";
import { getProgramacaoForMemberAction } from "@/actions/calendar";
import { getMemberQuotasAction } from "@/actions/quotas";
import { useAuthContext } from "@/context/AuthContext";
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
       subtitle="Sessão individual estratégica com orientador"
       maxWidth="max-w-5xl"
    >
      <div className="space-y-8 py-4">
        
        {/* Banner de Créditos (Bolinhas) */}
        <div className="p-6 bg-[var(--input-bg)]/50 border border-[var(--border-primary)] rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--accent-start)]/10 rounded-2xl text-[var(--accent-start)]">
                 <Briefcase size={20} />
              </div>
              <div className="text-left">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] leading-none mb-1">Créditos de Mentoria</h4>
                 <p className="text-sm font-black text-[var(--text-primary)]">Sessões 1 to 1 Contratadas</p>
              </div>
           </div>

           <div className="flex flex-col items-center md:items-end gap-3 px-4">
              {isLoadingQuotas ? (
                 <Loader2 className="w-4 h-4 animate-spin opacity-20" />
              ) : quotas ? (
                 <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2.5">
                       {Array.from({ length: quotas.total }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-500 ${
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
                 <div className="flex items-center gap-2 py-2 px-4 bg-[var(--accent-soft)] rounded-xl border border-[var(--border-primary)]">
                    <Info size={12} className="text-[var(--text-muted)]" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] italic">Aguardando ativação de créditos</p>
                 </div>
              )}
           </div>
        </div>

        {/* Calendário de Escolha */}
        <div className="min-h-[500px]">
           <Calendar
              events={oneToOneEvents}
              onBookingSuccess={() => {
                onSuccess();
                onClose();
              }}
           />
        </div>

        <p className="text-[9px] text-[var(--text-muted)] opacity-40 font-bold uppercase tracking-widest text-center mt-6">
           Ao agendar, um crédito será automaticamente debitado da sua carteira.
        </p>
      </div>
    </GlassModal>
  );
}
