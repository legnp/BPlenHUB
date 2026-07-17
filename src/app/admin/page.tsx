"use client";

import React, { useState, useEffect } from "react";
import {
  Handshake,
  Clock,
  Loader2,
  CalendarCheck,
  RefreshCw,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { getAdminDashboardData, AdminDashboardData } from "@/actions/admin-dashboard";
import { formatDateInBR, formatTimeInBR } from "@/lib/timezone";

const SYNC_TONE: Record<string, { dot: string; text: string }> = {
  ok: { dot: "bg-green-500", text: "text-green-500" },
  warn: { dot: "bg-amber-500", text: "text-amber-500" },
  stale: { dot: "bg-red-500", text: "text-red-400" },
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
        console.error("Erro ao carregar o dashboard:", error);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const syncTone = data ? SYNC_TONE[data.sync.tone] : SYNC_TONE.stale;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] text-left">
          DASHBOARD <span className="text-[var(--accent-start)] italic">Administrativo</span>
        </h1>
        <p className="text-[var(--text-muted)] text-sm font-medium opacity-70 text-left">
          BPlen HUB | Visão Geral Administrativa
        </p>
      </motion.div>

      {/* Cards de status — 2 métricas reais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Agendamentos 1:1 da semana */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-5 rounded-2xl border border-[var(--border-primary)] bg-[var(--input-bg)] backdrop-blur-xl"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-2.5 rounded-2xl bg-[var(--accent-start)]/10 text-[var(--accent-start)]">
              <Handshake className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1 text-left">
            <h3 className="text-3xl font-bold text-[var(--text-primary)] tracking-tighter">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (data?.oneToOneThisWeek ?? 0)}
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60">
              Agendamentos 1:1
            </p>
            <p className="text-xs font-medium text-[var(--text-muted)]">
              sessões com participante nesta semana
            </p>
          </div>
        </motion.div>

        {/* Status real da sincronização */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="p-5 rounded-2xl border border-[var(--border-primary)] bg-[var(--input-bg)] backdrop-blur-xl"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`p-2.5 rounded-2xl bg-[var(--input-bg)] ${syncTone.text}`}>
              <RefreshCw className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1 text-left">
            <h3 className="text-3xl font-bold text-[var(--text-primary)] tracking-tighter">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (data?.sync.label ?? "Sem dados")}
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60">
              Agenda
            </p>
            <p className={`text-xs font-medium flex items-center gap-1.5 ${syncTone.text}`}>
              {!loading && <span className={`w-1.5 h-1.5 rounded-full ${syncTone.dot}`} />}
              {loading ? "verificando..." : (data?.sync.detail ?? "")}
            </p>
          </div>
        </motion.div>
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
