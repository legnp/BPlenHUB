"use client";

import React from "react";

/**
 * Render rolável das cláusulas de um contrato (CT-3b, ver CONTRACTS-DESIGN.md §10).
 * Fonte única do conteúdo é `buildContractClauses` (src/lib/contract-content.ts) —
 * este componente só apresenta o que a action de preview devolve. Reutilizado pela
 * tela de contrato avulso e pela assinatura pós-checkout, para que nunca divirjam.
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
    <div className="rounded-[2rem] bg-white/5 border border-white/10 overflow-hidden">
      <div className="px-6 pt-6 pb-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{title}</p>
        <p className="text-[10px] text-gray-500 mt-1">{hint}</p>
      </div>
      <div className="max-h-[380px] overflow-y-auto px-6 pb-6 space-y-4 custom-scrollbar text-left">
        {clauses.map((c, i) => (
          <div key={i} className="space-y-1">
            <h4 className="text-xs font-black text-[#ff0080]">{c.heading}</h4>
            <p className="text-[11px] text-gray-300 leading-relaxed whitespace-pre-line">{c.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
