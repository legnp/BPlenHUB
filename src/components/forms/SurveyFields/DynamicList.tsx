"use client";

import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { SurveyFieldConfig } from "@/types/survey";
import { InputGlass } from "@/components/ui/InputGlass";
import { TextareaGlass } from "@/components/ui/TextareaGlass";

interface DynamicListProps {
  field: SurveyFieldConfig;
  value: Record<string, string>[];
  onChange: (value: Record<string, string>[]) => void;
}

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

  const handleChange = (index: number, subFieldId: string, subValue: string) => {
    const newItems = [...items];
    if (!newItems[index]) newItems[index] = {};
    newItems[index][subFieldId] = subValue;
    onChange(newItems);
  };

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {items.map((item, index) => (
        <div key={index} className="relative bg-white/5 border border-white/10 p-6 rounded-2xl shadow-xl space-y-4">
          
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
              
              if (subField.type === "textarea") {
                return (
                  <div key={subField.id} className="col-span-1 md:col-span-2 space-y-1">
                    {subField.label && (
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/70 ml-1">
                        {subField.label}
                      </label>
                    )}
                    <TextareaGlass
                      placeholder={subField.placeholder}
                      value={val}
                      onChange={(e) => handleChange(index, subField.id, e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                );
              }

              if (subField.type === "choice") {
                return (
                  <div key={subField.id} className="space-y-1">
                    {subField.label && (
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/70 ml-1">
                        {subField.label}
                      </label>
                    )}
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent-start)] transition-colors appearance-none"
                      value={val}
                      onChange={(e) => handleChange(index, subField.id, e.target.value)}
                    >
                      <option value="" disabled className="text-black">
                        Selecione...
                      </option>
                      {subField.options?.map((opt, i) => {
                        const optLabel = typeof opt === "string" ? opt : opt.label;
                        const optValue = typeof opt === "string" ? opt : opt.value;
                        return (
                          <option key={i} value={optValue} className="text-black">
                            {optLabel}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                );
              }

              // Padrão: text, date, etc.
              return (
                <div key={subField.id} className="space-y-1">
                  {subField.label && (
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/70 ml-1">
                      {subField.label}
                    </label>
                  )}
                  <InputGlass
                    type={subField.type === "date" ? "date" : "text"}
                    placeholder={subField.placeholder}
                    value={val}
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
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-sm font-semibold text-white group"
        >
          <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
          {field.secondaryLabel || "Adicionar Novo"}
        </button>
      </div>
    </div>
  );
}
