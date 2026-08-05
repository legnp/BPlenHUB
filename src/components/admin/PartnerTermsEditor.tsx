"use client";

import React, { useEffect, useState } from "react";
import { FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { getPartnerTermsAdminAction, savePartnerTermsAdminAction } from "@/actions/partners/terms-admin";
import { PARTNER_TERMS_TEMPLATE } from "@/lib/partners/terms-template";
import { PartnerTermsDocument } from "@/types/partners";
import { cn } from "@/lib/utils";

/**
 * Editor do Termo de Parceria (admin).
 *
 * O texto vive no banco: publicar e revisar nao passa por deploy. O modelo oficial pode
 * ser carregado como ponto de partida, e cada bloco declara QUANDO aparece — comercial,
 * vitrine publica ou sempre —, em vez de deixar a instrucao escrita no meio do contrato.
 */

const CONDITION_LABEL: Record<string, string> = {
  always: "Sempre",
  commercial: "Só em parceria remunerada",
  public_showcase: "Só com direito à vitrine pública",
};

const vazio = (): PartnerTermsDocument => ({
  version: "1.0",
  title: "",
  intro: "",
  sections: [],
  acceptances: [],
  published: false,
});

export function PartnerTermsEditor() {
  const [doc, setDoc] = useState<PartnerTermsDocument>(vazio());
  const [signedCount, setSignedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "erro"; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    auth.currentUser
      ?.getIdToken()
      .then((token) => getPartnerTermsAdminAction(undefined, token))
      .then((res) => {
        if (!active) return;
        if (res.document) setDoc(res.document);
        setSignedCount(res.signedCount);
      })
      .catch((error) => console.error("Erro ao carregar o termo:", error))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const patch = (changes: Partial<PartnerTermsDocument>) => setDoc((prev) => ({ ...prev, ...changes }));

  const handleSave = async (published: boolean) => {
    setSaving(true);
    setFeedback(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await savePartnerTermsAdminAction({ document: { ...doc, published } }, token);
      if (!res.success) {
        setFeedback({ tone: "erro", text: res.error || "Não foi possível salvar." });
        return;
      }
      setDoc((prev) => ({ ...prev, published }));
      setFeedback({
        tone: "ok",
        text: published ? "Termo publicado — já vale para assinatura." : "Rascunho salvo.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 size={22} className="animate-spin text-[var(--accent-start)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {feedback ? (
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

      <div className="flex flex-wrap items-center justify-between gap-3 p-5 rounded-[1.5rem] border border-[var(--border-primary)] bg-[var(--input-bg)]/40">
        <div className="flex items-center gap-3">
          <FileText size={18} className="text-[var(--accent-start)]" />
          <div>
            <p className="text-sm font-bold text-[var(--text-primary)]">
              {doc.published ? "Termo publicado" : "Rascunho — não vale para assinatura"}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-1">
              Versão {doc.version || "—"} · {signedCount} parceiro(s) já assinaram esta versão
            </p>
          </div>
        </div>
        <button
          onClick={() => setDoc({ ...PARTNER_TERMS_TEMPLATE })}
          className="px-5 py-2.5 rounded-xl border border-[var(--border-primary)] text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          Carregar modelo oficial
        </button>
      </div>

      {signedCount > 0 ? (
        <p className="text-[11px] text-amber-600 font-medium px-1">
          Mudar a versão faz os {signedCount} parceiro(s) que já assinaram precisarem assinar de novo.
          Ajustes de texto sem troca de versão não pedem nova assinatura.
        </p>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-[120px_minmax(0,1fr)] gap-4">
        <label className="space-y-1.5 block">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Versão</span>
          <input
            type="text"
            value={doc.version}
            onChange={(e) => patch({ version: e.target.value })}
            className="w-full px-4 py-3 bg-[var(--bg-primary)]/50 border border-[var(--input-border)] rounded-xl text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]/50"
          />
        </label>
        <label className="space-y-1.5 block">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Título</span>
          <input
            type="text"
            value={doc.title}
            onChange={(e) => patch({ title: e.target.value })}
            className="w-full px-4 py-3 bg-[var(--bg-primary)]/50 border border-[var(--input-border)] rounded-xl text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]/50"
          />
        </label>
      </div>

      <label className="space-y-1.5 block">
        <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          Introdução (aparece acima do texto)
        </span>
        <textarea
          value={doc.intro || ""}
          onChange={(e) => patch({ intro: e.target.value })}
          rows={2}
          className="w-full px-4 py-3 bg-[var(--bg-primary)]/50 border border-[var(--input-border)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]/50 resize-y"
        />
      </label>

      {/* Blocos */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent-start)]">
            Blocos do termo
          </h3>
          <button
            onClick={() => patch({ sections: [...doc.sections, { title: "", body: "", condition: "always" }] })}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-primary)] text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <Plus size={12} /> Bloco
          </button>
        </div>

        <p className="text-[11px] text-[var(--text-muted)] px-1">
          Marcadores disponíveis no texto: <code>{"{{partnerName}}"}</code>, <code>{"{{partnerDocument}}"}</code>,{" "}
          <code>{"{{partnerAddress}}"}</code>, <code>{"{{partnerMatricula}}"}</code> e{" "}
          <code>{"{{commissionPercent}}"}</code> — preenchidos com o cadastro de cada parceiro na hora de assinar.
        </p>

        {doc.sections.map((section, index) => (
          <div key={index} className="p-5 rounded-[1.5rem] border border-[var(--border-primary)] bg-[var(--input-bg)]/30 space-y-3">
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                value={section.title || ""}
                onChange={(e) => {
                  const sections = [...doc.sections];
                  sections[index] = { ...section, title: e.target.value };
                  patch({ sections });
                }}
                placeholder="Título do bloco"
                className="flex-1 min-w-[200px] px-4 py-3 bg-[var(--bg-primary)]/50 border border-[var(--input-border)] rounded-xl text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]/50"
              />
              <select
                value={section.condition}
                onChange={(e) => {
                  const sections = [...doc.sections];
                  sections[index] = {
                    ...section,
                    condition: e.target.value as typeof section.condition,
                  };
                  patch({ sections });
                }}
                className="px-4 py-3 bg-[var(--bg-primary)]/50 border border-[var(--input-border)] rounded-xl text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]/50"
              >
                {Object.entries(CONDITION_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => patch({ sections: doc.sections.filter((_, i) => i !== index) })}
                className="px-4 py-3 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/5"
                title="Remover bloco"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <textarea
              value={section.body}
              onChange={(e) => {
                const sections = [...doc.sections];
                sections[index] = { ...section, body: e.target.value };
                patch({ sections });
              }}
              rows={8}
              placeholder="Texto do bloco"
              className="w-full px-4 py-3 bg-[var(--bg-primary)]/50 border border-[var(--input-border)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]/50 resize-y leading-relaxed"
            />
          </div>
        ))}
      </section>

      {/* Aceites */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent-start)]">
            Caixas de aceite
          </h3>
          <button
            onClick={() =>
              patch({
                acceptances: [...doc.acceptances, { id: `aceite_${doc.acceptances.length + 1}`, label: "", required: true }],
              })
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-primary)] text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <Plus size={12} /> Aceite
          </button>
        </div>

        {doc.acceptances.map((acceptance, index) => (
          <div key={index} className="flex flex-wrap items-center gap-3 p-4 rounded-[1.5rem] border border-[var(--border-primary)] bg-[var(--input-bg)]/30">
            <input
              type="text"
              value={acceptance.id}
              onChange={(e) => {
                const acceptances = [...doc.acceptances];
                acceptances[index] = { ...acceptance, id: e.target.value };
                patch({ acceptances });
              }}
              placeholder="identificador"
              className="w-40 px-3 py-2.5 bg-[var(--bg-primary)]/50 border border-[var(--input-border)] rounded-xl text-[11px] font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]/50"
            />
            <input
              type="text"
              value={acceptance.label}
              onChange={(e) => {
                const acceptances = [...doc.acceptances];
                acceptances[index] = { ...acceptance, label: e.target.value };
                patch({ acceptances });
              }}
              placeholder="Texto que o parceiro marca"
              className="flex-1 min-w-[220px] px-4 py-2.5 bg-[var(--bg-primary)]/50 border border-[var(--input-border)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]/50"
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptance.required}
                onChange={(e) => {
                  const acceptances = [...doc.acceptances];
                  acceptances[index] = { ...acceptance, required: e.target.checked };
                  patch({ acceptances });
                }}
                className="accent-[var(--accent-start)]"
              />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                Obrigatório
              </span>
            </label>
            <button
              onClick={() => patch({ acceptances: doc.acceptances.filter((_, i) => i !== index) })}
              className="px-3 py-2.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/5"
              title="Remover aceite"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="px-8 py-4 rounded-2xl border border-[var(--border-primary)] text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : "Salvar rascunho"}
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          className="px-8 py-4 rounded-2xl bg-[var(--accent-start)] text-white text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-transform disabled:opacity-40"
        >
          Publicar termo
        </button>
      </div>
    </div>
  );
}
