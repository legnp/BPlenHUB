"use client";

import React, { useState } from "react";
import GlassModal from "@/components/ui/GlassModal";
import { X, Lock, ChevronRight } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";

interface CouponTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  termsText: string;
  expiresAfterDays: number;
  onAccept: (cpf: string) => void;
}

/**
 * CouponTermsModal — BPlen HUB
 * Resgate de cupom (CPF + termos). Padronizado sobre o GlassModal canonico;
 * formulario como children.
 */
export function CouponTermsModal({
  isOpen,
  onClose,
  termsText,
  expiresAfterDays,
  onAccept,
}: CouponTermsModalProps) {
  const [cpf, setCpf] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { nickname } = useAuthContext();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCpf = cpf.replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      setError("O CPF deve conter exatamente 11 dígitos.");
      return;
    }
    setError(null);
    onAccept(cleanCpf);
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="relative flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors z-10"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-start)] flex items-center justify-center mb-6 border border-[var(--accent-start)]/20">
          <Lock size={24} />
        </div>

        {/* Title */}
        <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight mb-2 text-center">
          Resgate o seu cupom BPlen.
        </h3>

        {/* Subtitle */}
        <p className="text-sm text-[var(--text-secondary)] text-center mb-6 px-4">
          {nickname || "Membro"}, insira abaixo o seu CPF para resgate do cupom, e se atente aos Termos e Condições.
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          {/* CPF Field */}
          <div className="text-left">
            <label htmlFor="modalCpf" className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Cpf para Vinculação (Apenas Números)
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
              className="w-full px-4 py-3 rounded-xl bg-[var(--input-bg)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-start)]"
            />
            {error && <p className="text-xs text-red-500 mt-1 font-semibold">{error}</p>}
          </div>

          {/* Terms Scroll Area */}
          <div className="w-full text-left bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl p-4 max-h-40 overflow-y-auto text-[11px] text-[var(--text-secondary)] leading-relaxed space-y-3 custom-scrollbar">
            <div>
              <strong className="text-[var(--text-primary)]">Versão:</strong> V01.01 - Beta da plataforma BPlen HUB.
            </div>
            <div className="space-y-1.5">
              <p>1. O cupom é válido por <strong>{expiresAfterDays} dias</strong> a partir do momento do resgate.</p>
              <p>2. Cada cupom está atrelado ao CPF informado; mesmo que o cliente troque de e-mail ou matrícula, o cupom não poderá ser utilizado novamente.</p>
              <p>3. O cupom é intransferível e só pode ser usado no serviço especificado na sua campanha.</p>
              <p>4. Em caso de falha ou inconsistência, o cliente deverá reportar à BPlen para que a correção seja providenciada.</p>
              <p>5. O cupom não gera direito adquirido nem obrigação de fornecimento após novas versões da plataforma.</p>
              <p>6. O estoque de cupons é limitado; após o lote se esgotar não haverá reposição automática.</p>
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
              className="mt-0.5 h-4 w-4 rounded border-[var(--border-primary)] text-[var(--accent-start)] focus:ring-[var(--accent-start)]"
            />
            <label htmlFor="acceptCouponTerms" className="text-[11px] text-[var(--text-secondary)] select-none cursor-pointer hover:text-[var(--text-primary)] transition-colors">
              Declaro que li, compreendi e aceito integralmente os Termos e Condições para o resgate do cupom, concordando com o registro do aceite no meu Google Drive.
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!accepted || cpf.length !== 11}
            className="w-full py-4 rounded-xl bg-[var(--accent-start)] text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] shadow-[0_0_20px_rgba(255,0,128,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
          >
            Resgatar Cupom
            <ChevronRight size={16} />
          </button>
        </form>
      </div>
    </GlassModal>
  );
}
