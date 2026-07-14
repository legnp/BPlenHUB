"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Header canônico das páginas de "Gestão Funcional" da área logada
 * (ver docs/system-audit — conceito de páginas: Fullscreen / BPlen Journey /
 * Gestão Funcional / Autênticas). Padrão destilado de `gestao_carreira`
 * (back-link + linha de cabeçalho + status-tag à direita) com o título de cor
 * dupla no espírito de `/conteudo`. Sempre em theme vars — legível em todos os temas.
 *
 * Uso: contratos (avulso + checkout) e checkout. Reutilizável pelas demais páginas
 * de Gestão Funcional numa passada futura (item global de categorização de páginas).
 *
 * CONTAINER CANÔNICO da página Gestão Funcional (para o título/voltar ficarem SEMPRE
 * na mesma posição vertical e com o mesmo recuo lateral em todas as telas — F2-05):
 *   <div className="max-w-[1440px] mx-auto pt-[10px] px-6 md:px-12 pb-16 space-y-10 w-full">
 * Não usar `max-w-7xl`, `py-10` nem `p-6/p-10` no wrapper — divergem do padrão.
 */

export type StatusTone = "accent" | "success" | "warning" | "neutral";

const TONE_CLASSES: Record<StatusTone, string> = {
  accent:
    "bg-[var(--accent-soft)] text-[var(--accent-start)] border-[var(--accent-start)]/20",
  success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-500 border-amber-500/25",
  neutral:
    "bg-[var(--input-bg)] text-[var(--text-muted)] border-[var(--border-primary)]",
};

export function FunctionalPageHeader({
  eyebrow,
  title,
  titleAccent,
  backHref,
  backLabel = "Voltar",
  statusTag,
  icon,
}: {
  eyebrow?: string;
  /** Parte principal do título (cor primária). */
  title: React.ReactNode;
  /** Segunda parte do título em cor dupla (muted) — o "cor dupla" da referência. */
  titleAccent?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  statusTag?: { label: string; tone?: StatusTone; icon?: React.ReactNode };
  icon?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[var(--border-primary)]/40 pb-6">
      <div className="space-y-4">
        {backHref ? (
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            {backLabel}
          </Link>
        ) : null}
        <div className="space-y-1">
          {eyebrow ? (
            <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent-start)]">
              {eyebrow}
            </span>
          ) : null}
          <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-3">
            {icon}
            <span>
              {title}
              {titleAccent ? <span className="text-[var(--text-muted)]"> {titleAccent}</span> : null}
            </span>
          </h1>
        </div>
      </div>

      {statusTag ? (
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest ${
            TONE_CLASSES[statusTag.tone ?? "accent"]
          }`}
        >
          {statusTag.icon}
          {statusTag.label}
        </div>
      ) : null}
    </header>
  );
}
