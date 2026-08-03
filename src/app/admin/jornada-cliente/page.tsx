"use client";

import React, { useState } from "react";
import { Route, Fingerprint, Wrench } from "lucide-react";
import { DevolutivaComportamentalView } from "@/components/admin/DevolutivaComportamentalView";
import { ClientInstrumentsView } from "@/components/admin/ClientInstrumentsView";
import { ClientSelector } from "@/components/admin/ClientSelector";
import { FunctionalPageHeader } from "@/components/layout/FunctionalPageHeader";

/**
 * Jornada do Cliente — visão consolidada do cliente na plataforma.
 *
 * O cliente e escolhido UMA vez, no topo, e vale para todas as sub-abas: a Devolutiva
 * Comportamental e os Instrumentos modulares por checkpoint. A pagina cresce para
 * reunir contratos, servicos adquiridos e demais etapas da jornada como novas abas
 * (ver ADMIN-REDESIGN-DESIGN.md).
 */

type JornadaTab = "devolutiva" | "instrumentos";

const TABS: Array<{ id: JornadaTab; name: string; icon: React.ReactNode }> = [
  { id: "devolutiva", name: "Devolutiva Comportamental", icon: <Fingerprint size={16} /> },
  { id: "instrumentos", name: "Instrumentos", icon: <Wrench size={16} /> },
];

export default function AdminJornadaClientePage() {
  const [matricula, setMatricula] = useState<string>("");
  const [activeTab, setActiveTab] = useState<JornadaTab>("devolutiva");

  return (
    <div className="space-y-8 animate-fade-in-up text-left">
      <FunctionalPageHeader
        eyebrow="Pessoas"
        title="Jornada"
        titleAccent="do Cliente"
        icon={<Route size={24} />}
      />

      <p className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-[0.15em] opacity-70 -mt-4">
        Acompanhamento do cliente na plataforma
      </p>

      {/* Escolha unica do cliente — vale para todas as abas abaixo */}
      <ClientSelector value={matricula} onChange={setMatricula} />

      <div className="flex items-center gap-2 border-b border-[var(--border-primary)] pb-px">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-widest rounded-t-2xl transition-all border-b-2 ${
                isActive
                  ? "text-[var(--accent-start)] border-[var(--accent-start)] bg-[var(--accent-soft)]"
                  : "text-[var(--text-muted)] border-transparent hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]"
              }`}
            >
              {tab.icon}
              {tab.name}
            </button>
          );
        })}
      </div>

      {!matricula ? (
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50 py-12 text-center">
          Selecione um cliente acima para ver a jornada dele.
        </p>
      ) : activeTab === "devolutiva" ? (
        // `key` remonta a view ao trocar de cliente: ela deriva o estado interno da
        // prop apenas na montagem, entao sem isso continuaria exibindo o anterior.
        <DevolutivaComportamentalView key={matricula} matricula={matricula} hideUserSelector />
      ) : (
        <ClientInstrumentsView matricula={matricula} />
      )}
    </div>
  );
}
