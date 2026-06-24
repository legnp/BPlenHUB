"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { SurveyConfig, SurveyFieldConfig, SurveyValue } from "@/types/survey";
import { NarrativeReveal } from "@/components/ui/NarrativeReveal";
import { NavButton } from "@/components/ui/NavButton";
import { ChoiceButton } from "@/components/ui/ChoiceButton";
import { InputGlass } from "@/components/ui/InputGlass";
import { TextareaGlass } from "@/components/ui/TextareaGlass";
// CheckboxItem removido por não ser utilizado 🛡️


// Novos Componentes de Campo 🧬
import { MultiSelect } from "./SurveyFields/MultiSelect";
import { CascadedSelect } from "./SurveyFields/CascadedSelect";
import { BenefitsPackage, BenefitData } from "./SurveyFields/BenefitsPackage";
import { CurrencyGroup, CurrencyValue } from "./SurveyFields/CurrencyGroup";
import { LikertScale, LikertValue } from "./SurveyFields/LikertScale";
import { RankingField } from "./SurveyFields/RankingField";
import { LikertGroup } from "./SurveyFields/LikertGroup";
import { FileField } from "./SurveyFields/FileField";
import { EvidenceField } from "./SurveyFields/EvidenceField";
import { NarrativeContent } from "./NarrativeContent";
import { resolveUserIdentity, getUserMetadata } from "@/actions/survey-effects";
import { getPreviousSurveysDataAction } from "@/actions/submit-survey";
import Calendar, { CalendarEvent } from "@/components/ui/Calendar";
import { getProgramacaoForMemberAction } from "@/actions/calendar";



interface SurveyEngineProps {
  config: SurveyConfig;
  userUid: string;
  onComplete?: (matricula: string, responses?: Record<string, SurveyValue>) => void;
  onSubmitSuccess?: () => void;
  onStepChange?: (index: number, isLastStep: boolean) => void;
  returnToCheckoutSlug?: string;
  userNickname?: string | null;
  initialUserMetadata?: Record<string, unknown>;
}

/**
 * Utility: Fisher-Yates Shuffle
 * Mantém a opção "Outro" ou "Outros" sempre no final se existir.
 */
function shuffleOptions(options: string[] | { label: string; value: string; subOptions?: string[] }[]): typeof options {
  const otherIndex = (options as any[]).findIndex((opt: any) => {
    const label = (typeof opt === "string" ? opt : opt.label).toLowerCase();
    return label === "outro" || label === "outros" || label.startsWith("outro ");
  });

  const toShuffle = [...options] as any[];
  let other: any = null;
  if (otherIndex > -1) {
    other = toShuffle.splice(otherIndex, 1)[0];
  }

  for (let i = toShuffle.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [toShuffle[i], toShuffle[j]] = [toShuffle[j], toShuffle[i]];
  }

  if (other) toShuffle.push(other);
  return toShuffle as typeof options;
}

/**
 * SurveyEngine (Motor de Pesquisas V2.5 📊)
 * Focado em UX narrativa, progressão guiada e algoritmos de decisão.
 * Agora suporta NAVEGAÇÃO CONDICIONAL (Grafos).
 */
export function SurveyEngine({ config, userUid, onComplete, onSubmitSuccess, onStepChange, returnToCheckoutSlug, userNickname, initialUserMetadata }: SurveyEngineProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(() => {
    if (typeof window !== "undefined" && config.id === "survey_plano_fase4" && userUid) {
      const saved = localStorage.getItem(`survey_draft_${config.id}_${userUid}`);
      if (saved) {
        try {
          return JSON.parse(saved).stepIndex || 0;
        } catch(e) {}
      }
    }
    return 0;
  });
  const [responses, setResponses] = useState<Record<string, SurveyValue>>(() => {
    if (typeof window !== "undefined" && config.id === "survey_plano_fase4" && userUid) {
      const saved = localStorage.getItem(`survey_draft_${config.id}_${userUid}`);
      if (saved) {
        try {
          return JSON.parse(saved).responses || {};
        } catch(e) {}
      }
    }
    return {};
  });

  useEffect(() => {
    if (typeof window !== "undefined" && config.id === "survey_plano_fase4" && userUid) {
      localStorage.setItem(`survey_draft_${config.id}_${userUid}`, JSON.stringify({ responses, stepIndex: currentStepIndex }));
    }
  }, [responses, currentStepIndex, config.id, userUid]);

  useEffect(() => {
    if (onStepChange) {
      onStepChange(currentStepIndex, currentStepIndex === config.steps.length - 1);
    }
  }, [currentStepIndex, config.steps.length, onStepChange]);

  const [userMetadata, setUserMetadata] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = initialUserMetadata ? { ...initialUserMetadata } : {};
    if (userNickname) {
      initial.User_Nickname = userNickname;
    }
    return initial;
  });
  const [questionComplete, setQuestionComplete] = useState(false);
  const [typedComplete, setTypedComplete] = useState(false);
  const [showNextButton, setShowNextButton] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [startTime] = useState<number>(Date.now());
  const [matricula, setMatricula] = useState<string>("");
  // pendingUploads mantido apenas se for necessário para lógica de bloqueio de botão
  const [pendingUploads] = useState<number>(0);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  useEffect(() => {
    async function loadMatricula() {
      if (userUid) {
        const mat = await resolveUserIdentity(config.id, {}, userUid);
        setMatricula(mat);
        const meta = await getUserMetadata(userUid);
        
        let combinedMeta = { ...meta };
        if (config.id && config.id.startsWith("survey_plano_fase")) {
          try {
            const previousData = await getPreviousSurveysDataAction(mat);
            combinedMeta = { ...combinedMeta, ...previousData };
          } catch (err) {
            console.error("Erro ao carregar dados de pesquisas anteriores:", err);
          }
        }
        
        setUserMetadata(prev => ({ ...prev, ...combinedMeta }));
      }
    }
    loadMatricula();
  }, [userUid, config.id]);

  useEffect(() => {
    async function loadCalendarEvents() {
      setLoadingCalendar(true);
      try {
        const events = await getProgramacaoForMemberAction();
        setCalendarEvents(events || []);
      } catch (err) {
        console.error("Erro ao buscar programação de reuniões:", err);
      } finally {
        setLoadingCalendar(false);
      }
    }
    loadCalendarEvents();
  }, []);

  const currentStep = config.steps[currentStepIndex];

  // Preparação de campos (Randomização & Interceptação de C3 Customizado) 🧬
  const preparedFields = useMemo(() => {
    return currentStep.fields.map(field => {
      let currentOptions = field.options;
      if (field.id === "combustiveis_selecionados" && userMetadata?.combustiveis_custom && Array.isArray(userMetadata.combustiveis_custom) && userMetadata.combustiveis_custom.length > 0) {
        currentOptions = userMetadata.combustiveis_custom;
      } else if (field.id === "barreiras_selecionadas" && userMetadata?.barreiras_custom && Array.isArray(userMetadata.barreiras_custom) && userMetadata.barreiras_custom.length > 0) {
        currentOptions = userMetadata.barreiras_custom;
      }

      if (field.randomize && currentOptions && Array.isArray(currentOptions)) {
        return { ...field, options: shuffleOptions(currentOptions) };
      }
      return { ...field, options: currentOptions };
    });
  }, [currentStep.fields, userMetadata]);

  const isLastStep = currentStepIndex === config.steps.length - 1;

  // Lógica de Interpolação de Texto Reativa (Suporta {{nickname}} e {User-nickname}, arrays joined, fallbacks Maslow/carreira)
  const interpolate = (text: string) => {
    const combinedData: Record<string, unknown> = {
      ...(config.templateData || {}),
      ...userMetadata,
      ...responses
    };

    const menorPilar = combinedData["maslow_menor_pilar"] || combinedData["Maslow_Menor_Pilar"];
    const maiorPilar = combinedData["maslow_maior_pilar"] || combinedData["Maslow_Maior_Pilar"];

    if (menorPilar && maiorPilar) {
      combinedData["maslow_contexto"] = `Na nossa reunião de Devolutiva de Análise Comportamental, nós mapeamos o seu Termômetro de Maslow, e você avaliou que o pilar de **${menorPilar}** é o menos favorecido hoje.\n\nComo esse objetivo de carreira profissional que você acabou de traçar se conecta com a sua autoanálise? O seu objetivo te ajuda a fortalecer e equilibrar as camadas da pirâmide ou te faz se ancorar apenas para o pilar mais favorecido de **${maiorPilar}**?`;
    } else {
      combinedData["maslow_contexto"] = "De acordo com o seu Termômetro de Maslow mapeado na nossa reunião de Devolutiva de Análise Comportamental, você acredita que o seu objetivo de carreira profissional está direcionado a fortalecer e equilibrar as camadas da sua pirâmide para torná-la mais firme e saudável?";
    }

    let interpolated = text;

    // Normalizar chaves para busca case-insensitive e formatar valores dinâmicos
    const normalizedData: Record<string, string> = {};
    Object.entries(combinedData).forEach(([key, value]) => {
      let valStr = "";
      if (Array.isArray(value) && value.length > 0) {
        if (value.length === 1) {
          valStr = String(value[0]);
        } else if (value.length === 2) {
          valStr = `${value[0]} e ${value[1]}`;
        } else {
          valStr = `${value.slice(0, -1).join(", ")} e ${value[value.length - 1]}`;
        }
      } else if (typeof value === "object" && value !== null) {
        valStr = JSON.stringify(value);
      } else if (value !== undefined && value !== null) {
        valStr = String(value);
      }

      // Aplicar marcador de destaque automático para campos dinâmicos (exceto apelido e contexto longo de Maslow)
      const lowKey = key.toLowerCase();
      if (valStr && lowKey !== "user_nickname" && lowKey !== "maslow_contexto") {
        normalizedData[lowKey] = `==${valStr}==`;
      } else {
        normalizedData[lowKey] = valStr;
      }
    });

    // Encontrar todos os padrões {{Chave}} ou {Chave} no texto e substituir
    const regex = /\{\{([^}]+)\}\}|\{([^}]+)\}/g;
    let match;
    const matchesToReplace: Array<{ original: string; keyName: string }> = [];

    while ((match = regex.exec(text)) !== null) {
      const original = match[0];
      const keyName = (match[1] || match[2]).trim();
      matchesToReplace.push({ original, keyName });
    }

    matchesToReplace.forEach(({ original, keyName }) => {
      const lowerKey = keyName.toLowerCase();
      if (normalizedData[lowerKey] !== undefined && normalizedData[lowerKey] !== "") {
        interpolated = interpolated.replace(original, normalizedData[lowerKey]);
      } else {
        // Fallbacks inteligentes para Maslow e referências de outras etapas
        let fallback = "";
        if (lowerKey === "user_nickname") {
          fallback = (combinedData["User_Nickname"] as string) || (userMetadata?.name ? (userMetadata.name as string).split(" ")[0] : "Membro");
        } else if (lowerKey === "maslow_menor_pilar") {
          fallback = "Segurança/Estima";
        } else if (lowerKey === "maslow_maior_pilar") {
          fallback = "Autorrealização";
        } else if (lowerKey === "objetivo_principal_fase1" || lowerKey === "objetivo_principal") {
          fallback = "seu objetivo de carreira";
        } else if (lowerKey === "barreiras_selecionadas") {
          fallback = "suas barreiras mapeadas";
        } else if (lowerKey === "combustiveis_selecionados") {
          fallback = "seus combustíveis de aceleração";
        } else {
          fallback = `[${keyName}]`;
        }
        interpolated = interpolated.replace(original, fallback);
      }
    });

    // Fallback explícito para User_Nickname
    const fallbackName = (combinedData["User_Nickname"] as string) || (userMetadata?.name ? (userMetadata.name as string).split(" ")[0] : "Membro");
    interpolated = interpolated.replace(/\{\{User_Nickname\}\}/gi, fallbackName);
    interpolated = interpolated.replace(/\{User_Nickname\}/gi, fallbackName);

    return interpolated;
  };

  const currentQuestion = interpolate(currentStep.question);
  const currentDescription = currentStep.description ? interpolate(currentStep.description) : "";


  useEffect(() => {
    setQuestionComplete(false);
    setTypedComplete(false);
    setShowNextButton(false);
  }, [currentStepIndex]);

  const handleInteraction = () => {
    if (!showNextButton) setShowNextButton(true);
  };

  const onTypedComplete = () => {
    setTypedComplete(true);
    // Se o passo não tiver campos ou apenas campos 'info', mostramos o botão de avançar automaticamente 🛡️
    const onlyInfo = currentStep.fields.every(f => f.type === "info");
    if (onlyInfo || currentStep.fields.length === 0) {
      setShowNextButton(true);
    }
  };

  const handleQuestionComplete = () => {
    setQuestionComplete(true);
    if (!currentDescription) {
      onTypedComplete();
    }
  };

  /* Removido: Gatilho automático precoce que causava reflow. 
     Agora a conclusão é coordenada pelo fluxo de digitação real. 🚀 */


  const handleNext = () => {
    // 1. Verificar Lógica Condicional (Salto de Grafo) 🧬
    const firstField = currentStep.fields[0];
    
    if (firstField) {
      const userValue = responses[firstField.id];
      if (firstField.logic && typeof userValue === "string" && firstField.logic[userValue]) {
        const nextStepId = firstField.logic[userValue];
        const nextIndex = config.steps.findIndex(s => s.id === nextStepId);
        if (nextIndex !== -1) {
          setCurrentStepIndex(nextIndex);
          return;
        }
      }
    }

    // 2. Verificar Salto de Etapa Fixo (ID direta) 🧬
    if (currentStep.nextStepId) {
      const nextIndex = config.steps.findIndex(s => s.id === currentStep.nextStepId);
      if (nextIndex !== -1) {
        setCurrentStepIndex(nextIndex);
        return;
      }
    }

    // 3. Fallback para Progressão Linear
    if (!isLastStep) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const endTime = Date.now();
      const durationSeconds = Math.round((endTime - startTime) / 1000);
      
      const payload = {
        ...responses,
        metadata: {
          ...(responses.metadata as Record<string, unknown> || {}),
          startTime,
          endTime,
          durationSeconds
        }
      };

      const { submitSurvey } = await import("@/actions/submit-survey");
      const res = await submitSurvey(config, payload, userUid);
      
      if (typeof window !== "undefined" && config.id === "survey_plano_fase4" && userUid) {
        localStorage.removeItem(`survey_draft_${config.id}_${userUid}`);
      }

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      
      if (config.completionMessage) {
        setIsFinished(true);
      } else if (onComplete) {
        onComplete(res.matricula || "", responses);
      }
    } catch (err: unknown) {
      console.error("Erro na submissão do SurveyEngine:", err);
      alert("Houve um erro ao enviar sua pesquisa. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateResponse = (fieldId: string, value: SurveyValue) => {
    setResponses(prev => ({ ...prev, [fieldId]: value }));
    handleInteraction();
  };

  const getFieldGridCols = (field: SurveyFieldConfig) => {
    // 1. Prioridade para configuração explícita 🎯
    if (field.cols === 1) return "grid-cols-1";
    if (field.cols === 2) return "grid-cols-1 md:grid-cols-2";
    if (field.cols === 3) return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";
    if (field.cols === 4) return "grid-cols-2 md:grid-cols-4";

    // 2. Regra Global Padrão (Smart Default) 💎
    const options = (field.options as (string | { label: string; value: string })[]) || [];
    const isShortList = options.length <= 6;
    const allShortLabels = options.every(opt => {
        const label = typeof opt === "string" ? opt : opt?.label;
        return (label?.length || 0) < 20;
    });

    // Se a lista for curta e os nomes pequenos, usamos 2 colunas por padrão no desktop
    if (isShortList && allShortLabels && options.length > 1) {
        return "grid-cols-1 md:grid-cols-2";
    }

    return "grid-cols-1";
  };

  // Renderizador de Átomos Narrativos (Extendido)
  const renderField = (field: SurveyFieldConfig) => {
    const rawValue = responses[field.id];

    switch (field.type) {
      case "buttons":
      case "choice":
        if (field.isMultiple) {
          const isOtherSelected = Array.isArray(rawValue) && rawValue.some(v => {
            const val = String(v).toLowerCase();
            return val === "outro" || val === "outros";
          });

          return (
            <div className="space-y-4">
              <MultiSelect
                options={field.options as string[]}
                selected={(rawValue as string[]) || []}
                onChange={(val) => updateResponse(field.id, val)}
                minSelections={field.validation?.minSelections}
                maxSelections={field.validation?.maxSelections}
                cols={field.cols}
              />
              {isOtherSelected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="pt-2"
                >
                  <InputGlass
                    placeholder="Por favor, detalhe sua necessidade..."
                    value={String(responses[`${field.id}_other`] || "")}
                    onChange={(e) => updateResponse(`${field.id}_other`, e.target.value)}
                    autoFocus
                  />
                </motion.div>
              )}
            </div>
          );
        }
        return (
          <div className="space-y-4">
            {field.label && (
              <label className="text-xs font-bold uppercase tracking-tight text-[var(--text-muted)] ml-1">
                {field.label}
              </label>
            )}
            <div className={`grid gap-3 ${getFieldGridCols(field)}`}>
              {((field.options as (string | { label: string; value: string })[]) || []).map((opt) => {
                const label = typeof opt === "string" ? opt : opt.label;
                const val = typeof opt === "string" ? opt : opt.value;
                return (
                  <ChoiceButton
                    key={val}
                    active={rawValue === val}
                    onClick={() => updateResponse(field.id, val)}
                  >
                    {label}
                  </ChoiceButton>
                );
              })}
            </div>
            
            {/* Campo Condicional "Outro" / "Indicação" 🧬 */}

            {(rawValue === "Outro" || rawValue === "Outros" || rawValue === "Indicação") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="pt-2"
              >
                <InputGlass
                  placeholder={rawValue === "Indicação" ? "Quem te indicou?" : "Por favor, descreva aqui..."}
                  value={String(responses[`${field.id}_other`] || "")}
                  onChange={(e) => updateResponse(`${field.id}_other`, e.target.value)}
                  autoFocus
                />
              </motion.div>
            )}
          </div>
        );


      case "multi_select":
        const isMultiOtherSelected = Array.isArray(rawValue) && rawValue.some(v => {
          const val = String(v).toLowerCase();
          return val === "outro" || val === "outros";
        });

        return (
          <div className="space-y-4">
            <MultiSelect
              options={field.options as string[]}
              selected={(rawValue as string[]) || []}
              onChange={(val) => updateResponse(field.id, val)}
              minSelections={field.validation?.minSelections}
              maxSelections={field.validation?.maxSelections}
              cols={field.cols}
            />
            {isMultiOtherSelected && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="pt-2"
              >
                <InputGlass
                  placeholder="Por favor, detalhe sua necessidade..."
                  value={String(responses[`${field.id}_other`] || "")}
                  onChange={(e) => updateResponse(`${field.id}_other`, e.target.value)}
                  autoFocus
                />
              </motion.div>
            )}
          </div>
        );

      case "cascaded":
        return (
          <CascadedSelect
            options={field.options as { label: string; value: string; subOptions?: string[] }[]}
            value={rawValue as { primary: string; secondary: string }}
            onChange={(val) => updateResponse(field.id, val)}
            labels={{ primary: field.label || "Nicho", secondary: field.secondaryLabel || "Subdivisão" }}
          />
        );

      case "benefits":
        return (
          <BenefitsPackage
            options={field.options as string[]}
            value={rawValue as Record<string, BenefitData>}
            onChange={(val) => updateResponse(field.id, val)}
          />
        );

      case "currency_group":
        return (
          <CurrencyGroup
            labels={field.options as string[]}
            value={rawValue as Record<string, CurrencyValue>}
            onChange={(val) => updateResponse(field.id, val)}
          />
        );
      case "likert":
        return (
          <LikertScale
            value={rawValue as LikertValue}
            onChange={(val: LikertValue) => updateResponse(field.id, val)}
            options={field.options as string[]}
          />
        );
      
      case "likert_group":
        return (
          <LikertGroup
            statements={field.options as string[]}
            value={(rawValue as Record<string, number>) || {}}
            onChange={(val: Record<string, number>) => updateResponse(field.id, val)}
          />
        );


      
      case "ranking":
        return (
          <RankingField
            options={field.options as string[]}
            value={(rawValue as Record<string, number>) || {}}
            onChange={(val) => updateResponse(field.id, val)}
          />
        );

      case "text":
        return (
          <div className="space-y-2 pt-2">
            {field.label && (
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-start)] ml-1">
                {field.label}
              </label>
            )}
            <InputGlass
              autoFocus={field.autoFocus}
              placeholder={field.placeholder || "Escreva aqui..."}
              value={String(rawValue || "")}
              onChange={(e) => updateResponse(field.id, e.target.value)}
            />
          </div>
        );

      case "image":
        return (
          <div className="flex justify-center py-4 animate-fade-in">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={field.imageUrl} 
              alt={field.label || "Visualizacao"} 
              className="max-h-[320px] object-contain rounded-2xl border border-white/10 shadow-xl bg-white/5 p-2"
            />
          </div>
        );

      case "textarea":
        return (
          <div className="space-y-2 pt-2">
            {field.label && (
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-start)] ml-1">
                {field.label}
              </label>
            )}
            <TextareaGlass
              autoFocus={field.autoFocus}
              placeholder={field.placeholder || "Descreva aqui..."}
              value={String(rawValue || "")}
              onChange={(e) => updateResponse(field.id, e.target.value)}
              rows={4}
            />
          </div>
        );
      case "date":
        return (
          <div className="space-y-2 pt-2">
            {field.label && (
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-start)] ml-1">
                {field.label}
              </label>
            )}
            <InputGlass
              type="date"
              autoFocus={field.autoFocus}
              value={String(rawValue || "")}
              onChange={(e) => updateResponse(field.id, e.target.value)}
            />
          </div>
        );


      case "scale":
        const scaleOptions = (field.options as string[]) || ["1", "2", "3", "4", "5"];
        return (
          <div className="space-y-8 pt-4">
            <div className="flex justify-between items-center gap-2 px-2 max-w-[500px] mx-auto">
              {scaleOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => updateResponse(field.id, opt)}
                  className={`
                    w-9 h-9 rounded-full border transition-all flex items-center justify-center font-semibold text-xs
                    ${rawValue === opt 
                      ? "bg-[var(--accent-start)] border-[var(--accent-start)] text-white shadow-lg shadow-[var(--accent-start)]/20 scale-110" 
                      : "bg-white/5 border-white/10 text-[var(--text-muted)] hover:border-[var(--accent-start)]/40 hover:bg-white/10"}
                  `}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Legenda Fixa e Delicada 🕊️ */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 px-4">
               {[
                 { v: "1", l: "Nunca" },
                 { v: "2", l: "Raramente" },
                 { v: "3", l: "Às vezes" },
                 { v: "4", l: "Quase sempre" },
                 { v: "5", l: "Sempre" }
               ].map(item => (
                 <div key={item.v} className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] font-black w-3.5 h-3.5 flex items-center justify-center rounded-full bg-white/10 text-[var(--text-muted)]">{item.v}</span>
                    <span className="text-[10px] uppercase tracking-widest font-medium text-[var(--text-muted)]">{item.l}</span>
                 </div>
               ))}
            </div>
          </div>
        );

      case "file":
        return (
          <FileField
            id={field.id}
            label={field.label}
            type={field.id.includes("portfolio") ? "Portfolio" : "CV"}
            matricula={matricula}
            value={rawValue as { url: string; fileName: string } | null}
            maxSizeMB={field.id.includes("portfolio") ? 20 : 5}
            onChange={(val: { url: string; fileName: string } | null) => {
              updateResponse(field.id, val);
            }}
          />

        );

      case "evidence_upload":
        return (
          <EvidenceField
            id={field.id}
            label={field.label}
            matricula={matricula}
            value={rawValue as { url: string; fileName: string } | null}
            maxSizeMB={5}
            onChange={(val: { url: string; fileName: string } | null) => {
              updateResponse(field.id, val);
            }}
          />
        );

      case "info":
        return (
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-sm text-[var(--text-muted)] leading-relaxed italic">
              {field.label || "Informação adicional importante."}
            </p>
          </div>
        );

      case "portal_link":
        const targetUrl = (userMetadata.disc_link as string) || "#";
        return (
          <div className="flex flex-col items-center justify-center py-10 gap-6 glass bg-white/5 rounded-[2rem] border-white/10">
             <div className="p-5 rounded-3xl bg-[var(--accent-start)]/10 text-[var(--accent-start)]">
                <Rocket size={32} className="animate-pulse" />
             </div>
             <div className="text-center space-y-2">
                <h4 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Plataforma de Análise Ativada</h4>
                <p className="text-[10px] font-medium text-[var(--text-muted)] max-w-[280px] leading-relaxed">
                   Você será redirecionado para o portal oficial do DISC. Após concluir, retorne aqui para finalizar.
                </p>
             </div>
             <a 
               href={targetUrl}
               target="_blank"
               rel="noopener noreferrer"
               onPointerDown={() => updateResponse(field.id, "linked_portal_opened")}
               className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all flex items-center gap-2 ${
                  !userMetadata.disc_link 
                  ? "bg-gray-500/20 text-gray-500 cursor-not-allowed" 
                  : "bg-[var(--accent-start)] text-white shadow-[var(--accent-start)]/20 hover:scale-[1.02] active:scale-[0.98]"
               }`}
             >
                <Rocket size={16} />
                Iniciar Análise Agora
             </a>
             {!userMetadata.disc_link && (
               <p className="text-[10px] font-black text-red-500 uppercase tracking-widest animate-bounce">
                  ⚠️ Link não configurado. Contate o administrador.
               </p>
             )}
          </div>
        );

      case "slider":
        const minVal = 1;
        const maxVal = 100;
        const currentVal = rawValue !== undefined ? Number(rawValue) : 50;
        return (
          <div className="space-y-4 pt-4 pb-2">
            {field.label && (
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-start)] ml-1">
                {field.label}
              </label>
            )}
            
            <div className="relative pt-6 px-2">
              <input
                type="range"
                min={minVal}
                max={maxVal}
                value={currentVal}
                onChange={(e) => updateResponse(field.id, Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--accent-start)] outline-none focus:outline-none focus:ring-0"
                style={{
                  background: `linear-gradient(to right, var(--accent-start) 0%, var(--accent-start) ${((currentVal - minVal) / (maxVal - minVal)) * 100}%, rgba(255, 255, 255, 0.1) ${((currentVal - minVal) / (maxVal - minVal)) * 100}%, rgba(255, 255, 255, 0.1) 100%)`
                }}
              />
              
              {/* Dynamic Bubble showing the current value */}
              <div 
                className="absolute -top-3 px-2 py-1 bg-[var(--accent-start)] text-white text-[9px] font-black tracking-wider rounded-md shadow-lg shadow-[var(--accent-start)]/20 -translate-x-1/2 flex items-center justify-center min-w-[24px]"
                style={{
                  left: `${((currentVal - minVal) / (maxVal - minVal)) * 100}%`
                }}
              >
                {currentVal}
              </div>
            </div>

            {/* Extreme labels */}
            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60 px-1">
              <span>Muito Difícil (1)</span>
              <span>Totalmente Fácil (100)</span>
            </div>
          </div>
        );

      case "calendar_embed":
        return (
          <div className="space-y-4 pt-4">
            <Calendar
              events={calendarEvents}
              isLoading={loadingCalendar}
              onBookingSuccess={(bookedEvent) => {
                if (bookedEvent?.start) {
                  const dt = parseISO(bookedEvent.start);
                  const dataStr = format(dt, "dd/MM/yyyy");
                  const horaStr = format(dt, "HH:mm");
                  
                  setResponses(prev => ({
                    ...prev,
                    [field.id]: "agendado",
                    Data_Agendamento: dataStr,
                    Horario_Agendamento: horaStr
                  }));

                  setUserMetadata(prev => ({
                    ...prev,
                    Data_Agendamento: dataStr,
                    Horario_Agendamento: horaStr
                  }));

                  setTimeout(() => {
                    handleNext();
                  }, 1500);
                }
              }}
            />
          </div>
        );

      default:
        return <p className="text-red-500">Tipo de campo não suportado: {field.type}</p>;
    }
  };

  const isChoiceOther = (field: SurveyFieldConfig) => {
      if (field.type !== "choice" && field.type !== "buttons" && field.type !== "multi_select") return false;
      const val = responses[field.id];
      if (Array.isArray(val)) {
          return val.some(v => String(v).toLowerCase() === "outro" || String(v).toLowerCase() === "outros");
      }
      return String(val).toLowerCase() === "outro" || String(val).toLowerCase() === "outros" || String(val).toLowerCase() === "indicação";
  };

  const canProgress = currentStep.fields.every(f => {
    if (!f.required) return true;
    const val = responses[f.id];
    
    if (f.type === "multi_select" || f.isMultiple) {
      const arr = (val as string[]) || [];
      const min = f.validation?.minSelections || 1;
      const max = f.validation?.maxSelections;
      if (arr.length < min) return false;
      if (max && arr.length > max) return false;
      return true;
    }

    if (f.type === "cascaded") {
      const v = (val as any) || {};
      return !!v.primary && !!v.secondary;
    }
    if (f.type === "currency_group") {
      const v = (val as any) || {};
      return !!v.declined || Object.values(v).some((c: any) => !!c.value);
    }
    if (f.type === "likert") {
      const v = (val as any) || {};
      return !!v.score;
    }
    if (f.type === "likert_group") {
      const v = (val as Record<string, number>) || {};
      return (f.options?.length || 0) > 0 && Object.keys(v).length === f.options?.length;
    }

    if (f.type === "ranking") {
      const v = (val as Record<string, number>) || {};
      const usedRanks = Object.values(v);
      return usedRanks.length === f.options?.length && new Set(usedRanks).size === f.options?.length;
    }
    if (f.type === "slider") {
      return true; // Unblocked by default since it has initial value 50
    }
    if (f.type === "calendar_embed") {
      return val === "agendado"; // Valid once an appointment is made
    }
    if (f.type === "info") return true;
    return val !== undefined && val !== null && String(val).trim().length > 0;
  });

  if (isFinished) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-8 py-20 px-6 backdrop-blur-xl bg-white/5 rounded-[3rem] border border-white/10"
      >
        <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
           <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
           </svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Excelente!</h2>
        <p className="text-[var(--text-muted)] leading-relaxed max-w-md mx-auto whitespace-pre-line">
          {config.completionMessage}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onComplete?.("")}
            className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
             Explorar Plataforma
          </button>
          
          {returnToCheckoutSlug && (
             <Link
               href={`/hub/membro/checkout/${returnToCheckoutSlug}`}
               className="px-10 py-4 bg-[#ff0080] hover:bg-[#ff00b3] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_10px_20px_rgba(255,0,128,0.2)] flex items-center gap-2"
             >
                <Rocket size={14} /> Retornar à Contratação
             </Link>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-[750px] mx-auto relative">
      <AnimatePresence mode="wait">
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-[380px] flex flex-col justify-start relative pt-4"
          >
            {/* Bloco Narrativo Estabilizado v3.2 🎭 */}
            <div className="space-y-4 mb-6 min-h-[60px]">
              <NarrativeReveal 
                text={currentQuestion} 
                variant="h2"
                speed={40} 
                onComplete={handleQuestionComplete}
              />

            <div className="max-w-[640px] min-h-[0.5em]">
              {questionComplete && currentDescription && (
                <NarrativeContent 
                  text={currentDescription} 
                  speed={30}
                  onComplete={onTypedComplete}
                />
              )}
            </div>
          </div>



          <AnimatePresence>
            {typedComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                {currentStep.id === "step_q3_justificativa" && (() => {
                  const combinedDataForTable = {
                    ...userMetadata,
                    ...responses,
                  };
                  const selectedCombustiveis = Array.isArray(combinedDataForTable.combustiveis_selecionados) 
                    ? (combinedDataForTable.combustiveis_selecionados as string[]) 
                    : [];
                  const selectedBarreiras = Array.isArray(combinedDataForTable.barreiras_selecionadas) 
                    ? (combinedDataForTable.barreiras_selecionadas as string[]) 
                    : [];

                  return (
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 max-w-[640px] animate-fade-in">
                      <table className="w-full text-left border-collapse table-fixed">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="pb-3 text-[10px] font-black uppercase tracking-wider text-[var(--accent-start)] w-1/2">
                              Combustíveis (Aceleradores)
                            </th>
                            <th className="pb-3 text-[10px] font-black uppercase tracking-wider text-[var(--accent-start)] w-1/2 pl-4">
                              Barreiras (Freios)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: Math.max(selectedCombustiveis.length, selectedBarreiras.length) }).map((_, idx) => (
                            <tr key={idx} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                              <td className="py-2.5 pr-4 text-xs font-medium text-[var(--text-primary)] align-top break-words">
                                {selectedCombustiveis[idx] ? (
                                  <div className="flex items-start gap-2">
                                    <span className="text-[var(--accent-start)] font-bold mt-0.5">•</span>
                                    <span>{selectedCombustiveis[idx]}</span>
                                  </div>
                                ) : ""}
                              </td>
                              <td className="py-2.5 pl-4 text-xs font-medium text-[var(--text-primary)] align-top break-words">
                                {selectedBarreiras[idx] ? (
                                  <div className="flex items-start gap-2">
                                    <span className="text-red-400 font-bold mt-0.5">•</span>
                                    <span>{selectedBarreiras[idx]}</span>
                                  </div>
                                ) : ""}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                {(() => {
                  const borderClass = "border-t-2 border-[var(--border-primary)]/80 dark:border-white/20 my-8 shadow-sm";

                  if (currentStep.id === "step_q1_pequenas_metas" && preparedFields.length === 6) {
                    return (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          {renderField(preparedFields[0])}
                          {renderField(preparedFields[1])}
                        </div>
                        <hr className={borderClass} />
                        <div className="space-y-4">
                          {renderField(preparedFields[2])}
                          {renderField(preparedFields[3])}
                        </div>
                        <hr className={borderClass} />
                        <div className="space-y-4">
                          {renderField(preparedFields[4])}
                          {renderField(preparedFields[5])}
                        </div>
                      </div>
                    );
                  }

                  if (currentStep.id === "step_q2_checkpoints_90d" && preparedFields.length === 6) {
                    return (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                          {renderField(preparedFields[0])}
                          {renderField(preparedFields[1])}
                        </div>
                        <hr className={borderClass} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                          {renderField(preparedFields[2])}
                          {renderField(preparedFields[3])}
                        </div>
                        <hr className={borderClass} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                          {renderField(preparedFields[4])}
                          {renderField(preparedFields[5])}
                        </div>
                      </div>
                    );
                  }

                  // Helper para renderizar par de campos alinhados horizontalmente (desktop)
                  const renderPair = (f1: SurveyFieldConfig, f2: SurveyFieldConfig) => {
                    return (
                      <div className="space-y-2 md:space-y-0">
                        {/* Linha de Labels (Desktop) */}
                        <div className="hidden md:grid grid-cols-5 gap-x-6 mb-1.5">
                          <div className="col-span-2">
                            {f1.label && (
                              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-start)] ml-1">
                                {f1.label}
                              </label>
                            )}
                          </div>
                          <div className="col-span-3">
                            {f2.label && (
                              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-start)] ml-1">
                                {f2.label}
                              </label>
                            )}
                          </div>
                        </div>

                        {/* Linha de Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-stretch">
                          <div className="md:col-span-2 flex flex-col h-full">
                            <div className="md:hidden flex-1">
                              {renderField(f1)}
                            </div>
                            <div className="hidden md:block flex-1 h-full [&>div]:h-full [&_textarea]:h-full">
                              {renderField({ ...f1, label: undefined })}
                            </div>
                          </div>
                          <div className="md:col-span-3 flex flex-col h-full">
                            <div className="md:hidden flex-1">
                              {renderField(f2)}
                            </div>
                            <div className="hidden md:block flex-1 h-full [&>div]:h-full [&_textarea]:h-full">
                              {renderField({ ...f2, label: undefined })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  };

                  if (currentStep.id === "step_q3_aliados" && preparedFields.length === 6) {
                    return (
                      <div className="space-y-6">
                        {renderPair(preparedFields[0], preparedFields[1])}
                        <hr className={borderClass} />
                        {renderPair(preparedFields[2], preparedFields[3])}
                        <hr className={borderClass} />
                        {renderPair(preparedFields[4], preparedFields[5])}
                      </div>
                    );
                  }

                  if (currentStep.id === "step_q5_compromissos_autodesenvolvimento" && preparedFields.length === 6) {
                    return (
                      <div className="space-y-6">
                        {renderPair(preparedFields[0], preparedFields[1])}
                        <hr className={borderClass} />
                        {renderPair(preparedFields[2], preparedFields[3])}
                        <hr className={borderClass} />
                        {renderPair(preparedFields[4], preparedFields[5])}
                      </div>
                    );
                  }

                  return preparedFields.map(field => (
                    <div key={field.id} className="animate-fade-in">
                      {renderField(field)}
                    </div>
                  ));
                })()}

                <div className="pt-8">
                  {isLastStep ? (
                     <button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !canProgress}
                      className="w-full bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)] hover:opacity-90 text-white px-6 py-4 rounded-[14px] text-sm font-bold uppercase tracking-widest shadow-lg shadow-accent-start/20 transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? "Enviando..." : config.submitLabel || "Finalizar Pesquisa"}
                    </button>
                  ) : (
                    <div className="flex justify-end">
                      <AnimatePresence>
                        {showNextButton && canProgress && !pendingUploads && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                          >
                            <NavButton 
                              onClick={handleNext} 
                              label={currentStep.nextLabel} 
                            />
                          </motion.div>
                        )}

                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
