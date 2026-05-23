"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { 
  FlaskConical, 
  Play, 
  ClipboardCheck, 
  Map, 
  ChevronRight,
  Info
} from "lucide-react";
import { motion } from "framer-motion";

export default function SandboxPage() {
  const router = useRouter();

  const tools = [
    {
      title: "Welcome Survey",
      description: "Teste a narrativa inicial, a nova lista de temas e as ramificações de 'Outro/Indicação'.",
      icon: ClipboardCheck,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      actionLabel: "Abrir Preview",
      onClick: () => router.push("/admin/pesquisas/preview/welcome_survey")
    },
    {
      title: "Onboarding Tour",
      description: "Teste o guia interativo no Hub. Isso irá redirecionar você para o Hub e forçar o início do tour.",
      icon: Map,
      color: "text-pink-500",
      bg: "bg-pink-500/10",
      actionLabel: "Testar no Hub",
      onClick: () => router.push("/hub?testTour=onboarding_tour")
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] text-left">
          AMBIENTE <span className="text-[var(--accent-start)] italic">Sandbox</span> 🧬
        </h1>
        <p className="text-[var(--text-muted)] text-sm font-medium opacity-70 flex items-center gap-2 text-left">
          <FlaskConical size={14} className="text-[var(--accent-start)]" />
          Espaço seguro para validação de fluxos e experiência do usuário.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool, idx) => (
          <motion.div
            key={tool.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group p-8 rounded-[2.5rem] bg-[var(--input-bg)] border border-[var(--border-primary)] hover:border-[var(--accent-start)]/30 transition-all shadow-xl hover:shadow-2xl hover:shadow-[var(--accent-start)]/5"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 rounded-2xl ${tool.bg} ${tool.color} group-hover:scale-110 transition-transform duration-500`}>
                <tool.icon size={24} />
              </div>
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] group-hover:text-[var(--accent-start)] transition-colors">
                Sandbox Tool
              </div>
            </div>

            <div className="space-y-4 text-left">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">{tool.title}</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                {tool.description}
              </p>
              
              <button 
                onClick={tool.onClick}
                className="w-full flex items-center justify-center gap-2 mt-4 px-6 py-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)] text-xs font-black uppercase tracking-widest hover:bg-[var(--accent-start)] hover:text-white hover:border-transparent transition-all group/btn"
              >
                {tool.actionLabel}
                <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-4">
        <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
        <div className="text-left space-y-1">
          <p className="text-sm font-bold text-blue-500 uppercase tracking-widest">Nota Técnica</p>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            O modo Sandbox ignora flags de conclusão no seu perfil real. No entanto, ações disparadas durante as surveys (como sincronização com Drive ou Firestore) podem ocorrer dependendo da configuração. Use com cautela se estiver testando com seu usuário de produção.
          </p>
        </div>
      </div>
    </div>
  );
}
