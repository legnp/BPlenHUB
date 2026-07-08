"use client";

import React from "react";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import Link from "next/link";
import { JourneyStep, SubStepConfig } from "@/types/journey";

interface StageOverviewCardProps {
  stage: JourneyStep;
  onContinue?: () => void;
  className?: string;
}

/**
 * StageOverviewCard — BPlen HUB 🧬
 * Card informativo da etapa atual da jornada (Print 2).
 */
export function StageOverviewCard({ stage, className }: StageOverviewCardProps) {
  // Renderização segura do ícone
  const IconName = stage.icon as keyof typeof LucideIcons;
  const IconComponent = (LucideIcons[IconName] as typeof LucideIcons.Circle) || LucideIcons.Circle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative glass-morphism border border-[var(--border-primary)] rounded-[2.5rem] p-8 md:p-10 shadow-2xl overflow-hidden group ${className}`}
    >
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-primary)] opacity-[0.03] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
      
      <div className="flex items-center gap-6 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white shadow-lg shrink-0">
          <IconComponent className="w-[25px] h-[25px]" />
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--accent-primary)] mb-1">
            Etapa {stage.order} de 6
          </p>
          <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
            {stage.title}
          </h2>
        </div>
      </div>

      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)]/50 border-l-4 border-l-[var(--accent-primary)] shadow-sm">
          <p className="text-xs font-bold text-[var(--text-primary)] mb-2 italic">"{stage.title}"</p>
          <p className="text-[var(--text-secondary)] text-xs leading-relaxed opacity-80">
            {stage.description}
          </p>
        </div>

        {/* Sub-steps Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stage.substeps.map((sub: SubStepConfig, idx: number) => (
            <div key={idx} className="p-3.5 rounded-xl border border-[var(--border-primary)] bg-white/[0.02] flex items-center gap-3 group/item hover:border-[var(--accent-primary)]/30 transition-all">
              <div className="w-7 h-7 rounded-lg bg-[var(--input-bg)] flex items-center justify-center text-[var(--text-muted)] group-hover/item:text-[var(--accent-primary)] transition-colors">
                 {sub.type === 'content' ? <LucideIcons.PlayCircle className="w-3.5 h-3.5" /> : <LucideIcons.FileText className="w-3.5 h-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-[var(--text-primary)] uppercase tracking-wider truncate">{sub.title}</p>
                <p className="text-[8px] text-[var(--text-muted)] line-clamp-1 opacity-60">{sub.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4">
          <Link
            href={`/hub/journey/${stage.id}`}
            className="inline-flex px-10 py-3.5 rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10"
          >
            Continuar Trilha
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
