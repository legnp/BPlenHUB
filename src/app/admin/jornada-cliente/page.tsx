"use client";

import React from "react";
import { Route } from "lucide-react";
import { DevolutivaComportamentalView } from "@/components/admin/DevolutivaComportamentalView";
import { FunctionalPageHeader } from "@/components/layout/FunctionalPageHeader";

/**
 * Jornada do Cliente — visão consolidada do cliente na plataforma.
 * Hoje concentra a Devolutiva Comportamental; a página cresce para reunir
 * contratos, serviços adquiridos, atalho para a gestão do usuário e demais
 * etapas da jornada (ver ADMIN-REDESIGN-DESIGN.md).
 */
export default function AdminJornadaClientePage() {
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

      {/* Devolutiva Comportamental (primeira seção da jornada) */}
      <DevolutivaComportamentalView />
    </div>
  );
}
