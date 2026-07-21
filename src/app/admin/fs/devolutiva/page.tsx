"use client";

import React from "react";
import { Brain } from "lucide-react";
import { FSTabs } from "@/components/admin/FSTabs";
import { DevolutivaComportamentalView } from "@/components/admin/DevolutivaComportamentalView";
import { FunctionalPageHeader } from "@/components/layout/FunctionalPageHeader";

export default function AdminDevolutivaPage() {
  return (
    <div className="space-y-10 animate-fade-in-up text-left">
      <FSTabs />

      <FunctionalPageHeader
        eyebrow="Instrumentos e Devolutivas"
        title="Devolutiva"
        titleAccent="Comportamental"
        icon={<Brain size={24} />}
      />

      <p className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-[0.15em] opacity-70 -mt-6">
        Painel de análise de carreira 360°
      </p>

      {/* Main Orchestrator Component */}
      <DevolutivaComportamentalView />
    </div>
  );
}
