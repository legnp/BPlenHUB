"use client";

import React, { useState, useEffect, useMemo } from "react";
import GlassModal from "@/components/ui/GlassModal";
import Calendar, { CalendarEvent } from "@/components/ui/Calendar";
import { getMemberQuotasAction } from "@/actions/quotas";
import { useAuthContext } from "@/context/AuthContext";
import { Loader2, Briefcase, Info } from "lucide-react";
import type { SessionAudience } from "@/lib/booking/session-demands";

interface OneToOneBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  allEvents: CalendarEvent[];
  onSuccess: () => void;
  /**
   * Audiencia do fluxo. Decide a lista de motivos e se a sessao consome credito — o
   * `Calendar` ja sabe fazer isso, este modal e' que nao repassava e caia no padrao
   * (membro). Sintoma: o parceiro abria o 1 to 1 pelo menu e via os motivos do membro
   * ("Plano de Carreira", "Analise de Curriculo") mais um banner de carteira de creditos
   * que ele nao consome.
   */
  audience?: SessionAudience;
}

/**
 * One-to-One Booking Modal — BPlen HUB.
 *
 * A GRADE e' a mesma para as duas audiencias, de proposito (decisao da Gestora,
 * 2026-08-05: grade unica e disputada). O que muda por audiencia e' a lista de motivos e
 * o credito — sessao de parceria e' LIVRE, sem carteira e sem penalidade, e a isencao e'
 * aplicada no servidor pelo selo.
 */
export default function OneToOneBookingModal({
  isOpen,
  onClose,
  allEvents,
  onSuccess,
  audience = "member"
}: OneToOneBookingModalProps) {
  const { user } = useAuthContext();
  const [quotas, setQuotas] = useState<{ total: number; used: number } | null>(null);
  const [isLoadingQuotas, setIsLoadingQuotas] = useState(true);

  const isParceria = audience === "partner";

  // Acima deste total, as bolinhas dariam overflow no card — troca por barra de
  // progresso compacta (o visual de bolinhas segue no caso típico, de poucos créditos).
  const MAX_DOTS = 12;

  // 1. Filtrar eventos para apenas 1-to-1
  const oneToOneEvents = useMemo(() => {
    return allEvents.filter(ev => 
      ev.summary.toLowerCase().includes("1 to 1") || 
      ev.summary.toLowerCase().includes("1-to-1")
    );
  }, [allEvents]);

  // 2. Buscar cotas do membro. Nao corre na parceria: nao ha carteira a consultar, e
  // pedir cota de quem nao consome cota seria leitura inutil a cada abertura do modal.
  useEffect(() => {
    if (!isOpen || !user?.uid || isParceria) return;

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
  }, [isOpen, user, isParceria]);

  return (
    <GlassModal
       isOpen={isOpen}
       onClose={onClose}
       title="Agendamento 1 to 1"
       subtitle={
         isParceria
           ? "Sessão individual da sua parceria com a BPlen"
           : "Consultoria individual de Gestão e Desenvolvimento de Carreira"
       }
       maxWidth="max-w-5xl"
    >
      <div className="space-y-5 py-1">

        {/* Banner de Créditos — só na audiência de membro. Na parceria não existe
            carteira: mostrar "0 de 56 sessões realizadas" para quem não consome crédito
            é informação falsa, não apenas irrelevante. */}
        {!isParceria && (
        <div className="p-4 bg-[var(--input-bg)]/50 border border-[var(--border-primary)] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
           {/* shrink-0: o rótulo nunca é espremido pelo indicador de créditos */}
           <div className="flex items-center gap-3 shrink-0">
              <div className="p-2.5 bg-[var(--accent-start)]/10 rounded-xl text-[var(--accent-start)]">
                 <Briefcase size={18} />
              </div>
              <div className="text-left">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] leading-none mb-1 whitespace-nowrap">Créditos de Consultoria</h4>
                 <p className="text-sm font-black text-[var(--text-primary)] whitespace-nowrap">Sessões 1 to 1 Contratadas</p>
              </div>
           </div>

           <div className="flex flex-col items-center md:items-end gap-2 min-w-0">
              {isLoadingQuotas ? (
                 <Loader2 className="w-4 h-4 animate-spin opacity-20" />
              ) : quotas ? (
                 <div className="flex flex-col items-center md:items-end gap-1.5 w-full min-w-0">
                    {quotas.total <= MAX_DOTS ? (
                       /* Poucos créditos: bolinhas (uma por sessão) */
                       <div className="flex flex-wrap items-center justify-center md:justify-end gap-2">
                          {Array.from({ length: quotas.total }).map((_, i) => (
                             <div
                               key={i}
                               className={`w-3 h-3 rounded-full border-2 shrink-0 transition-all duration-500 ${
                                 i < quotas.used
                                   ? "bg-[var(--accent-start)] border-[var(--accent-start)] shadow-[0_0_10px_rgba(var(--accent-rgb),0.3)]"
                                   : "bg-transparent border-[var(--border-primary)] opacity-40"
                               }`}
                             />
                          ))}
                       </div>
                    ) : (
                       /* Muitos créditos: barra compacta — nunca transborda o card */
                       <div className="flex items-center gap-3 w-full md:w-56">
                          <div className="flex-1 h-1.5 bg-[var(--border-primary)]/50 rounded-full overflow-hidden">
                             <div
                               className="h-full bg-[var(--accent-start)] rounded-full transition-all duration-500"
                               style={{ width: `${Math.min(100, Math.round((quotas.used / quotas.total) * 100))}%` }}
                             />
                          </div>
                          <span className="text-[10px] font-black font-mono text-[var(--text-primary)] shrink-0">
                             {quotas.used}/{quotas.total}
                          </span>
                       </div>
                    )}
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
        )}

        {/* Calendário de Escolha — herda a política única do `Calendar`. O texto
            próprio daqui foi aposentado: com o crédito e o prazo de 24h na
            política global, era duplicata (uma política, uma fonte de verdade). */}
        <div className="min-h-[440px]">
           <Calendar
              events={oneToOneEvents}
              audience={audience}
              onBookingSuccess={() => {
                onSuccess();
                onClose();
              }}
           />
        </div>

        <p className="text-[9px] text-[var(--text-muted)] opacity-50 font-bold uppercase tracking-widest text-center">
           {isParceria
             ? "Sessões de parceria não consomem créditos"
             : "Ao agendar, um crédito é debitado da sua carteira"}
        </p>
      </div>
    </GlassModal>
  );
}
