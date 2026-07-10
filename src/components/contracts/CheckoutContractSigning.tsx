"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  resolveCheckoutContractAction,
  signCheckoutContractAction,
  type CheckoutContractResolution,
} from "@/actions/checkout-contract";
import { ShieldCheck, FileText, CheckCircle2, Loader2, ArrowRight, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { getErrorMessage } from "@/lib/utils/errors";
import { ContractDocumentView } from "@/components/contracts/ContractDocumentView";
import { ContractTermsCheckboxes, allRequiredAccepted, type ContractTerm } from "@/components/contracts/ContractTermsCheckboxes";

/**
 * Assinatura de contrato PÓS-CHECKOUT (CT-3b.2, ver CONTRACTS-DESIGN.md §10).
 *
 * Ilha cliente na tela `/hub/checkout/success`. O membro já chegou logado do próprio
 * checkout, então não há ramos de token/conta-errada como no avulso — só:
 *  - `awaiting_payment`: pago ainda pendente (aguarda confirmação do MP; auto-poll);
 *  - `sign`: order aprovada e contrato não assinado (lê as cláusulas + aceita termos);
 *  - `signed`: contrato já assinado (idempotente — mostra o documento).
 *
 * Convite forte, não bloqueio: o membro pode assinar depois em "Meus Contratos".
 */

// Termos de aceite (configuráveis, obrigatórios + opcionais). Novos termos entram aqui.
const CHECKOUT_TERMS: ContractTerm[] = [
  {
    id: "contrato-servico",
    required: true,
    label: (
      <>
        Declaro que li e concordo com o <b>contrato de prestação de serviço</b> acima, os{" "}
        <a href="/termos" target="_blank" className="text-[#ff0080] hover:underline">Termos de Uso</a> e a{" "}
        <a href="/privacidade" target="_blank" className="text-[#ff0080] hover:underline">Política de Privacidade</a> da BPlen,
        formalizando via Clickwrap.
      </>
    ),
  },
];

type Screen = "loading" | "unavailable" | "awaiting_payment" | "sign" | "processing" | "signed";

export function CheckoutContractSigning({ orderId }: { orderId: string }) {
  const [screen, setScreen] = useState<Screen>("loading");
  const [resolution, setResolution] = useState<CheckoutContractResolution | null>(null);
  const [accepted, setAccepted] = useState<string[]>([]);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resolve = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      setScreen("unavailable");
      return;
    }
    try {
      const idToken = await user.getIdToken();
      const res = await resolveCheckoutContractAction(orderId, idToken);
      if (!res.valid) {
        setScreen("unavailable");
        return;
      }
      setResolution(res);
      if (res.contractStatus === "assinado") {
        setDocumentUrl(res.documentUrl ?? null);
        setScreen("signed");
      } else if (!res.orderApproved) {
        setScreen("awaiting_payment");
      } else {
        setScreen("sign");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Erro ao carregar o contrato."));
      setScreen("unavailable");
    }
  }, [orderId]);

  // Resolve assim que o estado de auth estabilizar (membro já logado do checkout).
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) resolve();
      else setScreen("unavailable");
    });
    return () => unsub();
  }, [resolve]);

  // Pago pendente: reconsulta periodicamente até o Mercado Pago aprovar a order.
  useEffect(() => {
    if (screen !== "awaiting_payment") {
      if (pollRef.current) clearTimeout(pollRef.current);
      return;
    }
    pollRef.current = setTimeout(() => {
      resolve();
    }, 8000);
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [screen, resolution, resolve]);

  const canSign = allRequiredAccepted(CHECKOUT_TERMS, accepted);

  const handleSign = useCallback(async () => {
    if (!allRequiredAccepted(CHECKOUT_TERMS, accepted)) return;
    setScreen("processing");
    setError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Sessão expirada. Faça login novamente.");
      const result = await signCheckoutContractAction(orderId, idToken, accepted);
      if (result.success) {
        setDocumentUrl(result.documentUrl ?? null);
        setScreen("signed");
      } else {
        setError(result.error || "Falha ao processar a assinatura.");
        setScreen("sign");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Erro inesperado."));
      setScreen("sign");
    }
  }, [accepted, orderId]);

  // Sem contrato disponível para esta conta/pedido: não polui a tela de sucesso.
  if (screen === "unavailable") return null;

  return (
    <div className="max-w-3xl mx-auto text-left">
      <AnimatePresence mode="wait">
        {screen === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-10">
            <Loader2 size={32} className="animate-spin text-[#ff0080]" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Carregando seu contrato...</p>
          </motion.div>
        )}

        {screen === "awaiting_payment" && (
          <motion.div key="awaiting" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#ff0080]/10 text-[#ff0080] flex items-center justify-center mx-auto">
              <Clock size={26} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black tracking-tight text-white">Seu contrato está quase pronto</h3>
              <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-md mx-auto">
                Assim que o pagamento for confirmado, o contrato de prestação de serviço aparecerá aqui para você ler e assinar.
              </p>
            </div>
            <button
              onClick={() => resolve()}
              className="text-[9px] font-black uppercase tracking-widest text-[#ff0080] hover:underline"
            >
              Verificar novamente
            </button>
          </motion.div>
        )}

        {screen === "sign" && resolution?.product && (
          <motion.div key="sign" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff0080]/10 text-[9px] font-black uppercase tracking-widest text-[#ff0080] border border-[#ff0080]/20">
                <FileText size={12} /> Falta assinar seu contrato
              </div>
              <h3 className="text-2xl font-black tracking-tight text-white">
                Formalize o serviço <span className="text-[#ff0080]">{resolution.product.title}</span>
              </h3>
              <p className="text-xs text-gray-400 font-medium max-w-md mx-auto">
                Leia o contrato completo abaixo e confirme os termos para registrar sua assinatura com validade jurídica.
              </p>
            </div>

            <ContractDocumentView clauses={resolution.clauses ?? []} title={resolution.documentTitle} />

            <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Termos Legais</p>
              <ContractTermsCheckboxes terms={CHECKOUT_TERMS} value={accepted} onChange={setAccepted} />
            </div>

            <div className="p-4 rounded-2xl bg-[#ff0080]/5 border border-[#ff0080]/20 flex items-start gap-3">
              <ShieldCheck size={16} className="text-[#ff0080] shrink-0 mt-0.5" />
              <p className="text-[9px] text-gray-500 font-bold leading-relaxed">
                Ao confirmar, um PDF oficial do contrato será gerado com carimbo de tempo e IP em nossos servidores e armazenado na sua pasta BPlen no Google Drive.
              </p>
            </div>

            {error ? <p className="text-[11px] text-red-400 font-bold text-center">{error}</p> : null}

            <button
              onClick={handleSign}
              disabled={!canSign}
              className="w-full py-5 rounded-2xl bg-[#ff0080] hover:bg-[#ff00b3] text-white font-black text-xs tracking-[0.2em] uppercase hover:scale-[1.01] shadow-[0_20px_40px_rgba(255,0,128,0.3)] transition-all flex items-center justify-center gap-3 group disabled:opacity-30 disabled:hover:scale-100"
            >
              Assinar Contrato
              <ArrowRight size={18} className="group-hover:translate-x-1 duration-300" />
            </button>

            <p className="text-center text-[9px] font-bold uppercase tracking-widest text-gray-600">
              Prefere assinar depois? Você encontra este contrato em Meus Contratos.
            </p>
          </motion.div>
        )}

        {screen === "processing" && (
          <motion.div key="processing" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="text-center space-y-6 py-10">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-[#ff0080] rounded-full blur-3xl opacity-20 animate-pulse" />
              <Loader2 size={80} className="text-[#ff0080] animate-spin relative z-10 opacity-40" strokeWidth={1} />
              <div className="absolute inset-0 flex items-center justify-center">
                <FileText size={28} className="text-white animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black tracking-tight uppercase italic text-white">Gerando <span className="opacity-40">Documento</span></h3>
              <p className="text-gray-500 text-[9px] font-black uppercase tracking-[0.4em] animate-pulse">Registrando log de auditoria (IP + timestamp)...</p>
            </div>
          </motion.div>
        )}

        {screen === "signed" && (
          <motion.div key="signed" initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="text-center space-y-6 py-6">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-[1.75rem] flex items-center justify-center text-emerald-500 border border-emerald-500/20 mx-auto shadow-[0_0_60px_rgba(16,185,129,0.2)]">
              <CheckCircle2 size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black tracking-tight text-white">Contrato <span className="text-emerald-500">Assinado.</span></h3>
              <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-md mx-auto">
                Sua formalização foi registrada com IP e carimbo de tempo. O PDF já está disponível na sua pasta BPlen no Google Drive.
              </p>
            </div>
            <div className="flex flex-col gap-3 max-w-sm mx-auto">
              {documentUrl ? (
                <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="w-full py-4 rounded-2xl bg-white/10 border border-white/20 text-white font-black text-[10px] tracking-[0.3em] uppercase hover:bg-white/20 transition-all">
                  Visualizar Documento
                </a>
              ) : null}
              <Link href="/hub/membro/contratos" className="w-full py-4 rounded-2xl bg-white text-black font-black text-[10px] tracking-[0.3em] uppercase hover:scale-[1.01] transition-all">
                Ver Meus Contratos
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
