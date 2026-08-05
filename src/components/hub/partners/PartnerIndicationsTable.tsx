"use client";

import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Search, Users } from "lucide-react";
import { PartnerIndication } from "@/actions/partners/referrals";
import { cn } from "@/lib/utils";

/**
 * Lista de indicacoes do parceiro.
 *
 * Busca livre e ordenacao por qualquer coluna, como a Gestora pediu. O `cpfHash` NAO
 * aparece aqui nem chega ao navegador: e' uso interno da BPlen (decisao dela,
 * reconfirmada em 2026-08-05) — a identificacao do indicado e' nome + matricula.
 */

type SortKey = "referredNome" | "referredMatricula" | "dataIndicacao" | "journeyProgress" | "totalCommission";

const COLUMNS: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "referredNome", label: "Indicado" },
  { key: "referredMatricula", label: "Matrícula" },
  { key: "dataIndicacao", label: "Data da indicação" },
  { key: "journeyProgress", label: "Status da jornada" },
  { key: "totalCommission", label: "Repasse", align: "right" },
];

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const shortDate = (iso: string) => {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pt-BR");
};

export function PartnerIndicationsTable({ indications }: { indications: PartnerIndication[] }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("dataIndicacao");
  const [ascending, setAscending] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = term
      ? indications.filter((i) =>
          [i.referredNome, i.referredMatricula, i.journeyStatus, ...i.services.map((s) => s.productTitle)]
            .join(" ")
            .toLowerCase()
            .includes(term)
        )
      : indications;

    const ordered = [...filtered].sort((a, b) => {
      const left = a[sortKey];
      const right = b[sortKey];
      const comparison =
        typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right), "pt-BR");
      return ascending ? comparison : -comparison;
    });

    return ordered;
  }, [indications, query, sortKey, ascending]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setAscending((prev) => !prev);
      return;
    }
    setSortKey(key);
    setAscending(false);
  };

  if (indications.length === 0) {
    return (
      <div className="p-12 rounded-[2rem] border border-dashed border-[var(--border-primary)] text-center space-y-3">
        <Users size={28} className="mx-auto text-[var(--text-muted)] opacity-40" />
        <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
          Você ainda não tem indicações registradas. Elas aparecem aqui assim que alguém
          informar o seu nome como origem no primeiro acesso à plataforma.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] opacity-40" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome, matrícula, status ou serviço"
          className="w-full pl-11 pr-4 py-3.5 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)] transition-colors placeholder:text-[var(--text-muted)] placeholder:opacity-50"
        />
      </div>

      <div className="overflow-x-auto rounded-[2rem] border border-[var(--border-primary)]">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="bg-[var(--input-bg)]/60">
              {COLUMNS.map((col) => (
                <th key={col.key} className={cn("px-6 py-4", col.align === "right" ? "text-right" : "text-left")}>
                  <button
                    onClick={() => toggleSort(col.key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] transition-colors",
                      sortKey === col.key ? "text-[var(--accent-start)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    {col.label}
                    {sortKey === col.key ? (
                      ascending ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    ) : null}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((indication) => {
              const isOpen = expanded === indication.referredMatricula;
              return (
                <React.Fragment key={indication.referredMatricula}>
                  <tr
                    onClick={() => setExpanded(isOpen ? null : indication.referredMatricula)}
                    className="border-t border-[var(--border-primary)]/60 hover:bg-[var(--accent-soft)] transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-[var(--text-primary)]">{indication.referredNome}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-60 mt-1">
                        {indication.services.length === 0
                          ? "Sem serviço adquirido"
                          : `${indication.services.length} serviço(s)`}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                        {indication.referredMatricula}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-[var(--text-secondary)]">
                      {shortDate(indication.dataIndicacao)}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-1.5 rounded-full bg-[var(--border-primary)] overflow-hidden">
                          <div
                            className="h-full bg-[var(--accent-start)]"
                            style={{ width: `${Math.min(100, Math.max(0, indication.journeyProgress))}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                          {indication.journeyStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="text-sm font-black text-[var(--text-primary)]">
                        {money(indication.totalCommission)}
                      </span>
                    </td>
                  </tr>

                  {isOpen && indication.services.length > 0 && (
                    <tr className="bg-[var(--input-bg)]/30">
                      <td colSpan={COLUMNS.length} className="px-6 py-5">
                        <div className="space-y-3">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                            Serviços adquiridos
                          </p>
                          {indication.services.map((service) => (
                            <div
                              key={service.orderId}
                              className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 rounded-2xl bg-[var(--bg-primary)]/40 border border-[var(--border-primary)]"
                            >
                              <div className="min-w-[180px]">
                                <p className="text-sm font-bold text-[var(--text-primary)]">{service.productTitle}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-60 mt-1">
                                  Comprado em {shortDate(service.purchasedAt)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Valor pago</p>
                                <p className="text-sm font-bold text-[var(--text-primary)]">{money(service.paidValue)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Repasse ({service.commissionPercent}%)</p>
                                <p className="text-sm font-black text-[var(--accent-start)]">{money(service.commissionValue)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Data de corte</p>
                                <p className="text-sm font-bold text-[var(--text-primary)]">{shortDate(service.cutoffDate)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {visible.length === 0 ? (
        <p className="text-center text-sm text-[var(--text-muted)] py-6">
          Nenhuma indicação corresponde à sua busca.
        </p>
      ) : null}
    </div>
  );
}
