"use client";

import React from "react";
import { motion } from "framer-motion";
import { FSTabs } from "@/components/admin/FSTabs";
import { DevolutivaComportamentalView } from "@/components/admin/DevolutivaComportamentalView";

export default function AdminDevolutivaPage() {
  return (
    <div className="space-y-10 animate-fade-in-up text-left">
      <FSTabs />
      
      {/* Page Header (Apple Pro Layout) */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1"
      >
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] uppercase">
          Devolutiva Comportamental
        </h1>
        <p className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-[0.15em] opacity-70">
          Painel de Análise de Carreira 360º
        </p>
      </motion.div>

      {/* Main Orchestrator Component */}
      <DevolutivaComportamentalView />
    </div>
  );
}
