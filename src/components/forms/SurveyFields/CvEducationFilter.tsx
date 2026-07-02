"use client";

import React, { useEffect, useState } from "react";
import { ToggleLeft, ToggleRight, GraduationCap, Award } from "lucide-react";
import type { SurveyValue } from "@/types/survey";

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
  conquistas: unknown;
  visible: boolean;
}

interface FilteredEducationState {
  formacoes: FormacaoFiltrada[];
  certificacoes_projetos: CertificacaoFiltrada[];
}

interface CvEducationFilterProps {
  value: SurveyValue;
  masterCvData: Record<string, SurveyValue> | null | undefined;
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
    const valueObj = value as Record<string, unknown> | null | undefined;
    if (valueObj && typeof valueObj === "object" && (Array.isArray(valueObj.formacoes) || Array.isArray(valueObj.certificacoes_projetos))) {
      setState({
        formacoes: (valueObj.formacoes as FormacaoFiltrada[]) || [],
        certificacoes_projetos: (valueObj.certificacoes_projetos as CertificacaoFiltrada[]) || []
      });
    } else if (masterCvData) {
      const masterFormacoes = (masterCvData.formacoes as Record<string, unknown>[] | undefined) || [];
      const formacoes: FormacaoFiltrada[] = masterFormacoes.map((form) => ({
        grau: String(form.grau || ""),
        curso: String(form.curso || ""),
        instituicao: String(form.instituicao || ""),
        ano_conclusao: String(form.ano_conclusao || ""),
        destaques: String(form.destaques || ""),
        visible: true
      }));

      const masterCertificacoes = (masterCvData.certificacoes_projetos as Record<string, unknown>[] | undefined) || [];
      const certificacoes_projetos: CertificacaoFiltrada[] = masterCertificacoes.map((cert) => ({
        nome: String(cert.nome || ""),
        instituicao: String(cert.instituicao || ""),
        data: String(cert.data || ""),
        objetivo: String(cert.objetivo || ""),
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

  const isProjectItem = (cert: CertificacaoFiltrada) => {
    const name = String(cert.nome || "").toLowerCase();
    const obj = String(cert.objetivo || "").toLowerCase();
    
    const projectKeywords = [
      "projeto", "project", "voluntari", "voluntary", 
      "freelance", "freelancer", "freela", 
      "desenvolvimento de", "criação de", "implementação de",
      "github", "portfolio", "portfólio", "website", "site",
      "trabalho acadêmico", "tcc", "artigo", "paper"
    ];
    
    return projectKeywords.some(kw => name.includes(kw) || obj.includes(kw));
  };

  const projects = state.certificacoes_projetos
    .map((cert, idx) => ({ cert, originalIdx: idx }))
    .filter(item => isProjectItem(item.cert));

  const certs = state.certificacoes_projetos
    .map((cert, idx) => ({ cert, originalIdx: idx }))
    .filter(item => !isProjectItem(item.cert));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full animate-fade-in">
      {/* Coluna Esquerda: Itens de Projeto */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Award className="w-5 h-5 text-[var(--accent-start)]" />
          <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">
            Projetos
          </h3>
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {projects.map(({ cert, originalIdx }) => (
              <div
                key={originalIdx}
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
                  onClick={() => toggleCertificacao(originalIdx)}
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
        ) : (
          <p className="text-xs text-[var(--text-muted)] italic px-1">Nenhum projeto cadastrado.</p>
        )}
      </div>

      {/* Coluna Direita: Cursos & Certificações */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <GraduationCap className="w-5 h-5 text-[var(--accent-start)]" />
          <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">
            Cursos & Certificações
          </h3>
        </div>

        {(state.formacoes.length > 0 || certs.length > 0) ? (
          <div className="grid grid-cols-1 gap-4">
            {/* Formações Acadêmicas */}
            {state.formacoes.map((form, idx) => (
              <div
                key={`form-${idx}`}
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

            {/* Certificações Extras */}
            {certs.map(({ cert, originalIdx }) => (
              <div
                key={`cert-${originalIdx}`}
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
                  onClick={() => toggleCertificacao(originalIdx)}
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
        ) : (
          <p className="text-xs text-[var(--text-muted)] italic px-1">Nenhum curso ou certificação cadastrado.</p>
        )}
      </div>
    </div>
  );
}
