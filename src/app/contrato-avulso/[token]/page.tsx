"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  resolveAvulsoContractTokenAction,
  processAvulsoContractAction,
} from "@/actions/avulso-contract";
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
import { ContractTermsCheckboxes, allRequiredAccepted, type ContractTerm } from "@/components/contracts/ContractTermsCheckboxes";
import { ContractDocumentView } from "@/components/contracts/ContractDocumentView";
import { FunctionalPageHeader } from "@/components/layout/FunctionalPageHeader";
import { formatBRL } from "@/lib/utils/format";

type ResolvedProduct = { slug: string | null; title: string | null; serviceCode: string | null; price: number };
type Screen = "loading" | "logged_out" | "blocked" | "summary" | "processing" | "success";

// Termos de aceite (configuráveis, obrigatórios + opcionais). Novos termos entram aqui.
const AVULSO_TERMS: ContractTerm[] = [
  {
    id: "contrato-servico",
    required: true,
    label: (
      <>
        Declaro que li e concordo com o <b>contrato de prestação de serviço</b> acima, os{" "}
        <a href="/termos" target="_blank" className="text-[var(--accent-start)] hover:underline">Termos de Uso</a> e a{" "}
        <a href="/privacidade" target="_blank" className="text-[var(--accent-start)] hover:underline">Política de Privacidade</a> da BPlen,
        formalizando via Clickwrap.
      </>
    ),
  },
];

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
 * Assinatura de contrato AVULSO por TOKEN (CT-2/CT-3). O link é único, de uso único e
 * vinculado à conta liberada pelo admin — a validação real acontece no servidor. O
 * cliente lê o contrato completo (cláusulas) e aceita os termos configuráveis antes de assinar.
 *
 * Estilo em theme vars (padrão Gestão Funcional) — legível em todos os temas (herda o tema).
 */
export default function AvulsoContractPage() {
  const params = useParams();
  const token = (params.token as string) || "";

  const [screen, setScreen] = useState<Screen>("loading");
  const [product, setProduct] = useState<ResolvedProduct | null>(null);
  const [clauses, setClauses] = useState<{ heading: string; body: string }[]>([]);
  const [blockReason, setBlockReason] = useState<string>("invalid");
  const [accepted, setAccepted] = useState<string[]>([]);
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
        const res = await resolveAvulsoContractTokenAction(token, idToken);
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

  const canSign = allRequiredAccepted(AVULSO_TERMS, accepted);

  const handleSign = useCallback(async () => {
    if (!allRequiredAccepted(AVULSO_TERMS, accepted)) return;
    setScreen("processing");
    setError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Sessão expirada. Faça login novamente.");
      const result = await processAvulsoContractAction(token, idToken, accepted);
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
  }, [accepted, token]);

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative isolate overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[var(--accent-start)] rounded-full blur-[200px] opacity-[0.05] -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[var(--accent-end)] rounded-full blur-[200px] opacity-[0.05] -z-10" />

      <div className="max-w-[1440px] mx-auto pt-[10px] px-6 pb-16 md:px-12">
        <AnimatePresence mode="wait">
          {screen === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[70vh] flex flex-col items-center justify-center gap-6">
              <Loader2 size={40} className="animate-spin text-[var(--accent-start)]" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Validando seu contrato...</p>
            </motion.div>
          )}

          {screen === "logged_out" && (
            <motion.div key="logged_out" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-[70vh] flex items-center justify-center">
              <div className="max-w-md mx-auto text-center space-y-8 p-10 rounded-[3rem] bg-[var(--input-bg)] border border-[var(--border-primary)] shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-start)] flex items-center justify-center mx-auto">
                  <Lock size={28} />
                </div>
                <div className="space-y-3">
                  <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">Acesso ao contrato</h1>
                  <p className="text-sm text-[var(--text-muted)] font-medium leading-relaxed">
                    Este contrato foi liberado para uma conta específica. Entre com a conta indicada pela BPlen para visualizar e assinar.
                  </p>
                </div>
                <GoogleLoginButton />
              </div>
            </motion.div>
          )}

          {screen === "blocked" && (
            <motion.div key="blocked" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-[70vh] flex items-center justify-center">
              <div className="max-w-md mx-auto text-center space-y-8 p-10 rounded-[3rem] bg-[var(--input-bg)] border border-[var(--border-primary)] shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                  {blockReason === "wrong_account" ? <UserX size={28} /> : <AlertTriangle size={28} />}
                </div>
                <div className="space-y-3">
                  <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">{(BLOCK_MESSAGES[blockReason] || BLOCK_MESSAGES.invalid).title}</h1>
                  <p className="text-sm text-[var(--text-muted)] font-medium leading-relaxed">
                    {(BLOCK_MESSAGES[blockReason] || BLOCK_MESSAGES.invalid).hint}
                  </p>
                  {error ? <p className="text-[11px] text-red-500 font-bold">{error}</p> : null}
                </div>
                {blockReason === "wrong_account" ? (
                  <GoogleLoginButton />
                ) : (
                  <Link href="/hub" className="inline-block px-8 py-3 bg-[var(--accent-soft)] text-[var(--accent-start)] rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[var(--accent-start)] hover:text-white transition-all">
                    Ir para o HUB
                  </Link>
                )}
              </div>
            </motion.div>
          )}

          {screen === "summary" && product && (
            <motion.div key="summary" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-10 animate-fade-in">
              <FunctionalPageHeader
                eyebrow="Formalização de Serviço"
                title="Contrato"
                titleAccent="de Serviço"
                backHref="/hub"
                backLabel="Ir para o HUB"
                statusTag={{ label: "Pendente de Assinatura", tone: "warning" }}
              />

              <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="flex-1 space-y-6 text-left w-full">
                  <div className="p-8 rounded-[2.5rem] bg-[var(--input-bg)] border border-[var(--border-primary)] shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-[var(--accent-start)]/10 rounded-2xl text-[var(--accent-start)]">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Serviço Contratado</h4>
                        <p className="text-lg font-black text-[var(--text-primary)]">{product.title}</p>
                      </div>
                      {product.serviceCode ? (
                        <div className="ml-auto text-right">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-start)]">ID: {product.serviceCode}</p>
                        </div>
                      ) : null}
                    </div>

                    <div className="pt-6 border-t border-[var(--border-primary)]/40 space-y-3">
                      <div className="flex justify-between text-sm font-bold text-[var(--text-muted)]">
                        <span>Investimento</span>
                        <span>R$ {formatBRL(product.price)}</span>
                      </div>
                      <div className="flex justify-between text-xl font-black pt-2 text-[var(--accent-start)]">
                        <span>Total Formalizado</span>
                        <span>R$ {formatBRL(product.price)}</span>
                      </div>
                    </div>
                  </div>

                  <ContractDocumentView clauses={clauses} />

                  <div className="p-6 rounded-[2rem] bg-[var(--input-bg)] border border-[var(--border-primary)] space-y-4 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Termos Legais</p>
                    <ContractTermsCheckboxes terms={AVULSO_TERMS} value={accepted} onChange={setAccepted} />
                  </div>
                </div>

                <div className="w-full lg:w-[400px] lg:sticky lg:top-6">
                  <div className="p-8 rounded-[2.5rem] bg-[var(--input-bg)] border border-[var(--border-primary)] shadow-sm space-y-6 relative overflow-hidden">
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Assinatura Digital</h4>
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--bg-primary)]/50 border border-[var(--border-primary)]">
                        <ShieldCheck size={18} className="text-[var(--accent-start)]" />
                        <span className="text-xs font-bold text-[var(--text-primary)]">Validação (MP 2.200-2/2001)</span>
                      </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent-start)]/15 space-y-2">
                      <p className="text-[9px] text-[var(--text-muted)] font-bold leading-relaxed">
                        Ao confirmar, um PDF oficial do contrato será gerado com carimbo de tempo e IP em nossos servidores e disponibilizado na sua conta BPlen HUB.
                      </p>
                    </div>
                    {error ? <p className="text-[11px] text-red-500 font-bold">{error}</p> : null}
                    <button
                      onClick={handleSign}
                      disabled={!canSign}
                      className="w-full py-5 rounded-2xl bg-[var(--accent-start)] text-white font-black text-xs tracking-[0.2em] uppercase hover:scale-[1.01] shadow-lg transition-all flex items-center justify-center gap-3 group disabled:opacity-30 disabled:hover:scale-100"
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
            <motion.div key="processing" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-[var(--accent-start)] rounded-full blur-3xl opacity-20 animate-pulse" />
                <Loader2 size={120} className="text-[var(--accent-start)] animate-spin relative z-10 opacity-40" strokeWidth={1} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText size={40} className="text-[var(--text-primary)] animate-pulse" />
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-black tracking-tight uppercase italic text-[var(--text-primary)]">Gerando <span className="opacity-40">Documento</span></h2>
                <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Registrando contrato...</p>
              </div>
            </motion.div>
          )}

          {screen === "success" && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="min-h-[70vh] flex items-center justify-center">
              <div className="text-center space-y-10 max-w-xl mx-auto">
                <div className="w-28 h-28 bg-emerald-500/15 rounded-[2.5rem] flex items-center justify-center text-emerald-500 border border-emerald-500/20 mx-auto">
                  <CheckCircle2 size={56} />
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl font-black tracking-tight text-[var(--text-primary)]">Documento <span className="text-emerald-500">Assinado.</span></h2>
                  <p className="text-lg text-[var(--text-muted)] font-medium leading-relaxed">
                    Seu contrato já está registrado. O PDF já está disponível na sua conta da BPlen HUB.
                  </p>
                </div>
                <div className="flex flex-col gap-4">
                  {successUrl ? (
                    <a href={successUrl} target="_blank" rel="noopener noreferrer" className="w-full py-5 rounded-3xl bg-[var(--input-bg)] border border-[var(--border-primary)] text-[var(--text-primary)] font-black text-[10px] tracking-[0.3em] uppercase hover:bg-[var(--accent-soft)] transition-all">
                      Visualizar Documento
                    </a>
                  ) : null}
                  <Link href="/hub/membro/contratos" className="w-full py-5 rounded-3xl bg-[var(--accent-start)] text-white font-black text-xs tracking-[0.3em] uppercase hover:scale-[1.01] transition-all">
                    Ver Meus Contratos
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
