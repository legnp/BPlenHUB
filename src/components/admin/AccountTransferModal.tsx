"use client";

import React, { useState } from "react";
import { X, ArrowRightLeft, AlertTriangle, Loader2, ShieldAlert, CheckCircle2 } from "lucide-react";
import {
  getAccountSnapshotAction,
  transferAccountAction,
  type AccountSnapshot,
} from "@/actions/account-transfer";
import type { AuthFunnelRow } from "@/types/auth-funnel";

/**
 * Modal admin de transferencia de conta (Fase 3). Reassocia uma conta existente
 * (origem, com os dados) a um novo login (destino). Mostra um resumo read-only da
 * origem antes de confirmar. A trava de seguranca (nao transferir para cima de uma
 * conta com dados) vive no servidor; aqui a UI so orienta.
 */
export function AccountTransferModal({
  rows,
  onClose,
  onDone,
}: {
  rows: AuthFunnelRow[];
  onClose: () => void;
  onDone: () => void;
}) {
  const sources = rows.filter((r) => r.matricula);
  const targets = rows.filter((r) => r.uid);

  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [snapshot, setSnapshot] = useState<AccountSnapshot | null>(null);
  const [loadingSnap, setLoadingSnap] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function loadSnapshot(mat: string) {
    setSnapshot(null);
    setMessage(null);
    if (!mat) return;
    setLoadingSnap(true);
    const res = await getAccountSnapshotAction(mat);
    setLoadingSnap(false);
    if (res.success && res.data) setSnapshot(res.data);
    else setMessage({ type: "error", text: res.error || "Falha ao carregar a conta." });
  }

  async function handleTransfer() {
    if (!source || !target || submitting) return;
    setSubmitting(true);
    setMessage(null);
    const res = await transferAccountAction(source, target);
    setSubmitting(false);
    if (res.success) {
      setDone(true);
      setMessage({ type: "success", text: `Conta transferida para ${res.targetEmail || "o novo login"}.` });
      onDone();
    } else {
      setMessage({ type: "error", text: res.error || "Falha ao transferir a conta." });
    }
  }

  const targetRow = targets.find((r) => r.uid === target);
  const canSubmit = Boolean(source && target && !submitting && !done);

  return (
    <div className="fixed inset-0 z-overlay flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[2rem] shadow-2xl p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--accent-start)]/10 text-[var(--accent-start)] flex items-center justify-center">
              <ArrowRightLeft size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-[var(--text-primary)] tracking-tight">Transferir conta</h3>
              <p className="text-[10px] text-[var(--text-muted)] font-medium">Reassociar uma conta a um novo login</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Origem */}
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">
          Conta de origem (com os dados)
        </label>
        <select
          value={source}
          disabled={done}
          onChange={(e) => {
            setSource(e.target.value);
            loadSnapshot(e.target.value);
          }}
          className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl px-4 py-3 text-sm text-[var(--text-primary)] mb-3 focus:outline-none focus:border-[var(--accent-start)]/50"
        >
          <option value="">Selecione a conta…</option>
          {sources.map((r) => (
            <option key={r.matricula} value={r.matricula || ""}>
              {r.matricula} — {r.displayName || "sem nome"} — {r.email || "sem e-mail"}
            </option>
          ))}
        </select>

        {/* Resumo da origem */}
        {loadingSnap && (
          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mb-3">
            <Loader2 size={14} className="animate-spin" /> Carregando resumo…
          </div>
        )}
        {snapshot && (
          <div className="mb-4 p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-primary)] space-y-2">
            <div className="grid grid-cols-4 gap-2 text-center">
              <SnapCount label="Contratos" value={snapshot.counts.contracts} />
              <SnapCount label="Pedidos" value={snapshot.counts.orders} />
              <SnapCount label="Surveys" value={snapshot.counts.surveys} />
              <SnapCount label="Forms" value={snapshot.counts.forms} />
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">
              Login atual: <span className="font-mono">{snapshot.email || "-"}</span>
              {snapshot.hasCpf ? " · CPF cadastrado" : " · sem CPF"}
            </p>
            {snapshot.isAdmin && (
              <p className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600">
                <ShieldAlert size={12} /> Conta ADMIN — transfira com cuidado.
              </p>
            )}
            {snapshot.archived && (
              <p className="flex items-center gap-1.5 text-[10px] font-bold text-red-500">
                <AlertTriangle size={12} /> Conta arquivada.
              </p>
            )}
          </div>
        )}

        {/* Destino */}
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">
          Novo login de destino
        </label>
        <select
          value={target}
          disabled={done}
          onChange={(e) => setTarget(e.target.value)}
          className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl px-4 py-3 text-sm text-[var(--text-primary)] mb-4 focus:outline-none focus:border-[var(--accent-start)]/50"
        >
          <option value="">Selecione o login…</option>
          {targets.map((r) => (
            <option key={r.uid} value={r.uid || ""}>
              {r.email || "sem e-mail"} — {(r.uid || "").slice(0, 8)}… — {r.matricula || "sem conta"}
            </option>
          ))}
        </select>

        {/* Resumo da operacao */}
        {source && target && !done && (
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mb-4 p-3 rounded-xl bg-[var(--accent-start)]/5 border border-[var(--accent-start)]/15">
            A conta <b>{source}</b> passará a ser acessada por <b>{targetRow?.email || "o login destino"}</b>. O acesso
            antigo deixa de valer. Se o destino já tinha uma conta <b>vazia</b>, ela será arquivada (reversível). Contas
            com dados NÃO são sobrescritas — nesse caso a operação é bloqueada.
          </p>
        )}

        {message && (
          <div
            className={`flex items-start gap-2 text-[11px] leading-relaxed mb-4 p-3 rounded-xl border ${
              message.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                : "bg-red-500/10 border-red-500/20 text-red-500"
            }`}
          >
            {message.type === "success" ? <CheckCircle2 size={14} className="mt-0.5" /> : <AlertTriangle size={14} className="mt-0.5" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[var(--border-primary)] text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
          >
            {done ? "Fechar" : "Cancelar"}
          </button>
          {!done && (
            <button
              onClick={handleTransfer}
              disabled={!canSubmit}
              className="px-6 py-2.5 rounded-xl bg-[var(--accent-start)] text-white text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-[var(--accent-start)]/20 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] transition-all flex items-center gap-2"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <ArrowRightLeft size={14} />}
              {submitting ? "Transferindo…" : "Transferir"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SnapCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-2 rounded-xl bg-[var(--bg-primary)]/50">
      <div className="text-lg font-black text-[var(--text-primary)]">{value}</div>
      <div className="text-[8px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{label}</div>
    </div>
  );
}
