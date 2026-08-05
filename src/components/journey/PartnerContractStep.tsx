"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, FileText, Loader2 } from "lucide-react";
import { SubStepConfig } from "@/types/journey";
import { PartnerTermsDocument } from "@/types/partners";
import {
  getPartnerTermsAction,
  recordPartnerTermsAcceptanceAction,
} from "@/actions/partners/partner-consent";
import { ContractTermsCheckboxes, ContractTerm, allRequiredAccepted } from "@/components/contracts/ContractTermsCheckboxes";
import { BPLEN_NOMENCLATURE } from "@/config/nomenclature";

/**
 * Parada de Formalizacao da Parceria (tipo `contract`).
 *
 * A tela e' o continente; o conteudo e' dado. Texto, blocos e caixas de aceite vem do
 * documento publicado (ver `src/actions/partners/partner-consent.ts`) — documentos
 * novos entram sem tocar em codigo, que e' o que a Gestora pediu ao dizer
 * "provisionar espaco ... de acordo com os docs que serao adicionados posteriormente".
 *
 * Sem documento publicado, a parada assume o estado honesto de "em preparacao" e nao
 * permite concluir.
 */
export function PartnerContractStep({
  substep,
  status,
  onComplete,
}: {
  substep: SubStepConfig;
  status: "locked" | "available" | "current" | "completed";
  onComplete: () => void;
}) {
  const nomen = BPLEN_NOMENCLATURE.partner_journey;
  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState<PartnerTermsDocument | null>(null);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [accepted, setAccepted] = useState<string[]>([]);
  const [signedName, setSignedName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getPartnerTermsAction(substep.referenceId)
      .then((res) => {
        if (!active) return;
        setDocument(res.document);
        if (res.consent) {
          setAlreadySigned(true);
          setSignedName(res.consent.signedName);
          setAccepted(res.consent.acceptedIds);
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar o termo de parceria:", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [substep.referenceId]);

  const terms: ContractTerm[] = (document?.acceptances || []).map((a) => ({
    id: a.id,
    label: a.label,
    required: a.required,
  }));

  const canSign =
    !!document?.published &&
    signedName.trim().length >= 3 &&
    allRequiredAccepted(terms, accepted);

  const handleSign = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await recordPartnerTermsAcceptanceAction({
        documentId: substep.referenceId,
        signedName,
        acceptedIds: accepted,
      });
      if (!res.success) {
        setError(res.error || "Não foi possível registrar a assinatura agora.");
        return;
      }
      setAlreadySigned(true);
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-[var(--accent-start)]" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[var(--accent-start)]/10 rounded-xl flex items-center justify-center text-[var(--accent-start)]">
            <FileText size={16} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent-start)]">
            {nomen.badge_contract}
          </span>
        </div>
        <h2 className="text-3xl font-black tracking-tight">{document?.title || substep.title}</h2>
        {document?.intro ? (
          <p className="text-[12px] font-medium text-[var(--text-muted)] max-w-2xl leading-relaxed">
            {document.intro}
          </p>
        ) : null}
      </div>

      {!document?.published ? (
        <div className="p-10 rounded-[2.5rem] border border-dashed border-[var(--border-primary)] bg-[var(--input-bg)]/30 text-center space-y-3">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
            {nomen.instructions.contract_pending}
          </p>
          <p className="text-sm text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
            {nomen.instructions.contract_pending_desc}
          </p>
        </div>
      ) : (
        <>
          {/* Espaco de exibicao do texto do termo — blocos publicados, na ordem publicada */}
          <div className="max-h-[420px] overflow-y-auto custom-scrollbar p-8 rounded-[2rem] border border-[var(--border-primary)] bg-[var(--input-bg)]/30 space-y-6">
            {document.sections.map((section, index) => (
              <div key={`${section.title || "bloco"}-${index}`} className="space-y-2">
                {section.title ? (
                  <h3 className="text-sm font-black text-[var(--text-primary)]">{section.title}</h3>
                ) : null}
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                  {section.body}
                </p>
              </div>
            ))}
          </div>

          {alreadySigned ? (
            <div className="flex items-center gap-3 px-5 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <CheckCircle2 size={18} className="text-emerald-500" />
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-500">
                {nomen.instructions.contract_signed}
              </span>
            </div>
          ) : (
            <div className="space-y-6">
              {terms.length > 0 ? (
                <ContractTermsCheckboxes terms={terms} value={accepted} onChange={setAccepted} />
              ) : null}

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  {nomen.instructions.contract_signature_label}
                </label>
                <input
                  type="text"
                  value={signedName}
                  onChange={(e) => setSignedName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full bg-[var(--bg-primary)]/40 border border-[var(--border-primary)] rounded-2xl px-5 py-4 text-sm font-medium text-[var(--text-primary)] focus:border-[var(--accent-start)] outline-none transition-colors"
                />
              </div>

              {error ? <p className="text-sm text-red-500 font-medium">{error}</p> : null}

              <div className="flex justify-end">
                <button
                  onClick={handleSign}
                  disabled={!canSign || saving || status === "locked"}
                  className="px-10 py-4 bg-[var(--accent-start)] text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[var(--accent-start)]/20 disabled:opacity-30 disabled:hover:scale-100 flex items-center gap-3"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                  {nomen.actions.sign_contract}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
