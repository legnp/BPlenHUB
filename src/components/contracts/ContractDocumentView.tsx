"use client";

import React from "react";

/**
 * Render rolável das cláusulas de um contrato (CT-3b, ver CONTRACTS-DESIGN.md §10).
 * Fonte única do conteúdo é `buildContractClauses` (src/lib/contract-content.ts) —
 * este componente só apresenta o que a action de preview devolve. Reutilizado pela
 * tela de contrato avulso e pela assinatura pós-checkout, para que nunca divirjam.
 *
 * Estilo em theme vars (padrão Gestão Funcional) — legível em todos os temas.
 */
export interface ContractClauseView {
  heading: string;
  body: string;
}

export function ContractDocumentView({
  clauses,
  title = "Contrato de Prestação de Serviço",
  hint = "Leia o contrato completo abaixo antes de assinar.",
}: {
  clauses: ContractClauseView[];
  title?: string;
  hint?: string;
}) {
  if (clauses.length === 0) return null;

  return (
    <div className="rounded-[2rem] bg-[var(--input-bg)] border border-[var(--border-primary)] overflow-hidden shadow-sm">
      <div className="px-6 pt-6 pb-3 border-b border-[var(--border-primary)]/40">
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{title}</p>
        <p className="text-[10px] text-[var(--text-muted)] mt-1">{hint}</p>
      </div>
      <div className="max-h-[380px] overflow-y-auto px-6 py-6 space-y-4 custom-scrollbar text-left">
        {clauses.map((c, i) => (
          <div key={i} className="space-y-1">
            <h4 className="text-xs font-black text-[var(--accent-start)]">{c.heading}</h4>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">{c.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
