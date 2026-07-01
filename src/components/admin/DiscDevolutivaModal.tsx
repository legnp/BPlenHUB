"use client";

import React, { useState } from "react";
import { X, Trophy, ShieldCheck, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminUser } from "@/types/users";
import { FormsEngine } from "@/components/forms/FormsEngine";
import { devolutivaDiscFormConfig } from "@/config/forms/devolutiva-disc";
import { submitDevolutivaDisc } from "@/actions/submit-devolutiva";
import { auth } from "@/lib/firebase";
import { getErrorMessage } from "@/lib/utils/errors";

interface DiscDevolutivaModalProps {
  user: AdminUser;
  onClose: () => void;
  onSuccess: () => void;
}

export function DiscDevolutivaModal({ user, onClose, onSuccess }: DiscDevolutivaModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCustomSubmit = async (responses: any) => {
    setIsSubmitting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      
      // Mapeamento de FormResponse para o contrato do submitDevolutivaDisc
      const payload = {
        executor: Number(responses.executor),
        comunicador: Number(responses.comunicador),
        planejador: Number(responses.planejador),
        analista: Number(responses.analista),
        result_file: {
          url: responses.result_file?.url || "",
          fileName: responses.result_file?.fileName || "resultado.pdf",
          size: 0 
        }
      };

      if (!payload.result_file.url) {
        throw new Error("O arquivo de resultado é obrigatório.");
      }

      const res = await submitDevolutivaDisc(user.matricula, payload, token);
      
      if (res.success) {
        onSuccess();
        onClose();
      }
    } catch (err: unknown) {
      alert("❌ Erro ao publicar: " + getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        className="relative w-full max-w-2xl bg-[var(--bg-primary)] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 bg-white/5 flex justify-between items-center shrink-0">
           <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                 <Trophy size={24} className="text-white" />
              </div>
              <div className="space-y-0.5">
                 <h3 className="text-xl font-black text-white">Lançar Análise <span className="text-blue-400 italic">DISC</span></h3>
                 <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">
                    Alvo: <span className="text-white">{user.name}</span> • {user.matricula}
                 </p>
              </div>
           </div>
           <button onClick={onClose} className="p-3 rounded-2xl hover:bg-white/10 text-gray-500 transition-all">
              <X size={20} />
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
           <FormsEngine 
             config={devolutivaDiscFormConfig} 
             userUid={user.uid || ""} 
             matricula={user.matricula}
             customSubmit={handleCustomSubmit}
           />
        </div>

        {/* Status Overlay se estiver enviando */}
        <AnimatePresence>
          {isSubmitting && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4"
            >
               <Loader2 size={40} className="animate-spin text-blue-500" />
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Publicando Resultados DISC...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
