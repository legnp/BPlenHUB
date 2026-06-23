"use client";

import React from "react";
import { CheckboxItem } from "@/components/ui/CheckboxItem";
import { InputGlass } from "@/components/ui/InputGlass";
import { SelectGlass } from "@/components/ui/SelectGlass";
import { TextareaGlass } from "@/components/ui/TextareaGlass";
import { ChoiceButton } from "@/components/ui/ChoiceButton";

export interface BenefitData {
  enabled: boolean;
  value?: string;
  currency?: string;
  company?: string;
  details?: string; 
  companyContributes?: boolean; 
  contributionCap?: string; 
  comments?: string; 
  calculationBase?: "percentage" | "salary_multiplier";
  salaryMultiplier?: string;
  percentageValue?: string;
  isGoalBased?: boolean;
  recurrence?: string;
  extraInfo?: string;
  [key: string]: unknown;
}

interface BenefitsPackageProps {
  value: Record<string, BenefitData>;
  onChange: (updated: Record<string, BenefitData>) => void;
  options: string[];
}

const CURRENCIES = [
  { label: "BRL (R$)", value: "BRL" },
  { label: "USD ($)", value: "USD" },
  { label: "EUR (€)", value: "EUR" },
  { label: "GBP (£)", value: "GBP" },
  { label: "CHF (CHF)", value: "CHF" },
  { label: "JPY (¥)", value: "JPY" },
  { label: "CAD ($)", value: "CAD" },
  { label: "AUD ($)", value: "AUD" },
  { label: "CNY (¥)", value: "CNY" },
];

const RECURRENCES = ["Mensal", "Trimestral", "Semestral", "Anual"];
const MULTIPLIERS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10+"];

const INSURERS = [
  "Bradesco Saúde/Seguros", "SulAmérica", "Amil", "Unimed", "Porto Seguro", 
  "NotreDame Intermédica", "Hapvida", "Seguros Unimed", "Allianz", "Care Plus", "Outro"
];

const FINANCIAL_FIELDS = [
  "salário", "comissão", "bônus", "plr", "vr/va flex", "vr", "va", 
  "expectativa salarial", "previdência privada"
];

const PERFORMANCE_FIELDS = ["bônus", "plr", "comissão"];

export function BenefitsPackage({ value = {}, onChange, options }: BenefitsPackageProps) {
  const updateBenefit = (id: string, updates: Partial<BenefitData>) => {
    const current = value[id] || { enabled: false };
    const updatedValue = { ...value, [id]: { ...current, ...updates } };
    onChange(updatedValue);
  };

  const toggleBenefit = (id: string) => {
    const current = value[id] || { enabled: false };
    const newEnabled = !current.enabled;
    
    // Ao ativar, define Moeda padrão se for financeiro
    const updates: Partial<BenefitData> = { enabled: newEnabled };
    if (newEnabled && FINANCIAL_FIELDS.includes(id.toLowerCase())) {
        updates.currency = "BRL";
    }
    
    updateBenefit(id, updates);
  };

  const handleValueChange = (id: string, rawStr: string, field: keyof BenefitData = "value") => {
    // Apenas números, pontos e vírgulas
    const filtered = rawStr.replace(/[^0-9,.]/g, "");
    updateBenefit(id, { [field]: filtered });
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.filter(o => o !== "Expectativa Salarial").map((opt) => {
          const isEnabled = value[opt]?.enabled;
          const labelLower = opt.toLowerCase();
          const isFinancial = FINANCIAL_FIELDS.includes(labelLower);
          const isInsurance = labelLower.includes("seguro");
          const isPension = labelLower === "previdência privada";
          const isPerformance = PERFORMANCE_FIELDS.includes(labelLower);

          // Lógica para detecção automática de "Outro" seguradora
          const currentInsurer = value[opt]?.company || "";
          const isKnownInsurer = INSURERS.includes(currentInsurer);
          const selectValue = isKnownInsurer ? currentInsurer : currentInsurer ? "Outro" : "";

          return (
            <div key={opt} className={`p-3.5 bg-white/5 border-[1px] border-white/10 rounded-[18px] space-y-4 transition-all ${isEnabled ? "ring-1 ring-[var(--accent-start)]/20 bg-white/[0.07]" : ""}`}>

              <CheckboxItem
                label={opt}
                checked={isEnabled}
                onChange={() => toggleBenefit(opt)}
              />

              {isEnabled && (
                <div className="space-y-4 pl-8 animate-fade-in-up">
                  {isFinancial && (
                    <div className="flex flex-col sm:flex-row gap-3">
                       <div className="w-full sm:w-[140px]">
                        <SelectGlass
                          label="Moeda"
                          value={value[opt]?.currency || "BRL"}
                          onChange={(e) => updateBenefit(opt, { currency: e.target.value })}
                        >
                          {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </SelectGlass>
                       </div>
                       <InputGlass
                        label="Valor"
                        placeholder="0,00"
                        value={value[opt]?.value || ""}
                        onChange={(e) => handleValueChange(opt, e.target.value)}
                      />
                    </div>
                  )}

                  {/* Detalhes para Performance (Bônus, PLR, Comissão) 📈 */}
                  {isPerformance && (
                    <div className="space-y-4 pt-2 border-t border-white/5 overflow-hidden">
                        {/* Base de Cálculo */}
                        <div className="space-y-2.5">
                            <label className="text-[10px] text-[var(--text-muted)] ml-1 font-medium uppercase tracking-wider">
                                Base de cálculo
                            </label>
                            <div className="flex gap-2">
                                <ChoiceButton 
                                    active={value[opt]?.calculationBase === "percentage"}
                                    onClick={() => updateBenefit(opt, { calculationBase: "percentage" })}
                                    className="flex-1 py-2 text-center"
                                >
                                    % Percentual
                                </ChoiceButton>
                                <ChoiceButton 
                                    active={value[opt]?.calculationBase === "salary_multiplier"}
                                    onClick={() => updateBenefit(opt, { calculationBase: "salary_multiplier" })}
                                    className="flex-1 py-2 text-center"
                                >
                                    Qtd. Salários
                                </ChoiceButton>
                            </div>
                        </div>

                        {/* Campo Dinâmico de Cálculo */}
                        {value[opt]?.calculationBase === "salary_multiplier" && (
                            <SelectGlass
                                label="Quantidade de salários"
                                value={value[opt]?.salaryMultiplier || ""}
                                onChange={(e) => updateBenefit(opt, { salaryMultiplier: e.target.value })}
                            >
                                <option value="">Selecione...</option>
                                {MULTIPLIERS.map(m => <option key={m} value={m}>{m}</option>)}
                            </SelectGlass>
                        )}

                        {value[opt]?.calculationBase === "percentage" && (
                            <InputGlass
                                label="Valor em %"
                                placeholder="0%"
                                value={value[opt]?.percentageValue || ""}
                                onChange={(e) => handleValueChange(opt, e.target.value, "percentageValue")}
                            />
                        )}

                        {/* Metas e Recorrência */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2.5">
                                <label className="text-[10px] text-[var(--text-muted)] ml-1 font-medium uppercase tracking-wider">
                                    Condicionado a meta?
                                </label>
                                <div className="flex gap-2">
                                    <ChoiceButton 
                                        active={value[opt]?.isGoalBased === true}
                                        onClick={() => updateBenefit(opt, { isGoalBased: true })}
                                        className="flex-1 py-1.5 text-xs text-center"
                                    >Sim</ChoiceButton>
                                    <ChoiceButton 
                                        active={value[opt]?.isGoalBased === false}
                                        onClick={() => updateBenefit(opt, { isGoalBased: false })}
                                        className="flex-1 py-1.5 text-xs text-center"
                                    >Não</ChoiceButton>
                                </div>
                            </div>

                            <SelectGlass
                                label="Recorrência"
                                value={value[opt]?.recurrence || ""}
                                onChange={(e) => updateBenefit(opt, { recurrence: e.target.value })}
                            >
                                <option value="">Selecione...</option>
                                {RECURRENCES.map(r => <option key={r} value={r}>{r}</option>)}
                            </SelectGlass>
                        </div>

                        <InputGlass
                            label="Complemento"
                            placeholder="Informação adicional..."
                            value={value[opt]?.extraInfo || ""}
                            onChange={(e) => updateBenefit(opt, { extraInfo: e.target.value })}
                        />
                    </div>
                  )}

                  {/* Detalhes para Previdência Divisão 🔘 */}
                  {isPension && (
                    <div className="space-y-4 pt-2 border-t border-white/5">
                        <div className="space-y-2.5">
                            <label className="text-[10px] text-[var(--text-muted)] ml-1 font-medium uppercase tracking-wider">
                                A empresa contribui também? (Matching)
                            </label>
                            <div className="flex gap-2">
                                <ChoiceButton 
                                    active={value[opt]?.companyContributes === true}
                                    onClick={() => updateBenefit(opt, { companyContributes: true })}
                                    className="flex-1 py-2 text-center"
                                >
                                    Sim
                                </ChoiceButton>
                                <ChoiceButton 
                                    active={value[opt]?.companyContributes === false}
                                    onClick={() => updateBenefit(opt, { companyContributes: false })}
                                    className="flex-1 py-2 text-center"
                                >
                                    Não
                                </ChoiceButton>
                            </div>
                        </div>

                        {value[opt]?.companyContributes === true && (
                            <InputGlass
                                label="Teto de contribuição em %"
                                placeholder="0%"
                                value={value[opt]?.contributionCap || ""}
                                onChange={(e) => handleValueChange(opt, e.target.value, "contributionCap")}
                            />
                        )}

                        <InputGlass
                            label="Comentários a respeito da previdência"
                            placeholder="Descreva aqui detalhes sobre o plano..."
                            value={value[opt]?.comments || ""}
                            onChange={(e) => updateBenefit(opt, { comments: e.target.value })}
                        />
                    </div>
                  )}

                  {isInsurance && (
                    <div className="space-y-3">
                         <SelectGlass
                            label="Seguradora / Operadora"
                            value={selectValue}
                            onChange={(e) => updateBenefit(opt, { company: e.target.value })}
                        >
                            <option value="">Selecione...</option>
                            {INSURERS.map(ins => <option key={ins} value={ins}>{ins}</option>)}
                        </SelectGlass>

                        {(selectValue === "Outro" || !isKnownInsurer) && (
                            <InputGlass
                                label="Qual é a seguradora?"
                                placeholder="Digite aqui o nome..."
                                value={currentInsurer === "Outro" ? "" : currentInsurer}
                                onChange={(e) => updateBenefit(opt, { company: e.target.value })}
                            />
                        )}
                    </div>
                  )}

                  {!isFinancial && !isInsurance && !isPension && !isPerformance && (
                    <p className="text-[10px] text-[var(--accent-start)] font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <span>✓</span> Selecionado
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Rodapé: Outros e Detalhes da Expectativa */}
      <div className="space-y-6 pt-6 border-t border-white/5">
        <InputGlass
          label="Algum outro benefício não listado?"
          placeholder="Descreva aqui..."
          value={value["outros"]?.value || ""}
          onChange={(e) => updateBenefit("outros", { enabled: true, value: e.target.value })}
        />

        {/* Campo Expectativa Salarial (Movido para aqui) */}
        {options.includes("Expectativa Salarial") && (
            <div className={`p-3.5 bg-white/5 border-[1px] border-white/10 rounded-[18px] space-y-4 transition-all ${value["Expectativa Salarial"]?.enabled ? "ring-1 ring-[var(--accent-start)]/20 bg-white/[0.07]" : ""}`}>

                <CheckboxItem
                    label="Expectativa Salarial"
                    checked={value["Expectativa Salarial"]?.enabled || false}
                    onChange={() => toggleBenefit("Expectativa Salarial")}
                />
                {value["Expectativa Salarial"]?.enabled && (
                    <div className="flex flex-col sm:flex-row gap-3 pl-8 animate-fade-in-up">
                        <div className="w-full sm:w-[140px]">
                            <SelectGlass
                                label="Moeda"
                                value={value["Expectativa Salarial"]?.currency || "BRL"}
                                onChange={(e) => updateBenefit("Expectativa Salarial", { currency: e.target.value })}
                            >
                                {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </SelectGlass>
                        </div>
                        <InputGlass
                            label="Valor"
                            placeholder="0,00"
                            value={value["Expectativa Salarial"]?.value || ""}
                            onChange={(e) => handleValueChange("Expectativa Salarial", e.target.value)}
                        />
                    </div>
                )}
            </div>
        )}

        <div className="animate-fade-in">
             <TextareaGlass
                label="Mais detalhes da expectativa"
                placeholder="Explique um pouco mais sobre suas expectativas (benefícios, motivos, etc)..."
                value={value["expectativa_detalhes"]?.value || ""}
                onChange={(e) => updateBenefit("expectativa_detalhes", { enabled: true, value: e.target.value })}
                rows={4}
            />
        </div>
      </div>
    </div>
  );
}
