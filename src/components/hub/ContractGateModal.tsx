"use client";

import React, { useEffect, useState } from "react";
import { getPendingContracts, generateContractPdf } from "@/actions/legal";
import { useAuthContext } from "@/context/AuthContext";
import { Loader2, FileText, CheckCircle } from "lucide-react";

export function ContractGateModal() {
  const { user } = useAuthContext();
  const [pendingContracts, setPendingContracts] = useState<{productId: string, orderId: string, title: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (user?.uid) {
      loadPending();
    }
  }, [user]);

  async function loadPending() {
    setLoading(true);
    const res = await getPendingContracts(user!.uid);
    if (res.success && res.pendingProducts) {
      setPendingContracts(res.pendingProducts);
    }
    setLoading(false);
  }

  async function handleAccept(productId: string, orderId: string) {
    setIsProcessing(true);
    setSuccessMsg("");
    try {
      const res = await generateContractPdf(user!.uid, productId, orderId);
      if (res.success) {
        setSuccessMsg("Contrato gerado e aceito com sucesso!");
        // Remove from pending
        setPendingContracts(prev => prev.filter(c => c.productId !== productId));
      } else {
        alert("Erro ao processar aceite: " + res.error);
      }
    } catch (e: any) {
      alert("Erro ao processar aceite: " + e.message);
    }
    setIsProcessing(false);
  }

  if (loading || pendingContracts.length === 0) return null;

  const currentContract = pendingContracts[0];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Termo de Formalização</h2>
          <p className="text-muted-foreground mb-6">
            Para iniciar sua jornada e liberar o acesso, o aceite do escopo do serviço <strong>{currentContract.title}</strong> é obrigatório.
          </p>

          <div className="bg-muted p-4 rounded-lg w-full text-sm text-left mb-6 space-y-2">
            <p className="font-semibold flex items-center gap-2">
               <CheckCircle className="w-4 h-4 text-green-500" />
               Auditoria Digital (Clickwrap)
            </p>
            <p className="text-muted-foreground">
               Ao clicar em aceitar, um PDF oficial contendo o detalhamento completo dos serviços, metodologias e políticas de cancelamento será gerado e enviado diretamente para a sua pasta do Google Drive.
            </p>
          </div>

          {successMsg ? (
            <div className="bg-green-500/10 text-green-500 p-4 rounded-lg w-full flex items-center justify-center gap-2 font-medium">
              <CheckCircle className="w-5 h-5" />
              {successMsg}
            </div>
          ) : (
            <button
              onClick={() => handleAccept(currentContract.productId, currentContract.orderId)}
              disabled={isProcessing}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gerando Documento...
                </>
              ) : (
                "Li e Concordo com os Termos do Serviço"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
