"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  resolveRetroactiveContractTokenAction,
  processRetroactiveContractAction,
} from "@/actions/retroactive-contract";
import {
  ShieldCheck,
  FileText,
  CheckCircle2,
  Loader2,
  Lock,
  ArrowRight,
  UserX,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { getErrorMessage } from "@/lib/utils/errors";

type ResolvedProduct = { slug: string | null; title: string | null; serviceCode: string | null; price: number };
type Screen = "loading" | "logged_out" | "blocked" | "summary" | "processing" | "success";

const BLOCK_MESSAGES: Record<string, { title: string; hint: string }> = {
  invalid: { title: "Link inválido", hint: "Este link de contrato não é válido. Solicite um novo à BPlen." },
  consumed: { title: "Contrato já assinado", hint: "Este contrato já foi assinado e o link não pode ser reutilizado." },
  expired: { title: "Link expirado", hint: "Este link de contrato expirou. Solicite um novo à BPlen." },
  wrong_account: {
    title: "Contrato de outra conta",
    hint: "Este contrato foi liberado para outra conta. Entre com a conta correta para acessá-lo.",
  },
};

/**
 * Assinatura de contrato retroativo por TOKEN (CT-2). O link é único, de uso único e
 * vinculado à conta liberada pelo admin — a validação real acontece no servidor.
 */
export default function RetroactiveContractPage() {
  const params = useParams();
  const token = (params.token as string) || "";

  const [screen, setScreen] = useState<Screen>("loading");
  const [product, setProduct] = useState<ResolvedProduct | null>(null);
  const [clauses, setClauses] = useState<{ heading: string; body: string }[]>([]);
  const [blockReason, setBlockReason] = useState<string>("invalid");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);

  // Resolve o token assim que o estado de auth estabilizar (login na conta liberada).
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setScreen("logged_out");
        return;
      }
      try {
        const idToken = await user.getIdToken();
        const res = await resolveRetroactiveContractTokenAction(token, idToken);
        if (res.valid) {
          setProduct(res.product);
          setClauses(res.clauses ?? []);
          setScreen("summary");
        } else if (res.reason === "auth") {
          setScreen("logged_out");
        } else {
          setBlockReason(res.reason);
          setScreen("blocked");
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Erro ao carregar o contrato."));
        setBlockReason("invalid");
        setScreen("blocked");
      }
    });
    return () => unsub();
  }, [token]);

  const handleSign = useCallback(async () => {
    if (!acceptedTerms) return;
    setScreen("processing");
    setError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Sessão expirada. Faça login novamente.");
      const result = await processRetroactiveContractAction(token, idToken);
      if (result.success) {
        setSuccessUrl(result.documentUrl || null);
        setScreen("success");
      } else {
        setError(result.error || "Falha ao processar a assinatura.");
        setScreen("summary");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Erro inesperado."));
      setScreen("summary");
    }
  }, [acceptedTerms, token]);

  return (
    <main className="min-h-screen bg-black text-white relative isolate overflow-hidden flex items-center justify-center p-6 theme-dark">
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ff0080] rounded-full blur-[200px] opacity-[0.05] -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#667eea] rounded-full blur-[200px] opacity-[0.05] -z-10" />

      <div className="w-full max-w-5xl">
        <AnimatePresence mode="wait">
          {screen === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center flex flex-col items-center gap-6">
              <Loader2 size={40} className="animate-spin text-[#ff0080]" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Validando seu contrato...</p>
            </motion.div>
          )}

          {screen === "logged_out" && (
            <motion.div key="logged_out" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto text-center space-y-8 p-10 rounded-[3rem] bg-white/5 border border-white/10">
              <div className="w-16 h-16 rounded-2xl bg-[#ff0080]/10 text-[#ff0080] flex items-center justify-center mx-auto">
                <Lock size={28} />
              </div>
              <div className="space-y-3">
                <h1 className="text-2xl font-black tracking-tight">Acesso ao contrato</h1>
                <p className="text-sm text-gray-400 font-medium leading-relaxed">
                  Este contrato foi liberado para uma conta específica. Entre com a conta indicada pela BPlen para visualizar e assinar.
                </p>
              </div>
              <GoogleLoginButton />
            </motion.div>
          )}

          {screen === "blocked" && (
            <motion.div key="blocked" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto text-center space-y-8 p-10 rounded-[3rem] bg-white/5 border border-white/10">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                {blockReason === "wrong_account" ? <UserX size={28} /> : <AlertTriangle size={28} />}
              </div>
              <div className="space-y-3">
                <h1 className="text-2xl font-black tracking-tight">{(BLOCK_MESSAGES[blockReason] || BLOCK_MESSAGES.invalid).title}</h1>
                <p className="text-sm text-gray-400 font-medium leading-relaxed">
                  {(BLOCK_MESSAGES[blockReason] || BLOCK_MESSAGES.invalid).hint}
                </p>
                {error ? <p className="text-[11px] text-red-400 font-bold">{error}</p> : null}
              </div>
              {blockReason === "wrong_account" ? (
                <GoogleLoginButton />
              ) : (
                <Link href="/hub" className="inline-block px-8 py-3 bg-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/20 transition-all">
                  Ir para o HUB
                </Link>
              )}
            </motion.div>
          )}

          {screen === "summary" && product && (
            <motion.div key="summary" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col lg:flex-row gap-12">
              <div className="flex-1 space-y-8 text-left">
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">
                    Formalização <span className="opacity-40 tracking-normal italic">&</span> Contrato
                  </h1>
                  <p className="text-gray-500 font-bold max-w-md">
                    Revise os valores e confirme sua assinatura do serviço <span className="text-[#ff0080]">{product.title}</span>.
                  </p>
                </div>

                <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-[#ff0080]/10 rounded-2xl text-[#ff0080]">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Serviço Contratado</h4>
                      <p className="text-lg font-black">{product.title}</p>
                    </div>
                    {product.serviceCode ? (
                      <div className="ml-auto text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#ff0080]">ID: {product.serviceCode}</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="pt-6 border-t border-white/5 space-y-3">
                    <div className="flex justify-between text-sm font-bold opacity-60">
                      <span>Investimento Registrado</span>
                      <span>R$ {product.price.toLocaleString("pt-BR")}</span>
                    </div>
                    <div className="flex justify-between text-xl font-black pt-2 text-[#ff0080]">
                      <span>Total Formalizado</span>
                      <span>R$ {product.price.toLocaleString("pt-BR")}</span>
                    </div>
                  </div>
                </div>

                {clauses.length > 0 ? (
                  <div className="rounded-[2rem] bg-white/5 border border-white/10 overflow-hidden">
                    <div className="px-6 pt-6 pb-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Contrato de Prestação de Serviço</p>
                      <p className="text-[10px] text-gray-500 mt-1">Leia o contrato completo abaixo antes de assinar.</p>
                    </div>
                    <div className="max-h-[380px] overflow-y-auto px-6 pb-6 space-y-4 custom-scrollbar text-left">
                      {clauses.map((c, i) => (
                        <div key={i} className="space-y-1">
                          <h4 className="text-xs font-black text-[#ff0080]">{c.heading}</h4>
                          <p className="text-[11px] text-gray-300 leading-relaxed whitespace-pre-line">{c.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Termos Legais</p>
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <div className="relative mt-1">
                      <input type="checkbox" className="peer sr-only" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
                      <div className="w-5 h-5 rounded border border-gray-600 peer-checked:bg-[#ff0080] peer-checked:border-[#ff0080] transition-all flex items-center justify-center">
                        <CheckCircle2 size={14} className="text-white opacity-0 peer-checked:opacity-100" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 font-medium leading-relaxed group-hover:text-white transition-colors">
                      Declaro ter lido e estou de acordo com os <Link href="/termos" target="_blank" className="text-[#ff0080] hover:underline">Termos de Uso</Link>, a <Link href="/privacidade" target="_blank" className="text-[#ff0080] hover:underline">Política de Privacidade</Link> da BPlen, e concordo com o escopo e valores registrados acima para formalização via Clickwrap.
                    </p>
                  </label>
                </div>
              </div>

              <div className="w-full lg:w-[420px]">
                <div className="p-10 rounded-[3rem] bg-gradient-to-b from-white/10 to-transparent border border-white/20 shadow-2xl space-y-8 backdrop-blur-3xl relative overflow-hidden h-full flex flex-col justify-between">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12">
                    <Lock size={200} />
                  </div>
                  <div className="space-y-6 relative z-10">
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Assinatura Digital</h4>
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                        <ShieldCheck size={18} className="text-[#ff0080]" />
                        <span className="text-xs font-bold">Validação (MP 2.200-2/2001)</span>
                      </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-[#ff0080]/5 border border-[#ff0080]/20 space-y-2">
                      <p className="text-[9px] text-gray-500 font-bold leading-relaxed">
                        Ao confirmar, um PDF oficial do contrato será gerado com carimbo de tempo e IP em nossos servidores e armazenado em seu Google Drive.
                      </p>
                    </div>
                    {error ? <p className="text-[11px] text-red-400 font-bold">{error}</p> : null}
                  </div>
                  <div className="mt-8 relative z-10">
                    <button
                      onClick={handleSign}
                      disabled={!acceptedTerms}
                      className="w-full py-5 rounded-2xl bg-[#ff0080] hover:bg-[#ff00b3] text-white font-black text-xs tracking-[0.2em] uppercase hover:scale-[1.02] shadow-[0_20px_40px_rgba(255,0,128,0.3)] transition-all flex items-center justify-center gap-3 group disabled:opacity-30 disabled:hover:scale-100"
                    >
                      Assinar Contrato
                      <ArrowRight size={18} className="group-hover:translate-x-1 duration-300" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {screen === "processing" && (
            <motion.div key="processing" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="text-center space-y-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-[#ff0080] rounded-full blur-3xl opacity-20 animate-pulse" />
                <Loader2 size={120} className="text-[#ff0080] animate-spin relative z-10 opacity-40" strokeWidth={1} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText size={40} className="text-white animate-pulse" />
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-black tracking-tighter uppercase italic">Gerando <span className="opacity-40">Documento</span></h2>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Registrando log de auditoria (IP + timestamp)...</p>
              </div>
            </motion.div>
          )}

          {screen === "success" && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="text-center space-y-10 max-w-xl mx-auto">
              <div className="w-32 h-32 bg-emerald-500/20 rounded-[2.5rem] flex items-center justify-center text-emerald-500 border border-emerald-500/20 mx-auto shadow-[0_0_80px_rgba(16,185,129,0.2)]">
                <CheckCircle2 size={64} />
              </div>
              <div className="space-y-4">
                <h2 className="text-5xl font-black tracking-tighter">Documento <span className="text-emerald-500">Assinado.</span></h2>
                <p className="text-xl text-gray-400 font-bold leading-relaxed">
                  Sua formalização foi registrada com IP e carimbo de tempo. O PDF já está disponível na sua pasta BPlen no Google Drive.
                </p>
              </div>
              <div className="flex flex-col gap-4">
                {successUrl ? (
                  <a href={successUrl} target="_blank" rel="noopener noreferrer" className="w-full py-5 rounded-3xl bg-white/10 border border-white/20 text-white font-black text-[10px] tracking-[0.3em] uppercase hover:bg-white/20 transition-all">
                    Visualizar Documento
                  </a>
                ) : null}
                <Link href="/hub/membro/contratos" className="w-full py-6 rounded-3xl bg-white text-black font-black text-xs tracking-[0.3em] uppercase hover:scale-[1.02] shadow-2xl transition-all">
                  Ver Meus Contratos
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
