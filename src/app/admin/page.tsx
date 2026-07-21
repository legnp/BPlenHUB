"use client";

import React, { useState, useEffect } from "react";
import {
  Handshake,
  Clock,
  Loader2,
  CalendarCheck,
  RefreshCw,
  Users,
  LayoutDashboard,
} from "lucide-react";
import { getAdminDashboardData, AdminDashboardData } from "@/actions/admin-dashboard";
import { formatDateInBR, formatTimeInBR } from "@/lib/timezone";
import { FunctionalPageHeader } from "@/components/layout/FunctionalPageHeader";
import { StatTile, StatTone } from "@/components/admin/StatTile";

const SYNC_STAT_TONE: Record<string, StatTone> = {
  ok: "success",
  warn: "warning",
  stale: "danger",
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await getAdminDashboardData();
        if (active) setData(res);
      } catch (error) {
        console.error("Erro ao carregar o painel:", error);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const syncTone: StatTone = data ? SYNC_STAT_TONE[data.sync.tone] : "danger";

  return (
    <div className="space-y-6">
      <FunctionalPageHeader
        eyebrow="Visão Geral"
        title="Painel"
        titleAccent="Administrativo"
        icon={<LayoutDashboard size={24} />}
      />

      {/* Cards de status — 2 métricas reais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatTile
          label="Agendamentos 1:1"
          value={loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (data?.oneToOneThisWeek ?? 0)}
          detail="sessões com participante nesta semana"
          icon={<Handshake className="w-5 h-5" />}
          tone="accent"
        />
        <StatTile
          label="Agenda"
          value={loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (data?.sync.label ?? "Sem dados")}
          detail={loading ? "verificando..." : (data?.sync.detail ?? "")}
          icon={<RefreshCw className="w-5 h-5" />}
          tone={syncTone}
          dot={!loading}
        />
      </div>

      {/* Próximas sessões desta semana */}
      <div className="bg-[var(--input-bg)] backdrop-blur-xl border border-[var(--border-primary)] rounded-[2rem] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <CalendarCheck className="w-5 h-5 text-[var(--accent-start)]" />
          <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
            Próximas sessões desta semana
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 opacity-40">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--text-primary)]" />
          </div>
        ) : (data?.upcoming.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <Clock className="w-6 h-6 text-[var(--text-muted)] opacity-20 mb-3" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-40">
              Nenhuma sessão restante nesta semana
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {data!.upcoming.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center gap-4 p-3 rounded-2xl bg-[var(--bg-primary)]/50 border border-[var(--border-primary)]"
              >
                <div className="flex flex-col items-center justify-center w-12 shrink-0 text-[var(--accent-start)]">
                  <span className="text-[9px] font-black uppercase tracking-wider opacity-70">
                    {formatDateInBR(ev.start, "dd/MM")}
                  </span>
                  <span className="text-xs font-black">{formatTimeInBR(ev.start)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--text-primary)] truncate">{ev.summary || "Sessão"}</p>
                  {ev.mentor && (
                    <p className="text-[11px] font-medium text-[var(--text-muted)] truncate">{ev.mentor}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0 text-[var(--text-muted)]">
                  <Users className="w-3.5 h-3.5 opacity-50" />
                  <span className="text-xs font-bold">
                    {ev.registeredCount || 0}{ev.totalCapacity ? `/${ev.totalCapacity}` : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
