"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Handshake, Loader2, RefreshCw, Upload, Users } from "lucide-react";
import { auth } from "@/lib/firebase";
import { FunctionalPageHeader } from "@/components/layout/FunctionalPageHeader";
import { StatTile } from "@/components/admin/StatTile";
import { getPartnersProgramListAction } from "@/actions/partners/directory";
import {
  addPartnerCycleCommentAction,
  advancePartnerCycleAdminAction,
  generateOrUpdatePartnerCyclesAction,
  getPartnerCyclesAdminAction,
  PartnerBillingCycle,
} from "@/actions/partners/billing-cycles";
import { uploadToUserDrive } from "@/actions/upload-to-drive";
import { PARTNER_CYCLE_STATUS_LABEL, PartnerCycleStatus } from "@/lib/partners/cycle-status";
import { PartnerTermsEditor } from "@/components/admin/PartnerTermsEditor";
import { cn } from "@/lib/utils";

/**
 * Programa de Parceria — operacao dos ciclos de repasse (admin).
 *
 * Distinto de `/admin/partners`, que e a vitrine de parceiros estrategicos. Aqui se
 * opera o dinheiro: gerar/atualizar o ciclo, abrir a apuracao, corrigir o valor,
 * aprovar, recusar recibo e registrar o pagamento.
 *
 * Nenhuma acao decide o status por conta propria: todas passam pela maquina de estados
 * no servidor, que recusa o que nao for permitido e devolve o motivo. Botao desabilitado
 * aqui e' conforto — a trava de verdade e' la.
 */

type PartnerRow = {
  partnerMatricula: string;
  displayName: string;
  name: string;
  active: boolean;
  commissionPercent: number;
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

const TONE: Record<PartnerCycleStatus, string> = {
  nenhuma_indicacao: "bg-[var(--input-bg)] text-[var(--text-muted)] border-[var(--border-primary)]",
  em_andamento: "bg-[var(--accent-soft)] text-[var(--accent-start)] border-[var(--accent-start)]/20",
  em_apuracao: "bg-amber-500/10 text-amber-500 border-amber-500/25",
  emita_recibo: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  aguardando_repasse: "bg-blue-500/10 text-blue-500 border-blue-500/25",
  concluido: "bg-emerald-500/10 text-emerald-500 border-emerald-500/25",
};

export default function PartnersProgramPage() {
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [selected, setSelected] = useState<PartnerRow | null>(null);
  const [cycles, setCycles] = useState<PartnerBillingCycle[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [loadingCycles, setLoadingCycles] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "erro"; text: string } | null>(null);
  const [tab, setTab] = useState<"ciclos" | "termo">("ciclos");
  const [adjustDraft, setAdjustDraft] = useState<Record<string, string>>({});
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    auth.currentUser
      ?.getIdToken()
      .then((token) => getPartnersProgramListAction(token))
      .then((rows) => {
        if (active && rows) setPartners(rows);
      })
      .catch((error) => console.error("Erro ao listar parceiros do programa:", error))
      .finally(() => {
        if (active) setLoadingPartners(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const loadCycles = useCallback(async (partner: PartnerRow) => {
    setLoadingCycles(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await getPartnerCyclesAdminAction(partner.partnerMatricula, token);
      setCycles(res.cycles);
      if (res.error) setFeedback({ tone: "erro", text: res.error });
    } finally {
      setLoadingCycles(false);
    }
  }, []);

  const selectPartner = async (partner: PartnerRow) => {
    setSelected(partner);
    setFeedback(null);
    await loadCycles(partner);
  };

  const handleGenerate = async () => {
    if (!selected) return;
    setBusy("gerar");
    setFeedback(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await generateOrUpdatePartnerCyclesAction(selected.partnerMatricula, token);
      if (!res.success) {
        setFeedback({ tone: "erro", text: res.error || "Não foi possível gerar os ciclos." });
        return;
      }
      setFeedback({ tone: "ok", text: `${res.cyclesTouched ?? 0} ciclo(s) recalculado(s).` });
      await loadCycles(selected);
    } finally {
      setBusy(null);
    }
  };

  const runTransition = async (
    cycle: PartnerBillingCycle,
    transition: "aprovar_apuracao" | "corrigir_valor" | "aprovar_valor_final" | "rejeitar_recibo" | "registrar_pagamento",
    extra?: { adjustedValue?: number; paymentProof?: { url: string; fileName: string } }
  ) => {
    if (!selected) return;
    setBusy(`${cycle.cycleId}:${transition}`);
    setFeedback(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await advancePartnerCycleAdminAction(
        { partnerMatricula: selected.partnerMatricula, cycleId: cycle.cycleId, transition, ...extra },
        token
      );
      if (!res.success) {
        setFeedback({ tone: "erro", text: res.error || "Ação não permitida para este ciclo." });
        return;
      }
      await loadCycles(selected);
    } finally {
      setBusy(null);
    }
  };

  const handleProofUpload = async (cycle: PartnerBillingCycle, file: File) => {
    if (!selected) return;
    setBusy(`${cycle.cycleId}:registrar_pagamento`);
    setFeedback(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        setFeedback({ tone: "erro", text: "Sessão expirada. Recarregue a página." });
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("matricula", selected.partnerMatricula);
      formData.append("idToken", idToken);
      formData.append("type", `COMPROVANTE_REPASSE_${cycle.cycleId}`);

      const upload = await uploadToUserDrive(formData);
      if (!upload.success || !upload.url) {
        setFeedback({ tone: "erro", text: upload.error || "Falha ao enviar o comprovante." });
        return;
      }

      await runTransition(cycle, "registrar_pagamento", {
        paymentProof: { url: upload.url, fileName: upload.fileName || file.name },
      });
    } finally {
      setBusy(null);
    }
  };

  const handleComment = async (cycle: PartnerBillingCycle) => {
    if (!selected) return;
    const text = (commentDraft[cycle.cycleId] || "").trim();
    if (!text) return;
    setBusy(`${cycle.cycleId}:comentar`);
    try {
      const res = await addPartnerCycleCommentAction({
        cycleId: cycle.cycleId,
        text,
        partnerMatricula: selected.partnerMatricula,
      });
      if (!res.success) {
        setFeedback({ tone: "erro", text: res.error || "Não foi possível enviar a mensagem." });
        return;
      }
      setCommentDraft((prev) => ({ ...prev, [cycle.cycleId]: "" }));
      await loadCycles(selected);
    } finally {
      setBusy(null);
    }
  };

  const totalPendente = cycles
    .filter((c) => c.status !== "concluido" && c.status !== "nenhuma_indicacao")
    .reduce((acc, c) => acc + c.payableValue, 0);

  return (
    <div className="max-w-[1440px] mx-auto pt-[10px] px-6 md:px-12 pb-16 space-y-10 w-full">
      <FunctionalPageHeader
        eyebrow="Operação dos repasses de parceria"
        title="Programa de"
        titleAccent="Parceria"
        backHref="/admin"
        backLabel="Voltar"
        icon={<Handshake size={24} />}
      />

      <div className="flex gap-6 border-b border-[var(--border-primary)]/40">
        {([
          { id: "ciclos", label: "Ciclos de repasse" },
          { id: "termo", label: "Termo de parceria" },
        ] as const).map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "pb-3 text-[9px] font-black uppercase tracking-[0.2em] border-b-2 transition-all",
              tab === item.id
                ? "border-[var(--accent-start)] text-[var(--accent-start)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {feedback && tab === "ciclos" ? (
        <div
          className={cn(
            "p-5 rounded-2xl border text-sm font-medium",
            feedback.tone === "ok"
              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600"
              : "bg-red-500/5 border-red-500/20 text-red-500"
          )}
        >
          {feedback.text}
        </div>
      ) : null}

      {tab === "termo" ? <PartnerTermsEditor /> : null}

      <div className={cn("grid grid-cols-1 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)] gap-8 items-start", tab !== "ciclos" && "hidden")}>
        {/* Parceiros */}
        <aside className="space-y-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent-start)]">
            Parceiros
          </h2>

          {loadingPartners ? (
            <div className="p-8 flex justify-center">
              <Loader2 size={20} className="animate-spin text-[var(--accent-start)]" />
            </div>
          ) : partners.length === 0 ? (
            <div className="p-6 rounded-[1.5rem] border border-dashed border-[var(--border-primary)]">
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Nenhum parceiro no programa ainda. Conceda o acesso de parceiro na ficha do
                usuário e defina o nome de indicação — ele aparece aqui.
              </p>
            </div>
          ) : (
            partners.map((partner) => (
              <button
                key={partner.partnerMatricula}
                onClick={() => selectPartner(partner)}
                className={cn(
                  "w-full text-left p-5 rounded-[1.5rem] border transition-all",
                  selected?.partnerMatricula === partner.partnerMatricula
                    ? "bg-[var(--accent-start)]/5 border-[var(--accent-start)]/30"
                    : "bg-[var(--input-bg)]/40 border-[var(--border-primary)] hover:border-[var(--accent-start)]/20"
                )}
              >
                <p className="text-sm font-bold text-[var(--text-primary)]">{partner.displayName}</p>
                <p className="text-[10px] font-mono text-[var(--text-muted)] mt-1">{partner.partnerMatricula}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[var(--accent-start)]">
                    {partner.commissionPercent}% de comissão
                  </span>
                  {!partner.active ? (
                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">
                      acesso revogado
                    </span>
                  ) : null}
                </div>
              </button>
            ))
          )}
        </aside>

        {/* Ciclos do parceiro selecionado */}
        <section className="space-y-5">
          {!selected ? (
            <div className="p-12 rounded-[2rem] border border-dashed border-[var(--border-primary)] text-center">
              <Users size={28} className="mx-auto text-[var(--text-muted)] opacity-40 mb-3" />
              <p className="text-sm text-[var(--text-secondary)]">
                Selecione um parceiro para ver e operar os ciclos de repasse.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent-start)]">
                  Ciclos de {selected.displayName}
                </h2>
                <button
                  onClick={handleGenerate}
                  disabled={busy === "gerar"}
                  className="inline-flex items-center gap-2.5 px-6 py-3 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-transform disabled:opacity-40"
                >
                  {busy === "gerar" ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  Gerar / Atualizar ciclos
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatTile label="Ciclos registrados" value={cycles.length} tone="accent" />
                <StatTile label="Pendente de repasse" value={money(totalPendente)} tone="warning" />
              </div>

              {loadingCycles ? (
                <div className="p-10 flex justify-center">
                  <Loader2 size={22} className="animate-spin text-[var(--accent-start)]" />
                </div>
              ) : cycles.length === 0 ? (
                <div className="p-10 rounded-[2rem] border border-dashed border-[var(--border-primary)] text-center">
                  <p className="text-sm text-[var(--text-secondary)]">
                    Nenhum ciclo gerado. Use &quot;Gerar / Atualizar ciclos&quot; para calcular a partir das
                    compras dos indicados.
                  </p>
                </div>
              ) : (
                cycles.map((cycle) => {
                  const busyKey = (t: string) => busy === `${cycle.cycleId}:${t}`;
                  return (
                    <article
                      key={cycle.cycleId}
                      className="p-6 rounded-[2rem] border border-[var(--border-primary)] bg-[var(--input-bg)]/30 space-y-5"
                    >
                      <header className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-[var(--text-primary)]">{monthLabel(cycle.cycleId)}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-60 mt-1">
                            {cycle.totalIndications} indicação(ões) · calculado {money(cycle.totalCommissionValue)}
                          </p>
                        </div>
                        <span className={cn("px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest", TONE[cycle.status])}>
                          {PARTNER_CYCLE_STATUS_LABEL[cycle.status]}
                        </span>
                      </header>

                      <div className="flex flex-wrap items-end gap-6">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">A repassar</p>
                          <p className="text-xl font-black text-[var(--text-primary)]">{money(cycle.payableValue)}</p>
                        </div>
                        {cycle.invoiceUpload ? (
                          <a
                            href={cycle.invoiceUpload.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-start)] hover:underline"
                          >
                            Ver recibo enviado
                          </a>
                        ) : null}
                        {cycle.paymentProof ? (
                          <a
                            href={cycle.paymentProof.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:underline"
                          >
                            Ver comprovante
                          </a>
                        ) : null}
                      </div>

                      {/* Acoes por estado. A trava real esta no servidor; aqui so escondemos
                          o que nao faz sentido oferecer. */}
                      <div className="flex flex-wrap gap-3">
                        {cycle.status === "em_andamento" ? (
                          <button
                            onClick={() => runTransition(cycle, "aprovar_apuracao")}
                            disabled={busyKey("aprovar_apuracao")}
                            className="px-6 py-3 rounded-2xl bg-[var(--accent-start)] text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
                          >
                            Abrir apuração
                          </button>
                        ) : null}

                        {cycle.status === "em_apuracao" ? (
                          <>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={adjustDraft[cycle.cycleId] ?? String(cycle.payableValue)}
                                onChange={(e) => setAdjustDraft((prev) => ({ ...prev, [cycle.cycleId]: e.target.value }))}
                                className="w-28 px-3 py-2.5 bg-[var(--bg-primary)]/40 border border-[var(--border-primary)] rounded-xl text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]"
                              />
                              <button
                                onClick={() =>
                                  runTransition(cycle, "corrigir_valor", {
                                    adjustedValue: parseFloat(adjustDraft[cycle.cycleId] ?? String(cycle.payableValue)),
                                  })
                                }
                                disabled={busyKey("corrigir_valor")}
                                className="px-5 py-2.5 rounded-xl border border-[var(--border-primary)] text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40"
                              >
                                Corrigir valor
                              </button>
                            </div>
                            <button
                              onClick={() => runTransition(cycle, "aprovar_valor_final")}
                              disabled={busyKey("aprovar_valor_final")}
                              className="px-6 py-3 rounded-2xl bg-[var(--accent-start)] text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
                            >
                              Aprovar valor e pedir recibo
                            </button>
                          </>
                        ) : null}

                        {cycle.status === "aguardando_repasse" ? (
                          <>
                            <label className="inline-flex items-center gap-2.5 px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:scale-[1.02] transition-transform">
                              {busyKey("registrar_pagamento") ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Upload size={14} />
                              )}
                              Subir comprovante e concluir
                              <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleProofUpload(cycle, file);
                                }}
                              />
                            </label>
                            <button
                              onClick={() => runTransition(cycle, "rejeitar_recibo")}
                              disabled={busyKey("rejeitar_recibo")}
                              className="px-6 py-3 rounded-2xl border border-red-500/25 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/5 disabled:opacity-40"
                            >
                              Recusar recibo
                            </button>
                          </>
                        ) : null}
                      </div>

                      {/* Conversa do ciclo */}
                      <div className="space-y-3 pt-4 border-t border-[var(--border-primary)]">
                        {cycle.comments.length > 0 ? (
                          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
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
                                <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                                  {comment.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={commentDraft[cycle.cycleId] || ""}
                            onChange={(e) => setCommentDraft((prev) => ({ ...prev, [cycle.cycleId]: e.target.value }))}
                            onKeyDown={(e) => e.key === "Enter" && handleComment(cycle)}
                            placeholder="Mensagem para o parceiro"
                            className="flex-1 px-4 py-3 bg-[var(--bg-primary)]/40 border border-[var(--border-primary)] rounded-2xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]"
                          />
                          <button
                            onClick={() => handleComment(cycle)}
                            disabled={busyKey("comentar") || !(commentDraft[cycle.cycleId] || "").trim()}
                            className="px-5 py-3 rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] font-black uppercase tracking-widest disabled:opacity-30"
                          >
                            Enviar
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
