"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Fingerprint,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  CheckCircle2,
  Percent,
  X,
  Activity,
  AlertTriangle,
  ArrowRightLeft,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { auth } from "@/lib/firebase";
import { getAuthFunnelAction } from "@/actions/auth-tracking";
import type { AuthFunnelResult, AuthFunnelRow, AuthFunnelStage } from "@/types/auth-funnel";
import { FunctionalPageHeader } from "@/components/layout/FunctionalPageHeader";
import { StatTile } from "@/components/admin/StatTile";
import AtmosphericLoading from "@/components/shared/AtmosphericLoading";
import { AccountTransferModal } from "@/components/admin/AccountTransferModal";

/**
 * BPlen HUB — Aba Autenticacoes (funil de recepcao).
 *
 * Snapshot read-only de quem autenticou e onde parou no funil. Reusa o header,
 * StatTiles e loading canonicos do redesign do admin. Rotulos neutros: nenhuma
 * mencao de infraestrutura (regra 6). Ver AUTH-TRACKING-DESIGN.md.
 */

type StageFilter = "all" | AuthFunnelStage;

const STAGE_META: Record<AuthFunnelStage, { label: string; badge: string }> = {
  authenticated: {
    label: "Autenticado",
    badge: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  identity_generated: {
    label: "Identidade gerada",
    badge: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  reception_complete: {
    label: "Recepção completa",
    badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
};

const STAGE_FILTERS: { id: StageFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "authenticated", label: "Autenticado" },
  { id: "identity_generated", label: "Identidade gerada" },
  { id: "reception_complete", label: "Recepção completa" },
];

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("pt-BR");
}

export function AuthFunnelView() {
  const [result, setResult] = useState<AuthFunnelResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [transferOpen, setTransferOpen] = useState(false);

  const fetchFunnel = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await getAuthFunnelAction(token);
      if (res.success && res.data) {
        setResult(res.data);
        setError(null);
      } else {
        setError(res.error || "Falha ao carregar o funil de autenticacoes.");
      }
    } catch {
      setError("Falha ao carregar o funil de autenticacoes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunnel();
  }, []);

  const filteredRows = useMemo(() => {
    const rows = result?.rows ?? [];
    const term = searchTerm.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesStage = stageFilter === "all" || row.stage === stageFilter;
      const matchesSearch =
        !term ||
        row.email.toLowerCase().includes(term) ||
        row.displayName.toLowerCase().includes(term) ||
        (row.uid ?? "").toLowerCase().includes(term) ||
        (row.matricula ?? "").toLowerCase().includes(term);
      return matchesStage && matchesSearch;
    });
  }, [result, searchTerm, stageFilter]);

  const summary = result?.summary;
  const conversionPct = summary ? Math.round(summary.conversionRate * 100) : 0;

  return (
    <div className="space-y-8 pb-20">
      <FunctionalPageHeader
        eyebrow="Pessoas"
        title="Autenticacoes"
        icon={<Fingerprint size={24} />}
        statusTag={{
          label: "Funil de Recepção",
          tone: "accent",
          icon: <Activity className="w-3 h-3" />,
        }}
      />

      <p className="text-[var(--text-muted)] text-sm font-medium opacity-70 -mt-4 text-left">
        Quem autenticou e onde parou no funil de recepção. A contagem difere da aba Membros por design:
        aqui a base sao as autenticacoes; la, os cadastros concluidos.
      </p>

      {/* Alerta de Erro */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center gap-4 text-red-500 shadow-2xl"
          >
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
              <X size={18} />
            </div>
            <div className="flex-1">
              <h5 className="text-[10px] font-bold uppercase tracking-widest">Erro de Carregamento</h5>
              <p className="text-sm font-medium opacity-80">{error}</p>
            </div>
            <button
              onClick={() => fetchFunnel()}
              className="px-6 py-2 bg-red-500 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-red-500/20 hover:scale-[1.02] transition-all"
            >
              Tentar Novamente
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* StatTiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Autenticados"
          value={loading ? "-" : summary?.totalAuthenticated ?? 0}
          icon={<UserCheck size={18} />}
          tone="accent"
          detail={
            summary && summary.orphanAuthMaps > 0
              ? `${summary.orphanAuthMaps} identidade(s) orfa(s)`
              : undefined
          }
          dot={Boolean(summary && summary.orphanAuthMaps > 0)}
        />
        <StatTile
          label="Identidade gerada"
          value={loading ? "-" : summary?.identityGenerated ?? 0}
          icon={<UserPlus size={18} />}
          tone="warning"
          detail="Abriram e nao concluiram"
        />
        <StatTile
          label="Recepção completa"
          value={loading ? "-" : summary?.receptionComplete ?? 0}
          icon={<CheckCircle2 size={18} />}
          tone="success"
          detail={
            summary && summary.usersWithoutAuth > 0
              ? `${summary.usersWithoutAuth} sem login`
              : undefined
          }
          dot={Boolean(summary && summary.usersWithoutAuth > 0)}
        />
        <StatTile
          label="Taxa de conversao"
          value={loading ? "-" : `${conversionPct}%`}
          icon={<Percent size={18} />}
          tone="accent"
          detail="Completo / autenticado"
        />
      </div>

      {/* Busca e Filtros */}
      <div className="flex flex-wrap items-center gap-4 p-5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[2rem] shadow-2xl backdrop-blur-3xl">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] opacity-40" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail, uid ou matricula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--bg-primary)]/50 border border-[var(--input-border)] rounded-2xl pl-12 pr-6 py-3.5 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]/50 transition-all"
          />
        </div>

        <div className="flex items-center bg-[var(--bg-primary)]/50 p-1.5 rounded-2xl border border-[var(--input-border)] gap-1 overflow-x-auto">
          {STAGE_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setStageFilter(filter.id)}
              className={`px-4 py-2 rounded-xl text-[9px] font-bold transition-all uppercase tracking-widest whitespace-nowrap ${
                stageFilter === filter.id
                  ? "bg-[var(--accent-start)] text-white shadow-xl shadow-[var(--accent-start)]/20"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setTransferOpen(true)}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-[var(--accent-start)]/30 bg-[var(--accent-start)]/10 text-[var(--accent-start)] text-[9px] font-bold uppercase tracking-widest hover:bg-[var(--accent-start)]/15 disabled:opacity-40 transition-all whitespace-nowrap"
        >
          <ArrowRightLeft size={14} />
          Transferir conta
        </button>
      </div>

      {/* Tabela */}
      {loading ? (
        <AtmosphericLoading label="Carregando Autenticacoes" />
      ) : (
        <div className="glass overflow-hidden rounded-[2.5rem] border-[var(--border-primary)] shadow-2xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--input-bg)]/80 border-b border-[var(--border-primary)]">
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Identidade</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Provedor</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Criado em</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Ultimo login</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Matricula</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Estagio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-primary)]">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 text-center text-[var(--text-muted)]">
                      <Fingerprint size={28} className="mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-bold opacity-60">Nenhuma autenticacao para os filtros atuais.</p>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, idx) => <FunnelRow key={row.uid ?? row.matricula ?? idx} row={row} />)
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {transferOpen && (
        <AccountTransferModal
          rows={result?.rows ?? []}
          onClose={() => setTransferOpen(false)}
          onDone={() => fetchFunnel()}
        />
      )}
    </div>
  );
}

function FunnelRow({ row }: { row: AuthFunnelRow }) {
  const stageMeta = STAGE_META[row.stage];
  return (
    <tr className={`hover:bg-[var(--accent-soft)]/10 transition-colors ${row.disabled ? "opacity-50 grayscale" : ""}`}>
      <td className="px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--bg-primary)] to-[var(--input-bg)] border border-[var(--border-primary)] flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck size={22} className="text-[var(--text-muted)] opacity-30" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-sm text-[var(--text-primary)] truncate flex items-center gap-2">
              {row.displayName || "Sem nome"}
              {row.recovered && (
                <span className="text-[8px] px-1.5 py-0.5 bg-[var(--accent-start)]/10 text-[var(--accent-start)] rounded-md uppercase tracking-widest font-bold">
                  Vinculado
                </span>
              )}
            </h4>
            <p className="text-[10px] text-[var(--text-muted)] font-medium truncate mt-1">{row.email || "-"}</p>
            {row.uid && (
              <p className="text-[8px] text-[var(--text-muted)] font-mono opacity-40 truncate mt-0.5">{row.uid}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-8 py-6">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{row.provider}</span>
      </td>
      <td className="px-8 py-6 text-[11px] font-medium text-[var(--text-muted)]">{formatDate(row.createdAt)}</td>
      <td className="px-8 py-6 text-[11px] font-medium text-[var(--text-muted)]">{formatDate(row.lastSignInAt)}</td>
      <td className="px-8 py-6">
        <span className="text-[10px] font-mono text-[var(--text-primary)]">{row.matricula || "-"}</span>
      </td>
      <td className="px-8 py-6">
        <div className="flex flex-col gap-1.5 items-start">
          <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${stageMeta.badge}`}>
            {stageMeta.label}
          </span>
          {row.note === "orphan_authmap" && (
            <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-amber-600">
              <AlertTriangle size={10} /> Identidade orfa
            </span>
          )}
          {row.note === "user_without_auth" && (
            <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
              <AlertTriangle size={10} /> Sem login
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}
