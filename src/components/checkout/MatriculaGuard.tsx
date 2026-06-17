"use client";

import React, { useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [modalMode, setModalMode] = useState<"login" | "welcome">("welcome");

  async function handleAction() {
    if (loading || isChecking) return;

    // 🛡️ SOBERANIA DE CONVERSÃO: Se não está logado, exige login.
    // Se está logado, segue para o checkout independente de ter matrícula (ela será gerada lá).
    if (!user) {
      setModalMode("login");
      setIsModalOpen(true);
      return;
    }

    // 🧬 CONEXÃO DE FLOW: Plano Junior redireciona diretamente para os Primeiros Passos
    if (productSlug === "junior") {
      router.push("/hub/primeiros_passos");
      return;
    }

    router.push(`/hub/membro/checkout/${productSlug}`);
  }

  function handleModalConfirm() {
    setIsModalOpen(false);
    if (modalMode === "login") {
       // Redireciona para login e volta para o checkout do produto (ou Primeiros Passos se Junior)
       const targetPath = productSlug === "junior" ? "/hub/primeiros_passos" : `/hub/membro/checkout/${productSlug}`;
       router.push(`/?auth=required&returnTo=${encodeURIComponent(targetPath)}`);
    }
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
        title={modalMode === "login" ? "Conecte-se à BPlen" : undefined}
        description={modalMode === "login" 
          ? "Para contratar este serviço, precisamos te identificar e garantir sua matrícula BPlen. Vamos te guiar para o login agora."
          : undefined
        }
        buttonText={modalMode === "login" ? "FAZER LOGIN / REGISTRAR" : "IR PARA RECEPÇÃO"}
        onConfirm={handleModalConfirm}
      />
    </>
  );
}
