"use client";

import React, { useState } from "react";
import { applyCouponV2Action } from "@/actions/coupon-v2";
import { useAuthContext } from "@/context/AuthContext";
import { CouponTermsModal } from "./CouponTermsModal";
import { Tag, X, Check, Loader2 } from "lucide-react";

interface CouponInputProps {
  productSlug: string;
  onApply: (discount: number, code: string) => void;
  onRemove: () => void;
}

export function CouponInput({ productSlug, onApply, onRemove }: CouponInputProps) {
  const { user } = useAuthContext();
  const [code, setCode] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // States for V2 Modal validation flow
  const [modalOpen, setModalOpen] = useState(false);
  const [termsText, setTermsText] = useState("");
  const [expiresAfterDays, setExpiresAfterDays] = useState(7);

  const handleValidate = async (e: React.FormEvent | null, forceCpf?: string, forceAccept?: boolean) => {
    if (e) e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!user) throw new Error("Você precisa estar autenticado para aplicar cupons.");
      const token = await user.getIdToken();

      const result = await applyCouponV2Action({
        code: code.trim(),
        cpf: forceCpf || "00000000000", // CPF temporário para verificação inicial de lote/termos
        productSlug,
        idToken: token,
        acceptTerms: forceAccept || false,
      });

      if (result.valid) {
        setAppliedCode(code.trim().toUpperCase());
        setSuccess(true);
        onApply(result.discount, code.trim().toUpperCase());
        setModalOpen(false);
      } else if (result.termsRequired) {
        setTermsText(result.termsText || "");
        setExpiresAfterDays(result.expiresAfterDays || 7);
        setModalOpen(true);
      } else {
        setError(result.message || "Cupom inválido ou expirado.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido ao aplicar cupom.");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTerms = async (cpf: string) => {
    await handleValidate(null, cpf, true);
  };

  const handleRemove = () => {
    setAppliedCode(null);
    setCode("");
    setSuccess(false);
    onRemove();
  };

  return (
    <div className="space-y-3">
      {appliedCode ? (
        // Coupon Applied State
        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <div className="flex items-center gap-2">
            <Check size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Cupom {appliedCode} aplicado!</span>
          </div>
          <button
            onClick={handleRemove}
            className="text-emerald-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        // Coupon Input State
        <form onSubmit={(e) => handleValidate(e)} className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center text-[var(--text-muted)] pointer-events-none">
              <Tag size={16} />
            </div>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(null);
              }}
              placeholder="CUPOM DE DESCONTO"
              className="w-full pl-9 pr-3 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-[var(--input-bg)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-start)]"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="px-4 py-2 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-black uppercase tracking-wider hover:scale-[1.02] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center min-w-[70px]"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : "Validar"}
          </button>
        </form>
      )}

      {error && <p className="text-[10px] text-red-500 font-semibold">{error}</p>}
      {success && !appliedCode && <p className="text-[10px] text-emerald-500 font-semibold">Cupom validado com sucesso!</p>}

      {/* Terms and Conditions Acceptance Modal */}
      <CouponTermsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        termsText={termsText}
        expiresAfterDays={expiresAfterDays}
        onAccept={handleAcceptTerms}
      />
    </div>
  );
}
