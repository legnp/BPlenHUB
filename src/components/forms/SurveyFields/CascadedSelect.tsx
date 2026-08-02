"use client";

import React from "react";
import { ChoiceButton } from "@/components/ui/ChoiceButton";
import { InputGlass } from "@/components/ui/InputGlass";

interface Option {
  label: string;
  value: string;
  subOptions?: string[];
}

interface CascadedValue {
  primary: string;
  secondary: string;
  primaryOther?: string;
  secondaryOther?: string;
  [key: string]: unknown;
}

interface CascadedSelectProps {
  options: Option[];
  value: CascadedValue;
  onChange: (updated: CascadedValue) => void;
  labels: { primary: string; secondary: string };
}

export function CascadedSelect({ options, value, onChange, labels }: CascadedSelectProps) {
  // Derivado da prop durante o render — o componente e controlado pelo pai, que
  // sempre devolve o valor novo. Antes isso era estado sincronizado por efeito, o
  // que gerava render em cascata e podia deixar o nivel 2 defasado da prop por um
  // render (os botoes do nivel 1 sempre leram de `value.primary`, nao do estado).
  const selectedPrimary = options.find((o) => o.value === value?.primary) || null;

  const handlePrimaryChange = (opt: Option) => {
    onChange({
      primary: opt.value, 
      secondary: "",
      primaryOther: opt.value === "Outros" ? value?.primaryOther : undefined 
    });
  };

  const handleSecondaryChange = (val: string) => {
    onChange({ ...value, secondary: val });
  };

  return (
    <div className="space-y-8">
      {/* Nível 1: Primário (Nicho/Estágio) */}
      <div className="space-y-4">
        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-start)] ml-1">
          {labels.primary}
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {options.map((opt) => (
            <ChoiceButton
              key={opt.value}
              active={value?.primary === opt.value}
              onClick={() => handlePrimaryChange(opt)}
              className="py-2 flex items-center justify-center text-center"
            >
              <span className="text-[12px]">{opt.label}</span>
            </ChoiceButton>
          ))}
        </div>

        {value?.primary === "Outros" && (
           <InputGlass
            placeholder="Especifique..."
            value={value?.primaryOther || ""}
            onChange={(e) => onChange({ ...value, primaryOther: e.target.value })}
          />
        )}
      </div>

      {/* Nível 2: Secundário (Departamento/Anos Exp) - Só aparece após selecionar primário */}
      {selectedPrimary && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
           <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-start)] ml-1">
            {labels.secondary}
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {selectedPrimary.subOptions?.map((sub) => (
              <ChoiceButton
                key={sub}
                active={value?.secondary === sub}
                onClick={() => handleSecondaryChange(sub)}
                className="py-2 flex items-center justify-center text-center"
              >
                <span className="text-[12px]">{sub}</span>
              </ChoiceButton>
            ))}
          </div>
          {value?.secondary === "Outros" && (
            <InputGlass
              placeholder="Especifique..."
              value={value?.secondaryOther || ""}
              onChange={(e) => onChange({ ...value, secondaryOther: e.target.value })}
            />
          )}
        </div>
      )}
    </div>
  );
}
