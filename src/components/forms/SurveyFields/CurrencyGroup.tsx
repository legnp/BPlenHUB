"use client";

import React from "react";
import { InputGlass } from "@/components/ui/InputGlass";
import { ChevronDown } from "lucide-react";

export interface CurrencyValue {
  value: string;
  currency: string;
  declined?: boolean;
  [key: string]: unknown;
}

interface CurrencyGroupProps {
  value: Record<string, CurrencyValue>;
  onChange: (updated: Record<string, CurrencyValue>) => void;
  labels: string[]; 
}

const COMMON_CURRENCIES = ["BRL", "USD", "EUR", "GBP", "CAD", "JPY"];

export function CurrencyGroup({ value = {}, onChange, labels }: CurrencyGroupProps) {
  const updateCurrencyField = (label: string, updates: Partial<CurrencyValue>) => {
    const current = value[label] || { value: "", currency: "BRL" };
    const updatedValue = { ...value, [label]: { ...current, ...updates } };
    onChange(updatedValue);
  };

  const declineResponse = () => {
    onChange({ declined: { value: "declined", currency: "N/A", declined: true } });
  };

  if (value?.declined) {
    return (
      <div className="p-4 bg-white/[0.02] border-[1px] border-white/10 rounded-[18px] text-center">
        <p className="text-sm text-[var(--text-muted)] italic">Você optou por não responder este campo.</p>
        <button 
          onClick={() => onChange({})} 
          className="text-[10px] text-[var(--accent-start)] font-bold uppercase tracking-widest mt-3 hover:underline"
        >
          Desfazer e responder ↩️
        </button>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {labels.map((label) => (
          <div key={label} className="p-4 bg-white/[0.02] border-[1px] border-white/5 rounded-[18px] space-y-4 shadow-sm group">
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)] opacity-60 ml-1">
              Rendimento {label}
            </label>
            <div className="flex gap-2">
              <div className="relative group/select">
                <select
                  className="appearance-none bg-white/5 border-[1px] border-white/10 rounded-[14px] pl-3 pr-8 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]/50 transition-all cursor-pointer"

                  value={value[label]?.currency || "BRL"}
                  onChange={(e) => updateCurrencyField(label, { currency: e.target.value })}
                >
                  {COMMON_CURRENCIES.map(c => (
                    <option key={c} value={c} className="bg-[var(--bg-primary)] text-white">
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none group-hover:text-[var(--accent-start)] transition-colors" />
              </div>
              <div className="flex-1">
                <InputGlass
                  placeholder="0,00"
                  type="number"
                  value={value[label]?.value || ""}
                  onChange={(e) => updateCurrencyField(label, { value: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-2">
        <button 
          onClick={declineResponse}
          className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-white transition-all underline underline-offset-8 decoration-[var(--accent-start)]/30"
        >
          Prefiro não responder
        </button>
      </div>
    </div>
  );
}
