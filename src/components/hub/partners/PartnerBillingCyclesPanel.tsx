"use client";

import React, { useMemo, useState } from "react";
import { Download, Loader2, MessageSquare, Search, Upload } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useAuthContext } from "@/context/AuthContext";
import { uploadToUserDrive } from "@/actions/upload-to-drive";
import {
  addPartnerCycleCommentAction,
  PartnerBillingCycle,
  submitPartnerInvoiceAction,
} from "@/actions/partners/billing-cycles";
import { PARTNER_CYCLE_STATUS_LABEL, PartnerCycleStatus } from "@/lib/partners/cycle-status";
import { cn } from "@/lib/utils";

/**
 * Ciclos de repasse do parceiro — coluna direita da Gestao de Indicacoes.
 *
 * O parceiro tem duas acoes aqui, e so elas: enviar o recibo/NF quando o ciclo pedir, e
 * conversar com a BPlen. Abrir apuracao, corrigir valor e registrar o pagamento sao
 * acoes do Admin — a maquina de estados no servidor recusa qualquer atalho.
 */

const TONE: Record<PartnerCycleStatus, string> = {
  nenhuma_indicacao: "bg-[var(--input-bg)] text-[var(--text-muted)] border-[var(--border-primary)]",
  em_andamento: "bg-[var(--accent-soft)] text-[var(--accent-start)] border-[var(--accent-start)]/20",
  em_apuracao: "bg-amber-500/10 text-amber-500 border-amber-500/25",
  emita_recibo: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  aguardando_repasse: "bg-blue-500/10 text-blue-500 border-blue-500/25",
  concluido: "bg-emerald-500/10 text-emerald-500 border-emerald-500/25",
};

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const monthLabel = (cycleId: string) => {
  const [year, month] = cycleId.split("-").map(Number);
  if (!year || !month) return cycleId;
  const nome = new Date(Date.UTC(year, month - 1, 15)).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return nome.charAt(0).toUpperCase() + nome.slice(1);
};

export function PartnerBillingCyclesPanel({
  cycles,
  onChanged,
}: {
  cycles: PartnerBillingCycle[];
  onChanged: () => void;
}) {
  const { matricula } = useAuthContext();
  const [query, setQuery] = useState("");
  const [busyCycle, setBusyCycle] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return cycles;
    return cycles.filter((c) =>
      [c.cycleId, monthLabel(c.cycleId), PARTNER_CYCLE_STATUS_LABEL[c.status]]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [cycles, query]);

  const handleInvoiceUpload = async (cycleId: string, file: File) => {
    if (!matricula) return;
    setBusyCycle(cycleId);
    setError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        setError("Sessão expirada. Recarregue a página e tente novamente.");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("matricula", matricula);
      formData.append("idToken", idToken);
      formData.append("type", `RECIBO_PARCERIA_${cycleId}`);

      const upload = await uploadToUserDrive(formData);
      if (!upload.success || !upload.url) {
        setError(upload.error || "Não foi possível enviar o arquivo.");
        return;
      }

      const res = await submitPartnerInvoiceAction({
        cycleId,
        url: upload.url,
        fileName: upload.fileName || file.name,
      });
      if (!res.success) {
        setError(res.error || "Não foi possível registrar o recibo.");
        return;
      }
      onChanged();
    } finally {
      setBusyCycle(null);
    }
  };

  const handleComment = async (cycleId: string) => {
    const text = (commentDraft[cycleId] || "").trim();
    if (!text) return;
    setBusyCycle(cycleId);
    setError(null);
    try {
      const res = await addPartnerCycleCommentAction({ cycleId, text });
      if (!res.success) {
        setError(res.error || "Não foi possível enviar a mensagem.");
        return;
      }
      setCommentDraft((prev) => ({ ...prev, [cycleId]: "" }));
      onChanged();
    } finally {
      setBusyCycle(null);
    }
  };

  if (cycles.length === 0) {
    return (
      <div className="p-10 rounded-[2rem] border border-dashed border-[var(--border-primary)] text-center">
        <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
          Nenhum ciclo de repasse por aqui ainda. Eles aparecem assim que suas indicações
          gerarem serviços adquiridos.
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
          placeholder="Buscar por mês ou status"
          className="w-full pl-11 pr-4 py-3.5 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)] transition-colors placeholder:text-[var(--text-muted)] placeholder:opacity-50"
        />
      </div>

      {error ? <p className="text-sm text-red-500 font-medium px-1">{error}</p> : null}

      <div className="space-y-4">
        {visible.map((cycle) => {
          const isBusy = busyCycle === cycle.cycleId;
          const pedeRecibo = cycle.status === "emita_recibo";
          return (
            <article
              key={cycle.cycleId}
              className="p-6 rounded-[2rem] border border-[var(--border-primary)] bg-[var(--input-bg)]/30 space-y-5"
            >
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-[var(--text-primary)]">{monthLabel(cycle.cycleId)}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-60 mt-1">
                    {cycle.totalIndications} indicação(ões) no ciclo
                  </p>
                </div>
                <span
                  className={cn(
                    "px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest",
                    TONE[cycle.status]
                  )}
                >
                  {PARTNER_CYCLE_STATUS_LABEL[cycle.status]}
                </span>
              </header>

              <div className="flex flex-wrap items-end gap-6">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Valor do repasse</p>
                  <p className="text-xl font-black text-[var(--text-primary)]">{money(cycle.payableValue)}</p>
                </div>
                {cycle.adjustedValue !== null && cycle.adjustedValue !== cycle.totalCommissionValue ? (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500">
                    Valor ajustado pela BPlen (calculado: {money(cycle.totalCommissionValue)})
                  </p>
                ) : null}
              </div>

              {/* Recibo/NF — acao do parceiro */}
              <div className="flex flex-wrap items-center gap-3">
                {pedeRecibo ? (
                  <label className="inline-flex items-center gap-2.5 px-6 py-3 bg-[var(--accent-start)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:scale-[1.02] transition-transform">
                    {isBusy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    Enviar recibo/NF
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      disabled={isBusy}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleInvoiceUpload(cycle.cycleId, file);
                      }}
                    />
                  </label>
                ) : null}

                {cycle.invoiceUpload ? (
                  <a
                    href={cycle.invoiceUpload.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-[var(--border-primary)] text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <Download size={13} />
                    Recibo enviado
                  </a>
                ) : null}

                {cycle.paymentProof ? (
                  <a
                    href={cycle.paymentProof.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                  >
                    <Download size={13} />
                    Comprovante de pagamento
                  </a>
                ) : null}
              </div>

              {/* Conversa do ciclo */}
              <div className="space-y-3 pt-4 border-t border-[var(--border-primary)]">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] flex items-center gap-2">
                  <MessageSquare size={12} />
                  Conversa deste ciclo
                </p>

                {cycle.comments.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {cycle.comments.map((comment, index) => (
                      <div
                        key={`${comment.createdAt}-${index}`}
                        className={cn(
                          "px-4 py-3 rounded-2xl border text-sm",
                          comment.authorRole === "admin"
                            ? "bg-[var(--accent-soft)] border-[var(--accent-start)]/15"
                            : "bg-[var(--bg-primary)]/40 border-[var(--border-primary)]"
                        )}
                      >
                        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">
                          {comment.authorName}
                        </p>
                        <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[var(--text-muted)] italic">Nenhuma mensagem neste ciclo ainda.</p>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentDraft[cycle.cycleId] || ""}
                    onChange={(e) => setCommentDraft((prev) => ({ ...prev, [cycle.cycleId]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && handleComment(cycle.cycleId)}
                    placeholder="Escreva uma mensagem"
                    className="flex-1 px-4 py-3 bg-[var(--bg-primary)]/40 border border-[var(--border-primary)] rounded-2xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)] transition-colors placeholder:text-[var(--text-muted)] placeholder:opacity-50"
                  />
                  <button
                    onClick={() => handleComment(cycle.cycleId)}
                    disabled={isBusy || !(commentDraft[cycle.cycleId] || "").trim()}
                    className="px-5 py-3 rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-opacity"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="text-center text-sm text-[var(--text-muted)] py-6">
          Nenhum ciclo corresponde à sua busca.
        </p>
      ) : null}
    </div>
  );
}
