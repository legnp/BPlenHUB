"use client";

import React from "react";

/**
 * Tile de métrica único do painel de admin (redesign do admin, camada 2 —
 * ver docs/system-audit/ADMIN-REDESIGN-DESIGN.md). Substitui os cartões de
 * número ad-hoc que variavam de tamanho tela a tela (text-2xl / text-3xl /
 * text-4xl). Layout canônico: ícone no topo, valor grande, rótulo em caixa
 * alta discreto, e uma linha de detalhe opcional (com ponto de status). Sempre
 * em theme vars — legível em todos os temas.
 */

export type StatTone = "accent" | "success" | "warning" | "danger" | "neutral";

const ICON_TONE: Record<StatTone, string> = {
  accent: "bg-[var(--accent-start)]/10 text-[var(--accent-start)]",
  success: "bg-emerald-500/10 text-emerald-500",
  warning: "bg-amber-500/10 text-amber-500",
  danger: "bg-red-500/10 text-red-500",
  neutral: "bg-[var(--input-bg)] text-[var(--text-muted)]",
};

const DOT_TONE: Record<StatTone, string> = {
  accent: "bg-[var(--accent-start)]",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  neutral: "bg-[var(--text-muted)]",
};

const DETAIL_TONE: Record<StatTone, string> = {
  accent: "text-[var(--text-muted)]",
  success: "text-emerald-500",
  warning: "text-amber-500",
  danger: "text-red-400",
  neutral: "text-[var(--text-muted)]",
};

export function StatTile({
  label,
  value,
  detail,
  icon,
  tone = "accent",
  dot = false,
}: {
  /** Rótulo da métrica (renderizado em caixa alta discreta). */
  label: string;
  /** Valor principal — número ou texto; aceita um spinner de carregamento. */
  value: React.ReactNode;
  /** Linha secundária opcional (ex.: "3 arquivados", detalhe de sincronização). */
  detail?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: StatTone;
  /** Mostra um ponto de status colorido (tom) antes do detalhe. */
  dot?: boolean;
}) {
  return (
    <div className="p-5 rounded-2xl border border-[var(--border-primary)] bg-[var(--input-bg)] backdrop-blur-xl transition-all hover:border-[var(--accent-start)]/30">
      {icon ? (
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2.5 rounded-2xl ${ICON_TONE[tone]}`}>{icon}</div>
        </div>
      ) : null}
      <div className="space-y-1 text-left">
        <h3 className="text-3xl font-bold text-[var(--text-primary)] tracking-tighter">
          {value}
        </h3>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60">
          {label}
        </p>
        {detail ? (
          <p className={`text-xs font-medium flex items-center gap-1.5 ${DETAIL_TONE[tone]}`}>
            {dot ? <span className={`w-1.5 h-1.5 rounded-full ${DOT_TONE[tone]}`} /> : null}
            {detail}
          </p>
        ) : null}
      </div>
    </div>
  );
}
