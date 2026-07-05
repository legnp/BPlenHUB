"use client";

import React from "react";
import GlassModal from "@/components/ui/GlassModal";
import { X, ChevronRight, CheckCircle2, Sparkles } from "lucide-react";
import { Product } from "@/types/products";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface UpsellServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  loading?: boolean;
}

/**
 * UpsellServiceModal — BPlen HUB
 * Modal de conversao de servicos bloqueados na jornada. Padronizado sobre o
 * GlassModal canonico; conteudo (capa, beneficios, CTA) como children.
 */
export function UpsellServiceModal({ isOpen, onClose, product, loading }: UpsellServiceModalProps) {
  const audienceMap: Record<string, string> = {
    'people': 'pessoas',
    'companies': 'empresas',
    'partners': 'parceiros'
  };

  const idAudience = product?.targetAudiences?.[0] || 'people';
  const audienceSlug = audienceMap[idAudience] || 'pessoas';
  const isOnboarding = product?.slug === 'onboarding';

  // Governanca de Link: Onboarding (Privado) redireciona para a vitrine geral
  const redirectUrl = isOnboarding
    ? `/servicos/${audienceSlug}`
    : `/servicos/${audienceSlug}/${product?.slug}`;

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-[480px]">
      <div className="relative">
        {/* Botao Fechar */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-[var(--input-bg)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all z-20"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-6">
            <div className="w-12 h-12 border-2 border-[var(--accent-start)]/20 border-t-[var(--accent-start)] rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Sincronizando Vitrine...</p>
          </div>
        ) : product ? (
          <div className="flex flex-col space-y-8">
            {/* Imagem de Capa (bloco com moldura) */}
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[1.75rem] border border-[var(--border-primary)]">
              {product.sheet.coverImage ? (
                <img
                  src={product.sheet.coverImage}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center">
                  <Sparkles size={48} className="text-white/10" />
                </div>
              )}
              {/* Kicker Persuasivo */}
              <div className="absolute bottom-4 left-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-start)]/10 backdrop-blur-md border border-[var(--accent-start)]/20">
                  <Sparkles size={12} className="text-[var(--accent-start)] animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-[var(--accent-start)]">
                    Alavanque a sua carreira
                  </span>
                </div>
              </div>
            </div>

            {/* Conteudo */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent-start)]">
                {isOnboarding ? "Conteúdo Exclusivo para Membros BPlen" : "Você ainda não contratou esse serviço"}
              </p>
              <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight italic">
                {product.title}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)] font-medium line-clamp-4">
                {isOnboarding
                  ? "É aqui é onde a sua carreira profissional ganha potência! Para acessar e liberar todo o ecossistema HUB, torne-se um Membro BPlen."
                  : product.sheet.description}
              </p>
            </div>

            {/* Beneficios */}
            <ul className="space-y-3.5">
              {product.capabilities.surveys.slice(0, 2).map((sId, index) => (
                <li key={index} className="flex items-start gap-3 group">
                  <div className="mt-0.5 w-5 h-5 rounded-lg bg-[var(--accent-start)]/5 flex items-center justify-center text-[var(--accent-start)] shrink-0">
                    <CheckCircle2 size={12} />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-tight text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
                    {sId.split('_').join(' ')}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link
              href={redirectUrl}
              className={cn(
                "group/btn w-full py-5 rounded-[2rem] bg-[var(--accent-start)] flex items-center justify-center gap-3",
                "text-white font-black text-[11px] uppercase tracking-[0.25em]",
                "shadow-[0_20px_40px_-12px_rgba(236,72,153,0.4)] hover:shadow-[0_24px_48px_-12px_rgba(236,72,153,0.6)]",
                "hover:scale-[1.02] active:scale-[0.98] transition-all duration-500"
              )}
            >
              {isOnboarding ? "Ver serviços BPlen" : "Ver mais detalhes"}
              <ChevronRight size={16} className="group-hover/btn:translate-x-1.5 transition-transform duration-500" />
            </Link>

            <p className="text-center text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-40">
              Acesso exclusivo para membros BPlen
            </p>
          </div>
        ) : null}
      </div>
    </GlassModal>
  );
}
