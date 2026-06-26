"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { SurveyFieldConfig } from "@/types/survey";
import { InputGlass } from "@/components/ui/InputGlass";
import { TextareaGlass } from "@/components/ui/TextareaGlass";

interface DynamicListProps {
  field: SurveyFieldConfig;
  value: Record<string, any>[];
  onChange: (value: Record<string, any>[]) => void;
}

// Máscara para MM/AAAA (Mês com 2 dígitos e Ano com 4 dígitos)
const formatMonthYear = (value: string) => {
  const digits = value.replace(/\D/g, "");
  const truncated = digits.slice(0, 6);
  if (truncated.length <= 2) {
    return truncated;
  }
  return `${truncated.slice(0, 2)}/${truncated.slice(2)}`;
};

export function DynamicList({ field, value = [], onChange }: DynamicListProps) {
  const items = Array.isArray(value) ? value : [];

  const handleAdd = () => {
    onChange([...items, {}]);
  };

  const handleRemove = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    onChange(newItems);
  };

  const handleChange = (index: number, subFieldId: string, subValue: any) => {
    const newItems = [...items];
    if (!newItems[index]) newItems[index] = {};
    newItems[index][subFieldId] = subValue;
    onChange(newItems);
  };

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {items.map((item, index) => (
        <div key={index} className="relative bg-[var(--input-bg)] border border-[var(--input-border)] p-6 rounded-2xl shadow-xl space-y-4 animate-fade-in">
          
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-black uppercase tracking-widest text-[var(--accent-start)]">
              Item {index + 1}
            </h4>
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="text-red-400 hover:text-red-300 transition-colors p-1"
              title="Remover"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field.subFields?.map((subField) => {
              const val = item[subField.id] || "";
              
              // Renderizador do título e da legenda amigável
              const renderLabelAndDesc = () => (
                <>
                  {subField.label && (
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]/75 ml-1 block">
                      {subField.label}
                    </label>
                  )}
                  {subField.description && (
                    <p className="text-xs text-[var(--text-muted)]/80 ml-1 mb-1.5 whitespace-pre-line leading-relaxed max-w-3xl">
                      {subField.description}
                    </p>
                  )}
                </>
              );

              // Renderização Especial para Período (Data de Início, Data de Término e Trabalho Atual/Em andamento side-by-side)
              if (subField.id === "periodo" || subField.id === "ano_conclusao") {
                const parts = typeof val === "string" ? val.split(" a ") : [];
                const startVal = parts[0] || "";
                const endVal = parts[1] || "";
                const isCurrent = endVal === "Atual";

                const handleStartChange = (newStart: string) => {
                  const formatted = formatMonthYear(newStart);
                  const endPart = isCurrent ? "Atual" : endVal;
                  handleChange(index, subField.id, formatted ? `${formatted} a ${endPart}` : "");
                };

                const handleEndChange = (newEnd: string) => {
                  const formatted = formatMonthYear(newEnd);
                  handleChange(index, subField.id, `${startVal} a ${formatted}`);
                };

                const handleCurrentChange = (checked: boolean) => {
                  if (checked) {
                    handleChange(index, subField.id, `${startVal} a Atual`);
                  } else {
                    handleChange(index, subField.id, `${startVal} a `);
                  }
                };

                const checkboxLabel = subField.id === "ano_conclusao" ? "Em andamento" : "Trabalho atual";

                return (
                  <div key={subField.id} className="col-span-1 md:col-span-2 space-y-3 pt-1">
                    {renderLabelAndDesc()}
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Data de Início */}
                      <div className="flex-1 space-y-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] ml-1">
                          Mês/Ano de Início
                        </span>
                        <InputGlass
                          placeholder="MM/AAAA"
                          maxLength={7}
                          value={startVal}
                          onChange={(e) => handleStartChange(e.target.value)}
                        />
                      </div>

                      {/* Data de Término */}
                      <div className="flex-1 space-y-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] ml-1">
                          Mês/Ano de Término
                        </span>
                        <InputGlass
                          placeholder={isCurrent ? "Atual" : "MM/AAAA"}
                          maxLength={7}
                          value={isCurrent ? "" : endVal}
                          onChange={(e) => handleEndChange(e.target.value)}
                          disabled={isCurrent}
                          className="disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Checkbox de Trabalho Atual */}
                      <div className="flex items-center gap-2 pt-5 sm:pt-4 ml-1">
                        <input
                          type="checkbox"
                          id={`${subField.id}-atual-${index}`}
                          checked={isCurrent}
                          onChange={(e) => handleCurrentChange(e.target.checked)}
                          className="w-4.5 h-4.5 rounded border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--accent-start)] focus:ring-[var(--accent-start)]/50 cursor-pointer accent-[var(--accent-start)]"
                        />
                        <label
                          htmlFor={`${subField.id}-atual-${index}`}
                          className="text-xs font-semibold text-[var(--text-primary)] cursor-pointer select-none"
                        >
                          {checkboxLabel}
                        </label>
                      </div>
                    </div>
                  </div>
                );
              }

              if (subField.type === "textarea") {
                return (
                  <div key={subField.id} className="col-span-1 md:col-span-2 space-y-2 pt-1">
                    {renderLabelAndDesc()}
                    <TextareaGlass
                      placeholder={subField.placeholder}
                      value={val as string}
                      onChange={(e) => handleChange(index, subField.id, e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                );
              }

              if (subField.type === "choice" || subField.type === "dropdown") {
                return (
                  <div key={subField.id} className="space-y-2 pt-1">
                    {renderLabelAndDesc()}
                    <div className="relative">
                      <select
                        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-4 py-3 pr-10 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)] transition-all appearance-none cursor-pointer"
                        value={val as string}
                        onChange={(e) => handleChange(index, subField.id, e.target.value)}
                      >
                        <option value="" disabled className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
                          Selecione...
                        </option>
                        {subField.options?.map((opt, i) => {
                          const optLabel = typeof opt === "string" ? opt : opt.label;
                          const optValue = typeof opt === "string" ? opt : opt.value;
                          return (
                            <option key={i} value={optValue} className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
                              {optLabel}
                            </option>
                          );
                        })}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-[var(--text-primary)]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 9l6 6 6-6"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              }

              if (subField.type === "dynamic_list") {
                return (
                  <div key={subField.id} className="col-span-1 md:col-span-2 space-y-2 pt-1">
                    {renderLabelAndDesc()}
                    <DynamicList
                      field={subField}
                      value={(val || []) as Record<string, any>[]}
                      onChange={(newVal) => handleChange(index, subField.id, newVal)}
                    />
                  </div>
                );
              }

              // Padrão: text, date, etc.
              return (
                <div key={subField.id} className="space-y-2 pt-1">
                  {renderLabelAndDesc()}
                  <InputGlass
                    type={subField.type === "date" ? "date" : "text"}
                    placeholder={subField.placeholder}
                    value={val as string}
                    onChange={(e) => handleChange(index, subField.id, e.target.value)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex justify-center mt-4">
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--accent-start)]/10 hover:bg-[var(--accent-start)]/20 border border-[var(--accent-start)]/20 transition-all text-sm font-semibold text-[var(--accent-start)] group"
        >
          <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
          {field.secondaryLabel || "Adicionar Novo"}
        </button>
      </div>
    </div>
  );
}
