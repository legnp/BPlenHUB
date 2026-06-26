"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, CheckSquare, Square, ToggleLeft, ToggleRight, AlertCircle } from "lucide-react";

interface ConquistaItem {
  conquista: string;
  visible: boolean;
}

interface ExperienciaFiltrada {
  cargo: string;
  empresa: string;
  periodo: string;
  contexto: string;
  visible: boolean;
  conquistas: ConquistaItem[];
}

interface CvExperienceFilterProps {
  value: any;
  masterCvData: any;
  targetPositionDescription: string;
  targetPositionName: string;
  targetEmpresaName: string;
  senioridadePretendida: string;
  onChange: (val: ExperienciaFiltrada[]) => void;
}

export function CvExperienceFilter({
  value,
  masterCvData,
  targetPositionDescription,
  targetPositionName,
  targetEmpresaName,
  senioridadePretendida,
  onChange
}: CvExperienceFilterProps) {
  const [experiences, setExperiences] = useState<ExperienciaFiltrada[]>([]);
  const [showDesc, setShowDesc] = useState(false);

  // Determinar legenda dinâmica baseada na senioridade pretendida
  const isSeniorOrLeader =
    senioridadePretendida === "Sênior" ||
    senioridadePretendida === "Líder/C-Level" ||
    senioridadePretendida === "Dono do meu negócio";

  useEffect(() => {
    if (value && Array.isArray(value) && value.length > 0) {
      setExperiences(value);
    } else if (masterCvData && masterCvData.experiencias && Array.isArray(masterCvData.experiencias)) {
      const initial: ExperienciaFiltrada[] = masterCvData.experiencias.map((exp: any) => {
        const conquistasRaw = exp.conquistas || [];
        const conquistas: ConquistaItem[] = [];

        // Conquistas podem vir como string ou como array de objetos dependendo de como foram salvas
        if (Array.isArray(conquistasRaw)) {
          conquistasRaw.forEach((c: any) => {
            if (typeof c === "string") {
              conquistas.push({ conquista: c, visible: true });
            } else if (c && typeof c === "object") {
              conquistas.push({ conquista: c.conquista || c.value || "", visible: true });
            }
          });
        }

        return {
          cargo: exp.cargo || "",
          empresa: exp.empresa || "",
          periodo: exp.periodo || "",
          contexto: exp.contexto || "",
          visible: true,
          conquistas
        };
      });
      setExperiences(initial);
      onChange(initial);
    }
  }, [masterCvData, value]);

  const toggleExperience = (idx: number) => {
    const updated = [...experiences];
    updated[idx].visible = !updated[idx].visible;
    setExperiences(updated);
    onChange(updated);
  };

  const toggleAchievement = (expIdx: number, acIdx: number) => {
    const updated = [...experiences];
    updated[expIdx].conquistas[acIdx].visible = !updated[expIdx].conquistas[acIdx].visible;
    setExperiences(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* Legenda Dinâmica baseada na Senioridade */}
      <div className="flex gap-3 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
        <AlertCircle className="w-5 h-5 text-[var(--accent-start)] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-start)]">
            Estratégia Recomendada
          </span>
          <p className="text-sm font-medium leading-relaxed text-[var(--text-primary)]">
            {isSeniorOrLeader ? (
              <>
                Como você está mirando um cargo de liderança (<strong>{targetPositionName || "Alvo"}</strong>), o comitê executivo quer avaliar o seu impacto na cadeia completa do negócio. Selecione realizações que mostrem como você influenciou o ROI, market share ou a transformação de cultura, e como você pode replicar isso na <strong>{targetEmpresaName || "Empresa Alvo"}</strong>.
              </>
            ) : (
              <>
                O ATS da <strong>{targetEmpresaName || "Empresa Alvo"}</strong> vai buscar as ferramentas exatas que estão na descrição. Selecione os tópicos onde você aplicou as tecnologias e métodos exigidos para gerar resultados.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Botão de Expandir/Recolher Descrição da Posição */}
      {targetPositionDescription && (
        <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
          <button
            type="button"
            onClick={() => setShowDesc(!showDesc)}
            className="w-full flex items-center justify-between px-6 py-4 text-xs font-black uppercase tracking-widest text-[var(--text-primary)]/80 hover:bg-white/5 transition-colors"
          >
            <span>Consultar descrição da posição</span>
            {showDesc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showDesc && (
            <div className="px-6 pb-5 pt-1 border-t border-white/5 text-sm text-[var(--text-muted)] leading-relaxed whitespace-pre-line">
              {targetPositionDescription}
            </div>
          )}
        </div>
      )}

      {/* Lista de Experiências */}
      <div className="space-y-4">
        {experiences.map((exp, expIdx) => (
          <div
            key={expIdx}
            className={`border rounded-2xl p-6 backdrop-blur-md transition-all space-y-4 ${
              exp.visible
                ? "bg-white/5 border-white/10 shadow-lg"
                : "bg-white/[0.02] border-white/5 opacity-60"
            }`}
          >
            {/* Header da Experiência */}
            <div className="flex items-start justify-between gap-4 pb-2 border-b border-white/5">
              <div className="space-y-0.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--accent-start)]">
                  {exp.periodo}
                </span>
                <h4 className="text-base font-bold text-[var(--text-primary)]">
                  {exp.cargo} em <span className="opacity-80">{exp.empresa}</span>
                </h4>
              </div>

              <button
                type="button"
                onClick={() => toggleExperience(expIdx)}
                className="focus:outline-none"
                title={exp.visible ? "Ocultar experiência inteira" : "Manter experiência inteira"}
              >
                {exp.visible ? (
                  <ToggleRight className="w-9 h-9 text-[var(--accent-start)]" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-[var(--text-muted)]" />
                )}
              </button>
            </div>

            {exp.visible && (
              <>
                {/* Contexto */}
                {exp.contexto && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Contexto da Posição
                    </span>
                    <p className="text-sm text-[var(--text-primary)]/90 leading-relaxed">
                      {exp.contexto}
                    </p>
                  </div>
                )}

                {/* Conquistas / Realizações */}
                {exp.conquistas && exp.conquistas.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                      Selecione quais conquistas manter:
                    </span>
                    
                    <div className="space-y-2.5">
                      {exp.conquistas.map((ac, acIdx) => (
                        <div
                          key={acIdx}
                          onClick={() => toggleAchievement(expIdx, acIdx)}
                          className="flex items-start gap-3 p-3.5 rounded-xl border border-white/5 hover:bg-white/5 cursor-pointer transition-all select-none"
                        >
                          <div className="shrink-0 mt-0.5 text-[var(--accent-start)]">
                            {ac.visible ? (
                              <CheckSquare className="w-4 h-4" />
                            ) : (
                              <Square className="w-4 h-4 opacity-40 text-[var(--text-muted)]" />
                            )}
                          </div>
                          <span
                            className={`text-sm leading-relaxed ${
                              ac.visible
                                ? "text-[var(--text-primary)] font-medium"
                                : "text-[var(--text-muted)] line-through opacity-50"
                            }`}
                          >
                            {ac.conquista}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
