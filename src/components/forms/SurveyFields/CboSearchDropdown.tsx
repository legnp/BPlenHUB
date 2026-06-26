"use client";

import React, { useState } from "react";
import { Search, ExternalLink } from "lucide-react";

interface CboItem {
  pt: string;
  en: string;
  cbo: string;
}

const CBO_DATABASE: CboItem[] = [
  { pt: "Analista de Relacionamento / Gerente de Relacionamento", en: "Customer Success Manager / Specialist", cbo: "1423-15" },
  { pt: "Gerente de Produto", en: "Product Manager (PM)", cbo: "1423-35" },
  { pt: "Dono do Produto / Coordenador de Projetos", en: "Product Owner (PO)", cbo: "1423-35" },
  { pt: "Desenvolvedor de Software / Engenheiro de Software", en: "Software Engineer / Developer", cbo: "3171-10" },
  { pt: "Analista de Sistemas", en: "Systems Analyst", cbo: "2124-05" },
  { pt: "Analista de Suporte Computacional", en: "Support Analyst / Engineer", cbo: "3172-10" },
  { pt: "Administrador de Banco de Dados", en: "Database Administrator (DBA)", cbo: "2123-05" },
  { pt: "Designer de Interface / Programador Visual", en: "UX/UI Designer", cbo: "2624-10" },
  { pt: "Analista de Dados / Engenheiro de Dados", en: "Data Analyst / Data Engineer", cbo: "2124-25" },
  { pt: "Cientista de Dados", en: "Data Scientist", cbo: "2124-25" },
  { pt: "Administrador de Redes / Engenheiro DevOps", en: "DevOps Engineer / Network Administrator", cbo: "2124-10" },
  { pt: "Analista de Seguranca da Informacao", en: "Security Analyst / Engineer", cbo: "2124-20" },
  { pt: "Analista de Marketing / Gerente de Marketing", en: "Marketing Analyst / Growth Specialist", cbo: "1423-10" },
  { pt: "Analista de Vendas / Assistente de Vendas", en: "Sales Development Representative (SDR)", cbo: "3541-25" },
  { pt: "Executivo de Contas", en: "Account Executive (AE)", cbo: "3541-30" },
  { pt: "Gerente de Projetos", en: "Project Manager / Scrum Master", cbo: "1423-35" }
];

interface CboSearchDropdownProps {
  label?: string;
  description?: string;
}

export function CboSearchDropdown({ label, description }: CboSearchDropdownProps) {
  const [search, setSearch] = useState("");

  const filtered = CBO_DATABASE.filter(
    (item) =>
      item.pt.toLowerCase().includes(search.toLowerCase()) ||
      item.en.toLowerCase().includes(search.toLowerCase()) ||
      item.cbo.includes(search)
  );

  return (
    <div className="w-full animate-fade-in space-y-4">
      {label && (
        <div className="space-y-1.5 px-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-start)] block">
            {label}
          </label>
          {description && (
            <p className="text-xs text-[var(--text-muted)] leading-relaxed whitespace-pre-line">
              {description}
            </p>
          )}
        </div>
      )}

      <div className="bg-[var(--input-bg)]/80 border border-[var(--border-primary)] rounded-2xl p-6 backdrop-blur-md shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-start)] ml-1">
            Consulta de Equivalencia CBO (Catho / ATS Nacionais)
          </span>
          <a
            href="https://cbo.mte.gov.br/cbosite/pages/home.jsf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-[var(--accent-start)] hover:underline flex items-center gap-1 transition-all"
          >
            <span>Portal Oficial CBO</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquise por cargo em ingles, portugues ou codigo CBO..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/40 border border-[var(--input-border)] rounded-xl pl-11 pr-5 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/60 focus:outline-none focus:border-[var(--accent-start)] transition-all"
          />
        </div>

        <div className="max-h-[220px] overflow-y-auto border border-[var(--border-primary)] rounded-xl divide-y divide-[var(--border-primary)]">
          {filtered.length > 0 ? (
            <div className="grid gap-1 p-1">
              {filtered.map((item) => (
                <div
                  key={item.cbo}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-lg hover:bg-[var(--accent-soft)]/40 transition-all gap-2"
                >
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-primary)] leading-tight">
                      {item.pt}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      Equivalente: {item.en}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 bg-[var(--accent-soft)] border border-[var(--accent-start)]/20 rounded-md text-[var(--accent-start)]">
                    CBO {item.cbo}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-[var(--text-muted)]">
              Nenhuma equivalencia encontrada. Use o Portal Oficial acima para buscar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
