"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";

/**
 * Termo de aceite (clickwrap) configurável — CT-3b, ver CONTRACTS-DESIGN.md §10.
 * Data-driven: cada tela/audiência declara sua lista de termos (obrigatórios e
 * opcionais). Reutilizável pela tela de contrato avulso e pelo checkout.
 */
export interface ContractTerm {
  id: string;
  /** Rótulo do aceite (pode conter links para termos/privacidade). */
  label: React.ReactNode;
  required: boolean;
}

/** True se todos os termos OBRIGATÓRIOS estão entre os aceitos. */
export function allRequiredAccepted(terms: ContractTerm[], accepted: string[]): boolean {
  return terms.filter((t) => t.required).every((t) => accepted.includes(t.id));
}

export function ContractTermsCheckboxes({
  terms,
  value,
  onChange,
}: {
  terms: ContractTerm[];
  value: string[];
  onChange: (acceptedIds: string[]) => void;
}) {
  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  };

  return (
    <div className="space-y-3">
      {terms.map((term) => {
        const checked = value.includes(term.id);
        return (
          <label key={term.id} className="flex items-start gap-4 cursor-pointer group">
            <div className="relative mt-1 shrink-0">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={checked}
                onChange={() => toggle(term.id)}
              />
              <div className="w-5 h-5 rounded border border-[var(--border-primary)] peer-checked:bg-[var(--accent-start)] peer-checked:border-[var(--accent-start)] transition-all flex items-center justify-center">
                <CheckCircle2 size={14} className="text-white opacity-0 peer-checked:opacity-100" />
              </div>
            </div>
            <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed group-hover:text-[var(--text-primary)] transition-colors">
              {term.label}
              {!term.required ? <span className="ml-1 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">(opcional)</span> : null}
            </p>
          </label>
        );
      })}
    </div>
  );
}
