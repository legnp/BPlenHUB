"use client";

import React, { useState, useEffect } from "react";
import { FormsEngine } from "@/components/forms/FormsEngine";
import { FormResponse } from "@/types/forms";
import { dadosCadastraisForm } from "@/config/forms/definitions/dados-cadastrais";
import { useAuthContext } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { UserCheck, ShieldCheck, Loader2 } from "lucide-react";

interface RegistrationStepProps {
  onComplete: () => void;
}

/**
 * BPlen HUB — RegistrationStep (📋 Revisão de Dados)
 * Permite que o usuário revise ou preencha seus dados cadastrais antes do pagamento.
 */
export function RegistrationStep({ onComplete }: RegistrationStepProps) {
  const { user } = useAuthContext();
  const [initialData, setInitialData] = useState<FormResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchExistingData() {
      if (!user) return;
      try {
        // 1. Resolver matrícula
        const mapSnap = await getDoc(doc(db, "_AuthMap", user.uid));
        if (mapSnap.exists()) {
          const { matricula } = mapSnap.data();
          
          // 2. Tentar buscar da coleção Forms (Submissão oficial do FormsEngine)
          const formsSnap = await getDoc(doc(db, "User", matricula, "Forms", "dados_cadastrais"));
          
          if (formsSnap.exists()) {
            const formData = formsSnap.data();
            setInitialData(formData.data || formData);
          } else {
            // 3. Fallback: Buscar da subcoleção User_Data (legado ou preenchimento parcial)
            const dataSnap = await getDoc(doc(db, "User", matricula, "User_Data", "dados_cadastrais"));
            if (dataSnap.exists()) {
              setInitialData(dataSnap.data());
            }
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados cadastrais para revisão:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchExistingData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 text-[var(--accent-start)] animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Preparando seus dados...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="p-8 rounded-[2.5rem] bg-[var(--input-bg)] border border-[var(--border-primary)] flex items-center gap-6 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-[var(--accent-start)]/10 flex items-center justify-center text-[var(--accent-start)]">
           <UserCheck size={32} />
        </div>
        <div className="space-y-1">
           <h3 className="text-xl font-black tracking-tight text-[var(--text-primary)]">Revisão de Dados</h3>
           <p className="text-xs font-medium text-[var(--text-muted)] leading-relaxed">
             Confirme seus dados para emissão da <span className="text-[var(--text-primary)] font-bold">Nota Fiscal</span> e do <span className="text-[var(--text-primary)] font-bold">Contrato</span>.
           </p>
        </div>
      </div>

      <div className="glass !bg-transparent !p-0 overflow-hidden border-[var(--border-primary)]">
        <FormsEngine
          config={dadosCadastraisForm}
          userUid={user?.uid || ""}
          initialResponses={initialData || undefined}
          onComplete={onComplete}
        />
      </div>

      <div className="flex items-center justify-center gap-3 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
         <ShieldCheck size={14} />
         Ambiente Seguro · Proteção de Dados BPlen
      </div>
    </motion.div>
  );
}
