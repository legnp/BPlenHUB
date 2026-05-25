"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
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
 * UpsellServiceModal — BPlen HUB 🧬
 * Modal premium para conversão de serviços bloqueados na jornada.
 * Design: Glassmorphism v3.1 / Apple Pro
 */
export function UpsellServiceModal({ isOpen, onClose, product, loading }: UpsellServiceModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (!isOpen && !loading) return null;

  const audienceMap: Record<string, string> = {
    'people': 'pessoas',
    'companies': 'empresas',
    'partners': 'parceiros'
  };

  const idAudience = product?.targetAudiences?.[0] || 'people';
  const audienceSlug = audienceMap[idAudience] || 'pessoas';
  const isOnboarding = product?.slug === 'onboarding';
  
  // Governança de Link: Onboarding (Privado) redireciona para a vitrine geral 🛍️
  const redirectUrl = isOnboarding 
    ? `/servicos/${audienceSlug}`
    : `/servicos/${audienceSlug}/${product?.slug}`;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6">
          {/* Backdrop Eéreo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-md cursor-pointer"
          />

          {/* Container do Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={cn(
              "relative w-full max-w-[480px] overflow-hidden z-10",
              "bg-[var(--bg-primary)]/80 backdrop-blur-2xl border border-[var(--border-primary)]",
              "rounded-[3.5rem] shadow-[0_48px_96px_-12px_rgba(0,0,0,0.5)]"
            )}
          >
            {/* Botão Fechar */}
            <button
              onClick={onClose}
              className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-all z-20"
            >
              <X size={18} />
            </button>

            {loading ? (
              <div className="p-20 flex flex-col items-center justify-center space-y-6">
                 <div className="w-12 h-12 border-2 border-[var(--accent-start)]/20 border-t-[var(--accent-start)] rounded-full animate-spin" />
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Sincronizando Vitrine...</p>
              </div>
            ) : product && (
              <div className="flex flex-col">
                {/* Imagem de Capa com Gradiente */}
                <div className="relative aspect-[16/10] w-full overflow-hidden">
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
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent" />
                  
                  {/* Kicker Persuasivo (Soberania do Usuário ✨) */}
                  <div className="absolute bottom-6 left-10">
                     <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-start)]/10 backdrop-blur-md border border-[var(--accent-start)]/20">
                        <Sparkles size={12} className="text-[var(--accent-start)] animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--accent-start)]">
                           Alavanque a sua carreira
                        </span>
                     </div>
                  </div>
                </div>

                {/* Conteúdo do Card */}
                <div className="p-10 pt-4 space-y-8">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-500/80">
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

                  {/* Benefícios (Resumo das Capacidades) */}
                  <ul className="space-y-3.5 pt-2">
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

                  {/* CTA de Acesso à Vitrine */}
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
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
