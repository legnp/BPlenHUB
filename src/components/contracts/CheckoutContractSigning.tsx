"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  resolveCheckoutContractAction,
  signCheckoutContractAction,
  type CheckoutContractResolution,
} from "@/actions/checkout-contract";
import { ShieldCheck, FileText, CheckCircle2, Loader2, ArrowRight, Clock, Home, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { getErrorMessage } from "@/lib/utils/errors";
import { ContractDocumentView } from "@/components/contracts/ContractDocumentView";
import { ContractTermsCheckboxes, allRequiredAccepted, type ContractTerm } from "@/components/contracts/ContractTermsCheckboxes";
import { FunctionalPageHeader, type StatusTone } from "@/components/layout/FunctionalPageHeader";
import { PaymentStatus } from "@/components/checkout/PaymentStatus";

/**
 * Assinatura de contrato PÓS-CHECKOUT (CT-3b.2, ver CONTRACTS-DESIGN.md §10).
 *
 * Ilha cliente na tela `/hub/checkout/success`. IDÊNTICA para grátis e pago (o contrato é
 * o mesmo). Dona do cabeçalho + faixa de confirmação para que o STATUS reflita o estado
 * REAL (o serviço só é liberado com pagamento aprovado E contrato assinado — gate CT-3b.2):
 *  - `awaiting_payment`: pago pendente (aguarda MP; auto-poll);
 *  - `sign`: order aprovada, contrato NÃO assinado -> serviço ainda NÃO liberado;
 *  - `signed`: contrato assinado -> serviço liberado (idempotente). Só aqui aparecem os CTAs.
 *
 * Convite forte, não bloqueio: um link discreto permite assinar depois em Meus Contratos.
 * Estilo em theme vars (padrão Gestão Funcional) — legível em todos os temas.
 */

// Termos de aceite (configuráveis, obrigatórios + opcionais). Novos termos entram aqui.
const CHECKOUT_TERMS: ContractTerm[] = [
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

type Screen = "loading" | "unavailable" | "awaiting_payment" | "sign" | "processing" | "signed";

/** CTAs de navegação — só aparecem quando não há mais contrato pendente (assinado ou sem contrato). */
function NavCtas({ documentUrl }: { documentUrl?: string | null }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
      <Link
        href="/hub/membro?startTour=true"
        className="w-full sm:w-auto px-8 py-4 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-3"
      >
        <Home size={16} /> Ir para o Dashboard
      </Link>
      <Link
        href="/hub/journey?startTour=part2"
        className="w-full sm:w-auto px-8 py-4 bg-[var(--input-bg)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[var(--accent-soft)] transition-all flex items-center justify-center gap-3"
      >
        Ver Minha Jornada <ArrowRight size={16} />
      </Link>
      {documentUrl ? (
        <a
          href={documentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto px-8 py-4 bg-transparent border border-[var(--border-primary)] text-[var(--text-muted)] rounded-full text-[10px] font-black uppercase tracking-widest hover:text-[var(--text-primary)] transition-all flex items-center justify-center gap-3"
        >
          Ver Documento
        </a>
      ) : null}
    </div>
  );
}

export function CheckoutContractSigning({
  orderId,
  paymentId,
  isFree = false,
}: {
  orderId: string;
  paymentId?: string;
  isFree?: boolean;
}) {
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

  // Status-tag do cabeçalho reflete o ESTADO REAL — nada de "serviço liberado" antes da
  // assinatura. O serviço só é liberado quando o contrato é assinado (gate CT-3b.2).
  const statusTag:
    | { label: string; tone: StatusTone; icon?: React.ReactNode }
    | undefined =
    screen === "signed"
      ? { label: "Serviço Liberado", tone: "success", icon: <CheckCircle2 size={12} /> }
      : screen === "sign"
        ? { label: "Aguardando Assinatura", tone: "warning", icon: <FileText size={12} /> }
        : screen === "awaiting_payment"
          ? { label: "Aguardando Pagamento", tone: "warning", icon: <Clock size={12} /> }
          : undefined;

  return (
    <div className="space-y-10">
      <FunctionalPageHeader
        eyebrow={isFree ? "Ativação Concluída" : "Checkout Concluído"}
        title="Formalização"
        titleAccent="do Serviço"
        statusTag={statusTag}
      />

      {/* Faixa de confirmação — reflete o estado real (pagamento/ativação), sem afirmar que
          o serviço já está liberado antes da assinatura. */}
      {screen === "sign" ? (
        isFree ? (
          <div className="max-w-3xl mx-auto rounded-[2rem] bg-[var(--input-bg)] border border-[var(--border-primary)] p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-start)] flex items-center justify-center shrink-0">
              <Zap size={22} />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-black text-[var(--text-primary)]">Ativação gratuita registrada</p>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                O serviço será liberado na sua conta <b>após a assinatura</b> do contrato abaixo.
              </p>
            </div>
          </div>
        ) : paymentId ? (
          <PaymentStatus paymentId={paymentId} showActions={false} />
        ) : (
          <div className="max-w-3xl mx-auto rounded-[2rem] bg-[var(--input-bg)] border border-[var(--border-primary)] p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-start)] flex items-center justify-center shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-black text-[var(--text-primary)]">Pagamento confirmado</p>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                O serviço será liberado na sua conta <b>após a assinatura</b> do contrato abaixo.
              </p>
            </div>
          </div>
        )
      ) : screen === "awaiting_payment" && paymentId ? (
        <PaymentStatus paymentId={paymentId} showActions={false} />
      ) : null}

      <div className="max-w-3xl mx-auto text-left">
        <AnimatePresence mode="wait">
          {screen === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-10">
              <Loader2 size={32} className="animate-spin text-[var(--accent-start)]" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Carregando seu contrato...</p>
            </motion.div>
          )}

          {/* Sem contrato pendente (edge / sessão) — não deixa o membro preso: oferece navegação. */}
          {screen === "unavailable" && (
            <motion.div key="unavailable" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6">
              <NavCtas />
            </motion.div>
          )}

          {screen === "awaiting_payment" && (
            <motion.div key="awaiting" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-8 rounded-[2rem] bg-[var(--input-bg)] border border-[var(--border-primary)] text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-start)] flex items-center justify-center mx-auto">
                <Clock size={26} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black tracking-tight text-[var(--text-primary)]">Seu contrato está quase pronto</h3>
                <p className="text-xs text-[var(--text-muted)] font-medium leading-relaxed max-w-md mx-auto">
                  Assim que o pagamento for confirmado, o contrato de prestação de serviço aparecerá aqui para você ler e assinar.
                </p>
              </div>
              <button
                onClick={() => resolve()}
                className="text-[9px] font-black uppercase tracking-widest text-[var(--accent-start)] hover:underline"
              >
                Verificar novamente
              </button>
            </motion.div>
          )}

          {screen === "sign" && resolution?.product && (
            <motion.div key="sign" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} className="space-y-6">
              <div className="rounded-[2rem] bg-[var(--accent-soft)] border border-[var(--accent-start)]/15 p-6 flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-[var(--accent-start)]/10 text-[var(--accent-start)] flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-start)]">Falta assinar seu contrato</p>
                  <p className="text-sm font-bold text-[var(--text-primary)] leading-snug">
                    Formalize o serviço {resolution.product.title}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] font-medium">
                    Leia o contrato completo e confirme os termos para registrar sua assinatura com validade jurídica.
                  </p>
                </div>
              </div>

              <ContractDocumentView clauses={resolution.clauses ?? []} title={resolution.documentTitle} />

              <div className="p-6 rounded-[2rem] bg-[var(--input-bg)] border border-[var(--border-primary)] space-y-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Termos Legais</p>
                <ContractTermsCheckboxes terms={CHECKOUT_TERMS} value={accepted} onChange={setAccepted} />
              </div>

              <div className="p-4 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent-start)]/15 flex items-start gap-3">
                <ShieldCheck size={16} className="text-[var(--accent-start)] shrink-0 mt-0.5" />
                <p className="text-[9px] text-[var(--text-muted)] font-bold leading-relaxed">
                  Ao confirmar, um PDF oficial do contrato será gerado com carimbo de tempo e IP em nossos servidores e armazenado na sua pasta BPlen no Google Drive.
                </p>
              </div>

              {error ? <p className="text-[11px] text-red-500 font-bold text-center">{error}</p> : null}

              <button
                onClick={handleSign}
                disabled={!canSign}
                className="w-full py-5 rounded-2xl bg-[var(--accent-start)] text-white font-black text-xs tracking-[0.2em] uppercase hover:scale-[1.01] shadow-lg transition-all flex items-center justify-center gap-3 group disabled:opacity-30 disabled:hover:scale-100"
              >
                Assinar Contrato
                <ArrowRight size={18} className="group-hover:translate-x-1 duration-300" />
              </button>

              <p className="text-center text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                Prefere assinar depois?{" "}
                <Link href="/hub/membro/contratos" className="text-[var(--accent-start)] hover:underline">
                  Encontre este contrato em Meus Contratos.
                </Link>
              </p>
            </motion.div>
          )}

          {screen === "processing" && (
            <motion.div key="processing" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="text-center space-y-6 py-10">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-[var(--accent-start)] rounded-full blur-3xl opacity-20 animate-pulse" />
                <Loader2 size={80} className="text-[var(--accent-start)] animate-spin relative z-10 opacity-40" strokeWidth={1} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText size={28} className="text-[var(--text-primary)] animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black tracking-tight uppercase italic text-[var(--text-primary)]">Gerando <span className="opacity-40">Documento</span></h3>
                <p className="text-[var(--text-muted)] text-[9px] font-black uppercase tracking-[0.4em] animate-pulse">Registrando log de auditoria (IP + timestamp)...</p>
              </div>
            </motion.div>
          )}

          {screen === "signed" && (
            <motion.div key="signed" initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="text-center space-y-6 py-6">
              <div className="w-20 h-20 bg-emerald-500/15 rounded-[1.75rem] flex items-center justify-center text-emerald-500 border border-emerald-500/20 mx-auto">
                <CheckCircle2 size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">Contrato <span className="text-emerald-500">Assinado.</span></h3>
                <p className="text-sm text-[var(--text-muted)] font-medium leading-relaxed max-w-md mx-auto">
                  Sua formalização foi registrada com IP e carimbo de tempo, e o serviço foi liberado na sua conta. O PDF já está disponível na sua pasta BPlen no Google Drive.
                </p>
              </div>
              <NavCtas documentUrl={documentUrl} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
