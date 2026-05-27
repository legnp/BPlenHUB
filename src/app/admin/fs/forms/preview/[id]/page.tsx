"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getFormConfig } from "@/config/forms";
import { FormsEngine } from "@/components/forms/FormsEngine";
import { ChevronLeft, Eye, FlaskConical, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * BPlen HUB — Admin Form Preview (Sandbox)
 * Ambiente seguro para testar roteiros, máscaras e lógica condicional.
 */
export default function FormPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const [complete, setComplete] = useState(false);
  
  const formId = params.id as string;
  const config = getFormConfig(formId);

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
          <FlaskConical size={32} />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Formulário Não Encontrado</h2>
        <p className="text-[var(--text-muted)] text-sm max-w-xs">
          O ID <span className="font-mono text-[var(--accent-start)]">{formId}</span> não existe no FORMS_REGISTRY.
        </p>
        <button 
          onClick={() => router.push("/admin/forms")}
          className="px-6 py-2 bg-[var(--input-bg)] rounded-xl text-xs font-bold uppercase tracking-widest border border-[var(--border-primary)]"
        >
          Voltar para Gestão
        </button>
      </div>
    );
  }

  const handleMockSubmit = async (responses: any) => {
    console.log("[PREVIEW SUBMIT]:", responses);
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 1500));
    setComplete(true);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4 md:p-8 space-y-8 animate-fade-in-up">
      
      {/* Barra de Ferramentas Preview */}
      <div className="max-w-[800px] mx-auto flex items-center justify-between pb-6 border-b border-[var(--border-primary)]/50">
        <button 
          onClick={() => router.push("/admin/forms")}
          className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <ChevronLeft size={16} />
          Sair do Preview
        </button>

        <div className="flex items-center gap-3 px-4 py-2 bg-[var(--accent-start)]/5 border border-[var(--accent-start)]/20 rounded-full text-[var(--accent-start)] text-[10px] font-bold uppercase tracking-widest animate-pulse">
           <FlaskConical size={12} />
           Modo Sandbox Ativo
        </div>
      </div>

      <div className="max-w-[800px] mx-auto glass-morphism border border-[var(--border-primary)] rounded-[32px] overflow-hidden shadow-2xl bg-white/5 backdrop-blur-sm">
        <header className="p-8 pb-0 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[var(--text-muted)] text-[9px] font-bold uppercase tracking-widest mb-4">
               Pré-visualização Operacional
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="text-[var(--text-primary)]">{config.title.split(' ')[0]}</span>
              <span className="text-[var(--accent-start)] ml-2">{config.title.split(' ').slice(1).join(' ')}</span>
            </h1>
        </header>

        <AnimatePresence mode="wait">
          {!complete ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FormsEngine 
                config={config}
                userUid="ADMIN_TEST_UID"
                customSubmit={handleMockSubmit}
                isPreview={true}
              />
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-16 text-center space-y-6"
            >
               <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                  <CheckCircle2 size={40} />
               </div>
               <div className="space-y-2">
                 <h2 className="text-2xl font-bold text-[var(--text-primary)] uppercase tracking-tight">Preview Concluído!</h2>
                 <p className="text-[var(--text-muted)] text-sm max-w-sm mx-auto">
                    No modo real, os dados seriam salvos no Sheets e no Perfil do Usuário com a matrícula correspondente.
                 </p>
               </div>
               <button 
                  onClick={() => setComplete(false)}
                  className="px-8 py-3 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl text-xs font-bold uppercase tracking-widest hover:border-[var(--accent-start)] transition-all"
               >
                 Testar Novamente
               </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="max-w-[800px] mx-auto text-center">
         <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-[0.2em] opacity-40">
           BPlen HUB Forms — Preview Engine V2.1
         </p>
      </footer>
    </div>
  );
}
