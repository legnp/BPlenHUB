"use client";

import React, { useState } from "react";
import { CheckboxItem } from "@/components/ui/CheckboxItem";
import { InputGlass } from "@/components/ui/InputGlass";
import { Plus, X } from "lucide-react";

interface MultiSelectProps {
  options?: (string | { label: string; value: string })[];
  selected: string[];
  onChange: (updated: string[]) => void;
  minSelections?: number;
  maxSelections?: number;
  cols?: 1 | 2 | 3 | 4;
  placeholder?: string;
}

export function MultiSelect({ 
  options, 
  selected = [], 
  onChange, 
  minSelections, 
  maxSelections, 
  cols,
  placeholder 
}: MultiSelectProps) {
  const [inputValue, setInputValue] = useState("");

  const toggleOption = (val: string) => {
    const current = [...selected];
    const index = current.indexOf(val);
    
    if (index > -1) {
      current.splice(index, 1);
    } else {
      if (maxSelections && current.length >= maxSelections) return;
      current.push(val);
    }
    
    onChange(current);
  };

  const addTag = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Permite inserção de múltiplos itens separados por vírgula
    const tagsToAdd = trimmed
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const current = [...selected];
    let changed = false;

    for (const tag of tagsToAdd) {
      if (maxSelections && current.length >= maxSelections) break;
      if (!current.includes(tag)) {
        current.push(tag);
        changed = true;
      }
    }

    if (changed) {
      onChange(current);
    }
    setInputValue("");
  };

  const removeTag = (indexToRemove: number) => {
    const current = selected.filter((_, idx) => idx !== indexToRemove);
    onChange(current);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  // Se não temos opções definidas, renderiza como um Tag Input de inserção livre
  if (!options || options.length === 0) {
    const isLimitReached = maxSelections ? selected.length >= maxSelections : false;

    return (
      <div className="space-y-4">
        {maxSelections && (
          <p className="text-xs text-[var(--text-muted)] italic">
            Limite: {selected.length} de {maxSelections} palavras-chave adicionadas
          </p>
        )}
        
        <div className="flex gap-2">
          <InputGlass
            type="text"
            placeholder={isLimitReached ? "Limite de tags atingido" : (placeholder || "Digite e pressione Enter...")}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLimitReached}
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => addTag(inputValue)}
            disabled={isLimitReached || !inputValue.trim()}
            className="px-5 rounded-[14px] bg-[var(--accent-start)] hover:bg-[var(--accent-start)]/80 text-white font-semibold text-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed border border-[var(--accent-start)]/20"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar</span>
          </button>
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-white/5 border border-white/10 rounded-2xl">
            {selected.map((tag, idx) => (
              <span
                key={idx}
                className="bg-[var(--accent-start)]/10 border border-[var(--accent-start)]/20 text-white/90 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-[var(--accent-start)]/20 transition-all"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(idx)}
                  className="text-white/60 hover:text-white transition-colors rounded-full hover:bg-white/10 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  const getGridCols = () => {
    if (cols === 1) return "grid-cols-1";
    if (cols === 2) return "grid-cols-1 md:grid-cols-2";
    if (cols === 3) return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";
    if (cols === 4) return "grid-cols-2 md:grid-cols-4";

    // Default dinâmico para multi_select
    if (options.length <= 6) return "grid-cols-1 md:grid-cols-2";
    return "grid-cols-1";
  };

  return (
    <div className="space-y-3">
      {minSelections || maxSelections ? (
        <p className="text-xs text-[var(--text-muted)] mb-3 italic">
          Selecione {minSelections && `no mínimo ${minSelections}`}
          {minSelections && maxSelections && " e "}
          {maxSelections && `no máximo ${maxSelections}`}
        </p>
      ) : null}
      
      <div className={`grid gap-2 ${getGridCols()}`}>
        {options.map((opt) => {
          const label = typeof opt === "string" ? opt : opt.label;
          const val = typeof opt === "string" ? opt : opt.value;
          return (
            <CheckboxItem
              key={val}
              label={label}
              checked={selected.includes(val)}
              onChange={() => toggleOption(val)}
            />
          );
        })}
      </div>
    </div>
  );
}
