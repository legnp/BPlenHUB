"use client";

import React, { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { SurveyValue } from "@/types/survey";

interface ContactItem {
  value: string;
  visible: boolean;
}

interface CvContactFilterProps {
  value: SurveyValue;
  masterCvData: Record<string, SurveyValue> | null | undefined;
  onChange: (val: Record<string, ContactItem>) => void;
}

const FIELD_LABELS: Record<string, string> = {
  nome_completo: "Nome Completo",
  email_profissional: "E-mail Profissional",
  telefone: "Telefone de Contato",
  linkedin: "Perfil do LinkedIn",
  portfolio: "Portfólio / Página Web",
  localizacao: "Localização"
};

const montarContatosDoMestre = (
  master: Record<string, SurveyValue>
): Record<string, ContactItem> => ({
  nome_completo: { value: String(master.nome_completo || ""), visible: true },
  email_profissional: { value: String(master.email_profissional || ""), visible: true },
  telefone: { value: String(master.telefone || ""), visible: true },
  linkedin: { value: String(master.linkedin || ""), visible: true },
  portfolio: { value: String(master.portfolio || "nd"), visible: true },
  localizacao: { value: String(master.localizacao || ""), visible: true }
});

export function CvContactFilter({ value, masterCvData, onChange }: CvContactFilterProps) {
  const respostaSalva =
    value && typeof value === "object" && Object.keys(value).length > 0
      ? (value as Record<string, ContactItem>)
      : null;

  // `rascunho` guarda so o que o usuario alterou nesta sessao. Enquanto for
  // `null`, os dados sao DERIVADOS das props: resposta salva tem prioridade,
  // senao monta a partir do curriculo mestre. Derivar garante que os campos
  // aparecam preenchidos assim que `masterCvData` chegar, sem depender de uma
  // segunda passada dentro de um efeito.
  const [rascunho, setRascunho] = useState<Record<string, ContactItem> | null>(null);
  const data = rascunho ?? respostaSalva ?? montarContatosDoMestre(masterCvData || {});

  const toggleVisibility = (key: string) => {
    const updated = {
      ...data,
      [key]: {
        ...data[key],
        visible: !data[key].visible
      }
    };
    setRascunho(updated);
    onChange(updated);
  };

  // Permanece apenas para PROPAGAR o preenchimento ao motor de formularios: sem
  // isto os campos apareceriam na tela mas nao seriam gravados como resposta.
  // Nao escreve estado local, so notifica o pai.
  useEffect(() => {
    if (masterCvData && !respostaSalva) {
      onChange(montarContatosDoMestre(masterCvData));
    }
  }, [masterCvData]);

  return (
    <div className="space-y-4 w-full animate-fade-in">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur-md">
        {Object.keys(FIELD_LABELS).map((key) => {
          const item = data[key] || { value: "", visible: true };
          if (!item.value) return null;

          return (
            <div
              key={key}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 gap-3 hover:bg-white/10 transition-colors"
            >
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-start)]">
                  {FIELD_LABELS[key]}
                </span>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {item.value}
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggleVisibility(key)}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-all ${
                  item.visible
                    ? "bg-[var(--accent-start)]/10 border-[var(--accent-start)]/30 text-[var(--accent-start)] hover:bg-[var(--accent-start)]/20"
                    : "bg-white/5 border-white/10 text-[var(--text-muted)] hover:bg-white/10"
                }`}
              >
                {item.visible ? (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    Manter no CV
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    Ocultar no CV
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
