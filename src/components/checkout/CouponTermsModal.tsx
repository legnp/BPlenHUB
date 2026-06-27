"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, ChevronRight } from "lucide-react";

interface CouponTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  termsText: string;
  expiresAfterDays: number;
  onAccept: (cpf: string) => void;
}

export function CouponTermsModal({
  isOpen,
  onClose,
  termsText,
  expiresAfterDays,
  onAccept,
}: CouponTermsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [cpf, setCpf] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.classList.add("glass-modal-open");
    } else {
      document.body.classList.remove("glass-modal-open");
    }
    return () => document.body.classList.remove("glass-modal-open");
  }, [isOpen]);

  if (!mounted) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCpf = cpf.replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      setError("O CPF deve conter exatamente 11 digitos.");
      return;
    }
    setError(null);
    onAccept(cleanCpf);
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-hidden isolate">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-xl transition-all duration-500 ease-in-out"
          />

          {/* Card Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[2.5rem] p-8 sm:p-10 shadow-2xl flex flex-col justify-between overflow-hidden"
          >
            {/* Background Light Orb */}
            <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-[#ff0080]/10 blur-[80px] rounded-full pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors z-10"
            >
              <X size={20} />
            </button>

            <div className="relative z-10 flex flex-col items-center">
              {/* Header Icon */}
              <div className="w-14 h-14 rounded-2xl bg-[#ff0080]/10 text-[#ff0080] flex items-center justify-center mb-6 border border-[#ff0080]/20">
                <Lock size={24} />
              </div>

              {/* Title */}
              <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight mb-4 text-center">
                Sua Jornada de Membro ainda não começou.
              </h3>

              <form onSubmit={handleSubmit} className="w-full space-y-5">
                {/* CPF Field */}
                <div className="text-left">
                  <label htmlFor="modalCpf" className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    CPF para vinculacao (apenas numeros)
                  </label>
                  <input
                    id="modalCpf"
                    type="text"
                    required
                    maxLength={11}
                    value={cpf}
                    onChange={(e) => {
                      setCpf(e.target.value.replace(/\D/g, ""));
                      setError(null);
                    }}
                    placeholder="Ex.: 12345678901"
                    className="w-full px-4 py-3 rounded-xl bg-[var(--input-bg)]/50 text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-[#ff0080]"
                  />
                  {error && <p className="text-xs text-red-500 mt-1 font-semibold">{error}</p>}
                </div>

                {/* Terms Scroll Area */}
                <div className="w-full text-left bg-[var(--input-bg)]/40 border border-[var(--border-primary)] rounded-2xl p-4 max-h-40 overflow-y-auto text-[11px] text-[var(--text-secondary)] leading-relaxed space-y-3 custom-scrollbar">
                  <div>
                    <strong className="text-[var(--text-primary)]">Versao:</strong> V01.01 – Beta da plataforma BPlen HUB.
                  </div>
                  <div className="space-y-1.5">
                    <p>1. O cupom e valido por <strong>{expiresAfterDays} dias</strong> a partir do momento do resgate.</p>
                    <p>2. Cada cupom esta atrelado ao CPF informado; mesmo que o usuario troque de e‑mail ou matricula, o cupom nao podera ser utilizado novamente.</p>
                    <p>3. O cupom e intransferivel e so pode ser usado no servico especificado na sua campanha.</p>
                    <p>4. Em caso de falha ou inconsistencia, o usuario devera reportar a BPlen para que a correcao seja providenciada.</p>
                    <p>5. O cupom nao gera direito adquirido nem obrigacao de fornecimento apos novas versoes da plataforma.</p>
                    <p>6. O estoque de cupons e limitado; apos o lote se esgotar nao havera reposicao automatica.</p>
                  </div>
                  <div className="border-t border-[var(--border-primary)] pt-2 text-[10px] text-[var(--text-muted)]">
                    {termsText}
                  </div>
                </div>

                {/* Checkbox */}
                <div className="w-full flex items-start gap-3 text-left">
                  <input
                    id="acceptCouponTerms"
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[var(--border-primary)] text-[#ff0080] focus:ring-[#ff0080]"
                  />
                  <label htmlFor="acceptCouponTerms" className="text-[11px] text-[var(--text-secondary)] select-none cursor-pointer hover:text-white transition-colors">
                    Declaro que li, compreendi e aceito integralmente os Termos e Condicoes para o resgate do cupom, concordando com o registro do aceite no meu Google Drive.
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!accepted || cpf.length !== 11}
                  className="w-full py-4 rounded-xl bg-[#ff0080] text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] shadow-[0_0_20px_rgba(255,0,128,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
                >
                  Resgatar Cupom
                  <ChevronRight size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
