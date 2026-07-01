"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FormConfig, FormResponse, FormFieldConfig, FormValue, FormSectionConfig } from "@/types/forms";
import { NavButton } from "@/components/ui/NavButton";
import { InputGlass } from "@/components/ui/InputGlass";
import { ChoiceButton } from "@/components/ui/ChoiceButton";
import { CheckboxItem } from "@/components/ui/CheckboxItem";
import { TextareaGlass } from "@/components/ui/TextareaGlass";
import { SelectGlass } from "@/components/ui/SelectGlass";
import { FileField } from "@/components/forms/SurveyFields/FileField";
import { submitGenericForm } from "@/actions/generic-form";
import { resolveUserIdentity } from "@/actions/survey-effects";
import { Loader2, FileCheck, AlertCircle, Search, Lock, FlaskConical } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { validateCPF, maskCPF, maskCEP, maskPhoneBR, lookupCEP } from "@/utils/validations";
import { GLOBAL_COUNTRIES } from "@/utils/locations";

interface FormsEngineProps {
  config: FormConfig;
  userUid: string;
  matricula?: string;
  onComplete?: (matricula: string) => void;
  customSubmit?: (responses: FormResponse) => Promise<void>;
  isPreview?: boolean;
  initialResponses?: FormResponse;
}

/**
 * FormsEngine (Motor de Formulários V2.1 🏗️)
 * Evoluído para suportar Seções Operacionais (Forms_Global).
 * Mantém retrocompatibilidade automática com o modelo de 'steps'.
 */
export function FormsEngine({ config, userUid, matricula: explicitMatricula, onComplete, customSubmit, isPreview, initialResponses }: FormsEngineProps) {
  const { user, nickname } = useAuthContext();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [responses, setResponses] = useState<FormResponse>(initialResponses || {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [matricula, setMatricula] = useState<string>(explicitMatricula || "");
  const [isCEPChecking, setIsCEPChecking] = useState(false);

  React.useEffect(() => {
    async function initForm() {
      if (explicitMatricula) {
        setMatricula(explicitMatricula);
        setResponses(prev => ({
          ...prev,
          matricula: explicitMatricula
        }));
      }

      if (userUid && !isPreview) {
        const mat = await resolveUserIdentity(config.id, {}, userUid);
        if (!explicitMatricula) {
          setMatricula(mat);
        }
        
        // Injeção de Dados de Perfil (Pre-fill Inteligente 🧠)
        setResponses(prev => ({
          ...prev,
          email: user?.email || prev.email,
          user_name: user?.displayName || prev.user_name,
          matricula: explicitMatricula || mat || prev.matricula
        }));
      } else if (isPreview) {
        // Dados Mock para Preview
        setResponses(prev => ({
          ...prev,
          email: "admin-preview@bplen.com",
          user_name: "Administrador (Preview)",
          matricula: "BP-PREVIEW-001"
        }));
      }
    }
    initForm();
  }, [userUid, config.id, user, explicitMatricula, isPreview]);

  // Efeito de Busca de CEP Automática (ViaCEP 🛰️)
  React.useEffect(() => {
    const cep = String(responses["cep"] || "").replace(/\D/g, "");
    if (cep.length === 8 && !isCEPChecking) {
      const runLookup = async () => {
        setIsCEPChecking(true);
        const data = await lookupCEP(cep);
        if (data) {
          setResponses(prev => ({
            ...prev,
            rua: data.street,
            cidade: data.city,
            estado: data.state,
            pais: "BR"
          }));
        }
        setIsCEPChecking(false);
      };
      runLookup();
    }
  }, [responses["cep"]]);

  // Normalização: Prioriza 'sections', fallback para 'steps'
  const allSections: FormSectionConfig[] = config.sections || config.steps || [];
  
  // Lógica de Visibilidade Dinâmica (Branching 🌲)
  const activeSections = allSections.filter(section => {
    if (!section.logic?.showIf) return true;
    const { fieldId, value } = section.logic.showIf;
    return responses[fieldId] === value;
  });

  const currentSection = activeSections[currentSectionIndex];
  const isLastSection = currentSectionIndex === activeSections.length - 1;

  if (!currentSection) {
    return (
      <div className="p-10 text-center text-[var(--text-muted)] italic">
        Configuração de formulário inválida ou vazia.
      </div>
    );
  }

  const handleNext = () => {
    if (!isLastSection) {
      setCurrentSectionIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (customSubmit) {
        await customSubmit(responses);
      } else {
        const res = await submitGenericForm(config, responses, userUid);
        if (onComplete) onComplete(res.matricula);
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Erro na submissão do FormsEngine:", error);
      alert(error.message || "Falha ao enviar formulário.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateResponse = (fieldId: string, value: FormValue, fieldConfig?: FormFieldConfig) => {
    let finalValue = value;

    // Aplicação de Máscaras em Tempo Real 🎭
    if (fieldConfig?.mask && typeof value === "string") {
      if (fieldConfig.mask === "cpf") finalValue = maskCPF(value);
      if (fieldConfig.mask === "cep") finalValue = maskCEP(value);
      if (fieldConfig.mask === "phone") finalValue = maskPhoneBR(value);
    }

    setResponses(prev => ({ ...prev, [fieldId]: finalValue }));

    // Validação Assíncrona/Instantânea 🛡️
    if (fieldConfig?.validation === "cpf" && typeof finalValue === "string") {
       const isValid = validateCPF(finalValue);
       setErrors(prev => ({
          ...prev,
          [fieldId]: isValid ? "" : "CPF inválido. Verifique os números."
       }));
    } else {
       // Limpa erro ao mudar se não for CPF
       if (errors[fieldId]) setErrors(prev => ({ ...prev, [fieldId]: "" }));
    }
  };

  // Renderizador de Átomos
  const renderField = (field: FormFieldConfig) => {
    const rawValue = responses[field.id];
    const error = errors[field.id];

    switch (field.type) {
      case "text":
        const textValue = (typeof rawValue === "string" || typeof rawValue === "number") ? rawValue : "";
        return (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              {field.label && <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">{field.label}</label>}
              {field.readOnly && <Lock size={10} className="text-gray-600 mr-2" />}
            </div>
            <div className="relative">
              <InputGlass
                autoFocus={field.autoFocus}
                placeholder={field.placeholder}
                readOnly={field.readOnly}
                onChange={(e) => updateResponse(field.id, e.target.value, field)}
                value={textValue}
                className={field.readOnly ? "opacity-60 cursor-not-allowed bg-black/10" : error ? "border-red-500/50" : ""}
              />
              {field.id === "cep" && isCEPChecking && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                   <Loader2 size={16} className="animate-spin text-[var(--accent-start)]" />
                </div>
              )}
            </div>
            {error && <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest ml-1">{error}</p>}
          </div>
        );
      case "select":
        const selectValue = typeof rawValue === "string" ? rawValue : "";
        const options = field.id === "pais" ? GLOBAL_COUNTRIES : (field.options || []);
        
        return (
          <div className="space-y-2">
            {field.label && <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">{field.label}</label>}
            <SelectGlass
              value={selectValue}
              onChange={(e) => updateResponse(field.id, e.target.value, field)}
              className={error ? "border-red-500/50" : ""}
            >
              <option value="" disabled>{field.placeholder || "Selecione uma opção"}</option>
              {options.map((opt) => {
                const label = typeof opt === "string" ? opt : opt.label;
                const val = typeof opt === "string" ? opt : opt.value;
                return <option key={val} value={val}>{label}</option>;
              })}
            </SelectGlass>
            {error && <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest ml-1">{error}</p>}
          </div>
        );
      case "choice":
        return (
          <div className="space-y-3">
             {field.label && <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">{field.label}</label>}
             <div className="flex flex-col gap-3">
                {field.options?.map((opt) => {
                  const label = typeof opt === "string" ? opt : opt.label;
                  const val = typeof opt === "string" ? opt : opt.value;
                  return (
                    <ChoiceButton
                      key={val}
                      active={rawValue === val}
                      onClick={() => updateResponse(field.id, val, field)}
                    >
                      {label}
                    </ChoiceButton>
                  );
                })}
             </div>
          </div>
        );
      case "checkbox":
        const currentVals = Array.isArray(rawValue) ? (rawValue as string[]) : [];
        return (
          <div className="space-y-3">
            {field.label && <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">{field.label}</label>}
            <div className="flex flex-col gap-2">
              {field.options?.map((opt) => {
                const label = typeof opt === "string" ? opt : opt.label;
                const val = typeof opt === "string" ? opt : opt.value;
                const isChecked = currentVals.includes(val);
                return (
                  <CheckboxItem
                    key={val}
                    label={label}
                    checked={isChecked}
                    onChange={() => {
                      const newVals = isChecked 
                        ? currentVals.filter((v: string) => v !== val)
                        : [...currentVals, val];
                      updateResponse(field.id, newVals, field);
                    }}
                  />
                );
              })}
            </div>
          </div>
        );
      case "textarea":
        const areaValue = typeof rawValue === "string" ? rawValue : "";
        return (
           <div className="space-y-2">
            {field.label && <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">{field.label}</label>}
            <TextareaGlass
              value={areaValue}
              onChange={(e) => updateResponse(field.id, e.target.value, field)}
              placeholder={field.placeholder}
              rows={4}
            />
          </div>
        );
      case "number":
        const numValue = typeof rawValue === "number" ? rawValue : "";
        return (
          <div className="space-y-2">
            {field.label && <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">{field.label}</label>}
            <InputGlass
              type="number"
              autoFocus={field.autoFocus}
              placeholder={field.placeholder}
              onChange={(e) => updateResponse(field.id, Number(e.target.value), field)}
              value={numValue}
            />
          </div>
        );
      case "date":
        const dateValue = typeof rawValue === "string" ? rawValue : "";
        return (
          <div className="space-y-2">
            {field.label && <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">{field.label}</label>}
            <InputGlass
              type="date"
              autoFocus={field.autoFocus}
              placeholder={field.placeholder}
              onChange={(e) => updateResponse(field.id, e.target.value, field)}
              value={dateValue}
            />
          </div>
        );
      case "file":
        return (
          <FileField
            id={field.id}
            label={field.label}
            type="Portfolio" // Genérico para forms operacionais
            matricula={matricula}
            value={(rawValue as { url: string; fileName: string } | null) || null}
            maxSizeMB={(field.metadata?.maxSizeMB as number) || 5}
            onChange={(val) => updateResponse(field.id, val, field)}
          />
        );
      case "info":
        return (
          <div className="p-4 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl">
            <p className="text-gray-600 text-sm leading-relaxed">{field.description}</p>
          </div>
        );
      default:
        return null;
    }
  };

  // Verifica se o passo atual pode avançar
  const canProgress = currentSection.fields.every(f => {
    if (errors[f.id]) return false; // Bloqueia se houver erro de validação (ex: CPF inválido)
    if (!f.required) return true;
    const val = responses[f.id];
    if (f.type === "checkbox") return Array.isArray(val) && val.length > 0;
    return val !== undefined && val !== null && String(val).trim().length > 0;
  });

  return (
    <div className="w-full max-w-[750px] mx-auto p-10 relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSectionIndex}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.3 }}
          className="min-h-[400px] flex flex-col justify-start relative pt-4 space-y-8"
        >
          {isPreview && (
            <div className="absolute top-0 right-0 p-2 rounded-lg bg-[var(--accent-start)]/5 border border-[var(--accent-start)]/10 text-[var(--accent-start)] text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
               <FlaskConical size={8} /> Modo Sandbox
            </div>
          )}
          {/* Cabeçalho da Seção (Evolução Semântica: Título Operacional) */}
          <div className="space-y-2 text-left">
            <h2 className="text-[var(--text-primary)] text-[22px] font-bold tracking-tight leading-tight">
              {currentSection.title || currentSection.question}
            </h2>
            {currentSection.description && (
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                {currentSection.description}
              </p>
            )}
          </div>

          {/* Campos do Passo — Visibilidade Imediata */}
          <div className="space-y-6">
            {currentSection.fields.map(field => (
              <div key={field.id}>
                {renderField(field)}
              </div>
            ))}

            {/* Botão de Finalizar/Próximo acoplado ao fluxo */}
            <div className="pt-6">
               {isLastSection ? (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !canProgress}
                    className="w-full bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)] hover:opacity-90 text-white px-6 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest shadow-lg shadow-[var(--accent-start)]/20 transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? "Enviando..." : config.submitLabel || "Concluir Registro"}
                  </button>
               ) : (
                  <div className="flex justify-end">
                    <NavButton 
                      onClick={handleNext} 
                      disabled={!canProgress}
                    />
                  </div>
               )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
