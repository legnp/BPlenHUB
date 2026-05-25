"use client";

import React, { useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { WelcomeRedirectModal } from "./WelcomeRedirectModal";
import { ChevronRight, Loader2 } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface MatriculaGuardProps {
  productSlug: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * BPlen HUB — MatriculaGuard (🛡️ Soberania de Jornada)
 * Intercepta a intenção de contratação para garantir que o usuário tenha matrícula.
 */
export function MatriculaGuard({ productSlug, className, children }: MatriculaGuardProps) {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  async function handleAction() {
    if (loading || isChecking) return;

    // 1. Verificar Autenticação Base
    if (!user) {
      // Se não está logado, manda para o login com o retorno para o Hub (que disparará o Welcome)
      const returnUrl = `/hub?checkout=${productSlug}`;
      router.push(`/?auth=required&returnTo=${encodeURIComponent(returnUrl)}`);
      return;
    }

    setIsChecking(true);
    try {
      // 2. Verificar Matrícula via _AuthMap
      const mapSnap = await getDoc(doc(db, "_AuthMap", user.uid));
      
      if (mapSnap.exists()) {
        const { matricula } = mapSnap.data();
        if (matricula) {
          // Se tem matrícula, segue direto para o checkout real
          router.push(`/hub/membro/checkout/${productSlug}`);
          return;
        }
      }

      // 3. Se não tem matrícula, abre o Modal de Transição
      setIsModalOpen(true);
    } catch (err) {
      console.error("Erro ao validar matrícula no Guard:", err);
      // Fallback: em caso de erro, tenta o fluxo seguro (Welcome)
      router.push(`/hub?checkout=${productSlug}`);
    } finally {
      setIsChecking(false);
    }
  }

  function handleGoToWelcome() {
    setIsModalOpen(false);
    router.push(`/hub?checkout=${productSlug}`);
  }

  return (
    <>
      <button
        onClick={handleAction}
        disabled={loading || isChecking}
        className={className || "w-full py-5 rounded-2xl bg-[#ff0080] hover:bg-[#ff00b3] text-white font-black text-xs tracking-widest uppercase hover:scale-[1.02] shadow-[0_20px_40px_rgba(255,0,128,0.3)] transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:grayscale"}
      >
        {isChecking ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            VALIDANDO ACESSO...
          </>
        ) : (
          <>
            {children || "Contratar Serviço"}
            <ChevronRight size={18} className="group-hover:translate-x-1 duration-300" />
          </>
        )}
      </button>

      <WelcomeRedirectModal 
        isOpen={isModalOpen}
        userName={user?.displayName?.split(" ")[0] || "Membro"}
        onConfirm={handleGoToWelcome}
      />
    </>
  );
}
