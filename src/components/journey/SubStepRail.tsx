"use client";

import React, { useState } from "react";
import { SubStepConfig } from "@/types/journey";
import { cn } from "@/lib/utils";
import { SequenceLockModal } from "./SequenceLockModal";

interface SubStepRailProps {
  id?: string;
  style?: React.CSSProperties;
  substeps: SubStepConfig[];
  currentSubStepId: string;
  completedSubStepIds: string[];
  onSelectSubStep: (id: string) => void;
}

/**
 * BPlen HUB — SubStepRail 🧬🛡️
 * Linear rail for sub-stage progress.
 */
export function SubStepRail({ id, style, substeps, currentSubStepId, completedSubStepIds, onSelectSubStep }: SubStepRailProps) {
  const [sequenceLockModalOpen, setSequenceLockModalOpen] = useState(false);
  const [pendingSubStepTitles, setPendingSubStepTitles] = useState<string[]>([]);

  // 🧬 Agrupamento de SubSteps por Ordem Majoritária (ex: 5.1, 5.2 -> Parada 5)
  const groupedSubSteps = substeps.reduce((acc, ss) => {
    const majorOrder = ss.order ? String(ss.order).split('.')[0] : "99";
    if (!acc[majorOrder]) acc[majorOrder] = [];
    acc[majorOrder].push(ss);
    return acc;
  }, {} as Record<string, SubStepConfig[]>);

  const majorOrders = Object.keys(groupedSubSteps).sort((a, b) => {
    const numA = parseFloat(String(groupedSubSteps[a][0].order || a));
    const numB = parseFloat(String(groupedSubSteps[b][0].order || b));
    return numA - numB;
  });

  const handleSelectGroup = (order: string) => {
    const group = groupedSubSteps[order];
    if (!group || group.length === 0) return;

    // Encontra o primeiro índice absoluto deste grupo para checar trava de sequência
    const firstSubStep = group[0];
    const absoluteIdx = substeps.findIndex(ss => ss.id === firstSubStep.id);
    
    const isLocked = absoluteIdx > 0 && !completedSubStepIds.includes(substeps[absoluteIdx - 1].id);

    if (isLocked) {
      setPendingSubStepTitles([substeps[absoluteIdx - 1].title]);
      setSequenceLockModalOpen(true);
      return;
    }

    // Seleciona o primeiro incompleto do grupo ou o primeiro do grupo se tudo estiver pronto
    const firstIncomplete = group.find(ss => !completedSubStepIds.includes(ss.id));
    onSelectSubStep(firstIncomplete ? firstIncomplete.id : group[0].id);
  };

  return (
    <div id={id} style={style} className="flex flex-col gap-6 w-1/4 sm:w-[22%] shrink-0 pr-8 border-r border-[var(--border-primary)] border-dashed">
      <div className="flex flex-col gap-2">
        <h4 className="text-[10px] font-black uppercase text-[var(--accent-start)] tracking-[0.3em] pl-1">Checkpoints</h4>
        <div className="h-[2px] w-6 bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)] rounded-full mb-2 ml-1" />
      </div>

      <div className="flex flex-col gap-4">
        {majorOrders.map((order, idx) => {
          const group = groupedSubSteps[order];
          const isActive = group.some(ss => ss.id === currentSubStepId);
          const isAllCompleted = group.every(ss => completedSubStepIds.includes(ss.id));
          const isAnyCompleted = group.some(ss => completedSubStepIds.includes(ss.id));
          
          const firstSubStep = group[0];
          const absoluteIdx = substeps.findIndex(ss => ss.id === firstSubStep.id);
          const isLockedBySequence = absoluteIdx > 0 && !completedSubStepIds.includes(substeps[absoluteIdx - 1].id);

          // Título do Checkpoint (usamos o título do primeiro item do grupo)
          const displayTitle = group[0].title;

          return (
            <button
              key={order}
              onClick={() => handleSelectGroup(order)}
              className={cn(
                "group relative flex items-start gap-5 p-4 text-left transition-all duration-500 rounded-3xl border",
                // PRIORIDADE 1: Concluído e Selecionado (Verde Vibrante) 🟢✨
                isAllCompleted && isActive
                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 shadow-[0_10px_30px_rgba(16,185,129,0.1)] scale-[1.02] z-10"
                  // PRIORIDADE 2: Apenas Selecionado (Cor do Tema) 🏗️
                  : isActive
                    ? "bg-[var(--accent-start)]/5 border-[var(--accent-start)]/30 shadow-[0_10px_30px_rgba(var(--accent-start-rgb),0.05)] scale-[1.02] z-10"
                    // PRIORIDADE 3: Apenas Concluído (Verde Suave) ✅
                    : isAllCompleted
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600/80"
                      // PRIORIDADE 4: Travado pela Sequência (Farol Laranja Apagado) 🟠😶
                      : isLockedBySequence
                        ? "bg-amber-100/5 border-amber-400/20 opacity-60"
                        // PADRÃO: Pendente/Inativo ⏳
                        : "bg-[var(--input-bg)]/30 border-transparent hover:border-[var(--border-primary)] opacity-40 hover:opacity-100"
              )}
            >
              {/* Indicador Vertical Progressivo */}
              <div className="flex flex-col items-center gap-1.5 mt-1.5">
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full border-2 transition-all duration-700",
                  // Círculo Verde (Ativo ou Inativo)
                  isAllCompleted
                      ? isActive 
                        ? "bg-emerald-500 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
                        : "bg-emerald-500 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                      // Círculo Laranja Apagado (Bloqueado)
                      : isLockedBySequence
                        ? "bg-amber-400/30 border-amber-400/10"
                        // Círculo Tema (Ativo)
                        : isActive
                          ? "bg-[var(--accent-start)] border-[var(--accent-start)] shadow-[0_0_12px_var(--accent-start)]"
                          // Círculo Oco (Pendente)
                          : "bg-transparent border-[var(--text-muted)] opacity-30"
                )} />
                {idx < majorOrders.length - 1 && (
                  <div className={cn(
                    "w-[1px] h-12 -mb-6 transition-all duration-700",
                    isAllCompleted ? "bg-emerald-500/20" : "bg-[var(--border-primary)]/40"
                  )} />
                )}
              </div>

              <div className="flex flex-col gap-1.5 overflow-hidden">
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-[0.2em] transition-all",
                  isActive 
                    ? isAllCompleted ? "text-emerald-500 opacity-100" : "text-[var(--accent-start)] opacity-100" 
                    : "text-[var(--text-tertiary)] opacity-40"
                )}>
                  Parada {order}
                </span>
                <span className={cn(
                  "text-[11px] font-black leading-tight tracking-tight transition-colors duration-500",
                  isActive 
                    ? isAllCompleted ? "text-emerald-700" : "text-[var(--text-primary)]" 
                    : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
                )}>
                  {displayTitle}
                </span>
                {isActive && (
                   <div className="flex flex-col gap-1">
                      <span className={cn(
                          "text-[7px] font-black uppercase tracking-[0.3em] mt-1 animate-pulse",
                          isAllCompleted ? "text-emerald-500" : "text-[var(--accent-start)]"
                      )}>
                          {isAllCompleted ? "Revisão" : "Em Foco"}
                      </span>
                      {group.length > 1 && (
                        <div className="flex gap-1 mt-1">
                          {group.map((item, gIdx) => (
                            <div 
                              key={item.id}
                              className={cn(
                                "w-3 h-1 rounded-full transition-all",
                                item.id === currentSubStepId 
                                  ? "bg-[var(--accent-start)] w-6" 
                                  : completedSubStepIds.includes(item.id)
                                    ? "bg-emerald-500"
                                    : "bg-[var(--text-muted)] opacity-20"
                              )}
                            />
                          ))}
                        </div>
                      )}
                   </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <SequenceLockModal 
        isOpen={sequenceLockModalOpen}
        onClose={() => setSequenceLockModalOpen(false)}
        pendingTitles={pendingSubStepTitles}
        type="parada"
      />
    </div>
  );
}
