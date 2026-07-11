"use client";

import React, { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase";

/**
 * Botão "Ver documento" do painel de contratos (CT-4). Abre o PDF do contrato DENTRO do
 * HUB pelo proxy seguro `/api/docs/[fileId]` (que exige `?token=`), sem mandar o membro
 * para o Google Drive (fecha BUG-052). Cliente porque precisa do idToken da sessão.
 */
export function ContractDocButton({ fileId, className }: { fileId: string; className?: string }) {
  const [loading, setLoading] = useState(false);

  const open = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("sessão");
      window.open(`/api/docs/${fileId}?token=${encodeURIComponent(token)}`, "_blank", "noopener,noreferrer");
    } catch {
      // Sem sessão válida: não faz nada (o painel só renderiza logado).
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={open}
      disabled={loading}
      className={
        className ??
        "w-full py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-[var(--input-bg)] border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--accent-soft)] flex items-center justify-center gap-2"
      }
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
      Ver Documento
    </button>
  );
}
