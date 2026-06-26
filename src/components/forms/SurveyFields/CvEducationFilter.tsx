"use client";

import React, { useEffect, useState } from "react";
import { ToggleLeft, ToggleRight, GraduationCap, Award } from "lucide-react";

interface FormacaoFiltrada {
  grau: string;
  curso: string;
  instituicao: string;
  ano_conclusao: string;
  destaques: string;
  visible: boolean;
}

interface CertificacaoFiltrada {
  nome: string;
  instituicao: string;
  data: string;
  objetivo: string;
  conquistas: any;
  visible: boolean;
}

interface FilteredEducationState {
  formacoes: FormacaoFiltrada[];
  certificacoes_projetos: CertificacaoFiltrada[];
}

interface CvEducationFilterProps {
  value: any;
  masterCvData: any;
  targetPositionName: string;
  targetEmpresaName: string;
  onChange: (val: FilteredEducationState) => void;
}

export function CvEducationFilter({
  value,
  masterCvData,
  targetPositionName,
  targetEmpresaName,
  onChange
}: CvEducationFilterProps) {
  const [state, setState] = useState<FilteredEducationState>({ formacoes: [], certificacoes_projetos: [] });

  useEffect(() => {
    if (value && typeof value === "object" && (Array.isArray(value.formacoes) || Array.isArray(value.certificacoes_projetos))) {
      setState({
        formacoes: value.formacoes || [],
        certificacoes_projetos: value.certificacoes_projetos || []
      });
    } else if (masterCvData) {
      const formacoes: FormacaoFiltrada[] = (masterCvData.formacoes || []).map((form: any) => ({
        grau: form.grau || "",
        curso: form.curso || "",
        instituicao: form.instituicao || "",
        ano_conclusao: form.ano_conclusao || "",
        destaques: form.destaques || "",
        visible: true
      }));

      const certificacoes_projetos: CertificacaoFiltrada[] = (masterCvData.certificacoes_projetos || []).map((cert: any) => ({
        nome: cert.nome || "",
        instituicao: cert.instituicao || "",
        data: cert.data || "",
        objetivo: cert.objetivo || "",
        conquistas: cert.conquistas || [],
        visible: true
      }));

      const initial = { formacoes, certificacoes_projetos };
      setState(initial);
      onChange(initial);
    }
  }, [masterCvData, value]);

  const toggleFormacao = (idx: number) => {
    const formacoes = [...state.formacoes];
    formacoes[idx].visible = !formacoes[idx].visible;
    const updated = { ...state, formacoes };
    setState(updated);
    onChange(updated);
  };

  const toggleCertificacao = (idx: number) => {
    const certificacoes_projetos = [...state.certificacoes_projetos];
    certificacoes_projetos[idx].visible = !certificacoes_projetos[idx].visible;
    const updated = { ...state, certificacoes_projetos };
    setState(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-8 w-full animate-fade-in">
      {/* Seção Formações Acadêmicas */}
      {state.formacoes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <GraduationCap className="w-5 h-5 text-[var(--accent-start)]" />
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">
              Formação Acadêmica
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.formacoes.map((form, idx) => (
              <div
                key={idx}
                className={`border rounded-2xl p-5 backdrop-blur-md transition-all flex justify-between gap-4 items-start ${
                  form.visible
                    ? "bg-white/5 border-white/10 shadow-lg"
                    : "bg-white/[0.02] border-white/5 opacity-55"
                }`}
              >
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[var(--accent-start)] block">
                    Conclusão: {form.ano_conclusao.replace(/ a .*/, "") ? form.ano_conclusao : "N/D"}
                  </span>
                  <h4 className="text-sm font-bold leading-snug text-[var(--text-primary)]">
                    {form.grau} em {form.curso}
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] font-medium">
                    {form.instituicao}
                  </p>
                  {form.destaques && form.visible && (
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed italic border-l border-white/15 pl-2 mt-1">
                      {form.destaques}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => toggleFormacao(idx)}
                  className="focus:outline-none shrink-0"
                >
                  {form.visible ? (
                    <ToggleRight className="w-8 h-8 text-[var(--accent-start)]" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-[var(--text-muted)]" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seção Certificações e Projetos Extras */}
      {state.certificacoes_projetos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Award className="w-5 h-5 text-[var(--accent-start)]" />
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">
              Certificações & Projetos
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.certificacoes_projetos.map((cert, idx) => (
              <div
                key={idx}
                className={`border rounded-2xl p-5 backdrop-blur-md transition-all flex justify-between gap-4 items-start ${
                  cert.visible
                    ? "bg-white/5 border-white/10 shadow-lg"
                    : "bg-white/[0.02] border-white/5 opacity-55"
                }`}
              >
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[var(--accent-start)] block">
                    Conclusão: {cert.data || "N/D"}
                  </span>
                  <h4 className="text-sm font-bold leading-snug text-[var(--text-primary)]">
                    {cert.nome}
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] font-medium">
                    {cert.instituicao}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleCertificacao(idx)}
                  className="focus:outline-none shrink-0"
                >
                  {cert.visible ? (
                    <ToggleRight className="w-8 h-8 text-[var(--accent-start)]" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-[var(--text-muted)]" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
